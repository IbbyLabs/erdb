import Database from 'better-sqlite3';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';

const DATA_DIR = join(process.cwd(), 'data');
const DB_PATH = join(DATA_DIR, 'erdb.db');

const SCHEMA_SQL = `
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
`;

type GlobalDbState = typeof globalThis & {
  __erdbSqlite?: Database.Database;
  __erdbSqliteInit?: boolean;
};

const getGlobalDbState = () => globalThis as GlobalDbState;

const openDatabase = () => {
  mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
};

export const getDb = () => {
  const globalState = getGlobalDbState();
  if (!globalState.__erdbSqlite) {
    globalState.__erdbSqlite = openDatabase();
  }
  return globalState.__erdbSqlite;
};

export const ensureDbInitialized = () => {
  const globalState = getGlobalDbState();
  if (!globalState.__erdbSqliteInit) {
    const db = getDb();
    db.exec(SCHEMA_SQL);
    globalState.__erdbSqliteInit = true;
  }
};

export const dbQuery = async <T = any>(text: string, values: any[] = []) => {
  ensureDbInitialized();
  const db = getDb();
  // Support both pg-style $1 and sqlite-style ?
  const stmt = db.prepare(text.replace(/\$(\d+)/g, '?'));
  if (text.trim().toUpperCase().startsWith('SELECT')) {
    const rows = stmt.all(...values) as T[];
    return { rows };
  } else {
    const info = stmt.run(...values);
    return { rows: [] as T[], info };
  }
};

export type DbTransactionClient = {
  query: <T = any>(text: string, values?: any[]) => Promise<{ rows: T[] }>;
};

export const dbTransaction = async <T>(handler: (client: DbTransactionClient) => Promise<T>) => {
  ensureDbInitialized();
  const db = getDb();

  const client: DbTransactionClient = {
    query: async (text, values) => dbQuery(text, values),
  };

  await dbQuery('BEGIN');
  try {
    const result = await handler(client);
    await dbQuery('COMMIT');
    return result;
  } catch (error) {
    await dbQuery('ROLLBACK');
    throw error;
  }
};
