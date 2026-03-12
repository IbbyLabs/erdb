import { createReadStream, createWriteStream, existsSync, mkdirSync, renameSync, statSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import { ensureDbInitialized, getDb } from './db';
import { getMetadata, setMetadata } from './metadataCache';

type DatasetPaths = {
  ratingsPath: string;
};

type DatasetUrls = {
  ratingsUrl: string;
};

const parseBool = (value: string | undefined, fallback: boolean) => {
  if (value === undefined || value === null) return fallback;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return fallback;
  return ['1', 'true', 'yes', 'y', 'on'].includes(normalized);
};

const parseMs = (value: string | undefined, fallbackMs: number, minMs: number, maxMs: number) => {
  if (!value) return fallbackMs;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallbackMs;
  return Math.min(maxMs, Math.max(minMs, parsed));
};

const AUTO_DOWNLOAD = parseBool(process.env.ERDB_IMDB_DATASET_AUTO_DOWNLOAD, true);
const AUTO_IMPORT = parseBool(process.env.ERDB_IMDB_DATASET_AUTO_IMPORT, true);
const REFRESH_MS = parseMs(
  process.env.ERDB_IMDB_DATASET_REFRESH_MS,
  3 * 24 * 60 * 60 * 1000,
  60 * 60 * 1000,
  365 * 24 * 60 * 60 * 1000
);
const CHECK_INTERVAL_MS = parseMs(
  process.env.ERDB_IMDB_DATASET_CHECK_INTERVAL_MS,
  15 * 60 * 1000,
  60 * 1000,
  24 * 60 * 60 * 1000
);
const LOG_ENABLED = parseBool(process.env.ERDB_IMDB_DATASET_LOG, false);
const IMPORT_MARKER_TTL_MS = 10 * 365 * 24 * 60 * 60 * 1000;

const DATASET_BASE_URL = (process.env.ERDB_IMDB_DATASET_BASE_URL || 'https://datasets.imdbws.com').replace(/\/+$/, '');
const RATINGS_URL = process.env.ERDB_IMDB_RATINGS_DATASET_URL || `${DATASET_BASE_URL}/title.ratings.tsv.gz`;

const resolveDatasetPaths = (): DatasetPaths => {
  const ratingsPath =
    process.env.ERDB_IMDB_RATINGS_DATASET_PATH ||
    process.env.IMDB_RATINGS_DATASET_PATH ||
    join(process.cwd(), 'data', 'imdb', 'title.ratings.tsv.gz');
  return { ratingsPath };
};

const resolveDatasetUrls = (): DatasetUrls => ({
  ratingsUrl: RATINGS_URL,
});

const getFileMtimeMs = (filePath: string) => {
  try {
    const stat = statSync(filePath);
    return stat.mtimeMs || stat.mtime.getTime();
  } catch {
    return 0;
  }
};

const shouldDownloadFile = (filePath: string) => {
  try {
    const stat = statSync(filePath);
    if (!stat.isFile() || stat.size === 0) return true;
    return Date.now() - stat.mtimeMs > REFRESH_MS;
  } catch {
    return true;
  }
};

const downloadToFile = async (url: string, destination: string) => {
  mkdirSync(dirname(destination), { recursive: true });
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`IMDb dataset download failed (${response.status}) for ${url}`);
  }

  const tmpPath = `${destination}.tmp`;
  const nodeStream = Readable.fromWeb(response.body as any);
  try {
    await pipeline(nodeStream, createWriteStream(tmpPath));
    renameSync(tmpPath, destination);
  } catch (error) {
    try {
      if (existsSync(tmpPath)) unlinkSync(tmpPath);
    } catch {
      // Ignore tmp cleanup failures.
    }
    throw error;
  }
};

