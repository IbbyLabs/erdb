import {
  DEFAULT_BACKDROP_RATING_LAYOUT,
  normalizeBackdropRatingLayout,
  type BackdropRatingLayout,
} from './backdropRatingLayout.ts';
import {
  DEFAULT_POSTER_RATINGS_MAX_PER_SIDE,
  POSTER_RATINGS_MAX_PER_SIDE_MIN,
  isVerticalPosterRatingLayout,
  normalizePosterRatingLayout,
  normalizePosterRatingsMaxPerSide,
  type PosterRatingLayout,
} from './posterRatingLayout.ts';
import {
  DEFAULT_QUALITY_BADGES_STYLE,
  DEFAULT_RATING_STYLE,
  normalizeQualityBadgeStyle,
  normalizeRatingStyle,
  type QualityBadgeStyle,
  type RatingStyle,
} from './ratingStyle.ts';
import {
  DEFAULT_AGGREGATE_RATING_SOURCE,
  DEFAULT_RATING_PRESENTATION,
  normalizeAggregateRatingSource,
  normalizeRatingPresentation,
  type AggregateRatingSource,
  type RatingPresentation,
} from './ratingPresentation.ts';
import {
  normalizeRatingPreference,
  stringifyRatingPreferencesAllowEmpty,
  type RatingPreference,
  ALL_RATING_PREFERENCES,
} from './ratingPreferences.ts';
import {
  DEFAULT_METADATA_TRANSLATION_MODE,
  normalizeMetadataTranslationMode,
  type MetadataTranslationMode,
} from './metadataTranslation.ts';
import {
  DEFAULT_GENRE_BADGE_MODE,
  normalizeGenreBadgeMode,
  type GenreBadgeMode,
} from './genreBadge.ts';
import {
  DEFAULT_BADGE_SCALE_PERCENT,
  DEFAULT_QUALITY_BADGE_PREFERENCES,
  encodeRatingProviderAppearanceOverrides,
  normalizeBadgeScalePercent,
  normalizeQualityBadgePreferencesList,
  normalizeRatingProviderAppearanceOverrides,
  stringifyQualityBadgePreferencesAllowEmpty,
  type RatingProviderAppearanceOverrides,
} from './badgeCustomization.ts';
import type { MediaFeatureBadgeKey } from './mediaFeatures.ts';
import {
  DEFAULT_SIDE_RATING_OFFSET,
  DEFAULT_SIDE_RATING_POSITION,
  normalizeSideRatingOffset,
  normalizeSideRatingPosition,
  type SideRatingPosition,
} from './sideRatingPosition.ts';
export type StreamBadgesSetting = 'auto' | 'on' | 'off';
export type QualityBadgesSide = 'left' | 'right';
export type PosterQualityBadgesPosition = 'auto' | QualityBadgesSide;
export type PosterImageTextPreference = 'original' | 'clean' | 'alternative';
export type BackdropImageTextPreference = 'original' | 'clean' | 'alternative';
export type ArtworkSource = 'tmdb' | 'fanart';
export type LogoBackground = 'transparent' | 'dark';

