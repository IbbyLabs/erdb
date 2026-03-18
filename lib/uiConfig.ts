import {
  DEFAULT_BACKDROP_RATING_LAYOUT,
  normalizeBackdropRatingLayout,
  type BackdropRatingLayout,
} from './backdropRatingLayout.ts';
import {
  DEFAULT_POSTER_RATINGS_MAX_PER_SIDE,
  isVerticalPosterRatingLayout,
  normalizePosterRatingLayout,
  normalizePosterRatingsMaxPerSide,
  type PosterRatingLayout,
} from './posterRatingLayout.ts';
import {
  DEFAULT_RATING_STYLE,
  normalizeRatingStyle,
  type RatingStyle,
} from './ratingStyle.ts';
import {
  normalizeRatingPreference,
  stringifyRatingPreferencesAllowEmpty,
  type RatingPreference,
} from './ratingPreferences.ts';

export const PROXY_TYPES = ['poster', 'backdrop', 'logo'] as const;

export type ProxyType = (typeof PROXY_TYPES)[number];
export type ProxyEnabledTypes = Record<ProxyType, boolean>;
export type StreamBadgesSetting = 'auto' | 'on' | 'off';
export type QualityBadgesSide = 'left' | 'right';
export type ImageTextPreference = 'original' | 'clean' | 'alternative';

export type SharedErdbSettings = {
  tmdbKey: string;
  mdblistKey: string;
  lang: string;
  posterImageText: ImageTextPreference;
  backdropImageText: ImageTextPreference;
  posterRatingPreferences: RatingPreference[];
  backdropRatingPreferences: RatingPreference[];
  logoRatingPreferences: RatingPreference[];
  posterStreamBadges: StreamBadgesSetting;
  backdropStreamBadges: StreamBadgesSetting;
  qualityBadgesSide: QualityBadgesSide;
  posterQualityBadgesStyle: RatingStyle;
  backdropQualityBadgesStyle: RatingStyle;
  posterRatingsLayout: PosterRatingLayout;
  backdropRatingsLayout: BackdropRatingLayout;
  posterRatingStyle: RatingStyle;
  backdropRatingStyle: RatingStyle;
  logoRatingStyle: RatingStyle;
  posterRatingsMaxPerSide: number | null;
};

export type SavedUiConfig = {
  version: 1;
  settings: SharedErdbSettings;
  proxy: {
    manifestUrl: string;
    enabledTypes: ProxyEnabledTypes;
  };
};

const DEFAULT_RATING_PREFERENCES: RatingPreference[] = ['imdb', 'tmdb', 'mdblist'];
const IMAGE_TEXT_PREFERENCE_SET = new Set<ImageTextPreference>(['original', 'clean', 'alternative']);
const STREAM_BADGES_SETTING_SET = new Set<StreamBadgesSetting>(['auto', 'on', 'off']);
const QUALITY_BADGES_SIDE_SET = new Set<QualityBadgesSide>(['left', 'right']);

export const createDefaultProxyEnabledTypes = (): ProxyEnabledTypes => ({
  poster: true,
  backdrop: true,
  logo: true,
});

export const createDefaultSharedErdbSettings = (): SharedErdbSettings => ({
  tmdbKey: '',
  mdblistKey: '',
  lang: 'en',
  posterImageText: 'clean',
  backdropImageText: 'clean',
  posterRatingPreferences: [...DEFAULT_RATING_PREFERENCES],
  backdropRatingPreferences: [...DEFAULT_RATING_PREFERENCES],
  logoRatingPreferences: [...DEFAULT_RATING_PREFERENCES],
  posterStreamBadges: 'auto',
  backdropStreamBadges: 'auto',
  qualityBadgesSide: 'left',
  posterQualityBadgesStyle: DEFAULT_RATING_STYLE,
  backdropQualityBadgesStyle: DEFAULT_RATING_STYLE,
  posterRatingsLayout: 'bottom',
  backdropRatingsLayout: DEFAULT_BACKDROP_RATING_LAYOUT,
  posterRatingStyle: DEFAULT_RATING_STYLE,
  backdropRatingStyle: DEFAULT_RATING_STYLE,
  logoRatingStyle: 'plain',
  posterRatingsMaxPerSide: DEFAULT_POSTER_RATINGS_MAX_PER_SIDE,
});

