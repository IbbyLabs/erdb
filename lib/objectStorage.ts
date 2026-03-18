import { join } from 'node:path';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';

const DATA_DIR = join(process.cwd(), 'data');
const CACHE_DIR = join(DATA_DIR, 'cache', 'images');

type ObjectStorageResult = {
  body: ArrayBuffer;
  contentType: string;
  cacheControl: string;
};

mkdirSync(CACHE_DIR, { recursive: true });

const getFilePath = (key: string) => join(CACHE_DIR, key.replace(/\//g, '_'));

export const isObjectStorageConfigured = () => true;

export const buildObjectStorageImageKey = (cacheHash: string, ext = 'png') => `final/${cacheHash}.${ext}`;
export const buildObjectStorageSourceImageKey = (id: string, variant: string) => `source/${id.replace(/[^a-zA-Z0-9]/g, '_')}_${variant}.png`;

export const getCachedImageFromObjectStorage = async (key: string): Promise<ObjectStorageResult | null> => {
  const filePath = getFilePath(key);
  const metadataPath = `${filePath}.json`;

  if (!existsSync(filePath) || !existsSync(metadataPath)) {
    return null;
  }

  try {
    const body = readFileSync(filePath);
    const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));

    return {
      body: body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
      contentType: metadata.contentType || 'image/png',
      cacheControl: metadata.cacheControl || 'public, max-age=300',
    };
  } catch (error) {
    console.error(`Error reading cached image ${key}:`, error);
    return null;
  }
};

export const putCachedImageToObjectStorage = async (
  key: string,
  payload: { body: ArrayBuffer; contentType: string; cacheControl: string }
) => {
  const filePath = getFilePath(key);
  const metadataPath = `${filePath}.json`;

  try {
    const dir = join(filePath, '..');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(filePath, Buffer.from(payload.body));
    writeFileSync(
      metadataPath,
      JSON.stringify({
        contentType: payload.contentType,
        cacheControl: payload.cacheControl,
      }),
      'utf8'
    );
  } catch (error) {
    console.error(`Error writing cached image ${key}:`, error);
  }

  if (Math.random() < 0.02) {
    pruneOldestImageCache(5000);
  }
};

let imagePruningInFlight = false;

const pruneOldestImageCache = async (maxFiles: number) => {
  if (imagePruningInFlight) return;
  imagePruningInFlight = true;
  try {
    const { readdirSync, statSync, unlinkSync } = await import('node:fs');
    if (!existsSync(CACHE_DIR)) return;

    const entries = readdirSync(CACHE_DIR, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile() && !e.name.endsWith('.json'))
      .map((e) => {
        const p = join(CACHE_DIR, e.name);
        try {
          return { name: e.name, path: p, mtimeMs: statSync(p).mtimeMs };
        } catch {
          return null;
        }
      })
      .filter((f): f is { name: string; path: string; mtimeMs: number } => Boolean(f));

    if (files.length <= maxFiles) return;

    files.sort((a, b) => a.mtimeMs - b.mtimeMs);
    const toDelete = files.slice(0, files.length - maxFiles);

    for (const f of toDelete) {
      try {
        unlinkSync(f.path);
        const metaPath = `${f.path}.json`;
        if (existsSync(metaPath)) unlinkSync(metaPath);
      } catch {
        // ignore deletion errors
      }
    }
  } catch (error) {
    console.error('Error during image cache pruning:', error);
  } finally {
    imagePruningInFlight = false;
  }
};