export type SharedErdbSettings = {
  tmdbKey: string;
  mdblistKey: string;
  fanartKey: string;
  lang: string;
  posterImageText: PosterImageTextPreference;
  backdropImageText: BackdropImageTextPreference;
  posterArtworkSource: ArtworkSource;
  backdropArtworkSource: ArtworkSource;
  logoArtworkSource: ArtworkSource;
  genreBadgeMode: GenreBadgeMode;
  posterRatingPreferences: RatingPreference[];
  backdropRatingPreferences: RatingPreference[];
  logoRatingPreferences: RatingPreference[];
  posterStreamBadges: StreamBadgesSetting;
  backdropStreamBadges: StreamBadgesSetting;
  qualityBadgesSide: QualityBadgesSide;
  posterQualityBadgesPosition: PosterQualityBadgesPosition;
  posterQualityBadgePreferences: MediaFeatureBadgeKey[];
  backdropQualityBadgePreferences: MediaFeatureBadgeKey[];
  posterQualityBadgesStyle: QualityBadgeStyle;
  backdropQualityBadgesStyle: QualityBadgeStyle;
  posterQualityBadgesMax: number | null;
  backdropQualityBadgesMax: number | null;
  posterRatingsLayout: PosterRatingLayout;
  backdropRatingsLayout: BackdropRatingLayout;
  posterRatingsMax: number | null;
  backdropRatingsMax: number | null;
  posterRatingStyle: RatingStyle;
  backdropRatingStyle: RatingStyle;
  logoRatingStyle: RatingStyle;
  posterRatingBadgeScale: number;
  backdropRatingBadgeScale: number;
  logoRatingBadgeScale: number;
  posterQualityBadgeScale: number;
  backdropQualityBadgeScale: number;
  posterRatingPresentation: RatingPresentation;
  backdropRatingPresentation: RatingPresentation;
  logoRatingPresentation: RatingPresentation;
  posterAggregateRatingSource: AggregateRatingSource;
  backdropAggregateRatingSource: AggregateRatingSource;
  logoAggregateRatingSource: AggregateRatingSource;
  posterRatingsMaxPerSide: number | null;
  sideRatingsPosition: SideRatingPosition;
  sideRatingsOffset: number;
  logoRatingsMax: number | null;
  logoBackground: LogoBackground;
  ratingProviderAppearanceOverrides: RatingProviderAppearanceOverrides;
};

export type SavedUiConfig = {
  version: 1;
  settings: SharedErdbSettings;
  proxy: SavedProxySettings;
};

export type SavedProxySettings = {
  manifestUrl: string;
  translateMeta: boolean;
  translateMetaMode: MetadataTranslationMode;
  debugMetaTranslation: boolean;
};

const DEFAULT_RATING_PREFERENCES: RatingPreference[] = [...ALL_RATING_PREFERENCES];
const POSTER_IMAGE_TEXT_PREFERENCE_SET = new Set<PosterImageTextPreference>([
  'original',
  'clean',
  'alternative',
]);
const BACKDROP_IMAGE_TEXT_PREFERENCE_SET = new Set<BackdropImageTextPreference>([
  'original',
  'clean',
  'alternative',
]);
const ARTWORK_SOURCE_SET = new Set<ArtworkSource>(['tmdb', 'fanart']);
const STREAM_BADGES_SETTING_SET = new Set<StreamBadgesSetting>(['auto', 'on', 'off']);
const QUALITY_BADGES_SIDE_SET = new Set<QualityBadgesSide>(['left', 'right']);
const POSTER_QUALITY_BADGES_POSITION_SET = new Set<PosterQualityBadgesPosition>(['auto', 'left', 'right']);
const LOGO_BACKGROUND_SET = new Set<LogoBackground>(['transparent', 'dark']);

const normalizeBoolean = (value: unknown, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return fallback;
    if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
  }
  return fallback;
};