const getImportMarker = (key: string) => {
  const value = getMetadata<string>(key);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const setImportMarker = (key: string, value: number) => {
  setMetadata(key, String(value), IMPORT_MARKER_TTL_MS);
};

const tableHasRows = (table: string) => {
  ensureDbInitialized();
  const db = getDb();
  try {
    const row = db.prepare(`SELECT 1 FROM ${table} LIMIT 1`).get() as { '1'?: number } | undefined;
    return Boolean(row);
  } catch {
    return false;
  }
};

const shouldImportDataset = (table: string, markerKey: string, filePath: string) => {
  if (!existsSync(filePath)) return false;
  const hasRows = tableHasRows(table);
  const fileMtime = getFileMtimeMs(filePath);
  const marker = getImportMarker(markerKey);

  if (!hasRows) return true;
  if (!marker) {
    if (fileMtime > 0) {
      setImportMarker(markerKey, fileMtime);
    }
    return false;
  }
  return fileMtime > marker;
};

const openDatasetStream = (filePath: string) => {
  const stream = createReadStream(filePath);
  return filePath.endsWith('.gz') ? stream.pipe(createGunzip()) : stream;
};

const importRatings = async (filePath: string, batchSize: number, progressEvery: number) => {
  ensureDbInitialized();
  const db = getDb();
  const insertStmt = db.prepare(
    'INSERT OR REPLACE INTO imdb_ratings (tconst, average_rating, num_votes) VALUES (?, ?, ?)'
  );
  const insertBatch = db.transaction((rows: Array<[string, number, number]>) => {
    for (const row of rows) {
      insertStmt.run(row[0], row[1], row[2]);
    }
  });

  const rl = createInterface({ input: openDatasetStream(filePath), crlfDelay: Infinity });
  let batch: Array<[string, number, number]> = [];
  let total = 0;

  for await (const line of rl) {
    if (!line || line.startsWith('tconst\t')) continue;
    const [tconst, ratingRaw, votesRaw] = line.split('\t');
    if (!tconst || ratingRaw === '\\N' || votesRaw === '\\N') continue;
    const rating = Number(ratingRaw);
    const votes = Number(votesRaw);
    if (!Number.isFinite(rating) || !Number.isFinite(votes)) continue;
    batch.push([tconst, rating, votes]);
    if (batch.length >= batchSize) {
      insertBatch(batch);
      total += batch.length;
      batch = [];
      if (progressEvery > 0 && LOG_ENABLED && total % progressEvery === 0) {
        console.log(`IMDb ratings imported: ${total.toLocaleString('en-US')}`);
      }
    }
  }

  if (batch.length) {
    insertBatch(batch);
    total += batch.length;
  }
};

let syncInFlight: Promise<void> | null = null;
let lastCheckAt = 0;

export const scheduleImdbDatasetSync = () => {
  if (!AUTO_DOWNLOAD && !AUTO_IMPORT) return;
  const now = Date.now();
  if (syncInFlight) return;
  if (now - lastCheckAt < CHECK_INTERVAL_MS) return;
  lastCheckAt = now;
  syncInFlight = runImdbDatasetSync().catch(() => {}).finally(() => {
    syncInFlight = null;
  });
};

const runImdbDatasetSync = async () => {
  const paths = resolveDatasetPaths();
  const urls = resolveDatasetUrls();

  const ratingsNeedsDownload = AUTO_DOWNLOAD && shouldDownloadFile(paths.ratingsPath);

  if (ratingsNeedsDownload) {
    await downloadToFile(urls.ratingsUrl, paths.ratingsPath);
  }

  if (!AUTO_IMPORT) return;

  const ratingsMarker = 'imdb:dataset:imported:ratings';
  const importBatchSize = Math.max(1000, Number(process.env.ERDB_IMDB_DATASET_IMPORT_BATCH || 5000));
  const importProgress = Math.max(0, Number(process.env.ERDB_IMDB_DATASET_IMPORT_PROGRESS || 0));

  const shouldImportRatings = shouldImportDataset('imdb_ratings', ratingsMarker, paths.ratingsPath);

  if (shouldImportRatings && existsSync(paths.ratingsPath)) {
    await importRatings(paths.ratingsPath, importBatchSize, importProgress);
    setImportMarker(ratingsMarker, getFileMtimeMs(paths.ratingsPath) || Date.now());
  }
};
