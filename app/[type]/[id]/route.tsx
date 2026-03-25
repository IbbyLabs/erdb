import { NextRequest } from 'next/server';
import { ProxyAgent, fetch as undiciFetch } from 'undici';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import {
  ALL_RATING_PREFERENCES,
  RATING_PROVIDER_OPTIONS,
  normalizeRatingPreference,
  orderRatingPreferencesForRender,
  parseRatingPreferencesAllowEmpty,
  selectAvailableRatingPreferences,
  type RatingPreference,
} from '@/lib/ratingPreferences';
import {
  DEFAULT_BACKDROP_RATING_LAYOUT,
  normalizeBackdropRatingLayout,
  type BackdropRatingLayout,
} from '@/lib/backdropRatingLayout';
import {
  DEFAULT_POSTER_RATINGS_MAX_PER_SIDE,
  DEFAULT_POSTER_RATING_LAYOUT,
  POSTER_RATINGS_MAX_PER_SIDE_MIN,
  getPosterRatingLayoutMaxBadges,
  normalizePosterRatingLayout,
  normalizePosterRatingsMaxPerSide,
  type PosterRatingLayout,
} from '@/lib/posterRatingLayout';
import {
  DEFAULT_QUALITY_BADGES_STYLE,
  DEFAULT_RATING_STYLE,
  normalizeQualityBadgeStyle,
  normalizeRatingStyle,
  type QualityBadgeStyle,
  type RatingStyle,
} from '@/lib/ratingStyle';
import {
  DEFAULT_AGGREGATE_RATING_SOURCE,
  DEFAULT_RATING_PRESENTATION,
  getAggregateRatingSourceLabel,
  getAggregateRatingSourceShortLabel,
  hasAggregateRatingProvidersForSource,
  normalizeAggregateRatingSource,
  normalizeRatingPresentation,
  resolveEffectiveRatingPresentation,
  resolveBackdropRatingLayoutForPresentation,
  resolveLogoRatingsMaxForPresentation,
  resolvePosterRatingLayoutForPresentation,
  resolvePosterRatingsMaxPerSideForPresentation,
  selectAggregateRatingProviders,
  type AggregateRatingSource,
  type RatingPresentation,
} from '@/lib/ratingPresentation';
import {
  DEFAULT_SIDE_RATING_OFFSET,
  DEFAULT_SIDE_RATING_POSITION,
  normalizeSideRatingOffset,
  normalizeSideRatingPosition,
  resolveSideRatingOffsetFraction,
  type SideRatingPosition,
} from '@/lib/sideRatingPosition';
import { getImdbRatingFromDataset } from '@/lib/imdbDataset';
import { scheduleImdbDatasetSync } from '@/lib/imdbDatasetSync';
import { resolveReverseMappedAnimeImageTarget } from '@/lib/animeReverseMapping';
import { normalizeAnimeMappingSeason } from '@/lib/animeMapping';
import {
  buildObjectStorageImageKey,
  buildObjectStorageSourceImageKey,
  getCachedImageFromObjectStorage,
  isObjectStorageConfigured,
  putCachedImageToObjectStorage,
} from '@/lib/objectStorage';
import { getMetadata, setMetadata } from '@/lib/metadataCache';
import {
  formatDisplayRatingValue,
  formatRatingNumber,
  normalizeRatingToTenPointValue,
  normalizeRatingValueMode,
  parseNumericRatingValue,
  DEFAULT_RATING_VALUE_MODE,
  type RatingValueMode,
} from '@/lib/ratingDisplay';
import {
  DEFAULT_GENRE_BADGE_MODE,
  normalizeGenreBadgeMode,
  resolveGenreBadgeFamily,
  type GenreBadgeFamilyId,
  type GenreBadgeMode,
} from '@/lib/genreBadge';
import {
  MEDIA_FEATURE_BADGE_ORDER,
  buildCertificationBadgeMeta,
  buildMediaFeatureBadgesFromFlags,
  collectMediaFeatureFlags,
  isMediaFeatureBadgeKey,
  normalizeUserFacingMediaBadgeLabel,
  resolveMovieCertificationBadge,
  resolveTvCertificationBadge,
  type MediaFeatureBadgeKey,
  type MediaFeatureFlags,
} from '@/lib/mediaFeatures';
import {
  MEDIA_BADGE_ASSETS,
  type MediaBadgeAssetId,
} from '@/lib/mediaBadgeAssets';
import { resolveRatingProviderBadgeAppearance } from '@/lib/ratingProviderIcons';
import {
  DEFAULT_BADGE_SCALE_PERCENT,
  DEFAULT_PROVIDER_ICON_SCALE_PERCENT,
  DEFAULT_STACKED_ACCENT_MODE,
  DEFAULT_STACKED_LINE_GAP_PERCENT,
  DEFAULT_STACKED_LINE_HEIGHT_PERCENT,
  DEFAULT_STACKED_LINE_WIDTH_PERCENT,
  DEFAULT_STACKED_SURFACE_OPACITY_PERCENT,
  DEFAULT_STACKED_WIDTH_PERCENT,
  MIN_STACKED_SURFACE_OPACITY_PERCENT,
  normalizeBadgeScalePercent,
  parseQualityBadgePreferencesAllowEmpty,
  parseRatingProviderAppearanceOverrides,
  type StackedAccentMode,
} from '@/lib/badgeCustomization';
import {
  computeStackedBadgeLayout,
  getStackedBadgeHeight,
} from '@/lib/stackedBadgeLayout';
import {
  buildEditorialRatingOverlaySvg,
  type EditorialRatingOverlaySpec,
} from '@/lib/editorialRatingOverlay';
import {
  ERDB_REQUEST_KEY_ERROR_MESSAGE,
  getConfiguredErdbRequestKeys,
  isErdbRequestAuthorized,
} from '@/lib/erdbRequestKey';

export const runtime = 'nodejs';

type PosterTextPreference = 'original' | 'clean' | 'alternative';
type ArtworkSource = 'tmdb' | 'fanart' | 'cinemeta';
type AnimeMappingProvider = 'mal' | 'anilist' | 'imdb' | 'tmdb' | 'tvdb' | 'anidb';
type AggregateBadgeKey = 'aggregate-overall' | 'aggregate-critics' | 'aggregate-audience';
type BadgeKey = RatingPreference | MediaFeatureBadgeKey | AggregateBadgeKey;
type QualityBadgesSide = 'left' | 'right';
type PosterQualityBadgesPosition = 'auto' | QualityBadgesSide;
type LogoBackground = 'transparent' | 'dark';
type BlockbusterDensity = 'sparse' | 'balanced' | 'packed';
const FALLBACK_IMAGE_LANGUAGE = 'en';
const ALLOWED_IMAGE_TYPES = new Set(['poster', 'backdrop', 'logo']);
const EXPLICIT_ID_SOURCE_SET = new Set(['imdb', 'tmdb', 'tvdb', 'mal', 'kitsu', 'anilist', 'anidb']);
const RAW_IMDB_ID_RE = /^tt\d+(?::.+)?$/i;
const ANIME_MAPPING_PROVIDER_SET = new Set<AnimeMappingProvider>([
  'mal',
  'anilist',
  'imdb',
  'tmdb',
  'tvdb',
  'anidb',
]);
const ANIME_NATIVE_INPUT_ID_PREFIX_SET = new Set(['kitsu', 'mal', 'myanimelist', 'anilist', 'anidb']);
const ARTWORK_SOURCE_SET = new Set<ArtworkSource>(['tmdb', 'fanart', 'cinemeta']);
const parseApiKeyList = (...values: Array<string | undefined>) => {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    for (const candidate of (value || '').split(/[\s,;]+/)) {
      const normalized = candidate.trim();
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      result.push(normalized);
    }
  }

  return result;
};
const normalizeArtworkSource = (
  value?: string | null,
  fallback: ArtworkSource = 'tmdb'
): ArtworkSource => {
  const normalized = (value || '').trim().toLowerCase();
  return ARTWORK_SOURCE_SET.has(normalized as ArtworkSource)
    ? (normalized as ArtworkSource)
    : fallback;
};
const toAnimeMappingProvider = (value?: string | null): AnimeMappingProvider | null => {
  const normalized = (value || '').trim().toLowerCase();
  if (!normalized) return null;
  const canonical = normalized === 'myanimelist' ? 'mal' : normalized;
  return ANIME_MAPPING_PROVIDER_SET.has(canonical as AnimeMappingProvider)
    ? (canonical as AnimeMappingProvider)
    : null;
};
const parseCacheTtlMs = (value: string | undefined, fallbackMs: number, minMs: number, maxMs: number) => {
  if (!value) return fallbackMs;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallbackMs;
  return Math.min(maxMs, Math.max(minMs, parsed));
};
const parseNonNegativeInt = (value?: string | null, max = Number.MAX_SAFE_INTEGER) => {
  if (value == null || value.trim() === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.min(max, Math.floor(parsed));
};
const normalizeOptionalBadgeCount = (value?: string | null) => {
  if (value == null || value.trim() === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const normalized = Math.floor(parsed);
  if (normalized < POSTER_RATINGS_MAX_PER_SIDE_MIN) return null;
  return normalized;
};
const DEFAULT_BLOCKBUSTER_DENSITY: BlockbusterDensity = 'balanced';
const normalizeBlockbusterDensity = (
  value?: string | null,
  fallback: BlockbusterDensity = DEFAULT_BLOCKBUSTER_DENSITY
): BlockbusterDensity => {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'sparse' || normalized === 'balanced' || normalized === 'packed') {
    return normalized;
  }
  return fallback;
};
const FINAL_IMAGE_RENDERER_CACHE_VERSION = 'poster-backdrop-logo-v71';
const ERDB_REQUEST_API_KEYS = getConfiguredErdbRequestKeys();
const ANILIST_GRAPHQL_URL = process.env.ERDB_ANILIST_GRAPHQL_URL?.trim() || 'https://graphql.anilist.co';
const MYANIMELIST_API_BASE_URL =
  process.env.ERDB_MAL_API_BASE_URL?.trim() || 'https://api.myanimelist.net/v2';
const MYANIMELIST_CLIENT_ID =
  process.env.ERDB_MAL_CLIENT_ID?.trim() || process.env.MAL_CLIENT_ID?.trim() || '';
const JIKAN_API_BASE_URL = process.env.ERDB_JIKAN_API_BASE_URL?.trim() || 'https://api.jikan.moe/v4';
const TRAKT_API_BASE_URL =
  process.env.ERDB_TRAKT_API_BASE_URL?.trim() || 'https://api.trakt.tv';
const TRAKT_CLIENT_ID =
  process.env.ERDB_TRAKT_CLIENT_ID?.trim() || process.env.TRAKT_CLIENT_ID?.trim() || '';
const FANART_API_KEY =
  process.env.ERDB_FANART_API_KEY?.trim() || process.env.FANART_API_KEY?.trim() || '';
const FANART_CLIENT_KEY =
  process.env.ERDB_FANART_CLIENT_KEY?.trim() || process.env.FANART_CLIENT_KEY?.trim() || '';
const ANILIST_MEDIA_RATING_QUERY = `
  query ErdbAnimeRating($id: Int) {
    Media(id: $id, type: ANIME) {
      averageScore
      meanScore
    }
  }
`;
const TMDB_CACHE_TTL_MS = parseCacheTtlMs(
  process.env.ERDB_TMDB_CACHE_TTL_MS,
  3 * 24 * 60 * 60 * 1000,
  10 * 60 * 1000,
  30 * 24 * 60 * 60 * 1000
);
const MDBLIST_CACHE_TTL_MS = parseCacheTtlMs(
  process.env.ERDB_MDBLIST_CACHE_TTL_MS,
  3 * 24 * 60 * 60 * 1000,
  10 * 60 * 1000,
  30 * 24 * 60 * 60 * 1000
);
const MDBLIST_OLD_MOVIE_CACHE_TTL_MS = parseCacheTtlMs(
  process.env.ERDB_MDBLIST_OLD_MOVIE_CACHE_TTL_MS,
  7 * 24 * 60 * 60 * 1000,
  60 * 60 * 1000,
  30 * 24 * 60 * 60 * 1000
);
const MDBLIST_OLD_MOVIE_AGE_DAYS = (() => {
  const rawValue = Number(process.env.ERDB_MDBLIST_OLD_MOVIE_AGE_DAYS);
  if (!Number.isFinite(rawValue) || rawValue <= 0) return 365;
  return Math.min(3650, Math.max(30, Math.floor(rawValue)));
})();
const MDBLIST_RATE_LIMIT_COOLDOWN_MS = parseCacheTtlMs(
  process.env.ERDB_MDBLIST_RATE_LIMIT_COOLDOWN_MS,
  24 * 60 * 60 * 1000,
  30 * 1000,
  7 * 24 * 60 * 60 * 1000
);
const IMDB_DATASET_CACHE_TTL_MS = parseCacheTtlMs(
  process.env.ERDB_IMDB_DATASET_CACHE_TTL_MS,
  7 * 24 * 60 * 60 * 1000,
  60 * 60 * 1000,
  365 * 24 * 60 * 60 * 1000
);
const KITSU_CACHE_TTL_MS = parseCacheTtlMs(
  process.env.ERDB_KITSU_CACHE_TTL_MS,
  3 * 24 * 60 * 60 * 1000,
  10 * 60 * 1000,
  30 * 24 * 60 * 60 * 1000
);
const TORRENTIO_CACHE_TTL_MS = parseCacheTtlMs(
  process.env.ERDB_TORRENTIO_CACHE_TTL_MS,
  6 * 60 * 60 * 1000,
  10 * 60 * 1000,
  7 * 24 * 60 * 60 * 1000
);
const TORRENTIO_RATE_LIMIT_COOLDOWN_MS = parseCacheTtlMs(
  process.env.ERDB_TORRENTIO_RATE_LIMIT_COOLDOWN_MS,
  15 * 60 * 1000,
  60 * 1000,
  24 * 60 * 60 * 1000
);
const TORRENTIO_CONCURRENCY = (() => {
  const rawValue = Number(process.env.ERDB_TORRENTIO_CONCURRENCY);
  if (!Number.isFinite(rawValue) || rawValue <= 0) return 2;
  return Math.max(1, Math.min(4, Math.floor(rawValue)));
})();
const TORRENTIO_BASE_URL = process.env.ERDB_TORRENTIO_BASE_URL || 'https://torrentio.strem.fun';
const TORRENTIO_PROXY_URL = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy || null;
const torrentioDispatcher = TORRENTIO_PROXY_URL ? new ProxyAgent(TORRENTIO_PROXY_URL) : undefined;
const PROVIDER_ICON_CACHE_TTL_MS = parseCacheTtlMs(
  process.env.ERDB_PROVIDER_ICON_CACHE_TTL_MS,
  7 * 24 * 60 * 60 * 1000,
  60 * 60 * 1000,
  30 * 24 * 60 * 60 * 1000
);
const FINAL_IMAGE_CACHE_MAX_ENTRIES = 300;
const SOURCE_IMAGE_CACHE_MAX_ENTRIES = 128;
const METADATA_CACHE_MAX_ENTRIES = 2000;
const PROVIDER_ICON_CACHE_MAX_ENTRIES = 64;
const PROVIDER_ICON_CACHE_VERSION = 'v2';
const TMDB_ANIMATION_GENRE_ID = 16;
const MDBLIST_API_KEYS = parseApiKeyList(process.env.MDBLIST_API_KEYS, process.env.MDBLIST_API_KEY);
type TimedCacheEntry<T> = {
  value: T;
  expiresAt: number;
  lastAccessedAt: number;
};
type CachedJsonResponse = {
  ok: boolean;
  status: number;
  data: any;
};
type JsonFetchImpl = (input: string, init?: RequestInit) => Promise<Response>;
type CachedJsonNetworkObserver = {
  onNetworkResponse?: (input: {
    key: string;
    url: string;
    status: number;
    ok: boolean;
    data: any;
    durationMs: number;
  }) => Promise<void> | void;
  onNetworkError?: (input: {
    key: string;
    url: string;
    errorMessage: string;
    durationMs: number;
  }) => Promise<void> | void;
};
type TorrentioBadgeCache = {
  flags: MediaFeatureFlags;
};
type TorrentioBadgeResult = {
  badges: RatingBadge[];
  cacheTtlMs: number;
};
type RenderedImagePayload = {
  body: ArrayBuffer;
  contentType: string;
  cacheControl: string;
};
type PhaseDurations = {
  auth: number;
  tmdb: number;
  mdb: number;
  fanart: number;
  stream: number;
  render: number;
};
class HttpError extends Error {
  status: number;
  headers?: HeadersInit;

  constructor(message: string, status: number, headers?: HeadersInit) {
    super(message);
    this.status = status;
    this.headers = headers;
  }
}
const finalImageInFlight = new Map<string, Promise<RenderedImagePayload>>();
const sourceImageInFlight = new Map<string, Promise<RenderedImagePayload>>();
const metadataInFlight = new Map<string, Promise<CachedJsonResponse>>();
const providerIconInFlight = new Map<string, Promise<string | null>>();
const torrentioInFlight = new Map<string, Promise<TorrentioBadgeResult>>();
const mdbListRateLimitedUntil = new Map<string, number>();
let torrentioRateLimitedUntil = 0;
let mdbListApiKeyCursor = 0;
const sha1Hex = (value: string) => createHash('sha1').update(value).digest('hex');
const safeCompareText = (left: string, right: string) => {
  if (!left || !right || left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(left), Buffer.from(right));
};
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const isImdbId = (value?: string | null) => {
  if (!value) return false;
  return /^tt\d+$/.test(value.trim());
};
const getDeterministicTtlMs = (baseTtlMs: number, seed: string) => {
  const normalizedSeed = String(seed || '').trim();
  if (!normalizedSeed) return baseTtlMs;

  const jitterWindowMs = Math.min(12 * 60 * 60 * 1000, Math.floor(baseTtlMs * 0.15));
  if (jitterWindowMs <= 0) return baseTtlMs;

  const hashPrefix = sha1Hex(normalizedSeed).slice(0, 8);
  const hashValue = Number.parseInt(hashPrefix, 16);
  if (!Number.isFinite(hashValue)) return baseTtlMs;

  const offsetMs = (hashValue % (jitterWindowMs + 1)) - Math.floor(jitterWindowMs / 2);
  return Math.max(60 * 1000, baseTtlMs + offsetMs);
};
const getCacheTtlMsFromCacheControl = (value: string | null | undefined, fallbackMs: number) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return fallbackMs;

  const sMaxAgeMatch = normalized.match(/s-maxage=(\d+)/);
  if (sMaxAgeMatch) {
    const ttlSeconds = Number(sMaxAgeMatch[1]);
    if (Number.isFinite(ttlSeconds) && ttlSeconds > 0) {
      return ttlSeconds * 1000;
    }
  }

  const maxAgeMatch = normalized.match(/max-age=(\d+)/);
  if (maxAgeMatch) {
    const ttlSeconds = Number(maxAgeMatch[1]);
    if (Number.isFinite(ttlSeconds) && ttlSeconds > 0) {
      return ttlSeconds * 1000;
    }
  }

  return fallbackMs;
};

const parseRetryAfterMs = (value: string | null | undefined, fallbackMs: number) => {
  const normalized = String(value || '').trim();
  if (!normalized) return fallbackMs;

  const seconds = Number(normalized);
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.max(30 * 1000, Math.round(seconds * 1000));
  }

  const retryTimestamp = Date.parse(normalized);
  if (Number.isFinite(retryTimestamp)) {
    return Math.max(30 * 1000, retryTimestamp - Date.now());
  }

  return fallbackMs;
};



const withDedupe = async <T,>(
  inFlightMap: Map<string, Promise<T>>,
  key: string,
  factory: () => Promise<T>
) => {
  const existing = inFlightMap.get(key);
  if (existing) return existing;
  const promise = factory().finally(() => {
    inFlightMap.delete(key);
  });
  inFlightMap.set(key, promise);
  return promise;
};

const createConcurrencyLimit = (concurrency: number) => {
  let active = 0;
  const queue: Array<() => void> = [];
  return async <T,>(fn: () => Promise<T>): Promise<T> => {
    if (active >= concurrency) {
      await new Promise<void>((resolve) => queue.push(resolve));
    }
    active++;
    try {
      return await fn();
    } finally {
      active--;
      const next = queue.shift();
      if (next) next();
    }
  };
};

const torrentioConcurrencyLimit = createConcurrencyLimit(TORRENTIO_CONCURRENCY);

const measurePhase = async <T,>(phases: PhaseDurations, phase: keyof PhaseDurations, fn: () => Promise<T>) => {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    phases[phase] += performance.now() - start;
  }
};

const buildServerTimingHeader = (phases: PhaseDurations, totalMs: number) => {
  const parts = [
    `auth;dur=${phases.auth.toFixed(1)}`,
    `tmdb;dur=${phases.tmdb.toFixed(1)}`,
    `mdb;dur=${phases.mdb.toFixed(1)}`,
    `fanart;dur=${phases.fanart.toFixed(1)}`,
    `stream;dur=${phases.stream.toFixed(1)}`,
    `render;dur=${phases.render.toFixed(1)}`,
    `total;dur=${totalMs.toFixed(1)}`,
  ];
  return parts.join(', ');
};

const createImageHttpResponse = (
  payload: RenderedImagePayload,
  serverTiming: string,
  cacheStatus: 'hit' | 'miss' | 'shared'
) =>
  new Response(payload.body.slice(0), {
    status: 200,
    headers: {
      'Content-Type': payload.contentType,
      'Cache-Control': payload.cacheControl,
      Vary: 'Accept',
      'Server-Timing': serverTiming,
      'X-ERDB-Cache': cacheStatus,
    },
  });
const ANIME_ONLY_RATING_PROVIDER_SET = new Set<RatingPreference>(['myanimelist', 'anilist', 'kitsu']);
type RatingBadge = {
  key: BadgeKey;
  label: string;
  value: string;
  sourceValue?: string;
  iconUrl: string;
  accentColor: string;
  iconScalePercent?: number;
  stackedLineVisible?: boolean;
  stackedLineWidthPercent?: number;
  stackedLineHeightPercent?: number;
  stackedLineGapPercent?: number;
  stackedWidthPercent?: number;
  stackedSurfaceOpacityPercent?: number;
  stackedAccentMode?: StackedAccentMode;
  variant?: 'standard' | 'minimal' | 'summary';
};
type GenreBadgeSpec = {
  familyId: GenreBadgeFamilyId;
  label: string;
  accentColor: string;
  mode: GenreBadgeMode;
  scalePercent?: number;
};
type EditorialRatingOverlay = EditorialRatingOverlaySpec;
type BlockbusterBlurb = {
  text: string;
  author: string;
};
type OutputFormat = 'png' | 'jpeg' | 'webp';
const RATING_PROVIDER_META = new Map(
  RATING_PROVIDER_OPTIONS.map((provider) => [provider.id, provider] as const)
);
const LOGO_BASE_HEIGHT = 320;
const LOGO_FALLBACK_ASPECT_RATIO = 2.5;
const LOGO_MIN_WIDTH = 360;
const LOGO_MAX_WIDTH = 2200;
const BROWSER_LIKE_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36';

const buildProviderMonogram = (label: string) => {
  const cleaned = label.replace(/[^A-Za-z0-9]+/g, ' ').trim();
  if (!cleaned) return 'R';
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase();
};

const AGGREGATE_BADGE_KEY_BY_SOURCE: Record<AggregateRatingSource, AggregateBadgeKey> = {
  overall: 'aggregate-overall',
  critics: 'aggregate-critics',
  audience: 'aggregate-audience',
};

const AGGREGATE_BADGE_ACCENT_BY_SOURCE: Record<AggregateRatingSource, string> = {
  overall: '#a78bfa',
  critics: '#fb923c',
  audience: '#34d399',
};

const EDITORIAL_GENRE_LABEL_BY_FAMILY: Record<GenreBadgeFamilyId, string> = {
  anime: 'Anime',
  horror: 'Horror',
  comedy: 'Comedy',
  romance: 'Romance',
  action: 'Action',
  scifi: 'Sci Fi',
  fantasy: 'Fantasy',
  crime: 'Crime',
  documentary: 'Doc',
};

const getEditorialEyebrowText = (
  familyId: GenreBadgeFamilyId | null,
  aggregateRatingSource: AggregateRatingSource,
) => {
  if (familyId) {
    return EDITORIAL_GENRE_LABEL_BY_FAMILY[familyId];
  }
  return getAggregateRatingSourceLabel(aggregateRatingSource);
};

const BLOCKBUSTER_DENSITY_PRESETS = {
  sparse: {
    calloutLimit: 3,
    blurbLimit: 3,
    calloutScales: [0.94, 0.9, 0.86, 0.82, 0.78],
    blurbScales: [0.96, 0.9, 0.84],
    badgeScales: [0.9, 0.86, 0.82, 0.78, 0.74, 0.7, 0.66, 0.62],
    calloutAttempts: 180,
    blurbAttempts: 180,
    badgeAttempts: 220,
    calloutPadding: 8,
    blurbPadding: 8,
    badgePadding: 3,
  },
  balanced: {
    calloutLimit: 4,
    blurbLimit: 4,
    calloutScales: [0.96, 0.92, 0.88, 0.84, 0.8, 0.76],
    blurbScales: [0.98, 0.92, 0.86, 0.8],
    badgeScales: [0.92, 0.88, 0.84, 0.8, 0.76, 0.72, 0.68, 0.64, 0.6, 0.56],
    calloutAttempts: 220,
    blurbAttempts: 220,
    badgeAttempts: 280,
    calloutPadding: 6,
    blurbPadding: 6,
    badgePadding: 2,
  },
  packed: {
    calloutLimit: 4,
    blurbLimit: 6,
    calloutScales: [0.98, 0.94, 0.9, 0.86, 0.82, 0.78, 0.74],
    blurbScales: [1, 0.94, 0.88, 0.82, 0.76],
    badgeScales: [0.94, 0.9, 0.86, 0.82, 0.78, 0.74, 0.7, 0.66, 0.62, 0.58, 0.54, 0.5],
    calloutAttempts: 260,
    blurbAttempts: 260,
    badgeAttempts: 340,
    calloutPadding: 4,
    blurbPadding: 4,
    badgePadding: 1,
  },
} satisfies Record<
  BlockbusterDensity,
  {
    calloutLimit: number;
    blurbLimit: number;
    calloutScales: number[];
    blurbScales: number[];
    badgeScales: number[];
    calloutAttempts: number;
    blurbAttempts: number;
    badgeAttempts: number;
    calloutPadding: number;
    blurbPadding: number;
    badgePadding: number;
  }
>;
const getBlockbusterDensityScale = (values: number[], index: number) =>
  values[Math.max(0, Math.min(index, values.length - 1))] ?? 1;

const parseHexColor = (value: string) => {
  const normalized = String(value || '').trim().replace(/^#/, '');
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : normalized;

  if (!/^[0-9a-f]{6}$/i.test(expanded)) {
    return null;
  }

  return {
    r: Number.parseInt(expanded.slice(0, 2), 16),
    g: Number.parseInt(expanded.slice(2, 4), 16),
    b: Number.parseInt(expanded.slice(4, 6), 16),
  };
};

const hexColorToRgba = (value: string, alpha: number, fallback = `rgba(167,139,250,${alpha})`) => {
  const parsed = parseHexColor(value);
  if (!parsed) return fallback;
  return `rgba(${parsed.r},${parsed.g},${parsed.b},${alpha})`;
};

const parseDisplayRatingNumber = (value: string) => {
  const numericCandidate = value.replace('%', '').split('/')[0].replace(',', '.').trim();
  return parseNumericRatingValue(numericCandidate);
};

const buildAggregateRatingBadge = ({
  requestedSource,
  presentation,
  renderablePreferences,
  ratingBadgeByProvider,
}: {
  requestedSource: AggregateRatingSource;
  presentation: RatingPresentation;
  renderablePreferences: RatingPreference[];
  ratingBadgeByProvider: Map<RatingPreference, RatingBadge>;
}): RatingBadge | null => {
  const availableProviders = renderablePreferences.filter((provider) => ratingBadgeByProvider.has(provider));
  if (availableProviders.length === 0) return null;

  const selectedProviders = selectAggregateRatingProviders(requestedSource, availableProviders);
  const resolvedSource =
    requestedSource !== 'overall' &&
    !hasAggregateRatingProvidersForSource(requestedSource, availableProviders)
      ? 'overall'
      : requestedSource;

  const numericValues = selectedProviders
    .map((provider) => ({ provider, badge: ratingBadgeByProvider.get(provider) }))
    .filter((entry): entry is { provider: RatingPreference; badge: RatingBadge } => entry.badge !== undefined)
    .map(({ provider, badge }) =>
      normalizeRatingToTenPointValue(provider, String(badge.sourceValue || badge.value || '').trim())
    )
    .filter((value): value is number => value !== null);

  if (numericValues.length === 0) return null;

  const averageValue =
    numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
  const effectiveSource = resolvedSource as AggregateRatingSource;

  return {
    key: AGGREGATE_BADGE_KEY_BY_SOURCE[effectiveSource],
    label:
      presentation === 'minimal'
        ? getAggregateRatingSourceShortLabel(effectiveSource)
        : getAggregateRatingSourceLabel(effectiveSource),
    value: formatRatingNumber(averageValue),
    iconUrl: '',
    accentColor: AGGREGATE_BADGE_ACCENT_BY_SOURCE[effectiveSource],
    variant: presentation === 'minimal' ? 'minimal' : 'summary',
  };
};

const BLOCKBUSTER_CALLOUT_PRIORITY = new Map<BadgeKey, number>([
  ['tomatoes', 0],
  ['metacritic', 1],
  ['rogerebert', 2],
  ['mdblist', 3],
  ['tomatoesaudience', 4],
  ['metacriticuser', 5],
  ['imdb', 6],
  ['letterboxd', 7],
  ['tmdb', 8],
  ['trakt', 9],
  ['myanimelist', 10],
  ['anilist', 11],
  ['kitsu', 12],
]);

const getBlockbusterCalloutHeadline = (badge: RatingBadge) => {
  const numericValue = parseDisplayRatingNumber(String(badge.sourceValue || badge.value));

  if ((badge.key === 'tomatoes' || badge.key === 'tomatoesaudience') && numericValue !== null) {
    return numericValue >= 60 ? 'FRESH' : 'ROTTEN';
  }

  if (badge.key === 'metacritic' && numericValue !== null) {
    if (numericValue >= 81) return 'UNIVERSAL ACCLAIM';
    if (numericValue >= 61) return 'GENERALLY FAVORABLE';
    if (numericValue >= 40) return 'MIXED REVIEWS';
    if (numericValue >= 20) return 'GENERALLY UNFAVORABLE';
    return 'OVERWHELMING DISLIKE';
  }

  if (badge.key === 'metacriticuser' && numericValue !== null) {
    if (numericValue >= 8) return 'UNIVERSAL ACCLAIM';
    if (numericValue >= 6) return 'GENERALLY FAVORABLE';
    if (numericValue >= 4) return 'MIXED REVIEWS';
    if (numericValue >= 2) return 'GENERALLY UNFAVORABLE';
    return 'OVERWHELMING DISLIKE';
  }

  return badge.label.trim().toUpperCase();
};

const getBlockbusterCalloutDetail = (badge: RatingBadge, headline: string) => {
  const label =
    badge.key === 'tomatoesaudience'
      ? 'AUDIENCE'
      : badge.key === 'metacriticuser'
        ? 'USER SCORE'
        : badge.label.trim().toUpperCase();
  const sourceValue = String(badge.sourceValue || badge.value || '')
    .trim()
    .replace(/(\d+)\.0(%|\/10|\/5|\/4)$/i, '$1$2')
    .replace(/(\d+)\.0$/i, '$1')
    .toUpperCase();
  if (!sourceValue) return label;
  return headline === label ? sourceValue : `${label} ${sourceValue}`;
};

const sortBlockbusterBadgesByPriority = (badges: RatingBadge[]) =>
  badges
    .filter(
      (badge) =>
        badge.variant !== 'minimal' &&
        badge.variant !== 'summary' &&
        badge.label.trim().length > 0 &&
        String(badge.sourceValue || badge.value || '').trim().length > 0
    )
    .map((badge) => ({
      badge,
      numericValue: parseDisplayRatingNumber(String(badge.sourceValue || badge.value)),
      priority:
        BLOCKBUSTER_CALLOUT_PRIORITY.get(badge.key) ?? BLOCKBUSTER_CALLOUT_PRIORITY.size + 1,
    }))
    .sort((left, right) => {
      if (left.priority !== right.priority) return left.priority - right.priority;
      if (left.numericValue !== null && right.numericValue !== null) {
        return right.numericValue - left.numericValue;
      }
      if (left.numericValue !== null) return -1;
      if (right.numericValue !== null) return 1;
      return left.badge.label.localeCompare(right.badge.label);
    })
    .map(({ badge }) => badge);

const pickBlockbusterCalloutBadges = (badges: RatingBadge[]) =>
  sortBlockbusterBadgesByPriority(badges);

const pickBlockbusterScoreBadges = (badges: RatingBadge[]) =>
  sortBlockbusterBadgesByPriority(badges);

const buildBlockbusterCalloutSvg = ({
  headline,
  detail,
  accentColor,
  rotation,
  iconDataUri,
  iconMonogram,
}: {
  headline: string;
  detail: string;
  accentColor: string;
  rotation: number;
  iconDataUri?: string | null;
  iconMonogram?: string;
}) => {
  const normalizedHeadline = headline.trim().toUpperCase();
  const normalizedDetail = detail.trim().toUpperCase();
  const headlineFontSize =
    normalizedHeadline.length > 22 ? 12 : normalizedHeadline.length > 15 ? 13 : 15;
  const detailFontSize = normalizedDetail.length > 24 ? 8.5 : 9.5;
  const padX = 13;
  const padTop = 8;
  const padBottom = 8;
  const iconPlateSize = 22;
  const iconGap = 7;
  const hasIconPlate = Boolean(iconDataUri || iconMonogram);
  const stripeHeight = 3.5;
  const lineGap = 4;
  const availableHeadlineWidth = estimateGeneratedLogoLineWidth(normalizedHeadline, headlineFontSize);
  const availableDetailWidth = estimateGeneratedLogoLineWidth(normalizedDetail, detailFontSize);
  const iconSpace = hasIconPlate ? iconPlateSize + iconGap : 0;
  const contentWidth = Math.max(availableHeadlineWidth, availableDetailWidth) + iconSpace;
  const stickerWidth = Math.max(118, Math.min(198, Math.round(contentWidth + padX * 2)));
  const stickerHeight =
    padTop + headlineFontSize + lineGap + detailFontSize + padBottom + stripeHeight;
  const svgWidth = stickerWidth + 14;
  const svgHeight = stickerHeight + 14;
  const centerX = Math.round(svgWidth / 2);
  const centerY = Math.round(svgHeight / 2);
  const iconPlateX = padX;
  const iconPlateY = Math.round((stickerHeight - stripeHeight - iconPlateSize) / 2);
  const iconSize = 15;
  const iconX = iconPlateX + Math.round((iconPlateSize - iconSize) / 2);
  const iconY = iconPlateY + Math.round((iconPlateSize - iconSize) / 2);
  const textX = padX + iconSpace;
  const headlineY = padTop + headlineFontSize;
  const detailY = headlineY + lineGap + detailFontSize;
  const availableTextWidth = Math.max(0, stickerWidth - padX * 2 - iconSpace);
  const headlineTextLength =
    availableHeadlineWidth > availableTextWidth
      ? ` textLength="${availableTextWidth}" lengthAdjust="spacingAndGlyphs"`
      : '';
  const detailTextLength =
    availableDetailWidth > availableTextWidth
      ? ` textLength="${availableTextWidth}" lengthAdjust="spacingAndGlyphs"`
      : '';
  const cardStroke = hexColorToRgba(accentColor, 0.34, 'rgba(167,139,250,0.34)');
  const paperFill = 'rgba(253,251,246,0.98)';
  const paperShade = 'rgba(255,255,255,0.52)';

  return {
    width: svgWidth,
    height: svgHeight,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
<defs>
<filter id="blockbuster-callout-shadow" x="-20%" y="-20%" width="140%" height="150%" color-interpolation-filters="sRGB">
<feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#020617" flood-opacity="0.12" />
</filter>
</defs>
<g filter="url(#blockbuster-callout-shadow)" transform="translate(${centerX},${centerY}) rotate(${rotation}) translate(${-Math.round(stickerWidth / 2)},${-Math.round(stickerHeight / 2)})">
<rect x="0" y="0" width="${stickerWidth}" height="${stickerHeight}" rx="9" fill="${paperFill}" stroke="${cardStroke}" stroke-width="1.1" />
<rect x="0" y="0" width="${stickerWidth}" height="${Math.max(12, Math.round(stickerHeight * 0.38))}" rx="9" fill="${paperShade}" />
${hasIconPlate ? `<rect x="${iconPlateX}" y="${iconPlateY}" width="${iconPlateSize}" height="${iconPlateSize}" rx="11" fill="rgba(255,255,255,0.98)" stroke="${cardStroke}" stroke-width="0.8" />` : ''}
${iconDataUri ? `<image href="${iconDataUri}" x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" />` : ''}
${!iconDataUri && iconMonogram ? `<text x="${Math.round(iconPlateX + iconPlateSize / 2)}" y="${Math.round(iconPlateY + iconPlateSize / 2 + 4)}" font-family="'Noto Sans','DejaVu Sans',Arial,sans-serif" font-size="10" font-weight="900" text-anchor="middle" fill="rgba(17,24,39,0.84)">${escapeXml(iconMonogram.slice(0, 2))}</text>` : ''}
<rect x="0" y="${Math.max(0, stickerHeight - stripeHeight)}" width="${stickerWidth}" height="${stripeHeight}" rx="${Math.max(2, Math.round(stripeHeight / 2))}" fill="${accentColor}" fill-opacity="0.88" />
<text x="${textX}" y="${headlineY}" font-family="'Noto Sans','DejaVu Sans',Arial,sans-serif" font-size="${headlineFontSize}" font-weight="900" fill="#111827"${headlineTextLength}>${escapeXml(normalizedHeadline)}</text>
<text x="${textX}" y="${detailY}" font-family="'Noto Sans','DejaVu Sans',Arial,sans-serif" font-size="${detailFontSize}" font-weight="800" fill="rgba(17,24,39,0.78)"${detailTextLength}>${escapeXml(normalizedDetail)}</text>
</g>
</svg>`,
  };
};

const sanitizeBlockbusterReviewText = (value: string) =>
  String(value || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<\/?[^>]+>/g, ' ')
    .replace(/[_*~>#]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const trimBlockbusterReviewText = (value: string, maxLength = 220) => {
  const normalized = sanitizeBlockbusterReviewText(value);
  if (!normalized) return '';

  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  if (sentences.length > 0) {
    const combinedSentences: string[] = [];
    for (const sentence of sentences) {
      const candidate = combinedSentences.length > 0
        ? `${combinedSentences.join(' ')} ${sentence}`
        : sentence;
      if (candidate.length > maxLength) break;
      combinedSentences.push(sentence);
      if (candidate.length >= 72) {
        return candidate;
      }
    }

    const pickedSentence =
      sentences.find((sentence) => sentence.length >= 52 && sentence.length <= maxLength) ||
      combinedSentences[0];
    if (pickedSentence && pickedSentence.length <= maxLength) {
      return pickedSentence;
    }
  }

  if (normalized.length <= maxLength) return normalized;

  const sliced = normalized.slice(0, maxLength + 1);
  const boundary = Math.max(sliced.lastIndexOf(' '), sliced.lastIndexOf(','), sliced.lastIndexOf('.'));
  const trimmed = (boundary > 48 ? sliced.slice(0, boundary) : sliced.slice(0, maxLength)).trim();
  return `${trimmed}...`;
};

const extractBlockbusterReviewBlurbs = (payload: any): BlockbusterBlurb[] => {
  const results = Array.isArray(payload?.results) ? payload.results : [];
  return results
    .flatMap((review: any) => {
      const normalized = sanitizeBlockbusterReviewText(review?.content || '');
      if (!normalized) return [];
      const snippets = normalized
        .split(/(?<=[.!?])\s+/)
        .map((sentence) => trimBlockbusterReviewText(sentence, 220))
        .filter((sentence) => sentence.length >= 34);
      const shortlist =
        snippets.length > 0
          ? Array.from(new Set(snippets)).slice(0, 2)
          : (() => {
              const fallback = trimBlockbusterReviewText(normalized, 220);
              return fallback.length >= 34 ? [fallback] : [];
            })();
      if (shortlist.length === 0) return [];
      const author = String(
        review?.author_details?.username ||
        review?.author_details?.name ||
        review?.author ||
        'TMDB review'
      )
        .replace(/\s+/g, ' ')
        .trim();
      return shortlist.map((text) => ({
        text,
        author: author || 'TMDB review',
      }));
    })
    .filter((review: BlockbusterBlurb | null): review is BlockbusterBlurb => review !== null);
};

const dedupeBlockbusterBlurbs = (blurbs: BlockbusterBlurb[], limit = 10) => {
  const seen = new Set<string>();
  const merged: BlockbusterBlurb[] = [];

  for (const blurb of blurbs) {
    const text = blurb.text.replace(/\s+/g, ' ').trim();
    const author = blurb.author.replace(/\s+/g, ' ').trim();
    const key = `${author.toLowerCase()}::${text.toLowerCase()}`;
    if (!text || seen.has(key)) continue;
    seen.add(key);
    merged.push({ text, author });
    if (merged.length >= limit) break;
  }

  return merged;
};

const fitBlockbusterBlurbLine = (
  text: string,
  fontSize: number,
  maxWidth: number,
) => {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (estimateGeneratedLogoLineWidth(normalized, fontSize) <= maxWidth) return normalized;
  const words = normalized.split(' ').filter(Boolean);
  while (words.length > 1) {
    words.pop();
    const candidate = `${words.join(' ')}...`.trim();
    if (estimateGeneratedLogoLineWidth(candidate, fontSize) <= maxWidth) {
      return candidate;
    }
  }
  return normalized;
};

const splitBlockbusterBlurbLines = (
  text: string,
  fontSize: number,
  maxWidth: number,
  maxLines: number,
) => {
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const lines: string[] = [];
  let didOverflow = false;

  for (const word of words) {
    const currentLine = lines[lines.length - 1] || '';
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (!currentLine || estimateGeneratedLogoLineWidth(candidate, fontSize) <= maxWidth) {
      if (currentLine) {
        lines[lines.length - 1] = candidate;
      } else {
        lines.push(candidate);
      }
      continue;
    }

    if (lines.length < maxLines) {
      lines.push(word);
      continue;
    }

    lines[maxLines - 1] = fitBlockbusterBlurbLine(`${lines[maxLines - 1]} ${word}`, fontSize, maxWidth);
    didOverflow = true;
    break;
  }

  return {
    lines: lines.slice(0, maxLines),
    didOverflow,
  };
};

const buildBlockbusterReviewCalloutSvg = ({
  text,
  author,
  rotation: _rotation,
}: {
  text: string;
  author: string;
  rotation: number;
}) => {
  const normalizedText = sanitizeBlockbusterReviewText(text);
  const quoteText = normalizedText ? `“${normalizedText}”` : '';
  const padX = 15;
  const padTop = 12;
  const padBottom = 12;
  const bylineFontSize = 8.5;
  const layoutOptions = [
    { fontSize: 13, maxLines: 3, minWidth: 190, maxWidth: 248 },
    { fontSize: 12, maxLines: 4, minWidth: 214, maxWidth: 276 },
    { fontSize: 11, maxLines: 5, minWidth: 232, maxWidth: 304 },
    { fontSize: 10, maxLines: 6, minWidth: 248, maxWidth: 324 },
  ];
  let chosenWidth = layoutOptions[layoutOptions.length - 1].maxWidth;
  let chosenFontSize = layoutOptions[layoutOptions.length - 1].fontSize;
  let chosenLines: string[] = quoteText ? [quoteText] : [];

  for (let index = 0; index < layoutOptions.length; index += 1) {
    const option = layoutOptions[index];
    const width = Math.max(
      option.minWidth,
      Math.min(
        option.maxWidth,
        136 + Math.round(estimateGeneratedLogoLineWidth(quoteText, option.fontSize) * 0.62)
      )
    );
    const maxTextWidth = width - padX * 2;
    const wrapped = splitBlockbusterBlurbLines(quoteText, option.fontSize, maxTextWidth, option.maxLines);
    chosenWidth = width;
    chosenFontSize = option.fontSize;
    chosenLines = wrapped.lines;
    if (!wrapped.didOverflow) {
      break;
    }
    if (index === layoutOptions.length - 1 && chosenLines.length > 0) {
      chosenLines[chosenLines.length - 1] = fitBlockbusterBlurbLine(
        chosenLines[chosenLines.length - 1],
        option.fontSize,
        maxTextWidth
      );
    }
  }

  const width = chosenWidth;
  const textFontSize = chosenFontSize;
  const maxTextWidth = width - padX * 2;
  const lines = chosenLines;
  const lineHeight = Math.round(textFontSize * 1.24);
  const bylineY = padTop + lines.length * lineHeight + 8;
  const cardHeight = bylineY + bylineFontSize + padBottom;
  const outerWidth = width + 12;
  const outerHeight = cardHeight + 12;
  const centerX = Math.round(outerWidth / 2);
  const centerY = Math.round(outerHeight / 2);
  const byline = author.trim().toUpperCase().slice(0, 26) || 'TMDB REVIEW';
  const tspans = lines
    .map((line, index) => {
      const y = padTop + textFontSize + index * lineHeight;
      const estimatedWidth = estimateGeneratedLogoLineWidth(line, textFontSize);
      const textLength =
        estimatedWidth > maxTextWidth
          ? ` textLength="${maxTextWidth}" lengthAdjust="spacingAndGlyphs"`
          : '';
      return `<tspan x="${padX}" y="${y}"${textLength}>${escapeXml(line)}</tspan>`;
    })
    .join('');
  const stripeWidth = Math.max(26, Math.round(width * 0.2));

  return {
    width: outerWidth,
    height: outerHeight,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${outerWidth}" height="${outerHeight}" viewBox="0 0 ${outerWidth} ${outerHeight}">
<defs>
<filter id="blockbuster-review-shadow" x="-20%" y="-20%" width="160%" height="170%" color-interpolation-filters="sRGB">
<feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#020617" flood-opacity="0.12" />
</filter>
</defs>
<g filter="url(#blockbuster-review-shadow)" transform="translate(${centerX},${centerY}) translate(${-Math.round(width / 2)},${-Math.round(cardHeight / 2)})">
<rect x="0" y="0" width="${width}" height="${cardHeight}" rx="9" fill="rgba(253,251,246,0.98)" stroke="rgba(15,23,42,0.14)" stroke-width="0.95" />
<rect x="${padX}" y="${padTop - 5}" width="${stripeWidth}" height="3" rx="1.5" fill="rgba(15,23,42,0.28)" />
<text x="${padX}" y="${padTop + textFontSize}" font-family="'Noto Sans','DejaVu Sans',Arial,sans-serif" font-size="${textFontSize}" font-weight="900" fill="rgba(15,23,42,0.92)">${tspans}</text>
<text x="${padX}" y="${bylineY}" font-family="'Noto Sans','DejaVu Sans',Arial,sans-serif" font-size="${bylineFontSize}" font-weight="800" letter-spacing="0.04em" fill="rgba(15,23,42,0.62)">${escapeXml(byline)}</text>
</g>
</svg>`,
  };
};

const buildBlockbusterScoreTileSvg = ({
  badge,
  iconDataUri,
  iconMonogram,
}: {
  badge: RatingBadge;
  iconDataUri?: string | null;
  iconMonogram?: string;
}) => {
  const normalizedValue = String(badge.sourceValue || badge.value || '')
    .trim()
    .replace(/(\d+)\.0(%|\/10|\/5|\/4)$/i, '$1$2')
    .replace(/(\d+)\.0$/i, '$1')
    .toUpperCase();
  const tileKind =
    badge.key === 'tomatoes' || badge.key === 'tomatoesaudience'
      ? 'seal'
      : badge.key === 'metacritic' || badge.key === 'metacriticuser' || badge.key === 'mdblist'
        ? 'tile'
        : 'pill';
  const accent = badge.accentColor;

  if (tileKind === 'seal') {
    const size = 64;
    const iconSize = 18;
    const fontSize = normalizedValue.length > 3 ? 18 : 21;
    const label = badge.key === 'tomatoesaudience' ? 'AUDIENCE' : badge.label.trim().toUpperCase();
    return {
      width: size + 14,
      height: size + 14,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${size + 14}" height="${size + 14}" viewBox="0 0 ${size + 14} ${size + 14}">
<defs><filter id="blockbuster-seal-shadow" x="-20%" y="-20%" width="150%" height="150%"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#020617" flood-opacity="0.16" /></filter></defs>
<g filter="url(#blockbuster-seal-shadow)" transform="translate(7,7)">
<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1.5}" fill="rgba(252,252,251,0.98)" stroke="${accent}" stroke-width="3" />
${iconDataUri ? `<image href="${iconDataUri}" x="${Math.round(size / 2 - iconSize / 2)}" y="11" width="${iconSize}" height="${iconSize}" />` : ''}
${!iconDataUri && iconMonogram ? `<text x="${Math.round(size / 2)}" y="25" font-family="'Noto Sans','DejaVu Sans',Arial,sans-serif" font-size="10" font-weight="900" text-anchor="middle" fill="rgba(17,24,39,0.88)">${escapeXml(iconMonogram.slice(0, 2))}</text>` : ''}
<text x="${Math.round(size / 2)}" y="${Math.round(size / 2 + 11)}" font-family="'Noto Sans','DejaVu Sans',Arial,sans-serif" font-size="${fontSize}" font-weight="900" text-anchor="middle" fill="#111827">${escapeXml(normalizedValue)}</text>
<text x="${Math.round(size / 2)}" y="${size - 11}" font-family="'Noto Sans','DejaVu Sans',Arial,sans-serif" font-size="7.5" font-weight="900" text-anchor="middle" fill="rgba(17,24,39,0.70)">${escapeXml(label.slice(0, 12))}</text>
</g>
</svg>`,
    };
  }

  if (tileKind === 'tile') {
    const width = 58;
    const height = 52;
    const iconSize = 16;
    const fontSize = normalizedValue.length > 3 ? 17 : 20;
    return {
      width: width + 12,
      height: height + 12,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width + 12}" height="${height + 12}" viewBox="0 0 ${width + 12} ${height + 12}">
<defs><filter id="blockbuster-tile-shadow" x="-20%" y="-20%" width="150%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#020617" flood-opacity="0.15" /></filter></defs>
<g filter="url(#blockbuster-tile-shadow)" transform="translate(6,6)">
<rect x="0" y="0" width="${width}" height="${height}" rx="12" fill="rgba(250,250,249,0.98)" stroke="${accent}" stroke-width="2.4" />
${iconDataUri ? `<image href="${iconDataUri}" x="8" y="8" width="${iconSize}" height="${iconSize}" />` : ''}
${!iconDataUri && iconMonogram ? `<text x="16" y="21" font-family="'Noto Sans','DejaVu Sans',Arial,sans-serif" font-size="10" font-weight="900" text-anchor="middle" fill="rgba(17,24,39,0.84)">${escapeXml(iconMonogram.slice(0, 2))}</text>` : ''}
<text x="${Math.round(width / 2)}" y="${Math.round(height / 2 + 14)}" font-family="'Noto Sans','DejaVu Sans',Arial,sans-serif" font-size="${fontSize}" font-weight="900" text-anchor="middle" fill="#111827">${escapeXml(normalizedValue)}</text>
</g>
</svg>`,
    };
  }

  const width = Math.max(72, Math.min(94, 38 + estimateGeneratedLogoLineWidth(normalizedValue, 17)));
  const height = 36;
  const iconSize = 14;
  return {
    width: width + 12,
    height: height + 12,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width + 12}" height="${height + 12}" viewBox="0 0 ${width + 12} ${height + 12}">
<defs><filter id="blockbuster-pill-shadow" x="-20%" y="-20%" width="150%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#020617" flood-opacity="0.12" /></filter></defs>
<g filter="url(#blockbuster-pill-shadow)" transform="translate(6,6)">
<rect x="0" y="0" width="${width}" height="${height}" rx="${Math.round(height / 2)}" fill="rgba(13,18,28,0.88)" stroke="${accent}" stroke-opacity="0.52" stroke-width="1.4" />
${iconDataUri ? `<image href="${iconDataUri}" x="10" y="${Math.round((height - iconSize) / 2)}" width="${iconSize}" height="${iconSize}" />` : ''}
${!iconDataUri && iconMonogram ? `<text x="17" y="${Math.round(height / 2 + 4)}" font-family="'Noto Sans','DejaVu Sans',Arial,sans-serif" font-size="10" font-weight="900" text-anchor="middle" fill="white">${escapeXml(iconMonogram.slice(0, 2))}</text>` : ''}
<text x="${iconDataUri || iconMonogram ? 32 : 12}" y="${Math.round(height / 2 + 6)}" font-family="'Noto Sans','DejaVu Sans',Arial,sans-serif" font-size="17" font-weight="900" fill="white">${escapeXml(normalizedValue)}</text>
</g>
</svg>`,
  };
};

const getBlockbusterBadgeChaos = (badge: RatingBadge, seedSalt = '') => {
  const hash = sha1Hex(`${seedSalt}:${badge.key}:${badge.label}:${badge.value}`);
  const read = (start: number, length = 4) =>
    Number.parseInt(hash.slice(start, start + length), 16) || 0;
  return {
    rotation: ((read(0) % 3400) / 100) - 17,
    xJitter: (read(4) % 145) - 72,
    yJitter: (read(8) % 125) - 62,
    opacity: 0.40 + (read(12) % 17) / 100,
    spreadX: (read(16) % 1000) / 1000,
    spreadY: (read(20) % 1000) / 1000,
  };
};

const getBlockbusterBlurbChaos = (seedKey: string, density: BlockbusterDensity) => {
  const hash = sha1Hex(seedKey);
  const read = (start: number, length = 4) =>
    Number.parseInt(hash.slice(start, start + length), 16) || 0;
  const densityMultiplier =
    density === 'packed' ? 1.28 : density === 'balanced' ? 1.08 : 0.92;
  const baseOuterRotation = ((((read(4) % 7600) / 100) - 38) * 0.42) * densityMultiplier;
  const verticalRoll = read(28) % 100;
  const shouldGoNearVertical =
    density === 'packed' ? verticalRoll < 34 : density === 'balanced' ? verticalRoll < 10 : false;
  const verticalSign = read(32) % 2 === 0 ? -1 : 1;
  const nearVerticalRotation = verticalSign * (52 + (read(36) % 19));
  const outerRotation = shouldGoNearVertical ? nearVerticalRotation : baseOuterRotation;
  return {
    innerRotation: ((((read(0) % 4200) / 100) - 21) * 0.24) * densityMultiplier,
    outerRotation,
    skewX:
      ((((read(8) % 3200) / 100) - 16) * 0.34) *
      (shouldGoNearVertical ? Math.max(0.72, densityMultiplier * 0.78) : densityMultiplier),
    skewY:
      ((((read(12) % 1800) / 100) - 9) * 0.16) *
      (shouldGoNearVertical ? Math.max(0.7, densityMultiplier * 0.72) : densityMultiplier),
    scale:
      (0.92 + (read(16) % 18) / 100) *
      (shouldGoNearVertical ? (density === 'packed' ? 0.84 : 0.88) : 1),
    horizontalBias: (read(20) % 1000) / 1000,
    verticalBias: (read(24) % 1000) / 1000,
    isNearVertical: shouldGoNearVertical,
  };
};

const buildTransformedSvgOverlay = ({
  svg,
  width,
  height,
  rotation,
  opacity,
  scale = 1,
  skewX = 0,
  skewY = 0,
  pad = 18,
}: {
  svg: string;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  scale?: number;
  skewX?: number;
  skewY?: number;
  pad?: number;
}) => {
  const normalizedScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const normalizedSkewX = Number.isFinite(skewX) ? skewX : 0;
  const normalizedSkewY = Number.isFinite(skewY) ? skewY : 0;
  const rotationRadians = Math.abs(rotation) * (Math.PI / 180);
  const skewXRadians = Math.abs(normalizedSkewX) * (Math.PI / 180);
  const skewYRadians = Math.abs(normalizedSkewY) * (Math.PI / 180);
  const skewedWidth = width + Math.abs(height * Math.tan(skewXRadians));
  const skewedHeight = height + Math.abs(width * Math.tan(skewYRadians));
  const transformedWidth =
    Math.abs(skewedWidth * Math.cos(rotationRadians)) +
    Math.abs(skewedHeight * Math.sin(rotationRadians));
  const transformedHeight =
    Math.abs(skewedWidth * Math.sin(rotationRadians)) +
    Math.abs(skewedHeight * Math.cos(rotationRadians));
  const scaledWidth = Math.max(1, Math.ceil(transformedWidth * normalizedScale));
  const scaledHeight = Math.max(1, Math.ceil(transformedHeight * normalizedScale));
  const outerWidth = scaledWidth + pad * 2;
  const outerHeight = scaledHeight + pad * 2;
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  return {
    width: outerWidth,
    height: outerHeight,
    offsetX: Math.round((outerWidth - scaledWidth) / 2),
    offsetY: Math.round((outerHeight - scaledHeight) / 2),
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${outerWidth}" height="${outerHeight}" viewBox="0 0 ${outerWidth} ${outerHeight}">
<g opacity="${opacity}" transform="translate(${Math.round(outerWidth / 2)},${Math.round(outerHeight / 2)}) rotate(${rotation}) skewX(${normalizedSkewX}) skewY(${normalizedSkewY}) scale(${normalizedScale}) translate(${-Math.round(width / 2)},${-Math.round(height / 2)})">
<image href="${dataUri}" x="0" y="0" width="${width}" height="${height}" />
</g>
</svg>`,
  };
};

const normalizeStreamBadgesSetting = (value?: string | null) => {
  const normalized = (value || '').trim().toLowerCase();
  if (!normalized) return 'auto';
  if (['1', 'true', 'yes', 'on', 'torrentio'].includes(normalized)) return 'on';
  if (['0', 'false', 'no', 'off', 'none'].includes(normalized)) return 'off';
  return 'auto';
};

const normalizeQualityBadgesSide = (value?: string | null): QualityBadgesSide => {
  const normalized = (value || '').trim().toLowerCase();
  if (['right', 'r', 'end'].includes(normalized)) return 'right';
  return 'left';
};
const normalizePosterQualityBadgesPosition = (value?: string | null): PosterQualityBadgesPosition => {
  const normalized = (value || '').trim().toLowerCase();
  if (!normalized || normalized === 'auto' || normalized === 'default') return 'auto';
  if (['right', 'r', 'end'].includes(normalized)) return 'right';
  if (['left', 'l', 'start'].includes(normalized)) return 'left';
  return 'auto';
};
const resolvePosterQualityBadgePlacement = (
  layout: PosterRatingLayout,
  qualityBadgesSide: QualityBadgesSide,
  posterQualityBadgesPosition: PosterQualityBadgesPosition
): 'top' | 'bottom' | QualityBadgesSide => {
  if (layout === 'left' || layout === 'right' || layout === 'left-right') {
    return 'bottom';
  }
  if (layout === 'top-bottom') {
    return qualityBadgesSide;
  }
  if (layout === 'top') {
    return posterQualityBadgesPosition === 'auto' ? 'bottom' : posterQualityBadgesPosition;
  }
  if (layout === 'bottom') {
    return posterQualityBadgesPosition === 'auto' ? 'top' : posterQualityBadgesPosition;
  }
  return qualityBadgesSide;
};

const normalizeQualityBadgesStyle = (value?: string | null): QualityBadgeStyle =>
  normalizeQualityBadgeStyle(value);

const normalizeLogoBackground = (value?: string | null): LogoBackground => {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'dark' || normalized === 'solid' || normalized === 'canvas') {
    return 'dark';
  }
  return 'transparent';
};

const extractTorrentioFilenames = (payload: any) => {
  const streams = Array.isArray(payload?.streams) ? payload.streams : [];
  const filenames: string[] = [];
  for (const stream of streams) {
    const filename =
      (typeof stream?.filename === 'string' && stream.filename) ||
      (typeof stream?.behaviorHints?.filename === 'string' && stream.behaviorHints.filename) ||
      (typeof stream?.title === 'string' && stream.title) ||
      (typeof stream?.name === 'string' && stream.name) ||
      '';
    if (filename) filenames.push(filename);
  }
  return filenames;
};

const buildFeatureBadgesFromFlags = (flags: MediaFeatureFlags): RatingBadge[] =>
  buildMediaFeatureBadgesFromFlags(flags).map((badge) => ({
    key: badge.key,
    label: badge.label,
    value: '',
    iconUrl: '',
    accentColor: badge.accentColor,
  }));

const buildTorrentioUrl = (type: 'movie' | 'series', id: string) =>
  `${TORRENTIO_BASE_URL}/stream/${type}/${encodeURIComponent(id)}.json`;

const fetchTorrentioBadges = async (input: {
  type: 'movie' | 'series';
  id: string;
  phases: PhaseDurations;
  cacheTtlMs?: number;
}): Promise<TorrentioBadgeResult> => {
  const trimmedId = input.id.trim();
  if (!trimmedId) {
    return { badges: [], cacheTtlMs: TORRENTIO_CACHE_TTL_MS };
  }
  const cacheKey = `torrentio:${input.type}:${trimmedId}`;
  const ttlMs =
    typeof input.cacheTtlMs === 'number' && Number.isFinite(input.cacheTtlMs) && input.cacheTtlMs > 0
      ? input.cacheTtlMs
      : getDeterministicTtlMs(TORRENTIO_CACHE_TTL_MS, cacheKey);
  const now = Date.now();
  if (torrentioRateLimitedUntil > now) {
    const cooldownTtlMs = Math.max(30 * 1000, torrentioRateLimitedUntil - now);
    setMetadata(cacheKey, { flags: collectMediaFeatureFlags([]) }, Math.min(ttlMs, cooldownTtlMs));
    return { badges: [], cacheTtlMs: cooldownTtlMs };
  }
  const cached = getMetadata<TorrentioBadgeCache>(cacheKey);
  if (cached) {
    return { badges: buildFeatureBadgesFromFlags(cached.flags), cacheTtlMs: ttlMs };
  }

  return withDedupe(torrentioInFlight, cacheKey, async () => {
    const warm = getMetadata<TorrentioBadgeCache>(cacheKey);
    if (warm) {
      return { badges: buildFeatureBadgesFromFlags(warm.flags), cacheTtlMs: ttlMs };
    }

    let response: Response | null = null;
    const torrentioUrl = buildTorrentioUrl(input.type, trimmedId);
    try {
      response = await measurePhase(input.phases, 'stream', () =>
        torrentioConcurrencyLimit(async () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          try {
            return await undiciFetch(torrentioUrl, {
              signal: controller.signal,
              headers: {
                'User-Agent': BROWSER_LIKE_USER_AGENT,
              },
              ...(torrentioDispatcher ? { dispatcher: torrentioDispatcher } : {}),
            }) as unknown as Response;
          } finally {
            clearTimeout(timeoutId);
          }
        })
      );
    } catch (err) {
      console.warn(`[ERDB] Torrentio fetch failed for ${torrentioUrl}:`, err instanceof Error ? err.message : err);
      const failureTtl = Math.min(ttlMs, 2 * 60 * 1000);
      setMetadata(cacheKey, { flags: collectMediaFeatureFlags([]) }, failureTtl);
      return { badges: [], cacheTtlMs: failureTtl };
    }

    if (!response.ok) {
      console.warn(`[ERDB] Torrentio returned ${response.status} for ${torrentioUrl}`);
    }

    let payload: any = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    const filenames = extractTorrentioFilenames(payload);
    const flags = collectMediaFeatureFlags(filenames);
    if (filenames.length === 0) {
      console.warn(`[ERDB] Torrentio returned 0 streams for ${torrentioUrl}`);
    }
    const isRateLimited = response.status === 429 || response.status === 403;
    const targetTtl = response.ok ? ttlMs : Math.min(ttlMs, 2 * 60 * 1000);
    if (isRateLimited) {
      const cooldownMs = parseRetryAfterMs(
        response.headers.get('retry-after'),
        TORRENTIO_RATE_LIMIT_COOLDOWN_MS,
      );
      torrentioRateLimitedUntil = Date.now() + cooldownMs;
      setMetadata(cacheKey, { flags }, Math.min(targetTtl, cooldownMs));
      return { badges: buildFeatureBadgesFromFlags(flags), cacheTtlMs: cooldownMs };
    }
    setMetadata(cacheKey, { flags }, targetTtl);
    return { badges: buildFeatureBadgesFromFlags(flags), cacheTtlMs: targetTtl };
  });
};

const shouldRenderRatingValue = (value: string | null | undefined) => {
  if (!value) return false;
  const normalized = value.trim();
  if (!normalized) return false;
  if (normalized.toUpperCase() === 'N/A') return false;

  const numericCandidate = normalized
    .replace('%', '')
    .split('/')[0]
    .replace(',', '.')
    .trim();
  const numericValue = Number(numericCandidate);
  if (!Number.isNaN(numericValue) && numericValue === 0) return false;

  return true;
};

const pickOutputFormat = (imageType: 'poster' | 'backdrop' | 'logo', acceptHeader?: string | null): OutputFormat => {
  if (imageType === 'logo') return 'png';
  const accept = (acceptHeader || '').toLowerCase();
  return accept.includes('image/webp') ? 'webp' : 'jpeg';
};

const outputFormatToContentType = (format: OutputFormat) => {
  if (format === 'webp') return 'image/webp';
  if (format === 'jpeg') return 'image/jpeg';
  return 'image/png';
};

const outputFormatToExtension = (format: OutputFormat) => {
  if (format === 'webp') return 'webp';
  if (format === 'jpeg') return 'jpg';
  return 'png';
};

const isTmdbAnimationTitle = (media: any) => {
  const genreIds = Array.isArray(media?.genre_ids) ? media.genre_ids : [];
  if (genreIds.some((genreId: any) => Number(genreId) === TMDB_ANIMATION_GENRE_ID)) {
    return true;
  }

  const genres = Array.isArray(media?.genres) ? media.genres : [];
  return genres.some((genre: any) => {
    if (Number(genre?.id) === TMDB_ANIMATION_GENRE_ID) {
      return true;
    }

    return String(genre?.name || '').trim().toLowerCase() === 'animation';
  });
};

const normalizeRatingValue = (value: unknown): string | null => {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    return formatRatingNumber(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const normalized = Number(trimmed.replace(',', '.'));
    if (!Number.isNaN(normalized) && Number.isFinite(normalized)) {
      return formatRatingNumber(normalized);
    }
  }

  if (value && typeof value === 'object') {
    const nested = value as { value?: unknown; rating?: unknown; score?: unknown };
    return normalizeRatingValue(nested.value ?? nested.rating ?? nested.score);
  }

  return null;
};

const isNegativeRatingValue = (value: string | null | undefined) => {
  if (!value) return false;
  const numericCandidate = value
    .replace('%', '')
    .split('/')[0]
    .replace(',', '.')
    .trim();
  const numericValue = Number(numericCandidate);
  return !Number.isNaN(numericValue) && numericValue < 0;
};

const collectMDBListRatings = (payload: any) => {
  const result = new Map<RatingPreference, string>();
  const items = payload?.ratings;
  if (!Array.isArray(items)) {
    const directMdbListScore = normalizeRatingValue(
      payload?.score ?? payload?.mdblist_score ?? payload?.mdblist ?? null
    );
    if (directMdbListScore && !isNegativeRatingValue(directMdbListScore)) {
      result.set('mdblist', directMdbListScore);
    }
    return result;
  }

  for (const item of items) {
    const sourceRaw = String(item?.source || item?.name || item?.provider || '');
    const source = normalizeRatingPreference(sourceRaw);
    if (!source || result.has(source)) continue;
    const rating = normalizeRatingValue(item?.value ?? item?.rating ?? item?.score);
    if (rating && !(source === 'mdblist' && isNegativeRatingValue(rating))) {
      result.set(source, rating);
    }
  }

  if (!result.has('mdblist')) {
    const directMdbListScore = normalizeRatingValue(
      payload?.score ?? payload?.mdblist_score ?? payload?.mdblist ?? null
    );
    if (directMdbListScore && !isNegativeRatingValue(directMdbListScore)) {
      result.set('mdblist', directMdbListScore);
    }
  }

  return result;
};

const getMdbListApiKeysInPriorityOrder = () => {
  if (!MDBLIST_API_KEYS.length) return [];

  const now = Date.now();
  const availableKeys = MDBLIST_API_KEYS.filter((apiKey) => {
    const limitedUntil = mdbListRateLimitedUntil.get(apiKey) || 0;
    return limitedUntil <= now;
  });
  const candidates = availableKeys.length ? availableKeys : MDBLIST_API_KEYS;
  const startIndex = mdbListApiKeyCursor % candidates.length;
  mdbListApiKeyCursor = (mdbListApiKeyCursor + 1) % candidates.length;

  return [...candidates.slice(startIndex), ...candidates.slice(0, startIndex)];
};

const markMdbListApiKeyRateLimited = (apiKey: string) => {
  mdbListRateLimitedUntil.set(apiKey, Date.now() + MDBLIST_RATE_LIMIT_COOLDOWN_MS);
};

const getMdbListResponseMessage = (payload: any) =>
  [
    payload?.error,
    payload?.message,
    payload?.detail,
    payload?.description,
    payload?.status_message,
    payload?.response,
  ]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .toLowerCase();

const isMdbListRateLimitedResponse = (response: CachedJsonResponse) => {
  if (response.status === 429) return true;

  const message = getMdbListResponseMessage(response.data);
  if (!message) return false;

  return ['rate limit', 'too many requests', 'quota', 'limit reached', 'limit exceeded', 'throttle'].some(
    (token) => message.includes(token)
  );
};

const shouldRetryMdbListWithAnotherKey = (response: CachedJsonResponse) => {
  if (isMdbListRateLimitedResponse(response)) return true;
  return response.status === 401 || response.status === 403 || response.status >= 500;
};

const getRatingCacheTtlMs = ({
  id,
  mediaType,
  releaseDate,
  defaultTtlMs,
  oldTtlMs,
}: {
  id: string;
  mediaType: 'movie' | 'tv';
  releaseDate?: string | null;
  defaultTtlMs: number;
  oldTtlMs: number;
}) => {
  let ttlMs = defaultTtlMs;

  if (mediaType === 'movie') {
    const normalizedReleaseDate = String(releaseDate || '').trim();
    if (normalizedReleaseDate) {
      const releaseTimestamp = Date.parse(`${normalizedReleaseDate}T00:00:00Z`);
      if (Number.isFinite(releaseTimestamp)) {
        const movieAgeMs = Date.now() - releaseTimestamp;
        if (movieAgeMs >= MDBLIST_OLD_MOVIE_AGE_DAYS * 24 * 60 * 60 * 1000) {
          ttlMs = Math.max(defaultTtlMs, oldTtlMs);
        }
      }
    }
  }

  return getDeterministicTtlMs(ttlMs, id);
};

const getMdbListCacheTtlMs = ({
  imdbId,
  mediaType,
  releaseDate,
}: {
  imdbId: string;
  mediaType: 'movie' | 'tv';
  releaseDate?: string | null;
}) => {
  return getRatingCacheTtlMs({
    id: imdbId,
    mediaType,
    releaseDate,
    defaultTtlMs: MDBLIST_CACHE_TTL_MS,
    oldTtlMs: MDBLIST_OLD_MOVIE_CACHE_TTL_MS,
  });
};

const fetchMdbListRatings = async ({
  imdbId,
  cacheTtlMs,
  phases,
  requestSource,
  imageType,
  cleanId,
  manualApiKey,
}: {
  imdbId: string;
  cacheTtlMs: number;
  phases: PhaseDurations;
  requestSource?: string;
  imageType?: string;
  cleanId?: string;
  manualApiKey?: string | null;
}) => {
  const normalizedImdbId = String(imdbId || '').trim();
  const apiKeys = manualApiKey ? [manualApiKey] : getMdbListApiKeysInPriorityOrder();

  if (!normalizedImdbId || !apiKeys.length) return null;

  for (const apiKey of apiKeys) {
    try {
      const apiKeyHash = sha1Hex(apiKey).slice(0, 12);
      const response = await fetchJsonCached(
        `mdblist:${normalizedImdbId}:key:${sha1Hex(apiKey)}`,
        `https://mdblist.com/api/?apikey=${encodeURIComponent(apiKey)}&i=${encodeURIComponent(normalizedImdbId)}`,
        cacheTtlMs,
        phases,
        'mdb'
      );

      if (isMdbListRateLimitedResponse(response)) {
        markMdbListApiKeyRateLimited(apiKey);
        continue;
      }

      if (!response.ok) {
        if (shouldRetryMdbListWithAnotherKey(response)) {
          continue;
        }
        return null;
      }

      return collectMDBListRatings(response.data);
    } catch {
    }
  }

  return null;
};

const normalizeKitsuId = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const asInt = Math.trunc(value);
    return asInt > 0 ? String(asInt) : null;
  }

  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.toLowerCase().startsWith('kitsu:') ? trimmed.slice(6) : trimmed;
  if (!normalized) return null;
  const match = normalized.match(/\d+/);
  return match ? match[0] : null;
};

const normalizeTmdbId = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const asInt = Math.trunc(value);
    return asInt > 0 ? String(asInt) : null;
  }

  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/\d+/);
  return match ? match[0] : null;
};

const normalizeMalId = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const asInt = Math.trunc(value);
    return asInt > 0 ? String(asInt) : null;
  }

  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.toLowerCase().startsWith('mal:')
    ? trimmed.slice(4)
    : trimmed.toLowerCase().startsWith('myanimelist:')
      ? trimmed.slice('myanimelist:'.length)
      : trimmed;
  if (!normalized) return null;
  const match = normalized.match(/\d+/);
  return match ? match[0] : null;
};

const extractKitsuIdFromAnimemapping = (payload: any) => {
  const candidates = [
    payload?.requested?.resolvedKitsuId,
    payload?.kitsu?.id,
    payload?.mappings?.ids?.kitsu,
    payload?.data?.requested?.resolvedKitsuId,
    payload?.data?.kitsu?.id,
    payload?.data?.mappings?.ids?.kitsu,
  ];

  for (const candidate of candidates) {
    const kitsuId = normalizeKitsuId(candidate);
    if (kitsuId) return kitsuId;
  }

  return null;
};

const extractAniListIdFromAnimemapping = (payload: any) => {
  const candidates = [
    payload?.requested?.resolvedAniListId,
    payload?.mappings?.ids?.anilist,
    payload?.data?.requested?.resolvedAniListId,
    payload?.data?.mappings?.ids?.anilist,
  ];

  for (const candidate of candidates) {
    const aniListId = normalizeTmdbId(candidate);
    if (aniListId) return aniListId;
  }

  return null;
};

const extractMalIdFromAnimemapping = (payload: any) => {
  const candidates = [
    payload?.requested?.resolvedMalId,
    payload?.requested?.resolvedMyAnimeListId,
    payload?.mappings?.ids?.mal,
    payload?.mappings?.ids?.myanimelist,
    payload?.data?.requested?.resolvedMalId,
    payload?.data?.requested?.resolvedMyAnimeListId,
    payload?.data?.mappings?.ids?.mal,
    payload?.data?.mappings?.ids?.myanimelist,
  ];

  for (const candidate of candidates) {
    const malId = normalizeMalId(candidate);
    if (malId) return malId;
  }

  return null;
};

const extractTmdbIdFromAnimemapping = (payload: any) => {
  const candidates = [
    payload?.mappings?.ids?.tmdb,
    payload?.data?.mappings?.ids?.tmdb,
  ];

  for (const candidate of candidates) {
    const tmdbId = normalizeTmdbId(candidate);
    if (tmdbId) return tmdbId;
  }

  return null;
};

const extractAnimeSubtypeFromAnimemapping = (payload: any) => {
  const candidates = [
    payload?.requested?.subtype,
    payload?.subtype,
    payload?.kitsu?.subtype,
    payload?.mappings?.subtype,
    payload?.data?.requested?.subtype,
    payload?.data?.subtype,
    payload?.data?.kitsu?.subtype,
    payload?.data?.mappings?.subtype,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    const normalized = candidate.trim().toLowerCase();
    if (normalized) return normalized;
  }

  return null;
};

const fetchAnimeReverseMappingPayload = async ({
  provider,
  externalId,
  season,
  phases,
}: {
  provider: AnimeMappingProvider;
  externalId: string;
  season?: string | null;
  phases: PhaseDurations;
}) => {
  const normalizedExternalId = externalId.trim();
  if (!normalizedExternalId) return null;

  const normalizedSeason = normalizeAnimeMappingSeason(season);
  const seasonQuery = normalizedSeason ? `?s=${encodeURIComponent(normalizedSeason)}` : '';
  const cacheKey = `anime:reverse:${provider}:${normalizedExternalId}:s:${normalizedSeason || '-'}`;
  const url = `https://animemapping.stremio.dpdns.org/${provider}/${encodeURIComponent(normalizedExternalId)}${seasonQuery}`;

  try {
    const response = await fetchJsonCached(
      cacheKey,
      url,
      KITSU_CACHE_TTL_MS,
      phases,
      'tmdb'
    );
    if (!response.ok) return null;
    const payload = response.data;
    if (payload?.ok === false) return null;
    return payload;
  } catch {
    return null;
  }
};

const fetchKitsuIdFromReverseMapping = async ({
  provider,
  externalId,
  season,
  phases,
}: {
  provider: AnimeMappingProvider;
  externalId: string;
  season?: string | null;
  phases: PhaseDurations;
}) => {
  const payload = await fetchAnimeReverseMappingPayload({
    provider,
    externalId,
    season,
    phases,
  });
  return payload ? extractKitsuIdFromAnimemapping(payload) : null;
};

const fetchAniListIdFromReverseMapping = async ({
  provider,
  externalId,
  season,
  phases,
}: {
  provider: AnimeMappingProvider;
  externalId: string;
  season?: string | null;
  phases: PhaseDurations;
}) => {
  const payload = await fetchAnimeReverseMappingPayload({
    provider,
    externalId,
    season,
    phases,
  });
  return payload ? extractAniListIdFromAnimemapping(payload) : null;
};

const fetchMalIdFromReverseMapping = async ({
  provider,
  externalId,
  season,
  phases,
}: {
  provider: AnimeMappingProvider;
  externalId: string;
  season?: string | null;
  phases: PhaseDurations;
}) => {
  const payload = await fetchAnimeReverseMappingPayload({
    provider,
    externalId,
    season,
    phases,
  });
  return payload ? extractMalIdFromAnimemapping(payload) : null;
};

const fetchTmdbIdFromReverseMapping = async ({
  provider,
  externalId,
  season,
  phases,
}: {
  provider: AnimeMappingProvider;
  externalId: string;
  season?: string | null;
  phases: PhaseDurations;
}) => {
  const normalizedExternalId = externalId.trim();
  if (!normalizedExternalId) return null;

  const normalizedSeason = normalizeAnimeMappingSeason(season);
  const seasonQuery = normalizedSeason ? `?s=${encodeURIComponent(normalizedSeason)}` : '';
  const cacheKey = `tmdb:reverse:${provider}:${normalizedExternalId}:s:${normalizedSeason || '-'}`;
  const url = `https://animemapping.stremio.dpdns.org/${provider}/${encodeURIComponent(normalizedExternalId)}${seasonQuery}`;

  try {
    const response = await fetchJsonCached(
      cacheKey,
      url,
      KITSU_CACHE_TTL_MS,
      phases,
      'tmdb'
    );
    if (!response.ok) return null;
    const payload = response.data;
    if (payload?.ok === false) return null;
    return extractTmdbIdFromAnimemapping(payload);
  } catch {
    return null;
  }
};

const fetchKitsuAnimeAttributes = async (kitsuId: string, phases: PhaseDurations) => {
  const normalizedKitsuId = String(kitsuId || '').trim();
  if (!normalizedKitsuId) return null;

  try {
    const response = await fetchJsonCached(
      `kitsu:anime:${normalizedKitsuId}:details`,
      `https://kitsu.io/api/edge/anime/${encodeURIComponent(normalizedKitsuId)}`,
      KITSU_CACHE_TTL_MS,
      phases,
      'mdb',
      {
        headers: {
          Accept: 'application/vnd.api+json',
        },
      }
    );
    if (!response.ok) return null;

    return response.data?.data?.attributes || null;
  } catch {
    return null;
  }
};

const pickKitsuImageUrl = (image: any) => {
  const candidates = [
    image?.original,
    image?.large,
    image?.medium,
    image?.small,
    image?.tiny,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    const normalized = candidate.trim();
    if (normalized) return normalized;
  }

  return null;
};

const normalizeKitsuTitleCandidate = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized || null;
};

const pickKitsuOriginalTitle = (attributes: any) => {
  const titles = attributes?.titles;
  const candidates = [
    titles?.en_jp,
    attributes?.canonicalTitle,
    titles?.ja_jp,
    titles?.en,
    titles?.en_us,
    typeof attributes?.slug === 'string' ? attributes.slug.replace(/-/g, ' ') : null,
  ];

  if (titles && typeof titles === 'object') {
    candidates.push(...Object.values(titles));
  }

  for (const candidate of candidates) {
    const normalized = normalizeKitsuTitleCandidate(candidate);
    if (normalized) return normalized;
  }

  return null;
};

const pickPosterTitleFromMedia = (
  media: any,
  mediaType: 'movie' | 'tv' | null,
  fallbackTitle?: string | null
) => {
  const candidates = [
    mediaType === 'movie' ? media?.title : mediaType === 'tv' ? media?.name : null,
    mediaType === 'movie' ? media?.original_title : mediaType === 'tv' ? media?.original_name : null,
    media?.title,
    media?.name,
    media?.original_title,
    media?.original_name,
    fallbackTitle,
  ];
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    const normalized = candidate.replace(/\s+/g, ' ').trim();
    if (normalized) return normalized;
  }
  return null;
};

const fetchKitsuFallbackAsset = async (
  kitsuId: string,
  imageType: 'poster' | 'backdrop' | 'logo',
  phases: PhaseDurations
) => {
  const normalizedKitsuId = String(kitsuId || '').trim();
  if (!normalizedKitsuId) return null;

  const attributes = await fetchKitsuAnimeAttributes(normalizedKitsuId, phases);
  if (!attributes) return null;

  const posterUrl = pickKitsuImageUrl(attributes?.posterImage);
  const coverUrl = pickKitsuImageUrl(attributes?.coverImage);
  const rating = normalizeRatingValue(attributes?.averageRating);
  const originalTitle = pickKitsuOriginalTitle(attributes);

  if (imageType === 'logo' && originalTitle) {
    const generatedLogo = buildGeneratedLogoDataUrl(originalTitle);
    return {
      imageUrl: generatedLogo.dataUrl,
      rating,
      title: originalTitle,
      logoAspectRatio: generatedLogo.aspectRatio,
    };
  }

  if (imageType === 'poster') {
    return {
      imageUrl: posterUrl || coverUrl,
      rating,
      title: originalTitle,
      logoAspectRatio: null,
    };
  }

  if (imageType === 'backdrop') {
    return {
      imageUrl: coverUrl || posterUrl,
      rating,
      title: originalTitle,
      logoAspectRatio: null,
    };
  }

  return {
    imageUrl: posterUrl || coverUrl,
    rating,
    title: originalTitle,
    logoAspectRatio: null,
  };
};

const fetchKitsuRating = async (kitsuId: string, phases: PhaseDurations) => {
  const attributes = await fetchKitsuAnimeAttributes(kitsuId, phases);
  return normalizeRatingValue(attributes?.averageRating);
};

const fetchAniListRating = async (aniListId: string, phases: PhaseDurations) => {
  const normalizedAniListId = String(aniListId || '').trim();
  const parsedAniListId = Number.parseInt(normalizedAniListId, 10);
  if (!Number.isFinite(parsedAniListId) || parsedAniListId <= 0) return null;

  try {
    const response = await fetchJsonCached(
      `anilist:anime:${parsedAniListId}:rating`,
      ANILIST_GRAPHQL_URL,
      KITSU_CACHE_TTL_MS,
      phases,
      'mdb',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          query: ANILIST_MEDIA_RATING_QUERY,
          variables: { id: parsedAniListId },
        }),
      }
    );
    if (!response.ok || response.data?.errors) return null;

    return normalizeRatingValue(
      response.data?.data?.Media?.averageScore ?? response.data?.data?.Media?.meanScore
    );
  } catch {
    return null;
  }
};

const fetchMyAnimeListRating = async (malId: string, phases: PhaseDurations) => {
  const normalizedMalId = normalizeMalId(malId);
  if (!normalizedMalId) return null;

  if (MYANIMELIST_CLIENT_ID) {
    try {
      const response = await fetchJsonCached(
        `mal:anime:${normalizedMalId}:rating:${sha1Hex(MYANIMELIST_CLIENT_ID)}`,
        `${MYANIMELIST_API_BASE_URL}/anime/${encodeURIComponent(normalizedMalId)}?fields=mean`,
        KITSU_CACHE_TTL_MS,
        phases,
        'mdb',
        {
          headers: {
            accept: 'application/json',
            'X-MAL-CLIENT-ID': MYANIMELIST_CLIENT_ID,
          },
        }
      );
      if (response.ok) {
        const rating = normalizeRatingValue(response.data?.mean);
        if (rating) {
          return rating;
        }
      }
    } catch {
    }
  }

  try {
    const response = await fetchJsonCached(
      `jikan:anime:${normalizedMalId}:score`,
      `${JIKAN_API_BASE_URL}/anime/${encodeURIComponent(normalizedMalId)}`,
      KITSU_CACHE_TTL_MS,
      phases,
      'mdb'
    );
    if (!response.ok) return null;

    return normalizeRatingValue(response.data?.data?.score);
  } catch {
    return null;
  }
};

const fetchTraktRating = async ({
  imdbId,
  mediaType,
  phases,
}: {
  imdbId: string;
  mediaType: 'movie' | 'tv';
  phases: PhaseDurations;
}) => {
  const normalizedImdbId = String(imdbId || '').trim();
  if (!normalizedImdbId || !TRAKT_CLIENT_ID) return null;

  const traktMediaType = mediaType === 'tv' ? 'shows' : 'movies';

  try {
    const response = await fetchJsonCached(
      `trakt:${traktMediaType}:${normalizedImdbId}:ratings:${sha1Hex(TRAKT_CLIENT_ID)}`,
      `${TRAKT_API_BASE_URL}/${traktMediaType}/${encodeURIComponent(normalizedImdbId)}/ratings`,
      MDBLIST_CACHE_TTL_MS,
      phases,
      'mdb',
      {
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'trakt-api-version': '2',
          'trakt-api-key': TRAKT_CLIENT_ID,
          'user-agent': BROWSER_LIKE_USER_AGENT,
          'accept-language': 'en-US,en;q=0.9',
        },
      },
      undefined,
      undiciFetch as unknown as JsonFetchImpl
    );
    if (!response.ok) return null;

    return normalizeRatingValue(response.data?.trakt?.rating ?? response.data?.rating);
  } catch {
    return null;
  }
};

const fetchJsonCached = async (
  key: string,
  url: string,
  ttlMs: number,
  phases: PhaseDurations,
  phase: keyof PhaseDurations,
  init?: RequestInit,
  observer?: CachedJsonNetworkObserver,
  fetchImpl: JsonFetchImpl = fetch
): Promise<CachedJsonResponse> => {


  const cached = getMetadata<CachedJsonResponse>(key);
  if (cached) {
    return cached;
  }

  return withDedupe(metadataInFlight, key, async () => {

    const fromCache = getMetadata<CachedJsonResponse>(key);
    if (fromCache) return fromCache;



    const fetchStartedAt = Date.now();
    let response: Response;
    try {
      response = await measurePhase(phases, phase, () =>
        fetchImpl(url, {
          cache: 'no-store',
          ...init,
        })
      );
    } catch (error) {
      if (observer?.onNetworkError) {
        try {
          await observer.onNetworkError({
            key,
            url,
            errorMessage: error instanceof Error ? error.message : 'Network error',
            durationMs: Date.now() - fetchStartedAt,
          });
        } catch {
        }
      }
      throw error;
    }

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    const payload: CachedJsonResponse = {
      ok: response.ok,
      status: response.status,
      data,
    };

    const tmdbHost = (() => {
      try {
        return new URL(url).hostname === 'api.themoviedb.org';
      } catch {
        return false;
      }
    })();

    if (!response.ok && tmdbHost && response.status === 401) {
      const statusMessage =
        typeof data?.status_message === 'string' ? data.status_message.toLowerCase() : '';
      if (statusMessage.includes('invalid') || statusMessage.includes('api key') || statusMessage.includes('unauthorized')) {
        throw new HttpError('TMDB API key is invalid or unauthorized', 401);
      }
      throw new HttpError('TMDB request is unauthorized', 401);
    }

    if (!response.ok && tmdbHost && response.status === 429) {
      throw new HttpError('TMDB rate limit reached. Try again later.', 429);
    }

    if (observer?.onNetworkResponse) {
      try {
        await observer.onNetworkResponse({
          key,
          url,
          status: response.status,
          ok: response.ok,
          data,
          durationMs: Date.now() - fetchStartedAt,
        });
      } catch {
      }
    }
    const failureTtlMs = Math.min(ttlMs, 2 * 60 * 1000);
    const targetTtlMs = response.ok ? ttlMs : failureTtlMs;
    setMetadata(key, payload, targetTtlMs);

    return payload;
  });
};

const normalizeImageLanguage = (value?: string | null) => {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized === 'us' || normalized === 'en-us') return 'en';
  if (normalized.includes('-')) return normalized.split('-')[0];
  return normalized;
};

const buildIncludeImageLanguage = (preferredLang: string, fallbackLang: string) => {
  const languages = [normalizeImageLanguage(preferredLang), normalizeImageLanguage(fallbackLang), 'null']
    .filter(Boolean) as string[];
  return [...new Set(languages)].join(',');
};

const pickByLanguageWithFallback = (
  items: any[] = [],
  preferredLang: string,
  fallbackLang: string
) => {
  if (!Array.isArray(items) || items.length === 0) return null;

  const preferred = normalizeImageLanguage(preferredLang);
  const fallback = normalizeImageLanguage(fallbackLang);

  if (preferred) {
    const preferredItem = items.find((item: any) => normalizeImageLanguage(item?.iso_639_1) === preferred);
    if (preferredItem) return preferredItem;
  }

  if (fallback) {
    const fallbackItem = items.find((item: any) => normalizeImageLanguage(item?.iso_639_1) === fallback);
    if (fallbackItem) return fallbackItem;
  }

  return items[0];
};

const isTextlessPosterSelection = (posters: any[] = [], selectedPoster?: any | null) => {
  if (!Array.isArray(posters) || posters.length === 0 || !selectedPoster?.file_path) return false;

  return posters.some(
    (poster: any) =>
      poster?.file_path === selectedPoster.file_path && normalizeImageLanguage(poster?.iso_639_1) === null
  );
};

const pickPosterByPreference = (
  posters: any[] = [],
  preference: PosterTextPreference,
  preferredLang: string,
  fallbackLang: string,
  originalPosterPath?: string | null
) => {
  if (!Array.isArray(posters) || posters.length === 0) return null;

  const canonicalOriginalPath =
    originalPosterPath ||
    pickByLanguageWithFallback(posters, preferredLang, fallbackLang)?.file_path ||
    posters[0]?.file_path ||
    null;
  const originalPoster = canonicalOriginalPath
    ? posters.find((poster: any) => poster.file_path === canonicalOriginalPath)
    : null;
  const fallbackOriginal = originalPoster || (canonicalOriginalPath ? { file_path: canonicalOriginalPath } : posters[0]);
  const alternativePosters = posters.filter(
    (poster: any) => poster.file_path !== canonicalOriginalPath
  );

  if (preference === 'clean') {
    return (
      posters.find((poster: any) => !poster.iso_639_1) ||
      pickByLanguageWithFallback(posters, preferredLang, fallbackLang) ||
      fallbackOriginal
    );
  }

  if (preference === 'original') {
    return fallbackOriginal;
  }

  return (
    pickByLanguageWithFallback(alternativePosters, preferredLang, fallbackLang) ||
    alternativePosters[0] ||
    fallbackOriginal
  );
};

const pickBackdropByPreference = (
  backdrops: any[] = [],
  preference: PosterTextPreference,
  preferredLang: string,
  fallbackLang: string,
  originalBackdropPath?: string | null
) => {
  if (!Array.isArray(backdrops) || backdrops.length === 0) return null;

  const canonicalOriginalPath =
    originalBackdropPath ||
    pickByLanguageWithFallback(backdrops, preferredLang, fallbackLang)?.file_path ||
    backdrops[0]?.file_path ||
    null;
  const originalBackdrop = canonicalOriginalPath
    ? backdrops.find((backdrop: any) => backdrop.file_path === canonicalOriginalPath)
    : null;
  const fallbackOriginal =
    originalBackdrop || (canonicalOriginalPath ? { file_path: canonicalOriginalPath } : backdrops[0]);
  const alternativeBackdrops = backdrops.filter(
    (backdrop: any) => backdrop.file_path !== canonicalOriginalPath
  );

  if (preference === 'clean') {
    return (
      backdrops.find((backdrop: any) => !backdrop.iso_639_1) ||
      pickByLanguageWithFallback(backdrops, preferredLang, fallbackLang) ||
      fallbackOriginal
    );
  }

  if (preference === 'original') {
    return fallbackOriginal;
  }

  return (
    pickByLanguageWithFallback(alternativeBackdrops, preferredLang, fallbackLang) ||
    alternativeBackdrops[0] ||
    fallbackOriginal
  );
};

type FastRenderInput = {
  imageType: 'poster' | 'backdrop' | 'logo';
  ratingPresentation: RatingPresentation;
  aggregateRatingSource: AggregateRatingSource;
  blockbusterDensity: BlockbusterDensity;
  outputFormat: OutputFormat;
  imgUrl: string;
  outputWidth: number;
  outputHeight: number;
  imageWidth?: number;
  imageHeight?: number;
  finalOutputHeight: number;
  logoBadgeBandHeight: number;
  logoBadgeMaxWidth: number;
  logoBadgesPerRow: number;
  posterRowHorizontalInset: number;
  posterTitleText?: string | null;
  posterLogoUrl?: string | null;
  editorialOverlay?: EditorialRatingOverlay | null;
  genreBadge?: GenreBadgeSpec | null;
  badgeIconSize: number;
  badgeFontSize: number;
  badgePaddingX: number;
  badgePaddingY: number;
  badgeGap: number;
  badgeTopOffset: number;
  badgeBottomOffset: number;
  badges: RatingBadge[];
  qualityBadges: RatingBadge[];
  qualityBadgesSide: QualityBadgesSide;
  posterQualityBadgesPosition: PosterQualityBadgesPosition;
  qualityBadgesStyle: QualityBadgeStyle;
  qualityBadgeScalePercent: number;
  posterRatingsLayout: PosterRatingLayout;
  posterRatingsMaxPerSide: number | null;
  backdropRatingsLayout: BackdropRatingLayout;
  sideRatingsPosition: SideRatingPosition;
  sideRatingsOffset: number;
  ratingStyle: RatingStyle;
  logoBackground: LogoBackground;
  topBadges: RatingBadge[];
  bottomBadges: RatingBadge[];
  leftBadges: RatingBadge[];
  rightBadges: RatingBadge[];
  posterTopRows?: RatingBadge[][];
  posterBottomRows?: RatingBadge[][];
  backdropRows?: RatingBadge[][];
  blockbusterBlurbs?: BlockbusterBlurb[];
  cacheControl: string;
};

let sharpFactoryPromise: Promise<any | null> | null = null;
let sharpConfigured = false;
const configureSharp = (sharp: any) => {
  if (sharpConfigured || !sharp) return;
  sharpConfigured = true;

  const concurrency = parseNonNegativeInt(process.env.ERDB_SHARP_CONCURRENCY);
  if (concurrency !== null && concurrency > 0) {
    sharp.concurrency(concurrency);
  } else {
    
    sharp.concurrency(2);
  }

  const cacheOptions: { memory?: number; files?: number; items?: number } = {};
  const memory = parseNonNegativeInt(process.env.ERDB_SHARP_CACHE_MEMORY_MB);
  const files = parseNonNegativeInt(process.env.ERDB_SHARP_CACHE_FILES);
  const items = parseNonNegativeInt(process.env.ERDB_SHARP_CACHE_ITEMS);
  cacheOptions.memory = memory !== null ? memory : 128;
  cacheOptions.files = files !== null ? files : 200;
  cacheOptions.items = items !== null ? items : 100;

  sharp.cache(cacheOptions);
};
const getSharpFactory = async () => {
  if (!sharpFactoryPromise) {
    sharpFactoryPromise = import('sharp')
      .then((mod: any) => {
        const sharp = mod.default || mod;
        configureSharp(sharp);
        return sharp;
      })
      .catch((error) => {
        throw new Error(
          `sharp is required for ERDB image rendering: ${error instanceof Error ? error.message : 'unknown error'}`
        );
      });
  }
  return sharpFactoryPromise;
};

const bufferToArrayBuffer = (buffer: Buffer): ArrayBuffer =>
  buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;

const toImageContentType = (value: string | null) => {
  const normalized = (value || '').split(';')[0]?.trim().toLowerCase();
  return normalized?.startsWith('image/') ? normalized : 'image/png';
};

const buildSourceImageFallbackCacheControl = (ttlMs: number) => {
  const ttlSeconds = Math.max(60, Math.floor(ttlMs / 1000));
  return `public, max-age=${ttlSeconds}, s-maxage=${ttlSeconds}, stale-while-revalidate=3600`;
};

const isTmdbSourceImageUrl = (value: string) => {
  try {
    return new URL(value).hostname === 'image.tmdb.org';
  } catch {
    return false;
  }
};

const buildProviderIconStorageKey = (iconUrl: string) =>
  `icons/${PROVIDER_ICON_CACHE_VERSION}/${sha1Hex(iconUrl)}.png`;
const buildProviderIconMemoryCacheKey = (iconUrl: string) =>
  `icon:${PROVIDER_ICON_CACHE_VERSION}:${iconUrl}`;

const isLightNeutralPixel = (r: number, g: number, b: number, alpha: number) => {
  if (alpha < 200) return false;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max >= 225 && max - min <= 35;
};

const stripCornerBackgroundFromIcon = async (sharp: any, buffer: Buffer) => {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixels = Buffer.from(data);
  const { width, height, channels } = info;
  if (!width || !height || channels < 4) {
    return buffer;
  }

  const indexOf = (x: number, y: number) => (y * width + x) * channels;
  const cornerQueue: Array<[number, number]> = [];
  const seen = new Uint8Array(width * height);
  const corners: Array<[number, number]> = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];

  for (const [x, y] of corners) {
    const index = indexOf(x, y);
    if (isLightNeutralPixel(pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3])) {
      cornerQueue.push([x, y]);
    }
  }

  if (cornerQueue.length === 0) {
    return buffer;
  }

  let removedPixelCount = 0;
  for (let queueIndex = 0; queueIndex < cornerQueue.length; queueIndex++) {
    const [x, y] = cornerQueue[queueIndex]!;
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const seenIndex = y * width + x;
    if (seen[seenIndex]) continue;
    seen[seenIndex] = 1;

    const index = indexOf(x, y);
    if (!isLightNeutralPixel(pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3])) {
      continue;
    }

    pixels[index + 3] = 0;
    removedPixelCount++;

    cornerQueue.push([x + 1, y]);
    cornerQueue.push([x - 1, y]);
    cornerQueue.push([x, y + 1]);
    cornerQueue.push([x, y - 1]);
  }

  if (removedPixelCount === 0) {
    return buffer;
  }

  return sharp(pixels, { raw: { width, height, channels } })
    .png({ compressionLevel: 6 })
    .toBuffer();
};

const readProviderIconFromStorage = async (iconUrl: string): Promise<string | null> => {
  if (!isObjectStorageConfigured()) return null;
  try {
    const payload = await getCachedImageFromObjectStorage(buildProviderIconStorageKey(iconUrl));
    if (!payload) return null;
    const buffer = Buffer.from(payload.body);
    const contentType = toImageContentType(payload.contentType);
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
};

const writeProviderIconToStorage = async (iconUrl: string, buffer: Buffer) => {
  if (!isObjectStorageConfigured()) return;
  try {
    await putCachedImageToObjectStorage(buildProviderIconStorageKey(iconUrl), {
      body: bufferToArrayBuffer(buffer),
      contentType: 'image/png',
      cacheControl: buildSourceImageFallbackCacheControl(PROVIDER_ICON_CACHE_TTL_MS),
    });
  } catch {
  }
};

const pickTmdbImageSize = (imageType: 'poster' | 'backdrop' | 'logo', outputWidth: number) => {
  if (imageType === 'poster') return 'w500';
  if (imageType === 'backdrop') return 'w1280';
  if (imageType === 'logo') {
    return outputWidth <= 500 ? 'w500' : 'original';
  }
  return 'original';
};

const buildTmdbImageUrl = (
  imageType: 'poster' | 'backdrop' | 'logo',
  imgPath: string,
  outputWidth: number
) => {
  const size = pickTmdbImageSize(imageType, outputWidth);
  return `https://image.tmdb.org/t/p/${size}${imgPath}`;
};

const buildCinemetaPosterUrl = (imdbId: string) =>
  `https://images.metahub.space/poster/medium/${encodeURIComponent(imdbId)}/img`;

const fetchSourceImageUncached = async (
  imgUrl: string,
  fallbackTtlMs: number
): Promise<RenderedImagePayload> => {
  const sourceResponse = await fetch(imgUrl, { cache: 'no-store' });
  if (!sourceResponse.ok) {
    throw new HttpError('Image not found', sourceResponse.status || 404);
  }

  return {
    body: await sourceResponse.arrayBuffer(),
    contentType: sourceResponse.headers.get('content-type') || 'image/jpeg',
    cacheControl:
      sourceResponse.headers.get('cache-control') || buildSourceImageFallbackCacheControl(fallbackTtlMs),
  };
};

const getSourceImagePayload = async (
  imgUrl: string,
  fallbackTtlMs = TMDB_CACHE_TTL_MS
): Promise<RenderedImagePayload> => {
  const normalizedImgUrl = String(imgUrl || '').trim();
  if (!normalizedImgUrl) {
    throw new HttpError('Image not found', 404);
  }

  const sharedCacheable = isTmdbSourceImageUrl(normalizedImgUrl);
  if (!sharedCacheable) {
    return fetchSourceImageUncached(normalizedImgUrl, fallbackTtlMs);
  }

  const sourceHash = sha1Hex(normalizedImgUrl);
  const sourceObjectStorageKey = `source/${sourceHash}`;
  const objectStorageEnabled = isObjectStorageConfigured();

  const readSharedSourcePayload = async () => {
    if (!objectStorageEnabled) return null;


    const objectPayload = await getCachedImageFromObjectStorage(sourceObjectStorageKey);
    if (!objectPayload) {
      return null;
    }

    const payload: RenderedImagePayload = {
      body: objectPayload.body,
      contentType: objectPayload.contentType,
      cacheControl: objectPayload.cacheControl,
    };
    return payload;
  };

  if (objectStorageEnabled) {
    try {
      const sharedPayload = await readSharedSourcePayload();
      if (sharedPayload) {
        return sharedPayload;
      }
    } catch {
    }
  }

  return withDedupe(sourceImageInFlight, normalizedImgUrl, async () => {
    if (objectStorageEnabled) {
      try {
        const sharedPayload = await readSharedSourcePayload();
        if (sharedPayload) {
          return sharedPayload;
        }
      } catch {
      }
    }


    const payload = await fetchSourceImageUncached(normalizedImgUrl, fallbackTtlMs);

    if (objectStorageEnabled) {
      try {
        await putCachedImageToObjectStorage(sourceObjectStorageKey, payload);
      } catch {
      }
    }

    return payload;
  });
};

type FanartImageAsset = {
  url?: string | null;
  lang?: string | null;
  likes?: string | number | null;
};

const normalizeFanartLanguage = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === '00' || normalized === 'n/a') return null;
  return normalized;
};

const rankFanartAsset = (
  asset: FanartImageAsset,
  requestedLang: string,
  fallbackLang: string,
  index: number
) => {
  const assetLang = normalizeFanartLanguage(asset.lang);
  const requested = normalizeImageLanguage(requestedLang);
  const fallback = normalizeImageLanguage(fallbackLang);
  const likes =
    typeof asset.likes === 'number'
      ? asset.likes
      : typeof asset.likes === 'string'
        ? Number.parseInt(asset.likes, 10) || 0
        : 0;

  const languageScore =
    assetLang && requested && assetLang === requested
      ? 0
      : assetLang && fallback && assetLang === fallback
        ? 1
        : assetLang === null
          ? 2
          : 3;

  return {
    asset,
    languageScore,
    likes,
    index,
  };
};

const selectFanartAssets = (
  items: FanartImageAsset[] = [],
  requestedLang: string,
  fallbackLang: string
) =>
  items
    .filter((item) => typeof item?.url === 'string' && item.url.trim())
    .map((item, index) => rankFanartAsset(item, requestedLang, fallbackLang, index))
    .sort((left, right) => {
      if (left.languageScore !== right.languageScore) return left.languageScore - right.languageScore;
      if (left.likes !== right.likes) return right.likes - left.likes;
      return left.index - right.index;
    })
    .map((entry) => entry.asset);

const fanartAssetsToUrls = (items: FanartImageAsset[] = []) =>
  [...new Set(
    items
      .map((item) => (typeof item?.url === 'string' ? item.url.trim() : ''))
      .filter(Boolean)
  )];

const pickFanartUrlByPreference = (
  urls: string[] = [],
  preference: PosterTextPreference
) => {
  if (!Array.isArray(urls) || urls.length === 0) return null;
  if (preference === 'alternative') {
    return urls[1] || urls[0] || null;
  }
  return urls[0] || null;
};

const fetchFanartArtwork = async ({
  mediaType,
  tmdbId,
  tvdbId,
  fanartKey,
  fanartClientKey,
  requestedLang,
  fallbackLang,
  phases,
}: {
  mediaType: 'movie' | 'tv';
  tmdbId: string;
  tvdbId?: string | null;
  fanartKey: string;
  fanartClientKey?: string | null;
  requestedLang: string;
  fallbackLang: string;
  phases: PhaseDurations;
}) => {
  const normalizedApiKey = String(fanartKey || '').trim();
  if (!normalizedApiKey) return null;

  const lookupId =
    mediaType === 'movie' ? String(tmdbId || '').trim() : String(tvdbId || '').trim();
  if (!lookupId) return null;

  const endpoint =
    mediaType === 'movie'
      ? `https://webservice.fanart.tv/v3/movies/${lookupId}?api_key=${encodeURIComponent(normalizedApiKey)}`
      : `https://webservice.fanart.tv/v3/tv/${lookupId}?api_key=${encodeURIComponent(normalizedApiKey)}`;
  const url = fanartClientKey
    ? `${endpoint}&client_key=${encodeURIComponent(String(fanartClientKey).trim())}`
    : endpoint;

  const response = await fetchJsonCached(
    `fanart:${mediaType}:${lookupId}:key:${sha1Hex(normalizedApiKey)}:client:${sha1Hex(String(fanartClientKey || ''))}`,
    url,
    TMDB_CACHE_TTL_MS,
    phases,
    'fanart'
  );
  if (!response.ok || !response.data || typeof response.data !== 'object') {
    return null;
  }

  const payload = response.data as Record<string, FanartImageAsset[] | unknown>;
  const posterCandidates = mediaType === 'movie'
    ? ((payload.movieposter as FanartImageAsset[] | undefined) || [])
    : ((payload.tvposter as FanartImageAsset[] | undefined) || []);
  const backdropCandidates = mediaType === 'movie'
    ? ((payload.moviebackground as FanartImageAsset[] | undefined) || [])
    : ((payload.showbackground as FanartImageAsset[] | undefined) || []);
  const logoCandidates = mediaType === 'movie'
    ? [
        ...(((payload.hdmovielogo as FanartImageAsset[] | undefined) || [])),
        ...(((payload.movielogo as FanartImageAsset[] | undefined) || [])),
      ]
    : [
        ...(((payload.hdtvlogo as FanartImageAsset[] | undefined) || [])),
        ...(((payload.clearlogo as FanartImageAsset[] | undefined) || [])),
        ...(((payload.tvlogo as FanartImageAsset[] | undefined) || [])),
      ];

  const selectedPosters = selectFanartAssets(posterCandidates, requestedLang, fallbackLang);
  const selectedBackdrops = selectFanartAssets(backdropCandidates, requestedLang, fallbackLang);
  const selectedLogos = selectFanartAssets(logoCandidates, requestedLang, fallbackLang);
  const posterUrls = fanartAssetsToUrls(selectedPosters);
  const backdropUrls = fanartAssetsToUrls(selectedBackdrops);
  const logoUrls = fanartAssetsToUrls(selectedLogos);
  if (posterUrls.length === 0 && backdropUrls.length === 0 && logoUrls.length === 0) return null;

  return {
    posterUrls,
    backdropUrls,
    logoUrls,
  };
};

const getRemoteImageAspectRatio = async (imgUrl: string): Promise<number | null> => {
  const normalizedImgUrl = String(imgUrl || '').trim();
  if (!normalizedImgUrl) return null;

  try {
    const sourcePayload = await getSourceImagePayload(normalizedImgUrl);
    const sourceBuffer = Buffer.from(sourcePayload.body);
    const sharp = await getSharpFactory();
    const metadata = await sharp(sourceBuffer).metadata();
    if (!metadata.width || !metadata.height || metadata.height <= 0) {
      return null;
    }
    return metadata.width / metadata.height;
  } catch {
    return null;
  }
};

const getProviderIconDataUri = async (iconUrl: string): Promise<string | null> => {
  const normalizedIconUrl = iconUrl.trim();
  if (!normalizedIconUrl) return null;
  if (normalizedIconUrl.startsWith('data:')) {
    return normalizedIconUrl;
  }

  const memoryCacheKey = buildProviderIconMemoryCacheKey(normalizedIconUrl);

  const localCached = getMetadata<string>(memoryCacheKey);
  if (localCached) {
    return localCached;
  }

  return withDedupe(providerIconInFlight, normalizedIconUrl, async () => {
    const warmLocal = getMetadata<string>(memoryCacheKey);
    if (warmLocal) return warmLocal;

    const storageCached = await readProviderIconFromStorage(normalizedIconUrl);
    if (storageCached) {
      setMetadata(memoryCacheKey, storageCached, PROVIDER_ICON_CACHE_TTL_MS);
      return storageCached;
    }

    try {
      const response = await fetch(normalizedIconUrl, { cache: 'no-store' });
      if (!response.ok) return null;

      const sourceBuffer = Buffer.from(await response.arrayBuffer());
      const sharp = await getSharpFactory();
      const resizedBuffer = await sharp(sourceBuffer)
        .resize(96, 96, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png({ compressionLevel: 6 })
        .toBuffer();
      const outputBuffer = await stripCornerBackgroundFromIcon(sharp, resizedBuffer);
      const outputContentType = 'image/png';

      const dataUri = `data:${outputContentType};base64,${outputBuffer.toString('base64')}`;
      setMetadata(memoryCacheKey, dataUri, PROVIDER_ICON_CACHE_TTL_MS);
      await writeProviderIconToStorage(normalizedIconUrl, outputBuffer);

      return dataUri;
    } catch {
      return null;
    }
  });
};

const decodeDataUriBuffer = (dataUri: string) => {
  const normalized = dataUri.trim();
  const match = normalized.match(/^data:([^;,]+)?(?:;charset=[^;,]+)?(;base64)?,([\s\S]+)$/i);
  if (!match) return null;
  const payload = match[3] || '';
  if (match[2]) {
    try {
      return Buffer.from(payload, 'base64');
    } catch {
      return null;
    }
  }

  try {
    return Buffer.from(decodeURIComponent(payload), 'utf8');
  } catch {
    return null;
  }
};

const shouldUseNeutralGlassPlateForIcon = async (iconDataUri: string | null) => {
  const normalizedIconDataUri = String(iconDataUri || '').trim();
  if (!normalizedIconDataUri.startsWith('data:')) return false;

  const sourceBuffer = decodeDataUriBuffer(normalizedIconDataUri);
  if (!sourceBuffer) return false;

  try {
    const sharp = await getSharpFactory();
    const { data, info } = await sharp(sourceBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    if (!info.width || !info.height || info.channels < 4) {
      return false;
    }

    let minX = info.width;
    let minY = info.height;
    let maxX = -1;
    let maxY = -1;
    let visiblePixelCount = 0;

    for (let y = 0; y < info.height; y += 1) {
      for (let x = 0; x < info.width; x += 1) {
        const alpha = data[(y * info.width + x) * info.channels + 3];
        if (alpha < 40) continue;
        visiblePixelCount += 1;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }

    if (visiblePixelCount === 0 || maxX < minX || maxY < minY) {
      return false;
    }

    const boundsWidth = maxX - minX + 1;
    const boundsHeight = maxY - minY + 1;
    const boundsArea = boundsWidth * boundsHeight;
    if (boundsArea <= 0) return false;

    const visibleCoverage = visiblePixelCount / boundsArea;
    return visibleCoverage < 0.82;
  } catch {
    return false;
  }
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const splitTitleForGeneratedLogo = (title: string) => {
  const normalized = title.replace(/\s+/g, ' ').trim();
  if (!normalized) return ['Kitsu'];

  const words = normalized.split(' ').filter(Boolean);
  if (words.length <= 2 && normalized.length <= 24) return [normalized];

  const maxLines = 4;
  const targetLineLength =
    normalized.length >= 56 ? 13 : normalized.length >= 42 ? 15 : normalized.length >= 30 ? 17 : 19;
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    const currentLimit = lines.length === 0 ? targetLineLength + 1 : targetLineLength;
    if (currentLine && nextLine.length > currentLimit && lines.length < maxLines - 1) {
      lines.push(currentLine);
      currentLine = word;
      continue;
    }
    currentLine = nextLine;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length > maxLines) {
    const head = lines.slice(0, maxLines - 1);
    const tail = lines.slice(maxLines - 1).join(' ');
    return [...head, tail];
  }

  return lines;
};

const estimateGeneratedLogoLineWidth = (line: string, fontSize: number) =>
  [...line].reduce((acc, ch) => {
    if (ch === ' ') return acc + fontSize * 0.30;
    if (/[WMwm]/.test(ch)) return acc + fontSize * 0.92;
    if (/[A-Z]/.test(ch)) return acc + fontSize * 0.74;
    if (/[0-9]/.test(ch)) return acc + fontSize * 0.66;
    if (/[\-_:/'".,!?&]/.test(ch)) return acc + fontSize * 0.36;
    return acc + fontSize * 0.60;
  }, 0);

const buildGeneratedLogoDataUrl = (title: string) => {
  const lines = splitTitleForGeneratedLogo(title);
  const maxLineLength = Math.max(...lines.map((line) => line.length), 1);
  const width = Math.max(
    760,
    Math.min(LOGO_MAX_WIDTH, Math.round(maxLineLength * 68 + 280))
  );
  const height = LOGO_BASE_HEIGHT;
  const aspectRatio = width / height;
  const baseFontSize = lines.length === 1 ? 172 : lines.length === 2 ? 136 : lines.length === 3 ? 108 : 86;
  const compressedFontSize = Math.max(58, Math.floor((width - 160) / Math.max(maxLineLength, 1) * 1.72));
  const preliminaryFontSize = Math.min(baseFontSize, compressedFontSize);
  const availableLineWidth = Math.max(420, width - 150);
  const longestEstimatedLineWidth = Math.max(
    ...lines.map((line) => estimateGeneratedLogoLineWidth(line, preliminaryFontSize)),
    1
  );
  const widthFitScale = Math.min(1, availableLineWidth / longestEstimatedLineWidth);
  const fontSize = Math.max(54, Math.floor(preliminaryFontSize * widthFitScale));
  const lineHeight = Math.round(fontSize * 0.96);
  const totalTextHeight = lineHeight * (lines.length - 1);
  const startY = Math.round(height / 2 - totalTextHeight / 2 + fontSize * 0.34);
  const strokeWidth = Math.max(4, Math.round(fontSize * 0.07));
  const letterSpacing = Math.max(1, Math.round(fontSize * 0.015));
  const tspans = lines
    .map((line, index) => {
      const y = startY + index * lineHeight;
      const estimatedLineWidth = estimateGeneratedLogoLineWidth(line, fontSize);
      const textLength =
        estimatedLineWidth > availableLineWidth
          ? ` textLength="${availableLineWidth}" lengthAdjust="spacingAndGlyphs"`
          : '';
      return `<tspan x="${Math.round(width / 2)}" y="${y}"${textLength}>${escapeXml(line)}</tspan>`;
    })
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs>
  <filter id="logo-shadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.38" />
  </filter>
</defs>
<text x="${Math.round(width / 2)}" y="${startY}" text-anchor="middle" font-family="Arial Narrow, Trebuchet MS, Arial, sans-serif" font-size="${fontSize}" font-weight="800" font-style="italic" letter-spacing="${letterSpacing}" fill="#ffffff" stroke="rgba(0,0,0,0.65)" stroke-width="${strokeWidth}" paint-order="stroke fill" filter="url(#logo-shadow)">${tspans}</text>
</svg>`;
  return {
    dataUrl: `data:image/svg+xml,${encodeURIComponent(svg)}`,
    aspectRatio,
  };
};

const splitTitleForPosterText = (title: string) => {
  const lines = splitTitleForGeneratedLogo(title);
  if (lines.length <= 2) return lines;
  return [lines[0], lines.slice(1).join(' ')];
};

const buildPosterTitleSvg = (title: string, maxWidth: number) => {
  const normalized = title.replace(/\s+/g, ' ').trim();
  if (!normalized) return null;
  const lines = splitTitleForPosterText(normalized);
  const width = Math.max(260, Math.round(maxWidth));
  const availableLineWidth = Math.max(220, width - 48);
  const maxLineLength = Math.max(...lines.map((line) => line.length), 1);
  const baseFontSize = lines.length === 1 ? 64 : 54;
  const compressedFontSize = Math.floor((availableLineWidth / Math.max(1, maxLineLength)) * 1.35);
  const preliminaryFontSize = Math.min(baseFontSize, compressedFontSize);
  const longestEstimatedLineWidth = Math.max(
    ...lines.map((line) => estimateGeneratedLogoLineWidth(line, preliminaryFontSize)),
    1
  );
  const widthFitScale = Math.min(1, availableLineWidth / longestEstimatedLineWidth);
  const fontSize = Math.max(26, Math.floor(preliminaryFontSize * widthFitScale));
  const lineHeight = Math.round(fontSize * 1.08);
  const height = Math.round(lineHeight * lines.length);
  const startY = Math.round(fontSize * 0.9);
  const strokeWidth = Math.max(2, Math.round(fontSize * 0.1));
  const letterSpacing = Math.max(1, Math.round(fontSize * 0.015));
  const tspans = lines
    .map((line, index) => {
      const y = startY + index * lineHeight;
      const estimatedLineWidth = estimateGeneratedLogoLineWidth(line, fontSize);
      const textLength =
        estimatedLineWidth > availableLineWidth
          ? ` textLength="${availableLineWidth}" lengthAdjust="spacingAndGlyphs"`
          : '';
      return `<tspan x="${Math.round(width / 2)}" y="${y}"${textLength}>${escapeXml(line)}</tspan>`;
    })
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs>
  <filter id="poster-title-shadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.5" />
  </filter>
</defs>
<text x="${Math.round(width / 2)}" y="${startY}" text-anchor="middle" font-family="'Noto Sans','DejaVu Sans',Arial,sans-serif" font-size="${fontSize}" font-weight="800" letter-spacing="${letterSpacing}" fill="#ffffff" stroke="rgba(0,0,0,0.65)" stroke-width="${strokeWidth}" paint-order="stroke fill" filter="url(#poster-title-shadow)">${tspans}</text>
</svg>`;
  return { svg, width, height };
};

const chunkBy = <T,>(items: T[], size: number): T[][] => {
  if (size <= 0) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

type BadgeLayoutMetrics = {
  iconSize: number;
  fontSize: number;
  paddingX: number;
  paddingY: number;
  gap: number;
};
type PosterBadgeGroups = {
  topBadges: RatingBadge[];
  bottomBadges: RatingBadge[];
  leftBadges: RatingBadge[];
  rightBadges: RatingBadge[];
};
type BackdropBadgeRegion = {
  left: number;
  width: number;
};
const DEFAULT_BADGE_MIN_METRICS: BadgeLayoutMetrics = {
  iconSize: 24,
  fontSize: 18,
  paddingX: 8,
  paddingY: 6,
  gap: 6,
};
const scaleBadgeMetrics = (
  metrics: BadgeLayoutMetrics,
  scalePercent: number = DEFAULT_BADGE_SCALE_PERCENT,
): BadgeLayoutMetrics => {
  const ratio = Math.max(0.7, scalePercent / 100);
  return {
    iconSize: Math.max(18, Math.round(metrics.iconSize * ratio)),
    fontSize: Math.max(14, Math.round(metrics.fontSize * ratio)),
    paddingX: Math.max(6, Math.round(metrics.paddingX * ratio)),
    paddingY: Math.max(5, Math.round(metrics.paddingY * ratio)),
    gap: Math.max(4, Math.round(metrics.gap * ratio)),
  };
};

const getBadgeHeightFromMetrics = (
  metrics: BadgeLayoutMetrics,
  ratingStyle: RatingStyle = DEFAULT_RATING_STYLE,
) =>
  ratingStyle === 'stacked'
    ? getStackedBadgeHeight(metrics)
    : metrics.iconSize + metrics.paddingY * 2;

const resolveBadgeIconRenderSize = ({
  iconSlotSize,
  badgeHeight,
  iconScalePercent = DEFAULT_PROVIDER_ICON_SCALE_PERCENT,
}: {
  iconSlotSize: number;
  badgeHeight: number;
  iconScalePercent?: number;
}) => {
  const ratio = Math.max(0.7, Math.min(1.45, iconScalePercent / 100));
  const scaledSize = Math.round(iconSlotSize * ratio);
  return Math.max(16, Math.min(badgeHeight - 4, scaledSize));
};
const getBadgeTextRightInset = (
  value: string,
  fontSize: number,
  paddingX: number,
  compactText = false
) => {
  const normalized = value.trim();
  const baseInset = Math.max(
    compactText ? 7 : 12,
    Math.round(fontSize * (compactText ? 0.28 : 0.38)) + Math.round(paddingX * 0.75)
  );
  const trailingPercentInset =
    normalized.endsWith('%')
      ? Math.max(
          compactText ? 9 : 12,
          Math.round(fontSize * (compactText ? 0.3 : 0.28))
        )
      : 0;
  return baseInset + trailingPercentInset;
};

const estimateBadgeTextWidth = (
  value: string,
  fontSize: number,
  compactText = false
) => {
  const normalized = value.trim();
  if (!normalized) {
    return Math.round(fontSize * (compactText ? 1.14 : 1.3));
  }
  const measureChar = (ch: string) => {
    if (/[0-9]/.test(ch)) return fontSize * (compactText ? 0.51 : 0.56);
    if (ch === '%') return fontSize * (compactText ? 0.56 : 0.62);
    if (ch === '/' || ch === '|') return fontSize * (compactText ? 0.34 : 0.40);
    if (ch === '.' || ch === ',' || ch === ':') return fontSize * (compactText ? 0.22 : 0.28);
    if (ch === ' ') return fontSize * (compactText ? 0.24 : 0.30);
    return fontSize * (compactText ? 0.54 : 0.58);
  };
  const measuredTextWidth = [...normalized].reduce((acc, ch) => acc + measureChar(ch), 0);
  const safetyRightPadding = Math.max(
    compactText ? 1 : 2,
    Math.round(
      fontSize *
      (normalized.endsWith('%') || normalized.includes('/')
        ? compactText ? 0.20 : 0.28
        : compactText ? 0.04 : 0.06)
    )
  );
  const structureWidth = Math.round(normalized.length * fontSize * (compactText ? 0.38 : 0.44));
  const isShortDecimalValue = /^\d+(?:[.,]\d)?$/.test(normalized) && !normalized.includes('/');
  const isWholeNumberValue = /^\d+$/.test(normalized);
  const shortDecimalMinWidth = isShortDecimalValue
    ? Math.round(fontSize * (compactText ? 1.52 : 1.68))
    : 0;
  const wholeNumberMinWidth = isWholeNumberValue
    ? Math.round(fontSize * (compactText ? 1.44 : 1.62))
    : 0;
  return Math.max(
    wholeNumberMinWidth,
    shortDecimalMinWidth,
    Math.round(fontSize * (compactText ? 0.92 : 1.00)),
    Math.round(measuredTextWidth + safetyRightPadding),
    structureWidth
  );
};

const estimateBadgeWidth = (
  value: string,
  fontSize: number,
  paddingX: number,
  iconSize: number,
  gap: number,
  compactText = false,
  ratingStyle: RatingStyle = DEFAULT_RATING_STYLE,
) => {
  const textWidth = estimateBadgeTextWidth(value, fontSize, compactText);
  const outerPadding = Math.max(6, Math.round(paddingX * 0.7));
  const innerGap = outerPadding;
  if (ratingStyle === 'stacked') {
    return Math.max(
      Math.round(fontSize * 2.45),
      outerPadding * 2 + Math.max(textWidth, Math.round(iconSize * 0.92)),
    );
  }
  return Math.max(
    outerPadding + iconSize + innerGap + textWidth + outerPadding,
    outerPadding + iconSize + innerGap + outerPadding + Math.round(fontSize * (compactText ? 1.12 : 1.25))
  );
};

const estimateSummaryLabelWidth = (label: string, fontSize: number) => {
  const normalized = label.trim().toUpperCase();
  if (!normalized) return 0;
  return Math.round(
    [...normalized].reduce((acc, ch) => {
      if (ch === ' ') return acc + fontSize * 0.32;
      return acc + fontSize * 0.56;
    }, 0)
  );
};

const getSummaryBadgeHorizontalMetrics = (
  label: string,
  fontSize: number,
  paddingX: number
) => {
  const summaryLabel = label.trim().toUpperCase();
  const summaryLabelFontSize = Math.max(11, Math.round(fontSize * 0.46));
  const chipPaddingX = Math.max(10, Math.round(paddingX * 0.55));
  const chipWidth = estimateSummaryLabelWidth(summaryLabel, summaryLabelFontSize) + chipPaddingX * 2;
  const contentGap = Math.max(10, Math.round(paddingX * 0.7));
  const sideInset = Math.max(12, Math.round(paddingX * 0.95));
  return {
    summaryLabel,
    summaryLabelFontSize,
    chipPaddingX,
    chipWidth,
    contentGap,
    sideInset,
  };
};

const estimateRenderedBadgeWidth = (
  badge: RatingBadge,
  fontSize: number,
  paddingX: number,
  iconSize: number,
  gap: number,
  compactText = false,
  ratingStyle: RatingStyle = DEFAULT_RATING_STYLE,
) => {
  const variant = badge.variant || 'standard';
  if (variant === 'standard') {
    const baseWidth = estimateBadgeWidth(
      badge.value,
      fontSize,
      paddingX,
      iconSize,
      gap,
      compactText,
      ratingStyle,
    );
    if (ratingStyle === 'stacked') {
      const widthRatio = Math.max(0.7, Math.min(1.3, (badge.stackedWidthPercent || DEFAULT_STACKED_WIDTH_PERCENT) / 100));
      return Math.max(Math.round(fontSize * 2.05), Math.round(baseWidth * widthRatio));
    }
    return baseWidth;
  }

  const outerPadding = Math.max(10, Math.round(paddingX * (variant === 'minimal' ? 1.05 : 0.95)));
  const valueWidth = estimateBadgeTextWidth(badge.value, fontSize, false);
  if (variant === 'minimal') {
    const chipDiameter = iconSize + outerPadding;
    return Math.max(chipDiameter, valueWidth + outerPadding * 2);
  }

  const { summaryLabelFontSize, chipWidth, contentGap, sideInset } = getSummaryBadgeHorizontalMetrics(
    badge.label,
    fontSize,
    paddingX
  );
  return Math.max(
    sideInset * 2 + valueWidth + chipWidth + contentGap,
    sideInset * 2 + valueWidth + Math.round(summaryLabelFontSize * 4.2)
  );
};
const getMinimumCompressedBadgeWidth = (
  value: string,
  fontSize: number,
  paddingX: number,
  iconSize: number,
  gap: number,
  compactText = false,
  ratingStyle: RatingStyle = DEFAULT_RATING_STYLE,
) =>
  ratingStyle === 'stacked'
    ? Math.max(
        Math.round(fontSize * 1.9),
        Math.max(6, Math.round(paddingX * 0.7)) * 2 + Math.round(iconSize * 0.78),
      )
    : Math.max(6, Math.round(paddingX * 0.7)) +
      iconSize +
      Math.max(6, Math.round(paddingX * 0.7)) +
      Math.max(6, Math.round(paddingX * 0.7)) +
      Math.round(fontSize * (compactText ? 0.82 : 0.92));

const getMinimumCompressedRenderedBadgeWidth = (
  badge: RatingBadge,
  fontSize: number,
  paddingX: number,
  iconSize: number,
  gap: number,
  compactText = false,
  ratingStyle: RatingStyle = DEFAULT_RATING_STYLE,
) => {
  const variant = badge.variant || 'standard';
  if (variant === 'standard') {
    const baseWidth = getMinimumCompressedBadgeWidth(
      badge.value,
      fontSize,
      paddingX,
      iconSize,
      gap,
      compactText,
      ratingStyle,
    );
    if (ratingStyle === 'stacked') {
      const widthRatio = Math.max(0.7, Math.min(1.3, (badge.stackedWidthPercent || DEFAULT_STACKED_WIDTH_PERCENT) / 100));
      return Math.max(Math.round(fontSize * 1.72), Math.round(baseWidth * widthRatio));
    }
    return baseWidth;
  }

  if (variant === 'minimal') {
    return Math.max(iconSize, Math.round(fontSize * 1.8) + Math.max(12, Math.round(paddingX * 1.4)));
  }

  const { chipWidth, sideInset } = getSummaryBadgeHorizontalMetrics(
    badge.label,
    fontSize,
    paddingX
  );
  return Math.max(
    Math.round(fontSize * 2.5),
    chipWidth +
      Math.round(fontSize * 1.6) +
      sideInset * 2
  );
};

const measureBadgeRowWidth = (
  rowBadges: RatingBadge[],
  metrics: BadgeLayoutMetrics,
  compactText = false,
  ratingStyle: RatingStyle = DEFAULT_RATING_STYLE,
) => {
  if (rowBadges.length === 0) return 0;
  return (
    rowBadges.reduce(
      (acc, badge) =>
        acc +
        estimateRenderedBadgeWidth(
          badge,
          metrics.fontSize,
          metrics.paddingX,
          metrics.iconSize,
          metrics.gap,
          compactText,
          ratingStyle,
        ),
      0
    ) +
    Math.max(0, rowBadges.length - 1) * metrics.gap
  );
};

const splitBadgesAcrossRowCount = (badges: RatingBadge[], rowCount: number) => {
  if (badges.length === 0) return [];
  if (rowCount <= 1) return [badges];

  const rows: RatingBadge[][] = [];
  let startIndex = 0;
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const rowsLeft = rowCount - rowIndex;
    const badgesLeft = badges.length - startIndex;
    const nextRowSize = Math.ceil(badgesLeft / rowsLeft);
    rows.push(badges.slice(startIndex, startIndex + nextRowSize));
    startIndex += nextRowSize;
  }
  return rows.filter((row) => row.length > 0);
};

const splitBadgesIntoFittingRows = (
  badges: RatingBadge[],
  maxRowWidth: number,
  metrics: BadgeLayoutMetrics,
  compactText = false,
  ratingStyle: RatingStyle = DEFAULT_RATING_STYLE,
) => {
  if (badges.length === 0) return [];
  if (maxRowWidth <= 0) return badges.map((badge) => [badge]);

  for (let rowCount = 1; rowCount <= badges.length; rowCount += 1) {
    const rows = splitBadgesAcrossRowCount(badges, rowCount);
    if (rows.every((row) => measureBadgeRowWidth(row, metrics, compactText, ratingStyle) <= maxRowWidth)) {
      return rows;
    }
  }

  return badges.map((badge) => [badge]);
};

const fitPosterBadgeMetricsToWidth = (
  rows: RatingBadge[][],
  outputWidth: number,
  initialMetrics: BadgeLayoutMetrics,
  minMetrics: BadgeLayoutMetrics = DEFAULT_BADGE_MIN_METRICS,
  compactText = false,
  preserveContent = false,
  ratingStyle: RatingStyle = DEFAULT_RATING_STYLE,
) => {
  const maxRowWidth = Math.max(0, outputWidth - 24);
  const metrics: BadgeLayoutMetrics = { ...initialMetrics };

  const measureWidestRow = () =>
    rows.reduce(
      (maxWidth, row) => Math.max(maxWidth, measureBadgeRowWidth(row, metrics, compactText, ratingStyle)),
      0,
    );

  let widestRow = measureWidestRow();
  let attempts = 0;

  while (widestRow > maxRowWidth && attempts < 20) {
    const ratio = Math.max(0.84, Math.min(0.96, maxRowWidth / widestRow));
    if (preserveContent) {
      const chromeRatio = Math.max(0.68, ratio * ratio);
      const verticalRatio = Math.max(0.76, ratio * ratio);
      const iconRatio = Math.max(0.88, Math.min(0.97, ratio + 0.05));
      const fontRatio = Math.max(0.92, Math.min(0.98, ratio + 0.09));
      metrics.paddingX = Math.max(minMetrics.paddingX, Math.floor(metrics.paddingX * chromeRatio));
      metrics.paddingY = Math.max(minMetrics.paddingY, Math.floor(metrics.paddingY * verticalRatio));
      metrics.gap = Math.max(minMetrics.gap, Math.floor(metrics.gap * chromeRatio));
      metrics.iconSize = Math.max(minMetrics.iconSize, Math.floor(metrics.iconSize * iconRatio));
      metrics.fontSize = Math.max(minMetrics.fontSize, Math.floor(metrics.fontSize * fontRatio));
    } else {
      metrics.iconSize = Math.max(minMetrics.iconSize, Math.floor(metrics.iconSize * ratio));
      metrics.fontSize = Math.max(minMetrics.fontSize, Math.floor(metrics.fontSize * ratio));
      metrics.paddingX = Math.max(minMetrics.paddingX, Math.floor(metrics.paddingX * ratio));
      metrics.paddingY = Math.max(minMetrics.paddingY, Math.floor(metrics.paddingY * ratio));
      metrics.gap = Math.max(minMetrics.gap, Math.floor(metrics.gap * ratio));
    }

    if (widestRow > maxRowWidth) {
      if (metrics.paddingX > minMetrics.paddingX) metrics.paddingX -= 1;
      else if (metrics.gap > minMetrics.gap) metrics.gap -= 1;
      else if (metrics.paddingY > minMetrics.paddingY) metrics.paddingY -= 1;
      else if (!preserveContent && metrics.fontSize > minMetrics.fontSize) metrics.fontSize -= 1;
      else if (metrics.iconSize > minMetrics.iconSize) metrics.iconSize -= 1;
      else if (metrics.fontSize > minMetrics.fontSize) metrics.fontSize -= 1;
      else break;
    }

    widestRow = measureWidestRow();
    attempts += 1;
  }

  while (widestRow > maxRowWidth) {
    if (metrics.gap > minMetrics.gap) metrics.gap -= 1;
    else if (metrics.paddingX > minMetrics.paddingX) metrics.paddingX -= 1;
    else if (metrics.paddingY > minMetrics.paddingY) metrics.paddingY -= 1;
    else if (metrics.iconSize > minMetrics.iconSize) metrics.iconSize -= 1;
    else if (metrics.fontSize > minMetrics.fontSize) metrics.fontSize -= 1;
    else break;
    widestRow = measureWidestRow();
  }

  return metrics;
};

const measureBadgeColumnHeight = (
  columnBadges: RatingBadge[],
  metrics: BadgeLayoutMetrics,
  ratingStyle: RatingStyle = DEFAULT_RATING_STYLE,
) => {
  if (columnBadges.length === 0) return 0;
  const badgeHeight = getBadgeHeightFromMetrics(metrics, ratingStyle);
  return columnBadges.length * badgeHeight + Math.max(0, columnBadges.length - 1) * metrics.gap;
};

const resolveVerticalBadgeColumnStartY = ({
  outputHeight,
  columnHeight,
  topOffset,
  bottomOffset,
  position,
  customOffset,
  minTop = topOffset,
}: {
  outputHeight: number;
  columnHeight: number;
  topOffset: number;
  bottomOffset: number;
  position: SideRatingPosition;
  customOffset: number;
  minTop?: number;
}) => {
  const baseTop = Math.max(topOffset, minTop);
  if (columnHeight <= 0) return baseTop;
  const maxStartY = Math.max(baseTop, outputHeight - bottomOffset - columnHeight);
  if (maxStartY <= baseTop) return baseTop;
  const fraction = resolveSideRatingOffsetFraction(position, customOffset);
  return Math.round(baseTop + (maxStartY - baseTop) * fraction);
};

const getMaxBadgeColumnCount = (
  outputHeight: number,
  metrics: BadgeLayoutMetrics,
  topOffset: number,
  bottomOffset: number,
  reservedTopRows = 0,
  ratingStyle: RatingStyle = DEFAULT_RATING_STYLE,
) => {
  const badgeHeight = getBadgeHeightFromMetrics(metrics, ratingStyle);
  const step = badgeHeight + metrics.gap;
  const reservedTopHeight = reservedTopRows > 0 ? reservedTopRows * step : 0;
  const availableHeight = Math.max(0, outputHeight - topOffset - bottomOffset - reservedTopHeight);
  if (badgeHeight <= 0 || step <= 0) return 1;
  return Math.max(1, Math.floor((availableHeight + metrics.gap) / step));
};

const fitPosterBadgeMetricsToHeight = (
  columns: RatingBadge[][],
  outputHeight: number,
  initialMetrics: BadgeLayoutMetrics,
  topOffset: number,
  bottomOffset: number,
  minMetrics: BadgeLayoutMetrics = DEFAULT_BADGE_MIN_METRICS,
  reservedTopRows = 0,
  ratingStyle: RatingStyle = DEFAULT_RATING_STYLE,
) => {
  const metrics: BadgeLayoutMetrics = { ...initialMetrics };
  const getMaxColumnHeight = () => {
    const badgeHeight = getBadgeHeightFromMetrics(metrics, ratingStyle);
    const reservedTopHeight =
      reservedTopRows > 0 ? reservedTopRows * (badgeHeight + metrics.gap) : 0;
    return Math.max(0, outputHeight - topOffset - bottomOffset - reservedTopHeight);
  };

  const measureTallestColumn = () =>
    columns.reduce(
      (maxHeight, column) => Math.max(maxHeight, measureBadgeColumnHeight(column, metrics, ratingStyle)),
      0
    );

  let tallestColumn = measureTallestColumn();
  let attempts = 0;

  while (tallestColumn > getMaxColumnHeight() && attempts < 12) {
    const maxColumnHeight = getMaxColumnHeight();
    const ratio = Math.max(0.84, Math.min(0.96, maxColumnHeight / tallestColumn));
    metrics.iconSize = Math.max(minMetrics.iconSize, Math.floor(metrics.iconSize * ratio));
    metrics.fontSize = Math.max(minMetrics.fontSize, Math.floor(metrics.fontSize * ratio));
    metrics.paddingX = Math.max(minMetrics.paddingX, Math.floor(metrics.paddingX * ratio));
    metrics.paddingY = Math.max(minMetrics.paddingY, Math.floor(metrics.paddingY * ratio));
    metrics.gap = Math.max(minMetrics.gap, Math.floor(metrics.gap * ratio));

    if (tallestColumn > getMaxColumnHeight()) {
      if (metrics.paddingY > minMetrics.paddingY) metrics.paddingY -= 1;
      else if (metrics.gap > minMetrics.gap) metrics.gap -= 1;
      else if (metrics.fontSize > minMetrics.fontSize) metrics.fontSize -= 1;
      else if (metrics.iconSize > minMetrics.iconSize) metrics.iconSize -= 1;
      else if (metrics.paddingX > minMetrics.paddingX) metrics.paddingX -= 1;
      else break;
    }

    tallestColumn = measureTallestColumn();
    attempts += 1;
  }

  return metrics;
};

const splitPosterBadgesByLayout = (
  badges: RatingBadge[],
  layout: PosterRatingLayout,
  maxPerColumn?: number
): PosterBadgeGroups => {
  const totalLimit = getPosterRatingLayoutMaxBadges(layout, maxPerColumn);
  const limitedBadges = typeof totalLimit === 'number' ? badges.slice(0, totalLimit) : badges;
  const columnLimit = typeof maxPerColumn === 'number' ? Math.max(1, maxPerColumn) : null;
  if (layout === 'top') {
    return { topBadges: limitedBadges, bottomBadges: [], leftBadges: [], rightBadges: [] };
  }
  if (layout === 'bottom') {
    return { topBadges: [], bottomBadges: limitedBadges, leftBadges: [], rightBadges: [] };
  }
  if (layout === 'left') {
    return {
      topBadges: [],
      bottomBadges: [],
      leftBadges: columnLimit ? limitedBadges.slice(0, columnLimit) : limitedBadges,
      rightBadges: [],
    };
  }
  if (layout === 'right') {
    return {
      topBadges: [],
      bottomBadges: [],
      leftBadges: [],
      rightBadges: columnLimit ? limitedBadges.slice(0, columnLimit) : limitedBadges,
    };
  }

  if (layout === 'left-right') {
    if (limitedBadges.length % 2 === 1) {
      const topBadges = limitedBadges.slice(0, 1);
      const sideBadges = limitedBadges.slice(1);
      const columnSize = Math.ceil(sideBadges.length / 2);
      return {
        topBadges,
        bottomBadges: [],
        leftBadges: sideBadges.slice(0, columnSize),
        rightBadges: sideBadges.slice(columnSize, columnSize * 2),
      };
    }

    const columnSize = Math.ceil(limitedBadges.length / 2);
    return {
      topBadges: [],
      bottomBadges: [],
      leftBadges: limitedBadges.slice(0, columnSize),
      rightBadges: limitedBadges.slice(columnSize, columnSize * 2),
    };
  }

  const topRowCount = Math.ceil(limitedBadges.length / 2);
  const primary = limitedBadges.slice(0, topRowCount);
  const secondary = limitedBadges.slice(topRowCount);
  return { topBadges: primary, bottomBadges: secondary, leftBadges: [], rightBadges: [] };
};

const getBackdropBadgeRegion = (
  outputWidth: number,
  layout: BackdropRatingLayout
): BackdropBadgeRegion => {
  if (layout !== 'right') {
    return { left: 0, width: outputWidth };
  }

  const width = Math.min(outputWidth - 24, Math.max(280, Math.floor(outputWidth * 0.46)));
  return {
    left: Math.max(12, outputWidth - width - 12),
    width,
  };
};

const getBadgeOuterRadius = (height: number, ratingStyle: RatingStyle) =>
  ratingStyle === 'square'
    ? Math.max(10, Math.round(height * 0.24))
    : ratingStyle === 'stacked'
      ? Math.max(12, Math.round(height * 0.28))
      : Math.round(height / 2);

const getBadgeIconRadius = (iconSize: number, ratingStyle: RatingStyle) =>
  ratingStyle === 'square'
    ? Math.max(6, Math.round(iconSize * 0.22))
    : ratingStyle === 'stacked'
      ? Math.max(7, Math.round(iconSize * 0.26))
      : Math.round(iconSize / 2);

const buildCenteredBadgeAssetImage = ({
  dataUri,
  width,
  height,
  assetAspectRatio,
  horizontalPadding,
  heightRatio = 0.6,
  yOffset = 0,
  extraAttributes = '',
}: {
  dataUri: string;
  width: number;
  height: number;
  assetAspectRatio: number;
  horizontalPadding: number;
  heightRatio?: number;
  yOffset?: number;
  extraAttributes?: string;
}) => {
  const maxWidth = Math.max(0, width - horizontalPadding * 2);
  const targetHeight = Math.max(1, Math.round(height * heightRatio));
  const targetWidth = Math.round(targetHeight * assetAspectRatio);
  const assetWidth = Math.min(maxWidth, targetWidth);
  const assetHeight = Math.max(1, Math.round(assetWidth / assetAspectRatio));
  const x = Math.round((width - assetWidth) / 2);
  const y = Math.round((height - assetHeight) / 2 + yOffset);
  return `<image href="${dataUri}" x="${x}" y="${y}" width="${assetWidth}" height="${assetHeight}" preserveAspectRatio="xMidYMid meet"${extraAttributes ? ` ${extraAttributes}` : ''} />`;
};

const usesIntrinsicQualityBadgeWidths = (style: QualityBadgeStyle) =>
  style === 'media' || style === 'silver';

const buildQualityBadgeSvg = (
  badge: Pick<RatingBadge, 'key' | 'label'>,
  height: number,
  widthOverride?: number,
  style: QualityBadgeStyle = DEFAULT_QUALITY_BADGES_STYLE
) => {
  const key = badge.key;
  if (!isMediaFeatureBadgeKey(String(key))) {
    return null;
  }
  const label = (normalizeUserFacingMediaBadgeLabel(badge.label) || '').toUpperCase();
  const h = Math.max(32, Math.round(height * 0.9));
  const radius = style === 'glass' ? Math.round(h / 2) : Math.round(h * 0.18);
  const isSilverStyle = style === 'silver';
  const strokeWidth =
    style === 'glass'
      ? Math.max(1, Math.round(h * 0.04))
      : style === 'square'
        ? Math.max(1, Math.round(h * 0.05))
        : Math.max(2, Math.round(h * 0.08));
  const fontFamily = `'Noto Sans','DejaVu Sans',Arial,sans-serif`;
  const mediaText = '#f5f5f4';
  const certStroke = 'rgba(255,247,237,0.94)';
  const certFill = 'rgba(17,24,39,0.42)';
  const certText = '#fffaf5';
  const silverStroke = 'rgba(244,244,245,0.9)';
  const silverText = 'rgba(244,244,245,0.96)';
  const mediaFrameByKey: Partial<Record<MediaFeatureBadgeKey, { stroke: string; fill: string }>> = {
    '4k': {
      stroke: 'rgba(56,189,248,0.88)',
      fill: 'rgba(2,132,199,0.16)',
    },
    hdr: {
      stroke: 'rgba(255,255,255,0.76)',
      fill: 'rgba(148,163,184,0.16)',
    },
    remux: {
      stroke: 'rgba(251,146,60,0.92)',
      fill: 'rgba(239,68,68,0.16)',
    },
    bluray: {
      stroke: 'rgba(125,211,252,0.34)',
      fill: 'rgba(15,23,42,0.16)',
    },
    dolbyvision: {
      stroke: 'rgba(255,255,255,0.58)',
      fill: 'rgba(15,23,42,0.18)',
    },
    dolbyatmos: {
      stroke: 'rgba(255,255,255,0.58)',
      fill: 'rgba(15,23,42,0.18)',
    },
  };
  const standardAssetStrokeByKey: Partial<Record<MediaBadgeAssetId, string>> = {
    '4k': '#7dd3fc',
    hdr: '#e5e7eb',
    bluray: '#dbeafe',
    dolbyvision: '#e5e7eb',
    dolbyatmos: '#e5e7eb',
    remux: '#fb923c',
  };
  const baseRect = (width: number, stroke: string, fill: string, extra = '') =>
    `<rect x="${strokeWidth / 2}" y="${strokeWidth / 2}" width="${Math.max(0, width - strokeWidth)}" height="${Math.max(0, h - strokeWidth)}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" ${extra}/>`;
  const buildMediaPlate = (
    width: number,
    input: {
      stroke: string;
      fill: string;
      strokeScale?: number;
      radiusScale?: number;
      highlightOpacity?: number;
    },
  ) => {
    const plateStrokeWidth = Math.max(1.35, strokeWidth * (input.strokeScale ?? 0.82));
    const radiusValue = Math.max(10, Math.round(h * (input.radiusScale ?? 0.26)));
    const inset = plateStrokeWidth / 2;
    const innerInset = Math.max(1.5, Math.round(plateStrokeWidth * 0.9));
    return `<rect x="${inset}" y="${inset}" width="${Math.max(0, width - plateStrokeWidth)}" height="${Math.max(0, h - plateStrokeWidth)}" rx="${radiusValue}" fill="${input.fill}" stroke="${input.stroke}" stroke-width="${plateStrokeWidth}" />
<rect x="${innerInset}" y="${innerInset}" width="${Math.max(0, width - innerInset * 2)}" height="${Math.max(0, Math.round(h * 0.42))}" rx="${Math.max(8, radiusValue - 4)}" fill="rgba(255,255,255,${input.highlightOpacity ?? 0.06})" />`;
  };
  const estimateMediaLabelWidth = (labelText: string, textSize: number, trackingEm = 0, sidePadding = 0) => {
    const collapsed = labelText.trim().toUpperCase();
    if (!collapsed) return Math.max(0, sidePadding * 2);
    const nonSpaceCount = [...collapsed].filter((ch) => ch !== ' ').length;
    const trackingWidth = Math.max(0, nonSpaceCount - 1) * trackingEm * textSize;
    const safetyWidth = Math.max(8, Math.round(textSize * 0.46));
    return Math.round(estimateSummaryLabelWidth(collapsed, textSize) + trackingWidth + sidePadding * 2 + safetyWidth);
  };
  const resolveChrome = (accentColor: string) => {
    if (style === 'plain' || style === 'media' || style === 'silver') return null;
    if (style === 'glass') {
      return {
        stroke: 'rgba(255,255,255,0.45)',
        fill: 'rgba(17,24,39,0.70)',
      };
    }
    return { stroke: accentColor, fill: '#0b0b0b' };
  };
  const buildRect = (width: number, accentColor: string, extra = '') => {
    const chrome = resolveChrome(accentColor);
    if (!chrome) return '';
    return baseRect(width, chrome.stroke, chrome.fill, extra);
  };
  const buildMediaCertificationSvg = () => {
    const badgeTypeLabel = 'AGE';
    const badgeTypeSize = Math.max(9, Math.round(h * 0.2));
    const textSize = Math.round(h * 0.34);
    const sidePadding = Math.round(h * 0.26);
    const width = widthOverride ?? Math.max(
      Math.round(h * 1.22),
      estimateMediaLabelWidth(label, textSize, 0.012, sidePadding),
      estimateMediaLabelWidth(badgeTypeLabel, badgeTypeSize, 0.14, sidePadding),
    );
    const badgeTypeY = Math.round(h * 0.3);
    const textY = Math.round(h * 0.72);
    return {
      width,
      height: h,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${h}" viewBox="0 0 ${width} ${h}">
${buildMediaPlate(width, {
  stroke: certStroke,
  fill: certFill,
  strokeScale: 0.95,
  radiusScale: 0.29,
  highlightOpacity: 0.08,
})}
<text x="${width / 2}" y="${badgeTypeY}" font-family="${fontFamily}" font-size="${badgeTypeSize}" font-weight="700" text-anchor="middle" fill="rgba(255,250,245,0.82)" letter-spacing="0.16em">${badgeTypeLabel}</text>
<text x="${width / 2}" y="${textY}" font-family="${fontFamily}" font-size="${textSize}" font-weight="800" text-anchor="middle" fill="${certText}" letter-spacing="0.012em">${escapeXml(label)}</text>
</svg>`,
    };
  };
  const buildPlainQualityShadowDefs = (filterId: string) =>
    `<defs><filter id="${filterId}" x="-28%" y="-34%" width="156%" height="188%" color-interpolation-filters="sRGB"><feDropShadow dx="0" dy="2" stdDeviation="3.6" flood-color="#020617" flood-opacity="0.72" /><feDropShadow dx="0" dy="0" stdDeviation="2.1" flood-color="#020617" flood-opacity="0.34" /></filter></defs>`;
  const buildPlainQualitySurface = (width: number, filterId: string) =>
    `<rect x="5" y="7" width="${Math.max(0, width - 10)}" height="${Math.max(0, h - 14)}" rx="${Math.max(8, Math.round(h * 0.24))}" fill="rgba(2,6,23,0.10)" filter="url(#${filterId})" />`;
  const buildSilverQualityMarkDefs = (filterId: string) =>
    `<defs><filter id="${filterId}" x="-25%" y="-30%" width="150%" height="170%" color-interpolation-filters="sRGB"><feDropShadow in="SourceAlpha" dx="0" dy="1.1" stdDeviation="1.8" flood-color="#020617" flood-opacity="0.52" result="silver-shadow" /><feFlood flood-color="#f4f4f5" flood-opacity="0.96" result="silver-fill" /><feComposite in="silver-fill" in2="SourceAlpha" operator="in" result="silver-mark" /><feMerge><feMergeNode in="silver-shadow" /><feMergeNode in="silver-mark" /></feMerge></filter></defs>`;
  const buildSilverQualityTextDefs = (filterId: string) =>
    `<defs><filter id="${filterId}" x="-25%" y="-30%" width="150%" height="170%" color-interpolation-filters="sRGB"><feDropShadow dx="0" dy="1.1" stdDeviation="2.1" flood-color="#020617" flood-opacity="0.56" /></filter></defs>`;
  const buildAssetBackedBadgeSvg = (
    assetKey: MediaBadgeAssetId,
    variant: 'media' | 'standard',
  ) => {
    const asset = MEDIA_BADGE_ASSETS[assetKey];
    const width = widthOverride ?? Math.round(h * asset.widthRatio);
    const horizontalPadding = Math.round(h * asset.horizontalPaddingRatio);
    const isPlainStandard = variant === 'standard' && style === 'plain';
    const isSilverStandard = variant === 'standard' && isSilverStyle;
    const mediaFrame = mediaFrameByKey[assetKey];
    const backgroundMarkup =
      isSilverStandard
        ? ''
        : variant === 'media'
        ? buildMediaPlate(width, {
            stroke: mediaFrame?.stroke || 'rgba(255,255,255,0.78)',
            fill: mediaFrame?.fill || 'rgba(255,255,255,0.04)',
            strokeScale: assetKey === 'bluray' ? 0.66 : assetKey.startsWith('dolby') ? 0.78 : 0.82,
            radiusScale: assetKey === 'bluray' ? 0.24 : 0.27,
            highlightOpacity: assetKey === 'bluray' ? 0.035 : 0.05,
          })
        : isPlainStandard
          ? buildPlainQualitySurface(width, 'quality-badge-plain-shadow')
          : buildRect(width, standardAssetStrokeByKey[assetKey] || '#e5e7eb');
    const defs = isSilverStandard
      ? buildSilverQualityMarkDefs('quality-badge-silver-logo')
      : isPlainStandard
        ? `${buildPlainQualityShadowDefs('quality-badge-plain-shadow')}<defs><filter id="quality-badge-logo-shadow" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="1" stdDeviation="2.1" flood-color="#000000" flood-opacity="0.52" /></filter></defs>`
        : '';
    return {
      width,
      height: h,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${h}" viewBox="0 0 ${width} ${h}">
${defs}
${backgroundMarkup}
${buildCenteredBadgeAssetImage({
  dataUri: asset.dataUri,
  width,
  height: h,
  assetAspectRatio: asset.aspectRatio,
  horizontalPadding,
  heightRatio: asset.heightRatio,
  yOffset: Math.round(h * (asset.yOffsetRatio || 0)),
  extraAttributes: isPlainStandard ? 'filter="url(#quality-badge-logo-shadow)"' : '',
})}
</svg>`,
    };
  };

  if (style === 'media') {
    if (key === 'certification') {
      return buildMediaCertificationSvg();
    }
    if (key in MEDIA_BADGE_ASSETS) {
      return buildAssetBackedBadgeSvg(key as MediaBadgeAssetId, 'media');
    }
  }

  if (isSilverStyle) {
    if (key === 'certification') {
      const textSize = Math.round(h * 0.42);
      const sidePadding = Math.max(10, Math.round(h * 0.18));
      const width = widthOverride ?? Math.max(
        Math.round(h * 0.9),
        estimateSummaryLabelWidth(label, textSize) + sidePadding * 2,
      );
      const certRadius = Math.max(8, Math.round(h * 0.22));
      const textY = Math.round(h * 0.66);
      return {
        width,
        height: h,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${h}" viewBox="0 0 ${width} ${h}">
${buildSilverQualityTextDefs('quality-badge-silver-text')}
<rect x="${Math.max(1, strokeWidth * 0.4)}" y="${Math.max(1, strokeWidth * 0.4)}" width="${Math.max(0, width - Math.max(2, strokeWidth * 0.8))}" height="${Math.max(0, h - Math.max(2, strokeWidth * 0.8))}" rx="${certRadius}" fill="none" stroke="${silverStroke}" stroke-width="${Math.max(1.5, strokeWidth * 0.72)}" filter="url(#quality-badge-silver-text)" />
<text x="${width / 2}" y="${textY}" font-family="${fontFamily}" font-size="${textSize}" font-weight="800" text-anchor="middle" fill="${silverText}" filter="url(#quality-badge-silver-text)">${escapeXml(label)}</text>
</svg>`,
      };
    }
    if (key in MEDIA_BADGE_ASSETS) {
      return buildAssetBackedBadgeSvg(key as MediaBadgeAssetId, 'standard');
    }
  }

  if (key === 'certification') {
    const badgeTypeLabel = 'AGE';
    const badgeTypeSize = Math.max(9, Math.round(h * 0.2));
    const textSize = Math.round(h * 0.36);
    const width = widthOverride ?? Math.max(
      Math.round(h * 1.08),
      estimateSummaryLabelWidth(label, textSize) + 16,
      estimateSummaryLabelWidth(badgeTypeLabel, badgeTypeSize) + 16,
    );
    const badgeTypeY = Math.round(h * 0.31);
    const textY = Math.round(h * 0.72);
    const rect = buildRect(width, '#e5e7eb');
    const fill = style === 'plain' ? mediaText : '#e5e7eb';
    const filter = style === 'plain' ? ' filter="url(#quality-badge-text-shadow)"' : '';
    const defs =
      style === 'plain'
        ? `${buildPlainQualityShadowDefs('quality-badge-text-surface')}<defs><filter id="quality-badge-text-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="2.2" flood-color="#000000" flood-opacity="0.56" /></filter></defs>`
        : '';
    const plainStroke =
      style === 'plain' ? buildPlainQualitySurface(width, 'quality-badge-text-surface') : '';
    return {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${h}" viewBox="0 0 ${width} ${h}">
${defs}
${style === 'plain' ? plainStroke : rect}
<text x="${width / 2}" y="${badgeTypeY}" font-family="${fontFamily}" font-size="${badgeTypeSize}" font-weight="700" text-anchor="middle" fill="${style === 'plain' ? 'rgba(245,245,244,0.84)' : 'rgba(229,231,235,0.74)'}"${filter}>${badgeTypeLabel}</text>
<text x="${width / 2}" y="${textY}" font-family="${fontFamily}" font-size="${textSize}" font-weight="800" text-anchor="middle" fill="${fill}"${filter}>${escapeXml(label)}</text>
</svg>`,
      width,
      height: h,
    };
  }

  if (key === '4k') {
    return buildAssetBackedBadgeSvg('4k', 'standard');
  }

  if (key === 'hdr') {
    return buildAssetBackedBadgeSvg('hdr', 'standard');
  }

  if (key === 'bluray') {
    return buildAssetBackedBadgeSvg('bluray', 'standard');
  }

  if (key === 'dolbyvision') {
    return buildAssetBackedBadgeSvg('dolbyvision', 'standard');
  }

  if (key === 'dolbyatmos') {
    return buildAssetBackedBadgeSvg('dolbyatmos', 'standard');
  }

  if (key === 'remux') {
    return buildAssetBackedBadgeSvg('remux', 'standard');
  }

  return null;
};

const estimateGenreBadgeLabelWidth = (label: string, fontSize: number) => {
  const normalized = label.trim().toUpperCase();
  if (!normalized) return Math.max(fontSize * 2, Math.round(fontSize * 2.2));
  const baseWidth = estimateSummaryLabelWidth(normalized, fontSize);
  const letterSpacingWidth = Math.round(Math.max(0, normalized.length - 1) * fontSize * 0.08);
  const safetyWidth = Math.max(6, Math.round(fontSize * 0.45));
  return Math.max(Math.round(fontSize * 2.2), baseWidth + letterSpacingWidth + safetyWidth);
};

const buildGenreBadgeIconMarkup = ({
  familyId,
  color,
}: {
  familyId: GenreBadgeFamilyId;
  color: string;
}) => {
  if (familyId === 'anime') {
    return `<path d="M12 2 14.8 9.2 22 12 14.8 14.8 12 22 9.2 14.8 2 12 9.2 9.2Z" fill="${color}" opacity="0.96"/>`;
  }

  if (familyId === 'horror') {
    return `<path d="M12 3c4.6 0 8 3.3 8 7.9 0 2.3-.9 4.2-2.4 5.7V20h-3v-2h-1v2h-3v-2H9v2H6v-3.4A7.8 7.8 0 0 1 4 10.9C4 6.3 7.4 3 12 3Z" fill="${color}" opacity="0.96"/><circle cx="9" cy="11" r="1.5" fill="#05070b"/><circle cx="15" cy="11" r="1.5" fill="#05070b"/><rect x="10.4" y="14.6" width="3.2" height="2.2" rx="1.1" fill="#05070b"/>`;
  }

  if (familyId === 'comedy') {
    return `<circle cx="12" cy="12" r="8.6" fill="none" stroke="${color}" stroke-width="2.1"/><circle cx="9.1" cy="10.1" r="1.1" fill="${color}"/><circle cx="14.9" cy="10.1" r="1.1" fill="${color}"/><path d="M8 14.3c1.1 1.8 2.4 2.7 4 2.7s2.9-.9 4-2.7" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
  }

  if (familyId === 'romance') {
    return `<path d="M12 20.2 4.9 13.4C3.7 12.2 3 10.7 3 9.1 3 6 5.3 4 8.2 4c1.7 0 3.2.8 3.8 2.1C12.6 4.8 14.1 4 15.8 4 18.7 4 21 6 21 9.1c0 1.6-.7 3.1-1.9 4.3L12 20.2Z" fill="${color}" opacity="0.97"/>`;
  }

  if (familyId === 'action') {
    return `<path d="M13.8 2 6.9 12h4l-1.1 10L17.1 12h-4L13.8 2Z" fill="${color}" opacity="0.97"/>`;
  }

  if (familyId === 'scifi') {
    return `<ellipse cx="12" cy="12" rx="8.8" ry="4.4" fill="none" stroke="${color}" stroke-width="1.9" transform="rotate(-24 12 12)"/><circle cx="12" cy="12" r="3.2" fill="${color}" opacity="0.92"/><circle cx="18.2" cy="8.8" r="1.4" fill="${color}"/>`;
  }

  if (familyId === 'fantasy') {
    return `<path d="M12 3 15.1 6.1 13.1 8.1v6.8l1.9 1.9-1.2 1.2-1.8-1.8-1.8 1.8-1.2-1.2 1.9-1.9V8.1L8.9 6.1 12 3Z" fill="${color}" opacity="0.96"/><rect x="7" y="13.8" width="10" height="2.2" rx="1.1" fill="${color}"/>`;
  }

  if (familyId === 'crime') {
    return `<path d="M12 3 18.3 5.7V11c0 4.2-2.5 7.2-6.3 9.1C8.2 18.2 5.7 15.2 5.7 11V5.7L12 3Z" fill="none" stroke="${color}" stroke-width="2"/><path d="M9 10.2h6M9 13.8h6" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>`;
  }

  return `<rect x="4" y="7" width="12" height="9.5" rx="2" fill="none" stroke="${color}" stroke-width="2"/><rect x="8" y="4.5" width="4.4" height="2.7" rx="1.2" fill="${color}"/><circle cx="10" cy="11.8" r="2.1" fill="${color}"/><path d="M16 9.2 20.5 7.1v9.4L16 14.4Z" fill="${color}" opacity="0.96"/>`;
};

const buildGenreBadgeSvg = (
  genreBadge: GenreBadgeSpec,
  imageType: 'poster' | 'backdrop' | 'logo',
) => {
  const baseHeight =
    imageType === 'logo'
      ? 38
      : imageType === 'backdrop'
        ? 44
        : 40;
  const scaleRatio = Math.max(0.7, (genreBadge.scalePercent ?? DEFAULT_BADGE_SCALE_PERCENT) / 100);
  const height = Math.max(30, Math.round(baseHeight * scaleRatio));
  const radius = Math.round(height / 2);
  const strokeWidth = imageType === 'backdrop' ? 1.5 : 1.4;
  const iconSize = Math.round(height * (imageType === 'backdrop' ? 0.46 : 0.48));
  const fontSize = genreBadge.mode === 'text' ? Math.round(height * 0.37) : Math.round(height * 0.34);
  const label = genreBadge.label.trim().toUpperCase();
  const showIcon = genreBadge.mode === 'icon' || genreBadge.mode === 'both';
  const showText = genreBadge.mode === 'text' || genreBadge.mode === 'both';
  const paddingX = showText ? (showIcon ? 16 : 18) : 14;
  const iconGap = showIcon && showText ? Math.max(9, Math.round(height * 0.22)) : 0;
  const labelWidth = showText ? estimateGenreBadgeLabelWidth(label, fontSize) : 0;
  const width = Math.max(
    height,
    paddingX * 2 + (showIcon ? iconSize : 0) + iconGap + labelWidth,
  );
  const iconX = paddingX;
  const iconY = Math.round((height - iconSize) / 2);
  const textX = iconX + (showIcon ? iconSize + iconGap : 0);
  const textCenterX = textX + Math.round(labelWidth / 2);
  const textY = Math.round(height * 0.62);
  const iconMarkup = showIcon
    ? `<g transform="translate(${iconX} ${iconY}) scale(${iconSize / 24})">${buildGenreBadgeIconMarkup({
        familyId: genreBadge.familyId,
        color: genreBadge.accentColor,
      })}</g>`
    : '';
  const textMarkup = showText
    ? `<text x="${textCenterX}" y="${textY}" text-anchor="middle" font-family="'Space Grotesk','Noto Sans',Arial,sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="0.08em" fill="${genreBadge.accentColor}">${escapeXml(label)}</text>`
    : '';

  return {
    width,
    height,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect x="${strokeWidth / 2}" y="${strokeWidth / 2}" width="${Math.max(0, width - strokeWidth)}" height="${Math.max(0, height - strokeWidth)}" rx="${radius}" fill="rgba(8,11,16,0.78)" stroke="${genreBadge.accentColor}" stroke-width="${strokeWidth}"/>
<rect x="${Math.max(2, strokeWidth)}" y="${Math.max(2, strokeWidth)}" width="${Math.max(0, width - Math.max(4, strokeWidth * 2))}" height="${Math.max(0, Math.round(height * 0.45))}" rx="${Math.max(8, radius - 4)}" fill="rgba(255,255,255,0.05)"/>
${iconMarkup}
${textMarkup}
</svg>`,
  };
};

const buildBadgeSvg = ({
  width,
  height,
  iconSize,
  fontSize,
  paddingX,
  gap,
  accentColor,
  monogram,
  iconDataUri,
  iconKey,
  labelText,
  value,
  badgeVariant = 'standard',
  ratingStyle,
  iconScalePercent = DEFAULT_PROVIDER_ICON_SCALE_PERCENT,
  stackedLineVisible = true,
  stackedLineWidthPercent = DEFAULT_STACKED_LINE_WIDTH_PERCENT,
  stackedLineHeightPercent = DEFAULT_STACKED_LINE_HEIGHT_PERCENT,
  stackedLineGapPercent = DEFAULT_STACKED_LINE_GAP_PERCENT,
  stackedSurfaceOpacityPercent = DEFAULT_STACKED_SURFACE_OPACITY_PERCENT,
  stackedAccentMode = DEFAULT_STACKED_ACCENT_MODE,
  preferNeutralGlassPlate = false,
  compactText = false,
}: {
  width: number;
  height: number;
  iconSize: number;
  fontSize: number;
  paddingX: number;
  gap: number;
  accentColor: string;
  monogram: string;
  iconDataUri?: string | null;
  iconKey?: BadgeKey;
  labelText?: string;
  value: string;
  badgeVariant?: 'standard' | 'minimal' | 'summary';
  ratingStyle: RatingStyle;
  iconScalePercent?: number;
  stackedLineVisible?: boolean;
  stackedLineWidthPercent?: number;
  stackedLineHeightPercent?: number;
  stackedLineGapPercent?: number;
  stackedSurfaceOpacityPercent?: number;
  stackedAccentMode?: StackedAccentMode;
  preferNeutralGlassPlate?: boolean;
  compactText?: boolean;
}) => {
  const radius = getBadgeOuterRadius(height, ratingStyle);
  const outerRect =
    ratingStyle === 'plain'
      ? ''
      : `<rect x="0.75" y="0.75" width="${Math.max(0, width - 1.5)}" height="${Math.max(0, height - 1.5)}" rx="${radius}" fill="${ratingStyle === 'square' ? 'rgb(5,5,5)' : 'rgb(17,24,39)'}" fill-opacity="${ratingStyle === 'square' ? '0.94' : '0.70'}" stroke="${ratingStyle === 'square' ? accentColor : 'rgba(255,255,255,0.30)'}" stroke-width="${ratingStyle === 'square' ? '1.5' : '1'}" />`;
  const plainBadgeDefs =
    ratingStyle === 'plain'
      ? `<defs><filter id="text-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="2.4" flood-color="#000000" flood-opacity="0.55" /></filter><filter id="plain-icon-shadow" x="-35%" y="-35%" width="170%" height="170%" color-interpolation-filters="sRGB"><feDropShadow dx="0" dy="0" stdDeviation="1.4" flood-color="#020617" flood-opacity="0.78" /><feDropShadow dx="0" dy="1" stdDeviation="2.2" flood-color="#020617" flood-opacity="0.46" /></filter></defs>`
      : '';
  const valueFilter = ratingStyle === 'plain' ? ' filter="url(#text-shadow)"' : '';
  if (badgeVariant !== 'standard') {
    const valueNumericStyle =
      ' style="font-variant-numeric: tabular-nums lining-nums; font-feature-settings: \'tnum\' 1, \'lnum\' 1;"';
    const centerX = Math.round(width / 2);
    const centerY = Math.round(height / 2);
    if (ratingStyle === 'plain') {
      const plainDefs = `<defs><filter id="plain-variant-text-shadow" x="-20%" y="-25%" width="140%" height="150%"><feDropShadow dx="0" dy="1" stdDeviation="2.2" flood-color="#000000" flood-opacity="0.64" /></filter><filter id="plain-variant-surface-shadow" x="-30%" y="-45%" width="160%" height="200%" color-interpolation-filters="sRGB"><feDropShadow dx="0" dy="2" stdDeviation="3.6" flood-color="#020617" flood-opacity="0.74" /></filter></defs>`;
      if (badgeVariant === 'minimal') {
        const accentRailWidth = Math.max(28, Math.round(width * 0.42));
        const accentRailHeight = Math.max(5, Math.round(height * 0.12));
        const accentRailX = Math.round((width - accentRailWidth) / 2);
        const accentRailY = Math.max(6, Math.round(height * 0.16));
        const valueFontSize = Math.max(18, Math.round(fontSize * 1.05));
        const valueY = Math.round(centerY + 1);
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${plainDefs}
<rect x="${accentRailX}" y="${accentRailY}" width="${accentRailWidth}" height="${accentRailHeight}" rx="${Math.max(2, Math.round(accentRailHeight / 2))}" fill="${accentColor}" fill-opacity="0.78" filter="url(#plain-variant-surface-shadow)" />
<text x="${centerX}" y="${valueY}" font-family="'Noto Sans','DejaVu Sans',Arial,sans-serif" font-size="${valueFontSize}" font-weight="800" text-anchor="middle" dominant-baseline="middle" fill="white" filter="url(#plain-variant-text-shadow)"${valueNumericStyle}>${escapeXml(value)}</text>
</svg>`;
      }

      const {
        summaryLabel,
        summaryLabelFontSize,
        sideInset,
      } = getSummaryBadgeHorizontalMetrics(labelText || '', fontSize, paddingX);
      const labelX = sideInset;
      const labelY = Math.max(
        Math.round(height * 0.38),
        Math.round(centerY - summaryLabelFontSize * 0.25),
      );
      const valueX = width - sideInset;
      const valueY = Math.round(centerY + fontSize * 0.22);
      const accentRailWidth = Math.max(24, Math.round(width * 0.14));
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${plainDefs}
<rect x="${sideInset}" y="${Math.max(6, Math.round(height * 0.16))}" width="${accentRailWidth}" height="3" rx="1.5" fill="${accentColor}" fill-opacity="0.82" filter="url(#plain-variant-surface-shadow)" />
<text x="${labelX}" y="${labelY}" font-family="'Noto Sans','DejaVu Sans',Arial,sans-serif" font-size="${summaryLabelFontSize}" font-weight="800" text-anchor="start" fill="${accentColor}" filter="url(#plain-variant-text-shadow)">${escapeXml(summaryLabel)}</text>
<text x="${valueX}" y="${valueY}" font-family="'Noto Sans','DejaVu Sans',Arial,sans-serif" font-size="${fontSize}" font-weight="800" text-anchor="end" dominant-baseline="middle" fill="white" filter="url(#plain-variant-text-shadow)"${valueNumericStyle}>${escapeXml(value)}</text>
</svg>`;
    }
    const accentStrokeOpacity = ratingStyle === 'square' ? 0.9 : 0.86;
    const accentTintStartOpacity = ratingStyle === 'square' ? 0.18 : 0.16;
    const accentTintEndOpacity = ratingStyle === 'square' ? 0.06 : 0.05;
    const baseFill =
      ratingStyle === 'square'
        ? 'rgb(5,5,5)'
        : 'rgb(11,17,28)';
    const baseFillOpacity = ratingStyle === 'square' ? 0.96 : 0.82;
    const innerStroke = 'rgb(255,255,255)';
    const innerStrokeOpacity = 0.16;
    const strokeWidth = ratingStyle === 'square' ? 1.7 : 1.45;
    const variantOuterInset = 0.9;
    const variantOuterWidth = Math.max(0, width - variantOuterInset * 2);
    const variantOuterHeight = Math.max(0, height - variantOuterInset * 2);
    const variantInnerInset = 1.6;
    const variantInnerWidth = Math.max(0, width - variantInnerInset * 2);
    const variantInnerHeight = Math.max(0, height - variantInnerInset * 2);
    const variantInnerRadius = Math.max(2, radius - 1);
    const variantStrokeInset = 2.3;
    const variantStrokeWidth = Math.max(0, width - variantStrokeInset * 2);
    const variantStrokeHeight = Math.max(0, height - variantStrokeInset * 2);
    const variantStrokeRadius = Math.max(2, radius - 2);
    const variantDefs = `<defs>
<linearGradient id="variant-surface-fill" x1="0%" y1="0%" x2="100%" y2="100%">
<stop offset="0%" stop-color="${accentColor}" stop-opacity="${accentTintStartOpacity}" />
<stop offset="100%" stop-color="${accentColor}" stop-opacity="${accentTintEndOpacity}" />
</linearGradient>
</defs>`;
    const variantChrome = `
<rect x="${variantOuterInset}" y="${variantOuterInset}" width="${variantOuterWidth}" height="${variantOuterHeight}" rx="${radius}" fill="${baseFill}" fill-opacity="${baseFillOpacity}" stroke="${accentColor}" stroke-opacity="${accentStrokeOpacity}" stroke-width="${strokeWidth}" />
<rect x="${variantInnerInset}" y="${variantInnerInset}" width="${variantInnerWidth}" height="${variantInnerHeight}" rx="${variantInnerRadius}" fill="url(#variant-surface-fill)" />
<rect x="${variantStrokeInset}" y="${variantStrokeInset}" width="${variantStrokeWidth}" height="${variantStrokeHeight}" rx="${variantStrokeRadius}" fill="none" stroke="${innerStroke}" stroke-opacity="${innerStrokeOpacity}" stroke-width="0.85" />`;

    if (badgeVariant === 'minimal') {
      const valueFontSize = Math.max(18, Math.round(fontSize * 1.05));
      const valueY = Math.round(centerY + 1);
      const accentRailWidth = Math.max(24, Math.round(width * 0.4));
      const accentRailHeight = Math.max(3, Math.round(height * 0.08));
      const accentRailX = Math.round((width - accentRailWidth) / 2);
      const accentRailY = Math.max(6, Math.round(height * 0.18));
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${variantDefs}
${variantChrome}
<rect x="${accentRailX}" y="${accentRailY}" width="${accentRailWidth}" height="${accentRailHeight}" rx="${Math.max(1, Math.round(accentRailHeight / 2))}" fill="${accentColor}" />
<text x="${centerX}" y="${valueY}" font-family="'Noto Sans','DejaVu Sans',Arial,sans-serif" font-size="${valueFontSize}" font-weight="800" text-anchor="middle" dominant-baseline="middle" fill="white"${valueFilter}${valueNumericStyle}>${escapeXml(value)}</text>
</svg>`;
    }

    const {
      summaryLabel,
      summaryLabelFontSize,
      sideInset,
      chipWidth,
    } = getSummaryBadgeHorizontalMetrics(labelText || '', fontSize, paddingX);
    const chipHeight = Math.max(summaryLabelFontSize + 12, Math.round(height * 0.56));
    const chipY = Math.round((height - chipHeight) / 2);
    const chipRadius = Math.round(chipHeight / 2);
    const chipX = sideInset;
    const labelX = Math.round(chipX + chipWidth / 2);
    const labelY = Math.round(chipY + chipHeight / 2 + 1);
    const valueX = width - sideInset;
    const valueY = Math.round(centerY + 1);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${variantDefs}
${variantChrome}
<rect x="${chipX}" y="${chipY}" width="${chipWidth}" height="${chipHeight}" rx="${chipRadius}" fill="${accentColor}" fill-opacity="0.94" />
<text x="${labelX}" y="${labelY}" font-family="'Noto Sans','DejaVu Sans',Arial,sans-serif" font-size="${summaryLabelFontSize}" font-weight="800" text-anchor="middle" dominant-baseline="middle" fill="white"${valueFilter}>${escapeXml(summaryLabel)}</text>
<text x="${valueX}" y="${valueY}" font-family="'Noto Sans','DejaVu Sans',Arial,sans-serif" font-size="${fontSize}" font-weight="800" text-anchor="end" dominant-baseline="middle" fill="white"${valueFilter}${valueNumericStyle}>${escapeXml(value)}</text>
</svg>`;
  }
  if (ratingStyle === 'stacked') {
    const stackedOuterInset = 0.9;
    const stackedOuterWidth = Math.max(0, width - stackedOuterInset * 2);
    const stackedOuterHeight = Math.max(0, height - stackedOuterInset * 2);
    const stackedInnerInset = 1.8;
    const stackedInnerWidth = Math.max(0, width - stackedInnerInset * 2);
    const stackedInnerHeight = Math.max(0, height - stackedInnerInset * 2);
    const renderIconSize = resolveBadgeIconRenderSize({
      iconSlotSize: Math.max(14, Math.round(iconSize * 0.72)),
      badgeHeight: Math.max(18, Math.round(height * 0.3)),
      iconScalePercent,
    });
    const stackedLayout = computeStackedBadgeLayout({
      width,
      height,
      paddingX,
      fontSize,
      renderIconSize,
      accentLineVisible: stackedLineVisible,
      accentLineWidthPercent: stackedLineWidthPercent,
      accentLineHeightPercent: stackedLineHeightPercent,
      accentLineGapPercent: stackedLineGapPercent,
    });
    const valueTextWidth = estimateBadgeTextWidth(value, stackedLayout.valueFontSize, compactText);
    const valueAvailableWidth = stackedLayout.valueAvailableWidth;
    const valueTextLength =
      valueTextWidth > valueAvailableWidth
        ? ` textLength="${valueAvailableWidth}" lengthAdjust="spacingAndGlyphs"`
        : '';
    const valueNumericStyle =
      ' style="font-variant-numeric: tabular-nums lining-nums; font-feature-settings: \'tnum\' 1, \'lnum\' 1;"';
    const surfaceOpacityRatio = Math.max(
      MIN_STACKED_SURFACE_OPACITY_PERCENT / 100,
      Math.min(1, stackedSurfaceOpacityPercent / 100),
    );
    const useLogoOnlyAccent = stackedAccentMode === 'logo';
    const iconSurfaceFill = hexColorToRgba(
      accentColor,
      0.22,
      'rgba(167,139,250,0.22)',
    );
    const iconSurfaceStroke = hexColorToRgba(accentColor, 0.54, 'rgba(167,139,250,0.54)');
    const stackedSurfaceStartColor = useLogoOnlyAccent ? '#ffffff' : accentColor;
    const stackedSurfaceEndColor = useLogoOnlyAccent ? '#94a3b8' : accentColor;
    const stackedSurfaceStartOpacity = (useLogoOnlyAccent ? 0.06 : 0.14) * surfaceOpacityRatio;
    const stackedSurfaceEndOpacity = (useLogoOnlyAccent ? 0.015 : 0.04) * surfaceOpacityRatio;
    const stackedBodyFillOpacity = 0.9 * surfaceOpacityRatio;
    const stackedBodyStroke = useLogoOnlyAccent
      ? 'rgba(255,255,255,0.22)'
      : hexColorToRgba(accentColor, 0.28, 'rgba(255,255,255,0.22)');
    const stackedDefs = `<defs>
<linearGradient id="stacked-surface-fill" x1="0%" y1="0%" x2="100%" y2="100%">
<stop offset="0%" stop-color="${stackedSurfaceStartColor}" stop-opacity="${stackedSurfaceStartOpacity}" />
<stop offset="100%" stop-color="${stackedSurfaceEndColor}" stop-opacity="${stackedSurfaceEndOpacity}" />
</linearGradient>
<clipPath id="stacked-icon-clip">
<rect x="${stackedLayout.iconX}" y="${stackedLayout.iconY}" width="${renderIconSize}" height="${renderIconSize}" rx="${Math.max(6, stackedLayout.iconRadius - 4)}" />
</clipPath>
</defs>`;
    const iconImage = iconDataUri
      ? `<image href="${iconDataUri}" x="${stackedLayout.iconX}" y="${stackedLayout.iconY}" width="${renderIconSize}" height="${renderIconSize}" preserveAspectRatio="xMidYMid meet" clip-path="url(#stacked-icon-clip)" />`
      : '';
    const monogramText = iconDataUri
      ? ''
      : `<text x="${stackedLayout.iconCenterX}" y="${Math.round(stackedLayout.iconCenterY + stackedLayout.iconFontSize * 0.34)}" font-family="Arial, sans-serif" font-size="${stackedLayout.iconFontSize}" font-weight="700" text-anchor="middle" fill="${accentColor}">${escapeXml(monogram)}</text>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${stackedDefs}
<rect x="${stackedOuterInset}" y="${stackedOuterInset}" width="${stackedOuterWidth}" height="${stackedOuterHeight}" rx="${radius}" fill="rgba(8,11,16,${stackedBodyFillOpacity.toFixed(3)})" stroke="${stackedBodyStroke}" stroke-width="1.15" />
<rect x="${stackedInnerInset}" y="${stackedInnerInset}" width="${stackedInnerWidth}" height="${stackedInnerHeight}" rx="${Math.max(10, radius - 3)}" fill="url(#stacked-surface-fill)" />
${stackedLayout.showAccentRail ? `<rect x="${stackedLayout.accentRailX}" y="${stackedLayout.accentRailY}" width="${stackedLayout.accentRailWidth}" height="${stackedLayout.accentRailHeight}" rx="${Math.max(2, Math.round(stackedLayout.accentRailHeight / 2))}" fill="${accentColor}" />` : ''}
<rect x="${stackedLayout.iconPlateX}" y="${stackedLayout.iconPlateY}" width="${stackedLayout.iconPlateSize}" height="${stackedLayout.iconPlateSize}" rx="${Math.max(10, Math.round(stackedLayout.iconPlateSize * 0.28))}" fill="${iconSurfaceFill}" stroke="${iconSurfaceStroke}" stroke-width="1.05" />
${iconImage}
${monogramText}
<text x="${Math.round(width / 2)}" y="${stackedLayout.valueTopY}" font-family="'Noto Sans','DejaVu Sans',Arial,sans-serif" font-size="${stackedLayout.valueFontSize}" font-weight="800" text-anchor="middle" dominant-baseline="hanging" fill="white"${valueTextLength}${valueNumericStyle}>${escapeXml(value)}</text>
</svg>`;
  }
  const outerPadding = Math.max(6, Math.round(paddingX * 0.7));
  const innerGap = outerPadding;
  const renderIconSize = resolveBadgeIconRenderSize({
    iconSlotSize: iconSize,
    badgeHeight: height,
    iconScalePercent,
  });
  const iconRadius = getBadgeIconRadius(renderIconSize, ratingStyle);
  const iconSlotX = outerPadding;
  const iconX = iconSlotX + Math.round((iconSize - renderIconSize) / 2);
  const iconCx = iconSlotX + Math.round(iconSize / 2);
  const iconCy = Math.round(height / 2);
  const iconFontSize = Math.max(12, Math.round(renderIconSize * 0.42));
  const valueX = iconSlotX + iconSize + innerGap;
  const valueY = Math.round(height / 2 + fontSize * 0.36);
  const valueTextWidth = estimateBadgeTextWidth(value, fontSize, compactText);
  const valueRightInset = outerPadding;
  const valueAvailableWidth = Math.max(0, width - valueX - valueRightInset);
  const valueTextLength =
    compactText && valueTextWidth > valueAvailableWidth
      ? ` textLength="${valueAvailableWidth}" lengthAdjust="spacingAndGlyphs"`
      : '';
  const shouldCenterValueInSlot = /^\d+(?:\.0)?$/.test(value.trim());
  const valueFontFamily = compactText
    ? `'Noto Sans','DejaVu Sans','Arial Narrow','Liberation Sans Narrow','Nimbus Sans Narrow','Roboto Condensed',Arial,sans-serif`
    : `'Noto Sans','DejaVu Sans',Arial,sans-serif`;
  const valueLetterSpacing = compactText ? ' letter-spacing="-0.04em"' : '';
  const iconY = Math.round((height - renderIconSize) / 2);
  const useNeutralGlassPlate = ratingStyle === 'glass' && preferNeutralGlassPlate;
  const iconShape =
    ratingStyle === 'plain'
      ? ''
      : ratingStyle === 'square'
        ? `<rect x="${iconX + 0.75}" y="${iconY + 0.75}" width="${Math.max(0, renderIconSize - 1.5)}" height="${Math.max(0, renderIconSize - 1.5)}" rx="${iconRadius}" fill="rgb(10,10,10)" />`
        : useNeutralGlassPlate
          ? `<circle cx="${iconCx}" cy="${iconCy}" r="${iconRadius}" fill="rgba(15,23,42,0.92)" stroke="${accentColor}" stroke-width="1.5" />`
          : `<circle cx="${iconCx}" cy="${iconCy}" r="${iconRadius}" fill="${accentColor}" stroke="rgba(255,255,255,0.45)" />`;
  const iconClipPath =
    ratingStyle === 'plain'
      ? ''
      : ratingStyle === 'square'
        ? `<rect x="${iconX + 1.5}" y="${iconY + 1.5}" width="${Math.max(0, renderIconSize - 3)}" height="${Math.max(0, renderIconSize - 3)}" rx="${Math.max(4, iconRadius - 1)}" />`
        : `<circle cx="${iconCx}" cy="${iconCy}" r="${Math.max(1, iconRadius - 1)}" />`;
  const iconBorder =
    ratingStyle === 'plain'
      ? ''
      : ratingStyle === 'square'
        ? ''
        : useNeutralGlassPlate
          ? `<circle cx="${iconCx}" cy="${iconCy}" r="${Math.max(1, iconRadius - 0.75)}" fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="0.75" />`
          : `<circle cx="${iconCx}" cy="${iconCy}" r="${iconRadius}" fill="none" stroke="rgba(255,255,255,0.45)" />`;
  const monogramFill = ratingStyle === 'glass' && !useNeutralGlassPlate ? 'white' : accentColor;
  const plainIconFilter = ratingStyle === 'plain' ? ' filter="url(#plain-icon-shadow)"' : '';
  const iconImage =
    !iconDataUri
      ? ''
      : ratingStyle === 'plain'
        ? `<image href="${iconDataUri}" x="${iconX}" y="${iconY}" width="${renderIconSize}" height="${renderIconSize}" preserveAspectRatio="xMidYMid meet"${plainIconFilter} />`
        : `<defs><clipPath id="icon-clip">${iconClipPath}</clipPath></defs><image href="${iconDataUri}" x="${iconX}" y="${iconY}" width="${renderIconSize}" height="${renderIconSize}" preserveAspectRatio="xMidYMid slice" clip-path="url(#icon-clip)" />${iconBorder}`;
  const monogramText =
    iconDataUri
      ? ''
      : `<text x="${iconCx}" y="${Math.round(iconCy + iconFontSize * 0.34)}" font-family="Arial, sans-serif" font-size="${iconFontSize}" font-weight="700" text-anchor="middle" fill="${monogramFill}"${plainIconFilter}>${escapeXml(monogram)}</text>${iconBorder}`;
  const valueNumericStyle =
    ' style="font-variant-numeric: tabular-nums lining-nums; font-feature-settings: \'tnum\' 1, \'lnum\' 1;"';
  const valueAnchor = shouldCenterValueInSlot ? 'middle' : 'start';
  const valueRenderX = shouldCenterValueInSlot
    ? Math.round(valueX + valueAvailableWidth / 2)
    : valueX;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${plainBadgeDefs}
${outerRect}
${iconShape}
${iconImage}
${monogramText}
<text x="${valueRenderX}" y="${valueY}" font-family="${valueFontFamily}" font-size="${fontSize}" font-weight="800" text-anchor="${valueAnchor}" fill="white"${valueFilter}${valueLetterSpacing}${valueTextLength}${valueNumericStyle}>${escapeXml(value)}</text>
</svg>`;
};

const renderWithSharp = async (
  input: FastRenderInput,
  phases: PhaseDurations
): Promise<RenderedImagePayload> => {
  const sharp = await getSharpFactory();

  return await measurePhase(phases, 'render', async () => {
    const imageWidth = input.imageWidth ?? input.outputWidth;
    const imageHeight = input.imageHeight ?? input.outputHeight;
    const imageLeft = Math.max(0, Math.floor((input.outputWidth - imageWidth) / 2));
    const sourcePayload = await getSourceImagePayload(input.imgUrl);
    const sourceBuffer = Buffer.from(sourcePayload.body);
    const overlays: Array<{ input: Buffer; top: number; left: number }> = [];
    type GenreCollisionRect = { left: number; top: number; width: number; height: number };
    const genreCollisionRects: GenreCollisionRect[] = [];
    const trackGenreCollisionRect = (left: number, top: number, width: number, height: number) => {
      if (!(width > 0 && height > 0)) return;
      genreCollisionRects.push({
        left: Math.round(left),
        top: Math.round(top),
        width: Math.round(width),
        height: Math.round(height),
      });
    };

    const preparedImage = input.imageType === 'logo'
      ? sharp(sourceBuffer).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
      : sharp(sourceBuffer);
    const resizedImageBuffer: Buffer = await preparedImage
      .resize(imageWidth, imageHeight, {
        fit: input.imageType === 'logo' ? 'contain' : 'cover',
        position: 'center',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 1 })
      .toBuffer();
    overlays.push({ input: resizedImageBuffer, top: 0, left: imageLeft });

    const iconRenderStateByProvider = new Map<
      BadgeKey,
      { dataUri: string | null; preferNeutralGlassPlate: boolean }
    >();
    if (input.badges.length > 0) {
      const iconEntries = await Promise.all(
        input.badges.map(async (badge) => {
          const iconDataUri = await getProviderIconDataUri(badge.iconUrl);
          const preferNeutralGlassPlate = await shouldUseNeutralGlassPlateForIcon(iconDataUri);
          return [badge.key, { dataUri: iconDataUri, preferNeutralGlassPlate }] as const;
        })
      );
      for (const [providerKey, iconRenderState] of iconEntries) {
        iconRenderStateByProvider.set(providerKey, iconRenderState);
      }
    }

    const sideColumnMetrics: BadgeLayoutMetrics = {
      iconSize: input.badgeIconSize,
      fontSize: input.badgeFontSize,
      paddingX: input.badgePaddingX,
      paddingY: input.badgePaddingY,
      gap: input.badgeGap,
    };
    const badgeBaseHeight = input.badgeIconSize + input.badgePaddingY * 2;
    const ratingBadgeHeight = getBadgeHeightFromMetrics(sideColumnMetrics, input.ratingStyle);
    const qualityBadgeScaleRatio = Math.max(0.7, input.qualityBadgeScalePercent / 100);
    const resolveSideBadgeStartY = (
      columnBadges: RatingBadge[],
      metrics: BadgeLayoutMetrics = sideColumnMetrics,
      minTop = input.badgeTopOffset
    ) =>
      resolveVerticalBadgeColumnStartY({
        outputHeight: input.outputHeight,
        columnHeight: measureBadgeColumnHeight(columnBadges, metrics, input.ratingStyle),
        topOffset: input.badgeTopOffset,
        bottomOffset: input.badgeBottomOffset,
        position: input.sideRatingsPosition,
        customOffset: input.sideRatingsOffset,
        minTop,
      });
    const compactPosterRowText =
      input.imageType === 'poster' &&
      input.posterRatingsLayout !== 'left' &&
      input.posterRatingsLayout !== 'right' &&
      input.posterRatingsLayout !== 'left-right';
    const posterQualityBadgePlacement =
      input.imageType === 'poster'
        ? resolvePosterQualityBadgePlacement(
            input.posterRatingsLayout,
            input.qualityBadgesSide,
            input.posterQualityBadgesPosition
          )
        : null;
    const posterQualityBadgeSidePlacement =
      posterQualityBadgePlacement === 'left' || posterQualityBadgePlacement === 'right'
        ? posterQualityBadgePlacement
        : null;
    const posterRowRegionWidth = Math.max(0, input.outputWidth - input.posterRowHorizontalInset * 2);
    const posterTopRows =
      input.imageType === 'poster'
        ? input.posterTopRows && input.posterTopRows.length > 0
          ? input.posterTopRows
          : input.topBadges.length > 0
            ? [input.topBadges]
            : []
        : [];
    const posterBottomRows =
      input.imageType === 'poster'
        ? input.posterBottomRows && input.posterBottomRows.length > 0
          ? input.posterBottomRows
          : input.bottomBadges.length > 0
            ? [input.bottomBadges]
            : []
        : [];
    const posterTopBlockBottom =
      posterTopRows.length > 0
        ? input.badgeTopOffset + posterTopRows.length * (ratingBadgeHeight + input.badgeGap)
        : input.badgeTopOffset;
    const editorialOverlayBottom =
      input.imageType === 'poster' && input.editorialOverlay
        ? input.editorialOverlay.top + input.editorialOverlay.height
        : null;
    const editorialOverlaySafeBottom =
      editorialOverlayBottom === null
        ? null
        : editorialOverlayBottom + Math.max(10, Math.round(input.badgeGap * 1.1));
    type BlockbusterPlacementRect = { left: number; top: number; width: number; height: number };
    type BlockbusterScatterMode = 'callout' | 'blurb' | 'score';
    const intersectsBlockbusterRect = (
      left: BlockbusterPlacementRect,
      right: BlockbusterPlacementRect,
      padding = 0
    ) =>
      left.left < right.left + right.width + padding &&
      left.left + left.width > right.left - padding &&
      left.top < right.top + right.height + padding &&
      left.top + left.height > right.top - padding;
    const clampBlockbusterRect = (
      left: number,
      top: number,
      width: number,
      height: number
    ): BlockbusterPlacementRect => ({
      left: Math.max(0, Math.min(Math.round(left), Math.max(0, input.outputWidth - width))),
      top: Math.max(0, Math.min(Math.round(top), Math.max(0, input.outputHeight - height))),
      width,
      height,
    });
    const blockbusterScatterRects: BlockbusterPlacementRect[] = [];
    const blockbusterBadgeOverlays: Array<{ input: Buffer; top: number; left: number }> = [];
    const blockbusterStickerOverlays: Array<{ input: Buffer; top: number; left: number }> = [];
    const blockbusterSideMetrics: BadgeLayoutMetrics = {
      iconSize: input.badgeIconSize,
      fontSize: input.badgeFontSize,
      paddingX: input.badgePaddingX,
      paddingY: input.badgePaddingY,
      gap: input.badgeGap,
    };
    const buildPosterQualityProtectedRects = (): BlockbusterPlacementRect[] => {
      if (input.imageType !== 'poster' || input.ratingPresentation !== 'blockbuster') return [];
      const usableQualityBadges = input.qualityBadges.filter((badge) =>
        isMediaFeatureBadgeKey(String(badge.key))
      );
      if (usableQualityBadges.length === 0 || !posterQualityBadgePlacement) return [];

      const protectionPad = 18;
      if (posterQualityBadgePlacement === 'bottom') {
        const bottomQualityHeight = Math.max(
          36,
          Math.round(badgeBaseHeight * 1.05 * qualityBadgeScaleRatio),
        );
        const bottomY = Math.max(
          input.badgeTopOffset,
          input.outputHeight - input.badgeBottomOffset - bottomQualityHeight
        );
        return [
          {
            left: 0,
            top: Math.max(0, bottomY - protectionPad),
            width: input.outputWidth,
            height: input.outputHeight - Math.max(0, bottomY - protectionPad),
          },
        ];
      }

      if (posterQualityBadgePlacement === 'top') {
        const topQualityHeight = Math.max(
          36,
          Math.round(badgeBaseHeight * 1.05 * qualityBadgeScaleRatio),
        );
        return [
          {
            left: 0,
            top: 0,
            width: input.outputWidth,
            height: Math.min(input.outputHeight, input.badgeTopOffset + topQualityHeight + protectionPad),
          },
        ];
      }

      const qualityHeight = Math.max(44, Math.round(badgeBaseHeight * 1.25 * qualityBadgeScaleRatio));
      const uniformBadgeWidth = Math.min(
        Math.max(72, Math.round(qualityHeight * 1.75)),
        Math.max(72, input.outputWidth - 24)
      );
      const qualityTotalHeight =
        usableQualityBadges.length * qualityHeight +
        Math.max(0, usableQualityBadges.length - 1) * input.badgeGap;
      const centeredStartY = Math.max(
        input.badgeTopOffset,
        Math.round((input.outputHeight - qualityTotalHeight) / 2)
      );
      let qualityStartY = centeredStartY;
      const shouldTopAlignQuality =
        (input.posterRatingsLayout === 'left' || input.posterRatingsLayout === 'right') &&
        (posterQualityBadgePlacement === 'left' || posterQualityBadgePlacement === 'right');
      if (shouldTopAlignQuality) {
        qualityStartY = input.badgeTopOffset;
      } else if (posterTopRows.length > 0) {
        qualityStartY = Math.max(qualityStartY, posterTopBlockBottom);
      } else {
        const sideBadges =
          posterQualityBadgePlacement === 'right' ? input.rightBadges : input.leftBadges;
        if (sideBadges.length > 0) {
          const sideColumnHeight = measureBadgeColumnHeight(
            sideBadges,
            blockbusterSideMetrics,
            input.ratingStyle,
          );
          if (sideColumnHeight > 0) {
            qualityStartY = Math.max(
              qualityStartY,
              resolveSideBadgeStartY(sideBadges, blockbusterSideMetrics) +
                sideColumnHeight +
                input.badgeGap
            );
          }
        }
      }

      const left =
        posterQualityBadgePlacement === 'right'
          ? Math.max(0, input.outputWidth - uniformBadgeWidth - 12 - protectionPad)
          : 0;
      return [
        {
          left,
          top: Math.max(0, qualityStartY - protectionPad),
          width: Math.min(input.outputWidth - left, uniformBadgeWidth + protectionPad * 2),
          height: Math.min(
            input.outputHeight - Math.max(0, qualityStartY - protectionPad),
            qualityTotalHeight + protectionPad * 2
          ),
        },
      ];
    };
    const blockbusterProtectedRects = buildPosterQualityProtectedRects();
    const blockbusterDensityPreset = BLOCKBUSTER_DENSITY_PRESETS[input.blockbusterDensity];
    const blockbusterSeedSalt = sha1Hex(
      `${input.imgUrl}|${input.outputWidth}|${input.outputHeight}|${input.blockbusterDensity}|${input.imageType}`
    );
    const blockbusterCalloutBadges =
      input.imageType === 'poster' && input.ratingPresentation === 'blockbuster'
        ? pickBlockbusterCalloutBadges(input.badges).slice(0, blockbusterDensityPreset.calloutLimit)
        : [];
    const blockbusterCalloutKeys = new Set(blockbusterCalloutBadges.map((badge) => badge.key));
    const createBlockbusterScatterCandidates = ({
      seedKey,
      width,
      height,
      preferredLeft,
      preferredTop,
      attempts = 72,
      scatterMode = 'score',
    }: {
      seedKey: string;
      width: number;
      height: number;
      preferredLeft: number;
      preferredTop: number;
      attempts?: number;
      scatterMode?: BlockbusterScatterMode;
    }) => {
      let state = Number.parseInt(sha1Hex(`${blockbusterSeedSalt}:${seedKey}`).slice(0, 8), 16) || 1;
      const next = () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 4294967296;
      };
      const safeInset = 8;
      const horizontalRange = Math.max(0, input.outputWidth - width - safeInset * 2);
      const topInset = Math.max(8, input.badgeTopOffset - 8);
      const verticalRange = Math.max(0, input.outputHeight - height - topInset - safeInset);
      const edgeBandX = Math.max(14, Math.min(84, Math.round(input.outputWidth * 0.14)));
      const edgeBandY = Math.max(14, Math.min(88, Math.round(input.outputHeight * 0.12)));
      const anchorMap: Record<
        BlockbusterScatterMode,
        Array<{ x: number; y: number; jitterX: number; jitterY: number }>
      > = {
        callout: [
          { x: 0.04, y: 0.04, jitterX: 30, jitterY: 18 },
          { x: 0.24, y: 0.04, jitterX: 36, jitterY: 18 },
          { x: 0.52, y: 0.05, jitterX: 40, jitterY: 18 },
          { x: 0.8, y: 0.06, jitterX: 34, jitterY: 18 },
          { x: 0.04, y: 0.2, jitterX: 24, jitterY: 24 },
          { x: 0.82, y: 0.22, jitterX: 24, jitterY: 24 },
          { x: 0.08, y: 0.42, jitterX: 28, jitterY: 28 },
          { x: 0.76, y: 0.4, jitterX: 28, jitterY: 28 },
          { x: 0.14, y: 0.62, jitterX: 28, jitterY: 26 },
          { x: 0.68, y: 0.62, jitterX: 28, jitterY: 26 },
          { x: 0.42, y: 0.16, jitterX: 44, jitterY: 22 },
        ],
        blurb: [
          { x: 0.06, y: 0.18, jitterX: 26, jitterY: 24 },
          { x: 0.62, y: 0.12, jitterX: 30, jitterY: 24 },
          { x: 0.08, y: 0.36, jitterX: 28, jitterY: 26 },
          { x: 0.68, y: 0.34, jitterX: 30, jitterY: 26 },
          { x: 0.12, y: 0.58, jitterX: 28, jitterY: 24 },
          { x: 0.58, y: 0.56, jitterX: 32, jitterY: 24 },
          { x: 0.2, y: 0.74, jitterX: 26, jitterY: 18 },
          { x: 0.66, y: 0.72, jitterX: 26, jitterY: 18 },
          { x: 0.32, y: 0.24, jitterX: 36, jitterY: 24 },
          { x: 0.46, y: 0.44, jitterX: 34, jitterY: 24 },
        ],
        score: [
          { x: 0.02, y: 0.04, jitterX: 18, jitterY: 14 },
          { x: 0.84, y: 0.04, jitterX: 18, jitterY: 14 },
          { x: 0.04, y: 0.2, jitterX: 18, jitterY: 18 },
          { x: 0.84, y: 0.2, jitterX: 18, jitterY: 18 },
          { x: 0.06, y: 0.38, jitterX: 18, jitterY: 20 },
          { x: 0.84, y: 0.4, jitterX: 18, jitterY: 20 },
          { x: 0.08, y: 0.58, jitterX: 18, jitterY: 22 },
          { x: 0.82, y: 0.6, jitterX: 18, jitterY: 22 },
          { x: 0.1, y: 0.76, jitterX: 18, jitterY: 18 },
          { x: 0.78, y: 0.76, jitterX: 18, jitterY: 18 },
          { x: 0.34, y: 0.08, jitterX: 28, jitterY: 16 },
          { x: 0.56, y: 0.08, jitterX: 28, jitterY: 16 },
        ],
      };
      const candidates = [{ left: preferredLeft, top: preferredTop }];
      const anchors = anchorMap[scatterMode];
      const anchorOffset =
        anchors.length > 0
          ? (Number.parseInt(sha1Hex(`${seedKey}:anchors`).slice(0, 4), 16) || 0) % anchors.length
          : 0;

      for (let index = 0; index < anchors.length; index += 1) {
        const anchor = anchors[(index + anchorOffset) % anchors.length];
        const jitterX = Math.round((next() - 0.5) * anchor.jitterX * 2);
        const jitterY = Math.round((next() - 0.5) * anchor.jitterY * 2);
        candidates.push({
          left: safeInset + Math.round(horizontalRange * anchor.x) + jitterX,
          top: topInset + Math.round(verticalRange * anchor.y) + jitterY,
        });
      }

      for (let index = 0; index < attempts; index += 1) {
        let left = safeInset + Math.round(horizontalRange * next());
        let top = topInset + Math.round(verticalRange * next());
        const roll = next();

        if (scatterMode === 'score') {
          if (roll < 0.28) {
            left = safeInset + Math.round(edgeBandX * next());
          } else if (roll < 0.56) {
            left = safeInset + horizontalRange - Math.round(edgeBandX * next());
          } else if (roll < 0.74) {
            top = topInset + Math.round(edgeBandY * next());
          } else if (roll < 0.88) {
            top = topInset + Math.round(verticalRange * (0.56 + next() * 0.28));
          } else {
            top = topInset + Math.round(verticalRange * (0.18 + next() * 0.5));
          }
        } else if (scatterMode === 'callout') {
          if (roll < 0.32) {
            top = topInset + Math.round(edgeBandY * next());
          } else if (roll < 0.54) {
            left = safeInset + Math.round(edgeBandX * next());
          } else if (roll < 0.76) {
            left = safeInset + horizontalRange - Math.round(edgeBandX * next());
          } else {
            top = topInset + Math.round(verticalRange * (0.12 + next() * 0.48));
          }
        } else {
          if (roll < 0.24) {
            left = safeInset + Math.round(edgeBandX * next());
          } else if (roll < 0.48) {
            left = safeInset + horizontalRange - Math.round(edgeBandX * next());
          } else if (roll < 0.72) {
            top = topInset + Math.round(verticalRange * (0.14 + next() * 0.44));
          } else {
            top = topInset + Math.round(verticalRange * (0.32 + next() * 0.4));
          }
        }

        candidates.push({ left, top });
      }

      return candidates;
    };
    const placeBlockbusterRect = ({
      width,
      height,
      seedKey,
      preferredLeft,
      preferredTop,
      attempts = 72,
      protectedPadding = 18,
      occupiedPadding = 10,
      scatterMode = 'score',
      relaxedOccupiedPadding = 0,
    }: {
      width: number;
      height: number;
      seedKey: string;
      preferredLeft: number;
      preferredTop: number;
      attempts?: number;
      protectedPadding?: number;
      occupiedPadding?: number;
      scatterMode?: BlockbusterScatterMode;
      relaxedOccupiedPadding?: number;
    }): BlockbusterPlacementRect | null => {
      const candidates = createBlockbusterScatterCandidates({
        seedKey,
        width,
        height,
        preferredLeft,
        preferredTop,
        attempts,
        scatterMode,
      });
      const occupiedPaddingPasses = Array.from(
        new Set([
          Math.max(0, Math.round(occupiedPadding)),
          Math.max(Math.max(0, relaxedOccupiedPadding), Math.round(occupiedPadding * 0.5)),
          Math.max(0, Math.round(relaxedOccupiedPadding)),
        ])
      ).sort((left, right) => right - left);

      for (const occupiedPaddingForPass of occupiedPaddingPasses) {
        for (let index = 0; index < candidates.length; index += 1) {
          const candidate = candidates[index];
          const rect = clampBlockbusterRect(candidate.left, candidate.top, width, height);
          const hitsProtected = blockbusterProtectedRects.some((target) =>
            intersectsBlockbusterRect(rect, target, protectedPadding)
          );
          if (hitsProtected) continue;
          const hitsPlaced = blockbusterScatterRects.some((target) =>
            intersectsBlockbusterRect(rect, target, occupiedPaddingForPass)
          );
          if (hitsPlaced) continue;
          blockbusterScatterRects.push(rect);
          return rect;
        }
      }

      return null;
    };
    const alignPosterRowWithQuality =
      input.imageType === 'poster' && input.qualityBadges.length > 0 && posterQualityBadgeSidePlacement !== null;
    const posterRowAlign: 'left' | 'center' | 'right' = alignPosterRowWithQuality
      ? posterQualityBadgeSidePlacement === 'right'
        ? 'right'
        : 'left'
      : 'center';
    const posterTitleSpec =
      input.imageType === 'poster' && input.posterTitleText
        ? buildPosterTitleSvg(input.posterTitleText, posterRowRegionWidth)
        : null;
    let posterLogoSpec: { buffer: Buffer; width: number; height: number } | null = null;
    if (input.imageType === 'poster' && input.posterLogoUrl) {
      try {
        const logoPayload = await getSourceImagePayload(input.posterLogoUrl);
        const logoBuffer = Buffer.from(logoPayload.body);
        const logoMeta = await sharp(logoBuffer).metadata();
        if (logoMeta.width && logoMeta.height) {
          const maxLogoWidth = Math.min(posterRowRegionWidth, Math.round(input.outputWidth * 0.78));
          const maxLogoHeight = Math.max(48, Math.round(input.outputHeight * 0.16));
          const scale = Math.min(
            1,
            maxLogoWidth / logoMeta.width,
            maxLogoHeight / logoMeta.height
          );
          const logoWidth = Math.max(1, Math.round(logoMeta.width * scale));
          const logoHeight = Math.max(1, Math.round(logoMeta.height * scale));
          const resizedLogoBuffer = await sharp(logoBuffer)
            .resize(logoWidth, logoHeight, { fit: 'fill' })
            .png()
            .toBuffer();
          posterLogoSpec = { buffer: resizedLogoBuffer, width: logoWidth, height: logoHeight };
        }
      } catch {
        posterLogoSpec = null;
      }
    }
    const composeBadgeRow = (
      rowBadges: RatingBadge[],
      rowY: number,
      options?: {
        maxRowWidth?: number;
        regionLeft?: number;
        regionWidth?: number;
        align?: 'left' | 'center' | 'right';
        splitAcrossHalves?: boolean;
        spreadAcrossThirds?: boolean;
      }
    ) => {
      if (rowBadges.length === 0) return;
      const rowEntries = rowBadges.map((badge) => {
        const badgeWidth = estimateRenderedBadgeWidth(
          badge,
          input.badgeFontSize,
          input.badgePaddingX,
          input.badgeIconSize,
          input.badgeGap,
          compactPosterRowText,
          input.ratingStyle
        );
        const minBadgeWidth = getMinimumCompressedRenderedBadgeWidth(
          badge,
          input.badgeFontSize,
          input.badgePaddingX,
          input.badgeIconSize,
          input.badgeGap,
          compactPosterRowText,
          input.ratingStyle
        );
        return { badge, badgeWidth, minBadgeWidth };
      });
      const regionLeft = Math.max(0, Math.floor(options?.regionLeft ?? 0));
      const regionWidth = Math.max(0, Math.floor(options?.regionWidth ?? input.outputWidth));
      const regionRight = Math.min(input.outputWidth, regionLeft + regionWidth);
      const effectiveMaxWidth =
        typeof options?.maxRowWidth === 'number'
          ? Math.min(options.maxRowWidth, Math.max(0, regionWidth - 24))
          : Math.max(0, regionWidth - 24);
      let rowGap = input.badgeGap;
      const measureCurrentRowWidth = () =>
        rowEntries.reduce((acc, entry) => acc + entry.badgeWidth, 0) +
        Math.max(0, rowEntries.length - 1) * rowGap;
      let rowWidth = measureCurrentRowWidth();
      if (rowWidth > effectiveMaxWidth && rowEntries.length > 1 && rowGap > 0) {
        const shrinkPerGap = Math.min(
          rowGap,
          Math.max(1, Math.ceil((rowWidth - effectiveMaxWidth) / (rowEntries.length - 1)))
        );
        rowGap = Math.max(0, rowGap - shrinkPerGap);
        rowWidth = measureCurrentRowWidth();
      }
      if (rowWidth > effectiveMaxWidth) {
        let overflow = rowWidth - effectiveMaxWidth;
        let guard = 0;
        while (overflow > 0 && guard < rowEntries.length * 8) {
          let changed = false;
          for (const entry of rowEntries) {
            if (overflow <= 0) break;
            const shrinkable = Math.max(0, entry.badgeWidth - entry.minBadgeWidth);
            if (shrinkable <= 0) continue;
            const shrink = Math.min(shrinkable, Math.max(1, Math.ceil(overflow / rowEntries.length)));
            entry.badgeWidth -= shrink;
            overflow -= shrink;
            changed = true;
          }
          if (!changed) break;
          rowWidth = measureCurrentRowWidth();
          overflow = Math.max(0, rowWidth - effectiveMaxWidth);
          guard += 1;
        }
        rowWidth = measureCurrentRowWidth();
      }
      const isPosterRowLayout =
        input.imageType === 'poster' &&
        (input.posterRatingsLayout === 'top' ||
          input.posterRatingsLayout === 'bottom' ||
          input.posterRatingsLayout === 'top-bottom');
      const shouldCenterSingle = isPosterRowLayout && rowEntries.length === 1;
      const shouldSplitRow =
        (isPosterRowLayout || options?.splitAcrossHalves === true) && rowEntries.length === 2;
      const shouldSpreadRow =
        (isPosterRowLayout || options?.spreadAcrossThirds === true) && rowEntries.length === 3;
      if (shouldCenterSingle) {
        const centerX =
          regionLeft + Math.floor(regionWidth / 2) - Math.floor(rowEntries[0].badgeWidth / 2);
        const clampedX = Math.max(
          regionLeft,
          Math.min(centerX, Math.max(regionLeft, regionRight - rowEntries[0].badgeWidth))
        );
        const entry = rowEntries[0];
        pushBadgeOverlay({
          badge: entry.badge,
          badgeWidth: entry.badgeWidth,
          rowX: clampedX,
          rowY,
          compactText: compactPosterRowText,
        });
        return;
      }
      if (shouldSplitRow) {
        const edgeInset = 12;
        const leftHalfWidth = Math.floor(regionWidth / 2);
        const rightHalfWidth = Math.max(0, regionWidth - leftHalfWidth);
        const leftMin = regionLeft + edgeInset;
        const leftMax = regionLeft + leftHalfWidth - edgeInset - rowEntries[0].badgeWidth;
        const rightMin = regionLeft + leftHalfWidth + edgeInset;
        const rightMax = regionRight - edgeInset - rowEntries[1].badgeWidth;
        if (leftMin <= leftMax && rightMin <= rightMax) {
          const leftCenterX =
            regionLeft + Math.floor(leftHalfWidth / 2) - Math.floor(rowEntries[0].badgeWidth / 2);
          const rightCenterX =
            regionLeft +
            leftHalfWidth +
            Math.floor(rightHalfWidth / 2) -
            Math.floor(rowEntries[1].badgeWidth / 2);
          const leftX = Math.max(leftMin, Math.min(leftCenterX, leftMax));
          const rightX = Math.max(rightMin, Math.min(rightCenterX, rightMax));
          const overlaps = leftX + rowEntries[0].badgeWidth + rowGap > rightX;
          if (!overlaps) {
            const positions = [leftX, rightX];
            for (let index = 0; index < rowEntries.length; index += 1) {
              const entry = rowEntries[index];
              pushBadgeOverlay({
                badge: entry.badge,
                badgeWidth: entry.badgeWidth,
                rowX: positions[index],
                rowY,
                compactText: compactPosterRowText,
              });
            }
            return;
          }
        }
      }
      if (shouldSpreadRow) {
        const edgeInset = 12;
        const leftX = regionLeft + edgeInset;
        const centerX = regionLeft + Math.floor(regionWidth / 2) - Math.floor(rowEntries[1].badgeWidth / 2);
        const rightX = Math.max(regionLeft, regionRight - rowEntries[2].badgeWidth - edgeInset);
        const overlaps =
          leftX + rowEntries[0].badgeWidth + rowGap > centerX ||
          centerX + rowEntries[1].badgeWidth + rowGap > rightX;
        if (!overlaps) {
          const positions = [leftX, centerX, rightX];
          for (let index = 0; index < rowEntries.length; index += 1) {
            const entry = rowEntries[index];
            pushBadgeOverlay({
              badge: entry.badge,
              badgeWidth: entry.badgeWidth,
              rowX: positions[index],
              rowY,
              compactText: compactPosterRowText,
            });
          }
          return;
        }
      }
      const align = options?.align || 'center';
      const preferredEdgeInset = 12;
      const dynamicEdgeInset =
        rowWidth > effectiveMaxWidth
          ? Math.max(0, Math.min(preferredEdgeInset, Math.floor((regionWidth - rowWidth) / 2)))
          : preferredEdgeInset;
      const minRowX = regionLeft + dynamicEdgeInset;
      const maxRowX = Math.max(regionLeft, regionRight - rowWidth - dynamicEdgeInset);
      let rowX =
        align === 'left'
          ? minRowX
          : align === 'right'
            ? maxRowX
            : regionLeft + Math.floor((regionWidth - rowWidth) / 2);
      if (rowWidth > effectiveMaxWidth) {
        rowX =
          align === 'right'
            ? Math.max(regionLeft, regionRight - rowWidth)
            : align === 'left'
              ? regionLeft
              : regionLeft + Math.floor((regionWidth - rowWidth) / 2);
      }
      rowX = Math.max(regionLeft, Math.min(rowX, Math.max(regionLeft, regionRight - rowWidth)));

      for (const entry of rowEntries) {
        pushBadgeOverlay({
          badge: entry.badge,
          badgeWidth: entry.badgeWidth,
          rowX,
          rowY,
          compactText: compactPosterRowText,
        });
        rowX += entry.badgeWidth + rowGap;
      }
    };
    const composePosterCleanOverlayAboveBottom = (bottomBlockTopY: number) => {
      if (input.imageType !== 'poster') return;
      const overlay = posterLogoSpec
        ? {
          buffer: posterLogoSpec.buffer,
          width: posterLogoSpec.width,
          height: posterLogoSpec.height,
        }
        : posterTitleSpec
          ? {
            buffer: Buffer.from(posterTitleSpec.svg),
            width: posterTitleSpec.width,
            height: posterTitleSpec.height,
          }
          : null;
      if (!overlay) return;
      const overlayGap = Math.max(8, Math.round(input.badgeGap * 0.9));
      let overlayY = Math.round(bottomBlockTopY - overlayGap - overlay.height);
      const topRowBottom = posterTopBlockBottom;
      if (overlayY < topRowBottom) {
        overlayY = topRowBottom;
      }
      if (overlayY + overlay.height + overlayGap > bottomBlockTopY) {
        return;
      }
      const overlayX = Math.max(
        input.posterRowHorizontalInset,
        Math.round((input.outputWidth - overlay.width) / 2)
      );
      overlays.push({ input: overlay.buffer, top: overlayY, left: overlayX });
    };
    const pushBadgeOverlay = ({
      badge,
      badgeWidth,
      rowX,
      rowY,
      compactText = compactPosterRowText,
    }: {
      badge: RatingBadge;
      badgeWidth: number;
      rowX: number;
      rowY: number;
      compactText?: boolean;
    }) => {
      const monogram = buildProviderMonogram(
        badge.label || String(badge.key).toUpperCase()
      );
      const badgeSvg = buildBadgeSvg({
        width: badgeWidth,
        height: ratingBadgeHeight,
        iconSize: input.badgeIconSize,
        fontSize: input.badgeFontSize,
        paddingX: input.badgePaddingX,
        gap: input.badgeGap,
        accentColor: badge.accentColor,
        monogram,
        iconDataUri: iconRenderStateByProvider.get(badge.key)?.dataUri || null,
        iconKey: badge.key,
        labelText: badge.label,
        value: badge.value,
        badgeVariant: badge.variant || 'standard',
        ratingStyle: input.ratingStyle,
        iconScalePercent: badge.iconScalePercent,
        stackedLineVisible: badge.stackedLineVisible,
        stackedLineWidthPercent: badge.stackedLineWidthPercent,
        stackedLineHeightPercent: badge.stackedLineHeightPercent,
        stackedLineGapPercent: badge.stackedLineGapPercent,
        stackedSurfaceOpacityPercent: badge.stackedSurfaceOpacityPercent,
        stackedAccentMode: badge.stackedAccentMode,
        preferNeutralGlassPlate:
          iconRenderStateByProvider.get(badge.key)?.preferNeutralGlassPlate || false,
        compactText,
      });

      if (
        input.imageType === 'poster' &&
        input.ratingPresentation === 'blockbuster' &&
        (badge.variant || 'standard') === 'standard'
      ) {
        return;
      }

      overlays.push({ input: Buffer.from(badgeSvg), top: rowY, left: rowX });
      trackGenreCollisionRect(rowX, rowY, badgeWidth, ratingBadgeHeight);
    };
    const composeBlockbusterPosterCallouts = () => {
      if (input.imageType !== 'poster' || input.ratingPresentation !== 'blockbuster') return;
      const calloutBadges = blockbusterCalloutBadges;
      if (calloutBadges.length === 0) return;

      for (let index = 0; index < calloutBadges.length; index += 1) {
        const badge = calloutBadges[index];
        const hash = sha1Hex(`${blockbusterSeedSalt}:${badge.key}:${badge.value}:callout`);
        const rotationBias = ((Number.parseInt(hash.slice(4, 8), 16) || 0) % 600) / 100 - 3;
        const headline = getBlockbusterCalloutHeadline(badge);
        const detail = getBlockbusterCalloutDetail(badge, headline);
        const monogram = buildProviderMonogram(
          badge.label || String(badge.key).toUpperCase()
        );
        const callout = buildBlockbusterCalloutSvg({
          headline,
          detail,
          accentColor: badge.accentColor,
          rotation: rotationBias,
          iconDataUri: iconRenderStateByProvider.get(badge.key)?.dataUri || null,
          iconMonogram: monogram,
        });
        const transformedCallout = buildTransformedSvgOverlay({
          svg: callout.svg,
          width: callout.width,
          height: callout.height,
          rotation: 0,
          opacity: 1,
          scale: getBlockbusterDensityScale(blockbusterDensityPreset.calloutScales, index),
          pad: 6,
        });
        const chaos = getBlockbusterBadgeChaos(badge, blockbusterSeedSalt);
        const preferredHorizontalRatio =
          chaos.spreadX < 0.33 ? 0.02 + chaos.spreadX * 0.18
          : chaos.spreadX > 0.66 ? 0.72 + (chaos.spreadX - 0.66) * 0.32
          : 0.24 + (chaos.spreadX - 0.33) * 0.72;
        const placement = placeBlockbusterRect({
          width: transformedCallout.width,
          height: transformedCallout.height,
          seedKey: `callout:${badge.key}:${badge.value}:${blockbusterSeedSalt}`,
          preferredLeft: Math.round(
            Math.max(
              0,
              (input.outputWidth - transformedCallout.width) * preferredHorizontalRatio + chaos.xJitter * 0.35
            )
          ),
          preferredTop: Math.round(
            Math.max(
              posterTopBlockBottom + 8,
              (input.outputHeight - transformedCallout.height) * (0.04 + chaos.spreadY * 0.58)
            )
          ),
          attempts: blockbusterDensityPreset.calloutAttempts,
          protectedPadding: 20,
          occupiedPadding: blockbusterDensityPreset.calloutPadding,
          scatterMode: 'callout',
          relaxedOccupiedPadding: 0,
        });
        if (!placement) continue;
        blockbusterStickerOverlays.push({
          input: Buffer.from(transformedCallout.svg),
          top: placement.top,
          left: placement.left,
        });
        trackGenreCollisionRect(
          placement.left,
          placement.top,
          transformedCallout.width,
          transformedCallout.height
        );
      }
    };
    const composeBlockbusterReviewBlurbs = () => {
      if (input.imageType !== 'poster' || input.ratingPresentation !== 'blockbuster') return;
      const blurbs = (input.blockbusterBlurbs || []).slice(0, blockbusterDensityPreset.blurbLimit);
      if (blurbs.length === 0) return;

      for (let index = 0; index < blurbs.length; index += 1) {
        const blurb = blurbs[index];
        const hash = sha1Hex(`${blockbusterSeedSalt}:${blurb.author}:${blurb.text}`);
        const chaos = getBlockbusterBlurbChaos(hash, input.blockbusterDensity);
        const reviewCallout = buildBlockbusterReviewCalloutSvg({
          text: blurb.text,
          author: blurb.author,
          rotation: 0,
        });
        const transformedReviewCallout = buildTransformedSvgOverlay({
          svg: reviewCallout.svg,
          width: reviewCallout.width,
          height: reviewCallout.height,
          rotation: chaos.outerRotation,
          opacity: 1,
          scale: Math.max(
            0.72,
            Math.min(
              1.2,
              getBlockbusterDensityScale(blockbusterDensityPreset.blurbScales, index) * chaos.scale
            )
          ),
          skewX: chaos.skewX,
          skewY: chaos.skewY,
          pad: chaos.isNearVertical ? 38 : 22,
        });
        const preferredHorizontalRatio =
          chaos.horizontalBias < 0.33
            ? 0.03 + chaos.horizontalBias * 0.45
            : chaos.horizontalBias > 0.66
              ? 0.68 + (chaos.horizontalBias - 0.66) * 0.74
              : 0.18 + (chaos.horizontalBias - 0.33) * 1.02;
        const placement = placeBlockbusterRect({
          width: transformedReviewCallout.width,
          height: transformedReviewCallout.height,
          seedKey: `blurb:${hash}`,
          preferredLeft: Math.round(
            Math.max(
              0,
              (input.outputWidth - transformedReviewCallout.width) * preferredHorizontalRatio
            )
          ),
          preferredTop: Math.round(
            Math.max(
              posterTopBlockBottom + 18,
              (input.outputHeight - transformedReviewCallout.height) *
                (0.08 + chaos.verticalBias * 0.72)
            )
          ),
          attempts: blockbusterDensityPreset.blurbAttempts,
          protectedPadding: 24,
          occupiedPadding: blockbusterDensityPreset.blurbPadding,
          scatterMode: 'blurb',
          relaxedOccupiedPadding: 0,
        });
        if (!placement) continue;
        blockbusterStickerOverlays.push({
          input: Buffer.from(transformedReviewCallout.svg),
          top: placement.top,
          left: placement.left,
        });
        trackGenreCollisionRect(
          placement.left,
          placement.top,
          transformedReviewCallout.width,
          transformedReviewCallout.height
        );
      }
    };
    const composeBlockbusterScoreTiles = () => {
      if (input.imageType !== 'poster' || input.ratingPresentation !== 'blockbuster') return;
      const scoreBadges = pickBlockbusterScoreBadges(input.badges).slice(
        0,
        blockbusterDensityPreset.badgeScales.length
      ).filter((badge) => !blockbusterCalloutKeys.has(badge.key));
      for (let index = 0; index < scoreBadges.length; index += 1) {
        const badge = scoreBadges[index];
        const chaos = getBlockbusterBadgeChaos(badge, blockbusterSeedSalt);
        const monogram = buildProviderMonogram(
          badge.label || String(badge.key).toUpperCase()
        );
        const scoreTile = buildBlockbusterScoreTileSvg({
          badge,
          iconDataUri: iconRenderStateByProvider.get(badge.key)?.dataUri || null,
          iconMonogram: monogram,
        });
        const scaledBadge = buildTransformedSvgOverlay({
          svg: scoreTile.svg,
          width: scoreTile.width,
          height: scoreTile.height,
          rotation: chaos.rotation * 0.5,
          opacity: 1,
          scale: getBlockbusterDensityScale(blockbusterDensityPreset.badgeScales, index),
          pad: 4,
        });
        const placement = placeBlockbusterRect({
          width: scaledBadge.width,
          height: scaledBadge.height,
          seedKey: `score:${badge.key}:${badge.value}:${blockbusterSeedSalt}`,
          preferredLeft: Math.round(
            Math.max(
              0,
              (input.outputWidth - scaledBadge.width) *
                (chaos.spreadX < 0.33 ? 0.02 : chaos.spreadX > 0.66 ? 0.82 : 0.38)
            ) + chaos.xJitter * 0.18
          ),
          preferredTop: Math.round(
            Math.max(
              posterTopBlockBottom,
              (input.outputHeight - scaledBadge.height) * (0.04 + chaos.spreadY * 0.82)
            )
          ),
          attempts: blockbusterDensityPreset.badgeAttempts,
          protectedPadding: 20,
          occupiedPadding: blockbusterDensityPreset.badgePadding,
          scatterMode: 'score',
          relaxedOccupiedPadding: 0,
        });
        if (!placement) continue;
        blockbusterBadgeOverlays.push({
          input: Buffer.from(scaledBadge.svg),
          top: placement.top,
          left: placement.left,
        });
        trackGenreCollisionRect(
          placement.left,
          placement.top,
          scaledBadge.width,
          scaledBadge.height
        );
      }
    };
    const composeEdgeAlignedPosterBadge = (
      badge: RatingBadge,
      rowY: number,
      side: 'left' | 'right',
      maxBadgeWidth: number
    ) => {
      const estimatedWidth = estimateRenderedBadgeWidth(
        badge,
        input.badgeFontSize,
        input.badgePaddingX,
        input.badgeIconSize,
        input.badgeGap,
        false,
        input.ratingStyle
      );
      const badgeWidth = Math.min(estimatedWidth, maxBadgeWidth);
      const rowX =
        side === 'left'
          ? 12
          : Math.max(12, input.outputWidth - badgeWidth - 12);
      pushBadgeOverlay({ badge, badgeWidth, rowX, rowY, compactText: false });
    };
    const composeBadgeColumn = (
      columnBadges: RatingBadge[],
      side: 'left' | 'right',
      maxBadgeWidth: number,
      origin: 'top' | 'bottom' = 'top',
      startY?: number
    ) => {
      if (columnBadges.length === 0) return;
      let rowY =
        typeof startY === 'number'
          ? Math.max(input.badgeTopOffset, startY)
          : origin === 'bottom'
          ? Math.max(input.badgeTopOffset, input.outputHeight - input.badgeBottomOffset - ratingBadgeHeight)
          : input.badgeTopOffset;
      for (let index = 0; index < columnBadges.length; index += 1) {
        const badge = columnBadges[index];
        composeEdgeAlignedPosterBadge(badge, rowY, side, maxBadgeWidth);
        rowY +=
          origin === 'bottom'
            ? -(ratingBadgeHeight + input.badgeGap)
            : ratingBadgeHeight + input.badgeGap;
      }
    };
    const composeQualityBadgeColumn = (
      columnBadges: RatingBadge[],
      startY: number,
      side: QualityBadgesSide
    ) => {
      if (columnBadges.length === 0) return;
      const qualityHeight = Math.max(44, Math.round(badgeBaseHeight * 1.25 * qualityBadgeScaleRatio));
      const useIntrinsicWidths = usesIntrinsicQualityBadgeWidths(input.qualityBadgesStyle);
      const uniformBadgeWidth = useIntrinsicWidths
        ? null
        : Math.min(
            Math.max(72, Math.round(qualityHeight * 1.75)),
            Math.max(72, input.outputWidth - 24)
          );
      let rowY = Math.max(input.badgeTopOffset, startY);
      for (let index = 0; index < columnBadges.length; index += 1) {
        const badge = columnBadges[index];
        const spec = buildQualityBadgeSvg(
          badge,
          qualityHeight,
          uniformBadgeWidth ?? undefined,
          input.qualityBadgesStyle
        );
        if (!spec) continue;
        const badgeWidth =
          uniformBadgeWidth === null ? spec.width : Math.min(spec.width, uniformBadgeWidth);
        const badgeHeightForRow = spec.height;
        const rowX =
          side === 'right'
            ? Math.max(12, input.outputWidth - badgeWidth - 12)
            : 12;
        overlays.push({ input: Buffer.from(spec.svg), top: rowY, left: rowX });
        trackGenreCollisionRect(rowX, rowY, badgeWidth, badgeHeightForRow);
        rowY += badgeHeightForRow + input.badgeGap;
      }
    };
    const composeQualityBadgeRow = (
      rowBadges: RatingBadge[],
      rowY: number,
      baseHeight?: number
    ) => {
      if (rowBadges.length === 0) return;
      const maxRowWidth = Math.max(0, input.outputWidth - 24);
      const useIntrinsicWidths = usesIntrinsicQualityBadgeWidths(input.qualityBadgesStyle);
      let qualityHeight = Math.max(
        36,
        Math.round((baseHeight ?? badgeBaseHeight * 1.05) * qualityBadgeScaleRatio),
      );
      let badgeWidth =
        useIntrinsicWidths
          ? null
          : Math.min(
              Math.max(64, Math.round(qualityHeight * 1.75)),
              Math.max(64, input.outputWidth - 24)
            );
      let rowGap = input.badgeGap;
      let specs = rowBadges
        .map((badge) =>
          buildQualityBadgeSvg(
            badge,
            qualityHeight,
            badgeWidth ?? undefined,
            input.qualityBadgesStyle
          )
        )
        .filter((spec): spec is NonNullable<typeof spec> => Boolean(spec));
      let rowWidth =
        specs.reduce((sum, spec) => sum + spec.width, 0) + Math.max(0, specs.length - 1) * rowGap;
      if (rowWidth > maxRowWidth && specs.length > 1) {
        const ratio = Math.max(0.45, maxRowWidth / rowWidth);
        const heightRatio = Math.max(0.72, Math.min(1, ratio));
        qualityHeight = Math.max(30, Math.floor(qualityHeight * heightRatio));
        if (badgeWidth !== null) {
          badgeWidth = Math.min(
            Math.max(58, Math.floor(badgeWidth * ratio)),
            Math.max(58, input.outputWidth - 24)
          );
        }
        specs = rowBadges
          .map((badge) =>
            buildQualityBadgeSvg(
              badge,
              qualityHeight,
              badgeWidth ?? undefined,
              input.qualityBadgesStyle
            )
          )
          .filter((spec): spec is NonNullable<typeof spec> => Boolean(spec));
        rowWidth =
          specs.reduce((sum, spec) => sum + spec.width, 0) + Math.max(0, specs.length - 1) * rowGap;
        if (rowWidth > maxRowWidth) {
          const availableForGaps = Math.max(0, maxRowWidth - specs.reduce((sum, spec) => sum + spec.width, 0));
          rowGap = specs.length > 1 ? Math.max(0, Math.floor(availableForGaps / (specs.length - 1))) : 0;
          rowWidth =
            specs.reduce((sum, spec) => sum + spec.width, 0) + Math.max(0, specs.length - 1) * rowGap;
        }
      }
      let rowX = Math.floor((input.outputWidth - rowWidth) / 2);
      rowX = Math.max(12, Math.min(rowX, Math.max(12, input.outputWidth - rowWidth - 12)));
      for (const spec of specs) {
        overlays.push({ input: Buffer.from(spec.svg), top: rowY, left: rowX });
        trackGenreCollisionRect(rowX, rowY, spec.width, spec.height);
        rowX += spec.width + rowGap;
      }
    };
    const renderQualityBadgeColumnAt = (
      columnBadges: RatingBadge[],
      startY: number,
      x: number,
      qualityHeight: number,
      uniformBadgeWidth: number
    ) => {
      if (columnBadges.length === 0) return;
      let rowY = Math.max(input.badgeTopOffset, startY);
      const useIntrinsicWidths = usesIntrinsicQualityBadgeWidths(input.qualityBadgesStyle);
      const clampedX = Math.round(x);
      for (let index = 0; index < columnBadges.length; index += 1) {
        const badge = columnBadges[index];
        const spec = buildQualityBadgeSvg(
          badge,
          qualityHeight,
          useIntrinsicWidths ? undefined : uniformBadgeWidth,
          input.qualityBadgesStyle
        );
        if (!spec) continue;
        const badgeWidth = useIntrinsicWidths ? spec.width : uniformBadgeWidth;
        const adjustedX = Math.max(
          12,
          Math.min(clampedX, Math.max(12, input.outputWidth - badgeWidth - 12))
        );
        overlays.push({ input: Buffer.from(spec.svg), top: rowY, left: adjustedX });
        trackGenreCollisionRect(adjustedX, rowY, badgeWidth, spec.height);
        rowY += spec.height + input.badgeGap;
      }
    };
    const composeGenreBadge = () => {
      if (!input.genreBadge) return;
      const spec = buildGenreBadgeSvg(input.genreBadge, input.imageType);
      const maxLeft = Math.max(12, input.outputWidth - spec.width - 12);
      const maxTop = Math.max(12, input.outputHeight - spec.height - 12);
      let left = 12;
      let top = Math.min(maxTop, Math.max(12, input.badgeTopOffset));

      if (input.imageType === 'logo') {
        top = 12;
      } else if (input.imageType === 'poster') {
        let align: 'left' | 'center' | 'right' = 'left';
        if (input.posterRatingsLayout === 'left') {
          align = 'right';
        } else if (input.posterRatingsLayout === 'left-right') {
          align = 'center';
        }

        if (posterTopRows.length > 0) {
          top = Math.min(maxTop, Math.max(12, posterTopBlockBottom));
          if (input.posterRatingsLayout === 'left-right') {
            align = 'center';
          }
        }

        left =
          align === 'right'
            ? maxLeft
            : align === 'center'
              ? Math.max(12, Math.min(maxLeft, Math.round((input.outputWidth - spec.width) / 2)))
              : 12;
      }

      const collisionPadding = Math.max(8, Math.round(input.badgeGap * 0.9));
      let adjustedTop = top;
      for (let pass = 0; pass < genreCollisionRects.length + 2; pass += 1) {
        let nextTop = adjustedTop;
        for (const rect of genreCollisionRects) {
          const overlapsHorizontally =
            left < rect.left + rect.width + collisionPadding &&
            left + spec.width > rect.left - collisionPadding;
          const overlapsVertically =
            adjustedTop < rect.top + rect.height + collisionPadding &&
            adjustedTop + spec.height > rect.top - collisionPadding;
          if (!overlapsHorizontally || !overlapsVertically) continue;
          nextTop = Math.max(nextTop, rect.top + rect.height + collisionPadding);
        }
        const clampedNextTop = Math.min(maxTop, nextTop);
        if (clampedNextTop === adjustedTop) break;
        adjustedTop = clampedNextTop;
      }

      top = adjustedTop;
      overlays.push({ input: Buffer.from(spec.svg), top, left });
    };

    if (input.imageType === 'poster' && input.editorialOverlay) {
      overlays.push({
        input: Buffer.from(input.editorialOverlay.svg),
        top: input.editorialOverlay.top,
        left: input.editorialOverlay.left,
      });
      trackGenreCollisionRect(
        input.editorialOverlay.left,
        input.editorialOverlay.top,
        input.editorialOverlay.width,
        input.editorialOverlay.height,
      );
    }

    if (input.imageType === 'logo') {
      if (input.badges.length > 0 && input.logoBadgeBandHeight > 0 && input.logoBadgesPerRow > 0) {
        const rows = chunkBy(input.badges, input.logoBadgesPerRow);
        const rowsTotalHeight =
          rows.length * ratingBadgeHeight + Math.max(0, rows.length - 1) * input.badgeGap;
        let rowY =
          input.outputHeight +
          Math.max(0, Math.floor((input.logoBadgeBandHeight - rowsTotalHeight) / 2));
        for (const row of rows) {
          composeBadgeRow(row, rowY, { maxRowWidth: input.logoBadgeMaxWidth });
          rowY += ratingBadgeHeight + input.badgeGap;
        }
      }
    } else if (
      input.badges.length > 0 ||
      (input.imageType === 'poster' && (posterTitleSpec || posterLogoSpec))
    ) {
      if (input.imageType === 'backdrop') {
        if (input.backdropRatingsLayout === 'right-vertical') {
          const maxBadgeWidth = Math.max(180, Math.floor(input.outputWidth * 0.28));
          composeBadgeColumn(
            input.rightBadges,
            'right',
            maxBadgeWidth,
            'top',
            resolveSideBadgeStartY(input.rightBadges)
          );
        } else {
          const backdropRegion = getBackdropBadgeRegion(input.outputWidth, input.backdropRatingsLayout);
          const backdropRows =
            input.backdropRows && input.backdropRows.length > 0
              ? input.backdropRows
              : [input.topBadges, input.bottomBadges].filter((row) => row.length > 0);
          let rowY = input.badgeTopOffset;
          for (const row of backdropRows) {
            composeBadgeRow(row, rowY, {
              regionLeft: backdropRegion.left,
              regionWidth: backdropRegion.width,
            });
            rowY += ratingBadgeHeight + input.badgeGap;
          }
        }
      } else if (input.imageType === 'poster') {
        const bottomRowY = Math.max(
          input.badgeTopOffset,
          input.outputHeight - input.badgeBottomOffset - ratingBadgeHeight
        );
        if (input.posterRatingsLayout === 'left' || input.posterRatingsLayout === 'right') {
          const maxBadgeWidth = Math.max(180, Math.floor(input.outputWidth * 0.46));
          const sideBadges =
            input.posterRatingsLayout === 'left' ? input.leftBadges : input.rightBadges;
          composeBadgeColumn(
            sideBadges,
            input.posterRatingsLayout,
            maxBadgeWidth,
            'top',
            resolveSideBadgeStartY(sideBadges)
          );
        } else if (input.posterRatingsLayout === 'left-right') {
          const maxBadgeWidth = Math.max(160, Math.floor((input.outputWidth - 36) / 2));
          const hasThreeBadgeTopRow =
            input.topBadges.length === 1 &&
            input.leftBadges.length > 0 &&
            input.rightBadges.length > 0;
          const remainingLeftBadges = hasThreeBadgeTopRow ? input.leftBadges.slice(1) : input.leftBadges;
          const remainingRightBadges = hasThreeBadgeTopRow ? input.rightBadges.slice(1) : input.rightBadges;

          if (hasThreeBadgeTopRow) {
            composeBadgeRow(
              [input.leftBadges[0], input.topBadges[0], input.rightBadges[0]],
              input.badgeTopOffset,
              {
                regionLeft: 0,
                regionWidth: input.outputWidth,
                spreadAcrossThirds: true,
              }
            );
          } else if (input.topBadges.length > 0) {
            composeBadgeRow(input.topBadges, input.badgeTopOffset, {
              regionLeft: input.posterRowHorizontalInset,
              regionWidth: posterRowRegionWidth,
              align: 'center',
            });
          }

          const sideStartY =
            resolveSideBadgeStartY(
              remainingLeftBadges.length >= remainingRightBadges.length
                ? remainingLeftBadges
                : remainingRightBadges,
              sideColumnMetrics,
              input.topBadges.length > 0
                ? input.badgeTopOffset + ratingBadgeHeight + input.badgeGap
                : input.badgeTopOffset
            );
          if (remainingLeftBadges.length === remainingRightBadges.length) {
            for (let index = 0; index < remainingLeftBadges.length; index += 1) {
              const rowY = sideStartY + index * (ratingBadgeHeight + input.badgeGap);
              composeEdgeAlignedPosterBadge(remainingLeftBadges[index], rowY, 'left', maxBadgeWidth);
              composeEdgeAlignedPosterBadge(remainingRightBadges[index], rowY, 'right', maxBadgeWidth);
            }
          } else {
            composeBadgeColumn(remainingLeftBadges, 'left', maxBadgeWidth, 'top', sideStartY);
            composeBadgeColumn(remainingRightBadges, 'right', maxBadgeWidth, 'top', sideStartY);
          }
        } else {
          if (posterTopRows.length > 0) {
            let topRowY = input.badgeTopOffset;
            for (const row of posterTopRows) {
              composeBadgeRow(row, topRowY, {
                regionLeft: input.posterRowHorizontalInset,
                regionWidth: posterRowRegionWidth,
                align: posterRowAlign,
              });
              topRowY += ratingBadgeHeight + input.badgeGap;
            }
          }
          if (posterBottomRows.length > 0) {
            let bottomRowYStart =
              bottomRowY - (posterBottomRows.length - 1) * (ratingBadgeHeight + input.badgeGap);
            for (const row of posterBottomRows) {
              composeBadgeRow(row, bottomRowYStart, {
                regionLeft: input.posterRowHorizontalInset,
                regionWidth: posterRowRegionWidth,
                align: posterRowAlign,
              });
              bottomRowYStart += ratingBadgeHeight + input.badgeGap;
            }
          }
        }
        composeBlockbusterReviewBlurbs();
        composeBlockbusterPosterCallouts();
        composeBlockbusterScoreTiles();
        if (blockbusterBadgeOverlays.length > 0 || blockbusterStickerOverlays.length > 0) {
          overlays.push(...blockbusterBadgeOverlays, ...blockbusterStickerOverlays);
        }
        const bottomOverlayAnchorY =
          posterBottomRows.length > 0
            ? bottomRowY - (posterBottomRows.length - 1) * (ratingBadgeHeight + input.badgeGap)
            : bottomRowY;
        composePosterCleanOverlayAboveBottom(bottomOverlayAnchorY);
      }
    }

    if (input.imageType === 'poster' && input.qualityBadges.length > 0) {
      const qualityPlacement = resolvePosterQualityBadgePlacement(
        input.posterRatingsLayout,
        input.qualityBadgesSide,
        input.posterQualityBadgesPosition
      );
      const metrics: BadgeLayoutMetrics = {
        iconSize: input.badgeIconSize,
        fontSize: input.badgeFontSize,
        paddingX: input.badgePaddingX,
        paddingY: input.badgePaddingY,
        gap: input.badgeGap,
      };
      const qualityBadgeHeight = Math.max(
        44,
        Math.round(badgeBaseHeight * 1.25 * qualityBadgeScaleRatio),
      );
      if (qualityPlacement === 'bottom') {
        const bottomQualityHeight = Math.max(
          36,
          Math.round(badgeBaseHeight * 1.05 * qualityBadgeScaleRatio),
        );
        const bottomY = Math.max(
          input.badgeTopOffset,
          input.outputHeight - input.badgeBottomOffset - bottomQualityHeight
        );
        composeQualityBadgeRow(input.qualityBadges, bottomY, bottomQualityHeight);
      } else if (qualityPlacement === 'top') {
        const topQualityHeight = Math.max(
          36,
          Math.round(badgeBaseHeight * 1.05 * qualityBadgeScaleRatio),
        );
        const topY = Math.max(input.badgeTopOffset, editorialOverlaySafeBottom ?? input.badgeTopOffset);
        composeQualityBadgeRow(input.qualityBadges, topY, topQualityHeight);
      } else {
        const qualityTotalHeight =
          input.qualityBadges.length * qualityBadgeHeight +
          Math.max(0, input.qualityBadges.length - 1) * input.badgeGap;
        const centeredStartY = Math.max(
          input.badgeTopOffset,
          Math.round((input.outputHeight - qualityTotalHeight) / 2)
        );
        let qualityStartY = centeredStartY;
        const shouldTopAlignQuality =
          (input.posterRatingsLayout === 'left' || input.posterRatingsLayout === 'right') &&
          (qualityPlacement === 'left' || qualityPlacement === 'right');
        if (shouldTopAlignQuality) {
          qualityStartY = input.badgeTopOffset;
        } else if (posterTopRows.length > 0) {
          const belowTop = posterTopBlockBottom;
          qualityStartY = Math.max(qualityStartY, belowTop);
        } else {
          const sideBadges = qualityPlacement === 'right' ? input.rightBadges : input.leftBadges;
          if (sideBadges.length > 0) {
            const sideColumnHeight = measureBadgeColumnHeight(sideBadges, metrics, input.ratingStyle);
            if (sideColumnHeight > 0) {
              const belowSide =
                resolveSideBadgeStartY(sideBadges, metrics) +
                sideColumnHeight +
                input.badgeGap;
              qualityStartY = Math.max(qualityStartY, belowSide);
            }
          }
        }
        if (qualityPlacement === 'left' && editorialOverlaySafeBottom !== null) {
          qualityStartY = Math.max(qualityStartY, editorialOverlaySafeBottom);
        }
        composeQualityBadgeColumn(input.qualityBadges, qualityStartY, qualityPlacement);
      }
    }

    if (input.imageType === 'backdrop' && input.qualityBadges.length > 0) {
      const qualityHeight = Math.max(44, Math.round(badgeBaseHeight * 1.25 * qualityBadgeScaleRatio));
      const useIntrinsicQualityWidths = usesIntrinsicQualityBadgeWidths(input.qualityBadgesStyle);
      const uniformBadgeWidth = Math.min(
        Math.max(72, Math.round(qualityHeight * 1.75)),
        Math.max(72, input.outputWidth - 24)
      );
      const usableQualityBadges = input.qualityBadges.filter((badge) =>
        isMediaFeatureBadgeKey(String(badge.key))
      );
      if (usableQualityBadges.length > 0) {
        const leftColumn: RatingBadge[] = [];
        const rightColumn: RatingBadge[] = [];
        if (input.backdropRatingsLayout === 'center' && usableQualityBadges.length === 2) {
          leftColumn.push(usableQualityBadges[0]);
          rightColumn.push(usableQualityBadges[1]);
        } else {
          for (const badge of usableQualityBadges) {
            if (leftColumn.length < 2) {
              leftColumn.push(badge);
            } else if (rightColumn.length < 2) {
              rightColumn.push(badge);
            } else if (leftColumn.length <= rightColumn.length) {
              leftColumn.push(badge);
            } else {
              rightColumn.push(badge);
            }
          }
        }
        const ratingsOnRight =
          input.backdropRatingsLayout === 'right' || input.backdropRatingsLayout === 'right-vertical';
        const startY = input.badgeTopOffset;
        const columnGap = Math.max(8, Math.round(input.badgeGap * 0.8));

        if (rightColumn.length === 0) {
          const centerX = input.outputWidth / 2;
          const singleColumnWidth = useIntrinsicQualityWidths
            ? leftColumn.reduce((maxWidth, badge) => {
                const spec = buildQualityBadgeSvg(
                  badge,
                  qualityHeight,
                  undefined,
                  input.qualityBadgesStyle
                );
                return Math.max(maxWidth, spec?.width ?? 0);
              }, 0)
            : uniformBadgeWidth;
          const singleX = Math.round(centerX - singleColumnWidth / 2);
          const ratingRows =
            input.backdropRatingsLayout === 'right-vertical'
              ? 0
              : input.backdropRows && input.backdropRows.length > 0
                ? input.backdropRows.length
                : (input.topBadges.length > 0 ? 1 : 0) + (input.bottomBadges.length > 0 ? 1 : 0);
          const singleStartY =
            input.backdropRatingsLayout === 'center' && ratingRows > 0
              ? startY + ratingRows * (ratingBadgeHeight + input.badgeGap)
              : startY;
          renderQualityBadgeColumnAt(
            leftColumn,
            singleStartY,
            singleX,
            qualityHeight,
            uniformBadgeWidth
          );
        } else {
          const leftColumnWidth = useIntrinsicQualityWidths
            ? leftColumn.reduce((maxWidth, badge) => {
                const spec = buildQualityBadgeSvg(
                  badge,
                  qualityHeight,
                  undefined,
                  input.qualityBadgesStyle
                );
                return Math.max(maxWidth, spec?.width ?? 0);
              }, 0)
            : uniformBadgeWidth;
          const rightColumnWidth = useIntrinsicQualityWidths
            ? rightColumn.reduce((maxWidth, badge) => {
                const spec = buildQualityBadgeSvg(
                  badge,
                  qualityHeight,
                  undefined,
                  input.qualityBadgesStyle
                );
                return Math.max(maxWidth, spec?.width ?? 0);
              }, 0)
            : uniformBadgeWidth;
          let leftX = 12;
          let rightX = Math.max(12, input.outputWidth - rightColumnWidth - 12);
          if (ratingsOnRight) {
            const centerX = input.outputWidth / 2;
            leftX = centerX - columnGap - leftColumnWidth;
            rightX = centerX + columnGap;
          } else {
            const metrics: BadgeLayoutMetrics = {
              iconSize: input.badgeIconSize,
              fontSize: input.badgeFontSize,
              paddingX: input.badgePaddingX,
              paddingY: input.badgePaddingY,
              gap: input.badgeGap,
            };
            const backdropRegion = getBackdropBadgeRegion(
              input.outputWidth,
              input.backdropRatingsLayout
            );
            const effectiveMaxWidth = Math.max(0, backdropRegion.width - 24);
            const backdropRows =
              input.backdropRows && input.backdropRows.length > 0
                ? input.backdropRows
                : [input.topBadges, input.bottomBadges].filter((row) => row.length > 0);
            const ratingBlockWidth = backdropRows.reduce((maxWidth, row) => {
              const rowWidth = Math.min(
                measureBadgeRowWidth(row, metrics, false, input.ratingStyle),
                effectiveMaxWidth,
              );
              return Math.max(maxWidth, rowWidth);
            }, 0);
            const ratingCenterX = backdropRegion.left + backdropRegion.width / 2;
            const ratingLeft = ratingCenterX - ratingBlockWidth / 2;
            const ratingRight = ratingCenterX + ratingBlockWidth / 2;
            leftX = ratingLeft - columnGap - leftColumnWidth;
            rightX = ratingRight + columnGap;
          }

          renderQualityBadgeColumnAt(
            leftColumn,
            startY,
            leftX,
            qualityHeight,
            uniformBadgeWidth
          );
          renderQualityBadgeColumnAt(
            rightColumn,
            startY,
            rightX,
            qualityHeight,
            uniformBadgeWidth
          );
        }
      }
    }

    composeGenreBadge();

    const background =
      input.imageType === 'logo'
        ? input.logoBackground === 'dark'
          ? { r: 17, g: 24, b: 39, alpha: 1 }
          : { r: 0, g: 0, b: 0, alpha: 0 }
        : { r: 17, g: 17, b: 17, alpha: 1 };

    const pipeline = sharp({
      create: {
        width: input.outputWidth,
        height: input.finalOutputHeight,
        channels: 4,
        background,
      },
    }).composite(overlays);

    let finalBuffer: Buffer;
    let outputContentType = outputFormatToContentType(input.outputFormat);
    if (input.outputFormat === 'webp') {
      finalBuffer = await pipeline.webp({ quality: 80, effort: 3 }).toBuffer();
    } else if (input.outputFormat === 'jpeg') {
      finalBuffer = await pipeline.jpeg({ quality: 82 }).toBuffer();
    } else {
      finalBuffer = await pipeline.png({ compressionLevel: 1 }).toBuffer();
    }

    return {
      body: bufferToArrayBuffer(finalBuffer),
      contentType: outputContentType,
      cacheControl: input.cacheControl,
    };
  });
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const requestStartedAt = performance.now();
  const phases: PhaseDurations = {
    auth: 0,
    tmdb: 0,
    mdb: 0,
    fanart: 0,
    stream: 0,
    render: 0,
  };
  const respond = (body: string, status: number, headers?: HeadersInit) => {
    const finalHeaders = new Headers(headers);
    const totalMs = performance.now() - requestStartedAt;
    finalHeaders.set('Server-Timing', buildServerTimingHeader(phases, totalMs));
    return new Response(body, { status, headers: finalHeaders });
  };

  const { type, id } = await params;
  if (!ALLOWED_IMAGE_TYPES.has(type)) {
    return respond('Invalid image type', 400);
  }
  if (
    !isErdbRequestAuthorized({
      configuredKeys: ERDB_REQUEST_API_KEYS,
      searchParams: request.nextUrl.searchParams,
      headers: request.headers,
    })
  ) {
    return respond(ERDB_REQUEST_KEY_ERROR_MESSAGE, 401);
  }
  console.warn(`[ERDB] image request: /${type}/${id} streamBadges=${request.nextUrl.searchParams.get('posterStreamBadges') ?? request.nextUrl.searchParams.get('streamBadges') ?? 'none'}`);
  scheduleImdbDatasetSync();
  const imageType = type as 'poster' | 'backdrop' | 'logo';
  const outputFormat = pickOutputFormat(imageType, request.headers.get('accept'));
  const requestedIdSourceCandidate = String(request.nextUrl.searchParams.get('idSource') || '')
    .trim()
    .toLowerCase();
  const cleanIdWithoutExtension = id.replace(/\.(?:jpg|jpeg|png|webp)$/i, '');
  const explicitIdPrefix = cleanIdWithoutExtension.split(':')[0]?.trim().toLowerCase() || '';
  const cleanId =
    EXPLICIT_ID_SOURCE_SET.has(requestedIdSourceCandidate) &&
    !EXPLICIT_ID_SOURCE_SET.has(explicitIdPrefix) &&
    !RAW_IMDB_ID_RE.test(cleanIdWithoutExtension)
      ? `${requestedIdSourceCandidate}:${cleanIdWithoutExtension}`
      : cleanIdWithoutExtension;

  const lang = request.nextUrl.searchParams.get('lang') || FALLBACK_IMAGE_LANGUAGE;
  const ratingValueMode = normalizeRatingValueMode(
    request.nextUrl.searchParams.get('ratingValueMode'),
    DEFAULT_RATING_VALUE_MODE,
  );
  const genreBadgeMode = normalizeGenreBadgeMode(request.nextUrl.searchParams.get('genreBadge'));
  const genreBadgeScale = normalizeBadgeScalePercent(
    request.nextUrl.searchParams.get('genreBadgeScale'),
    DEFAULT_BADGE_SCALE_PERCENT,
  );
  const globalRatings = request.nextUrl.searchParams.get('ratings');
  const posterRatings = request.nextUrl.searchParams.get('posterRatings') ?? globalRatings;
  const backdropRatings = request.nextUrl.searchParams.get('backdropRatings') ?? globalRatings;
  const logoRatings = request.nextUrl.searchParams.get('logoRatings') ?? globalRatings;
  const globalRatingPresentation = normalizeRatingPresentation(
    request.nextUrl.searchParams.get('ratingPresentation'),
    DEFAULT_RATING_PRESENTATION,
  );
  const posterRatingPresentation = normalizeRatingPresentation(
    request.nextUrl.searchParams.get('posterRatingPresentation') ??
      request.nextUrl.searchParams.get('ratingPresentation'),
    globalRatingPresentation,
  );
  const backdropRatingPresentation = normalizeRatingPresentation(
    request.nextUrl.searchParams.get('backdropRatingPresentation') ??
      request.nextUrl.searchParams.get('ratingPresentation'),
    globalRatingPresentation,
  );
  const logoRatingPresentation = normalizeRatingPresentation(
    request.nextUrl.searchParams.get('logoRatingPresentation') ??
      request.nextUrl.searchParams.get('ratingPresentation'),
    globalRatingPresentation,
  );
  const globalAggregateRatingSource = normalizeAggregateRatingSource(
    request.nextUrl.searchParams.get('aggregateRatingSource'),
    DEFAULT_AGGREGATE_RATING_SOURCE,
  );
  const posterAggregateRatingSource = normalizeAggregateRatingSource(
    request.nextUrl.searchParams.get('posterAggregateRatingSource') ??
      request.nextUrl.searchParams.get('aggregateRatingSource'),
    globalAggregateRatingSource,
  );
  const backdropAggregateRatingSource = normalizeAggregateRatingSource(
    request.nextUrl.searchParams.get('backdropAggregateRatingSource') ??
      request.nextUrl.searchParams.get('aggregateRatingSource'),
    globalAggregateRatingSource,
  );
  const logoAggregateRatingSource = normalizeAggregateRatingSource(
    request.nextUrl.searchParams.get('logoAggregateRatingSource') ??
      request.nextUrl.searchParams.get('aggregateRatingSource'),
    globalAggregateRatingSource,
  );
  const imageTextParam =
    request.nextUrl.searchParams.get('imageText') || request.nextUrl.searchParams.get('posterText');
  const imageText = imageTextParam || (type === 'backdrop' ? 'clean' : 'original');
  const legacyFanartCleanMode = imageText === 'fanartclean';
  const posterArtworkSource = legacyFanartCleanMode
    ? 'fanart'
    : normalizeArtworkSource(
        request.nextUrl.searchParams.get('posterArtworkSource') ??
          request.nextUrl.searchParams.get('posterCleanSource')
      );
  const backdropArtworkSource = legacyFanartCleanMode
    ? 'fanart'
    : normalizeArtworkSource(
        request.nextUrl.searchParams.get('backdropArtworkSource') ??
          request.nextUrl.searchParams.get('backdropCleanSource')
      );
  const logoArtworkSource = normalizeArtworkSource(
    request.nextUrl.searchParams.get('logoArtworkSource') ??
      request.nextUrl.searchParams.get('logoSource')
  );
  const fanartKey = request.nextUrl.searchParams.get('fanartKey') || FANART_API_KEY;
  const fanartClientKey = request.nextUrl.searchParams.get('fanartClientKey') || FANART_CLIENT_KEY;
  const posterRatingsLayout = normalizePosterRatingLayout(request.nextUrl.searchParams.get('posterRatingsLayout'));
  const posterRatingsMaxPerSide = normalizePosterRatingsMaxPerSide(request.nextUrl.searchParams.get('posterRatingsMaxPerSide'));
  const logoRatingsMax = normalizeOptionalBadgeCount(request.nextUrl.searchParams.get('logoRatingsMax'));
  const backdropRatingsLayout = normalizeBackdropRatingLayout(request.nextUrl.searchParams.get('backdropRatingsLayout'));
  const sideRatingsPosition = normalizeSideRatingPosition(
    request.nextUrl.searchParams.get('sideRatingsPosition'),
    DEFAULT_SIDE_RATING_POSITION
  );
  const sideRatingsOffset = normalizeSideRatingOffset(
    request.nextUrl.searchParams.get('sideRatingsOffset'),
    DEFAULT_SIDE_RATING_OFFSET
  );
  const globalStreamBadgesSetting = normalizeStreamBadgesSetting(request.nextUrl.searchParams.get('streamBadges'));
  const posterStreamBadgesSetting = normalizeStreamBadgesSetting(
    request.nextUrl.searchParams.get('posterStreamBadges') || request.nextUrl.searchParams.get('streamBadges')
  );
  const backdropStreamBadgesSetting = normalizeStreamBadgesSetting(
    request.nextUrl.searchParams.get('backdropStreamBadges') || request.nextUrl.searchParams.get('streamBadges')
  );
  const streamBadgesSetting =
    imageType === 'poster'
      ? posterStreamBadgesSetting
      : imageType === 'backdrop'
        ? backdropStreamBadgesSetting
        : globalStreamBadgesSetting;
  const qualityBadgesSide = normalizeQualityBadgesSide(
    request.nextUrl.searchParams.get('qualityBadgesSide') ||
    request.nextUrl.searchParams.get('qualityBadgesPosition')
  );
  const posterQualityBadgesPosition = normalizePosterQualityBadgesPosition(
    request.nextUrl.searchParams.get('posterQualityBadgesPosition')
  );
  const posterQualityBadgePreferences = parseQualityBadgePreferencesAllowEmpty(
    request.nextUrl.searchParams.get('posterQualityBadges'),
  );
  const backdropQualityBadgePreferences = parseQualityBadgePreferencesAllowEmpty(
    request.nextUrl.searchParams.get('backdropQualityBadges'),
  );
  const globalQualityBadgesStyle = normalizeQualityBadgesStyle(
    request.nextUrl.searchParams.get('qualityBadgesStyle')
  );
  const posterQualityBadgesStyle = normalizeQualityBadgesStyle(
    request.nextUrl.searchParams.get('posterQualityBadgesStyle') ||
    request.nextUrl.searchParams.get('qualityBadgesStyle')
  );
  const backdropQualityBadgesStyle = normalizeQualityBadgesStyle(
    request.nextUrl.searchParams.get('backdropQualityBadgesStyle') ||
    request.nextUrl.searchParams.get('qualityBadgesStyle')
  );
  const posterQualityBadgesMax = normalizeOptionalBadgeCount(
    request.nextUrl.searchParams.get('posterQualityBadgesMax')
  );
  const backdropQualityBadgesMax = normalizeOptionalBadgeCount(
    request.nextUrl.searchParams.get('backdropQualityBadgesMax')
  );
  const posterRatingsMax = normalizeOptionalBadgeCount(
    request.nextUrl.searchParams.get('posterRatingsMax')
  );
  const backdropRatingsMax = normalizeOptionalBadgeCount(
    request.nextUrl.searchParams.get('backdropRatingsMax')
  );
  const qualityBadgesStyle =
    imageType === 'poster'
      ? posterQualityBadgesStyle
      : imageType === 'backdrop'
        ? backdropQualityBadgesStyle
        : globalQualityBadgesStyle;
  const qualityBadgesMax =
    imageType === 'poster'
      ? posterQualityBadgesMax
      : imageType === 'backdrop'
        ? backdropQualityBadgesMax
        : null;
  const qualityBadgePreferences =
    imageType === 'poster'
      ? posterQualityBadgePreferences
      : imageType === 'backdrop'
        ? backdropQualityBadgePreferences
        : [];
  const ratingStyleParam =
    request.nextUrl.searchParams.get('ratingStyle') || request.nextUrl.searchParams.get('style');
  const ratingStyle = ratingStyleParam
    ? normalizeRatingStyle(ratingStyleParam)
    : type === 'logo'
      ? 'plain'
      : DEFAULT_RATING_STYLE;
  const logoBackground = normalizeLogoBackground(request.nextUrl.searchParams.get('logoBackground'));
  const providerAppearanceOverrides = parseRatingProviderAppearanceOverrides(
    request.nextUrl.searchParams.get('providerAppearance'),
  );
  const posterRatingBadgeScale = normalizeBadgeScalePercent(
    request.nextUrl.searchParams.get('posterRatingBadgeScale'),
    DEFAULT_BADGE_SCALE_PERCENT,
  );
  const backdropRatingBadgeScale = normalizeBadgeScalePercent(
    request.nextUrl.searchParams.get('backdropRatingBadgeScale'),
    DEFAULT_BADGE_SCALE_PERCENT,
  );
  const logoRatingBadgeScale = normalizeBadgeScalePercent(
    request.nextUrl.searchParams.get('logoRatingBadgeScale'),
    DEFAULT_BADGE_SCALE_PERCENT,
  );
  const posterQualityBadgeScale = normalizeBadgeScalePercent(
    request.nextUrl.searchParams.get('posterQualityBadgeScale'),
    DEFAULT_BADGE_SCALE_PERCENT,
  );
  const backdropQualityBadgeScale = normalizeBadgeScalePercent(
    request.nextUrl.searchParams.get('backdropQualityBadgeScale'),
    DEFAULT_BADGE_SCALE_PERCENT,
  );
  const mdblistKey = request.nextUrl.searchParams.get('mdblistKey') || request.nextUrl.searchParams.get('mdblist_key');
  const tmdbKey = request.nextUrl.searchParams.get('tmdbKey') || request.nextUrl.searchParams.get('tmdb_key');

  const parts = cleanId.split(':');
  const idPrefix = (parts[0] || '').trim().toLowerCase();
  const inputAnimeMappingProvider = toAnimeMappingProvider(idPrefix);
  let inputAnimeMappingExternalId =
    inputAnimeMappingProvider && typeof parts[1] === 'string' && parts[1].trim().length > 0
      ? parts[1].trim()
      : null;
  let mediaId = parts[0];
  let season: string | null = null;
  let episode: string | null = null;
  let isTmdb = false;
  let isKitsu = false;
  const isAniListInput = idPrefix === 'anilist';
  let explicitTmdbMediaType: 'movie' | 'tv' | null = null;
  const hasNativeAnimeInput = ANIME_NATIVE_INPUT_ID_PREFIX_SET.has(idPrefix);
  let hasConfirmedAnimeMapping = hasNativeAnimeInput;
  let allowAnimeOnlyRatings = hasNativeAnimeInput;

  if (idPrefix === 'tmdb') {
    isTmdb = true;
    const explicitTypeCandidate = (parts[1] || '').trim().toLowerCase();
    if (explicitTypeCandidate === 'movie' || explicitTypeCandidate === 'tv') {
      explicitTmdbMediaType = explicitTypeCandidate as 'movie' | 'tv';
      mediaId = parts[2];
      season = parts.length > 3 ? parts[3] : null;
      episode = parts.length > 4 ? parts[4] : null;
      if (mediaId) {
        inputAnimeMappingExternalId = mediaId;
      }
    } else {
      mediaId = parts[1];
      season = parts.length > 2 ? parts[2] : null;
      episode = parts.length > 3 ? parts[3] : null;
    }
  } else if (idPrefix === 'kitsu') {
    isKitsu = true;
    mediaId = parts[1];
    episode = parts.length > 2 ? parts[2] : null;
  } else if (idPrefix === 'imdb' && inputAnimeMappingExternalId) {
    mediaId = inputAnimeMappingExternalId;
    season = parts.length > 2 ? parts[2] : null;
    episode = parts.length > 3 ? parts[3] : null;
  } else if (inputAnimeMappingProvider && inputAnimeMappingExternalId) {
    mediaId = inputAnimeMappingExternalId;
    season = parts.length > 2 ? parts[2] : null;
    episode = parts.length > 3 ? parts[3] : null;
  } else {
    season = parts.length > 1 ? parts[1] : null;
    episode = parts.length > 2 ? parts[2] : null;
  }

  const requestedImageLang = normalizeImageLanguage(lang) || FALLBACK_IMAGE_LANGUAGE;
  const includeImageLanguage = buildIncludeImageLanguage(requestedImageLang, FALLBACK_IMAGE_LANGUAGE);
  const posterTextPreference: PosterTextPreference =
    imageText === 'clean' ||
    imageText === 'alternative' ||
    imageText === 'original'
      ? (imageText as PosterTextPreference)
      : legacyFanartCleanMode
        ? 'clean'
        : 'original';
  const ratingsForType =
    imageType === 'poster'
      ? posterRatings
      : imageType === 'backdrop'
        ? backdropRatings
        : logoRatings;
  const ratingPreferences =
    ratingsForType === null || ratingsForType === undefined
      ? [...ALL_RATING_PREFERENCES]
      : parseRatingPreferencesAllowEmpty(ratingsForType);
  const requestedRatingPresentation =
    imageType === 'poster'
      ? posterRatingPresentation
      : imageType === 'backdrop'
        ? backdropRatingPresentation
        : logoRatingPresentation;
  const ratingPresentation = resolveEffectiveRatingPresentation(
    requestedRatingPresentation,
    imageType,
  );
  const blockbusterDensity = normalizeBlockbusterDensity(
    request.nextUrl.searchParams.get('posterBlockbusterDensity') ??
      request.nextUrl.searchParams.get('blockbusterDensity'),
    DEFAULT_BLOCKBUSTER_DENSITY
  );
  const aggregateRatingSource =
    imageType === 'poster'
      ? posterAggregateRatingSource
      : imageType === 'backdrop'
        ? backdropAggregateRatingSource
        : logoAggregateRatingSource;
  const hasExplicitRatingOrder = ratingsForType !== null && ratingsForType !== undefined;
  const shouldApplyRatings = ratingPreferences.length > 0;
  const shouldApplyStreamBadges =
    imageType !== 'logo' &&
    (streamBadgesSetting === 'on' || streamBadgesSetting === 'auto') &&
    !hasNativeAnimeInput;
  const shouldRenderLogoBackground = imageType === 'logo' && logoBackground === 'dark';
  const streamBadgesSeedTtlMs = shouldApplyStreamBadges
    ? getDeterministicTtlMs(TORRENTIO_CACHE_TTL_MS, cleanId)
    : null;
  const streamBadgesSeedWindow =
    shouldApplyStreamBadges && streamBadgesSeedTtlMs
      ? Math.floor(Date.now() / streamBadgesSeedTtlMs)
      : null;
  const streamBadgesCacheKeySeed = shouldApplyStreamBadges
    ? `torrentio:${streamBadgesSeedWindow ?? 0}`
    : 'off';
  const shouldCacheFinalImage =
    shouldApplyRatings ||
    shouldApplyStreamBadges ||
    shouldRenderLogoBackground ||
    genreBadgeMode !== DEFAULT_GENRE_BADGE_MODE ||
    (imageType === 'poster' && posterTextPreference === 'clean') ||
    (imageType === 'poster' && posterArtworkSource === 'fanart') ||
    (imageType === 'backdrop' && backdropArtworkSource === 'fanart') ||
    (imageType === 'logo' && logoArtworkSource === 'fanart');
  const renderCacheBuster = (request.nextUrl.searchParams.get('cb') || '').trim();
  const effectiveRatingPreferences = shouldApplyRatings ? ratingPreferences : [];
  const selectedRatings = new Set<RatingPreference>(ratingPreferences);
  const renderSeedKey = [
    FINAL_IMAGE_RENDERER_CACHE_VERSION,
    imageType,
    outputFormat,
    cleanId,
    requestedImageLang,
    posterTextPreference,
    imageType === 'poster' ? posterArtworkSource : '-',
    imageType === 'backdrop' ? backdropArtworkSource : '-',
    imageType === 'logo' ? logoArtworkSource : '-',
    imageType === 'poster' ? posterRatingsLayout : '-',
    imageType === 'poster' ? String(posterRatingsMaxPerSide ?? 'auto') : '-',
    imageType === 'logo' ? String(logoRatingsMax ?? 'auto') : '-',
    imageType === 'poster' ? qualityBadgesSide : '-',
    imageType === 'poster' && (posterRatingsLayout === 'top' || posterRatingsLayout === 'bottom')
      ? posterQualityBadgesPosition
      : '-',
    imageType !== 'logo' ? qualityBadgesStyle : '-',
    imageType !== 'logo' ? String(qualityBadgesMax ?? 'auto') : '-',
    imageType === 'backdrop' ? backdropRatingsLayout : '-',
    imageType === 'poster' || imageType === 'backdrop' ? sideRatingsPosition : '-',
    imageType === 'poster' || imageType === 'backdrop' ? String(sideRatingsOffset) : '-',
    ratingPresentation,
    imageType === 'poster' ? blockbusterDensity : '-',
    aggregateRatingSource,
    ratingStyle,
    ratingValueMode,
    genreBadgeMode,
    String(genreBadgeScale),
    imageType === 'logo' ? logoBackground : '-',
    effectiveRatingPreferences.join(',') || 'none',
    streamBadgesCacheKeySeed,
    (
      (imageType === 'poster' && posterArtworkSource === 'fanart') ||
      (imageType === 'backdrop' && backdropArtworkSource === 'fanart') ||
      (imageType === 'logo' && logoArtworkSource === 'fanart')
    )
      ? sha1Hex(fanartKey || '').slice(0, 12)
      : '-',
    (
      (imageType === 'poster' && posterArtworkSource === 'fanart') ||
      (imageType === 'backdrop' && backdropArtworkSource === 'fanart') ||
      (imageType === 'logo' && logoArtworkSource === 'fanart')
    )
      ? sha1Hex(fanartClientKey || '').slice(0, 12)
      : '-',
    renderCacheBuster || '-',
    'v2',
  ].join('|');
  const objectStorageEnabled = isObjectStorageConfigured();

  if (!tmdbKey) {
    return respond('TMDB API Key (tmdbKey) is required', 400);
  }

  const hadSharedRender = shouldCacheFinalImage && finalImageInFlight.has(renderSeedKey);
  let objectStorageHit = false;

  try {
    const renderedImage = await withDedupe(finalImageInFlight, renderSeedKey, async () => {
      let media = null;
      let mediaType: 'movie' | 'tv' | null = null;
      let useRawKitsuFallback = false;
      let rawFallbackImageUrl: string | null = null;
      let rawFallbackKitsuRating: string | null = null;
      let rawFallbackTitle: string | null = null;
      let rawFallbackLogoAspectRatio: number | null = null;
      let mappedImdbId: string | null = null;

      if (isTmdb) {
        if (explicitTmdbMediaType) {
          const tmdbResponse = await fetchJsonCached(
            `tmdb:${explicitTmdbMediaType}:${mediaId}`,
            `https://api.themoviedb.org/3/${explicitTmdbMediaType}/${mediaId}?api_key=${tmdbKey}`,
            TMDB_CACHE_TTL_MS,
            phases,
            'tmdb'
          );
          if (tmdbResponse.ok) {
            media = tmdbResponse.data;
            mediaType = explicitTmdbMediaType;
          }
        } else {
          const movieResponse = await fetchJsonCached(
            `tmdb:movie:${mediaId}`,
            `https://api.themoviedb.org/3/movie/${mediaId}?api_key=${tmdbKey}`,
            TMDB_CACHE_TTL_MS,
            phases,
            'tmdb'
          );
          if (movieResponse.ok) {
            media = movieResponse.data;
            mediaType = 'movie';
          } else {
            const tvResponse = await fetchJsonCached(
              `tmdb:tv:${mediaId}`,
              `https://api.themoviedb.org/3/tv/${mediaId}?api_key=${tmdbKey}`,
              TMDB_CACHE_TTL_MS,
              phases,
              'tmdb'
            );
            if (tvResponse.ok) {
              media = tvResponse.data;
              mediaType = 'tv';
            }
          }
        }
      } else if (isKitsu) {
        let mappingUrl = `https://animemapping.stremio.dpdns.org/kitsu/${mediaId}`;
        if (episode) {
          mappingUrl += `?ep=${episode}`;
        }
        const mappingResponse = await fetchJsonCached(
          `kitsu:mapping:${mediaId}:${episode || '-'}`,
          mappingUrl,
          KITSU_CACHE_TTL_MS,
          phases,
          'tmdb'
        );
        const mappingData = mappingResponse.data || {};
        const mappingSubtype = extractAnimeSubtypeFromAnimemapping(mappingData);
        const mappingImdbCandidates = [
          mappingData.mappings?.ids?.imdb,
          mappingData.mappings?.ids?.imdb_id,
          mappingData.mappings?.imdb,
          mappingData.imdb_id,
          mappingData.imdb,
        ];
        for (const candidate of mappingImdbCandidates) {
          const normalized = typeof candidate === 'string' ? candidate.trim() : '';
          if (isImdbId(normalized)) {
            mappedImdbId = normalized;
            break;
          }
        }

        let tmdbId = '';
        const tmdbEpisode = mappingData.mappings?.tmdb_episode || mappingData.tmdb_episode;
        if (episode && tmdbEpisode) {
          tmdbId = tmdbEpisode.id;
          season = tmdbEpisode.season;
          episode = tmdbEpisode.episode;
        } else if (mappingData.mappings?.ids?.tmdb) {
          tmdbId = mappingData.mappings.ids.tmdb;
        }

        if (mappingSubtype !== 'movie' && !season) {
          const seasonProbeResponse = await fetchJsonCached(
            `kitsu:mapping:${mediaId}:1`,
            `https://animemapping.stremio.dpdns.org/kitsu/${mediaId}?ep=1`,
            KITSU_CACHE_TTL_MS,
            phases,
            'tmdb'
          );
          const seasonProbeData = seasonProbeResponse.data;
          const seasonProbeEpisode = seasonProbeData?.mappings?.tmdb_episode || seasonProbeData?.tmdb_episode;
          if (seasonProbeEpisode?.season) {
            season = seasonProbeEpisode.season;
          }
        }

        if (!tmdbId) {
          const kitsuFallbackAsset = await fetchKitsuFallbackAsset(mediaId, imageType, phases);
          rawFallbackImageUrl = kitsuFallbackAsset?.imageUrl || null;
          rawFallbackKitsuRating = kitsuFallbackAsset?.rating || null;
          rawFallbackTitle = kitsuFallbackAsset?.title || null;
          rawFallbackLogoAspectRatio = kitsuFallbackAsset?.logoAspectRatio ?? null;
          if (!rawFallbackImageUrl) {
            throw new HttpError('TMDB ID not found for Kitsu ID', 404);
          }
          useRawKitsuFallback = true;
          allowAnimeOnlyRatings = true;
          hasConfirmedAnimeMapping = true;
        } else {
          const mappedMediaTypeCandidates: Array<'movie' | 'tv'> =
            mappingSubtype === 'movie' ? ['movie', 'tv'] : ['tv', 'movie'];

          for (const mappedMediaType of mappedMediaTypeCandidates) {
            const mappedMediaResponse = await fetchJsonCached(
              `tmdb:${mappedMediaType}:${tmdbId}`,
              `https://api.themoviedb.org/3/${mappedMediaType}/${tmdbId}?api_key=${tmdbKey}`,
              TMDB_CACHE_TTL_MS,
              phases,
              'tmdb'
            );
            if (!mappedMediaResponse.ok) continue;
            media = mappedMediaResponse.data;
            mediaType = mappedMediaType;
            break;
          }

          if (!media || !mediaType) {
            const kitsuFallbackAsset = await fetchKitsuFallbackAsset(mediaId, imageType, phases);
            rawFallbackImageUrl = kitsuFallbackAsset?.imageUrl || null;
            rawFallbackKitsuRating = kitsuFallbackAsset?.rating || null;
            rawFallbackTitle = kitsuFallbackAsset?.title || null;
            rawFallbackLogoAspectRatio = kitsuFallbackAsset?.logoAspectRatio ?? null;
            if (!rawFallbackImageUrl) {
              throw new HttpError('Movie/Show not found on TMDB', 404);
            }
            useRawKitsuFallback = true;
            allowAnimeOnlyRatings = true;
            hasConfirmedAnimeMapping = true;
          }
        }
      } else if (
        inputAnimeMappingProvider &&
        inputAnimeMappingExternalId &&
        inputAnimeMappingProvider !== 'imdb' &&
        inputAnimeMappingProvider !== 'tmdb'
      ) {
        const reverseMappedAnimeTarget = await resolveReverseMappedAnimeImageTarget({
          imageType,
          fetchTmdbId: () =>
            fetchTmdbIdFromReverseMapping({
              provider: inputAnimeMappingProvider,
              externalId: inputAnimeMappingExternalId,
              season,
              phases,
            }),
          fetchKitsuId: () =>
            fetchKitsuIdFromReverseMapping({
              provider: inputAnimeMappingProvider,
              externalId: inputAnimeMappingExternalId,
              season,
              phases,
            }),
          fetchTmdbMedia: async (mappedTmdbId, mappedMediaType) => {
            const mappedMediaResponse = await fetchJsonCached(
              `tmdb:${mappedMediaType}:${mappedTmdbId}`,
              `https://api.themoviedb.org/3/${mappedMediaType}/${mappedTmdbId}?api_key=${tmdbKey}`,
              TMDB_CACHE_TTL_MS,
              phases,
              'tmdb'
            );
            return mappedMediaResponse.ok ? mappedMediaResponse.data : null;
          },
          fetchKitsuFallbackAsset: (kitsuId, fallbackImageType) =>
            fetchKitsuFallbackAsset(kitsuId, fallbackImageType, phases),
        });

        if (reverseMappedAnimeTarget.kind === 'tmdb') {
          media = reverseMappedAnimeTarget.media;
          mediaType = reverseMappedAnimeTarget.mediaType;
          allowAnimeOnlyRatings = true;
          hasConfirmedAnimeMapping = true;
        } else if (reverseMappedAnimeTarget.kind === 'kitsu-fallback') {
          rawFallbackImageUrl = reverseMappedAnimeTarget.fallbackAsset.imageUrl || null;
          rawFallbackKitsuRating = reverseMappedAnimeTarget.fallbackAsset.rating || null;
          rawFallbackTitle = reverseMappedAnimeTarget.fallbackAsset.title || null;
          rawFallbackLogoAspectRatio = reverseMappedAnimeTarget.fallbackAsset.logoAspectRatio ?? null;
          useRawKitsuFallback = true;
          allowAnimeOnlyRatings = true;
          hasConfirmedAnimeMapping = true;
        } else if (!reverseMappedAnimeTarget.tmdbId) {
          throw new HttpError('TMDB ID not found for anime mapping ID', 404);
        }
      } else {
        const findResponse = await fetchJsonCached(
          `tmdb:find:${mediaId}`,
          `https://api.themoviedb.org/3/find/${mediaId}?api_key=${tmdbKey}&external_source=imdb_id`,
          TMDB_CACHE_TTL_MS,
          phases,
          'tmdb'
        );
        const findData = findResponse.data || {};
        media = findData.movie_results?.[0] || findData.tv_results?.[0];
        mediaType = findData.movie_results?.[0] ? 'movie' : 'tv';
      }

      if (!media && !useRawKitsuFallback) {
        throw new HttpError('Movie/Show not found on TMDB', 404);
      }

      const mediaLooksAnimated = media ? isTmdbAnimationTitle(media) : false;
      if (!hasNativeAnimeInput) {
        allowAnimeOnlyRatings = hasConfirmedAnimeMapping || mediaLooksAnimated;
      }
      const isAnimeContent = hasNativeAnimeInput || hasConfirmedAnimeMapping || mediaLooksAnimated;
      const resolvePrimaryGenreFamily = (
        genres: Array<{ id?: number | null; name?: string | null } | string | null | undefined>,
        genreIds: Array<number | string | null | undefined> = [],
      ) =>
        resolveGenreBadgeFamily({
          genres,
          genreIds,
          isAnimeContent,
        });
      const buildResolvedGenreBadge = (
        family: ReturnType<typeof resolvePrimaryGenreFamily>,
      ): GenreBadgeSpec | null => {
        if (genreBadgeMode === DEFAULT_GENRE_BADGE_MODE || !family) {
          return null;
        }
        return {
          familyId: family.id,
          label: family.label,
          accentColor: family.accentColor,
          mode: genreBadgeMode,
          scalePercent: genreBadgeScale,
        };
      };
      let primaryGenreFamily = resolvePrimaryGenreFamily(
        Array.isArray(media?.genres) ? media.genres : [],
        Array.isArray(media?.genre_ids) ? media.genre_ids : [],
      );
      let genreBadge = buildResolvedGenreBadge(primaryGenreFamily);

      let imgPath = '';
      let imgUrl = rawFallbackImageUrl;
      let tmdbRating = 'N/A';
      let providerRatings = new Map<RatingPreference, string>();
      const renderedRatingTtlByProvider = new Map<BadgeKey, number>();
      let outputWidth = 1280;
      let outputHeight = 720;
      let selectedLogoAspectRatio: number | null = null;
      let selectedPosterLogoPath: string | null = null;
      let selectedPosterIsTextless = false;
      let certificationBadgeLabel: string | null = null;
      const requestedExternalRatings = new Set([...selectedRatings]);
      const needsAnimeOnlyRatings = [...requestedExternalRatings].some((provider) =>
        ANIME_ONLY_RATING_PROVIDER_SET.has(provider)
      );
      const shouldAttemptAnimeMapping = hasNativeAnimeInput || mediaLooksAnimated;
      const needsExternalRatings = [...requestedExternalRatings].some((provider) => provider !== 'tmdb');
      const needsImdbRating = requestedExternalRatings.has('imdb');
      const needsAniListRating = requestedExternalRatings.has('anilist');
      const needsKitsuRating = requestedExternalRatings.has('kitsu');
      const needsMyAnimeListRating = requestedExternalRatings.has('myanimelist');
      const needsTraktRating = requestedExternalRatings.has('trakt');
      const hasMdbListApiKey = MDBLIST_API_KEYS.length > 0;
      const shouldRenderRawKitsuFallbackRating =
        useRawKitsuFallback && needsKitsuRating && typeof rawFallbackKitsuRating === 'string' && rawFallbackKitsuRating.length > 0;
      const shouldRenderRatings = shouldApplyRatings;
      const shouldRenderStreamBadges = shouldApplyStreamBadges && !isAnimeContent;
      const shouldRenderBadges =
        shouldRenderRatings ||
        shouldRenderStreamBadges ||
        shouldRenderLogoBackground ||
        Boolean(genreBadge);
      const releaseDateForCache =
        mediaType === 'movie' ? media?.release_date : mediaType === 'tv' ? media?.first_air_date : null;
      const resolvedRatingMediaType: 'movie' | 'tv' =
        mediaType === 'tv' || (mediaType !== 'movie' && season !== null) ? 'tv' : 'movie';
      const tmdbIdForCache =
        media?.id != null
          ? String(media.id)
          : isTmdb && mediaId
            ? String(mediaId)
            : null;
      let torrentioIdForCache: string | null = isImdbId(mediaId) ? mediaId : null;
      if (!torrentioIdForCache) {
        torrentioIdForCache = media?.imdb_id || mappedImdbId || null;
      }
      if (!torrentioIdForCache && tmdbIdForCache) {
        torrentioIdForCache = `tmdb:${tmdbIdForCache}`;
      }
      const streamBadgesWindowTtlMs = shouldRenderStreamBadges
          ? mediaType && torrentioIdForCache
          ? getRatingCacheTtlMs({
            id: torrentioIdForCache,
            mediaType: resolvedRatingMediaType,
            releaseDate: releaseDateForCache,
            defaultTtlMs: TORRENTIO_CACHE_TTL_MS,
            oldTtlMs: MDBLIST_OLD_MOVIE_CACHE_TTL_MS,
          })
          : getDeterministicTtlMs(TORRENTIO_CACHE_TTL_MS, cleanId)
        : null;
      const streamBadgesCacheWindow =
        shouldRenderStreamBadges && streamBadgesWindowTtlMs
          ? Math.floor(Date.now() / streamBadgesWindowTtlMs)
          : null;
      const streamBadgesCacheKey = shouldRenderStreamBadges
        ? `torrentio:${streamBadgesCacheWindow ?? 0}`
        : 'off';
      const finalImageCacheKey = renderSeedKey;
      const finalCacheHash = sha1Hex(finalImageCacheKey);
      const finalObjectStorageKey = buildObjectStorageImageKey(
        finalCacheHash,
        outputFormatToExtension(outputFormat)
      );
      if (shouldCacheFinalImage && objectStorageEnabled) {
        const cachedFinalImage = await getCachedImageFromObjectStorage(finalObjectStorageKey);
        if (cachedFinalImage) {
          objectStorageHit = true;
          return cachedFinalImage;
        }
      }
      const detailsBundlePromise = !useRawKitsuFallback
        ? (async () => {
          const certificationAppendTarget =
            mediaType === 'movie' ? 'release_dates' : mediaType === 'tv' ? 'content_ratings' : null;
          const buildDetailsUrl = (language: string) =>
            `https://api.themoviedb.org/3/${mediaType}/${media.id}?api_key=${tmdbKey}&language=${language}&append_to_response=${['images', 'external_ids', certificationAppendTarget].filter(Boolean).join(',')}&include_image_language=${encodeURIComponent(includeImageLanguage)}`;

          const [detailsResponse, fallbackDetailsResponse] = await Promise.all([
            fetchJsonCached(
              `tmdb:${mediaType}:${media.id}:details:${requestedImageLang}:bundle:v2:${includeImageLanguage}`,
              buildDetailsUrl(requestedImageLang),
              TMDB_CACHE_TTL_MS,
              phases,
              'tmdb'
            ),
            requestedImageLang !== FALLBACK_IMAGE_LANGUAGE
              ? fetchJsonCached(
                `tmdb:${mediaType}:${media.id}:details:${FALLBACK_IMAGE_LANGUAGE}:bundle:v2:${includeImageLanguage}`,
                buildDetailsUrl(FALLBACK_IMAGE_LANGUAGE),
                TMDB_CACHE_TTL_MS,
                phases,
                'tmdb'
              )
              : Promise.resolve({ ok: false, status: 0, data: null } as CachedJsonResponse)
          ]);

          const details = detailsResponse.data || {};
          const fallbackDetails = fallbackDetailsResponse?.data || {};

          return {
            details,
            fallbackDetails,
            bundledImages: details.images || {},
            bundledExternalIds: details.external_ids || {},
            bundledCertificationPayload:
              mediaType === 'movie'
                ? details.release_dates || fallbackDetails.release_dates || null
                : details.content_ratings || fallbackDetails.content_ratings || null,
            tmdbRating: details.vote_average ? normalizeRatingValue(details.vote_average) || 'N/A' : 'N/A',
          };
        })()
        : null;
      const providerRatingsPromise =
        shouldRenderRatings &&
          needsExternalRatings &&
          (
            mdblistKey ||
            hasMdbListApiKey ||
            needsKitsuRating ||
            needsImdbRating ||
            needsAniListRating ||
            needsMyAnimeListRating ||
            needsTraktRating
          )
          ? (async () => {
            let imdbId: string | null = null;
            let kitsuId: string | null = isKitsu ? mediaId : null;
            let malId: string | null = idPrefix === 'mal' || idPrefix === 'myanimelist' ? mediaId : null;
            let aniListId: string | null = isAniListInput ? mediaId : null;
            if (kitsuId || aniListId || malId) {
              hasConfirmedAnimeMapping = true;
              allowAnimeOnlyRatings = true;
            }

            imdbId = media?.imdb_id || mappedImdbId;
            if (!imdbId && detailsBundlePromise) {
              const bundle = await detailsBundlePromise;
              if (bundle?.bundledExternalIds?.imdb_id) {
                imdbId = bundle.bundledExternalIds.imdb_id;
              }
            }
            if (!imdbId && mappedImdbId) {
              imdbId = mappedImdbId;
            }
            if (!imdbId && !kitsuId && !aniListId && !needsAnimeOnlyRatings) {
              return new Map<RatingPreference, string>();
            }

            const resolveAnimeRatingIds = async () => {
              if (!shouldAttemptAnimeMapping) return;

              if (inputAnimeMappingProvider && inputAnimeMappingExternalId) {
                if (!malId) {
                  malId = await fetchMalIdFromReverseMapping({
                    provider: inputAnimeMappingProvider,
                    externalId: inputAnimeMappingExternalId,
                    season,
                    phases,
                  });
                }
                if (!kitsuId) {
                  kitsuId = await fetchKitsuIdFromReverseMapping({
                    provider: inputAnimeMappingProvider,
                    externalId: inputAnimeMappingExternalId,
                    season,
                    phases,
                  });
                }
                if (!aniListId) {
                  aniListId = await fetchAniListIdFromReverseMapping({
                    provider: inputAnimeMappingProvider,
                    externalId: inputAnimeMappingExternalId,
                    season,
                    phases,
                  });
                }
              }
              if (imdbId) {
                if (!malId) {
                  malId = await fetchMalIdFromReverseMapping({
                    provider: 'imdb',
                    externalId: imdbId,
                    season,
                    phases,
                  });
                }
                if (!kitsuId) {
                  kitsuId = await fetchKitsuIdFromReverseMapping({
                    provider: 'imdb',
                    externalId: imdbId,
                    season,
                    phases,
                  });
                }
                if (!aniListId) {
                  aniListId = await fetchAniListIdFromReverseMapping({
                    provider: 'imdb',
                    externalId: imdbId,
                    season,
                    phases,
                  });
                }
              }
              if (media?.id) {
                if (!malId) {
                  malId = await fetchMalIdFromReverseMapping({
                    provider: 'tmdb',
                    externalId: String(media.id),
                    season,
                    phases,
                  });
                }
                if (!kitsuId) {
                  kitsuId = await fetchKitsuIdFromReverseMapping({
                    provider: 'tmdb',
                    externalId: String(media.id),
                    season,
                    phases,
                  });
                }
                if (!aniListId) {
                  aniListId = await fetchAniListIdFromReverseMapping({
                    provider: 'tmdb',
                    externalId: String(media.id),
                    season,
                    phases,
                  });
                }
              }
              if (kitsuId || aniListId || malId) {
                hasConfirmedAnimeMapping = true;
                allowAnimeOnlyRatings = true;
              }
            };

            if (needsAnimeOnlyRatings && shouldAttemptAnimeMapping && (!kitsuId || !aniListId || !malId)) {
              await resolveAnimeRatingIds();
            }
            if (kitsuId || aniListId || malId) {
              hasConfirmedAnimeMapping = true;
              allowAnimeOnlyRatings = true;
            }

            const combinedRatings = new Map<RatingPreference, string>();
            const shortCircuitLimit = null;

            if (shortCircuitLimit) {
              let mdbRatings: Map<RatingPreference, string> | null = null;
              let mdbListCacheTtlMs: number | null = null;
              let hasFetchedMdb = false;
              let hasFetchedAniList = false;
              let hasFetchedKitsu = false;
              let hasFetchedMyAnimeList = false;
              let hasFetchedTrakt = false;

              const ensureImdbId = async () => {
                if (imdbId) return imdbId;
                imdbId = media?.imdb_id || mappedImdbId || null;
                if (!imdbId && detailsBundlePromise) {
                  const bundle = await detailsBundlePromise;
                  if (bundle?.bundledExternalIds?.imdb_id) {
                    imdbId = bundle.bundledExternalIds.imdb_id;
                  }
                }
                if (!imdbId && mappedImdbId) {
                  imdbId = mappedImdbId;
                }
                return imdbId;
              };

              const ensureAnimeMapping = async () => {
                if (allowAnimeOnlyRatings || !needsAnimeOnlyRatings) return;
                if (!shouldAttemptAnimeMapping) return;
                if (kitsuId || aniListId || malId) {
                  hasConfirmedAnimeMapping = true;
                  allowAnimeOnlyRatings = true;
                  return;
                }
                const resolvedImdbId = await ensureImdbId();
                if (!imdbId && resolvedImdbId) {
                  imdbId = resolvedImdbId;
                }
                await resolveAnimeRatingIds();
                if (kitsuId || aniListId || malId) {
                  hasConfirmedAnimeMapping = true;
                  allowAnimeOnlyRatings = true;
                }
              };

              const ensureMdbRatings = async () => {
                if (hasFetchedMdb) return mdbRatings;
                hasFetchedMdb = true;
                const resolvedImdbId = await ensureImdbId();
                if (!resolvedImdbId || !(mdblistKey || hasMdbListApiKey)) return null;
                try {
                  mdbListCacheTtlMs = getMdbListCacheTtlMs({
                    imdbId: resolvedImdbId,
                    mediaType: resolvedRatingMediaType,
                    releaseDate: mediaType === 'movie' ? media?.release_date : media?.first_air_date,
                  });
                  mdbRatings = await fetchMdbListRatings({
                    imdbId: resolvedImdbId,
                    cacheTtlMs: mdbListCacheTtlMs,
                    phases,
                    requestSource: 'addon',
                    imageType,
                    cleanId,
                    manualApiKey: mdblistKey,
                  });
                  if (mdbRatings) {
                    for (const [provider, value] of mdbRatings.entries()) {
                      combinedRatings.set(provider, value);
                      renderedRatingTtlByProvider.set(provider, mdbListCacheTtlMs);
                    }
                  }
                } catch {
                }
                return mdbRatings;
              };

              const ensureImdbDatasetRating = async () => {
                if (combinedRatings.has('imdb')) return combinedRatings.get('imdb') || null;
                const resolvedImdbId = await ensureImdbId();
                if (!resolvedImdbId) return null;
                const datasetRating = getImdbRatingFromDataset(resolvedImdbId);
                if (datasetRating) {
                  const normalized = normalizeRatingValue(datasetRating.rating);
                  if (normalized) {
                    combinedRatings.set('imdb', normalized);
                    renderedRatingTtlByProvider.set('imdb', IMDB_DATASET_CACHE_TTL_MS);
                  }
                }
                return combinedRatings.get('imdb') || null;
              };

              const ensureKitsuRating = async () => {
                if (hasFetchedKitsu) {
                  return combinedRatings.get('kitsu') || null;
                }
                hasFetchedKitsu = true;
                if (!kitsuId) return combinedRatings.get('kitsu') || null;
                try {
                  const kitsuCacheTtlMs = getRatingCacheTtlMs({
                    id: kitsuId,
                    mediaType: resolvedRatingMediaType,
                    releaseDate: mediaType === 'movie' ? media?.release_date : media?.first_air_date,
                    defaultTtlMs: KITSU_CACHE_TTL_MS,
                    oldTtlMs: MDBLIST_OLD_MOVIE_CACHE_TTL_MS,
                  });
                  const kitsuRating = await fetchKitsuRating(kitsuId, phases);
                  if (kitsuRating) {
                    combinedRatings.set('kitsu', kitsuRating);
                    renderedRatingTtlByProvider.set('kitsu', kitsuCacheTtlMs);
                  }
                } catch {
                }
                return combinedRatings.get('kitsu') || null;
              };

              const ensureAniListRating = async () => {
                if (hasFetchedAniList) {
                  return combinedRatings.get('anilist') || null;
                }
                hasFetchedAniList = true;
                if (!aniListId) return combinedRatings.get('anilist') || null;
                try {
                  const aniListCacheTtlMs = getRatingCacheTtlMs({
                    id: `anilist:${aniListId}`,
                    mediaType: resolvedRatingMediaType,
                    releaseDate: mediaType === 'movie' ? media?.release_date : media?.first_air_date,
                    defaultTtlMs: KITSU_CACHE_TTL_MS,
                    oldTtlMs: MDBLIST_OLD_MOVIE_CACHE_TTL_MS,
                  });
                  const aniListRating = await fetchAniListRating(aniListId, phases);
                  if (aniListRating) {
                    combinedRatings.set('anilist', aniListRating);
                    renderedRatingTtlByProvider.set('anilist', aniListCacheTtlMs);
                  }
                } catch {
                }
                return combinedRatings.get('anilist') || null;
              };

              const ensureMyAnimeListRating = async () => {
                if (hasFetchedMyAnimeList) {
                  return combinedRatings.get('myanimelist') || null;
                }
                hasFetchedMyAnimeList = true;
                if (!malId) return combinedRatings.get('myanimelist') || null;
                try {
                  const malCacheTtlMs = getRatingCacheTtlMs({
                    id: `mal:${malId}`,
                    mediaType: resolvedRatingMediaType,
                    releaseDate: mediaType === 'movie' ? media?.release_date : media?.first_air_date,
                    defaultTtlMs: KITSU_CACHE_TTL_MS,
                    oldTtlMs: MDBLIST_OLD_MOVIE_CACHE_TTL_MS,
                  });
                  const malRating = await fetchMyAnimeListRating(malId, phases);
                  if (malRating) {
                    combinedRatings.set('myanimelist', malRating);
                    renderedRatingTtlByProvider.set('myanimelist', malCacheTtlMs);
                  }
                } catch {
                }
                return combinedRatings.get('myanimelist') || null;
              };

              const ensureTraktRating = async () => {
                if (hasFetchedTrakt) {
                  return combinedRatings.get('trakt') || null;
                }
                hasFetchedTrakt = true;
                const resolvedImdbId = await ensureImdbId();
                if (!resolvedImdbId) return combinedRatings.get('trakt') || null;
                try {
                  const traktCacheTtlMs = getRatingCacheTtlMs({
                    id: `trakt:${resolvedImdbId}`,
                    mediaType: resolvedRatingMediaType,
                    releaseDate: mediaType === 'movie' ? media?.release_date : media?.first_air_date,
                    defaultTtlMs: MDBLIST_CACHE_TTL_MS,
                    oldTtlMs: MDBLIST_OLD_MOVIE_CACHE_TTL_MS,
                  });
                  const traktRating = await fetchTraktRating({
                    imdbId: resolvedImdbId,
                    mediaType: resolvedRatingMediaType,
                    phases,
                  });
                  if (traktRating) {
                    combinedRatings.set('trakt', traktRating);
                    renderedRatingTtlByProvider.set('trakt', traktCacheTtlMs);
                  }
                } catch {
                }
                return combinedRatings.get('trakt') || null;
              };

              const resolveProvider = async (provider: RatingPreference) => {
                if (provider === 'tmdb') return tmdbRating;

                if (provider === 'imdb') {
                  const datasetRating = await ensureImdbDatasetRating();
                  if (datasetRating) return datasetRating;
                  await ensureMdbRatings();
                  return combinedRatings.get('imdb') || null;
                }

                if (provider === 'kitsu') {
                  if (!needsAnimeOnlyRatings) return null;
                  if (!allowAnimeOnlyRatings) {
                    await ensureAnimeMapping();
                  }
                  if (!allowAnimeOnlyRatings) return null;
                  const kitsuRating = await ensureKitsuRating();
                  if (kitsuRating) return kitsuRating;
                  await ensureMdbRatings();
                  return combinedRatings.get('kitsu') || null;
                }

                if (provider === 'anilist') {
                  if (!needsAnimeOnlyRatings) return null;
                  if (!allowAnimeOnlyRatings) {
                    await ensureAnimeMapping();
                  }
                  if (!allowAnimeOnlyRatings) return null;
                  const aniListRating = await ensureAniListRating();
                  if (aniListRating) return aniListRating;
                  await ensureMdbRatings();
                  return combinedRatings.get('anilist') || null;
                }

                if (provider === 'myanimelist') {
                  if (!needsAnimeOnlyRatings) return null;
                  if (!allowAnimeOnlyRatings) {
                    await ensureAnimeMapping();
                  }
                  if (!allowAnimeOnlyRatings) return null;
                  const myAnimeListRating = await ensureMyAnimeListRating();
                  if (myAnimeListRating) return myAnimeListRating;
                  await ensureMdbRatings();
                  return combinedRatings.get('myanimelist') || null;
                }

                if (provider === 'trakt') {
                  const traktRating = await ensureTraktRating();
                  if (traktRating) return traktRating;
                  await ensureMdbRatings();
                  return combinedRatings.get('trakt') || null;
                }

                if (ANIME_ONLY_RATING_PROVIDER_SET.has(provider)) {
                  if (!needsAnimeOnlyRatings) return null;
                  if (!allowAnimeOnlyRatings) {
                    await ensureAnimeMapping();
                  }
                  if (!allowAnimeOnlyRatings) return null;
                  await ensureMdbRatings();
                  return combinedRatings.get(provider) || null;
                }

                await ensureMdbRatings();
                return combinedRatings.get(provider) || null;
              };

              const orderedEffectiveRatingPreferences = orderRatingPreferencesForRender(
                effectiveRatingPreferences,
                {
                  prioritizeAnimeRatings: allowAnimeOnlyRatings,
                  preserveInputOrder: hasExplicitRatingOrder,
                }
              );
              let renderableCount = 0;
              for (const provider of orderedEffectiveRatingPreferences) {
                if (renderableCount >= shortCircuitLimit) break;
                const baseValue = await resolveProvider(provider);
                if (!shouldRenderRatingValue(baseValue)) continue;
                const formattedValue = formatDisplayRatingValue(provider, baseValue as string, {
                  valueMode: ratingValueMode,
                });
                if (!shouldRenderRatingValue(formattedValue)) continue;
                renderableCount += 1;
              }

              return combinedRatings;
            }

            if (imdbId && (mdblistKey || hasMdbListApiKey)) {
              try {
                const mdbListCacheTtlMs = getMdbListCacheTtlMs({
                  imdbId,
                  mediaType: resolvedRatingMediaType,
                  releaseDate: mediaType === 'movie' ? media?.release_date : media?.first_air_date,
                });
                const mdbRatings = await fetchMdbListRatings({
                  imdbId,
                  cacheTtlMs: mdbListCacheTtlMs,
                  phases,
                  requestSource: 'addon',
                  imageType,
                  cleanId,
                  manualApiKey: mdblistKey
                });
                if (mdbRatings) {
                  for (const [provider, value] of mdbRatings.entries()) {
                    if (!allowAnimeOnlyRatings && ANIME_ONLY_RATING_PROVIDER_SET.has(provider)) {
                      continue;
                    }
                    combinedRatings.set(provider, value);
                    renderedRatingTtlByProvider.set(provider, mdbListCacheTtlMs);
                  }
                }
              } catch {
              }
            }

            if (needsImdbRating && imdbId && !combinedRatings.has('imdb')) {
              const datasetRating = getImdbRatingFromDataset(imdbId);
              if (datasetRating) {
                const normalized = normalizeRatingValue(datasetRating.rating);
                if (normalized) {
                  combinedRatings.set('imdb', normalized);
                  renderedRatingTtlByProvider.set('imdb', IMDB_DATASET_CACHE_TTL_MS);
                }
              }
            }

            if (needsAniListRating && allowAnimeOnlyRatings && aniListId) {
              try {
                const aniListCacheTtlMs = getRatingCacheTtlMs({
                  id: `anilist:${aniListId}`,
                  mediaType: resolvedRatingMediaType,
                  releaseDate: mediaType === 'movie' ? media?.release_date : media?.first_air_date,
                  defaultTtlMs: KITSU_CACHE_TTL_MS,
                  oldTtlMs: MDBLIST_OLD_MOVIE_CACHE_TTL_MS,
                });
                const aniListRating = await fetchAniListRating(aniListId, phases);
                if (aniListRating) {
                  combinedRatings.set('anilist', aniListRating);
                  renderedRatingTtlByProvider.set('anilist', aniListCacheTtlMs);
                }
              } catch {
              }
            }

            if (needsMyAnimeListRating && allowAnimeOnlyRatings && malId) {
              try {
                const malCacheTtlMs = getRatingCacheTtlMs({
                  id: `mal:${malId}`,
                  mediaType: resolvedRatingMediaType,
                  releaseDate: mediaType === 'movie' ? media?.release_date : media?.first_air_date,
                  defaultTtlMs: KITSU_CACHE_TTL_MS,
                  oldTtlMs: MDBLIST_OLD_MOVIE_CACHE_TTL_MS,
                });
                const malRating = await fetchMyAnimeListRating(malId, phases);
                if (malRating) {
                  combinedRatings.set('myanimelist', malRating);
                  renderedRatingTtlByProvider.set('myanimelist', malCacheTtlMs);
                }
              } catch {
              }
            }

            if (needsKitsuRating && allowAnimeOnlyRatings && kitsuId) {
              try {
                const kitsuCacheTtlMs = getRatingCacheTtlMs({
                  id: kitsuId,
                  mediaType: resolvedRatingMediaType,
                  releaseDate: mediaType === 'movie' ? media?.release_date : media?.first_air_date,
                  defaultTtlMs: KITSU_CACHE_TTL_MS,
                  oldTtlMs: MDBLIST_OLD_MOVIE_CACHE_TTL_MS,
                });
                const kitsuRating = await fetchKitsuRating(kitsuId, phases);
                if (kitsuRating) {
                  combinedRatings.set('kitsu', kitsuRating);
                  renderedRatingTtlByProvider.set('kitsu', kitsuCacheTtlMs);
                }
              } catch {
              }
            }

            if (needsTraktRating && imdbId) {
              try {
                const traktCacheTtlMs = getRatingCacheTtlMs({
                  id: `trakt:${imdbId}`,
                  mediaType: resolvedRatingMediaType,
                  releaseDate: mediaType === 'movie' ? media?.release_date : media?.first_air_date,
                  defaultTtlMs: MDBLIST_CACHE_TTL_MS,
                  oldTtlMs: MDBLIST_OLD_MOVIE_CACHE_TTL_MS,
                });
                const traktRating = await fetchTraktRating({
                  imdbId,
                  mediaType: resolvedRatingMediaType,
                  phases,
                });
                if (traktRating) {
                  combinedRatings.set('trakt', traktRating);
                  renderedRatingTtlByProvider.set('trakt', traktCacheTtlMs);
                }
              } catch {
              }
            }

            return combinedRatings;
          })()
          : null;
      const streamBadgesPromise =
        shouldRenderStreamBadges && !useRawKitsuFallback && (mediaType === 'movie' || mediaType === 'tv')
          ? (async () => {
            let imdbId: string | null = isImdbId(mediaId) ? mediaId : null;
            if (!imdbId) {
              imdbId = media?.imdb_id || mappedImdbId || null;
              if (!imdbId && detailsBundlePromise) {
                const bundle = await detailsBundlePromise;
                if (bundle?.bundledExternalIds?.imdb_id) {
                  imdbId = bundle.bundledExternalIds.imdb_id;
                }
              }
              if (!imdbId && mappedImdbId) {
                imdbId = mappedImdbId;
              }
            }

            const tmdbId =
              media?.id != null
                ? String(media.id)
                : isTmdb && mediaId
                  ? String(mediaId)
                  : null;
            const baseTorrentioId = imdbId || (tmdbId ? `tmdb:${tmdbId}` : null);
            if (!baseTorrentioId) {
              return { badges: [], cacheTtlMs: TORRENTIO_CACHE_TTL_MS };
            }
            const torrentioType = mediaType === 'movie' ? 'movie' : 'series';
            const torrentioId = torrentioType === 'series' ? `${baseTorrentioId}:1:1` : baseTorrentioId;
            const torrentioCacheTtlMs = getRatingCacheTtlMs({
              id: baseTorrentioId,
              mediaType: resolvedRatingMediaType,
              releaseDate: mediaType === 'movie' ? media?.release_date : media?.first_air_date,
              defaultTtlMs: TORRENTIO_CACHE_TTL_MS,
              oldTtlMs: MDBLIST_OLD_MOVIE_CACHE_TTL_MS,
            });
            return fetchTorrentioBadges({ type: torrentioType, id: torrentioId, phases, cacheTtlMs: torrentioCacheTtlMs });
          })()
          : null;

      if (type === 'poster') {
        outputWidth = 500;
        outputHeight = 750;
      } else if (type === 'logo') {
        outputHeight = LOGO_BASE_HEIGHT;
        outputWidth = Math.max(
          LOGO_MIN_WIDTH,
          Math.min(
            LOGO_MAX_WIDTH,
            Math.round(LOGO_BASE_HEIGHT * (rawFallbackLogoAspectRatio || LOGO_FALLBACK_ASPECT_RATIO))
          )
        );
      }

      if (!useRawKitsuFallback && detailsBundlePromise) {
        const {
          details,
          fallbackDetails,
          bundledImages,
          bundledExternalIds,
          bundledCertificationPayload,
          tmdbRating: bundledRating,
        } = await detailsBundlePromise;
        tmdbRating = bundledRating;
        if (shouldRenderStreamBadges) {
          certificationBadgeLabel =
            mediaType === 'movie'
              ? resolveMovieCertificationBadge(bundledCertificationPayload, requestedImageLang)
              : mediaType === 'tv'
                ? resolveTvCertificationBadge(bundledCertificationPayload, requestedImageLang)
                : null;
        }
        primaryGenreFamily = resolvePrimaryGenreFamily(
          [
            ...(Array.isArray(details?.genres) ? details.genres : []),
            ...(Array.isArray(fallbackDetails?.genres) ? fallbackDetails.genres : []),
            ...(Array.isArray(media?.genres) ? media.genres : []),
          ],
          Array.isArray(media?.genre_ids) ? media.genre_ids : [],
        );
        genreBadge = buildResolvedGenreBadge(primaryGenreFamily);
        const fanartTvdbId =
          mediaType === 'tv'
            ? String(
                bundledExternalIds?.tvdb_id ||
                details?.external_ids?.tvdb_id ||
                fallbackDetails?.external_ids?.tvdb_id ||
                media?.external_ids?.tvdb_id ||
                ''
              ).trim()
            : '';
        let fanartArtworkPromise:
          | Promise<{ posterUrls: string[]; backdropUrls: string[]; logoUrls: string[] } | null>
          | null = null;
        const getFanartArtwork = async () => {
          if (!(mediaType === 'movie' || mediaType === 'tv')) return null;
          if (fanartArtworkPromise) return fanartArtworkPromise;
          fanartArtworkPromise = fetchFanartArtwork({
            mediaType,
            tmdbId: String(media.id),
            tvdbId: mediaType === 'tv' ? fanartTvdbId : null,
            fanartKey,
            fanartClientKey,
            requestedLang: requestedImageLang,
            fallbackLang: FALLBACK_IMAGE_LANGUAGE,
            phases,
          });
          return fanartArtworkPromise;
        };

        const selectImagePath = async (input: {
          posters: any[];
          backdrops: any[];
          logos: any[];
          seasonIncludeImageLanguage?: string;
        }) => {
          let posterCollection = input.posters || [];
          const backdropCollection = input.backdrops || [];
          const logoCollection = input.logos || [];
          const selectedLogo = pickByLanguageWithFallback(
            logoCollection,
            requestedImageLang,
            FALLBACK_IMAGE_LANGUAGE
          );
          const logoPath = selectedLogo?.file_path || null;

          const localizedPosterPath =
            pickByLanguageWithFallback(posterCollection, requestedImageLang, FALLBACK_IMAGE_LANGUAGE)?.file_path || null;
          let originalPosterPath =
            localizedPosterPath ||
            details?.poster_path ||
            media?.poster_path ||
            posterCollection[0]?.file_path;
          const localizedBackdropPath =
            pickByLanguageWithFallback(backdropCollection, requestedImageLang, FALLBACK_IMAGE_LANGUAGE)?.file_path || null;
          const originalBackdropPath =
            localizedBackdropPath ||
            details?.backdrop_path ||
            media?.backdrop_path ||
            backdropCollection[0]?.file_path;

          if (isKitsu && season && !episode && type === 'poster') {
            const seasonImagesQuery = input.seasonIncludeImageLanguage
              ? `&include_image_language=${input.seasonIncludeImageLanguage}`
              : '';
            const seasonImagesCacheKey = input.seasonIncludeImageLanguage
              ? `tmdb:season_images:${media.id}:${season}:${input.seasonIncludeImageLanguage}`
              : `tmdb:season_images:${media.id}:${season}:all`;

            const [seasonDetailsResponse, seasonImagesResponse] = await Promise.all([
              fetchJsonCached(
                `tmdb:season_details:${media.id}:${season}:${requestedImageLang}`,
                `https://api.themoviedb.org/3/tv/${media.id}/season/${season}?api_key=${tmdbKey}&language=${requestedImageLang}`,
                TMDB_CACHE_TTL_MS,
                phases,
                'tmdb'
              ),
              fetchJsonCached(
                seasonImagesCacheKey,
                `https://api.themoviedb.org/3/tv/${media.id}/season/${season}/images?api_key=${tmdbKey}${seasonImagesQuery}`,
                TMDB_CACHE_TTL_MS,
                phases,
                'tmdb'
              )
            ]);

            let seasonPosterPath = null;
            if (seasonDetailsResponse.ok) {
              const seasonDetails = seasonDetailsResponse.data;
              if (seasonDetails?.poster_path) {
                seasonPosterPath = seasonDetails.poster_path;
              }
            }

            if (!seasonPosterPath && requestedImageLang !== FALLBACK_IMAGE_LANGUAGE) {
              const seasonFallbackDetailsResponse = await fetchJsonCached(
                `tmdb:season_details:${media.id}:${season}:${FALLBACK_IMAGE_LANGUAGE}`,
                `https://api.themoviedb.org/3/tv/${media.id}/season/${season}?api_key=${tmdbKey}&language=${FALLBACK_IMAGE_LANGUAGE}`,
                TMDB_CACHE_TTL_MS,
                phases,
                'tmdb'
              );
              if (seasonFallbackDetailsResponse.ok) {
                const seasonFallbackDetails = seasonFallbackDetailsResponse.data;
                if (seasonFallbackDetails?.poster_path) {
                  seasonPosterPath = seasonFallbackDetails.poster_path;
                }
              }
            }

            if (seasonImagesResponse.ok) {
              const seasonImages = seasonImagesResponse.data;
              if (Array.isArray(seasonImages?.posters) && seasonImages.posters.length > 0) {
                posterCollection = seasonImages.posters;
              }
            }

            originalPosterPath =
              seasonPosterPath ||
              pickByLanguageWithFallback(posterCollection, requestedImageLang, FALLBACK_IMAGE_LANGUAGE)?.file_path ||
              originalPosterPath;
          }

          if (type === 'poster') {
            if (posterArtworkSource === 'cinemeta') {
              let imdbId: string | null = isImdbId(mediaId) ? mediaId : null;
              if (!imdbId) {
                imdbId = media?.imdb_id || mappedImdbId || null;
                if (!imdbId && detailsBundlePromise) {
                  const bundle = await detailsBundlePromise;
                  if (bundle?.bundledExternalIds?.imdb_id) {
                    imdbId = bundle.bundledExternalIds.imdb_id;
                  }
                }
              }
              if (imdbId) {
                return {
                  imgPath: '',
                  imgUrlOverride: buildCinemetaPosterUrl(imdbId),
                  logoAspectRatio: null,
                  logoPath,
                  posterIsTextless: false,
                };
              }
            }
            if (posterArtworkSource === 'fanart' && (mediaType === 'movie' || mediaType === 'tv')) {
              const fanartArtwork = await getFanartArtwork();
              const fanartPosterUrl = pickFanartUrlByPreference(
                fanartArtwork?.posterUrls || [],
                posterTextPreference
              );
              if (fanartPosterUrl) {
                return {
                  imgPath: '',
                  imgUrlOverride: fanartPosterUrl,
                  logoAspectRatio: null,
                  logoPath: fanartArtwork?.logoUrls?.[0] || logoPath,
                  posterIsTextless: false,
                };
              }
            }
            const selectedPoster = pickPosterByPreference(
              posterCollection,
              posterTextPreference,
              requestedImageLang,
              FALLBACK_IMAGE_LANGUAGE,
              originalPosterPath
            );
            const posterIsTextless = isTextlessPosterSelection(posterCollection, selectedPoster);
            return {
              imgPath: selectedPoster?.file_path || '',
              imgUrlOverride: null,
              logoAspectRatio: null,
              logoPath,
              posterIsTextless,
            };
          }

          if (type === 'backdrop') {
            if (backdropArtworkSource === 'fanart' && (mediaType === 'movie' || mediaType === 'tv')) {
              const fanartArtwork = await getFanartArtwork();
              const fanartBackdropUrl = pickFanartUrlByPreference(
                fanartArtwork?.backdropUrls || [],
                posterTextPreference
              );
              if (fanartBackdropUrl) {
                return {
                  imgPath: '',
                  imgUrlOverride: fanartBackdropUrl,
                  logoAspectRatio: null,
                  logoPath,
                  posterIsTextless: false,
                };
              }
            }
            const selectedBackdrop = pickBackdropByPreference(
              backdropCollection,
              imageText as PosterTextPreference,
              requestedImageLang,
              FALLBACK_IMAGE_LANGUAGE,
              originalBackdropPath
            );
            return {
              imgPath: selectedBackdrop?.file_path || '',
              imgUrlOverride: null,
              logoAspectRatio: null,
              logoPath,
              posterIsTextless: false,
            };
          }

          if (logoArtworkSource === 'fanart' && (mediaType === 'movie' || mediaType === 'tv')) {
            const fanartArtwork = await getFanartArtwork();
            const fanartLogoUrl = fanartArtwork?.logoUrls?.[0] || null;
            if (fanartLogoUrl) {
              const logoAspectRatio = await getRemoteImageAspectRatio(fanartLogoUrl);
              return {
                imgPath: '',
                imgUrlOverride: fanartLogoUrl,
                logoAspectRatio,
                logoPath: fanartLogoUrl,
                posterIsTextless: false,
              };
            }
          }

          const logoAspectRatio =
            typeof selectedLogo?.aspect_ratio === 'number' && selectedLogo.aspect_ratio > 0
              ? selectedLogo.aspect_ratio
              : null;
          return {
            imgPath: logoPath || '',
            imgUrlOverride: null,
            logoAspectRatio,
            logoPath,
            posterIsTextless: false,
          };
        };

        const initialImages = bundledImages || {};
        const initialSelection = await selectImagePath({
          posters: initialImages.posters || [],
          backdrops: initialImages.backdrops || [],
          logos: initialImages.logos || [],
          seasonIncludeImageLanguage: includeImageLanguage
        });

        imgPath = initialSelection.imgPath;
        imgUrl = initialSelection.imgUrlOverride || imgUrl;
        selectedLogoAspectRatio = initialSelection.logoAspectRatio;
        selectedPosterLogoPath = initialSelection.logoPath || null;
        selectedPosterIsTextless = initialSelection.posterIsTextless;
        if (
          imageType === 'poster' &&
          posterTextPreference === 'clean' &&
          selectedPosterIsTextless &&
          !selectedPosterLogoPath
        ) {
          const logoFallbackImagesResponse = await fetchJsonCached(
            `tmdb:${mediaType}:${media.id}:images:all`,
            `https://api.themoviedb.org/3/${mediaType}/${media.id}/images?api_key=${tmdbKey}`,
            TMDB_CACHE_TTL_MS,
            phases,
            'tmdb'
          );
          if (logoFallbackImagesResponse.ok) {
            const logoFallbackImages = logoFallbackImagesResponse.data || {};
            const logoFallback = pickByLanguageWithFallback(
              logoFallbackImages.logos || [],
              requestedImageLang,
              FALLBACK_IMAGE_LANGUAGE
            );
            if (logoFallback?.file_path) {
              selectedPosterLogoPath = logoFallback.file_path;
            }
          }
        }
        if (selectedLogoAspectRatio) {
          outputWidth = Math.max(
            LOGO_MIN_WIDTH,
            Math.min(LOGO_MAX_WIDTH, Math.round(LOGO_BASE_HEIGHT * selectedLogoAspectRatio))
          );
        }

        if (!imgPath && !imgUrl) {
          const fallbackImagesResponse = await fetchJsonCached(
            `tmdb:${mediaType}:${media.id}:images:all`,
            `https://api.themoviedb.org/3/${mediaType}/${media.id}/images?api_key=${tmdbKey}`,
            TMDB_CACHE_TTL_MS,
            phases,
            'tmdb'
          );
          if (fallbackImagesResponse.ok) {
            const fallbackImages = fallbackImagesResponse.data || {};
            const fallbackSelection = await selectImagePath({
              posters: fallbackImages.posters || [],
              backdrops: fallbackImages.backdrops || [],
              logos: fallbackImages.logos || [],
              seasonIncludeImageLanguage: undefined
            });
            if (fallbackSelection.imgPath) {
              imgPath = fallbackSelection.imgPath;
              imgUrl = fallbackSelection.imgUrlOverride || imgUrl;
              selectedLogoAspectRatio = fallbackSelection.logoAspectRatio;
              selectedPosterLogoPath = fallbackSelection.logoPath || selectedPosterLogoPath;
              selectedPosterIsTextless = fallbackSelection.posterIsTextless;
              if (selectedLogoAspectRatio) {
                outputWidth = Math.max(
                  LOGO_MIN_WIDTH,
                  Math.min(LOGO_MAX_WIDTH, Math.round(LOGO_BASE_HEIGHT * selectedLogoAspectRatio))
                );
              }
            }
          }
        }
      }

      if (!imgUrl && !imgPath) {
        throw new HttpError('Image not found', 404);
      }
      if (!imgUrl) {
        imgUrl = buildTmdbImageUrl(imageType, imgPath, outputWidth);
      }
      const shouldApplyPosterCleanOverlay =
        imageType === 'poster' && posterTextPreference === 'clean' && selectedPosterIsTextless;
      const shouldApplyPosterBrandingOverlay =
        shouldApplyPosterCleanOverlay;
      const posterTitleText = shouldApplyPosterBrandingOverlay
        ? pickPosterTitleFromMedia(media, mediaType, rawFallbackTitle)
        : null;
      const posterLogoUrl =
        shouldApplyPosterBrandingOverlay && selectedPosterLogoPath
          ? (/^https?:\/\//i.test(selectedPosterLogoPath)
            ? selectedPosterLogoPath
            : buildTmdbImageUrl('logo', selectedPosterLogoPath, outputWidth))
          : null;
      if (!shouldRenderBadges && !posterTitleText && !posterLogoUrl) {
        return getSourceImagePayload(imgUrl);
      }
      if (providerRatingsPromise) {
        providerRatings = await providerRatingsPromise;
      }
      let streamBadges: RatingBadge[] = [];
      let streamBadgesCacheTtlMs: number | null = null;
      if (streamBadgesPromise) {
        const streamBadgeResult = await streamBadgesPromise;
        streamBadges = streamBadgeResult.badges;
        streamBadgesCacheTtlMs = streamBadgeResult.cacheTtlMs;
      }
      if (certificationBadgeLabel) {
        const certificationBadge = buildCertificationBadgeMeta(certificationBadgeLabel);
        streamBadges = [
          {
            key: certificationBadge.key,
            label: certificationBadge.label,
            value: '',
            iconUrl: '',
            accentColor: certificationBadge.accentColor,
          },
          ...streamBadges,
        ];
      }
      if (imageType !== 'logo') {
        const enabledQualityBadgeSet = new Set(qualityBadgePreferences);
        streamBadges = MEDIA_FEATURE_BADGE_ORDER.flatMap((badgeKey) => {
          if (!enabledQualityBadgeSet.has(badgeKey)) {
            return [];
          }
          const match = streamBadges.find((badge) => badge.key === badgeKey);
          return match ? [match] : [];
        });
      }
      if (shouldRenderRawKitsuFallbackRating) {
        providerRatings.set('kitsu', rawFallbackKitsuRating as string);
        renderedRatingTtlByProvider.set('kitsu', KITSU_CACHE_TTL_MS);
      }
      const usePosterBadgeLayout = type === 'poster';
      const useBackdropBadgeLayout = type === 'backdrop';
      const useLogoBadgeLayout = type === 'logo';
      const usesAggregatePresentation =
        ratingPresentation === 'minimal' ||
        ratingPresentation === 'average' ||
        ratingPresentation === 'editorial';
      const useEditorialPosterPresentation =
        imageType === 'poster' && ratingPresentation === 'editorial';
      const useBlockbusterPresentation = ratingPresentation === 'blockbuster';
      const effectivePosterRatingsLayout =
        usePosterBadgeLayout
          ? resolvePosterRatingLayoutForPresentation(ratingPresentation, posterRatingsLayout)
          : posterRatingsLayout;
      const effectivePosterRatingsMaxPerSide =
        usePosterBadgeLayout
          ? resolvePosterRatingsMaxPerSideForPresentation(
              ratingPresentation,
              posterRatingsMaxPerSide,
            )
          : posterRatingsMaxPerSide;
      const effectiveBackdropRatingsLayout =
        useBackdropBadgeLayout
          ? resolveBackdropRatingLayoutForPresentation(ratingPresentation, backdropRatingsLayout)
          : backdropRatingsLayout;
      const effectiveLogoRatingsMax =
        useLogoBadgeLayout
          ? resolveLogoRatingsMaxForPresentation(ratingPresentation, logoRatingsMax)
          : logoRatingsMax;
      const posterRatingLimit = usePosterBadgeLayout
        ? getPosterRatingLayoutMaxBadges(effectivePosterRatingsLayout, effectivePosterRatingsMaxPerSide)
        : null;
      const logoRatingLimit = useLogoBadgeLayout ? effectiveLogoRatingsMax : null;
      const explicitRatingBadgeLimit =
        imageType === 'poster'
          ? posterRatingsMax
          : imageType === 'backdrop'
            ? backdropRatingsMax
            : effectiveLogoRatingsMax;
      const resolvedRatingBadgeLimit =
        !usesAggregatePresentation && (usePosterBadgeLayout || useLogoBadgeLayout)
          ? (posterRatingLimit ?? logoRatingLimit ?? null)
          : !usesAggregatePresentation && useBackdropBadgeLayout
            ? explicitRatingBadgeLimit
            : null;
      const effectiveResolvedRatingBadgeLimit =
        typeof explicitRatingBadgeLimit === 'number' && explicitRatingBadgeLimit > 0
          ? typeof resolvedRatingBadgeLimit === 'number' && resolvedRatingBadgeLimit > 0
            ? Math.min(resolvedRatingBadgeLimit, explicitRatingBadgeLimit)
            : explicitRatingBadgeLimit
          : resolvedRatingBadgeLimit;
      const ratingBadgeByProvider = new Map<RatingPreference, RatingBadge>();
      const renderableRatingPreferences = orderRatingPreferencesForRender(
        effectiveRatingPreferences.filter(
          (provider) =>
            provider === 'kitsu'
              ? shouldRenderRawKitsuFallbackRating || allowAnimeOnlyRatings
              : allowAnimeOnlyRatings || !ANIME_ONLY_RATING_PROVIDER_SET.has(provider)
        ),
        {
          prioritizeAnimeRatings: allowAnimeOnlyRatings,
          preserveInputOrder: hasExplicitRatingOrder,
        }
      );
      for (const provider of renderableRatingPreferences) {
        const meta = RATING_PROVIDER_META.get(provider);
        if (!meta) continue;

        const baseValue = provider === 'tmdb' ? tmdbRating : providerRatings.get(provider) || null;
        if (!shouldRenderRatingValue(baseValue)) continue;
        const value = formatDisplayRatingValue(provider, baseValue as string, {
          valueMode: ratingValueMode,
        });
        const sourceValue = formatDisplayRatingValue(provider, baseValue as string, {
          valueMode: 'native',
        });
        if (!shouldRenderRatingValue(value)) continue;
        const appearance = resolveRatingProviderBadgeAppearance({
          provider,
          label: meta.label,
          iconUrl: meta.iconUrl,
          accentColor: meta.accentColor,
          sourceValue,
        });
        const providerAppearance = providerAppearanceOverrides[provider];
        ratingBadgeByProvider.set(provider, {
          key: provider,
          label: appearance.label,
          value,
          sourceValue,
          iconUrl: providerAppearance?.iconUrl || appearance.iconUrl,
          accentColor: providerAppearance?.accentColor || appearance.accentColor,
          iconScalePercent:
            providerAppearance?.iconScalePercent || DEFAULT_PROVIDER_ICON_SCALE_PERCENT,
          stackedLineVisible:
            providerAppearance?.stackedLineVisible === false ? false : undefined,
          stackedLineWidthPercent: providerAppearance?.stackedLineWidthPercent,
          stackedLineHeightPercent: providerAppearance?.stackedLineHeightPercent,
          stackedLineGapPercent: providerAppearance?.stackedLineGapPercent,
          stackedWidthPercent: providerAppearance?.stackedWidthPercent,
          stackedSurfaceOpacityPercent: providerAppearance?.stackedSurfaceOpacityPercent,
          stackedAccentMode: providerAppearance?.stackedAccentMode,
          variant: 'standard',
        });
      }
      const aggregateBadge = usesAggregatePresentation
        ? buildAggregateRatingBadge({
            requestedSource: aggregateRatingSource,
            presentation: ratingPresentation,
            renderablePreferences: renderableRatingPreferences,
            ratingBadgeByProvider,
          })
        : null;
      const editorialOverlay =
        useEditorialPosterPresentation && aggregateBadge
          ? buildEditorialRatingOverlaySvg({
              outputWidth,
              outputHeight,
              eyebrowText: getEditorialEyebrowText(
                primaryGenreFamily?.id || null,
                aggregateRatingSource,
              ),
              valueText: aggregateBadge.value,
              accentColor:
                primaryGenreFamily?.accentColor ||
                AGGREGATE_BADGE_ACCENT_BY_SOURCE[aggregateRatingSource],
            })
          : null;
      const ratingBadges = usesAggregatePresentation
        ? aggregateBadge
          ? [aggregateBadge]
          : []
        : selectAvailableRatingPreferences(
            renderableRatingPreferences,
            ratingBadgeByProvider.keys(),
            effectiveResolvedRatingBadgeLimit,
          )
            .map((provider) => ratingBadgeByProvider.get(provider) || null)
            .filter((badge): badge is RatingBadge => badge !== null);
      const displayRatingBadges = useEditorialPosterPresentation ? [] : ratingBadges;
      if (useEditorialPosterPresentation) {
        genreBadge = null;
      }
      if (
        displayRatingBadges.length === 0 &&
        streamBadges.length === 0 &&
        !shouldRenderLogoBackground &&
        !genreBadge &&
        !posterTitleText &&
        !posterLogoUrl &&
        !editorialOverlay
      ) {
        return getSourceImagePayload(imgUrl);
      }
      const usePosterRowLayout =
        usePosterBadgeLayout &&
        (effectivePosterRatingsLayout === 'top' ||
          effectivePosterRatingsLayout === 'bottom' ||
          effectivePosterRatingsLayout === 'top-bottom');
      const usePosterRowLayoutLarge = usePosterBadgeLayout && usePosterRowLayout;
      const useBackdropRightVerticalLayout =
        useBackdropBadgeLayout && effectiveBackdropRatingsLayout === 'right-vertical';
      let cappedRatingBadges = [...displayRatingBadges];
      const backdropRows =
        useBackdropBadgeLayout && !useBackdropRightVerticalLayout
          ? (() => {
              const firstRowCount = Math.ceil(cappedRatingBadges.length / 2);
              return [cappedRatingBadges.slice(0, firstRowCount), cappedRatingBadges.slice(firstRowCount)];
            })()
          : [];
      let posterBadgeGroups = splitPosterBadgesByLayout(
        cappedRatingBadges,
        effectivePosterRatingsLayout,
        effectivePosterRatingsMaxPerSide === null ? undefined : effectivePosterRatingsMaxPerSide
      );
      let topRatingBadges = usePosterBadgeLayout
        ? posterBadgeGroups.topBadges
        : useBackdropRightVerticalLayout
          ? []
          : (backdropRows[0] || []);
      let bottomRatingBadges = usePosterBadgeLayout
        ? posterBadgeGroups.bottomBadges
        : useBackdropRightVerticalLayout
          ? []
          : (backdropRows[1] || []);
      let leftRatingBadges = usePosterBadgeLayout ? posterBadgeGroups.leftBadges : [];
      let rightRatingBadges = usePosterBadgeLayout
        ? posterBadgeGroups.rightBadges
        : useBackdropRightVerticalLayout
          ? [...cappedRatingBadges]
          : [];
      let posterTopRows: RatingBadge[][] = topRatingBadges.length > 0 ? [topRatingBadges] : [];
      let posterBottomRows: RatingBadge[][] = bottomRatingBadges.length > 0 ? [bottomRatingBadges] : [];
      let blockbusterBlurbs: BlockbusterBlurb[] = [];

      if (usePosterBadgeLayout && useBlockbusterPresentation && mediaType && media?.id) {
        const fetchBlockbusterBlurbsForLanguage = async (language: string) => {
          const responses = await Promise.all(
            [1, 2, 3].map((page) =>
              fetchJsonCached(
                `tmdb:${mediaType}:${media.id}:reviews:${language}:page:${page}`,
                `https://api.themoviedb.org/3/${mediaType}/${media.id}/reviews?api_key=${tmdbKey}&language=${language}&page=${page}`,
                TMDB_CACHE_TTL_MS,
                phases,
                'tmdb'
              )
            )
          );
          return dedupeBlockbusterBlurbs(
            responses.flatMap((response) =>
              response.ok ? extractBlockbusterReviewBlurbs(response.data) : []
            ),
            10
          );
        };

        blockbusterBlurbs = await fetchBlockbusterBlurbsForLanguage(requestedImageLang);

        if (blockbusterBlurbs.length < 6 && requestedImageLang !== FALLBACK_IMAGE_LANGUAGE) {
          blockbusterBlurbs = dedupeBlockbusterBlurbs(
            [
              ...blockbusterBlurbs,
              ...(await fetchBlockbusterBlurbsForLanguage(FALLBACK_IMAGE_LANGUAGE)),
            ],
            10
          );
        }
      }

      let badgeIconSize = 34;
      let badgeFontSize = 28;
      let badgePaddingY = 8;
      let badgePaddingX = 14;
      let badgeGap = 10;
      let badgeTopOffset = 16;
      let badgeBottomOffset = 16;
      let posterMinMetrics: BadgeLayoutMetrics = DEFAULT_BADGE_MIN_METRICS;
      let posterRowHorizontalInset = 12;

      if (useBackdropBadgeLayout) {
        badgeIconSize = 32;
        badgeFontSize = 24;
        badgePaddingY = 8;
        badgePaddingX = 12;
        badgeGap = 8;
        badgeTopOffset = 20;
        badgeBottomOffset = 20;
      } else if (usePosterBadgeLayout) {
        if (usePosterRowLayoutLarge) {
          badgeIconSize = 46;
          badgeFontSize = 35;
          badgePaddingY = 8;
          badgePaddingX = 13;
          badgeGap = 9;
        } else {
          badgeIconSize = 42;
          badgeFontSize = 32;
          badgePaddingY = 7;
          badgePaddingX = 11;
          badgeGap = 8;
        }
        posterRowHorizontalInset = usePosterRowLayout ? 12 : 12;
        posterMinMetrics = {
          iconSize: 24,
          fontSize: 18,
          paddingX: 8,
          paddingY: 6,
          gap: 6,
        };
        badgeTopOffset = 24;
        badgeBottomOffset = 24;
      } else if (useLogoBadgeLayout) {
        badgeIconSize = 80;
        badgeFontSize = 60;
        badgePaddingY = 20;
        badgePaddingX = 32;
        badgeGap = 18;
      }
      const ratingBadgeScalePercent =
        imageType === 'poster'
          ? posterRatingBadgeScale
          : imageType === 'backdrop'
            ? backdropRatingBadgeScale
            : logoRatingBadgeScale;
      const qualityBadgeScalePercent =
        imageType === 'backdrop' ? backdropQualityBadgeScale : posterQualityBadgeScale;
      const scaledBadgeMetrics = scaleBadgeMetrics(
        {
          iconSize: badgeIconSize,
          fontSize: badgeFontSize,
          paddingX: badgePaddingX,
          paddingY: badgePaddingY,
          gap: badgeGap,
        },
        ratingBadgeScalePercent,
      );
      badgeIconSize = scaledBadgeMetrics.iconSize;
      badgeFontSize = scaledBadgeMetrics.fontSize;
      badgePaddingX = scaledBadgeMetrics.paddingX;
      badgePaddingY = scaledBadgeMetrics.paddingY;
      badgeGap = scaledBadgeMetrics.gap;

      if (usePosterBadgeLayout && cappedRatingBadges.length > 0) {
        let fittedPosterMetrics: BadgeLayoutMetrics;
        if (
          effectivePosterRatingsLayout === 'left' ||
          effectivePosterRatingsLayout === 'right' ||
          effectivePosterRatingsLayout === 'left-right'
        ) {
          const useThreeBadgeTopRow =
            effectivePosterRatingsLayout === 'left-right' &&
            topRatingBadges.length === 1 &&
            leftRatingBadges.length > 0 &&
            rightRatingBadges.length > 0;
          const fittedLeftColumn = useThreeBadgeTopRow ? leftRatingBadges.slice(1) : leftRatingBadges;
          const fittedRightColumn = useThreeBadgeTopRow ? rightRatingBadges.slice(1) : rightRatingBadges;
          const posterColumns = [fittedLeftColumn, fittedRightColumn].filter((column) => column.length > 0);
          const widthRows = posterColumns.flatMap((column) => column.map((badge) => [badge]));
          const alignPosterQualityBadges =
            (effectivePosterRatingsLayout === 'left' || effectivePosterRatingsLayout === 'right') &&
            streamBadges.length > 0;
          const reservedTopRows =
            effectivePosterRatingsLayout === 'left-right' && topRatingBadges.length > 0 ? 1 : 0;
          const posterColumnMaxWidth =
            effectivePosterRatingsLayout === 'left-right'
              ? Math.max(160, Math.floor((outputWidth - 36) / 2))
              : alignPosterQualityBadges
                ? Math.max(220, Math.floor(outputWidth * 0.6))
                : Math.max(180, Math.floor(outputWidth * 0.46));
          fittedPosterMetrics = fitPosterBadgeMetricsToWidth(widthRows, posterColumnMaxWidth + 24, {
            iconSize: badgeIconSize,
            fontSize: badgeFontSize,
            paddingX: badgePaddingX,
            paddingY: badgePaddingY,
            gap: badgeGap,
          }, posterMinMetrics, false, false, ratingStyle);
          fittedPosterMetrics = fitPosterBadgeMetricsToHeight(
            posterColumns,
            outputHeight,
            fittedPosterMetrics,
            badgeTopOffset,
            badgeBottomOffset,
            posterMinMetrics,
            reservedTopRows,
            ratingStyle
          );
          const maxPerColumn = getMaxBadgeColumnCount(
            outputHeight,
            fittedPosterMetrics,
            badgeTopOffset,
            badgeBottomOffset,
            reservedTopRows,
            ratingStyle
          );
          const effectiveMaxPerSide =
            effectivePosterRatingsMaxPerSide === null
              ? maxPerColumn + (useThreeBadgeTopRow ? 1 : 0)
              : Math.min(
                  maxPerColumn + (useThreeBadgeTopRow ? 1 : 0),
                  effectivePosterRatingsMaxPerSide
                );
          posterBadgeGroups = splitPosterBadgesByLayout(
            cappedRatingBadges,
            effectivePosterRatingsLayout,
            effectiveMaxPerSide
          );
          topRatingBadges = posterBadgeGroups.topBadges;
          bottomRatingBadges = posterBadgeGroups.bottomBadges;
          leftRatingBadges = posterBadgeGroups.leftBadges;
          rightRatingBadges = posterBadgeGroups.rightBadges;
          cappedRatingBadges = [...topRatingBadges, ...leftRatingBadges, ...rightRatingBadges];
        } else {
          const posterRowFitWidth = usePosterRowLayout
            ? Math.max(0, outputWidth - posterRowHorizontalInset * 2)
            : outputWidth;
          fittedPosterMetrics = fitPosterBadgeMetricsToWidth(
            [topRatingBadges, bottomRatingBadges].filter((row) => row.length > 0),
            posterRowFitWidth,
            {
              iconSize: badgeIconSize,
              fontSize: badgeFontSize,
              paddingX: badgePaddingX,
              paddingY: badgePaddingY,
              gap: badgeGap,
            },
            posterMinMetrics,
            usePosterRowLayout,
            false,
            ratingStyle
          );
          if (effectivePosterRatingsLayout === 'top') {
            posterTopRows = splitBadgesIntoFittingRows(
              topRatingBadges,
              posterRowFitWidth,
              fittedPosterMetrics,
              usePosterRowLayout,
              ratingStyle
            );
          } else if (effectivePosterRatingsLayout === 'bottom') {
            posterBottomRows = splitBadgesIntoFittingRows(
              bottomRatingBadges,
              posterRowFitWidth,
              fittedPosterMetrics,
              usePosterRowLayout,
              ratingStyle
            );
          } else if (effectivePosterRatingsLayout === 'top-bottom') {
            posterTopRows = splitBadgesIntoFittingRows(
              topRatingBadges,
              posterRowFitWidth,
              fittedPosterMetrics,
              usePosterRowLayout,
              ratingStyle
            );
            posterBottomRows = splitBadgesIntoFittingRows(
              bottomRatingBadges,
              posterRowFitWidth,
              fittedPosterMetrics,
              usePosterRowLayout,
              ratingStyle
            );
          }
        }
        badgeIconSize = fittedPosterMetrics.iconSize;
        badgeFontSize = fittedPosterMetrics.fontSize;
        badgePaddingX = fittedPosterMetrics.paddingX;
        badgePaddingY = fittedPosterMetrics.paddingY;
        badgeGap = fittedPosterMetrics.gap;
      } else if (useBackdropBadgeLayout && cappedRatingBadges.length > 0) {
        let fittedBackdropMetrics: BadgeLayoutMetrics;
        if (useBackdropRightVerticalLayout) {
          const backdropColumnMaxWidth = Math.max(180, Math.floor(outputWidth * 0.28));
          fittedBackdropMetrics = fitPosterBadgeMetricsToWidth(
            rightRatingBadges.map((badge) => [badge]),
            backdropColumnMaxWidth + 24,
            {
              iconSize: badgeIconSize,
              fontSize: badgeFontSize,
              paddingX: badgePaddingX,
              paddingY: badgePaddingY,
              gap: badgeGap,
            },
            DEFAULT_BADGE_MIN_METRICS,
            false,
            false,
            ratingStyle
          );
          fittedBackdropMetrics = fitPosterBadgeMetricsToHeight(
            [rightRatingBadges],
            outputHeight,
            fittedBackdropMetrics,
            badgeTopOffset,
            badgeBottomOffset,
            DEFAULT_BADGE_MIN_METRICS,
            0,
            ratingStyle
          );
          const maxPerColumn = getMaxBadgeColumnCount(
            outputHeight,
            fittedBackdropMetrics,
            badgeTopOffset,
            badgeBottomOffset,
            0,
            ratingStyle
          );
          rightRatingBadges = rightRatingBadges.slice(0, maxPerColumn);
          cappedRatingBadges = [...rightRatingBadges];
        } else {
          const backdropRegion = getBackdropBadgeRegion(outputWidth, effectiveBackdropRatingsLayout);
          fittedBackdropMetrics = fitPosterBadgeMetricsToWidth(
            [topRatingBadges, bottomRatingBadges].filter((row) => row.length > 0),
            backdropRegion.width,
            {
              iconSize: badgeIconSize,
              fontSize: badgeFontSize,
              paddingX: badgePaddingX,
              paddingY: badgePaddingY,
              gap: badgeGap,
            },
            DEFAULT_BADGE_MIN_METRICS,
            false,
            false,
            ratingStyle
          );
        }
        badgeIconSize = fittedBackdropMetrics.iconSize;
        badgeFontSize = fittedBackdropMetrics.fontSize;
        badgePaddingX = fittedBackdropMetrics.paddingX;
        badgePaddingY = fittedBackdropMetrics.paddingY;
        badgeGap = fittedBackdropMetrics.gap;
      }

      const logoBadgesPerRow = useLogoBadgeLayout
        ? useBlockbusterPresentation
          ? Math.max(2, Math.min(4, Math.ceil(Math.sqrt(cappedRatingBadges.length || 1))))
          : Math.max(1, cappedRatingBadges.length)
        : 0;
      const logoBadgeRowWidth = useLogoBadgeLayout && cappedRatingBadges.length > 0
        ? chunkBy(cappedRatingBadges, Math.max(1, logoBadgesPerRow)).reduce((maxWidth, row) => {
            const rowWidth = measureBadgeRowWidth(row, {
              iconSize: badgeIconSize,
              fontSize: badgeFontSize,
              paddingX: badgePaddingX,
              paddingY: badgePaddingY,
              gap: badgeGap,
            }, false, ratingStyle);
            return Math.max(maxWidth, rowWidth);
          }, 0)
        : 0;
      const qualityBadges = useLogoBadgeLayout
        ? []
        : typeof qualityBadgesMax === 'number'
          ? streamBadges.slice(0, qualityBadgesMax)
          : streamBadges;
      const badgesForIcons = cappedRatingBadges;
      const logoNaturalWidth = useLogoBadgeLayout ? outputWidth : 0;
      const finalOutputWidth = useLogoBadgeLayout && logoBadgeRowWidth > 0
        ? Math.min(LOGO_MAX_WIDTH, Math.max(logoNaturalWidth, logoBadgeRowWidth + 72))
        : outputWidth;
      const logoImageWidth = useLogoBadgeLayout ? logoNaturalWidth : 0;
      const logoImageHeight = useLogoBadgeLayout ? outputHeight : 0;
      const logoBadgeRows =
        useLogoBadgeLayout && cappedRatingBadges.length > 0
          ? Math.ceil(cappedRatingBadges.length / Math.max(1, logoBadgesPerRow))
          : 0;
      const logoBadgeItemHeight = getBadgeHeightFromMetrics(
        {
          iconSize: badgeIconSize,
          fontSize: badgeFontSize,
          paddingX: badgePaddingX,
          paddingY: badgePaddingY,
          gap: badgeGap,
        },
        ratingStyle,
      );
      const estimatedLogoWidth = logoImageWidth;
      const logoBadgeContainerMaxWidth = Math.max(0, finalOutputWidth - 24);
      const logoBadgeMaxWidth = Math.min(
        logoBadgeContainerMaxWidth,
        Math.max(
          Math.min(520, logoBadgeContainerMaxWidth),
          Math.max(Math.round(estimatedLogoWidth * 1.18), logoBadgeRowWidth + 24)
        )
      );
      const logoBadgeBandHeight = useLogoBadgeLayout && cappedRatingBadges.length > 0
        ? Math.max(
            ratingStyle === 'stacked' ? 196 : 170,
            logoBadgeRows * logoBadgeItemHeight +
              Math.max(0, logoBadgeRows - 1) * badgeGap +
              (ratingStyle === 'stacked' ? 92 : 68)
          )
        : 0;
      const finalOutputHeight = useLogoBadgeLayout ? logoImageHeight + logoBadgeBandHeight : outputHeight;
      const renderedRatingCacheKeys = usesAggregatePresentation
        ? [...ratingBadgeByProvider.keys()]
        : displayRatingBadges.map((badge) => badge.key);
      const renderedRatingCacheTtlCandidates = [
        ...renderedRatingCacheKeys.map((badgeKey) => {
          if (badgeKey === 'tmdb') {
            return TMDB_CACHE_TTL_MS;
          }
          return renderedRatingTtlByProvider.get(badgeKey) || null;
        }),
        ...(certificationBadgeLabel ? [TMDB_CACHE_TTL_MS] : []),
        ...(streamBadges.length > 0 ? [streamBadgesCacheTtlMs ?? TORRENTIO_CACHE_TTL_MS] : []),
      ].filter((ttlMs): ttlMs is number => typeof ttlMs === 'number' && Number.isFinite(ttlMs) && ttlMs > 0);
      const finalImageCacheTtlMs =
        renderedRatingCacheTtlCandidates.length > 0
          ? Math.min(...renderedRatingCacheTtlCandidates)
          : TMDB_CACHE_TTL_MS;
      const responseCacheControl = `public, s-maxage=${Math.max(60, Math.floor(finalImageCacheTtlMs / 1000))}, stale-while-revalidate=60`;
      const renderedPayload = await renderWithSharp(
        {
          imageType,
          ratingPresentation,
          aggregateRatingSource,
          blockbusterDensity,
          outputFormat,
          imgUrl,
          outputWidth: finalOutputWidth,
          outputHeight: useLogoBadgeLayout ? logoImageHeight : outputHeight,
          imageWidth: useLogoBadgeLayout ? logoImageWidth : undefined,
          imageHeight: useLogoBadgeLayout ? logoImageHeight : undefined,
          finalOutputHeight,
          logoBadgeBandHeight,
          logoBadgeMaxWidth,
          logoBadgesPerRow,
          posterRowHorizontalInset,
          posterTitleText,
          posterLogoUrl,
          editorialOverlay,
          genreBadge,
          badgeIconSize,
          badgeFontSize,
          badgePaddingX,
          badgePaddingY,
          badgeGap,
          badgeTopOffset,
          badgeBottomOffset,
          badges: badgesForIcons,
          qualityBadges,
          qualityBadgesSide,
          posterQualityBadgesPosition,
          qualityBadgesStyle,
          qualityBadgeScalePercent,
          posterRatingsLayout: effectivePosterRatingsLayout,
          posterRatingsMaxPerSide: effectivePosterRatingsMaxPerSide,
          backdropRatingsLayout: effectiveBackdropRatingsLayout,
          sideRatingsPosition,
          sideRatingsOffset,
          ratingStyle,
          logoBackground,
          topBadges: topRatingBadges,
          bottomBadges: bottomRatingBadges,
          leftBadges: leftRatingBadges,
          rightBadges: rightRatingBadges,
          posterTopRows,
          posterBottomRows,
          backdropRows,
          blockbusterBlurbs,
          cacheControl: responseCacheControl,
        },
        phases
      );
      if (shouldCacheFinalImage) {
        try {
          await putCachedImageToObjectStorage(finalObjectStorageKey, renderedPayload);
        } catch {
        }
      }
      return renderedPayload;
    });

    const totalMs = performance.now() - requestStartedAt;
    const cacheStatus = objectStorageHit ? 'hit' : hadSharedRender ? 'shared' : 'miss';
    return createImageHttpResponse(
      renderedImage,
      buildServerTimingHeader(phases, totalMs),
      cacheStatus
    );
  } catch (e: any) {
    if (e instanceof HttpError) {
      return respond(e.message, e.status, e.headers);
    }
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ERDB] render failed', e);
    }
    const message = typeof e?.message === 'string' ? e.message : 'Unknown error';
    const normalizedMessage = message.toLowerCase();
    if (
      normalizedMessage.includes('fetch failed') ||
      normalizedMessage.includes('enotfound') ||
      normalizedMessage.includes('econnreset') ||
      normalizedMessage.includes('etimedout')
    ) {
      return respond('Upstream request failed. Check server outbound network and DNS to TMDB/MDBList.', 502);
    }
    const stack = process.env.NODE_ENV !== 'production' && typeof e?.stack === 'string' ? `\n${e.stack}` : '';
    return respond(`Error: ${message}${stack}`, 500);
  }
}