export const createDefaultSharedErdbSettings = (): SharedErdbSettings => ({
  tmdbKey: '',
  mdblistKey: '',
  fanartKey: '',
  lang: 'en',
  posterImageText: 'clean',
  backdropImageText: 'clean',
  posterArtworkSource: 'tmdb',
  backdropArtworkSource: 'tmdb',
  logoArtworkSource: 'tmdb',
  genreBadgeMode: DEFAULT_GENRE_BADGE_MODE,
  posterRatingPreferences: [...DEFAULT_RATING_PREFERENCES],
  backdropRatingPreferences: [...DEFAULT_RATING_PREFERENCES],
  logoRatingPreferences: [...DEFAULT_RATING_PREFERENCES],
  posterStreamBadges: 'auto',
  backdropStreamBadges: 'auto',
  qualityBadgesSide: 'left',
  posterQualityBadgesPosition: 'auto',
  posterQualityBadgePreferences: [...DEFAULT_QUALITY_BADGE_PREFERENCES],
  backdropQualityBadgePreferences: [...DEFAULT_QUALITY_BADGE_PREFERENCES],
  posterQualityBadgesStyle: DEFAULT_QUALITY_BADGES_STYLE,
  backdropQualityBadgesStyle: DEFAULT_QUALITY_BADGES_STYLE,
  posterQualityBadgesMax: null,
  backdropQualityBadgesMax: null,
  posterRatingsLayout: 'bottom',
  backdropRatingsLayout: DEFAULT_BACKDROP_RATING_LAYOUT,
  posterRatingsMax: null,
  backdropRatingsMax: null,
  posterRatingStyle: DEFAULT_RATING_STYLE,
  backdropRatingStyle: DEFAULT_RATING_STYLE,
  logoRatingStyle: 'plain',
  posterRatingBadgeScale: DEFAULT_BADGE_SCALE_PERCENT,
  backdropRatingBadgeScale: DEFAULT_BADGE_SCALE_PERCENT,
  logoRatingBadgeScale: DEFAULT_BADGE_SCALE_PERCENT,
  posterQualityBadgeScale: DEFAULT_BADGE_SCALE_PERCENT,
  backdropQualityBadgeScale: DEFAULT_BADGE_SCALE_PERCENT,
  posterRatingPresentation: DEFAULT_RATING_PRESENTATION,
  backdropRatingPresentation: DEFAULT_RATING_PRESENTATION,
  logoRatingPresentation: DEFAULT_RATING_PRESENTATION,
  posterAggregateRatingSource: DEFAULT_AGGREGATE_RATING_SOURCE,
  backdropAggregateRatingSource: DEFAULT_AGGREGATE_RATING_SOURCE,
  logoAggregateRatingSource: DEFAULT_AGGREGATE_RATING_SOURCE,
  posterRatingsMaxPerSide: DEFAULT_POSTER_RATINGS_MAX_PER_SIDE,
  sideRatingsPosition: DEFAULT_SIDE_RATING_POSITION,
  sideRatingsOffset: DEFAULT_SIDE_RATING_OFFSET,
  logoRatingsMax: null,
  logoBackground: 'transparent',
  ratingProviderAppearanceOverrides: {},
});

export const createDefaultSavedUiConfig = (): SavedUiConfig => ({
  version: 1,
  settings: createDefaultSharedErdbSettings(),
  proxy: {
    manifestUrl: '',
    translateMeta: false,
    translateMetaMode: DEFAULT_METADATA_TRANSLATION_MODE,
    debugMetaTranslation: false,
  },
});

export const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, '');

export const normalizeManifestUrl = (value: string, allowBareScheme = false) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  if (!lower.startsWith('stremio://')) {
    return trimmed;
  }

  const withoutScheme = trimmed.slice('stremio://'.length);
  if (!withoutScheme) return allowBareScheme ? 'https://' : '';
  if (/^https?:\/\//i.test(withoutScheme)) {
    return withoutScheme;
  }
  return `https://${withoutScheme}`;
};

export const isBareHttpUrl = (value: string) => value === 'http://' || value === 'https://';

export const encodeBase64Url = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  if (typeof window === 'undefined' && typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64url');
  }

  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const decodeBase64Url = (value: string) => {
  if (typeof window === 'undefined' && typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'base64url').toString('utf8');
  }

  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4;
  const padded = padding ? normalized + '='.repeat(4 - padding) : normalized;
  return new TextDecoder().decode(
    Uint8Array.from(atob(padded), (char) => char.charCodeAt(0)),
  );
};

const normalizePosterImageTextPreference = (
  value: unknown,
  fallback: PosterImageTextPreference,
): PosterImageTextPreference => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return POSTER_IMAGE_TEXT_PREFERENCE_SET.has(normalized as PosterImageTextPreference)
    ? (normalized as PosterImageTextPreference)
    : fallback;
};

const normalizeBackdropImageTextPreference = (
  value: unknown,
  fallback: BackdropImageTextPreference,
): BackdropImageTextPreference => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return BACKDROP_IMAGE_TEXT_PREFERENCE_SET.has(normalized as BackdropImageTextPreference)
    ? (normalized as BackdropImageTextPreference)
    : fallback;
};

const normalizeArtworkSource = (
  value: unknown,
  fallback: ArtworkSource,
): ArtworkSource => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return ARTWORK_SOURCE_SET.has(normalized as ArtworkSource)
    ? (normalized as ArtworkSource)
    : fallback;
};

const normalizeStreamBadgesSetting = (
  value: unknown,
  fallback: StreamBadgesSetting,
): StreamBadgesSetting => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return STREAM_BADGES_SETTING_SET.has(normalized as StreamBadgesSetting)
    ? (normalized as StreamBadgesSetting)
    : fallback;
};