export const createDefaultSavedUiConfig = (): SavedUiConfig => ({
  version: 1,
  settings: createDefaultSharedErdbSettings(),
  proxy: {
    manifestUrl: '',
    enabledTypes: createDefaultProxyEnabledTypes(),
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

const normalizeImageTextPreference = (
  value: unknown,
  fallback: ImageTextPreference,
): ImageTextPreference => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return IMAGE_TEXT_PREFERENCE_SET.has(normalized as ImageTextPreference)
    ? (normalized as ImageTextPreference)
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

export const normalizeSharedErdbSettings = (value: unknown): SharedErdbSettings => {
  const defaults = createDefaultSharedErdbSettings();
  if (!value || typeof value !== 'object') {
    return defaults;
  }

  const candidate = value as Partial<Record<keyof SharedErdbSettings, unknown>>;

  return {
    tmdbKey: typeof candidate.tmdbKey === 'string' ? candidate.tmdbKey.trim() : defaults.tmdbKey,
    mdblistKey:
      typeof candidate.mdblistKey === 'string' ? candidate.mdblistKey.trim() : defaults.mdblistKey,
    lang: typeof candidate.lang === 'string' && candidate.lang.trim() ? candidate.lang.trim() : defaults.lang,
    posterImageText: normalizeImageTextPreference(candidate.posterImageText, defaults.posterImageText),
    backdropImageText: normalizeImageTextPreference(
      candidate.backdropImageText,
      defaults.backdropImageText,
    ),
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
    posterQualityBadgesStyle: normalizeRatingStyle(candidate.posterQualityBadgesStyle as string | null | undefined),
    backdropQualityBadgesStyle: normalizeRatingStyle(
      candidate.backdropQualityBadgesStyle as string | null | undefined,
    ),
    posterRatingsLayout: normalizePosterRatingLayout(candidate.posterRatingsLayout as string | null | undefined),
    backdropRatingsLayout: normalizeBackdropRatingLayout(
      candidate.backdropRatingsLayout as string | null | undefined,
    ),
    posterRatingStyle: normalizeRatingStyle(candidate.posterRatingStyle as string | null | undefined),
    backdropRatingStyle: normalizeRatingStyle(candidate.backdropRatingStyle as string | null | undefined),
    logoRatingStyle:
      candidate.logoRatingStyle === 'glass' ||
      candidate.logoRatingStyle === 'plain' ||
      candidate.logoRatingStyle === 'square'
        ? (candidate.logoRatingStyle as RatingStyle)
        : 'plain',
    posterRatingsMaxPerSide: normalizePosterRatingsMaxPerSide(candidate.posterRatingsMaxPerSide),
  };
};

export const normalizeProxyEnabledTypes = (value: unknown): ProxyEnabledTypes => {
  const defaults = createDefaultProxyEnabledTypes();
  if (!value || typeof value !== 'object') {
    return defaults;
  }

  const candidate = value as Partial<Record<ProxyType, unknown>>;
  return {
    poster: typeof candidate.poster === 'boolean' ? candidate.poster : defaults.poster,
    backdrop: typeof candidate.backdrop === 'boolean' ? candidate.backdrop : defaults.backdrop,
    logo: typeof candidate.logo === 'boolean' ? candidate.logo : defaults.logo,
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
      enabledTypes?: unknown;
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
      enabledTypes: normalizeProxyEnabledTypes(candidate.proxy?.enabledTypes),
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
  if (!tmdbKey || !mdblistKey) {
    return null;
  }

  const payload: Record<string, string | number> = {
    tmdbKey,
    mdblistKey,
  };

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
  if (settings.posterStreamBadges !== 'auto') {
    payload.posterStreamBadges = settings.posterStreamBadges;
  }
  if (settings.backdropStreamBadges !== 'auto') {
    payload.backdropStreamBadges = settings.backdropStreamBadges;
  }
  if (settings.posterRatingsLayout === 'top-bottom' && settings.qualityBadgesSide !== 'left') {
    payload.qualityBadgesSide = settings.qualityBadgesSide;
  }
  if (settings.posterQualityBadgesStyle !== DEFAULT_RATING_STYLE) {
    payload.posterQualityBadgesStyle = settings.posterQualityBadgesStyle;
  }
  if (settings.backdropQualityBadgesStyle !== DEFAULT_RATING_STYLE) {
    payload.backdropQualityBadgesStyle = settings.backdropQualityBadgesStyle;
  }

  payload.posterRatingStyle = settings.posterRatingStyle;
  payload.backdropRatingStyle = settings.backdropRatingStyle;
  payload.logoRatingStyle = settings.logoRatingStyle;
  payload.posterImageText = settings.posterImageText;
  payload.backdropImageText = settings.backdropImageText;
  payload.posterRatingsLayout = settings.posterRatingsLayout;

  if (
    isVerticalPosterRatingLayout(settings.posterRatingsLayout) &&
    settings.posterRatingsMaxPerSide !== null
  ) {
    payload.posterRatingsMaxPerSide = settings.posterRatingsMaxPerSide;
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
  manifestUrl: string,
  settings: SharedErdbSettings,
  enabledTypes: ProxyEnabledTypes,
) => {
  const origin = normalizeBaseUrl(baseUrl);
  const normalizedManifestUrl = normalizeManifestUrl(manifestUrl);
  const sharedPayload = buildSharedPayload(settings);
  if (!origin || !normalizedManifestUrl || isBareHttpUrl(normalizedManifestUrl) || !sharedPayload) {
    return null;
  }

  return {
    url: normalizedManifestUrl,
    ...sharedPayload,
    posterEnabled: enabledTypes.poster,
    backdropEnabled: enabledTypes.backdrop,
    logoEnabled: enabledTypes.logo,
    erdbBase: origin,
  };
};

export const buildProxyUrl = (
  baseUrl: string,
  manifestUrl: string,
  settings: SharedErdbSettings,
  enabledTypes: ProxyEnabledTypes,
) => {
  const origin = normalizeBaseUrl(baseUrl);
  const payload = buildProxyPayload(baseUrl, manifestUrl, settings, enabledTypes);
  if (!origin || !payload) {
    return '';
  }

  return `${origin}/proxy/${encodeBase64Url(JSON.stringify(payload))}/manifest.json`;
};
