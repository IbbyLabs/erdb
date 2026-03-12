import { getDb, ensureDbInitialized } from './db';

export const getMetadata = <T = any>(key: string): T | null => {
    ensureDbInitialized();
    const db = getDb();
    const now = Date.now();

    const row = db.prepare('SELECT value, expires_at FROM metadata_cache WHERE key = ?').get(key) as any;

    if (!row) return null;

    if (row.expires_at <= now) {
        db.prepare('DELETE FROM metadata_cache WHERE key = ?').run(key);
        return null;
    }

    db.prepare('UPDATE metadata_cache SET last_accessed_at = ? WHERE key = ?').run(now, key);

    try {
        return JSON.parse(row.value);
    } catch {
        return row.value as unknown as T;
    }
};

export const setMetadata = (key: string, value: any, ttlMs: number) => {
    ensureDbInitialized();
    const db = getDb();
    const now = Date.now();
    const expiresAt = now + ttlMs;

    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    db.prepare(`
    INSERT OR REPLACE INTO metadata_cache (key, value, expires_at, last_accessed_at)
    VALUES (?, ?, ?, ?)
  `).run(key, stringValue, expiresAt, now);

    // Optional: minor pruning during set to keep DB clean
    if (Math.random() < 0.05) { // 5% chance to prune expired on set
        pruneExpiredMetadata();
    }
};

export const pruneExpiredMetadata = () => {
    ensureDbInitialized();
    const db = getDb();
    const now = Date.now();
    db.prepare('DELETE FROM metadata_cache WHERE expires_at <= ?').run(now);
};

export const pruneOldestMetadata = (maxEntries: number) => {
    ensureDbInitialized();
    const db = getDb();
    const currentCount = (db.prepare('SELECT COUNT(*) as count FROM metadata_cache').get() as any).count;

    if (currentCount > maxEntries) {
        const overflow = currentCount - maxEntries;
        db.prepare(`
      DELETE FROM metadata_cache 
      WHERE key IN (
        SELECT key FROM metadata_cache 
        ORDER BY last_accessed_at ASC 
        LIMIT ?
      )
    `).run(overflow);
    }
};