const normalizeQualityBadgesSide = (
  value: unknown,
  fallback: QualityBadgesSide,
): QualityBadgesSide => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return QUALITY_BADGES_SIDE_SET.has(normalized as QualityBadgesSide)
    ? (normalized as QualityBadgesSide)
    : fallback;
};

const normalizePosterQualityBadgesPosition = (
  value: unknown,
  fallback: PosterQualityBadgesPosition,
): PosterQualityBadgesPosition => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return POSTER_QUALITY_BADGES_POSITION_SET.has(normalized as PosterQualityBadgesPosition)
    ? (normalized as PosterQualityBadgesPosition)
    : fallback;
};

const normalizeRatingPreferencesList = (
  value: unknown,
  fallback: RatingPreference[],
): RatingPreference[] => {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const normalized = value
    .map((item) => (typeof item === 'string' ? normalizeRatingPreference(item) : null))
    .filter((item): item is RatingPreference => item !== null);

  return [...new Set(normalized)];
};

const normalizeOptionalBadgeCount = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const numericValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value.trim())
        : Number.NaN;
  if (!Number.isFinite(numericValue)) return null;
  const normalized = Math.trunc(numericValue);
  if (normalized < POSTER_RATINGS_MAX_PER_SIDE_MIN) return null;
  return normalized;
};

const normalizeLogoBackground = (
  value: unknown,
  fallback: LogoBackground,
): LogoBackground => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return LOGO_BACKGROUND_SET.has(normalized as LogoBackground)
    ? (normalized as LogoBackground)
    : fallback;
};

