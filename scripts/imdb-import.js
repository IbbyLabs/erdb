#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const zlib = require('node:zlib');
const Database = require('better-sqlite3');

const parseArgs = (argv) => {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--ratings') {
      args.ratings = argv[++i];
    } else if (arg === '--db') {
      args.db = argv[++i];
    } else if (arg === '--batch') {
      args.batch = argv[++i];
    } else if (arg === '--progress') {
      args.progress = argv[++i];
    } else if (arg === '--truncate') {
      args.truncate = true;
    } else if (arg === '--skip-ratings') {
      args.skipRatings = true;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    }
  }
  return args;
};

const printUsage = () => {
  console.log('IMDb dataset import');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/imdb-import.js --ratings <path> [options]');
  console.log('');
  console.log('Options:');
  console.log('  --db <path>           SQLite DB path (default: ./data/erdb.db)');
  console.log('  --batch <n>           Batch size (default: 5000)');
  console.log('  --progress <n>        Progress interval in rows (default: 500000)');
  console.log('  --truncate            Clear existing imdb tables before import');
  console.log('  --skip-ratings         Skip ratings import');
};

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printUsage();
  process.exit(0);
}

const cwd = process.cwd();
const ratingsPath =
  args.ratings ||
  process.env.ERDB_IMDB_RATINGS_DATASET_PATH ||
  path.join(cwd, 'data', 'imdb', 'title.ratings.tsv.gz');
const dbPath = args.db || path.join(cwd, 'data', 'erdb.db');
const batchSize = Number(args.batch || 5000);
const progressEvery = Number(args.progress || 500000);

const ensureFileExists = (filePath, label) => {
  if (!fs.existsSync(filePath)) {
    console.error(`${label} not found: ${filePath}`);
    process.exit(1);
  }
};

if (!args.skipRatings) {
  ensureFileExists(ratingsPath, 'Ratings dataset');
}

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS metadata_cache (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  last_accessed_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS metadata_cache_expires_idx ON metadata_cache (expires_at);

CREATE TABLE IF NOT EXISTS imdb_ratings (
  tconst TEXT PRIMARY KEY,
  average_rating REAL NOT NULL,
  num_votes INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS imdb_ratings_votes_idx ON imdb_ratings (num_votes);
`);

const IMPORT_MARKER_TTL_MS = 10 * 365 * 24 * 60 * 60 * 1000;
const setImportMarker = (key, value) => {
  const now = Date.now();
  const expiresAt = now + IMPORT_MARKER_TTL_MS;
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  db.prepare(`
    INSERT OR REPLACE INTO metadata_cache (key, value, expires_at, last_accessed_at)
    VALUES (?, ?, ?, ?)
  `).run(key, stringValue, expiresAt, now);
};

if (args.truncate) {
  console.log('Truncating imdb tables...');
  db.exec('DELETE FROM imdb_ratings;');
}

const openDatasetStream = (filePath) => {
  const stream = fs.createReadStream(filePath);
  return filePath.endsWith('.gz') ? stream.pipe(zlib.createGunzip()) : stream;
};

const importRatings = async () => {
  console.log(`Importing ratings from: ${ratingsPath}`);
  const insertStmt = db.prepare(
    'INSERT OR REPLACE INTO imdb_ratings (tconst, average_rating, num_votes) VALUES (?, ?, ?)'
  );
  const insertBatch = db.transaction((rows) => {
    for (const row of rows) {
      insertStmt.run(row[0], row[1], row[2]);
    }
  });

  const rl = readline.createInterface({
    input: openDatasetStream(ratingsPath),
    crlfDelay: Infinity,
  });

  let batch = [];
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
      if (total % progressEvery === 0) {
        console.log(`Ratings imported: ${total.toLocaleString('en-US')}`);
      }
    }
  }
  if (batch.length) {
    insertBatch(batch);
    total += batch.length;
  }
  console.log(`Ratings imported: ${total.toLocaleString('en-US')}`);
  setImportMarker('imdb:dataset:imported:ratings', Date.now());
};

const run = async () => {
  if (!args.skipRatings) {
    await importRatings();
  }
  console.log('IMDb import completed.');
};

run().catch((error) => {
  console.error('IMDb import failed.');
  console.error(error);
  process.exit(1);
});
