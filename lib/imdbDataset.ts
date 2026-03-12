import { ensureDbInitialized, getDb } from './db';

type TableAvailability = {
  checkedAt: number;
  hasRatings: boolean;
};

type ImdbDatasetRating = {
  rating: number;
  votes: number;
};

const TABLE_CHECK_TTL_MS = 60 * 1000;
let tableAvailability: TableAvailability = {
  checkedAt: 0,
  hasRatings: false,
};

const isImdbId = (value?: string | null) => {
  if (!value) return false;
  return /^tt\d+$/.test(value.trim());
};

const refreshTableAvailability = () => {
  const now = Date.now();
  if (now - tableAvailability.checkedAt < TABLE_CHECK_TTL_MS) return;
  ensureDbInitialized();
  const db = getDb();
  const hasRatings = Boolean(
    db
      .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='imdb_ratings'")
      .get()
  );
  tableAvailability = {
    checkedAt: now,
    hasRatings,
  };
};

export const getImdbRatingFromDataset = (imdbId: string): ImdbDatasetRating | null => {
  const normalized = String(imdbId || '').trim();
  if (!isImdbId(normalized)) return null;

  refreshTableAvailability();
  if (!tableAvailability.hasRatings) return null;

  ensureDbInitialized();
  const db = getDb();
  try {
    const row = db
      .prepare('SELECT average_rating as averageRating, num_votes as numVotes FROM imdb_ratings WHERE tconst = ?')
      .get(normalized) as { averageRating?: number; numVotes?: number } | undefined;
    if (!row) return null;
    const rating = Number(row.averageRating);
    const votes = Number(row.numVotes);
    if (!Number.isFinite(rating) || !Number.isFinite(votes)) return null;
    return { rating, votes };
  } catch {
    return null;
  }
};