export const normalizeSharedErdbSettings = (value: unknown): SharedErdbSettings => {
  const defaults = createDefaultSharedErdbSettings();
  if (!value || typeof value !== 'object') {
    return defaults;
  }

  const candidate = value as Partial<Record<keyof SharedErdbSettings, unknown>> & Record<string, unknown>;
  const rawPosterImageText =
    typeof candidate.posterImageText === 'string' ? candidate.posterImageText.trim().toLowerCase() : '';
  const rawBackdropImageText =
    typeof candidate.backdropImageText === 'string' ? candidate.backdropImageText.trim().toLowerCase() : '';
  const legacyFanartPosterMode = rawPosterImageText === 'fanartclean';
  const legacyFanartBackdropMode = rawBackdropImageText === 'fanartclean';
  const posterImageText = legacyFanartPosterMode
    ? 'clean'
    : normalizePosterImageTextPreference(candidate.posterImageText, defaults.posterImageText);
  const backdropImageText = legacyFanartBackdropMode
    ? 'clean'
    : normalizeBackdropImageTextPreference(candidate.backdropImageText, defaults.backdropImageText);
  const posterArtworkSource = legacyFanartPosterMode
    ? 'fanart'
    : normalizeArtworkSource(
        candidate.posterArtworkSource ?? candidate.posterCleanSource,
        defaults.posterArtworkSource
      );
  const backdropArtworkSource = legacyFanartBackdropMode
    ? 'fanart'
    : normalizeArtworkSource(
        candidate.backdropArtworkSource ?? candidate.backdropCleanSource,
        defaults.backdropArtworkSource
      );

  return {
    tmdbKey: typeof candidate.tmdbKey === 'string' ? candidate.tmdbKey.trim() : defaults.tmdbKey,
    mdblistKey:
      typeof candidate.mdblistKey === 'string' ? candidate.mdblistKey.trim() : defaults.mdblistKey,
    fanartKey:
      typeof candidate.fanartKey === 'string' ? candidate.fanartKey.trim() : defaults.fanartKey,
    lang: typeof candidate.lang === 'string' && candidate.lang.trim() ? candidate.lang.trim() : defaults.lang,
    posterImageText,
    backdropImageText,
    posterArtworkSource,
    backdropArtworkSource,
    logoArtworkSource: normalizeArtworkSource(
      candidate.logoArtworkSource ?? candidate.logoSource,
      defaults.logoArtworkSource
    ),
    genreBadgeMode: normalizeGenreBadgeMode(candidate.genreBadgeMode, defaults.genreBadgeMode),
    posterRatingPreferences: normalizeRatingPreferencesList(
      candidate.posterRatingPreferences,
      defaults.posterRatingPreferences,
    ),
    backdropRatingPreferences: normalizeRatingPreferencesList(
      candidate.backdropRatingPreferences,
      defaults.backdropRatingPreferences,
    ),
    logoRatingPreferences: normalizeRatingPreferencesList(
      candidate.logoRatingPreferences,
      defaults.logoRatingPreferences,
    ),
    posterStreamBadges: normalizeStreamBadgesSetting(
      candidate.posterStreamBadges,
      defaults.posterStreamBadges,
    ),
    backdropStreamBadges: normalizeStreamBadgesSetting(
      candidate.backdropStreamBadges,
      defaults.backdropStreamBadges,
    ),
    qualityBadgesSide: normalizeQualityBadgesSide(
      candidate.qualityBadgesSide,
      defaults.qualityBadgesSide,
    ),
    posterQualityBadgesPosition: normalizePosterQualityBadgesPosition(
      candidate.posterQualityBadgesPosition,
      defaults.posterQualityBadgesPosition,
    ),
    posterQualityBadgePreferences: normalizeQualityBadgePreferencesList(
      candidate.posterQualityBadgePreferences,
      defaults.posterQualityBadgePreferences,
    ),
    backdropQualityBadgePreferences: normalizeQualityBadgePreferencesList(
      candidate.backdropQualityBadgePreferences,
      defaults.backdropQualityBadgePreferences,
    ),
    posterQualityBadgesStyle: normalizeQualityBadgeStyle(
      candidate.posterQualityBadgesStyle as string | null | undefined,
    ),
    backdropQualityBadgesStyle: normalizeQualityBadgeStyle(
      candidate.backdropQualityBadgesStyle as string | null | undefined,
    ),
    posterQualityBadgesMax: normalizeOptionalBadgeCount(candidate.posterQualityBadgesMax),
    backdropQualityBadgesMax: normalizeOptionalBadgeCount(candidate.backdropQualityBadgesMax),
    posterRatingsLayout: normalizePosterRatingLayout(candidate.posterRatingsLayout as string | null | undefined),
    backdropRatingsLayout: normalizeBackdropRatingLayout(
      candidate.backdropRatingsLayout as string | null | undefined,
    ),
    posterRatingsMax: normalizeOptionalBadgeCount(candidate.posterRatingsMax),
    backdropRatingsMax: normalizeOptionalBadgeCount(candidate.backdropRatingsMax),
    posterRatingStyle: normalizeRatingStyle(candidate.posterRatingStyle as string | null | undefined),
    backdropRatingStyle: normalizeRatingStyle(candidate.backdropRatingStyle as string | null | undefined),
    posterRatingPresentation: normalizeRatingPresentation(
      candidate.posterRatingPresentation,
      defaults.posterRatingPresentation,
    ),
    backdropRatingPresentation: normalizeRatingPresentation(
      candidate.backdropRatingPresentation,
      defaults.backdropRatingPresentation,
    ),
    logoRatingPresentation: normalizeRatingPresentation(
      candidate.logoRatingPresentation,
      defaults.logoRatingPresentation,
    ),
    posterAggregateRatingSource: normalizeAggregateRatingSource(
      candidate.posterAggregateRatingSource,
      defaults.posterAggregateRatingSource,
    ),
    backdropAggregateRatingSource: normalizeAggregateRatingSource(
      candidate.backdropAggregateRatingSource,
      defaults.backdropAggregateRatingSource,
    ),
    logoAggregateRatingSource: normalizeAggregateRatingSource(
      candidate.logoAggregateRatingSource,
      defaults.logoAggregateRatingSource,
    ),
    logoRatingStyle:
      candidate.logoRatingStyle === 'glass' ||
      candidate.logoRatingStyle === 'plain' ||
      candidate.logoRatingStyle === 'square'
        ? (candidate.logoRatingStyle as RatingStyle)
        : 'plain',
    posterRatingBadgeScale: normalizeBadgeScalePercent(
      candidate.posterRatingBadgeScale,
      defaults.posterRatingBadgeScale,
    ),
    backdropRatingBadgeScale: normalizeBadgeScalePercent(
      candidate.backdropRatingBadgeScale,
      defaults.backdropRatingBadgeScale,
    ),
    logoRatingBadgeScale: normalizeBadgeScalePercent(
      candidate.logoRatingBadgeScale,
      defaults.logoRatingBadgeScale,
    ),
    posterQualityBadgeScale: normalizeBadgeScalePercent(
      candidate.posterQualityBadgeScale,
      defaults.posterQualityBadgeScale,
    ),
    backdropQualityBadgeScale: normalizeBadgeScalePercent(
      candidate.backdropQualityBadgeScale,
      defaults.backdropQualityBadgeScale,
    ),
    posterRatingsMaxPerSide: normalizePosterRatingsMaxPerSide(candidate.posterRatingsMaxPerSide),
    sideRatingsPosition: normalizeSideRatingPosition(candidate.sideRatingsPosition),
    sideRatingsOffset: normalizeSideRatingOffset(candidate.sideRatingsOffset),
    logoRatingsMax: normalizeOptionalBadgeCount(candidate.logoRatingsMax),
    logoBackground: normalizeLogoBackground(candidate.logoBackground, defaults.logoBackground),
    ratingProviderAppearanceOverrides: normalizeRatingProviderAppearanceOverrides(
      candidate.ratingProviderAppearanceOverrides,
    ),
  };
};

export const normalizeSavedUiConfig = (value: unknown): SavedUiConfig => {
  const defaults = createDefaultSavedUiConfig();
  if (!value || typeof value !== 'object') {
    return defaults;
  }

  const candidate = value as {
    settings?: unknown;
    proxy?: {
      manifestUrl?: unknown;
      translateMeta?: unknown;
      translateMetaMode?: unknown;
      debugMetaTranslation?: unknown;
    };
  };

  return {
    version: 1,
    settings: normalizeSharedErdbSettings(candidate.settings),
    proxy: {
      manifestUrl:
        typeof candidate.proxy?.manifestUrl === 'string'
          ? normalizeManifestUrl(candidate.proxy.manifestUrl, true)
          : defaults.proxy.manifestUrl,
      translateMeta: normalizeBoolean(candidate.proxy?.translateMeta, defaults.proxy.translateMeta),
      translateMetaMode: normalizeMetadataTranslationMode(
        candidate.proxy?.translateMetaMode,
        defaults.proxy.translateMetaMode,
      ),
      debugMetaTranslation: normalizeBoolean(
        candidate.proxy?.debugMetaTranslation,
        defaults.proxy.debugMetaTranslation,
      ),
    },
  };
};

export const parseSavedUiConfig = (raw: string): SavedUiConfig | null => {
  try {
    return normalizeSavedUiConfig(JSON.parse(raw));
  } catch {
    return null;
  }
};

export const serializeSavedUiConfig = (config: SavedUiConfig) =>
  JSON.stringify(normalizeSavedUiConfig(config), null, 2);

const buildSharedPayload = (settings: SharedErdbSettings) => {
  const tmdbKey = settings.tmdbKey.trim();
  const mdblistKey = settings.mdblistKey.trim();
  const fanartKey = settings.fanartKey.trim();
  if (!tmdbKey || !mdblistKey) {
    return null;
  }

  const payload: Record<string, string | number> = {
    tmdbKey,
    mdblistKey,
  };
  if (fanartKey) {
    payload.fanartKey = fanartKey;
  }

  const posterRatings = stringifyRatingPreferencesAllowEmpty(settings.posterRatingPreferences);
  const backdropRatings = stringifyRatingPreferencesAllowEmpty(settings.backdropRatingPreferences);
  const logoRatings = stringifyRatingPreferencesAllowEmpty(settings.logoRatingPreferences);
  const ratingsMatch = posterRatings === backdropRatings && posterRatings === logoRatings;

  if (ratingsMatch) {
    payload.ratings = posterRatings;
  } else {
    payload.posterRatings = posterRatings;
    payload.backdropRatings = backdropRatings;
    payload.logoRatings = logoRatings;
  }

  if (settings.lang) {
    payload.lang = settings.lang;
  }
  if (settings.genreBadgeMode !== DEFAULT_GENRE_BADGE_MODE) {
    payload.genreBadge = settings.genreBadgeMode;
  }
  if (settings.posterStreamBadges !== 'auto') {
    payload.posterStreamBadges = settings.posterStreamBadges;
  }
  if (settings.backdropStreamBadges !== 'auto') {
    payload.backdropStreamBadges = settings.backdropStreamBadges;
  }
  if (settings.posterRatingsLayout === 'top-bottom' && settings.qualityBadgesSide !== 'left') {
    payload.qualityBadgesSide = settings.qualityBadgesSide;
  }
  if (
    (settings.posterRatingsLayout === 'top' || settings.posterRatingsLayout === 'bottom') &&
    settings.posterQualityBadgesPosition !== 'auto'
  ) {
    payload.posterQualityBadgesPosition = settings.posterQualityBadgesPosition;
  }
  const posterQualityBadges = stringifyQualityBadgePreferencesAllowEmpty(
    settings.posterQualityBadgePreferences,
  );
  const backdropQualityBadges = stringifyQualityBadgePreferencesAllowEmpty(
    settings.backdropQualityBadgePreferences,
  );
  if (
    posterQualityBadges !==
    stringifyQualityBadgePreferencesAllowEmpty(DEFAULT_QUALITY_BADGE_PREFERENCES)
  ) {
    payload.posterQualityBadges = posterQualityBadges;
  }
  if (
    backdropQualityBadges !==
    stringifyQualityBadgePreferencesAllowEmpty(DEFAULT_QUALITY_BADGE_PREFERENCES)
  ) {
    payload.backdropQualityBadges = backdropQualityBadges;
  }
  if (settings.posterQualityBadgesStyle !== DEFAULT_QUALITY_BADGES_STYLE) {
    payload.posterQualityBadgesStyle = settings.posterQualityBadgesStyle;
  }
  if (settings.backdropQualityBadgesStyle !== DEFAULT_QUALITY_BADGES_STYLE) {
    payload.backdropQualityBadgesStyle = settings.backdropQualityBadgesStyle;
  }
  if (settings.posterQualityBadgesMax !== null) {
    payload.posterQualityBadgesMax = settings.posterQualityBadgesMax;
  }
  if (settings.backdropQualityBadgesMax !== null) {
    payload.backdropQualityBadgesMax = settings.backdropQualityBadgesMax;
  }
  if (settings.posterRatingsMax !== null) {
    payload.posterRatingsMax = settings.posterRatingsMax;
  }
  if (settings.backdropRatingsMax !== null) {
    payload.backdropRatingsMax = settings.backdropRatingsMax;
  }

  payload.posterRatingStyle = settings.posterRatingStyle;
  payload.backdropRatingStyle = settings.backdropRatingStyle;
  payload.logoRatingStyle = settings.logoRatingStyle;
  if (settings.posterRatingBadgeScale !== DEFAULT_BADGE_SCALE_PERCENT) {
    payload.posterRatingBadgeScale = settings.posterRatingBadgeScale;
  }
  if (settings.backdropRatingBadgeScale !== DEFAULT_BADGE_SCALE_PERCENT) {
    payload.backdropRatingBadgeScale = settings.backdropRatingBadgeScale;
  }
  if (settings.logoRatingBadgeScale !== DEFAULT_BADGE_SCALE_PERCENT) {
    payload.logoRatingBadgeScale = settings.logoRatingBadgeScale;
  }
  if (settings.posterQualityBadgeScale !== DEFAULT_BADGE_SCALE_PERCENT) {
    payload.posterQualityBadgeScale = settings.posterQualityBadgeScale;
  }
  if (settings.backdropQualityBadgeScale !== DEFAULT_BADGE_SCALE_PERCENT) {
    payload.backdropQualityBadgeScale = settings.backdropQualityBadgeScale;
  }
  payload.posterImageText = settings.posterImageText;
  payload.backdropImageText = settings.backdropImageText;
  if (settings.posterArtworkSource !== 'tmdb') {
    payload.posterArtworkSource = settings.posterArtworkSource;
  }
  if (settings.backdropArtworkSource !== 'tmdb') {
    payload.backdropArtworkSource = settings.backdropArtworkSource;
  }
  if (settings.logoArtworkSource !== 'tmdb') {
    payload.logoArtworkSource = settings.logoArtworkSource;
  }
  payload.posterRatingsLayout = settings.posterRatingsLayout;
  if (settings.posterRatingPresentation !== DEFAULT_RATING_PRESENTATION) {
    payload.posterRatingPresentation = settings.posterRatingPresentation;
  }
  if (settings.backdropRatingPresentation !== DEFAULT_RATING_PRESENTATION) {
    payload.backdropRatingPresentation = settings.backdropRatingPresentation;
  }
  if (settings.logoRatingPresentation !== DEFAULT_RATING_PRESENTATION) {
    payload.logoRatingPresentation = settings.logoRatingPresentation;
  }
  if (settings.posterAggregateRatingSource !== DEFAULT_AGGREGATE_RATING_SOURCE) {
    payload.posterAggregateRatingSource = settings.posterAggregateRatingSource;
  }
  if (settings.backdropAggregateRatingSource !== DEFAULT_AGGREGATE_RATING_SOURCE) {
    payload.backdropAggregateRatingSource = settings.backdropAggregateRatingSource;
  }
  if (settings.logoAggregateRatingSource !== DEFAULT_AGGREGATE_RATING_SOURCE) {
    payload.logoAggregateRatingSource = settings.logoAggregateRatingSource;
  }

  if (
    isVerticalPosterRatingLayout(settings.posterRatingsLayout) &&
    settings.posterRatingsMaxPerSide !== null
  ) {
    payload.posterRatingsMaxPerSide = settings.posterRatingsMaxPerSide;
  }
  if (settings.sideRatingsPosition !== DEFAULT_SIDE_RATING_POSITION) {
    payload.sideRatingsPosition = settings.sideRatingsPosition;
    if (settings.sideRatingsPosition === 'custom') {
      payload.sideRatingsOffset = settings.sideRatingsOffset;
    }
  }
  if (settings.logoRatingsMax !== null) {
    payload.logoRatingsMax = settings.logoRatingsMax;
  }
  if (settings.logoBackground !== 'transparent') {
    payload.logoBackground = settings.logoBackground;
  }
  const providerAppearance = encodeRatingProviderAppearanceOverrides(
    settings.ratingProviderAppearanceOverrides,
  );
  if (providerAppearance) {
    payload.providerAppearance = providerAppearance;
  }

  payload.backdropRatingsLayout = settings.backdropRatingsLayout;

  return payload;
};

export const buildConfigPayload = (baseUrl: string, settings: SharedErdbSettings) => {
  const origin = normalizeBaseUrl(baseUrl);
  const sharedPayload = buildSharedPayload(settings);
  if (!origin || !sharedPayload) {
    return null;
  }

  return {
    baseUrl: origin,
    ...sharedPayload,
  };
};

export const buildConfigString = (baseUrl: string, settings: SharedErdbSettings) => {
  const payload = buildConfigPayload(baseUrl, settings);
  if (!payload) {
    return '';
  }
  return encodeBase64Url(JSON.stringify(payload));
};

export const buildProxyPayload = (
  baseUrl: string,
  proxy: SavedProxySettings,
  settings: SharedErdbSettings,
) => {
  const origin = normalizeBaseUrl(baseUrl);
  const normalizedManifestUrl = normalizeManifestUrl(proxy.manifestUrl);
  const sharedPayload = buildSharedPayload(settings);
  if (!origin || !normalizedManifestUrl || isBareHttpUrl(normalizedManifestUrl) || !sharedPayload) {
    return null;
  }

  const payload: Record<string, string | number | boolean> = {
    url: normalizedManifestUrl,
    ...sharedPayload,
    erdbBase: origin,
  };

  if (proxy.translateMeta) {
    payload.translateMeta = true;
    payload.translateMetaMode = normalizeMetadataTranslationMode(
      proxy.translateMetaMode,
      DEFAULT_METADATA_TRANSLATION_MODE,
    );
    if (proxy.debugMetaTranslation) {
      payload.debugMetaTranslation = true;
    }
  }

  return payload;
};

export const buildProxyUrl = (
  baseUrl: string,
  proxy: SavedProxySettings,
  settings: SharedErdbSettings,
) => {
  const origin = normalizeBaseUrl(baseUrl);
  const payload = buildProxyPayload(baseUrl, proxy, settings);
  if (!origin || !payload) {
    return '';
  }

  return `${origin}/proxy/${encodeBase64Url(JSON.stringify(payload))}/manifest.json`;
};
