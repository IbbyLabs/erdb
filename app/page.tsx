'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import packageJson from '@/package.json';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { Image as ImageIcon, Settings2, Globe2, Layers, Cpu, Code2, Terminal, ExternalLink, Zap, ChevronRight, Hash, Sparkles, MonitorPlay, Bot, Clipboard, Check, Eye, EyeOff, Tag, Menu, X } from 'lucide-react';
import {
  ALL_RATING_PREFERENCES,
  RATING_PROVIDER_OPTIONS,
  stringifyRatingPreferencesAllowEmpty,
  type RatingPreference,
} from '@/lib/ratingPreferences';
import {
  DEFAULT_BADGE_SCALE_PERCENT,
  DEFAULT_PROVIDER_ICON_SCALE_PERCENT,
  DEFAULT_STACKED_ACCENT_MODE,
  DEFAULT_STACKED_ELEMENT_OFFSET_PX,
  DEFAULT_STACKED_LINE_GAP_PERCENT,
  DEFAULT_STACKED_LINE_HEIGHT_PERCENT,
  DEFAULT_STACKED_LINE_WIDTH_PERCENT,
  DEFAULT_STACKED_SURFACE_OPACITY_PERCENT,
  DEFAULT_STACKED_WIDTH_PERCENT,
  MAX_BADGE_SCALE_PERCENT,
  MAX_GENRE_BADGE_SCALE_PERCENT,
  MAX_PROVIDER_ICON_SCALE_PERCENT,
  MAX_STACKED_ELEMENT_OFFSET_PX,
  MAX_STACKED_SURFACE_OPACITY_PERCENT,
  MAX_STACKED_LINE_GAP_PERCENT,
  MAX_STACKED_LINE_HEIGHT_PERCENT,
  MAX_STACKED_LINE_WIDTH_PERCENT,
  MAX_STACKED_WIDTH_PERCENT,
  MIN_BADGE_SCALE_PERCENT,
  MIN_PROVIDER_ICON_SCALE_PERCENT,
  MIN_STACKED_ELEMENT_OFFSET_PX,
  MIN_STACKED_SURFACE_OPACITY_PERCENT,
  MIN_STACKED_LINE_GAP_PERCENT,
  MIN_STACKED_LINE_HEIGHT_PERCENT,
  MIN_STACKED_LINE_WIDTH_PERCENT,
  MIN_STACKED_WIDTH_PERCENT,
  QUALITY_BADGE_OPTIONS,
  normalizeBadgeScalePercent,
  normalizeGenreBadgeScalePercent,
  normalizeProviderIconScalePercent,
  normalizeStackedAccentMode,
  normalizeStackedElementOffsetPx,
  normalizeStackedLineGapPercent,
  normalizeStackedLineHeightPercent,
  normalizeStackedLineWidthPercent,
  normalizeStackedSurfaceOpacityPercent,
  normalizeStackedWidthPercent,
  type RatingProviderAppearanceOverride,
  type RatingProviderAppearanceOverrides,
} from '@/lib/badgeCustomization';
import {
  buildDefaultRatingRows,
  enabledOrderedToRows,
  rowsToEnabledOrdered,
  type RatingProviderRow,
} from '@/lib/ratingRows';
import {
  BACKDROP_RATING_LAYOUT_OPTIONS,
  DEFAULT_BACKDROP_RATING_LAYOUT,
  type BackdropRatingLayout,
} from '@/lib/backdropRatingLayout';
import {
  DEFAULT_POSTER_RATINGS_MAX_PER_SIDE,
  POSTER_RATINGS_MAX_PER_SIDE_MIN,
  POSTER_RATING_LAYOUT_OPTIONS,
  isVerticalPosterRatingLayout,
  type PosterRatingLayout,
} from '@/lib/posterRatingLayout';
import {
  DEFAULT_QUALITY_BADGES_STYLE,
  DEFAULT_RATING_STYLE,
  QUALITY_BADGE_STYLE_OPTIONS,
  RATING_STYLE_OPTIONS,
  type QualityBadgeStyle,
  type RatingStyle,
} from '@/lib/ratingStyle';
import {
  AGGREGATE_ACCENT_MODE_OPTIONS,
  AGGREGATE_RATING_SOURCE_ACCENTS,
  DEFAULT_AGGREGATE_ACCENT_BAR_OFFSET,
  DEFAULT_AGGREGATE_ACCENT_COLOR,
  DEFAULT_AGGREGATE_ACCENT_MODE,
  AGGREGATE_RATING_SOURCE_OPTIONS,
  DEFAULT_AGGREGATE_RATING_SOURCE,
  DEFAULT_RATING_PRESENTATION,
  MAX_AGGREGATE_ACCENT_BAR_OFFSET,
  MIN_AGGREGATE_ACCENT_BAR_OFFSET,
  preservesSelectedRatingLayout,
  RATING_PRESENTATION_OPTIONS,
  usesAggregateAccentBar,
  usesAggregateRatingPresentation,
  usesAggregateRatingSource,
  usesDualAggregateRatingPresentation,
  type AggregateAccentMode,
  type AggregateRatingSource,
  type RatingPresentation,
} from '@/lib/ratingPresentation';
import {
  buildAiometadataUrlPatterns,
  buildConfigString,
  buildProxyUrl,
  normalizeSavedUiConfig,
  parseSavedUiConfig,
  serializeSavedUiConfig,
  normalizeBaseUrl,
  normalizeManifestUrl,
  type ArtworkSource,
  type BackdropImageTextPreference,
  type LogoBackground,
  type PosterImageSize,
  type PosterImageTextPreference,
  type QualityBadgesSide,
  type PosterQualityBadgesPosition,
  type SavedUiConfig,
  type StreamBadgesSetting,
  type TmdbIdScopeMode,
} from '@/lib/uiConfig';
import {
  CONFIGURATOR_PRESETS,
  CONFIGURATOR_WIZARD_QUESTION_ORDER,
  CONFIGURATOR_WIZARD_QUESTIONS,
  DEFAULT_CONFIGURATOR_EXPERIENCE_MODE,
  applyConfiguratorPreset,
  getConfiguratorPreset,
  isConfiguratorExperienceMode,
  isConfiguratorPresetId,
  recommendConfiguratorPreset,
  type ConfiguratorExperienceMode,
  type ConfiguratorPresetId,
  type ConfiguratorWizardAnswers,
  type ConfiguratorWizardQuestionId,
} from '@/lib/configuratorPresets';
import {
  DEFAULT_METADATA_TRANSLATION_MODE,
  METADATA_TRANSLATION_MODE_OPTIONS,
  type MetadataTranslationMode,
} from '@/lib/metadataTranslation';
import {
  DEFAULT_GENRE_BADGE_ANIME_GROUPING,
  DEFAULT_GENRE_BADGE_MODE,
  DEFAULT_GENRE_BADGE_POSITION,
  DEFAULT_GENRE_BADGE_STYLE,
  GENRE_BADGE_FAMILY_META,
  GENRE_BADGE_MODE_OPTIONS,
  GENRE_BADGE_POSITION_OPTIONS,
  GENRE_BADGE_PREVIEW_SAMPLES,
  GENRE_BADGE_STYLE_OPTIONS,
  type GenreBadgeAnimeGrouping,
  type GenreBadgeMode,
  type GenreBadgePosition,
  type GenreBadgeStyle,
} from '@/lib/genreBadge';
import {
  DEFAULT_SIDE_RATING_OFFSET,
  SIDE_RATING_POSITION_OPTIONS,
  type SideRatingPosition,
} from '@/lib/sideRatingPosition';
import {
  DEFAULT_POSTER_EDGE_OFFSET,
  MAX_POSTER_EDGE_OFFSET,
  normalizePosterEdgeOffset,
} from '@/lib/posterEdgeOffset';
import {
  DEFAULT_RATING_VALUE_MODE,
  RATING_VALUE_MODE_OPTIONS,
  type RatingValueMode,
} from '@/lib/ratingDisplay';

const RatingProviderSortableList = dynamic(
  () =>
    import('@/components/rating-provider-sortable-list').then((module) => ({
      default: module.RatingProviderSortableList,
    })),
  {
    ssr: false,
  }
);

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'it', label: 'Italian', flag: '🇮🇹' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'de', label: 'German', flag: '🇩🇪' },
  { code: 'pt', label: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', label: 'Russian', flag: '🇷🇺' },
  { code: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { code: 'zh', label: 'Chinese', flag: '🇨🇳' },
  { code: 'tr', label: 'Turkish', flag: '🇹🇷' },
];
const POSTER_IMAGE_SIZE_OPTIONS: Array<{
  id: PosterImageSize;
  label: string;
  description: string;
}> = [
  { id: 'normal', label: 'Normal', description: '580x859. Default poster ratio and balanced bandwidth.' },
  { id: 'large', label: 'Large', description: '1280x1896. Higher detail for larger displays.' },
  { id: '4k', label: '4K', description: '2000x2926. Maximum detail, slower transfers.' },
];
const POSTER_IMAGE_TEXT_OPTIONS: Array<{
  id: PosterImageTextPreference;
  label: string;
  description: string;
}> = [
  { id: 'original', label: 'Original', description: 'Use the default TMDB poster art.' },
  { id: 'clean', label: 'Clean', description: 'Prefer TMDB art with less embedded text when available.' },
  { id: 'alternative', label: 'Alternative', description: 'Use a different TMDB poster when one exists.' },
  { id: 'random', label: 'Random', description: 'Pick a seeded random poster variation for this title.' },
];
const POSTER_ARTWORK_SOURCE_OPTIONS: Array<{
  id: ArtworkSource;
  label: string;
  description: string;
}> = [
  { id: 'tmdb', label: 'TMDB', description: 'Use the normal TMDB clean poster selection.' },
  { id: 'fanart', label: 'Fanart', description: 'Prefer fanart.tv artwork when a fanart key is available, then fall back to TMDB.' },
  { id: 'cinemeta', label: 'Cinemeta', description: 'Use the official MetaHub Cinemeta poster when an IMDb ID is available, then fall back to TMDB.' },
  { id: 'random', label: 'Random', description: 'Pick a seeded random poster source between TMDB, fanart, and Cinemeta when available.' },
];
const BACKDROP_ARTWORK_SOURCE_OPTIONS: Array<{
  id: ArtworkSource;
  label: string;
  description: string;
}> = [
  { id: 'tmdb', label: 'TMDB', description: 'Use the normal TMDB clean backdrop selection.' },
  { id: 'fanart', label: 'Fanart', description: 'Prefer fanart.tv backdrop art when a fanart key is available, then fall back to TMDB.' },
  { id: 'cinemeta', label: 'Cinemeta', description: 'Use the official MetaHub Cinemeta backdrop when an IMDb ID is available, then fall back to TMDB.' },
  { id: 'random', label: 'Random', description: 'Pick a seeded random backdrop source between TMDB, fanart, and Cinemeta when available.' },
];
const LOGO_ARTWORK_SOURCE_OPTIONS: Array<{
  id: ArtworkSource;
  label: string;
  description: string;
}> = [
  { id: 'tmdb', label: 'TMDB', description: 'Use the normal TMDB logo selection.' },
  { id: 'fanart', label: 'Fanart', description: 'Prefer fanart.tv logo assets when a fanart key is available, then fall back to TMDB.' },
  { id: 'cinemeta', label: 'Cinemeta', description: 'Use the official MetaHub Cinemeta logo when an IMDb ID is available, then fall back to TMDB.' },
  { id: 'random', label: 'Random', description: 'Pick a seeded random logo source between TMDB, fanart, and Cinemeta when available.' },
];
const BACKDROP_IMAGE_TEXT_OPTIONS: Array<{
  id: BackdropImageTextPreference;
  label: string;
  description: string;
}> = [
  { id: 'original', label: 'Original', description: 'Use the default TMDB backdrop art.' },
  { id: 'clean', label: 'Clean', description: 'Prefer TMDB backdrop art with less embedded text when available.' },
  { id: 'alternative', label: 'Alternative', description: 'Use a different TMDB backdrop when one exists.' },
  { id: 'random', label: 'Random', description: 'Pick a seeded random backdrop variation for this title.' },
];
const PROXY_TYPES = ['poster', 'backdrop', 'logo'] as const;
type ProxyType = (typeof PROXY_TYPES)[number];
type ProxyEnabledTypes = Record<ProxyType, boolean>;
const BRAND_GITHUB_URL = process.env.NEXT_PUBLIC_BRAND_GITHUB_URL || 'https://github.com/IbbyLabs/erdb';
const BRAND_SUPPORT_URL = process.env.NEXT_PUBLIC_BRAND_SUPPORT_URL || 'https://kofi.ibbylabs.dev';
const BRAND_UPTIME_URL = process.env.NEXT_PUBLIC_BRAND_UPTIME_URL || 'https://uptime.ibbylabs.dev';
const BRAND_DISCORD_AIO_URL = process.env.NEXT_PUBLIC_BRAND_DISCORD_AIO_URL || 'https://discord.gg/5S2nTdV2uD';
const BRAND_DISCORD_AIO_LABEL = process.env.NEXT_PUBLIC_BRAND_DISCORD_AIO_LABEL || 'ERDB in AIOStreams';
const BRAND_DISCORD_OFFICIAL_URL = process.env.NEXT_PUBLIC_BRAND_DISCORD_OFFICIAL_URL || 'https://discord.gg/wPY2pcqjmm';
const BRAND_DISCORD_OFFICIAL_LABEL = process.env.NEXT_PUBLIC_BRAND_DISCORD_OFFICIAL_LABEL || 'Official ERDB Discord';
const BRAND_DISCORD_DM_URL = process.env.NEXT_PUBLIC_BRAND_DISCORD_DM_URL || 'https://discord.com/users/947862578682548255';
const BRAND_DISCORD_DM_HANDLE = process.env.NEXT_PUBLIC_BRAND_DISCORD_DM_HANDLE || '@ibbys89';
const PACKAGE_VERSION = `v${String(packageJson.version || '').trim() || 'dev'}`;
const DEPLOYMENT_VERSION = String(process.env.NEXT_PUBLIC_DEPLOYMENT_VERSION || PACKAGE_VERSION).trim() || 'dev';
const maskSensitiveText = (value: string) => value.replace(/[^\s]/g, '*');
const STREAM_BADGE_OPTIONS: Array<{ id: StreamBadgesSetting; label: string }> = [
  { id: 'auto', label: 'Auto' },
  { id: 'on', label: 'On' },
  { id: 'off', label: 'Off' },
];
const TMDB_ID_SCOPE_MODE_OPTIONS: Array<{
  id: TmdbIdScopeMode;
  label: string;
  description: string;
}> = [
  {
    id: 'soft',
    label: 'Soft',
    description: 'Default. Accepts tmdb:id for compatibility.',
  },
  {
    id: 'strict',
    label: 'Strict',
    description: 'Prevents logo and backdrop collisions by requiring tmdb:movie:id or tmdb:tv:id.',
  },
];
const QUALITY_BADGE_SIDE_OPTIONS: Array<{ id: QualityBadgesSide; label: string }> = [
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
];
const QUALITY_BADGE_POSITION_OPTIONS: Array<{ id: PosterQualityBadgesPosition; label: string }> = [
  { id: 'auto', label: 'Auto' },
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
];
const SAMPLE_GENRE_BADGE_MODE_DEFAULT: GenreBadgeMode = 'both';
const GENRE_BADGE_ANIME_GROUPING_OPTIONS: Array<{
  id: GenreBadgeAnimeGrouping;
  label: string;
  description: string;
}> = [
  {
    id: 'split',
    label: 'Split',
    description: 'Keep anime and animation as separate badge families.',
  },
  {
    id: 'animation',
    label: 'Group as Animation',
    description: 'Render anime content under the animation badge family.',
  },
];
const GENRE_BADGE_QUERY_KEYS = {
  poster: {
    mode: 'posterGenreBadge',
    style: 'posterGenreBadgeStyle',
    position: 'posterGenreBadgePosition',
    scale: 'posterGenreBadgeScale',
    animeGrouping: 'posterGenreBadgeAnimeGrouping',
  },
  backdrop: {
    mode: 'backdropGenreBadge',
    style: 'backdropGenreBadgeStyle',
    position: 'backdropGenreBadgePosition',
    scale: 'backdropGenreBadgeScale',
    animeGrouping: 'backdropGenreBadgeAnimeGrouping',
  },
  logo: {
    mode: 'logoGenreBadge',
    style: 'logoGenreBadgeStyle',
    position: 'logoGenreBadgePosition',
    scale: 'logoGenreBadgeScale',
    animeGrouping: 'logoGenreBadgeAnimeGrouping',
  },
} as const satisfies Record<
  ProxyType,
  { mode: string; style: string; position: string; scale: string; animeGrouping: string }
>;
type RecentCommitType = 'feat' | 'fix' | 'chore' | 'refactor' | 'perf' | 'test' | 'build' | 'ci' | 'style' | 'revert';
type RecentCommit = {
  hash: string;
  shortHash: string;
  date: string;
  type: RecentCommitType;
  title: string;
  body: string | null;
  isUpstream: boolean;
};
const COMMIT_FEED_URL = '/commits.json';
const LATEST_RELEASE_FEED_URL = '/api/latest-release';
const COMMIT_PAGE_SIZE = 5;
const UI_CONFIG_STORAGE_KEY = 'erdb.uiConfig.v1';
const UI_CONFIG_SETTINGS_STORAGE_KEY = 'erdb.uiConfig.settings.v1';
const LEGACY_API_KEY_CONFIG_STORAGE_KEY = 'erdb.apiKeyConfig.v1';
const LEGACY_API_KEY_CONFIG_SETTINGS_STORAGE_KEY = 'erdb.apiKeyConfig.settings.v1';
const INVALID_COMMIT_TIMESTAMP_LABEL = 'unknown';
type LocalUiSettingsStorage = {
  autoSave?: boolean;
  experienceMode?: ConfiguratorExperienceMode;
  presetId?: ConfiguratorPresetId | null;
  stickyPreview?: boolean;
};
type AdvancedConfiguratorSectionId =
  | 'essentials'
  | 'presentation'
  | 'look'
  | 'quality'
  | 'providers';
const DEFAULT_ADVANCED_OPEN_SECTIONS: AdvancedConfiguratorSectionId[] = [
  'essentials',
  'presentation',
  'look',
  'quality',
  'providers',
];
const SIMPLE_PRESENTATION_IDS: RatingPresentation[] = [
  'standard',
  'minimal',
  'average',
  'blockbuster',
];
const PRESENTATION_SECTION_ORDER: RatingPresentation[] = [
  'standard',
  'editorial',
  'average',
  'dual',
  'minimal',
  'dual-minimal',
  'blockbuster',
  'none',
];
const RATING_PROVIDER_DOC_VALUES = ALL_RATING_PREFERENCES.join(', ');
const QUALITY_BADGE_DOC_VALUES = QUALITY_BADGE_OPTIONS.map((option) => option.id).join(', ');
const TMDB_LANGUAGE_DOC_COPY = 'Any TMDB ISO 639-1 code (en, it, fr, es, de, ja, ko, etc.)';
const TMDB_LANGUAGE_HELP_COPY = 'All TMDB ISO 639-1 codes are supported (en, it, fr, es, de, etc.). Default: en.';
const POSTER_LAYOUT_DOC_VALUES = 'top, bottom, left, right, top bottom, left right';
const POSTER_LAYOUT_DOC_DEFAULT = 'top bottom';
const POSTER_RATINGS_MAX_DOC_COPY = '1+';
const OPTIONAL_BADGE_MAX_DOC_COPY = '1+';
const BACKDROP_LAYOUT_DOC_VALUES = 'center, right, right vertical';
const SIDE_RATING_POSITION_DOC_VALUES = 'top, middle, bottom, custom';
const SIDE_RATING_OFFSET_DOC_COPY = '0 to 100';
const POSTER_EDGE_OFFSET_DOC_COPY = `0 to ${MAX_POSTER_EDGE_OFFSET}`;
const BADGE_SCALE_DOC_COPY = `${MIN_BADGE_SCALE_PERCENT} to ${MAX_BADGE_SCALE_PERCENT}`;
const GENRE_BADGE_SCALE_DOC_COPY = `${MIN_BADGE_SCALE_PERCENT} to ${MAX_GENRE_BADGE_SCALE_PERCENT}`;
const LOGO_BACKGROUND_DOC_VALUES = 'transparent, dark';
const RATING_VALUE_MODE_DOC_VALUES = 'native, normalized, normalized100';
const GENRE_BADGE_STYLE_DOC_VALUES = 'glass, square, plain';
const GENRE_BADGE_POSITION_DOC_VALUES =
  'topLeft, topCenter, topRight, bottomLeft, bottomCenter, bottomRight';
const AGGREGATE_SOURCE_ACCENT_BY_ID = AGGREGATE_RATING_SOURCE_ACCENTS;

const hexToRgbaCss = (value: string, alpha: number) => {
  const normalized = value.trim().replace(/^#/, '');
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : normalized;

  if (!/^[0-9a-f]{6}$/i.test(expanded)) {
    return `rgba(167,139,250,${alpha})`;
  }

  const r = Number.parseInt(expanded.slice(0, 2), 16);
  const g = Number.parseInt(expanded.slice(2, 4), 16);
  const b = Number.parseInt(expanded.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const normalizeOptionalBadgeCountInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;
  const normalized = Math.trunc(parsed);
  if (normalized < POSTER_RATINGS_MAX_PER_SIDE_MIN) return null;
  return normalized;
};

const appendGenreBadgeQueryParams = ({
  query,
  type,
  mode,
  style,
  position,
  scale,
  animeGrouping,
}: {
  query: URLSearchParams;
  type: ProxyType;
  mode: GenreBadgeMode;
  style: GenreBadgeStyle;
  position: GenreBadgePosition;
  scale: number;
  animeGrouping: GenreBadgeAnimeGrouping;
}) => {
  const keys = GENRE_BADGE_QUERY_KEYS[type];
  if (mode !== DEFAULT_GENRE_BADGE_MODE) {
    query.set(keys.mode, mode);
  }
  if (style !== DEFAULT_GENRE_BADGE_STYLE) {
    query.set(keys.style, style);
  }
  if (position !== DEFAULT_GENRE_BADGE_POSITION) {
    query.set(keys.position, position);
  }
  if (scale !== DEFAULT_BADGE_SCALE_PERCENT) {
    query.set(keys.scale, String(scale));
  }
  if (animeGrouping !== DEFAULT_GENRE_BADGE_ANIME_GROUPING) {
    query.set(keys.animeGrouping, animeGrouping);
  }
};

const buildGenreSamplePreviewUrl = ({
  baseUrl,
  erdbKey,
  tmdbKey,
  sample,
  mode,
  style,
  position,
  scale,
  animeGrouping,
}: {
  baseUrl: string;
  erdbKey: string;
  tmdbKey: string;
  sample: (typeof GENRE_BADGE_PREVIEW_SAMPLES)[number];
  mode: GenreBadgeMode;
  style: GenreBadgeStyle;
  position: GenreBadgePosition;
  scale: number;
  animeGrouping: GenreBadgeAnimeGrouping;
}) => {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const normalizedErdbKey = erdbKey.trim();
  const normalizedTmdbKey = tmdbKey.trim();
  if (!normalizedBaseUrl || !normalizedTmdbKey) {
    return '';
  }

  const query = new URLSearchParams({
    tmdbKey: normalizedTmdbKey,
    lang: sample.lang,
  });
  if (normalizedErdbKey) {
    query.set('erdbKey', normalizedErdbKey);
  }
  appendGenreBadgeQueryParams({
    query,
    type: sample.previewType,
    mode,
    style,
    position,
    scale,
    animeGrouping,
  });
  for (const [key, value] of Object.entries(sample.params)) {
    query.set(key, value);
  }

  return `${normalizedBaseUrl}/${sample.previewType}/${encodeURIComponent(sample.mediaId)}.jpg?${query.toString()}`;
};
const FANART_KEY_HELP_COPY =
  'Optional. Recommended. Your key is used first. If left blank, ERDB falls back to the service key when one exists. This helps if the shared service key is rate limited or blocked later.';
const ERDB_REQUEST_KEY_HELP_COPY =
  'Optional. Only needed when the ERDB host enables request protection. When present, the configurator carries it into previews, config strings, proxy manifests, and exported URL patterns.';
const AI_DEVELOPER_PROMPT = `Act as an expert addon developer. I want to implement the ERDB Stateless API into my media center addon.

CONFIG INPUT
Add a single text field called "erdbConfig" (base64url). The user will paste it from the ERDB site after configuring there.
Do NOT hardcode API keys or base URL. Always use cfg.baseUrl from erdbConfig.

DECODE
Node/JS: const cfg = JSON.parse(Buffer.from(erdbConfig, 'base64url').toString('utf8'));

FULL API REFERENCE
Endpoint: GET /{type}/{id}.jpg?...queryParams

Parameter               | Values                                                              | Default
type (path)             | poster, backdrop, logo                                               | none
id (path)               | IMDb (tt...), TMDB (tmdb:id, tmdb:movie:id, tmdb:tv:id), Kitsu (kitsu:id), AniList, MAL, TVDB, AniDB | none
tmdbIdScope             | soft, strict                                                         | soft
ratings                 | ${RATING_PROVIDER_DOC_VALUES} (global fallback)                      | all
posterRatings           | ${RATING_PROVIDER_DOC_VALUES} (poster only)                          | all
backdropRatings         | ${RATING_PROVIDER_DOC_VALUES} (backdrop only)                        | all
logoRatings             | ${RATING_PROVIDER_DOC_VALUES} (logo only)                            | all
lang                    | ${TMDB_LANGUAGE_DOC_COPY}                                             | en
genreBadge             | off, text, icon, both (global fallback)                              | off
posterGenreBadge       | off, text, icon, both (poster only)                                  | off
backdropGenreBadge     | off, text, icon, both (backdrop only)                                | off
logoGenreBadge         | off, text, icon, both (logo only)                                    | off
genreBadgeStyle        | ${GENRE_BADGE_STYLE_DOC_VALUES} (global fallback)                    | glass
posterGenreBadgeStyle  | ${GENRE_BADGE_STYLE_DOC_VALUES} (poster only)                        | glass
backdropGenreBadgeStyle| ${GENRE_BADGE_STYLE_DOC_VALUES} (backdrop only)                      | glass
logoGenreBadgeStyle    | ${GENRE_BADGE_STYLE_DOC_VALUES} (logo only)                          | glass
genreBadgePosition     | ${GENRE_BADGE_POSITION_DOC_VALUES} (global fallback)                 | topLeft
posterGenreBadgePosition| ${GENRE_BADGE_POSITION_DOC_VALUES} (poster only)                    | topLeft
backdropGenreBadgePosition| ${GENRE_BADGE_POSITION_DOC_VALUES} (backdrop only)                | topLeft
logoGenreBadgePosition | ${GENRE_BADGE_POSITION_DOC_VALUES} (logo only)                       | topLeft
streamBadges            | auto, on, off (global fallback)                                      | auto
posterStreamBadges      | auto, on, off (poster only)                                          | auto
backdropStreamBadges    | auto, on, off (backdrop only)                                        | auto
qualityBadgesSide       | left, right (poster top bottom layout only)                          | left
posterQualityBadgesPosition | auto, left, right (poster top or bottom only)                    | auto
posterQualityBadges    | ${QUALITY_BADGE_DOC_VALUES} (poster only, empty string disables all) | all
backdropQualityBadges  | ${QUALITY_BADGE_DOC_VALUES} (backdrop only, empty string disables all)| all
qualityBadgesStyle      | glass, square, plain, media, silver (global fallback)                | glass
posterQualityBadgesStyle| glass, square, plain, media, silver (poster only)                    | glass
backdropQualityBadgesStyle| glass, square, plain, media, silver (backdrop only)                | glass
posterQualityBadgesMax  | Number (${OPTIONAL_BADGE_MAX_DOC_COPY})                              | auto
backdropQualityBadgesMax| Number (${OPTIONAL_BADGE_MAX_DOC_COPY})                              | auto
providerAppearance     | base64url or JSON provider overrides for icon, accent, stacked chrome, and stacked element offsets | none
ratingPresentation      | standard, minimal, average, dual, dual-minimal, editorial, blockbuster | standard
aggregateRatingSource   | overall, critics, audience                                           | overall
aggregateAccentMode     | source, genre, custom                                                | source
aggregateAccentColor    | Hex color (used when aggregateAccentMode=custom)                     | #a78bfa
aggregateAccentBarOffset| Number (-12 to 12, aggregate badges only)                            | 0
aggregateAccentBarVisible| true, false (aggregate compact/labeled accent line toggle)         | true
ratingValueMode         | ${RATING_VALUE_MODE_DOC_VALUES}                                      | native
ratingStyle (posterRatingStyle, backdropRatingStyle, logoRatingStyle aliases, style legacy) | glass, square, plain, stacked | glass
genreBadgeScale         | Number (${GENRE_BADGE_SCALE_DOC_COPY}) (global fallback)            | 100
posterGenreBadgeScale   | Number (${GENRE_BADGE_SCALE_DOC_COPY})                              | 100
backdropGenreBadgeScale | Number (${GENRE_BADGE_SCALE_DOC_COPY})                              | 100
logoGenreBadgeScale     | Number (${GENRE_BADGE_SCALE_DOC_COPY})                              | 100
posterRatingBadgeScale | Number (${BADGE_SCALE_DOC_COPY})                                    | 100
backdropRatingBadgeScale| Number (${BADGE_SCALE_DOC_COPY})                                    | 100
logoRatingBadgeScale   | Number (${BADGE_SCALE_DOC_COPY})                                    | 100
posterQualityBadgeScale| Number (${BADGE_SCALE_DOC_COPY})                                    | 100
backdropQualityBadgeScale| Number (${BADGE_SCALE_DOC_COPY})                                  | 100
imageText               | original, clean, alternative, random                                 | original
posterImageSize         | normal (580x859), large (1280x1896), 4k (2000x2926)                  | normal
posterArtworkSource     | tmdb, fanart, cinemeta, random (poster artwork source)               | tmdb
backdropArtworkSource   | tmdb, fanart, cinemeta, random (backdrop artwork source)             | tmdb
posterRatingsLayout     | ${POSTER_LAYOUT_DOC_VALUES}                                           | ${POSTER_LAYOUT_DOC_DEFAULT}
posterRatingsMax        | Number (${OPTIONAL_BADGE_MAX_DOC_COPY})                              | auto
posterRatingsMaxPerSide | Number (${POSTER_RATINGS_MAX_DOC_COPY})                              | auto
posterEdgeOffset       | Number (${POSTER_EDGE_OFFSET_DOC_COPY}, poster edge badges only)      | 0
backdropRatingsLayout   | ${BACKDROP_LAYOUT_DOC_VALUES}                                         | center
backdropRatingsMax      | Number (${OPTIONAL_BADGE_MAX_DOC_COPY})                              | auto
posterSideRatingsPosition | ${SIDE_RATING_POSITION_DOC_VALUES}                                  | top
posterSideRatingsOffset | Number (${SIDE_RATING_OFFSET_DOC_COPY}, custom only)                  | 50
backdropSideRatingsPosition | ${SIDE_RATING_POSITION_DOC_VALUES}                                | top
backdropSideRatingsOffset | Number (${SIDE_RATING_OFFSET_DOC_COPY}, custom only)                | 50
logoRatingsMax          | Number (${OPTIONAL_BADGE_MAX_DOC_COPY})                              | auto
logoBackground          | ${LOGO_BACKGROUND_DOC_VALUES}                                         | transparent
logoArtworkSource       | tmdb, fanart, cinemeta, random                                       | tmdb
erdbKey                | ERDB request key when the host enables route protection               | none
tmdbKey (REQUIRED)      | Your TMDB v3 API Key                                                 | none
mdblistKey (REQUIRED)   | Your MDBList.com API Key                                             | none
fanartKey               | Your Fanart API Key (used first for fanart sources)                  | service fallback when available
simklClientId           | Your SIMKL client_id for direct SIMKL ratings                        | none

TMDB NOTE: Default tmdbIdScope=soft keeps compatibility and accepts tmdb:id. Set tmdbIdScope=strict to require tmdb:movie:id or tmdb:tv:id for backdrop and logo so TMDB movie and TV collisions cannot return incorrect artwork.
ACCESS NOTE: erdbKey is optional and only needed when the ERDB host protects render and proxy routes with ERDB_REQUEST_API_KEY or ERDB_REQUEST_API_KEYS.
STYLE NOTE: Transparent provider icons stay transparent in every style. In glass, icons with transparency such as Kitsu render on a neutral inner chip with an accent ring to avoid accent color bleed through.
QUALITY NOTE: Media quality badges use local asset based artwork for 4K, Bluray, HDR10, Dolby Vision, and Dolby Atmos. Certification badges include a small AGE label above the rating.
FANART NOTE: fanartKey is optional. If present, ERDB uses your key first for fanart poster, backdrop, and logo requests. If fanartKey is blank, ERDB falls back to ERDB_FANART_API_KEY or FANART_API_KEY when the server has one.
POSTER NOTE: posterArtworkSource=fanart uses fanart.tv poster art for original, clean, and alternative poster modes when a fanart key is available. Original and clean use the top ranked fanart image. Alternative uses the next ranked fanart image when one exists. posterArtworkSource=cinemeta uses the official MetaHub Cinemeta poster when ERDB can resolve an IMDb ID, then falls back to TMDB.
POSTER SIZE NOTE: posterImageSize controls the poster output target. normal=580x859, large=1280x1896, 4k=2000x2926.
BACKDROP NOTE: backdropArtworkSource=fanart uses fanart.tv moviebackground or showbackground art for original, clean, and alternative backdrop modes when a fanart key is available. Original and clean use the top ranked fanart image. Alternative uses the next ranked fanart image when one exists. backdropArtworkSource=cinemeta uses the official MetaHub Cinemeta backdrop when ERDB can resolve an IMDb ID, then falls back to TMDB.
LOGO NOTE: logoArtworkSource=fanart uses fanart.tv HD or clear logo assets when a fanart key is available. logoArtworkSource=cinemeta uses the official MetaHub Cinemeta logo when ERDB can resolve an IMDb ID, then falls back to TMDB.
FUTURE NOTE: season aware fanart support is a strong next step for TV because fanart.tv exposes seasonposter and seasonthumb assets.

INTEGRATION REQUIREMENTS
1. Use ONLY the "erdbConfig" field (no modal and no extra settings panels).
2. Add toggles to enable or disable poster, backdrop, and logo.
3. If a type is disabled, keep the original artwork (do not call ERDB for that type).
4. Build ERDB URLs using the decoded config and inject them into both catalog and meta responses.

PER TYPE SETTINGS
poster   : posterImageSize = cfg.posterImageSize (normal, large, 4k)
poster   : ratingStyle = cfg.posterRatingStyle, imageText = cfg.posterImageText
backdrop : ratingStyle = cfg.backdropRatingStyle, imageText = cfg.backdropImageText
logo     : ratingStyle = cfg.logoRatingStyle, logoBackground = cfg.logoBackground
all      : genreBadge = cfg.genreBadge, genreBadgeStyle = cfg.genreBadgeStyle, genreBadgePosition = cfg.genreBadgePosition, genreBadgeScale = cfg.genreBadgeScale (optional global fallbacks)
poster   : genreBadge = cfg.posterGenreBadge, genreBadgeStyle = cfg.posterGenreBadgeStyle, genreBadgePosition = cfg.posterGenreBadgePosition, genreBadgeScale = cfg.posterGenreBadgeScale
backdrop : genreBadge = cfg.backdropGenreBadge, genreBadgeStyle = cfg.backdropGenreBadgeStyle, genreBadgePosition = cfg.backdropGenreBadgePosition, genreBadgeScale = cfg.backdropGenreBadgeScale
logo     : genreBadge = cfg.logoGenreBadge, genreBadgeStyle = cfg.logoGenreBadgeStyle, genreBadgePosition = cfg.logoGenreBadgePosition, genreBadgeScale = cfg.logoGenreBadgeScale
poster artwork source : use cfg.posterArtworkSource for poster original, clean, or alternative
backdrop artwork source : use cfg.backdropArtworkSource for backdrop original, clean, or alternative
logo artwork source : use cfg.logoArtworkSource when rendering logo output
Ratings providers can be set per type via cfg.posterRatings / cfg.backdropRatings / cfg.logoRatings (fallback to cfg.ratings). Provider order is respected.
Use cfg.ratingValueMode to keep provider native scales or normalize everything to ten point or rounded hundred point values.
Rating presentation can be set per type via cfg.posterRatingPresentation / cfg.backdropRatingPresentation / cfg.logoRatingPresentation (fallback to cfg.ratingPresentation).
Aggregate source can be set per type via cfg.posterAggregateRatingSource / cfg.backdropAggregateRatingSource / cfg.logoAggregateRatingSource (fallback to cfg.aggregateRatingSource).
Use cfg.aggregateAccentMode to keep source colours, match the genre badge, or force a custom aggregate accent through cfg.aggregateAccentColor.
Use cfg.aggregateAccentBarOffset to nudge the aggregate badge accent bar up or down a few pixels in compact, compact dual, labeled, and dual aggregate layouts.
Use cfg.aggregateAccentBarVisible=false to hide the compact or labeled aggregate accent line entirely.
Editorial presentation gives posters a fixed top left print style and falls back to the labeled average badge on backdrop and logo output.
Use cfg.posterEdgeOffset to push poster side rating stacks, side quality columns, and corner genre badges inward from the poster edges.
Use cfg.qualityBadgesSide for poster top bottom layouts and cfg.posterQualityBadgesPosition for poster top or bottom layouts.
Quality badge visibility/style/max can be set per type via cfg.posterQualityBadges / cfg.backdropQualityBadges, cfg.posterQualityBadgesStyle / cfg.backdropQualityBadgesStyle, and cfg.posterQualityBadgesMax / cfg.backdropQualityBadgesMax.
Rating badge max and badge scale can be set per type via cfg.posterRatingsMax / cfg.backdropRatingsMax / cfg.logoRatingsMax plus cfg.posterRatingBadgeScale / cfg.backdropRatingBadgeScale / cfg.logoRatingBadgeScale. Genre badge mode/style/position/scale can be set per type via cfg.posterGenreBadge* / cfg.backdropGenreBadge* / cfg.logoGenreBadge* and fall back to the shared cfg.genreBadge* fields.
Quality badge scale can be set per type via cfg.posterQualityBadgeScale / cfg.backdropQualityBadgeScale.
Provider icon overrides can be shared through cfg.providerAppearance. Send base64url or raw JSON shaped like {"trakt":{"iconUrl":"https://...","accentColor":"#7c3aed","iconScalePercent":116,"stackedWidthPercent":88,"stackedSurfaceOpacityPercent":72,"stackedAccentMode":"logo","stackedLineVisible":false,"stackedLineWidthPercent":88,"stackedIconOffsetY":-6,"stackedValueOffsetY":4}}.
Use cfg.posterSideRatingsPosition for poster side layouts and cfg.backdropSideRatingsPosition for backdrop right vertical stacks. If either field is custom, send the matching cfg.posterSideRatingsOffset or cfg.backdropSideRatingsOffset as a 0 to 100 vertical anchor. Legacy cfg.sideRatingsPosition and cfg.sideRatingsOffset remain accepted as fallbacks.

URL BUILD
const typeRatingStyle = type === 'poster' ? cfg.posterRatingStyle : type === 'backdrop' ? cfg.backdropRatingStyle : cfg.logoRatingStyle;
const typeImageText = type === 'backdrop' ? cfg.backdropImageText : cfg.posterImageText;
\${cfg.baseUrl}/\${type}/\${id}.jpg?erdbKey=\${cfg.erdbKey}&tmdbKey=\${cfg.tmdbKey}&mdblistKey=\${cfg.mdblistKey}&fanartKey=\${cfg.fanartKey}&ratings=\${cfg.ratings}&posterRatings=\${cfg.posterRatings}&backdropRatings=\${cfg.backdropRatings}&logoRatings=\${cfg.logoRatings}&lang=\${cfg.lang}&ratingValueMode=\${cfg.ratingValueMode}&genreBadge=\${cfg.genreBadge}&genreBadgeStyle=\${cfg.genreBadgeStyle}&genreBadgePosition=\${cfg.genreBadgePosition}&genreBadgeScale=\${cfg.genreBadgeScale}&posterGenreBadge=\${cfg.posterGenreBadge}&backdropGenreBadge=\${cfg.backdropGenreBadge}&logoGenreBadge=\${cfg.logoGenreBadge}&posterGenreBadgeStyle=\${cfg.posterGenreBadgeStyle}&backdropGenreBadgeStyle=\${cfg.backdropGenreBadgeStyle}&logoGenreBadgeStyle=\${cfg.logoGenreBadgeStyle}&posterGenreBadgePosition=\${cfg.posterGenreBadgePosition}&backdropGenreBadgePosition=\${cfg.backdropGenreBadgePosition}&logoGenreBadgePosition=\${cfg.logoGenreBadgePosition}&posterGenreBadgeScale=\${cfg.posterGenreBadgeScale}&backdropGenreBadgeScale=\${cfg.backdropGenreBadgeScale}&logoGenreBadgeScale=\${cfg.logoGenreBadgeScale}&streamBadges=\${cfg.streamBadges}&posterStreamBadges=\${cfg.posterStreamBadges}&backdropStreamBadges=\${cfg.backdropStreamBadges}&qualityBadgesSide=\${cfg.qualityBadgesSide}&posterQualityBadgesPosition=\${cfg.posterQualityBadgesPosition}&posterQualityBadges=\${cfg.posterQualityBadges}&backdropQualityBadges=\${cfg.backdropQualityBadges}&qualityBadgesStyle=\${cfg.qualityBadgesStyle}&posterQualityBadgesStyle=\${cfg.posterQualityBadgesStyle}&backdropQualityBadgesStyle=\${cfg.backdropQualityBadgesStyle}&posterQualityBadgesMax=\${cfg.posterQualityBadgesMax}&backdropQualityBadgesMax=\${cfg.backdropQualityBadgesMax}&providerAppearance=\${cfg.providerAppearance}&ratingPresentation=\${cfg.ratingPresentation}&aggregateRatingSource=\${cfg.aggregateRatingSource}&aggregateAccentMode=\${cfg.aggregateAccentMode}&aggregateAccentColor=\${cfg.aggregateAccentColor}&aggregateAccentBarOffset=\${cfg.aggregateAccentBarOffset}&aggregateAccentBarVisible=\${cfg.aggregateAccentBarVisible}&ratingStyle=\${typeRatingStyle}&posterRatingBadgeScale=\${cfg.posterRatingBadgeScale}&backdropRatingBadgeScale=\${cfg.backdropRatingBadgeScale}&logoRatingBadgeScale=\${cfg.logoRatingBadgeScale}&posterQualityBadgeScale=\${cfg.posterQualityBadgeScale}&backdropQualityBadgeScale=\${cfg.backdropQualityBadgeScale}&imageText=\${typeImageText}&posterImageSize=\${cfg.posterImageSize}&posterArtworkSource=\${cfg.posterArtworkSource}&backdropArtworkSource=\${cfg.backdropArtworkSource}&posterRatingsLayout=\${cfg.posterRatingsLayout}&posterRatingsMax=\${cfg.posterRatingsMax}&posterRatingsMaxPerSide=\${cfg.posterRatingsMaxPerSide}&posterEdgeOffset=\${cfg.posterEdgeOffset}&backdropRatingsLayout=\${cfg.backdropRatingsLayout}&backdropRatingsMax=\${cfg.backdropRatingsMax}&posterSideRatingsPosition=\${cfg.posterSideRatingsPosition}&posterSideRatingsOffset=\${cfg.posterSideRatingsOffset}&backdropSideRatingsPosition=\${cfg.backdropSideRatingsPosition}&backdropSideRatingsOffset=\${cfg.backdropSideRatingsOffset}&logoRatingsMax=\${cfg.logoRatingsMax}&logoBackground=\${cfg.logoBackground}&logoArtworkSource=\${cfg.logoArtworkSource}

Omit imageText when type=logo.

Skip any params that are undefined. Keep empty ratings/posterRatings/backdropRatings/logoRatings to disable rating providers. Keep empty posterQualityBadges/backdropQualityBadges to hide quality badges for those types.`;

const subscribeToNothing = () => () => {};

const useClientOrigin = () =>
  useSyncExternalStore(
    subscribeToNothing,
    () => window.location.origin,
    () => ''
  );

type LegacyApiKeyConfigStorage = {
  tmdbKey?: string;
  mdblistKey?: string;
  proxyTmdbKey?: string;
  proxyMdblistKey?: string;
  proxyManifestUrl?: string;
};

function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className={`site-brand-lockup${compact ? ' site-brand-lockup-compact' : ''}`}>
      <span className="site-brand-badge" aria-hidden="true">
        <Image src="/favicon.png" alt="" className="site-brand-logo" width={38} height={38} priority />
      </span>
      <span className="site-brand-copy">
        <span className="site-brand-eyebrow">IbbyLabs</span>
        <span className="site-brand-name">Easy Ratings Database</span>
      </span>
    </Link>
  );
}

function SupportPill({ label = 'support me' }: { label?: string }) {
  return (
    <a
      className="site-support-pill"
      href={BRAND_SUPPORT_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Optional support on Kofi"
      title="Optional support on Kofi"
    >
      <Image
        className="site-support-icon"
        src="/kofi-favicon.png"
        alt=""
        aria-hidden="true"
        width={20}
        height={20}
      />
      <span className="site-support-text">{label}</span>
    </a>
  );
}

function UptimePill({ label = 'IbbyLabs Uptime Tracker' }: { label?: string }) {
  return (
    <a
      className="site-status-pill"
      href={BRAND_UPTIME_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Open IbbyLabs Uptime Tracker page"
      title="Open IbbyLabs Uptime Tracker page"
    >
      <span className="site-status-text">{label}</span>
      <ExternalLink className="site-status-icon" aria-hidden="true" />
    </a>
  );
}

function DeploymentVersionPill({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`erdb-deployment-pill${compact ? ' erdb-deployment-pill-compact' : ''}`}
      aria-label={`Current deployment version ${DEPLOYMENT_VERSION}`}
      title="This is the version currently deployed."
    >
      <Terminal className="erdb-deployment-pill-icon" aria-hidden="true" />
      <span className="erdb-deployment-pill-label font-mono">
        {compact ? 'Live' : 'Current deployment'}
      </span>
      <span className="erdb-deployment-pill-value font-mono">{DEPLOYMENT_VERSION}</span>
    </span>
  );
}

function LatestReleasePill({
  compact = false,
  releaseTag,
  releaseUrl,
  loading,
  pendingTag = '',
}: {
  compact?: boolean;
  releaseTag: string;
  releaseUrl: string;
  loading: boolean;
  pendingTag?: string;
}) {
  const hasPendingRelease = !loading && Boolean(pendingTag);
  const value = loading ? 'Checking' : hasPendingRelease ? pendingTag : releaseTag || 'Unknown';
  const label = loading
    ? compact
      ? 'Latest'
      : 'Latest release'
    : hasPendingRelease
      ? compact
        ? 'Publishing'
        : 'Release publishing'
      : compact
        ? 'Latest'
        : 'Latest release';
  const title = loading
    ? 'Checking GitHub for the latest release.'
    : hasPendingRelease
      ? releaseTag
        ? `${pendingTag} is still publishing. Latest published GitHub release is ${releaseTag}.`
        : `${pendingTag} is still publishing on GitHub.`
      : releaseUrl
      ? `Open ${value} on GitHub`
      : 'Latest GitHub release is unavailable right now.';
  const content = (
    <>
      <Tag className="erdb-release-pill-icon" aria-hidden="true" />
      <span className="erdb-release-pill-label font-mono">{label}</span>
      <span className="erdb-release-pill-value font-mono">{value}</span>
    </>
  );

  if (!hasPendingRelease && releaseUrl) {
    return (
      <a
        className={`erdb-release-pill erdb-release-pill-link${compact ? ' erdb-release-pill-compact' : ''}`}
        href={releaseUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`Latest release version ${value}`}
        title={title}
      >
        {content}
      </a>
    );
  }

  return (
    <span
      className={`erdb-release-pill${hasPendingRelease ? ' erdb-release-pill-pending' : ''}${compact ? ' erdb-release-pill-compact' : ''}`}
      aria-label={`${hasPendingRelease ? 'Release publishing' : 'Latest release version'} ${value}`}
      title={title}
    >
      {content}
    </span>
  );
}

function DiscordPill({ href, label, title }: { href: string; label: string; title: string }) {
  return (
    <a
      className="site-discord-pill"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={title}
      title={title}
    >
      <svg className="site-discord-icon" viewBox="0 0 127.14 96.36" fill="currentColor" aria-hidden="true">
        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.33,46,96.22,53,91.08,65.69,84.69,65.69Z" />
      </svg>
      <span>{label}</span>
    </a>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
}: {
  eyebrow: string;
  title: string;
  description: string;
  align?: 'left' | 'center';
}) {
  return (
    <div className={`erdb-section-header${align === 'center' ? ' erdb-section-header-center' : ''}`}>
      <p className="site-section-eyebrow font-mono">{eyebrow}</p>
      <h2 className="erdb-section-title text-white">{title}</h2>
      <p className="erdb-section-copy text-zinc-400">{description}</p>
    </div>
  );
}

function ConfiguratorAccordionSection({
  title,
  description,
  isOpen,
  onToggle,
  tone = 'default',
  children,
}: {
  title: string;
  description: string;
  isOpen: boolean;
  onToggle: () => void;
  tone?: 'default' | 'accent';
  children: ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border ${
        tone === 'accent'
          ? 'border-violet-500/20 bg-[linear-gradient(180deg,rgba(32,20,54,0.92),rgba(16,10,28,0.98))]'
          : 'border-white/10 bg-black/30'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="mt-1 text-[11px] leading-5 text-zinc-500">{description}</div>
        </div>
        <ChevronRight
          className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${
            isOpen ? 'rotate-90 text-violet-300' : ''
          }`}
        />
      </button>
      {isOpen ? <div className="border-t border-white/10 px-4 py-4">{children}</div> : null}
    </section>
  );
}

const formatCommitTimestamp = (value: string, nowMs: number) => {
  const commitMs = Date.parse(value);
  if (!Number.isFinite(commitMs)) {
    return INVALID_COMMIT_TIMESTAMP_LABEL;
  }
  const deltaSeconds = Math.max(0, Math.floor((nowMs - commitMs) / 1000));
  if (deltaSeconds < 60) {
    return 'just now';
  }
  const deltaMinutes = Math.floor(deltaSeconds / 60);
  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`;
  }
  const deltaHours = Math.floor(deltaMinutes / 60);
  if (deltaHours < 24) {
    return `${deltaHours}h ago`;
  }
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(commitMs);
};

function RecentChanges({
  commits,
  visibleCount,
  onLoadMore,
  loading,
  error,
  nowMs,
}: {
  commits: RecentCommit[];
  visibleCount: number;
  onLoadMore: (next: number) => void;
  loading: boolean;
  error: string;
  nowMs: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLElement | null>(null);
  const visibleCommits = commits.slice(0, visibleCount);
  const hasMore = visibleCount < commits.length;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!panelRef.current || panelRef.current.contains(event.target as Node)) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen]);

  return (
    <div className="erdb-commit-window-wrap">
      {isOpen ? <div className="erdb-commit-window-backdrop" aria-hidden="true" /> : null}
      <button
        type="button"
        className="erdb-commit-window-trigger"
        aria-label="Open recent changes"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        Recent changes
      </button>

      {isOpen ? (
        <section
          ref={panelRef}
          className="erdb-commit-window"
          role="dialog"
          aria-modal="false"
          aria-label="Recent commits"
        >
          <div className="erdb-commit-window-head">
            <h2>Recent Changes</h2>
            <div className="erdb-commit-window-actions">
              <span className="erdb-commit-window-count font-mono">
                {visibleCommits.length}/{commits.length}
              </span>
              <button
                type="button"
                className="erdb-commit-window-close"
                aria-label="Close recent changes"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>
          </div>

          {loading ? (
            <p className="erdb-commit-window-empty font-mono">Loading commits...</p>
          ) : error ? (
            <p className="erdb-commit-window-empty font-mono">{error}</p>
          ) : commits.length === 0 ? (
            <p className="erdb-commit-window-empty font-mono">No recent commits to show.</p>
          ) : (
            <>
              <ol className="erdb-commit-list">
                {visibleCommits.map((commit) => (
                  <li key={commit.hash} className="erdb-commit-item">
                    <div className="erdb-commit-item-head">
                      <span className={`erdb-commit-type erdb-commit-type-${commit.type}`}>
                        {commit.type.toUpperCase()}
                      </span>
                      {commit.isUpstream && (
                        <span className="erdb-commit-type erdb-commit-type-upstream">
                          UPSTREAM
                        </span>
                      )}
                      <span className="erdb-commit-hash font-mono">{commit.shortHash}</span>
                    </div>
                    <p className="erdb-commit-title">{commit.title}</p>
                    {commit.body ? <p className="erdb-commit-body">{commit.body}</p> : null}
                    <p className="erdb-commit-date font-mono">{formatCommitTimestamp(commit.date, nowMs)}</p>
                  </li>
                ))}
              </ol>

              {hasMore ? (
                <button
                  type="button"
                  className="erdb-commit-load-more"
                  onClick={() => onLoadMore(Math.min(visibleCount + COMMIT_PAGE_SIZE, commits.length))}
                >
                  Load 5 more
                </button>
              ) : null}
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}

export default function Home() {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const baseUrl = normalizeBaseUrl(useClientOrigin());
  const [previewType, setPreviewType] = useState<ProxyType>('poster');
  const [mediaId, setMediaId] = useState('tt0133093');
  const [lang, setLang] = useState('en');
  const [posterImageSize, setPosterImageSize] = useState<PosterImageSize>('normal');
  const [posterImageText, setPosterImageText] = useState<PosterImageTextPreference>('clean');
  const [backdropImageText, setBackdropImageText] = useState<BackdropImageTextPreference>('clean');
  const [posterArtworkSource, setPosterArtworkSource] = useState<ArtworkSource>('tmdb');
  const [backdropArtworkSource, setBackdropArtworkSource] = useState<ArtworkSource>('tmdb');
  const [ratingValueMode, setRatingValueMode] = useState<RatingValueMode>(DEFAULT_RATING_VALUE_MODE);
  const [posterGenreBadgeMode, setPosterGenreBadgeMode] =
    useState<GenreBadgeMode>(DEFAULT_GENRE_BADGE_MODE);
  const [backdropGenreBadgeMode, setBackdropGenreBadgeMode] =
    useState<GenreBadgeMode>(DEFAULT_GENRE_BADGE_MODE);
  const [logoGenreBadgeMode, setLogoGenreBadgeMode] =
    useState<GenreBadgeMode>(DEFAULT_GENRE_BADGE_MODE);
  const [posterGenreBadgeStyle, setPosterGenreBadgeStyle] =
    useState<GenreBadgeStyle>(DEFAULT_GENRE_BADGE_STYLE);
  const [backdropGenreBadgeStyle, setBackdropGenreBadgeStyle] =
    useState<GenreBadgeStyle>(DEFAULT_GENRE_BADGE_STYLE);
  const [logoGenreBadgeStyle, setLogoGenreBadgeStyle] =
    useState<GenreBadgeStyle>(DEFAULT_GENRE_BADGE_STYLE);
  const [posterGenreBadgePosition, setPosterGenreBadgePosition] =
    useState<GenreBadgePosition>(DEFAULT_GENRE_BADGE_POSITION);
  const [backdropGenreBadgePosition, setBackdropGenreBadgePosition] =
    useState<GenreBadgePosition>(DEFAULT_GENRE_BADGE_POSITION);
  const [logoGenreBadgePosition, setLogoGenreBadgePosition] =
    useState<GenreBadgePosition>(DEFAULT_GENRE_BADGE_POSITION);
  const [posterGenreBadgeScale, setPosterGenreBadgeScale] =
    useState<number>(DEFAULT_BADGE_SCALE_PERCENT);
  const [backdropGenreBadgeScale, setBackdropGenreBadgeScale] =
    useState<number>(DEFAULT_BADGE_SCALE_PERCENT);
  const [logoGenreBadgeScale, setLogoGenreBadgeScale] =
    useState<number>(DEFAULT_BADGE_SCALE_PERCENT);
  const [posterGenreBadgeAnimeGrouping, setPosterGenreBadgeAnimeGrouping] =
    useState<GenreBadgeAnimeGrouping>(DEFAULT_GENRE_BADGE_ANIME_GROUPING);
  const [backdropGenreBadgeAnimeGrouping, setBackdropGenreBadgeAnimeGrouping] =
    useState<GenreBadgeAnimeGrouping>(DEFAULT_GENRE_BADGE_ANIME_GROUPING);
  const [logoGenreBadgeAnimeGrouping, setLogoGenreBadgeAnimeGrouping] =
    useState<GenreBadgeAnimeGrouping>(DEFAULT_GENRE_BADGE_ANIME_GROUPING);
  const [genrePreviewMode, setGenrePreviewMode] = useState<GenreBadgeMode>(SAMPLE_GENRE_BADGE_MODE_DEFAULT);
  const [posterRatingRows, setPosterRatingRows] = useState<RatingProviderRow[]>(buildDefaultRatingRows);
  const [backdropRatingRows, setBackdropRatingRows] = useState<RatingProviderRow[]>(buildDefaultRatingRows);
  const [logoRatingRows, setLogoRatingRows] = useState<RatingProviderRow[]>(buildDefaultRatingRows);
  const [posterStreamBadges, setPosterStreamBadges] = useState<StreamBadgesSetting>('auto');
  const [backdropStreamBadges, setBackdropStreamBadges] = useState<StreamBadgesSetting>('auto');
  const [qualityBadgesSide, setQualityBadgesSide] = useState<QualityBadgesSide>('left');
  const [posterQualityBadgesPosition, setPosterQualityBadgesPosition] =
    useState<PosterQualityBadgesPosition>('auto');
  const [posterQualityBadgesStyle, setPosterQualityBadgesStyle] = useState<QualityBadgeStyle>(DEFAULT_QUALITY_BADGES_STYLE);
  const [backdropQualityBadgesStyle, setBackdropQualityBadgesStyle] = useState<QualityBadgeStyle>(DEFAULT_QUALITY_BADGES_STYLE);
  const [logoQualityBadgesStyle, setLogoQualityBadgesStyle] = useState<QualityBadgeStyle>(DEFAULT_QUALITY_BADGES_STYLE);
  const [posterQualityBadgePreferences, setPosterQualityBadgePreferences] =
    useState(QUALITY_BADGE_OPTIONS.map((option) => option.id));
  const [backdropQualityBadgePreferences, setBackdropQualityBadgePreferences] =
    useState(QUALITY_BADGE_OPTIONS.map((option) => option.id));
  const [logoQualityBadgePreferences, setLogoQualityBadgePreferences] =
    useState(QUALITY_BADGE_OPTIONS.map((option) => option.id));
  const [posterQualityBadgesMax, setPosterQualityBadgesMax] = useState<number | null>(null);
  const [backdropQualityBadgesMax, setBackdropQualityBadgesMax] = useState<number | null>(null);
  const [logoQualityBadgesMax, setLogoQualityBadgesMax] = useState<number | null>(null);
  const [posterRatingsLayout, setPosterRatingsLayout] = useState<PosterRatingLayout>('bottom');
  const [backdropRatingsLayout, setBackdropRatingsLayout] = useState<BackdropRatingLayout>(DEFAULT_BACKDROP_RATING_LAYOUT);
  const [posterRatingsMax, setPosterRatingsMax] = useState<number | null>(null);
  const [backdropRatingsMax, setBackdropRatingsMax] = useState<number | null>(null);
  const [posterEdgeOffset, setPosterEdgeOffset] =
    useState<number>(DEFAULT_POSTER_EDGE_OFFSET);
  const [posterSideRatingsPosition, setPosterSideRatingsPosition] =
    useState<SideRatingPosition>('top');
  const [posterSideRatingsOffset, setPosterSideRatingsOffset] =
    useState<number>(DEFAULT_SIDE_RATING_OFFSET);
  const [backdropSideRatingsPosition, setBackdropSideRatingsPosition] =
    useState<SideRatingPosition>('top');
  const [backdropSideRatingsOffset, setBackdropSideRatingsOffset] =
    useState<number>(DEFAULT_SIDE_RATING_OFFSET);
  const [posterRatingStyle, setPosterRatingStyle] = useState<RatingStyle>(DEFAULT_RATING_STYLE);
  const [backdropRatingStyle, setBackdropRatingStyle] = useState<RatingStyle>(DEFAULT_RATING_STYLE);
  const [logoRatingStyle, setLogoRatingStyle] = useState<RatingStyle>('plain');
  const [posterRatingBadgeScale, setPosterRatingBadgeScale] =
    useState<number>(DEFAULT_BADGE_SCALE_PERCENT);
  const [backdropRatingBadgeScale, setBackdropRatingBadgeScale] =
    useState<number>(DEFAULT_BADGE_SCALE_PERCENT);
  const [logoRatingBadgeScale, setLogoRatingBadgeScale] =
    useState<number>(DEFAULT_BADGE_SCALE_PERCENT);
  const [posterQualityBadgeScale, setPosterQualityBadgeScale] =
    useState<number>(DEFAULT_BADGE_SCALE_PERCENT);
  const [backdropQualityBadgeScale, setBackdropQualityBadgeScale] =
    useState<number>(DEFAULT_BADGE_SCALE_PERCENT);
  const [logoQualityBadgeScale, setLogoQualityBadgeScale] =
    useState<number>(DEFAULT_BADGE_SCALE_PERCENT);
  const [posterRatingPresentation, setPosterRatingPresentation] =
    useState<RatingPresentation>(DEFAULT_RATING_PRESENTATION);
  const [backdropRatingPresentation, setBackdropRatingPresentation] =
    useState<RatingPresentation>(DEFAULT_RATING_PRESENTATION);
  const [logoRatingPresentation, setLogoRatingPresentation] =
    useState<RatingPresentation>(DEFAULT_RATING_PRESENTATION);
  const [posterAggregateRatingSource, setPosterAggregateRatingSource] =
    useState<AggregateRatingSource>(DEFAULT_AGGREGATE_RATING_SOURCE);
  const [backdropAggregateRatingSource, setBackdropAggregateRatingSource] =
    useState<AggregateRatingSource>(DEFAULT_AGGREGATE_RATING_SOURCE);
  const [logoAggregateRatingSource, setLogoAggregateRatingSource] =
    useState<AggregateRatingSource>(DEFAULT_AGGREGATE_RATING_SOURCE);
  const [aggregateAccentMode, setAggregateAccentMode] =
    useState<AggregateAccentMode>(DEFAULT_AGGREGATE_ACCENT_MODE);
  const [aggregateAccentColor, setAggregateAccentColor] =
    useState<string>(DEFAULT_AGGREGATE_ACCENT_COLOR);
  const [aggregateCriticsAccentColor, setAggregateCriticsAccentColor] =
    useState<string>(AGGREGATE_SOURCE_ACCENT_BY_ID.critics);
  const [aggregateAudienceAccentColor, setAggregateAudienceAccentColor] =
    useState<string>(AGGREGATE_SOURCE_ACCENT_BY_ID.audience);
  const [aggregateAccentBarOffset, setAggregateAccentBarOffset] =
    useState<number>(DEFAULT_AGGREGATE_ACCENT_BAR_OFFSET);
  const [aggregateAccentBarVisible, setAggregateAccentBarVisible] = useState(true);
  const [posterRatingsMaxPerSide, setPosterRatingsMaxPerSide] = useState<number | null>(DEFAULT_POSTER_RATINGS_MAX_PER_SIDE);
  const [logoRatingsMax, setLogoRatingsMax] = useState<number | null>(null);
  const [logoBackground, setLogoBackground] = useState<LogoBackground>('transparent');
  const [logoArtworkSource, setLogoArtworkSource] = useState<ArtworkSource>('tmdb');
  const [ratingProviderAppearanceOverrides, setRatingProviderAppearanceOverrides] =
    useState<RatingProviderAppearanceOverrides>({});
  const [activeProviderEditorId, setActiveProviderEditorId] =
    useState<RatingPreference>('tmdb');
  const [supportedLanguages, setSupportedLanguages] = useState(SUPPORTED_LANGUAGES);
  const [erdbKey, setErdbKey] = useState('');
  const [mdblistKey, setMdblistKey] = useState('');
  const [tmdbKey, setTmdbKey] = useState('');
  const [tmdbIdScope, setTmdbIdScope] = useState<TmdbIdScopeMode>('soft');
  const [fanartKey, setFanartKey] = useState('');
  const [simklClientId, setSimklClientId] = useState('');
  const [proxyManifestUrl, setProxyManifestUrl] = useState('');
  const [proxyTranslateMeta, setProxyTranslateMeta] = useState(false);
  const [proxyTranslateMetaMode, setProxyTranslateMetaMode] =
    useState<MetadataTranslationMode>(DEFAULT_METADATA_TRANSLATION_MODE);
  const [proxyDebugMetaTranslation, setProxyDebugMetaTranslation] = useState(false);
  const [proxyCopied, setProxyCopied] = useState(false);
  const [configCopied, setConfigCopied] = useState(false);
  const [aiometadataCopied, setAiometadataCopied] = useState(false);
  const [baseStructureCopied, setBaseStructureCopied] = useState(false);
  const [showConfigString, setShowConfigString] = useState(false);
  const [showProxyUrl, setShowProxyUrl] = useState(false);
  const [hideAiometadataCredentials, setHideAiometadataCredentials] = useState(true);
  const [posterIdMode, setPosterIdMode] = useState<'auto' | 'tmdb' | 'imdb'>('auto');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [previewErroredForUrl, setPreviewErroredForUrl] = useState('');
  const [previewErrorDetails, setPreviewErrorDetails] = useState('');
  const [recentCommits, setRecentCommits] = useState<RecentCommit[]>([]);
  const [recentCommitsError, setRecentCommitsError] = useState('');
  const [isRecentCommitsLoading, setIsRecentCommitsLoading] = useState(true);
  const [visibleRecentCommitCount, setVisibleRecentCommitCount] = useState(COMMIT_PAGE_SIZE);
  const [latestReleaseTag, setLatestReleaseTag] = useState('');
  const [latestReleaseUrl, setLatestReleaseUrl] = useState('');
  const [pendingReleaseTag, setPendingReleaseTag] = useState('');
  const [isLatestReleaseLoading, setIsLatestReleaseLoading] = useState(true);
  const [nowMs, setNowMs] = useState(Date.now());
  const [savedConfigStatus, setSavedConfigStatus] = useState<
    '' | 'loaded' | 'saved' | 'cleared' | 'imported' | 'preset' | 'error' | 'invalid'
  >('');
  const [configAutoSave, setConfigAutoSave] = useState(false);
  const [stickyPreviewEnabled, setStickyPreviewEnabled] = useState(false);
  const [experienceMode, setExperienceMode] = useState<ConfiguratorExperienceMode>(
    DEFAULT_CONFIGURATOR_EXPERIENCE_MODE,
  );
  const [experienceModeDraft, setExperienceModeDraft] = useState<ConfiguratorExperienceMode>(
    DEFAULT_CONFIGURATOR_EXPERIENCE_MODE,
  );
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [uiSettingsLoaded, setUiSettingsLoaded] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<ConfiguratorPresetId | null>(null);
  const [wizardAnswers, setWizardAnswers] = useState<Partial<ConfiguratorWizardAnswers>>({});
  const [wizardQuestionIndex, setWizardQuestionIndex] = useState(0);
  const [isWizardActive, setIsWizardActive] = useState(false);
  const [openAdvancedSections, setOpenAdvancedSections] = useState<
    AdvancedConfiguratorSectionId[]
  >(DEFAULT_ADVANCED_OPEN_SECTIONS);
  const workspaceImportInputRef = useRef<HTMLInputElement | null>(null);

  const [copied, setCopied] = useState(false);
  const posterRatingPreferences = useMemo(
    () => rowsToEnabledOrdered(posterRatingRows),
    [posterRatingRows]
  );
  const backdropRatingPreferences = useMemo(
    () => rowsToEnabledOrdered(backdropRatingRows),
    [backdropRatingRows]
  );
  const logoRatingPreferences = useMemo(
    () => rowsToEnabledOrdered(logoRatingRows),
    [logoRatingRows]
  );
  const shouldShowPosterQualityBadgesSide = posterRatingsLayout === 'top-bottom';
  const shouldShowPosterQualityBadgesPosition =
    posterRatingsLayout === 'top' || posterRatingsLayout === 'bottom';
  const shouldShowQualityBadgesSide = previewType === 'poster' && shouldShowPosterQualityBadgesSide;
  const shouldShowQualityBadgesPosition =
    previewType === 'poster' && shouldShowPosterQualityBadgesPosition;
  const qualityBadgeTypeLabel =
    previewType === 'backdrop' ? 'Backdrop' : previewType === 'logo' ? 'Logo' : 'Poster';
  const activeStreamBadges = previewType === 'backdrop' ? backdropStreamBadges : posterStreamBadges;
  const setActiveStreamBadges = previewType === 'backdrop' ? setBackdropStreamBadges : setPosterStreamBadges;
  const activeQualityBadgesStyle =
    previewType === 'backdrop'
      ? backdropQualityBadgesStyle
      : previewType === 'logo'
        ? logoQualityBadgesStyle
        : posterQualityBadgesStyle;
  const setActiveQualityBadgesStyle =
    previewType === 'backdrop'
      ? setBackdropQualityBadgesStyle
      : previewType === 'logo'
        ? setLogoQualityBadgesStyle
        : setPosterQualityBadgesStyle;
  const activeQualityBadgesMax =
    previewType === 'backdrop'
      ? backdropQualityBadgesMax
      : previewType === 'logo'
        ? logoQualityBadgesMax
        : posterQualityBadgesMax;
  const setActiveQualityBadgesMax =
    previewType === 'backdrop'
      ? setBackdropQualityBadgesMax
      : previewType === 'logo'
        ? setLogoQualityBadgesMax
        : setPosterQualityBadgesMax;
  const activeQualityBadgePreferences =
    previewType === 'backdrop'
      ? backdropQualityBadgePreferences
      : previewType === 'logo'
        ? logoQualityBadgePreferences
        : posterQualityBadgePreferences;
  const setActiveQualityBadgePreferences =
    previewType === 'backdrop'
      ? setBackdropQualityBadgePreferences
      : previewType === 'logo'
        ? setLogoQualityBadgePreferences
        : setPosterQualityBadgePreferences;
  const activeRatingBadgeScale =
    previewType === 'poster'
      ? posterRatingBadgeScale
      : previewType === 'backdrop'
        ? backdropRatingBadgeScale
        : logoRatingBadgeScale;
  const setActiveRatingBadgeScale =
    previewType === 'poster'
      ? setPosterRatingBadgeScale
      : previewType === 'backdrop'
        ? setBackdropRatingBadgeScale
        : setLogoRatingBadgeScale;
  const activeQualityBadgeScale =
    previewType === 'backdrop'
      ? backdropQualityBadgeScale
      : previewType === 'logo'
        ? logoQualityBadgeScale
        : posterQualityBadgeScale;
  const setActiveQualityBadgeScale =
    previewType === 'backdrop'
      ? setBackdropQualityBadgeScale
      : previewType === 'logo'
        ? setLogoQualityBadgeScale
        : setPosterQualityBadgeScale;
  const activeGenreBadgeMode =
    previewType === 'poster'
      ? posterGenreBadgeMode
      : previewType === 'backdrop'
        ? backdropGenreBadgeMode
        : logoGenreBadgeMode;
  const setActiveGenreBadgeMode =
    previewType === 'poster'
      ? setPosterGenreBadgeMode
      : previewType === 'backdrop'
        ? setBackdropGenreBadgeMode
        : setLogoGenreBadgeMode;
  const activeGenreBadgeStyle =
    previewType === 'poster'
      ? posterGenreBadgeStyle
      : previewType === 'backdrop'
        ? backdropGenreBadgeStyle
        : logoGenreBadgeStyle;
  const setActiveGenreBadgeStyle =
    previewType === 'poster'
      ? setPosterGenreBadgeStyle
      : previewType === 'backdrop'
        ? setBackdropGenreBadgeStyle
        : setLogoGenreBadgeStyle;
  const activeGenreBadgePosition =
    previewType === 'poster'
      ? posterGenreBadgePosition
      : previewType === 'backdrop'
        ? backdropGenreBadgePosition
        : logoGenreBadgePosition;
  const setActiveGenreBadgePosition =
    previewType === 'poster'
      ? setPosterGenreBadgePosition
      : previewType === 'backdrop'
        ? setBackdropGenreBadgePosition
        : setLogoGenreBadgePosition;
  const activeGenreBadgeScale =
    previewType === 'poster'
      ? posterGenreBadgeScale
      : previewType === 'backdrop'
        ? backdropGenreBadgeScale
        : logoGenreBadgeScale;
  const setActiveGenreBadgeScale =
    previewType === 'poster'
      ? setPosterGenreBadgeScale
      : previewType === 'backdrop'
        ? setBackdropGenreBadgeScale
        : setLogoGenreBadgeScale;
  const activeGenreBadgeAnimeGrouping =
    previewType === 'poster'
      ? posterGenreBadgeAnimeGrouping
      : previewType === 'backdrop'
        ? backdropGenreBadgeAnimeGrouping
        : logoGenreBadgeAnimeGrouping;
  const setActiveGenreBadgeAnimeGrouping =
    previewType === 'poster'
      ? setPosterGenreBadgeAnimeGrouping
      : previewType === 'backdrop'
        ? setBackdropGenreBadgeAnimeGrouping
        : setLogoGenreBadgeAnimeGrouping;
  const isNavSticky = useCallback(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    const nav = navRef.current;
    if (!nav) {
      return false;
    }
    return window.getComputedStyle(nav).position === 'sticky';
  }, []);

  const scrollToHash = useCallback((hash: string, behavior: ScrollBehavior = 'smooth') => {
    if (typeof window === 'undefined') return;
    if (!hash || !hash.startsWith('#')) return;
    const target = document.querySelector(hash);
    if (!target) return;
    const navHeight = navRef.current?.getBoundingClientRect().height ?? 0;
    const offset = isNavSticky() ? navHeight + 12 : 16;
    const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);
    window.scrollTo({ top, behavior });
  }, [isNavSticky]);

  const closeMobileNav = useCallback(() => {
    setIsMobileNavOpen(false);
  }, []);

  const handleAnchorClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      const href = event.currentTarget.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      event.preventDefault();
      closeMobileNav();
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', href);
      }
      scrollToHash(href);
    },
    [closeMobileNav, scrollToHash]
  );

  useEffect(() => {
    if (tmdbKey && tmdbKey.length > 10) {
      fetch(`https://api.themoviedb.org/3/configuration/languages?api_key=${tmdbKey}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const formatted = data.map((l: any) => ({
              code: l.iso_639_1,
              label: l.english_name || l.name,
              flag: '🌐'
            })).sort((a, b) => a.label.localeCompare(b.label));
            setSupportedLanguages(formatted);
          }
        })
        .catch(() => { });
    }
  }, [tmdbKey]);

  useEffect(() => {
    const tick = setInterval(() => {
      setNowMs(Date.now());
    }, 60_000);
    return () => {
      clearInterval(tick);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleHashChange = () => scrollToHash(window.location.hash);
    if (window.location.hash) {
      requestAnimationFrame(() => scrollToHash(window.location.hash, 'auto'));
    }
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [scrollToHash]);

  useEffect(() => {
    if (!isMobileNavOpen || typeof window === 'undefined') {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const nav = navRef.current;
      if (nav && event.target instanceof Node && !nav.contains(event.target)) {
        setIsMobileNavOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileNavOpen(false);
      }
    };
    const handleViewportChange = () => {
      if (window.innerWidth > 860) {
        setIsMobileNavOpen(false);
      }
    };
    const handleScroll = () => {
      setIsMobileNavOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMobileNavOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const page = pageRef.current;
    const hero = heroRef.current;
    const nav = navRef.current;
    if (!page || !hero || !nav) {
      return;
    }

    let frame = 0;
    let navResizeObserver: ResizeObserver | null = null;

    const updateCompactProgress = () => {
      frame = 0;
      const navIsSticky = isNavSticky();
      const maxDistance = Math.max(180, Math.min(320, hero.offsetHeight * 0.45));
      const shouldCompactNav = navIsSticky && window.innerWidth < 861;
      const progress = shouldCompactNav
        ? Math.min(1, Math.max(0, window.scrollY / maxDistance))
        : 0;
      page.style.setProperty('--scroll-compact-progress', progress.toFixed(3));
      page.dataset.compactNav = shouldCompactNav && progress > 0.04 ? 'true' : 'false';
      page.style.setProperty(
        '--workspace-sticky-top',
        `${Math.ceil((navRef.current ?? nav).getBoundingClientRect().height + 16)}px`,
      );
    };

    const queueUpdate = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(updateCompactProgress);
    };

    updateCompactProgress();
    window.addEventListener('scroll', queueUpdate, { passive: true });
    window.addEventListener('resize', queueUpdate);
    if (typeof ResizeObserver !== 'undefined') {
      navResizeObserver = new ResizeObserver(queueUpdate);
      navResizeObserver.observe(nav);
    }

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      navResizeObserver?.disconnect();
      window.removeEventListener('scroll', queueUpdate);
      window.removeEventListener('resize', queueUpdate);
      page.style.removeProperty('--scroll-compact-progress');
      page.style.removeProperty('--workspace-sticky-top');
      delete page.dataset.compactNav;
    };
  }, [isNavSticky]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const loadRecentCommits = async () => {
      setIsRecentCommitsLoading(true);
      try {
        const url = new URL(COMMIT_FEED_URL, window.location.origin);
        url.searchParams.set('_ts', String(Date.now()));
        const response = await fetch(url.toString(), {
          signal: controller.signal,
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        if (!response.ok) {
          throw new Error(`Commit feed unavailable (${response.status})`);
        }
        const payload = await response.json();
        const commits = Array.isArray(payload?.commits)
          ? payload.commits
              .filter((entry: any) => entry && typeof entry === 'object')
              .map((entry: any) => ({
                hash: String(entry.hash || ''),
                shortHash: String(entry.shortHash || '').slice(0, 7),
                date: String(entry.date || ''),
                type: String(entry.type || 'chore') as RecentCommitType,
                title: String(entry.title || ''),
                body: entry.body ? String(entry.body) : null,
                isUpstream: Boolean(entry.isUpstream),
              }))
              .filter((entry: RecentCommit) => entry.hash && entry.shortHash && entry.title)
          : [];

        if (!active) {
          return;
        }
        setRecentCommits(commits);
        setVisibleRecentCommitCount(COMMIT_PAGE_SIZE);
        setRecentCommitsError('');
      } catch (error: any) {
        if (!active || error?.name === 'AbortError') {
          return;
        }
        setRecentCommits([]);
        setVisibleRecentCommitCount(COMMIT_PAGE_SIZE);
        setRecentCommitsError('Recent changes are unavailable right now.');
      } finally {
        if (active) {
          setIsRecentCommitsLoading(false);
        }
      }
    };

    loadRecentCommits();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const loadLatestRelease = async () => {
      setIsLatestReleaseLoading(true);
      try {
        const url = new URL(LATEST_RELEASE_FEED_URL, window.location.origin);
        const response = await fetch(url.toString(), {
          signal: controller.signal,
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        if (!response.ok) {
          throw new Error(`Latest release feed unavailable (${response.status})`);
        }
        const payload = await response.json();
        const nextTag = typeof payload?.tagName === 'string' ? payload.tagName.trim() : '';
        const nextUrl = typeof payload?.url === 'string' ? payload.url.trim() : '';
        const nextPendingTag = typeof payload?.pendingTagName === 'string' ? payload.pendingTagName.trim() : '';

        if (!active) {
          return;
        }

        setLatestReleaseTag(nextTag);
        setLatestReleaseUrl(nextUrl);
        setPendingReleaseTag(nextPendingTag);
      } catch (error: any) {
        if (!active || error?.name === 'AbortError') {
          return;
        }

        setLatestReleaseTag('');
        setLatestReleaseUrl('');
        setPendingReleaseTag('');
      } finally {
        if (active) {
          setIsLatestReleaseLoading(false);
        }
      }
    };

    loadLatestRelease();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const applySavedUiConfig = useCallback(
    (config: SavedUiConfig, status: 'loaded' | 'imported' | 'preset' = 'loaded') => {
      const normalized = normalizeSavedUiConfig(config);

      setErdbKey(normalized.settings.erdbKey);
      setTmdbKey(normalized.settings.tmdbKey);
      setTmdbIdScope(normalized.settings.tmdbIdScope);
      setMdblistKey(normalized.settings.mdblistKey);
      setFanartKey(normalized.settings.fanartKey);
      setSimklClientId(normalized.settings.simklClientId);
      setLang(normalized.settings.lang);
      setPosterImageSize(normalized.settings.posterImageSize);
      setPosterImageText(normalized.settings.posterImageText);
      setBackdropImageText(normalized.settings.backdropImageText);
      setPosterArtworkSource(normalized.settings.posterArtworkSource);
      setBackdropArtworkSource(normalized.settings.backdropArtworkSource);
      setRatingValueMode(normalized.settings.ratingValueMode);
      setPosterGenreBadgeMode(normalized.settings.posterGenreBadgeMode);
      setBackdropGenreBadgeMode(normalized.settings.backdropGenreBadgeMode);
      setLogoGenreBadgeMode(normalized.settings.logoGenreBadgeMode);
      setPosterGenreBadgeStyle(normalized.settings.posterGenreBadgeStyle);
      setBackdropGenreBadgeStyle(normalized.settings.backdropGenreBadgeStyle);
      setLogoGenreBadgeStyle(normalized.settings.logoGenreBadgeStyle);
      setPosterGenreBadgePosition(normalized.settings.posterGenreBadgePosition);
      setBackdropGenreBadgePosition(normalized.settings.backdropGenreBadgePosition);
      setLogoGenreBadgePosition(normalized.settings.logoGenreBadgePosition);
      setPosterGenreBadgeScale(normalized.settings.posterGenreBadgeScale);
      setBackdropGenreBadgeScale(normalized.settings.backdropGenreBadgeScale);
      setLogoGenreBadgeScale(normalized.settings.logoGenreBadgeScale);
      setPosterGenreBadgeAnimeGrouping(normalized.settings.posterGenreBadgeAnimeGrouping);
      setBackdropGenreBadgeAnimeGrouping(normalized.settings.backdropGenreBadgeAnimeGrouping);
      setLogoGenreBadgeAnimeGrouping(normalized.settings.logoGenreBadgeAnimeGrouping);
      setPosterRatingRows(enabledOrderedToRows(normalized.settings.posterRatingPreferences));
      setBackdropRatingRows(enabledOrderedToRows(normalized.settings.backdropRatingPreferences));
      setLogoRatingRows(enabledOrderedToRows(normalized.settings.logoRatingPreferences));
      setPosterStreamBadges(normalized.settings.posterStreamBadges);
      setBackdropStreamBadges(normalized.settings.backdropStreamBadges);
      setQualityBadgesSide(normalized.settings.qualityBadgesSide);
      setPosterQualityBadgesPosition(normalized.settings.posterQualityBadgesPosition);
      setPosterQualityBadgePreferences(normalized.settings.posterQualityBadgePreferences);
      setBackdropQualityBadgePreferences(normalized.settings.backdropQualityBadgePreferences);
      setLogoQualityBadgePreferences(normalized.settings.logoQualityBadgePreferences);
      setPosterQualityBadgesStyle(normalized.settings.posterQualityBadgesStyle);
      setBackdropQualityBadgesStyle(normalized.settings.backdropQualityBadgesStyle);
      setLogoQualityBadgesStyle(normalized.settings.logoQualityBadgesStyle);
      setPosterQualityBadgesMax(normalized.settings.posterQualityBadgesMax);
      setBackdropQualityBadgesMax(normalized.settings.backdropQualityBadgesMax);
      setLogoQualityBadgesMax(normalized.settings.logoQualityBadgesMax);
      setPosterRatingsLayout(normalized.settings.posterRatingsLayout);
      setBackdropRatingsLayout(normalized.settings.backdropRatingsLayout);
      setPosterRatingsMax(normalized.settings.posterRatingsMax);
      setBackdropRatingsMax(normalized.settings.backdropRatingsMax);
      setPosterEdgeOffset(normalized.settings.posterEdgeOffset);
      setPosterSideRatingsPosition(normalized.settings.posterSideRatingsPosition);
      setPosterSideRatingsOffset(normalized.settings.posterSideRatingsOffset);
      setBackdropSideRatingsPosition(normalized.settings.backdropSideRatingsPosition);
      setBackdropSideRatingsOffset(normalized.settings.backdropSideRatingsOffset);
      setPosterRatingStyle(normalized.settings.posterRatingStyle);
      setBackdropRatingStyle(normalized.settings.backdropRatingStyle);
      setLogoRatingStyle(normalized.settings.logoRatingStyle);
      setPosterRatingBadgeScale(normalized.settings.posterRatingBadgeScale);
      setBackdropRatingBadgeScale(normalized.settings.backdropRatingBadgeScale);
      setLogoRatingBadgeScale(normalized.settings.logoRatingBadgeScale);
      setPosterQualityBadgeScale(normalized.settings.posterQualityBadgeScale);
      setBackdropQualityBadgeScale(normalized.settings.backdropQualityBadgeScale);
      setLogoQualityBadgeScale(normalized.settings.logoQualityBadgeScale);
      setPosterRatingPresentation(normalized.settings.posterRatingPresentation);
      setBackdropRatingPresentation(normalized.settings.backdropRatingPresentation);
      setLogoRatingPresentation(normalized.settings.logoRatingPresentation);
      setPosterAggregateRatingSource(normalized.settings.posterAggregateRatingSource);
      setBackdropAggregateRatingSource(normalized.settings.backdropAggregateRatingSource);
      setLogoAggregateRatingSource(normalized.settings.logoAggregateRatingSource);
      setAggregateAccentMode(normalized.settings.aggregateAccentMode);
      setAggregateAccentColor(normalized.settings.aggregateAccentColor);
      setAggregateCriticsAccentColor(normalized.settings.aggregateCriticsAccentColor);
      setAggregateAudienceAccentColor(normalized.settings.aggregateAudienceAccentColor);
      setAggregateAccentBarOffset(normalized.settings.aggregateAccentBarOffset);
      setAggregateAccentBarVisible(normalized.settings.aggregateAccentBarVisible);
      setPosterRatingsMaxPerSide(normalized.settings.posterRatingsMaxPerSide);
      setLogoRatingsMax(normalized.settings.logoRatingsMax);
      setLogoBackground(normalized.settings.logoBackground);
      setLogoArtworkSource(normalized.settings.logoArtworkSource);
      setRatingProviderAppearanceOverrides(normalized.settings.ratingProviderAppearanceOverrides);
      setProxyManifestUrl(normalized.proxy.manifestUrl);
      setProxyTranslateMeta(normalized.proxy.translateMeta);
      setProxyTranslateMetaMode(normalized.proxy.translateMetaMode);
      setProxyDebugMetaTranslation(normalized.proxy.debugMetaTranslation);
      setSavedConfigStatus(status);
    },
    []
  );

  const buildCurrentUiConfig = useCallback(
    (): SavedUiConfig => ({
      version: 1,
      settings: {
        erdbKey: erdbKey.trim(),
        tmdbKey: tmdbKey.trim(),
        tmdbIdScope,
        mdblistKey: mdblistKey.trim(),
        fanartKey: fanartKey.trim(),
        simklClientId: simklClientId.trim(),
        lang,
        posterImageSize,
        posterImageText,
        backdropImageText,
        posterArtworkSource,
        backdropArtworkSource,
        ratingValueMode,
        posterGenreBadgeMode,
        backdropGenreBadgeMode,
        logoGenreBadgeMode,
        posterGenreBadgeStyle,
        backdropGenreBadgeStyle,
        logoGenreBadgeStyle,
        posterGenreBadgePosition,
        backdropGenreBadgePosition,
        logoGenreBadgePosition,
        posterGenreBadgeScale,
        backdropGenreBadgeScale,
        logoGenreBadgeScale,
        posterGenreBadgeAnimeGrouping,
        backdropGenreBadgeAnimeGrouping,
        logoGenreBadgeAnimeGrouping,
        posterRatingPreferences,
        backdropRatingPreferences,
        logoRatingPreferences,
        posterStreamBadges,
        backdropStreamBadges,
        qualityBadgesSide,
        posterQualityBadgesPosition,
        posterQualityBadgePreferences,
        backdropQualityBadgePreferences,
        logoQualityBadgePreferences,
        posterQualityBadgesStyle,
        backdropQualityBadgesStyle,
        logoQualityBadgesStyle,
        posterQualityBadgesMax,
        backdropQualityBadgesMax,
        logoQualityBadgesMax,
        posterRatingsLayout,
        backdropRatingsLayout,
        posterRatingsMax,
        backdropRatingsMax,
        posterEdgeOffset,
        posterSideRatingsPosition,
        posterSideRatingsOffset,
        backdropSideRatingsPosition,
        backdropSideRatingsOffset,
        sideRatingsPosition: posterSideRatingsPosition,
        sideRatingsOffset: posterSideRatingsOffset,
        posterRatingStyle,
        backdropRatingStyle,
        logoRatingStyle,
        posterRatingBadgeScale,
        backdropRatingBadgeScale,
        logoRatingBadgeScale,
        posterQualityBadgeScale,
        backdropQualityBadgeScale,
        logoQualityBadgeScale,
        posterRatingPresentation,
        backdropRatingPresentation,
        logoRatingPresentation,
        posterAggregateRatingSource,
        backdropAggregateRatingSource,
        logoAggregateRatingSource,
        aggregateAccentMode,
        aggregateAccentColor,
        aggregateCriticsAccentColor,
        aggregateAudienceAccentColor,
        aggregateAccentBarOffset,
        aggregateAccentBarVisible,
        posterRatingsMaxPerSide,
        logoRatingsMax,
        logoBackground,
        logoArtworkSource,
        ratingProviderAppearanceOverrides,
      },
      proxy: {
        manifestUrl: normalizeManifestUrl(proxyManifestUrl, true),
        translateMeta: proxyTranslateMeta,
        translateMetaMode: proxyTranslateMetaMode,
        debugMetaTranslation: proxyDebugMetaTranslation,
      },
    }),
    [
      erdbKey,
      tmdbKey,
      tmdbIdScope,
      mdblistKey,
      fanartKey,
      simklClientId,
      lang,
      posterImageSize,
      posterImageText,
      backdropImageText,
      posterArtworkSource,
      backdropArtworkSource,
      ratingValueMode,
      posterGenreBadgeMode,
      backdropGenreBadgeMode,
      logoGenreBadgeMode,
      posterGenreBadgeStyle,
      backdropGenreBadgeStyle,
      logoGenreBadgeStyle,
      posterGenreBadgePosition,
      backdropGenreBadgePosition,
      logoGenreBadgePosition,
      posterGenreBadgeScale,
      backdropGenreBadgeScale,
      logoGenreBadgeScale,
      posterGenreBadgeAnimeGrouping,
      backdropGenreBadgeAnimeGrouping,
      logoGenreBadgeAnimeGrouping,
      posterRatingPreferences,
      backdropRatingPreferences,
      logoRatingPreferences,
      posterStreamBadges,
      backdropStreamBadges,
      qualityBadgesSide,
      posterQualityBadgesPosition,
      posterQualityBadgePreferences,
      backdropQualityBadgePreferences,
      logoQualityBadgePreferences,
      posterQualityBadgesStyle,
      backdropQualityBadgesStyle,
      logoQualityBadgesStyle,
      posterQualityBadgesMax,
      backdropQualityBadgesMax,
      logoQualityBadgesMax,
      posterRatingsLayout,
      backdropRatingsLayout,
      posterRatingsMax,
      backdropRatingsMax,
      posterEdgeOffset,
      posterSideRatingsPosition,
      posterSideRatingsOffset,
      backdropSideRatingsPosition,
      backdropSideRatingsOffset,
      posterRatingStyle,
      backdropRatingStyle,
      logoRatingStyle,
      posterRatingBadgeScale,
      backdropRatingBadgeScale,
      logoRatingBadgeScale,
      posterQualityBadgeScale,
      backdropQualityBadgeScale,
      logoQualityBadgeScale,
      posterRatingPresentation,
      backdropRatingPresentation,
      logoRatingPresentation,
      posterAggregateRatingSource,
      backdropAggregateRatingSource,
      logoAggregateRatingSource,
      aggregateAccentMode,
      aggregateAccentColor,
      aggregateCriticsAccentColor,
      aggregateAudienceAccentColor,
      aggregateAccentBarOffset,
      aggregateAccentBarVisible,
      posterRatingsMaxPerSide,
      logoRatingsMax,
      logoBackground,
      logoArtworkSource,
      ratingProviderAppearanceOverrides,
      proxyManifestUrl,
      proxyTranslateMeta,
      proxyTranslateMetaMode,
      proxyDebugMetaTranslation,
    ]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const settingsRaw =
        window.localStorage.getItem(UI_CONFIG_SETTINGS_STORAGE_KEY) ||
        window.localStorage.getItem(LEGACY_API_KEY_CONFIG_SETTINGS_STORAGE_KEY);
      if (settingsRaw) {
        const settings = JSON.parse(settingsRaw) as LocalUiSettingsStorage;
        setConfigAutoSave(Boolean(settings.autoSave));
        setStickyPreviewEnabled(Boolean(settings.stickyPreview));
        if (isConfiguratorExperienceMode(settings.experienceMode)) {
          setExperienceMode(settings.experienceMode);
          setExperienceModeDraft(settings.experienceMode);
          setShowExperienceModal(false);
        } else {
          setShowExperienceModal(true);
        }
        if (isConfiguratorPresetId(settings.presetId)) {
          setSelectedPresetId(settings.presetId);
        }
      } else {
        setShowExperienceModal(true);
      }

      const raw = window.localStorage.getItem(UI_CONFIG_STORAGE_KEY);
      if (raw) {
        const parsed = parseSavedUiConfig(raw);
        if (!parsed) {
          setSavedConfigStatus('error');
          setUiSettingsLoaded(true);
          return;
        }
        applySavedUiConfig(parsed, 'loaded');
        setUiSettingsLoaded(true);
        return;
      }

      const legacyRaw = window.localStorage.getItem(LEGACY_API_KEY_CONFIG_STORAGE_KEY);
      if (!legacyRaw) {
        setUiSettingsLoaded(true);
        return;
      }

      const legacy = JSON.parse(legacyRaw) as LegacyApiKeyConfigStorage;
      applySavedUiConfig(
        normalizeSavedUiConfig({
          version: 1,
          settings: {
            tmdbKey:
              typeof legacy.tmdbKey === 'string' && legacy.tmdbKey.trim()
                ? legacy.tmdbKey
                : typeof legacy.proxyTmdbKey === 'string'
                  ? legacy.proxyTmdbKey
                  : '',
            mdblistKey:
              typeof legacy.mdblistKey === 'string' && legacy.mdblistKey.trim()
                ? legacy.mdblistKey
                : typeof legacy.proxyMdblistKey === 'string'
                  ? legacy.proxyMdblistKey
                  : '',
          },
          proxy: {
            manifestUrl:
              typeof legacy.proxyManifestUrl === 'string' ? legacy.proxyManifestUrl : '',
          },
        }),
        'loaded'
      );
      setUiSettingsLoaded(true);
    } catch {
      setSavedConfigStatus('error');
      setUiSettingsLoaded(true);
    }
  }, [applySavedUiConfig]);

  const persistUiConfig = useCallback((showSavedStatus = true) => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(UI_CONFIG_STORAGE_KEY, serializeSavedUiConfig(buildCurrentUiConfig()));
      if (showSavedStatus) {
        setSavedConfigStatus('saved');
      }
    } catch {
      setSavedConfigStatus('error');
    }
  }, [buildCurrentUiConfig]);

  useEffect(() => {
    if (!configAutoSave) {
      return;
    }
    persistUiConfig(false);
  }, [configAutoSave, buildCurrentUiConfig, persistUiConfig]);

  useEffect(() => {
    if (typeof window === 'undefined' || !uiSettingsLoaded) {
      return;
    }

    try {
      const payload: LocalUiSettingsStorage = {
        autoSave: configAutoSave,
        stickyPreview: stickyPreviewEnabled,
        experienceMode,
        presetId: selectedPresetId,
      };
      window.localStorage.setItem(UI_CONFIG_SETTINGS_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      setSavedConfigStatus('error');
    }
  }, [configAutoSave, stickyPreviewEnabled, experienceMode, selectedPresetId, uiSettingsLoaded]);

  const handleCopyPrompt = useCallback(() => {
    navigator.clipboard.writeText(AI_DEVELOPER_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const previewUrl = useMemo(() => {
    const normalizedErdbKey = erdbKey.trim();
    const normalizedTmdbKey = tmdbKey.trim();
    const normalizedFanartKey = fanartKey.trim();
    const normalizedMediaId = mediaId.trim();
    if (!baseUrl || !normalizedTmdbKey || !normalizedMediaId) {
      return '';
    }

    const ratingPreferencesForType =
      previewType === 'poster'
        ? posterRatingPreferences
        : previewType === 'backdrop'
          ? backdropRatingPreferences
          : logoRatingPreferences;
    const ratingsQuery = stringifyRatingPreferencesAllowEmpty(ratingPreferencesForType);
    const ratingStyleForType =
      previewType === 'poster'
        ? posterRatingStyle
        : previewType === 'backdrop'
          ? backdropRatingStyle
          : logoRatingStyle;
    const ratingPresentationForType =
      previewType === 'poster'
        ? posterRatingPresentation
        : previewType === 'backdrop'
          ? backdropRatingPresentation
          : logoRatingPresentation;
    const aggregateRatingSourceForType =
      previewType === 'poster'
        ? posterAggregateRatingSource
        : previewType === 'backdrop'
          ? backdropAggregateRatingSource
          : logoAggregateRatingSource;
    const imageTextForType = previewType === 'backdrop' ? backdropImageText : posterImageText;
    const streamBadgesForType = previewType === 'backdrop' ? backdropStreamBadges : posterStreamBadges;
    const qualityBadgesStyleForType =
      previewType === 'backdrop'
        ? backdropQualityBadgesStyle
        : previewType === 'logo'
          ? logoQualityBadgesStyle
          : posterQualityBadgesStyle;
    const qualityBadgePreferencesForType =
      previewType === 'backdrop'
        ? backdropQualityBadgePreferences
        : previewType === 'logo'
          ? logoQualityBadgePreferences
          : posterQualityBadgePreferences;
    const ratingBadgeScaleForType =
      previewType === 'poster'
        ? posterRatingBadgeScale
        : previewType === 'backdrop'
          ? backdropRatingBadgeScale
          : logoRatingBadgeScale;
    const qualityBadgeScaleForType =
      previewType === 'backdrop'
        ? backdropQualityBadgeScale
        : previewType === 'logo'
          ? logoQualityBadgeScale
          : posterQualityBadgeScale;
    const ratingsMaxForType =
      previewType === 'poster'
        ? posterRatingsMax
        : previewType === 'backdrop'
          ? backdropRatingsMax
          : logoRatingsMax;
    const query = new URLSearchParams({
      ratingStyle: ratingStyleForType,
      lang,
    });
    if (normalizedErdbKey) {
      query.set('erdbKey', normalizedErdbKey);
    }
    if (ratingValueMode !== DEFAULT_RATING_VALUE_MODE) {
      query.set('ratingValueMode', ratingValueMode);
    }
    appendGenreBadgeQueryParams({
      query,
      type: previewType,
      mode: activeGenreBadgeMode,
      style: activeGenreBadgeStyle,
      position: activeGenreBadgePosition,
      scale: activeGenreBadgeScale,
      animeGrouping: activeGenreBadgeAnimeGrouping,
    });
    if (ratingPresentationForType !== DEFAULT_RATING_PRESENTATION) {
      query.set(
        previewType === 'poster'
          ? 'posterRatingPresentation'
          : previewType === 'backdrop'
            ? 'backdropRatingPresentation'
            : 'logoRatingPresentation',
        ratingPresentationForType
      );
    }
    if (aggregateRatingSourceForType !== DEFAULT_AGGREGATE_RATING_SOURCE) {
      query.set(
        previewType === 'poster'
          ? 'posterAggregateRatingSource'
          : previewType === 'backdrop'
            ? 'backdropAggregateRatingSource'
            : 'logoAggregateRatingSource',
        aggregateRatingSourceForType
      );
    }
    if (
      usesAggregateRatingPresentation(ratingPresentationForType) &&
      aggregateAccentMode !== DEFAULT_AGGREGATE_ACCENT_MODE
    ) {
      query.set('aggregateAccentMode', aggregateAccentMode);
    }
    if (
      usesAggregateRatingPresentation(ratingPresentationForType) &&
      (aggregateAccentMode === 'custom' ||
        aggregateAccentColor !== DEFAULT_AGGREGATE_ACCENT_COLOR)
    ) {
      query.set('aggregateAccentColor', aggregateAccentColor);
    }
    if (
      usesAggregateRatingPresentation(ratingPresentationForType) &&
      (aggregateAccentMode === 'custom' ||
        aggregateCriticsAccentColor !== AGGREGATE_SOURCE_ACCENT_BY_ID.critics)
    ) {
      query.set('aggregateCriticsAccentColor', aggregateCriticsAccentColor);
    }
    if (
      usesAggregateRatingPresentation(ratingPresentationForType) &&
      (aggregateAccentMode === 'custom' ||
        aggregateAudienceAccentColor !== AGGREGATE_SOURCE_ACCENT_BY_ID.audience)
    ) {
      query.set('aggregateAudienceAccentColor', aggregateAudienceAccentColor);
    }
    if (
      usesAggregateAccentBar(ratingPresentationForType) &&
      aggregateAccentBarOffset !== DEFAULT_AGGREGATE_ACCENT_BAR_OFFSET
    ) {
      query.set('aggregateAccentBarOffset', String(aggregateAccentBarOffset));
    }
    if (usesAggregateAccentBar(ratingPresentationForType) && !aggregateAccentBarVisible) {
      query.set('aggregateAccentBarVisible', 'false');
    }
    if (previewType === 'poster') {
      query.set('posterRatings', ratingsQuery);
    } else if (previewType === 'backdrop') {
      query.set('backdropRatings', ratingsQuery);
    } else {
      query.set('logoRatings', ratingsQuery);
    }
    if (previewType !== 'logo' && streamBadgesForType !== 'auto') {
      query.set(previewType === 'backdrop' ? 'backdropStreamBadges' : 'posterStreamBadges', streamBadgesForType);
    }
    if (shouldShowQualityBadgesSide && qualityBadgesSide !== 'left') {
      query.set('qualityBadgesSide', qualityBadgesSide);
    }
    if (shouldShowQualityBadgesPosition && posterQualityBadgesPosition !== 'auto') {
      query.set('posterQualityBadgesPosition', posterQualityBadgesPosition);
    }
    if (qualityBadgesStyleForType !== DEFAULT_QUALITY_BADGES_STYLE) {
      query.set(
        previewType === 'backdrop'
          ? 'backdropQualityBadgesStyle'
          : previewType === 'logo'
            ? 'logoQualityBadgesStyle'
            : 'posterQualityBadgesStyle',
        qualityBadgesStyleForType
      );
    }
    query.set(
      previewType === 'backdrop'
        ? 'backdropQualityBadges'
        : previewType === 'logo'
          ? 'logoQualityBadges'
          : 'posterQualityBadges',
      qualityBadgePreferencesForType.join(','),
    );
    if (activeQualityBadgesMax !== null) {
      query.set(
        previewType === 'backdrop'
          ? 'backdropQualityBadgesMax'
          : previewType === 'logo'
            ? 'logoQualityBadgesMax'
            : 'posterQualityBadgesMax',
        String(activeQualityBadgesMax)
      );
    }

    if (mdblistKey) {
      query.set('mdblistKey', mdblistKey);
    }
    if (simklClientId.trim()) {
      query.set('simklClientId', simklClientId.trim());
    }
    query.set('tmdbKey', normalizedTmdbKey);
    if (tmdbIdScope !== 'soft') {
      query.set('tmdbIdScope', tmdbIdScope);
    }
    const shouldSendFanartKey =
      (previewType === 'poster' &&
        (posterArtworkSource === 'fanart' || posterArtworkSource === 'random')) ||
      (previewType === 'backdrop' &&
        (backdropArtworkSource === 'fanart' || backdropArtworkSource === 'random')) ||
      (previewType === 'logo' &&
        (logoArtworkSource === 'fanart' || logoArtworkSource === 'random'));
    if (normalizedFanartKey && shouldSendFanartKey) {
      query.set('fanartKey', normalizedFanartKey);
    }

    if (previewType === 'poster' || previewType === 'backdrop') {
      query.set('imageText', imageTextForType);
      if (previewType === 'poster' && posterImageSize !== 'normal') {
        query.set('posterImageSize', posterImageSize);
      }
      if (previewType === 'poster' && posterArtworkSource !== 'tmdb') {
        query.set('posterArtworkSource', posterArtworkSource);
      }
      if (previewType === 'backdrop' && backdropArtworkSource !== 'tmdb') {
        query.set('backdropArtworkSource', backdropArtworkSource);
      }
    }
    if (previewType === 'poster') {
      query.set('posterRatingsLayout', posterRatingsLayout);
      if (ratingsMaxForType !== null) {
        query.set('posterRatingsMax', String(ratingsMaxForType));
      }
      if (isVerticalPosterRatingLayout(posterRatingsLayout) && posterRatingsMaxPerSide !== null) {
        query.set('posterRatingsMaxPerSide', String(posterRatingsMaxPerSide));
      }
      if (posterEdgeOffset !== DEFAULT_POSTER_EDGE_OFFSET) {
        query.set('posterEdgeOffset', String(posterEdgeOffset));
      }
    } else if (previewType === 'backdrop') {
      query.set('backdropRatingsLayout', backdropRatingsLayout);
      if (ratingsMaxForType !== null) {
        query.set('backdropRatingsMax', String(ratingsMaxForType));
      }
    } else {
      if (ratingsMaxForType !== null) {
        query.set('logoRatingsMax', String(ratingsMaxForType));
      }
      if (logoBackground !== 'transparent') {
        query.set('logoBackground', logoBackground);
      }
      if (logoArtworkSource !== 'tmdb') {
        query.set('logoArtworkSource', logoArtworkSource);
      }
    }
    if (ratingBadgeScaleForType !== DEFAULT_BADGE_SCALE_PERCENT) {
      query.set(
        previewType === 'poster'
          ? 'posterRatingBadgeScale'
          : previewType === 'backdrop'
            ? 'backdropRatingBadgeScale'
            : 'logoRatingBadgeScale',
        String(ratingBadgeScaleForType),
      );
    }
    if (qualityBadgeScaleForType !== DEFAULT_BADGE_SCALE_PERCENT) {
      query.set(
        previewType === 'backdrop'
          ? 'backdropQualityBadgeScale'
          : previewType === 'logo'
            ? 'logoQualityBadgeScale'
            : 'posterQualityBadgeScale',
        String(qualityBadgeScaleForType),
      );
    }
    const activeProviderAppearance = Object.fromEntries(
      Object.entries(ratingProviderAppearanceOverrides).filter(([, override]) => Boolean(override)),
    );
    if (Object.keys(activeProviderAppearance).length > 0) {
      query.set('providerAppearance', JSON.stringify(activeProviderAppearance));
    }
    const usesVerticalSideRatings =
      (previewType === 'poster' &&
        (isVerticalPosterRatingLayout(posterRatingsLayout) ||
          posterRatingPresentation === 'blockbuster')) ||
      (previewType === 'backdrop' &&
        (backdropRatingsLayout === 'right-vertical' ||
          backdropRatingPresentation === 'blockbuster'));
    if (usesVerticalSideRatings) {
      const activeSidePosition = previewType === 'backdrop' ? backdropSideRatingsPosition : posterSideRatingsPosition;
      const activeSideOffset = previewType === 'backdrop' ? backdropSideRatingsOffset : posterSideRatingsOffset;
      if (activeSidePosition !== 'top') {
        const positionParam = previewType === 'poster' ? 'posterSideRatingsPosition' : 'backdropSideRatingsPosition';
        const offsetParam = previewType === 'poster' ? 'posterSideRatingsOffset' : 'backdropSideRatingsOffset';
        query.set(positionParam, activeSidePosition);
        if (activeSidePosition === 'custom') {
          query.set(offsetParam, String(activeSideOffset));
        }
      }
    }

    return `${baseUrl}/${previewType}/${normalizedMediaId}.jpg?${query.toString()}`;
  }, [
    previewType,
    mediaId,
    lang,
    posterImageSize,
    posterImageText,
    backdropImageText,
    posterArtworkSource,
    backdropArtworkSource,
    ratingValueMode,
    activeGenreBadgeMode,
    activeGenreBadgeStyle,
    activeGenreBadgePosition,
    activeGenreBadgeScale,
    activeGenreBadgeAnimeGrouping,
    posterRatingPreferences,
    backdropRatingPreferences,
    logoRatingPreferences,
    posterStreamBadges,
    backdropStreamBadges,
    posterRatingsLayout,
    posterRatingsMaxPerSide,
    posterEdgeOffset,
    posterSideRatingsPosition,
    posterSideRatingsOffset,
    backdropSideRatingsPosition,
    backdropSideRatingsOffset,
    activeQualityBadgesMax,
    posterQualityBadgePreferences,
    backdropQualityBadgePreferences,
    backdropRatingsLayout,
    posterRatingsMax,
    backdropRatingsMax,
    qualityBadgesSide,
    posterQualityBadgesPosition,
    posterQualityBadgesStyle,
    backdropQualityBadgesStyle,
    logoQualityBadgesStyle,
    posterRatingBadgeScale,
    backdropRatingBadgeScale,
    logoRatingBadgeScale,
    posterQualityBadgeScale,
    backdropQualityBadgeScale,
    logoQualityBadgeScale,
    logoQualityBadgePreferences,
    posterRatingStyle,
    backdropRatingStyle,
    logoRatingStyle,
    posterRatingPresentation,
    backdropRatingPresentation,
    logoRatingPresentation,
    posterAggregateRatingSource,
    backdropAggregateRatingSource,
    logoAggregateRatingSource,
    aggregateAccentMode,
    aggregateAccentColor,
    aggregateCriticsAccentColor,
    aggregateAudienceAccentColor,
    aggregateAccentBarOffset,
    aggregateAccentBarVisible,
    logoRatingsMax,
    logoBackground,
    logoArtworkSource,
    ratingProviderAppearanceOverrides,
    baseUrl,
    shouldShowQualityBadgesSide,
    shouldShowQualityBadgesPosition,
    mdblistKey,
    erdbKey,
    tmdbKey,
    tmdbIdScope,
    fanartKey,
    simklClientId,
  ]);

  const previewErrored = Boolean(previewUrl) && previewErroredForUrl === previewUrl;
  const genrePreviewCards = useMemo(
    () =>
      GENRE_BADGE_PREVIEW_SAMPLES.map((sample) => ({
        sample,
        url: buildGenreSamplePreviewUrl({
          baseUrl,
          erdbKey,
          tmdbKey,
          sample,
          mode: genrePreviewMode,
          style:
            sample.previewType === 'poster'
              ? posterGenreBadgeStyle
              : sample.previewType === 'backdrop'
                ? backdropGenreBadgeStyle
                : logoGenreBadgeStyle,
          position:
            sample.previewType === 'poster'
              ? posterGenreBadgePosition
              : sample.previewType === 'backdrop'
                ? backdropGenreBadgePosition
                : logoGenreBadgePosition,
          scale:
            sample.previewType === 'poster'
              ? posterGenreBadgeScale
              : sample.previewType === 'backdrop'
                ? backdropGenreBadgeScale
                : logoGenreBadgeScale,
          animeGrouping:
            sample.previewType === 'poster'
              ? posterGenreBadgeAnimeGrouping
              : sample.previewType === 'backdrop'
                ? backdropGenreBadgeAnimeGrouping
                : logoGenreBadgeAnimeGrouping,
        }),
      })),
    [
      baseUrl,
      erdbKey,
      tmdbKey,
      genrePreviewMode,
      posterGenreBadgeStyle,
      backdropGenreBadgeStyle,
      logoGenreBadgeStyle,
      posterGenreBadgePosition,
      backdropGenreBadgePosition,
      logoGenreBadgePosition,
      posterGenreBadgeScale,
      backdropGenreBadgeScale,
      logoGenreBadgeScale,
      posterGenreBadgeAnimeGrouping,
      backdropGenreBadgeAnimeGrouping,
      logoGenreBadgeAnimeGrouping,
    ]
  );
  const latestReleaseMatchesDeployment = latestReleaseTag && latestReleaseTag === DEPLOYMENT_VERSION;
  const versionStatusNote = isLatestReleaseLoading
    ? 'Checking the latest release on GitHub now.'
    : latestReleaseTag
      ? latestReleaseMatchesDeployment
        ? 'Live matches the latest release on GitHub.'
        : pendingReleaseTag
          ? `${pendingReleaseTag} is still publishing on GitHub. Latest published release is ${latestReleaseTag}.`
          : `Live is ${DEPLOYMENT_VERSION}. Latest release on GitHub is ${latestReleaseTag}.`
      : 'Live shows the running container. The latest release is unavailable right now.';

  const handlePreviewImageError = useCallback(async (url: string) => {
    setPreviewErroredForUrl(url);

    try {
      const response = await fetch(url, { cache: 'no-store' });
      const body = (await response.text()).trim().replace(/\s+/g, ' ').slice(0, 180);

      if (response.ok) {
        setPreviewErrorDetails('Preview request succeeded but the image could not be displayed.');
        return;
      }

      if (response.status === 401 && body.toLowerCase().includes('request key')) {
        setPreviewErrorDetails('This ERDB host requires an ERDB request key. Add it in Inputs and try again.');
        return;
      }

      if (response.status === 400 && body.toLowerCase().includes('tmdb')) {
        if (body.toLowerCase().includes('strict tmdb id scope')) {
          setPreviewErrorDetails('Strict TMDB ID scope blocked an ambiguous TMDB ID. Use tmdb:movie:id or tmdb:tv:id, or switch TMDB ID scope to Soft.');
          return;
        }
        setPreviewErrorDetails('TMDB key is missing. Add your TMDB v3 key in Inputs.');
        return;
      }

      if (response.status === 401 && body.toLowerCase().includes('tmdb')) {
        setPreviewErrorDetails('TMDB key is invalid or unauthorized. Verify the key and try again.');
        return;
      }

      if (response.status === 429 && body.toLowerCase().includes('tmdb')) {
        setPreviewErrorDetails('TMDB rate limit reached. Wait a moment and try again.');
        return;
      }

      if (response.status >= 500) {
        const lowerBody = body.toLowerCase();
        if (
          lowerBody.includes('upstream request failed') ||
          lowerBody.includes('fetch failed') ||
          lowerBody.includes('network') ||
          lowerBody.includes('dns')
        ) {
          setPreviewErrorDetails('Server could not reach TMDB/MDBList. Check VPS outbound network and DNS.');
          return;
        }
        setPreviewErrorDetails(body ? `API ${response.status}: ${body}` : `API ${response.status}: request failed.`);
        return;
      }

      setPreviewErrorDetails(body ? `API ${response.status}: ${body}` : `API ${response.status}: request failed.`);
    } catch {
      setPreviewErrorDetails('Could not reach the preview endpoint. Check network and base URL.');
    }
  }, []);

  useEffect(() => {
    setPreviewErrorDetails('');
  }, [previewUrl]);

  const currentUiConfig = useMemo(() => buildCurrentUiConfig(), [buildCurrentUiConfig]);

  const configString = useMemo(
    () => buildConfigString(baseUrl, currentUiConfig.settings),
    [baseUrl, currentUiConfig]
  );

  const aiometadataPatterns = useMemo(
    () =>
      buildAiometadataUrlPatterns(baseUrl, currentUiConfig.settings, {
        hideCredentials: hideAiometadataCredentials,
        posterIdMode,
      }),
    [baseUrl, currentUiConfig, hideAiometadataCredentials, posterIdMode]
  );

  const proxyUrl = useMemo(
    () => buildProxyUrl(baseUrl, currentUiConfig.proxy, currentUiConfig.settings),
    [baseUrl, currentUiConfig]
  );

  useEffect(() => {
    if (!configString) setShowConfigString(false);
  }, [configString]);

  useEffect(() => {
    if (!proxyUrl) setShowProxyUrl(false);
  }, [proxyUrl]);

  const displayedConfigString = configString
    ? (showConfigString ? configString : maskSensitiveText(configString))
    : '';
  const displayedProxyUrl = proxyUrl
    ? (showProxyUrl ? proxyUrl : maskSensitiveText(proxyUrl))
    : '';
  const aiometadataPatternRows = aiometadataPatterns
    ? [
        {
          key: 'poster',
          label: 'Poster URL Pattern',
          value: aiometadataPatterns.posterUrlPattern,
          description: 'Defaults to typed TMDB IDs in auto mode for stronger rewrite coverage.',
        },
        {
          key: 'background',
          label: 'Background URL Pattern',
          value: aiometadataPatterns.backgroundUrlPattern,
          description: 'Matches the live AIOMetadata background preset and prefixes TMDB IDs with {type} to avoid movie versus series collisions.',
        },
        {
          key: 'logo',
          label: 'Logo URL Pattern',
          value: aiometadataPatterns.logoUrlPattern,
          description: 'Matches the live AIOMetadata logo preset and prefixes TMDB IDs with {type} so TV logos do not collide with movie IDs.',
        },
        {
          key: 'episode',
          label: 'Episode Thumbnail URL Pattern',
          value: aiometadataPatterns.episodeThumbnailUrlPattern,
          description: 'Matches the live AIOMetadata episode thumb preset and uses TMDB episode stills when they exist, then falls back to the series backdrop.',
        },
      ]
    : [];
  const aiometadataCopyBlock = aiometadataPatternRows
    .map((row) => `${row.label}\n${row.value}`)
    .join('\n\n');
  const baseStructureTemplate = useMemo(
    () =>
      `${baseUrl || 'http://localhost:3000'}/{type}/{id}.jpg?ratings={ratings}&lang={lang}&ratingStyle={style}&imageText={text}&posterImageSize={posterImageSize}&posterRatingsLayout={layout}&posterRatingsMaxPerSide={max}&posterEdgeOffset={posterEdgeOffset}&backdropRatingsLayout={bLayout}&posterSideRatingsPosition={posterSidePos}&posterSideRatingsOffset={posterSideOffset}&backdropSideRatingsPosition={backdropSidePos}&backdropSideRatingsOffset={backdropSideOffset}&tmdbIdScope={tmdbIdScope}&erdbKey={erdbKey}&tmdbKey={tmdbKey}&mdblistKey={mdbKey}&fanartKey={fanartKey}`,
    [baseUrl],
  );
  const displayedBaseStructureTemplate = useMemo(
    () => baseStructureTemplate.replace('?', '?\n').replaceAll('&', '\n&'),
    [baseStructureTemplate],
  );
  const handleCopyBaseStructure = useCallback(() => {
    navigator.clipboard.writeText(baseStructureTemplate);
    setBaseStructureCopied(true);
    setTimeout(() => setBaseStructureCopied(false), 2000);
  }, [baseStructureTemplate]);

  const updateRatingRowsForType = (
    type: 'poster' | 'backdrop' | 'logo',
    updater: (current: RatingProviderRow[]) => RatingProviderRow[]
  ) => {
    if (type === 'poster') {
      setPosterRatingRows(updater);
      return;
    }
    if (type === 'backdrop') {
      setBackdropRatingRows(updater);
      return;
    }
    setLogoRatingRows(updater);
  };

  const toggleRatingPreference = (rating: RatingPreference) => {
    updateRatingRowsForType(previewType, (current) =>
      current.map((row) =>
        row.id === rating
          ? {
              ...row,
              enabled: !row.enabled,
            }
          : row
      )
    );
  };

  const setAllRatingPreferencesEnabled = (enabled: boolean) => {
    updateRatingRowsForType(previewType, (current) =>
      current.map((row) => ({
        ...row,
        enabled,
      }))
    );
  };

  const reorderRatingPreference = (fromIndex: number, toIndex: number) => {
    updateRatingRowsForType(previewType, (current) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= current.length ||
        toIndex >= current.length
      ) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) {
        return current;
      }
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const toggleQualityBadgePreference = useCallback(
    (badgeId: (typeof QUALITY_BADGE_OPTIONS)[number]['id']) => {
      setActiveQualityBadgePreferences((current) => {
        return current.includes(badgeId)
          ? current.filter((entry) => entry !== badgeId)
          : [...current, badgeId];
      });
    },
    [setActiveQualityBadgePreferences]
  );

  const updateProviderAppearanceOverride = useCallback(
    (
      providerId: RatingPreference,
      updater: (current: RatingProviderAppearanceOverride) => RatingProviderAppearanceOverride
    ) => {
      setRatingProviderAppearanceOverrides((current) => {
        const nextOverride = updater(current[providerId] || {});
        const trimmedIconUrl =
          typeof nextOverride.iconUrl === 'string' && nextOverride.iconUrl.trim()
            ? nextOverride.iconUrl.trim()
            : undefined;
        const normalizedColor =
          typeof nextOverride.accentColor === 'string' && nextOverride.accentColor.trim()
            ? nextOverride.accentColor.trim()
            : undefined;
        const normalizedScale = normalizeProviderIconScalePercent(
          nextOverride.iconScalePercent,
          DEFAULT_PROVIDER_ICON_SCALE_PERCENT,
        );
        const normalizedStackedLineWidth = normalizeStackedLineWidthPercent(
          nextOverride.stackedLineWidthPercent,
          DEFAULT_STACKED_LINE_WIDTH_PERCENT,
        );
        const normalizedStackedLineHeight = normalizeStackedLineHeightPercent(
          nextOverride.stackedLineHeightPercent,
          DEFAULT_STACKED_LINE_HEIGHT_PERCENT,
        );
        const normalizedStackedLineGap = normalizeStackedLineGapPercent(
          nextOverride.stackedLineGapPercent,
          DEFAULT_STACKED_LINE_GAP_PERCENT,
        );
        const normalizedStackedWidth = normalizeStackedWidthPercent(
          nextOverride.stackedWidthPercent,
          DEFAULT_STACKED_WIDTH_PERCENT,
        );
        const normalizedStackedSurfaceOpacity = normalizeStackedSurfaceOpacityPercent(
          nextOverride.stackedSurfaceOpacityPercent,
          DEFAULT_STACKED_SURFACE_OPACITY_PERCENT,
        );
        const normalizedStackedAccentMode = normalizeStackedAccentMode(
          nextOverride.stackedAccentMode,
          DEFAULT_STACKED_ACCENT_MODE,
        );
        const normalizedStackedLineOffsetX = normalizeStackedElementOffsetPx(
          nextOverride.stackedLineOffsetX,
          DEFAULT_STACKED_ELEMENT_OFFSET_PX,
        );
        const normalizedStackedLineOffsetY = normalizeStackedElementOffsetPx(
          nextOverride.stackedLineOffsetY,
          DEFAULT_STACKED_ELEMENT_OFFSET_PX,
        );
        const normalizedStackedIconOffsetX = normalizeStackedElementOffsetPx(
          nextOverride.stackedIconOffsetX,
          DEFAULT_STACKED_ELEMENT_OFFSET_PX,
        );
        const normalizedStackedIconOffsetY = normalizeStackedElementOffsetPx(
          nextOverride.stackedIconOffsetY,
          DEFAULT_STACKED_ELEMENT_OFFSET_PX,
        );
        const normalizedStackedValueOffsetX = normalizeStackedElementOffsetPx(
          nextOverride.stackedValueOffsetX,
          DEFAULT_STACKED_ELEMENT_OFFSET_PX,
        );
        const normalizedStackedValueOffsetY = normalizeStackedElementOffsetPx(
          nextOverride.stackedValueOffsetY,
          DEFAULT_STACKED_ELEMENT_OFFSET_PX,
        );
        const compactOverride: RatingProviderAppearanceOverride = {};
        if (trimmedIconUrl) {
          compactOverride.iconUrl = trimmedIconUrl;
        }
        if (normalizedColor) {
          compactOverride.accentColor = normalizedColor;
        }
        if (normalizedScale !== DEFAULT_PROVIDER_ICON_SCALE_PERCENT) {
          compactOverride.iconScalePercent = normalizedScale;
        }
        if (nextOverride.stackedLineVisible === false) {
          compactOverride.stackedLineVisible = false;
        }
        if (normalizedStackedLineWidth !== DEFAULT_STACKED_LINE_WIDTH_PERCENT) {
          compactOverride.stackedLineWidthPercent = normalizedStackedLineWidth;
        }
        if (normalizedStackedLineHeight !== DEFAULT_STACKED_LINE_HEIGHT_PERCENT) {
          compactOverride.stackedLineHeightPercent = normalizedStackedLineHeight;
        }
        if (normalizedStackedLineGap !== DEFAULT_STACKED_LINE_GAP_PERCENT) {
          compactOverride.stackedLineGapPercent = normalizedStackedLineGap;
        }
        if (normalizedStackedWidth !== DEFAULT_STACKED_WIDTH_PERCENT) {
          compactOverride.stackedWidthPercent = normalizedStackedWidth;
        }
        if (normalizedStackedSurfaceOpacity !== DEFAULT_STACKED_SURFACE_OPACITY_PERCENT) {
          compactOverride.stackedSurfaceOpacityPercent = normalizedStackedSurfaceOpacity;
        }
        if (normalizedStackedAccentMode !== DEFAULT_STACKED_ACCENT_MODE) {
          compactOverride.stackedAccentMode = normalizedStackedAccentMode;
        }
        if (normalizedStackedLineOffsetX !== DEFAULT_STACKED_ELEMENT_OFFSET_PX) {
          compactOverride.stackedLineOffsetX = normalizedStackedLineOffsetX;
        }
        if (normalizedStackedLineOffsetY !== DEFAULT_STACKED_ELEMENT_OFFSET_PX) {
          compactOverride.stackedLineOffsetY = normalizedStackedLineOffsetY;
        }
        if (normalizedStackedIconOffsetX !== DEFAULT_STACKED_ELEMENT_OFFSET_PX) {
          compactOverride.stackedIconOffsetX = normalizedStackedIconOffsetX;
        }
        if (normalizedStackedIconOffsetY !== DEFAULT_STACKED_ELEMENT_OFFSET_PX) {
          compactOverride.stackedIconOffsetY = normalizedStackedIconOffsetY;
        }
        if (normalizedStackedValueOffsetX !== DEFAULT_STACKED_ELEMENT_OFFSET_PX) {
          compactOverride.stackedValueOffsetX = normalizedStackedValueOffsetX;
        }
        if (normalizedStackedValueOffsetY !== DEFAULT_STACKED_ELEMENT_OFFSET_PX) {
          compactOverride.stackedValueOffsetY = normalizedStackedValueOffsetY;
        }

        const next = { ...current };
        if (Object.keys(compactOverride).length === 0) {
          delete next[providerId];
        } else {
          next[providerId] = compactOverride;
        }
        return next;
      });
    },
    []
  );

  const handleCopyConfig = useCallback(() => {
    if (!configString) return;
    navigator.clipboard.writeText(configString);
    setConfigCopied(true);
    setTimeout(() => setConfigCopied(false), 2000);
  }, [configString]);

  const handleCopyProxy = useCallback(() => {
    if (!proxyUrl) return;
    navigator.clipboard.writeText(proxyUrl);
    setProxyCopied(true);
    setTimeout(() => setProxyCopied(false), 2000);
  }, [proxyUrl]);

  const handleCopyAiometadata = useCallback(() => {
    if (!aiometadataCopyBlock) return;
    navigator.clipboard.writeText(aiometadataCopyBlock);
    setAiometadataCopied(true);
    setTimeout(() => setAiometadataCopied(false), 2000);
  }, [aiometadataCopyBlock]);

  const handleSaveWorkspaceConfig = useCallback(() => {
    persistUiConfig(true);
  }, [persistUiConfig]);

  const handleClearSavedWorkspace = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.removeItem(UI_CONFIG_STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_API_KEY_CONFIG_STORAGE_KEY);
      setSavedConfigStatus('cleared');
    } catch {
      setSavedConfigStatus('error');
    }
  }, []);

  const handleToggleConfigAutoSave = useCallback(() => {
    const next = !configAutoSave;
    setConfigAutoSave(next);

    if (next) {
      persistUiConfig(false);
    }
  }, [configAutoSave, persistUiConfig]);

  const handleDownloadWorkspace = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const payload = serializeSavedUiConfig(currentUiConfig);
    const blob = new Blob([payload], { type: 'application/json' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `erdb-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.URL.revokeObjectURL(downloadUrl);
  }, [currentUiConfig]);

  const handlePromptWorkspaceImport = useCallback(() => {
    workspaceImportInputRef.current?.click();
  }, []);

  const handleImportWorkspace = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) {
        return;
      }

      try {
        const parsed = parseSavedUiConfig(await file.text());
        if (!parsed) {
          setSavedConfigStatus('invalid');
          return;
        }
        applySavedUiConfig(parsed, 'imported');
      } catch {
        setSavedConfigStatus('invalid');
      }
    },
    [applySavedUiConfig]
  );

  const handleApplyPreset = useCallback(
    (presetId: ConfiguratorPresetId) => {
      applySavedUiConfig(applyConfiguratorPreset(buildCurrentUiConfig(), presetId), 'preset');
      setSelectedPresetId(presetId);
      setIsWizardActive(false);
    },
    [applySavedUiConfig, buildCurrentUiConfig]
  );

  const handleBeginWizard = useCallback(() => {
    setWizardAnswers({});
    setWizardQuestionIndex(0);
    setIsWizardActive(true);
  }, []);

  const handleExitWizard = useCallback(() => {
    setWizardAnswers({});
    setWizardQuestionIndex(0);
    setIsWizardActive(false);
  }, []);

  const handleWizardBack = useCallback(() => {
    setWizardQuestionIndex((currentIndex) => Math.max(0, currentIndex - 1));
  }, []);

  const handleWizardAnswer = useCallback(
    (
      questionId: ConfiguratorWizardQuestionId,
      value: ConfiguratorWizardAnswers[ConfiguratorWizardQuestionId],
    ) => {
      setWizardAnswers((current) => ({
        ...current,
        [questionId]: value,
      }));
      setWizardQuestionIndex((currentIndex) =>
        Math.min(currentIndex + 1, CONFIGURATOR_WIZARD_QUESTION_ORDER.length - 1),
      );
    },
    []
  );

  const handleToggleAdvancedSection = useCallback((sectionId: AdvancedConfiguratorSectionId) => {
    setOpenAdvancedSections((current) =>
      current.includes(sectionId)
        ? current.filter((entry) => entry !== sectionId)
        : [...current, sectionId]
    );
  }, []);

  const handleSelectExperienceMode = useCallback((nextMode: ConfiguratorExperienceMode) => {
    setExperienceMode(nextMode);
    setExperienceModeDraft(nextMode);
    setShowExperienceModal(false);
  }, []);

  const handleContinueExperienceMode = useCallback(() => {
    setExperienceMode(experienceModeDraft);
    setShowExperienceModal(false);
  }, [experienceModeDraft]);

  useEffect(() => {
    if (typeof document === 'undefined' || !showExperienceModal) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showExperienceModal]);

  const canGenerateConfig = Boolean(configString);
  const canGenerateProxy = Boolean(proxyUrl);
  const activeRatingStyle =
    previewType === 'poster'
      ? posterRatingStyle
      : previewType === 'backdrop'
        ? backdropRatingStyle
        : logoRatingStyle;
  const activeRatingPresentation =
    previewType === 'poster'
      ? posterRatingPresentation
      : previewType === 'backdrop'
        ? backdropRatingPresentation
        : logoRatingPresentation;
  const activeAggregateRatingSource =
    previewType === 'poster'
      ? posterAggregateRatingSource
      : previewType === 'backdrop'
        ? backdropAggregateRatingSource
        : logoAggregateRatingSource;
  const usesAggregatePresentation = usesAggregateRatingPresentation(activeRatingPresentation);
  const activeAggregateAccent =
    aggregateAccentMode === 'custom'
      ? usesDualAggregateRatingPresentation(activeRatingPresentation)
        ? aggregateCriticsAccentColor
        : aggregateAccentColor
      : usesDualAggregateRatingPresentation(activeRatingPresentation)
        ? AGGREGATE_SOURCE_ACCENT_BY_ID.critics
        : AGGREGATE_SOURCE_ACCENT_BY_ID[activeAggregateRatingSource];
  const activeImageText = previewType === 'backdrop' ? backdropImageText : posterImageText;
  const activeImageTextOptions =
    previewType === 'backdrop' ? BACKDROP_IMAGE_TEXT_OPTIONS : POSTER_IMAGE_TEXT_OPTIONS;
  const activeImageTextOptionMeta =
    activeImageTextOptions.find((option) => option.id === activeImageText) || null;
  const activeArtworkSourceOptions =
    previewType === 'backdrop' ? BACKDROP_ARTWORK_SOURCE_OPTIONS : POSTER_ARTWORK_SOURCE_OPTIONS;
  const activeArtworkSource = previewType === 'backdrop' ? backdropArtworkSource : posterArtworkSource;
  const activePosterImageSizeOptionMeta =
    POSTER_IMAGE_SIZE_OPTIONS.find((option) => option.id === posterImageSize) ||
    POSTER_IMAGE_SIZE_OPTIONS[0];
  const activeArtworkSourceOptionMeta =
    activeArtworkSourceOptions.find((option) => option.id === activeArtworkSource) || null;
  const activeLogoSourceOptionMeta =
    LOGO_ARTWORK_SOURCE_OPTIONS.find((option) => option.id === logoArtworkSource) || null;
  const shouldShowSideRatingPlacement =
    previewType === 'poster'
      ? isVerticalPosterRatingLayout(posterRatingsLayout) || activeRatingPresentation === 'blockbuster'
      : previewType === 'backdrop'
        ? backdropRatingsLayout === 'right-vertical' || activeRatingPresentation === 'blockbuster'
        : false;
  const activeSideRatingsPosition =
    previewType === 'backdrop' ? backdropSideRatingsPosition : posterSideRatingsPosition;
  const activeSideRatingsOffset =
    previewType === 'backdrop' ? backdropSideRatingsOffset : posterSideRatingsOffset;
  const setActiveSideRatingsPosition =
    previewType === 'backdrop' ? setBackdropSideRatingsPosition : setPosterSideRatingsPosition;
  const setActiveSideRatingsOffset =
    previewType === 'backdrop' ? setBackdropSideRatingsOffset : setPosterSideRatingsOffset;
  const styleLabel =
    previewType === 'poster'
      ? 'Poster Ratings Style'
      : previewType === 'backdrop'
        ? 'Backdrop Ratings Style'
        : 'Logo Ratings Style';
  const textLabel = previewType === 'backdrop' ? 'Backdrop Text' : 'Poster Text';
  const providersLabel =
    previewType === 'poster'
      ? 'Poster Providers'
      : previewType === 'backdrop'
        ? 'Backdrop Providers'
        : 'Logo Providers';
  const ratingProviderRows =
    previewType === 'poster'
      ? posterRatingRows
      : previewType === 'backdrop'
        ? backdropRatingRows
        : logoRatingRows;
  const activeProviderMeta =
    RATING_PROVIDER_OPTIONS.find((provider) => provider.id === activeProviderEditorId) ||
    RATING_PROVIDER_OPTIONS[0];
  const activeProviderAppearanceOverride =
    (activeProviderMeta && ratingProviderAppearanceOverrides[activeProviderMeta.id]) || {};
  const showsAggregateRatingSource = usesAggregateRatingSource(activeRatingPresentation);
  const showsAggregateAccentBarOffset = usesAggregateAccentBar(activeRatingPresentation);
  const activePresentationPreservesLayout = preservesSelectedRatingLayout(activeRatingPresentation);
  const isEditorialPresentation = activeRatingPresentation === 'editorial';
  const usesStackedRatingStyle = activeRatingStyle === 'stacked';
  const selectorGroupClass = 'flex flex-wrap gap-1 rounded-lg border border-white/10 bg-zinc-900 p-1';
  const selectorButtonClass = (active: boolean) =>
    `rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
      active ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
    }`;
  const settingsCardClass = 'rounded-xl border border-white/10 bg-zinc-900/50 p-3 space-y-2';
  const layoutPlacementHelp =
    previewType === 'poster'
      ? 'top, bottom, left, or right'
      : previewType === 'backdrop'
        ? 'center, right, or right vertical'
        : null;
  const selectedPresetMeta = selectedPresetId ? getConfiguratorPreset(selectedPresetId) : null;
  const wizardActiveQuestionId = CONFIGURATOR_WIZARD_QUESTION_ORDER[wizardQuestionIndex] || null;
  const wizardActiveQuestion = wizardActiveQuestionId
    ? CONFIGURATOR_WIZARD_QUESTIONS[wizardActiveQuestionId]
    : null;
  const wizardIsComplete = CONFIGURATOR_WIZARD_QUESTION_ORDER.every(
    (questionId) => questionId in wizardAnswers,
  );
  const wizardRecommendedPresetId = wizardIsComplete
    ? recommendConfiguratorPreset(wizardAnswers)
    : null;
  const wizardRecommendedPreset = wizardRecommendedPresetId
    ? getConfiguratorPreset(wizardRecommendedPresetId)
    : null;
  const quickPresentationOptions = SIMPLE_PRESENTATION_IDS.map((id) =>
    RATING_PRESENTATION_OPTIONS.find((option) => option.id === id),
  ).filter((option): option is (typeof RATING_PRESENTATION_OPTIONS)[number] => Boolean(option));

  useEffect(() => {
    if (ratingProviderRows.some((row) => row.id === activeProviderEditorId)) {
      return;
    }
    setActiveProviderEditorId(ratingProviderRows[0]?.id || 'tmdb');
  }, [activeProviderEditorId, ratingProviderRows]);

  const setRatingStyleForType = (value: RatingStyle) => {
    if (previewType === 'poster') {
      setPosterRatingStyle(value);
      return;
    }
    if (previewType === 'backdrop') {
      setBackdropRatingStyle(value);
      return;
    }
    setLogoRatingStyle(value);
  };

  const setRatingPresentationForType = (value: RatingPresentation) => {
    if (previewType === 'poster') {
      setPosterRatingPresentation(value);
      return;
    }
    if (previewType === 'backdrop') {
      setBackdropRatingPresentation(value);
      return;
    }
    setLogoRatingPresentation(value);
  };

  const setAggregateRatingSourceForType = (value: AggregateRatingSource) => {
    if (previewType === 'poster') {
      setPosterAggregateRatingSource(value);
      return;
    }
    if (previewType === 'backdrop') {
      setBackdropAggregateRatingSource(value);
      return;
    }
    setLogoAggregateRatingSource(value);
  };

  const setImageTextForType = (value: PosterImageTextPreference) => {
    if (previewType === 'backdrop') {
      setBackdropImageText(value);
      return;
    }
    setPosterImageText(value);
  };

  const setupModeSection = (
    <div className="rounded-2xl border border-violet-500/20 bg-[linear-gradient(180deg,rgba(32,20,54,0.92),rgba(16,10,28,0.98))] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200/90">
            Setup Mode
          </div>
          <h4 className="mt-2 text-lg font-semibold text-white">
            {experienceMode === 'simple' ? 'Simple View' : 'Advanced View'}
          </h4>
          <p className="mt-2 max-w-2xl text-[12px] leading-6 text-zinc-400">
            {experienceMode === 'simple'
              ? 'Simple keeps the high signal controls in front of you. Presets, keys, media targeting, and the most visible artwork switches stay easy to reach.'
              : 'Advanced exposes the full ERDB configurator, including provider ordering, sizing, stacked badge tuning, and manual layout controls.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setExperienceModeDraft(experienceMode);
            setShowExperienceModal(true);
          }}
          className="shrink-0 self-start rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-300 hover:bg-black/50"
        >
          Reopen Intro
        </button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {([
          {
            id: 'simple',
            label: 'Simple',
            description: 'Essentials only, tuned around presets and the most visible artwork controls.',
          },
          {
            id: 'advanced',
            label: 'Advanced',
            description: 'Everything in the current configurator, reorganized so the dense controls stay easier to scan.',
          },
        ] as const).map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleSelectExperienceMode(option.id)}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              experienceMode === option.id
                ? 'border-violet-500/60 bg-violet-500/12 text-white'
                : 'border-white/10 bg-black/25 text-zinc-300 hover:border-white/20 hover:bg-black/35'
            }`}
          >
            <div className="flex min-h-[3rem] flex-col items-start gap-2">
              <div className="min-w-0 text-base font-semibold">{option.label}</div>
              <span
                className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                  experienceMode === option.id
                    ? 'bg-violet-500/20 text-violet-100'
                    : 'bg-white/5 text-zinc-500'
                }`}
              >
                {experienceMode === option.id ? 'Active' : 'Switch'}
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-zinc-500">{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const presetHubSection = (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Guided Setup
          </div>
          <h4 className="mt-2 text-lg font-semibold text-white">Preset Studio</h4>
          <p className="mt-2 max-w-2xl text-[12px] leading-6 text-zinc-400">
            Start from a preset, or answer a few questions and let ERDB recommend one for you.
            Presets only touch rendering and proxy defaults. Your keys and manifest URL stay intact.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={isWizardActive ? handleExitWizard : handleBeginWizard}
            className="shrink-0 rounded-full border border-white/10 bg-zinc-950 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-200 hover:bg-zinc-900"
          >
            {isWizardActive ? 'Exit Guide' : 'Guide Me'}
          </button>
        </div>
      </div>

      {isWizardActive ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[min(92vh,880px)] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-violet-500/30 bg-[linear-gradient(180deg,rgba(22,16,36,0.96),rgba(7,7,11,0.98))] p-4 shadow-[0_28px_120px_rgba(0,0,0,0.55)] md:p-5">
            {wizardRecommendedPreset ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-violet-500/30 bg-[linear-gradient(145deg,rgba(76,29,149,0.18),rgba(9,9,11,0.88))] p-4">
              <div className="flex flex-col items-start gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200/80">
                    Wizard Recommendation
                  </div>
                  <div className="mt-2 text-xl font-semibold text-white">
                    {wizardRecommendedPreset.label}
                  </div>
                  <p className="mt-2 text-[12px] leading-6 text-zinc-400">
                    {wizardRecommendedPreset.description}
                  </p>
                </div>
                <span
                  className="shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white"
                  style={{
                    borderColor: hexToRgbaCss(wizardRecommendedPreset.accentColor, 0.55),
                    backgroundColor: hexToRgbaCss(wizardRecommendedPreset.accentColor, 0.16),
                  }}
                >
                  {wizardRecommendedPreset.badge}
                </span>
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-3">
                {wizardRecommendedPreset.bullets.map((bullet) => (
                  <div
                    key={`${wizardRecommendedPreset.id}-${bullet}`}
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-[11px] leading-5 text-zinc-300"
                  >
                    {bullet}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset(wizardRecommendedPreset.id)}
                  className="rounded-lg bg-violet-500 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-400"
                >
                  Apply {wizardRecommendedPreset.label}
                </button>
                <button
                  type="button"
                  onClick={handleBeginWizard}
                  className="rounded-lg border border-white/10 bg-zinc-950 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900"
                >
                  Restart Guide
                </button>
              </div>
            </div>
              </div>
            ) : wizardActiveQuestion ? (
              <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Question {wizardQuestionIndex + 1} of {CONFIGURATOR_WIZARD_QUESTION_ORDER.length}
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {wizardActiveQuestion.title}
                </div>
                <p className="mt-2 text-[12px] leading-6 text-zinc-400">
                  {wizardActiveQuestion.description}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {wizardActiveQuestion.options.map((option) => {
                const isSelected = wizardAnswers[wizardActiveQuestion.id] === option.value;
                return (
                  <button
                    key={`${wizardActiveQuestion.id}-${option.value}`}
                    type="button"
                    onClick={() => handleWizardAnswer(wizardActiveQuestion.id, option.value)}
                    className={`rounded-2xl border p-4 text-left transition-colors ${
                      isSelected
                        ? 'border-violet-500/60 bg-violet-500/12 text-white'
                        : 'border-white/10 bg-black/30 text-zinc-300 hover:border-white/20 hover:bg-black/40'
                    }`}
                  >
                    <div className="text-sm font-semibold">{option.label}</div>
                    <div className="mt-1 text-[11px] leading-5 text-zinc-500">
                      {option.description}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleWizardBack}
                disabled={wizardQuestionIndex === 0}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                  wizardQuestionIndex === 0
                    ? 'cursor-not-allowed bg-zinc-900 text-zinc-600'
                    : 'border border-white/10 bg-zinc-950 text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleExitWizard}
                className="rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900"
              >
                Cancel
              </button>
            </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3">
            {CONFIGURATOR_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              const presetIcon =
                preset.id === 'starter'
                  ? Settings2
                  : preset.id === 'balanced'
                    ? Sparkles
                    : preset.id === 'public-fast'
                      ? Cpu
                      : Layers;
              const PresetIcon = presetIcon;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset.id)}
                  className={`min-w-0 rounded-2xl border p-4 text-left transition-colors ${
                    isSelected
                      ? 'bg-zinc-900/80 text-white'
                      : 'border-white/10 bg-zinc-950/60 text-zinc-300 hover:border-white/20 hover:bg-zinc-950'
                  }`}
                  style={
                    isSelected
                      ? {
                          borderColor: hexToRgbaCss(preset.accentColor, 0.65),
                          boxShadow: `inset 0 0 0 1px ${hexToRgbaCss(preset.accentColor, 0.18)}`,
                        }
                      : undefined
                  }
                >
                  <div className="flex flex-col items-start gap-2">
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className="shrink-0 rounded-2xl border border-white/10 p-2.5"
                        style={{
                          backgroundColor: hexToRgbaCss(preset.accentColor, 0.16),
                        }}
                      >
                        <PresetIcon className="h-4 w-4" style={{ color: preset.accentColor }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="break-words text-sm font-semibold text-white">{preset.label}</div>
                        <div className="mt-1 text-[11px] leading-5 text-zinc-500">
                          {preset.description}
                        </div>
                      </div>
                    </div>
                    <span
                      className="max-w-full shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white"
                      style={{
                        borderColor: hexToRgbaCss(preset.accentColor, 0.45),
                        backgroundColor: hexToRgbaCss(preset.accentColor, 0.16),
                      }}
                    >
                      {preset.badge}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2">
                    {preset.bullets.map((bullet) => (
                      <div
                        key={`${preset.id}-${bullet}`}
                        className="break-words rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-[11px] leading-5 text-zinc-400"
                      >
                        {bullet}
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-zinc-950/40 p-4">
            <div className="text-sm font-semibold text-white">Not sure what to pick?</div>
            <p className="mt-2 text-[11px] leading-5 text-zinc-500">
              The guide recommends a preset based on deployment, density, and how much manual tuning
              you expect to do afterwards.
            </p>
            <button
              type="button"
              onClick={handleBeginWizard}
              className="mt-4 rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-xs font-semibold text-white hover:bg-black/60"
            >
              Guide me to a preset
            </button>
          </div>
        </>
      )}

      <div className="mt-4 rounded-xl border border-white/10 bg-zinc-950/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Wizard Summary
          </div>
          <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-300">
            {selectedPresetMeta ? selectedPresetMeta.badge : 'Custom'}
          </span>
        </div>
        <div className="mt-3 text-sm font-semibold text-white">
          {selectedPresetMeta ? selectedPresetMeta.label : 'No preset applied yet'}
        </div>
        <p className="mt-2 text-[11px] leading-5 text-zinc-500">
          {selectedPresetMeta
            ? `${selectedPresetMeta.description} ${
                selectedPresetMeta.recommendedExperienceMode === 'advanced'
                  ? 'This preset pairs best with advanced mode once you want to tune it further.'
                  : 'This preset is designed to work well in simple mode too.'
              }`
            : 'Apply a preset to get a curated starting point, then keep tuning from there.'}
        </p>
      </div>
    </div>
  );

  const workspaceManagementSection = (
    <div>
      <div className="text-[11px] font-semibold text-zinc-400 mb-2">Workspace</div>
      <p className="mb-2 text-[11px] text-zinc-500">
        Save the shared ERDB settings plus proxy manifest setup to this browser, or export them as a JSON file.
      </p>
      <p className="mb-2 text-[11px] text-zinc-500">
        Saved workspace values only affect this page. Share the config string or the generated proxy manifest if you want the same settings somewhere else.
      </p>
      <input
        ref={workspaceImportInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImportWorkspace}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleSaveWorkspaceConfig}
          className="rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-200 hover:bg-zinc-800"
        >
          Save workspace
        </button>
        <button
          type="button"
          onClick={handleDownloadWorkspace}
          className="rounded-lg border border-white/10 bg-zinc-950 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-900"
        >
          Download JSON
        </button>
        <button
          type="button"
          onClick={handlePromptWorkspaceImport}
          className="rounded-lg border border-white/10 bg-zinc-950 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-900"
        >
          Import JSON
        </button>
        <button
          type="button"
          onClick={handleClearSavedWorkspace}
          className="rounded-lg border border-white/10 bg-zinc-950 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300"
        >
          Clear saved
        </button>
        <label className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-950 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-300">
          <input
            type="checkbox"
            checked={configAutoSave}
            onChange={handleToggleConfigAutoSave}
            className="h-3 w-3 accent-violet-500"
          />
          <span>Auto save</span>
        </label>
        {savedConfigStatus ? (
          <span className={`text-[10px] ${savedConfigStatus === 'error' || savedConfigStatus === 'invalid' ? 'text-rose-400' : 'text-zinc-500'}`}>
            {savedConfigStatus === 'loaded'
              ? 'Saved workspace loaded.'
              : savedConfigStatus === 'saved'
                ? 'Workspace saved.'
                : savedConfigStatus === 'cleared'
                  ? 'Saved workspace cleared.'
                  : savedConfigStatus === 'imported'
                    ? 'Workspace imported.'
                    : savedConfigStatus === 'preset'
                      ? 'Preset applied.'
                      : savedConfigStatus === 'invalid'
                        ? 'Invalid workspace file.'
                        : 'Unable to access local storage.'}
          </span>
        ) : null}
      </div>
    </div>
  );

  const accessKeysSection = (
    <div>
      <div className="text-[11px] font-semibold text-zinc-400 mb-2">Access Keys</div>
      <div className="grid gap-2 md:grid-cols-5">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">ERDB Request</label>
          <input type="password" value={erdbKey} onChange={(e) => setErdbKey(e.target.value)} placeholder="Optional key" className="w-full bg-black border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:border-violet-500/50 outline-none" />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">TMDB</label>
          <input type="password" value={tmdbKey} onChange={(e) => setTmdbKey(e.target.value)} placeholder="v3 Key" className="w-full bg-black border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:border-violet-500/50 outline-none" />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">MDBList</label>
          <input type="password" value={mdblistKey} onChange={(e) => setMdblistKey(e.target.value)} placeholder="Key" className="w-full bg-black border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:border-violet-500/50 outline-none" />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Fanart</label>
          <input type="password" value={fanartKey} onChange={(e) => setFanartKey(e.target.value)} placeholder="Optional key" className="w-full bg-black border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:border-violet-500/50 outline-none" />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">SIMKL</label>
          <input type="password" value={simklClientId} onChange={(e) => setSimklClientId(e.target.value)} placeholder="client_id (optional)" className="w-full bg-black border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:border-violet-500/50 outline-none" />
        </div>
      </div>
      <div className="mt-3">
        <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">TMDB ID Scope</label>
        <div className="grid gap-2 md:grid-cols-2">
          {TMDB_ID_SCOPE_MODE_OPTIONS.map((option) => {
            const isActive = tmdbIdScope === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setTmdbIdScope(option.id)}
                className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                  isActive
                    ? 'border-violet-500/70 bg-violet-500/12 text-white'
                    : 'border-white/10 bg-black text-zinc-300 hover:border-white/20 hover:bg-zinc-900'
                }`}
              >
                <div className="font-semibold">{option.label}</div>
                <div className="mt-0.5 text-[11px] text-zinc-400">{option.description}</div>
              </button>
            );
          })}
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
        {ERDB_REQUEST_KEY_HELP_COPY}
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
        Soft is recommended for compatibility. Switch to Strict if you sometimes see incorrect logo or backdrop artwork from TMDB ID collisions.
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
        {FANART_KEY_HELP_COPY}
      </p>
    </div>
  );

  const mediaTargetSection = (
    <div>
      <div className="text-[11px] font-semibold text-zinc-400 mb-2">Media Target</div>
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Type</span>
          <div className="erdb-toggle-group flex gap-1 p-1 bg-zinc-900 rounded-lg border border-white/10">
            {(['poster', 'backdrop', 'logo'] as const).map(type => (
              <button key={type} onClick={() => setPreviewType(type)} className={`px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1 ${previewType === type ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}>
                {type === 'poster' && <ImageIcon className="w-3.5 h-3.5" />}
                {type === 'backdrop' && <MonitorPlay className="w-3.5 h-3.5" />}
                {type === 'logo' && <Layers className="w-3.5 h-3.5" />}
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 min-w-[140px]">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Media ID</span>
          <input type="text" value={mediaId} onChange={(e) => setMediaId(e.target.value)} placeholder="tt0133093" className="w-full bg-black border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:border-violet-500/50 outline-none" />
        </div>
        {tmdbKey ? (
          <div className="w-32">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 flex items-center gap-1 mb-1"><Globe2 className="w-3 h-3" /> Lang</span>
            <div className="relative">
              <select value={lang} onChange={(e) => setLang(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white appearance-none outline-none focus:border-violet-500/50">
                {supportedLanguages.map(l => <option key={l.code} value={l.code} className="bg-zinc-900">{l.flag} {l.code}</option>)}
              </select>
              <ChevronRight className="w-3 h-3 text-zinc-500 absolute right-2 top-2.5 pointer-events-none stroke-2 rotate-90" />
            </div>
          </div>
        ) : (
          <div className="p-2 rounded-lg bg-black border border-white/10 text-[10px] text-zinc-500 flex items-center gap-1.5">
            <Globe2 className="w-3 h-3 shrink-0" /> Add TMDB key for lang
          </div>
        )}
      </div>
    </div>
  );

  const presentationSection = (
    <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-3">
      <div className="text-[11px] font-semibold text-zinc-400">Presentation</div>
      <div className="grid gap-2 md:grid-cols-2">
        {PRESENTATION_SECTION_ORDER.map((id) => {
          const option = RATING_PRESENTATION_OPTIONS.find((entry) => entry.id === id);
          if (!option) return null;
          return (
            <button
              key={option.id}
              onClick={() => setRatingPresentationForType(option.id)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                activeRatingPresentation === option.id
                  ? 'border-violet-500/60 bg-violet-500/10 text-white'
                  : 'border-white/10 bg-zinc-900/60 text-zinc-300 hover:border-white/20 hover:bg-zinc-900'
              }`}
            >
              <div className="flex min-h-[3rem] flex-col items-start gap-2">
                <span className="min-w-0 break-words text-sm font-semibold">{option.label}</span>
                {activeRatingPresentation === option.id && (
                  <span className="shrink-0 whitespace-nowrap rounded-full border border-violet-400/40 bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-200">
                    Selected
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>
      {layoutPlacementHelp ? (
        <p className="text-[11px] leading-relaxed text-zinc-500">
          {isEditorialPresentation
            ? previewType === 'poster'
              ? 'Editorial uses a fixed top left score mark that feels printed into the poster. Layout controls stay saved for when you switch back to another mode.'
              : 'Editorial has its custom treatment on posters. Here it falls back to one clean average badge.'
            : activePresentationPreservesLayout
              ? `This mode still respects the selected layout below, so you can move ratings to ${layoutPlacementHelp}.`
              : `Blockbuster uses a fixed ${previewType === 'poster' ? 'left/right poster stack' : 'right vertical backdrop stack'}. Switch to another presentation to use ${layoutPlacementHelp}.`}
        </p>
      ) : (
        <p className="text-[11px] leading-relaxed text-zinc-500">
          {isEditorialPresentation
            ? 'Editorial keeps its unique treatment on posters. Logo output falls back to one clean average badge.'
            : 'Logo presentation keeps the output controls below available.'}
        </p>
      )}
      {usesAggregatePresentation && (
        <div
          className="rounded-xl border bg-zinc-900/50 p-3 space-y-2"
          style={{
            borderColor: hexToRgbaCss(activeAggregateAccent, 0.24),
            backgroundImage: `linear-gradient(145deg, ${hexToRgbaCss(activeAggregateAccent, 0.12)}, rgba(24,24,27,0.78) 58%)`,
          }}
        >
          {showsAggregateRatingSource && (
            <>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Average Source</div>
              <div className="flex flex-wrap gap-1">
                {AGGREGATE_RATING_SOURCE_OPTIONS.map((option) => (
                  (() => {
                    const accentColor = AGGREGATE_SOURCE_ACCENT_BY_ID[option.id];
                    const isSelected = activeAggregateRatingSource === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => setAggregateRatingSourceForType(option.id)}
                        className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors ${
                          isSelected
                            ? 'bg-zinc-800 text-white'
                            : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'
                        }`}
                        style={
                          isSelected
                            ? {
                                borderColor: hexToRgbaCss(accentColor, 0.7),
                                backgroundImage: `linear-gradient(135deg, ${hexToRgbaCss(accentColor, 0.28)}, rgba(24,24,27,0.96))`,
                                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px ${hexToRgbaCss(accentColor, 0.12)}`,
                              }
                            : undefined
                        }
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor: accentColor,
                              boxShadow: `0 0 0 2px ${hexToRgbaCss(accentColor, 0.16)}`,
                            }}
                          />
                          {option.label}
                        </span>
                      </button>
                    );
                  })()
                ))}
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-500">
                {AGGREGATE_RATING_SOURCE_OPTIONS.find((option) => option.id === activeAggregateRatingSource)?.description}
              </p>
            </>
          )}
          <div className="pt-1">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Accent</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {AGGREGATE_ACCENT_MODE_OPTIONS.map((option) => {
                const isSelected = aggregateAccentMode === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setAggregateAccentMode(option.id)}
                    className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors ${
                      isSelected
                        ? 'bg-zinc-800 text-white'
                        : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
              {AGGREGATE_ACCENT_MODE_OPTIONS.find((option) => option.id === aggregateAccentMode)?.description}
              {aggregateAccentMode === 'genre'
                ? ' Editorial already behaves like this on posters; this extends genre matching to the other aggregate badge styles too.'
                : ''}
            </p>
          </div>
          {aggregateAccentMode === 'custom' && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">
                  Custom Accent
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={aggregateAccentColor}
                    onChange={(event) => setAggregateAccentColor(event.target.value)}
                    className="h-10 w-14 rounded-md border border-white/10 bg-black"
                  />
                  <div className="rounded-lg border border-white/10 bg-black px-2.5 py-2 text-xs text-zinc-300">
                    {aggregateAccentColor}
                  </div>
                </div>
                <div className="px-5 pb-4 pt-3 text-[11px] text-zinc-500">
                  Mapped anime IDs such as AniList, MAL, TVDB, and AniDB resolve when mapping data is available for the title.
                </div>
              </div>
              {usesDualAggregateRatingPresentation(activeRatingPresentation) && (
                <>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">
                      Critics Accent
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={aggregateCriticsAccentColor}
                        onChange={(event) => setAggregateCriticsAccentColor(event.target.value)}
                        className="h-10 w-14 rounded-md border border-white/10 bg-black"
                      />
                      <div className="rounded-lg border border-white/10 bg-black px-2.5 py-2 text-xs text-zinc-300">
                        {aggregateCriticsAccentColor}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">
                      Audience Accent
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={aggregateAudienceAccentColor}
                        onChange={(event) => setAggregateAudienceAccentColor(event.target.value)}
                        className="h-10 w-14 rounded-md border border-white/10 bg-black"
                      />
                      <div className="rounded-lg border border-white/10 bg-black px-2.5 py-2 text-xs text-zinc-300">
                        {aggregateAudienceAccentColor}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          {showsAggregateAccentBarOffset && (
            <div className="pt-1">
              <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Accent Bar
                </span>
                <button
                  type="button"
                  onClick={() => setAggregateAccentBarVisible((current) => !current)}
                  className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    aggregateAccentBarVisible
                      ? 'border-violet-500/60 bg-violet-500/20 text-white'
                      : 'border-white/10 bg-black text-zinc-400 hover:text-white'
                  }`}
                >
                  {aggregateAccentBarVisible ? 'Visible' : 'Hidden'}
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Accent Bar Offset
                </span>
                <span className="text-[11px] text-zinc-400">{aggregateAccentBarOffset}px</span>
              </div>
              <input
                type="range"
                min={MIN_AGGREGATE_ACCENT_BAR_OFFSET}
                max={MAX_AGGREGATE_ACCENT_BAR_OFFSET}
                step={1}
                value={aggregateAccentBarOffset}
                onChange={(event) => setAggregateAccentBarOffset(Number(event.target.value))}
                className="mt-2 h-2 w-full accent-violet-500"
              />
              <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
                Negative values move the aggregate accent bar upward a few pixels. You can hide the line entirely with the toggle above in compact and labeled average badge layouts.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const lookSection = (
    <>
      <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-3">
        <div className="text-[11px] font-semibold text-zinc-400">Appearance</div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className={settingsCardClass}>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">{styleLabel}</span>
            <div className={selectorGroupClass}>
              {RATING_STYLE_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => setRatingStyleForType(opt.id as RatingStyle)} className={selectorButtonClass(activeRatingStyle === opt.id)}>{opt.label}</button>
              ))}
            </div>
          </div>
          {previewType !== 'logo' && (
            <div className={settingsCardClass}>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">{textLabel}</span>
              <div className={selectorGroupClass}>
                {activeImageTextOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setImageTextForType(option.id)}
                    className={selectorButtonClass(activeImageText === option.id)}
                    title={option.description}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className={settingsCardClass}>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Rating Values</span>
            <div className={selectorGroupClass}>
              {RATING_VALUE_MODE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setRatingValueMode(option.id)}
                  className={selectorButtonClass(ratingValueMode === option.id)}
                  title={option.description}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className={settingsCardClass}>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Genre Badge</span>
            <div className={selectorGroupClass}>
              {GENRE_BADGE_MODE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setActiveGenreBadgeMode(option.id)}
                  className={selectorButtonClass(activeGenreBadgeMode === option.id)}
                  title={option.description}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className={settingsCardClass}>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Genre Badge Style</span>
            <div className={selectorGroupClass}>
              {GENRE_BADGE_STYLE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setActiveGenreBadgeStyle(option.id)}
                  className={selectorButtonClass(activeGenreBadgeStyle === option.id)}
                  title={option.description}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className={settingsCardClass}>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Genre Badge Position</span>
            <div className={selectorGroupClass}>
              {GENRE_BADGE_POSITION_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setActiveGenreBadgePosition(option.id)}
                  className={selectorButtonClass(activeGenreBadgePosition === option.id)}
                  title={option.description}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className={settingsCardClass}>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Anime Grouping</span>
            <div className={selectorGroupClass}>
              {GENRE_BADGE_ANIME_GROUPING_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setActiveGenreBadgeAnimeGrouping(option.id)}
                  className={selectorButtonClass(activeGenreBadgeAnimeGrouping === option.id)}
                  title={option.description}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="text-[11px] leading-relaxed text-zinc-500">
          {RATING_VALUE_MODE_OPTIONS.find((option) => option.id === ratingValueMode)?.description}{' '}
          Genre badges use a small curated bucket set. Clear genres such as horror, comedy, drama, sci fi, fantasy, crime, documentary, animation, and anime resolve. When drama appears beside a stronger supported family, the more specific bucket still wins. The active preview type keeps its own badge mode, style, position, and scale.
        </p>
        {(previewType === 'poster' || previewType === 'backdrop') ? (
          <div className={settingsCardClass}>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Artwork Source</div>
            <div className={selectorGroupClass}>
              {activeArtworkSourceOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    if (previewType === 'backdrop') {
                      setBackdropArtworkSource(option.id);
                      return;
                    }
                    setPosterArtworkSource(option.id);
                  }}
                  className={selectorButtonClass(activeArtworkSource === option.id)}
                  title={option.description}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {activeArtworkSourceOptionMeta ? (
              <p className="text-[11px] leading-relaxed text-zinc-500">
                {previewType === 'backdrop'
                  ? activeArtworkSourceOptionMeta.description.replace('poster', 'backdrop')
                  : activeArtworkSourceOptionMeta.description}
                {activeArtworkSource === 'fanart'
                  ? ' Original and clean use the top ranked fanart image. Alternative uses the next ranked fanart image when one exists.'
                  : ''}
              </p>
            ) : null}
            {previewType === 'poster' ? (
              <>
                <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Poster Size
                </div>
                <div className={selectorGroupClass}>
                  {POSTER_IMAGE_SIZE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setPosterImageSize(option.id)}
                      className={selectorButtonClass(posterImageSize === option.id)}
                      title={option.description}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-500">
                  {activePosterImageSizeOptionMeta.description}
                </p>
              </>
            ) : null}
          </div>
        ) : null}
        {previewType !== 'logo' && activeImageTextOptionMeta ? (
          <p className="text-[11px] leading-relaxed text-zinc-500">
            {activeImageTextOptionMeta.description}
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-3">
        <div className="text-[11px] font-semibold text-zinc-400">Layouts</div>
        {previewType === 'poster' && (
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-3 space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Poster Layout</div>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <div className="flex flex-wrap gap-1">
                  {POSTER_RATING_LAYOUT_OPTIONS.map(opt => (
                    <button key={opt.id} onClick={() => setPosterRatingsLayout(opt.id as PosterRatingLayout)} className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors ${posterRatingsLayout === opt.id ? 'border-violet-500/60 bg-zinc-800 text-white' : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'}`}>{opt.label}</button>
                  ))}
                </div>
              </div>
              {isVerticalPosterRatingLayout(posterRatingsLayout) && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Max/side</span>
                  <input type="number" value={posterRatingsMaxPerSide ?? ''} onChange={(e) => setPosterRatingsMaxPerSide(normalizeOptionalBadgeCountInput(e.target.value))} placeholder="Auto" min={POSTER_RATINGS_MAX_PER_SIDE_MIN} className="w-16 bg-black border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-violet-500/50 outline-none" />
                  <button onClick={() => setPosterRatingsMaxPerSide(null)} className="rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-[11px] text-zinc-300 hover:bg-zinc-800">Auto</button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Max ratings</span>
                <input
                  type="number"
                  value={posterRatingsMax ?? ''}
                  onChange={(e) => setPosterRatingsMax(normalizeOptionalBadgeCountInput(e.target.value))}
                  placeholder="Auto"
                  min={POSTER_RATINGS_MAX_PER_SIDE_MIN}
                  className="w-16 bg-black border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-violet-500/50 outline-none"
                />
                <button
                  onClick={() => setPosterRatingsMax(null)}
                  className="rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-[11px] text-zinc-300 hover:bg-zinc-800"
                >
                  Auto
                </button>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-500">
              Use this to cap how many rating badges render after ordering. Keep the provider list below enabled for the sources you still want available.
            </p>
          </div>
        )}

        {previewType === 'backdrop' && (
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-3 space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Backdrop Layout</div>
            <div className="flex flex-wrap gap-1">
              {BACKDROP_RATING_LAYOUT_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => setBackdropRatingsLayout(opt.id as BackdropRatingLayout)} className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors ${backdropRatingsLayout === opt.id ? 'border-violet-500/60 bg-zinc-800 text-white' : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'}`}>{opt.label}</button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Max ratings</span>
              <input
                type="number"
                value={backdropRatingsMax ?? ''}
                onChange={(e) => setBackdropRatingsMax(normalizeOptionalBadgeCountInput(e.target.value))}
                placeholder="Auto"
                min={POSTER_RATINGS_MAX_PER_SIDE_MIN}
                className="w-16 bg-black border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-violet-500/50 outline-none"
              />
              <button
                onClick={() => setBackdropRatingsMax(null)}
                className="rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-[11px] text-zinc-300 hover:bg-zinc-800"
              >
                Auto
              </button>
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-500">
              Backdrop output can stay dense, but this cap gives users a cleaner badge row when they only want the top few sources.
            </p>
          </div>
        )}

        {previewType === 'poster' && (
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-3 space-y-3">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Poster Edge Offset
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="range"
                min={0}
                max={MAX_POSTER_EDGE_OFFSET}
                step={1}
                value={posterEdgeOffset}
                onChange={(event) => setPosterEdgeOffset(Number(event.target.value))}
                className="h-2 w-40 accent-violet-500"
              />
              <input
                type="number"
                min={0}
                max={MAX_POSTER_EDGE_OFFSET}
                step={1}
                value={posterEdgeOffset}
                onChange={(event) => {
                  setPosterEdgeOffset(normalizePosterEdgeOffset(event.target.value));
                }}
                className="w-16 bg-black border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-violet-500/50 outline-none"
              />
              <button
                onClick={() => setPosterEdgeOffset(DEFAULT_POSTER_EDGE_OFFSET)}
                className="rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-[11px] text-zinc-300 hover:bg-zinc-800"
              >
                Reset
              </button>
              <span className="text-[11px] text-zinc-500">Extra inset from poster edges</span>
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-500">
              Moves poster side rating stacks, side quality columns, and corner genre badges inward so external app buttons are less likely to cover them.
            </p>
          </div>
        )}

        {shouldShowSideRatingPlacement && (
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-3 space-y-3">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Side Rating Placement
            </div>
            <div className="flex flex-wrap gap-1">
              {SIDE_RATING_POSITION_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setActiveSideRatingsPosition(option.id)}
                  className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors ${
                    activeSideRatingsPosition === option.id
                      ? 'border-violet-500/60 bg-zinc-800 text-white'
                      : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {activeSideRatingsPosition === 'custom' && (
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Vertical Offset
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={activeSideRatingsOffset}
                  onChange={(event) => setActiveSideRatingsOffset(Number(event.target.value))}
                  className="h-2 w-40 accent-violet-500"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={activeSideRatingsOffset}
                  onChange={(event) => {
                    const parsed = Number(event.target.value);
                    setActiveSideRatingsOffset(
                      Number.isFinite(parsed)
                        ? Math.max(0, Math.min(100, Math.round(parsed)))
                        : DEFAULT_SIDE_RATING_OFFSET
                    );
                  }}
                  className="w-16 bg-black border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-violet-500/50 outline-none"
                />
                <span className="text-[11px] text-zinc-500">0 = top, 100 = bottom</span>
              </div>
            )}
            <p className="text-[11px] leading-relaxed text-zinc-500">
              {previewType === 'backdrop'
                ? 'Applies only to the backdrop right vertical stack, including blockbuster mode.'
                : 'Applies only to poster side stacks, including blockbuster mode.'}
            </p>
          </div>
        )}

        {previewType === 'logo' && (
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-3 space-y-3">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Logo Output</div>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Artwork Source</span>
                <div className="erdb-toggle-group flex gap-1 p-1 bg-zinc-900 rounded-lg border border-white/10">
                  {LOGO_ARTWORK_SOURCE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setLogoArtworkSource(option.id)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        logoArtworkSource === option.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                      }`}
                      title={option.description}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Background</span>
                <div className="erdb-toggle-group flex gap-1 p-1 bg-zinc-900 rounded-lg border border-white/10">
                  {(['transparent', 'dark'] as const).map((option) => (
                    <button key={option} onClick={() => setLogoBackground(option)} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${logoBackground === option ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}>
                      {option === 'dark' ? 'Dark' : 'Transparent'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Max ratings</span>
                <input type="number" value={logoRatingsMax ?? ''} onChange={(e) => setLogoRatingsMax(normalizeOptionalBadgeCountInput(e.target.value))} placeholder="Auto" min={POSTER_RATINGS_MAX_PER_SIDE_MIN} className="w-20 bg-black border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-violet-500/50 outline-none" />
                <button onClick={() => setLogoRatingsMax(null)} className="rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-[11px] text-zinc-300 hover:bg-zinc-800">Default</button>
              </div>
            </div>
            <div className="space-y-2 rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Logo Quality Badges</div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Quality Badge Style</span>
                <div className="flex flex-wrap gap-1">
                  {QUALITY_BADGE_STYLE_OPTIONS.map(option => (
                    <button key={`logo-quality-style-${option.id}`} onClick={() => setLogoQualityBadgesStyle(option.id)} className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors ${logoQualityBadgesStyle === option.id ? 'border-violet-500/60 bg-zinc-800 text-white' : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'}`}>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Max badges</span>
                <input type="number" value={logoQualityBadgesMax ?? ''} onChange={(e) => setLogoQualityBadgesMax(normalizeOptionalBadgeCountInput(e.target.value))} placeholder="Auto" min={POSTER_RATINGS_MAX_PER_SIDE_MIN} className="w-16 bg-black border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-violet-500/50 outline-none" />
                <button onClick={() => setLogoQualityBadgesMax(null)} className="rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-[11px] text-zinc-300 hover:bg-zinc-800">Auto</button>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Visible Quality Badges</span>
                <div className="flex flex-wrap gap-1.5">
                  {QUALITY_BADGE_OPTIONS.map((option) => (
                    <button
                      key={`logo-quality-${option.id}`}
                      type="button"
                      onClick={() => toggleQualityBadgePreference(option.id)}
                      className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors ${logoQualityBadgePreferences.includes(option.id) ? 'border-violet-500/60 bg-zinc-800 text-white' : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {activeLogoSourceOptionMeta ? (
              <p className="text-[11px] leading-relaxed text-zinc-500">
                {activeLogoSourceOptionMeta.description.replace('artwork', 'logo assets')}
              </p>
            ) : null}
          </div>
        )}

        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-3 space-y-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Badge Sizing</div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Rating badges</span>
                <span className="text-[11px] text-zinc-400">{activeRatingBadgeScale}%</span>
              </div>
              <input
                type="range"
                min={MIN_BADGE_SCALE_PERCENT}
                max={MAX_BADGE_SCALE_PERCENT}
                step={1}
                value={activeRatingBadgeScale}
                onChange={(event) =>
                  setActiveRatingBadgeScale(normalizeBadgeScalePercent(event.target.value))
                }
                className="h-2 w-full accent-violet-500"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Genre badge</span>
                <span className="text-[11px] text-zinc-400">{activeGenreBadgeScale}%</span>
              </div>
              <input
                type="range"
                min={MIN_BADGE_SCALE_PERCENT}
                max={MAX_GENRE_BADGE_SCALE_PERCENT}
                step={1}
                value={activeGenreBadgeScale}
                onChange={(event) =>
                  setActiveGenreBadgeScale(normalizeGenreBadgeScalePercent(event.target.value))
                }
                className="h-2 w-full accent-violet-500"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Quality badges</span>
                <span className="text-[11px] text-zinc-400">{activeQualityBadgeScale}%</span>
              </div>
              <input
                type="range"
                min={MIN_BADGE_SCALE_PERCENT}
                max={MAX_BADGE_SCALE_PERCENT}
                step={1}
                value={activeQualityBadgeScale}
                onChange={(event) =>
                  setActiveQualityBadgeScale(normalizeBadgeScalePercent(event.target.value))
                }
                className="h-2 w-full accent-violet-500"
              />
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-500">
            These sliders let people increase badge and tag legibility without forcing a new layout. ERDB will still fit the final output back into the selected poster, backdrop, or logo frame.
          </p>
        </div>
      </div>
    </>
  );

  const qualitySection = (
    <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-3">
      <div className="text-[11px] font-semibold text-zinc-400">
        Quality Badges · {qualityBadgeTypeLabel}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {previewType !== 'logo' && (
          <div className={settingsCardClass}>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Stream Badges</span>
            <div className={selectorGroupClass}>
              {STREAM_BADGE_OPTIONS.map(option => (
                <button key={option.id} onClick={() => setActiveStreamBadges(option.id)} className={selectorButtonClass(activeStreamBadges === option.id)}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className={settingsCardClass}>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Badge Style</span>
          <div className={selectorGroupClass}>
            {QUALITY_BADGE_STYLE_OPTIONS.map(option => (
              <button key={`quality-style-${option.id}`} onClick={() => setActiveQualityBadgesStyle(option.id)} className={selectorButtonClass(activeQualityBadgesStyle === option.id)}>
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className={settingsCardClass}>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Max badges</span>
          <div className="flex items-center gap-2">
            <input type="number" value={activeQualityBadgesMax ?? ''} onChange={(e) => setActiveQualityBadgesMax(normalizeOptionalBadgeCountInput(e.target.value))} placeholder="Auto" min={POSTER_RATINGS_MAX_PER_SIDE_MIN} className="w-16 bg-black border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-violet-500/50 outline-none" />
            <button onClick={() => setActiveQualityBadgesMax(null)} className="rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-[11px] text-zinc-300 hover:bg-zinc-800">Auto</button>
          </div>
        </div>
        {shouldShowQualityBadgesSide && (
          <div className={settingsCardClass}>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Side</span>
            <div className={selectorGroupClass}>
              {QUALITY_BADGE_SIDE_OPTIONS.map(option => (
                <button key={option.id} onClick={() => setQualityBadgesSide(option.id)} className={selectorButtonClass(qualityBadgesSide === option.id)}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {shouldShowQualityBadgesPosition && (
          <div className={settingsCardClass}>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Position</span>
            <div className={selectorGroupClass}>
              {QUALITY_BADGE_POSITION_OPTIONS.map(option => (
                <button key={option.id} onClick={() => setPosterQualityBadgesPosition(option.id)} className={selectorButtonClass(posterQualityBadgesPosition === option.id)}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className={settingsCardClass}>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">
          Visible Quality Badges
        </span>
        <div className="flex flex-wrap gap-1.5">
          {QUALITY_BADGE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => toggleQualityBadgePreference(option.id)}
              className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors ${
                activeQualityBadgePreferences.includes(option.id)
                  ? 'border-violet-500/60 bg-zinc-800 text-white'
                  : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-zinc-500">
        Keep only the quality marks that matter for your setup. The toggles stay visible while you edit so you can compare badge coverage, placement, no background styling, and silver mark styling without losing context.
      </p>
    </div>
  );

  const providersSection = (
    <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block">
            {providersLabel} · drag to reorder
          </span>
          <div className="mt-1 text-[11px] text-zinc-500">
            {ratingProviderRows.filter((row) => row.enabled).length} of {ratingProviderRows.length} enabled
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setAllRatingPreferencesEnabled(false)}
            className="rounded-lg border border-white/10 bg-zinc-950 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-900"
          >
            Hide All Ratings
          </button>
          <button
            type="button"
            onClick={() => setAllRatingPreferencesEnabled(true)}
            className="rounded-lg border border-white/10 bg-zinc-950 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-900"
          >
            Enable All
          </button>
        </div>
      </div>
      <p className="text-[10px] leading-4 text-zinc-500">
        ERDB respects this order when rendering badges. Disabled providers stay available but are skipped. When every provider is off, the image renders without rating badges.
      </p>
      <RatingProviderSortableList
        rows={ratingProviderRows}
        onReorder={reorderRatingPreference}
        onToggle={toggleRatingPreference}
        fillDirection="row"
      />
      <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Provider Styling
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
              Customise the icon URL, accent colour, icon size, and stacked accent line behavior per source. Leave a field blank to keep the default ERDB art.
              </p>
            </div>
          <button
            type="button"
            onClick={() =>
              activeProviderMeta &&
              updateProviderAppearanceOverride(activeProviderMeta.id, () => ({}))
            }
            className="rounded-lg border border-white/10 bg-zinc-950 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-900"
          >
            Reset {activeProviderMeta?.label}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ratingProviderRows.map((row) => {
            const meta = RATING_PROVIDER_OPTIONS.find((provider) => provider.id === row.id);
            const isSelected = row.id === activeProviderEditorId;
            const hasOverride = Boolean(ratingProviderAppearanceOverrides[row.id]);
            return (
              <button
                key={`provider-editor-${row.id}`}
                type="button"
                onClick={() => setActiveProviderEditorId(row.id)}
                className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors ${
                  isSelected
                    ? 'border-violet-500/60 bg-zinc-800 text-white'
                    : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                {meta?.label || row.id}
                {hasOverride ? ' *' : ''}
              </button>
            );
          })}
        </div>
        {activeProviderMeta ? (
          <div className="provider-editor-layout">
            <div className="min-w-0 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">
                    Accent Colour
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={
                        activeProviderAppearanceOverride.accentColor ||
                        activeProviderMeta.accentColor
                      }
                      onChange={(event) =>
                        updateProviderAppearanceOverride(activeProviderMeta.id, (current) => ({
                          ...current,
                          accentColor: event.target.value,
                        }))
                      }
                      className="h-10 w-14 rounded-md border border-white/10 bg-black"
                    />
                    <div className="rounded-lg border border-white/10 bg-black px-2.5 py-2 text-xs text-zinc-300">
                      {activeProviderAppearanceOverride.accentColor ||
                        activeProviderMeta.accentColor}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">
                    Icon Size
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={MIN_PROVIDER_ICON_SCALE_PERCENT}
                      max={MAX_PROVIDER_ICON_SCALE_PERCENT}
                      step={1}
                      value={
                        activeProviderAppearanceOverride.iconScalePercent ||
                        DEFAULT_PROVIDER_ICON_SCALE_PERCENT
                      }
                      onChange={(event) =>
                        updateProviderAppearanceOverride(activeProviderMeta.id, (current) => ({
                          ...current,
                          iconScalePercent: normalizeProviderIconScalePercent(
                            event.target.value,
                          ),
                        }))
                      }
                      className="h-2 w-full accent-violet-500"
                    />
                    <span className="w-14 text-right text-[11px] text-zinc-400">
                      {activeProviderAppearanceOverride.iconScalePercent ||
                        DEFAULT_PROVIDER_ICON_SCALE_PERCENT}
                      %
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                      Stacked Badge
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                      Applies when the current rating style is stacked. Fine tune width, body opacity, accent behavior, and per-element X/Y offsets for the top line, logo, and value.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black px-2.5 py-1.5 text-[11px] font-medium text-zinc-300">
                    <input
                      type="checkbox"
                      checked={activeProviderAppearanceOverride.stackedLineVisible !== false}
                      onChange={(event) =>
                        updateProviderAppearanceOverride(activeProviderMeta.id, (current) => ({
                          ...current,
                          stackedLineVisible: event.target.checked ? undefined : false,
                        }))
                      }
                      className="h-3.5 w-3.5 accent-violet-500"
                    />
                    <span>{activeProviderAppearanceOverride.stackedLineVisible === false ? 'Hidden' : 'Visible'}</span>
                  </label>
                </div>
                <div className={`grid gap-3 ${usesStackedRatingStyle ? 'md:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-2 xl:grid-cols-3 opacity-75'}`}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Badge Width</span>
                      <span className="text-[11px] text-zinc-400">
                        {activeProviderAppearanceOverride.stackedWidthPercent ||
                          DEFAULT_STACKED_WIDTH_PERCENT}
                        %
                      </span>
                    </div>
                    <input
                      type="range"
                      min={MIN_STACKED_WIDTH_PERCENT}
                      max={MAX_STACKED_WIDTH_PERCENT}
                      step={1}
                      value={
                        activeProviderAppearanceOverride.stackedWidthPercent ||
                        DEFAULT_STACKED_WIDTH_PERCENT
                      }
                      onChange={(event) =>
                        updateProviderAppearanceOverride(activeProviderMeta.id, (current) => ({
                          ...current,
                          stackedWidthPercent: normalizeStackedWidthPercent(
                            event.target.value,
                          ),
                        }))
                      }
                      className="h-2 w-full accent-violet-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Body Opacity</span>
                      <span className="text-[11px] text-zinc-400">
                        {activeProviderAppearanceOverride.stackedSurfaceOpacityPercent ||
                          DEFAULT_STACKED_SURFACE_OPACITY_PERCENT}
                        %
                      </span>
                    </div>
                    <input
                      type="range"
                      min={MIN_STACKED_SURFACE_OPACITY_PERCENT}
                      max={MAX_STACKED_SURFACE_OPACITY_PERCENT}
                      step={1}
                      value={
                        activeProviderAppearanceOverride.stackedSurfaceOpacityPercent ||
                        DEFAULT_STACKED_SURFACE_OPACITY_PERCENT
                      }
                      onChange={(event) =>
                        updateProviderAppearanceOverride(activeProviderMeta.id, (current) => ({
                          ...current,
                          stackedSurfaceOpacityPercent: normalizeStackedSurfaceOpacityPercent(
                            event.target.value,
                          ),
                        }))
                      }
                      className="h-2 w-full accent-violet-500"
                    />
                  </div>
                  <div className="space-y-2 xl:col-span-1 md:col-span-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Accent Placement</span>
                      <span className="text-[11px] text-zinc-400">
                        {activeProviderAppearanceOverride.stackedAccentMode === 'logo'
                          ? 'Logo only'
                          : 'Badge'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateProviderAppearanceOverride(activeProviderMeta.id, (current) => ({
                            ...current,
                            stackedAccentMode: 'badge',
                          }))
                        }
                        className={`rounded-lg border px-2.5 py-2 text-[11px] font-semibold transition-colors ${
                          (activeProviderAppearanceOverride.stackedAccentMode ||
                            DEFAULT_STACKED_ACCENT_MODE) === 'badge'
                            ? 'border-violet-500/60 bg-violet-500/20 text-white'
                            : 'border-white/10 bg-black text-zinc-400 hover:text-white'
                        }`}
                      >
                        Badge
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateProviderAppearanceOverride(activeProviderMeta.id, (current) => ({
                            ...current,
                            stackedAccentMode: 'logo',
                          }))
                        }
                        className={`rounded-lg border px-2.5 py-2 text-[11px] font-semibold transition-colors ${
                          (activeProviderAppearanceOverride.stackedAccentMode ||
                            DEFAULT_STACKED_ACCENT_MODE) === 'logo'
                            ? 'border-violet-500/60 bg-violet-500/20 text-white'
                            : 'border-white/10 bg-black text-zinc-400 hover:text-white'
                        }`}
                      >
                        Logo only
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Line Width</span>
                      <span className="text-[11px] text-zinc-400">
                        {activeProviderAppearanceOverride.stackedLineWidthPercent ||
                          DEFAULT_STACKED_LINE_WIDTH_PERCENT}
                        %
                      </span>
                    </div>
                    <input
                      type="range"
                      min={MIN_STACKED_LINE_WIDTH_PERCENT}
                      max={MAX_STACKED_LINE_WIDTH_PERCENT}
                      step={1}
                      value={
                        activeProviderAppearanceOverride.stackedLineWidthPercent ||
                        DEFAULT_STACKED_LINE_WIDTH_PERCENT
                      }
                      onChange={(event) =>
                        updateProviderAppearanceOverride(activeProviderMeta.id, (current) => ({
                          ...current,
                          stackedLineWidthPercent: normalizeStackedLineWidthPercent(
                            event.target.value,
                          ),
                        }))
                      }
                      className="h-2 w-full accent-violet-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Line Thickness</span>
                      <span className="text-[11px] text-zinc-400">
                        {activeProviderAppearanceOverride.stackedLineHeightPercent ||
                          DEFAULT_STACKED_LINE_HEIGHT_PERCENT}
                        %
                      </span>
                    </div>
                    <input
                      type="range"
                      min={MIN_STACKED_LINE_HEIGHT_PERCENT}
                      max={MAX_STACKED_LINE_HEIGHT_PERCENT}
                      step={1}
                      value={
                        activeProviderAppearanceOverride.stackedLineHeightPercent ||
                        DEFAULT_STACKED_LINE_HEIGHT_PERCENT
                      }
                      onChange={(event) =>
                        updateProviderAppearanceOverride(activeProviderMeta.id, (current) => ({
                          ...current,
                          stackedLineHeightPercent: normalizeStackedLineHeightPercent(
                            event.target.value,
                          ),
                        }))
                      }
                      className="h-2 w-full accent-violet-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Line Gap</span>
                      <span className="text-[11px] text-zinc-400">
                        {activeProviderAppearanceOverride.stackedLineGapPercent ||
                          DEFAULT_STACKED_LINE_GAP_PERCENT}
                        %
                      </span>
                    </div>
                    <input
                      type="range"
                      min={MIN_STACKED_LINE_GAP_PERCENT}
                      max={MAX_STACKED_LINE_GAP_PERCENT}
                      step={1}
                      value={
                        activeProviderAppearanceOverride.stackedLineGapPercent ||
                        DEFAULT_STACKED_LINE_GAP_PERCENT
                      }
                      onChange={(event) =>
                        updateProviderAppearanceOverride(activeProviderMeta.id, (current) => ({
                          ...current,
                          stackedLineGapPercent: normalizeStackedLineGapPercent(
                            event.target.value,
                          ),
                        }))
                      }
                      className="h-2 w-full accent-violet-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Line X Offset</span>
                      <span className="text-[11px] text-zinc-400">
                        {activeProviderAppearanceOverride.stackedLineOffsetX ||
                          DEFAULT_STACKED_ELEMENT_OFFSET_PX}
                        px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={MIN_STACKED_ELEMENT_OFFSET_PX}
                      max={MAX_STACKED_ELEMENT_OFFSET_PX}
                      step={1}
                      value={
                        activeProviderAppearanceOverride.stackedLineOffsetX ||
                        DEFAULT_STACKED_ELEMENT_OFFSET_PX
                      }
                      onChange={(event) =>
                        updateProviderAppearanceOverride(activeProviderMeta.id, (current) => ({
                          ...current,
                          stackedLineOffsetX: normalizeStackedElementOffsetPx(
                            event.target.value,
                          ),
                        }))
                      }
                      className="h-2 w-full accent-violet-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Line Y Offset</span>
                      <span className="text-[11px] text-zinc-400">
                        {activeProviderAppearanceOverride.stackedLineOffsetY ||
                          DEFAULT_STACKED_ELEMENT_OFFSET_PX}
                        px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={MIN_STACKED_ELEMENT_OFFSET_PX}
                      max={MAX_STACKED_ELEMENT_OFFSET_PX}
                      step={1}
                      value={
                        activeProviderAppearanceOverride.stackedLineOffsetY ||
                        DEFAULT_STACKED_ELEMENT_OFFSET_PX
                      }
                      onChange={(event) =>
                        updateProviderAppearanceOverride(activeProviderMeta.id, (current) => ({
                          ...current,
                          stackedLineOffsetY: normalizeStackedElementOffsetPx(
                            event.target.value,
                          ),
                        }))
                      }
                      className="h-2 w-full accent-violet-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Logo X Offset</span>
                      <span className="text-[11px] text-zinc-400">
                        {activeProviderAppearanceOverride.stackedIconOffsetX ||
                          DEFAULT_STACKED_ELEMENT_OFFSET_PX}
                        px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={MIN_STACKED_ELEMENT_OFFSET_PX}
                      max={MAX_STACKED_ELEMENT_OFFSET_PX}
                      step={1}
                      value={
                        activeProviderAppearanceOverride.stackedIconOffsetX ||
                        DEFAULT_STACKED_ELEMENT_OFFSET_PX
                      }
                      onChange={(event) =>
                        updateProviderAppearanceOverride(activeProviderMeta.id, (current) => ({
                          ...current,
                          stackedIconOffsetX: normalizeStackedElementOffsetPx(
                            event.target.value,
                          ),
                        }))
                      }
                      className="h-2 w-full accent-violet-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Logo Y Offset</span>
                      <span className="text-[11px] text-zinc-400">
                        {activeProviderAppearanceOverride.stackedIconOffsetY ||
                          DEFAULT_STACKED_ELEMENT_OFFSET_PX}
                        px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={MIN_STACKED_ELEMENT_OFFSET_PX}
                      max={MAX_STACKED_ELEMENT_OFFSET_PX}
                      step={1}
                      value={
                        activeProviderAppearanceOverride.stackedIconOffsetY ||
                        DEFAULT_STACKED_ELEMENT_OFFSET_PX
                      }
                      onChange={(event) =>
                        updateProviderAppearanceOverride(activeProviderMeta.id, (current) => ({
                          ...current,
                          stackedIconOffsetY: normalizeStackedElementOffsetPx(
                            event.target.value,
                          ),
                        }))
                      }
                      className="h-2 w-full accent-violet-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Rating X Offset</span>
                      <span className="text-[11px] text-zinc-400">
                        {activeProviderAppearanceOverride.stackedValueOffsetX ||
                          DEFAULT_STACKED_ELEMENT_OFFSET_PX}
                        px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={MIN_STACKED_ELEMENT_OFFSET_PX}
                      max={MAX_STACKED_ELEMENT_OFFSET_PX}
                      step={1}
                      value={
                        activeProviderAppearanceOverride.stackedValueOffsetX ||
                        DEFAULT_STACKED_ELEMENT_OFFSET_PX
                      }
                      onChange={(event) =>
                        updateProviderAppearanceOverride(activeProviderMeta.id, (current) => ({
                          ...current,
                          stackedValueOffsetX: normalizeStackedElementOffsetPx(
                            event.target.value,
                          ),
                        }))
                      }
                      className="h-2 w-full accent-violet-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Rating Y Offset</span>
                      <span className="text-[11px] text-zinc-400">
                        {activeProviderAppearanceOverride.stackedValueOffsetY ||
                          DEFAULT_STACKED_ELEMENT_OFFSET_PX}
                        px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={MIN_STACKED_ELEMENT_OFFSET_PX}
                      max={MAX_STACKED_ELEMENT_OFFSET_PX}
                      step={1}
                      value={
                        activeProviderAppearanceOverride.stackedValueOffsetY ||
                        DEFAULT_STACKED_ELEMENT_OFFSET_PX
                      }
                      onChange={(event) =>
                        updateProviderAppearanceOverride(activeProviderMeta.id, (current) => ({
                          ...current,
                          stackedValueOffsetY: normalizeStackedElementOffsetPx(
                            event.target.value,
                          ),
                        }))
                      }
                      className="h-2 w-full accent-violet-500"
                    />
                  </div>
                </div>
                {!usesStackedRatingStyle ? (
                  <p className="text-[11px] leading-relaxed text-zinc-500">
                    You can set these now and they will apply the moment this output switches to stacked badges.
                  </p>
                ) : null}
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">
                  Custom Icon URL
                </label>
                <input
                  type="url"
                  value={activeProviderAppearanceOverride.iconUrl || ''}
                  onChange={(event) =>
                    updateProviderAppearanceOverride(activeProviderMeta.id, (current) => ({
                      ...current,
                      iconUrl: event.target.value,
                    }))
                  }
                  placeholder="https://example.com/logo.svg or data:image/svg+xml,..."
                  className="w-full bg-black border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:border-violet-500/50 outline-none"
                />
                <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
                  Paste a direct image URL or a data URI. The expected format stays visible here while you edit so you do not have to remember it after adding a custom logo.
                </p>
              </div>
            </div>
            <div className="provider-editor-preview self-start rounded-xl border border-white/10 bg-black/60 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Active Preview
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[auto,1fr] sm:items-start">
                <div
                  className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/10 shadow-[0_14px_34px_rgba(0,0,0,0.28)]"
                  style={{
                    backgroundColor:
                      activeProviderAppearanceOverride.accentColor ||
                      activeProviderMeta.accentColor,
                  }}
                >
                  <Image
                    src={activeProviderAppearanceOverride.iconUrl || activeProviderMeta.iconUrl}
                    alt={`${activeProviderMeta.label} icon`}
                    width={32}
                    height={32}
                    unoptimized
                    className="max-h-8 max-w-8 object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white">
                    {activeProviderMeta.label}
                  </div>
                  <div className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                    Current icon and accent preview for poster, backdrop, and logo output. Stacked controls adjust width, surface opacity, and accent placement for this source.
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  const simpleQuickTuneSection = (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        Quick Tune
      </div>
      <h4 className="mt-2 text-lg font-semibold text-white">Everyday artwork controls</h4>
      <p className="mt-2 text-[12px] leading-6 text-zinc-400">
        Simple mode keeps the obvious artwork switches here. Advanced mode reveals manual provider
        ordering, badge sizing, layout offsets, and per source styling.
      </p>
      <div className="mt-4 space-y-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Presentation
          </div>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {quickPresentationOptions.map((option) => (
              <button
                key={`simple-presentation-${option.id}`}
                type="button"
                onClick={() => setRatingPresentationForType(option.id)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  activeRatingPresentation === option.id
                    ? 'border-violet-500/60 bg-violet-500/10 text-white'
                    : 'border-white/10 bg-zinc-900/60 text-zinc-300 hover:border-white/20 hover:bg-zinc-900'
                }`}
              >
                <div className="text-sm font-semibold">{option.label}</div>
                <div className="mt-1 text-[11px] leading-5 text-zinc-500">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Rating Style
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {RATING_STYLE_OPTIONS.map((option) => (
                <button
                  key={`simple-style-${option.id}`}
                  type="button"
                  onClick={() => setRatingStyleForType(option.id)}
                  className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                    activeRatingStyle === option.id
                      ? 'border-violet-500/60 bg-zinc-800 text-white'
                      : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {previewType !== 'logo' ? (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Artwork Text
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {activeImageTextOptions.map((option) => (
                  <button
                    key={`simple-text-${option.id}`}
                    type="button"
                    onClick={() => setImageTextForType(option.id)}
                    className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                      activeImageText === option.id
                        ? 'border-violet-500/60 bg-zinc-800 text-white'
                        : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Logo Background
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {(['transparent', 'dark'] as const).map((option) => (
                  <button
                    key={`simple-logo-background-${option}`}
                    type="button"
                    onClick={() => setLogoBackground(option)}
                    className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                      logoBackground === option
                        ? 'border-violet-500/60 bg-zinc-800 text-white'
                        : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {option === 'dark' ? 'Dark' : 'Transparent'}
                  </button>
                ))}
              </div>
            </div>
          )}
          {previewType === 'poster' ? (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Poster Size
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {POSTER_IMAGE_SIZE_OPTIONS.map((option) => (
                  <button
                    key={`simple-poster-size-${option.id}`}
                    type="button"
                    onClick={() => setPosterImageSize(option.id)}
                    className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                      posterImageSize === option.id
                        ? 'border-violet-500/60 bg-zinc-800 text-white'
                        : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                    title={option.description}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Artwork Source
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {(previewType === 'logo' ? LOGO_ARTWORK_SOURCE_OPTIONS : activeArtworkSourceOptions).map((option) => (
                <button
                  key={`simple-art-${option.id}`}
                  type="button"
                  onClick={() => {
                    if (previewType === 'logo') {
                      setLogoArtworkSource(option.id as ArtworkSource);
                      return;
                    }
                    if (previewType === 'backdrop') {
                      setBackdropArtworkSource(option.id as ArtworkSource);
                      return;
                    }
                    setPosterArtworkSource(option.id as ArtworkSource);
                  }}
                  className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                    (previewType === 'logo'
                      ? logoArtworkSource
                      : activeArtworkSource) === option.id
                      ? 'border-violet-500/60 bg-zinc-800 text-white'
                      : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Genre Badge
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {GENRE_BADGE_MODE_OPTIONS.filter((option) =>
                option.id === 'off' || option.id === 'text' || option.id === 'both',
              ).map((option) => (
                <button
                  key={`simple-genre-${option.id}`}
                  type="button"
                  onClick={() => setActiveGenreBadgeMode(option.id)}
                  className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                    activeGenreBadgeMode === option.id
                      ? 'border-violet-500/60 bg-zinc-800 text-white'
                      : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {previewType !== 'logo' ? (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Stream Badges
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {STREAM_BADGE_OPTIONS.map((option) => (
                  <button
                    key={`simple-stream-${option.id}`}
                    type="button"
                    onClick={() => setActiveStreamBadges(option.id)}
                    className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                      activeStreamBadges === option.id
                        ? 'border-violet-500/60 bg-zinc-800 text-white'
                        : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  const simpleConfiguratorContent = (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-black/35 p-4 space-y-4">
        {workspaceManagementSection}
        <div className="border-t border-white/10" />
        {accessKeysSection}
        <div className="border-t border-white/10" />
        {mediaTargetSection}
      </div>
      {simpleQuickTuneSection}
    </div>
  );

  const advancedConfiguratorContent = (
    <div className="space-y-3">
      <ConfiguratorAccordionSection
        title="Essentials"
        description="Workspace actions, access keys, and the active media target."
        isOpen={openAdvancedSections.includes('essentials')}
        onToggle={() => handleToggleAdvancedSection('essentials')}
        tone="accent"
      >
        <div className="space-y-4">
          {workspaceManagementSection}
          <div className="border-t border-white/10" />
          {accessKeysSection}
          <div className="border-t border-white/10" />
          {mediaTargetSection}
        </div>
      </ConfiguratorAccordionSection>
      <ConfiguratorAccordionSection
        title="Presentation"
        description="Choose the overall badge treatment, aggregate source, and accent behavior."
        isOpen={openAdvancedSections.includes('presentation')}
        onToggle={() => handleToggleAdvancedSection('presentation')}
      >
        {presentationSection}
      </ConfiguratorAccordionSection>
      <ConfiguratorAccordionSection
        title="Look & Layout"
        description="Artwork source, genre badges, layouts, logo output, and badge sizing."
        isOpen={openAdvancedSections.includes('look')}
        onToggle={() => handleToggleAdvancedSection('look')}
      >
        <div className="space-y-3">{lookSection}</div>
      </ConfiguratorAccordionSection>
      <ConfiguratorAccordionSection
        title="Quality Badges"
        description="Stream badges, visible media marks, and quality badge positioning."
        isOpen={openAdvancedSections.includes('quality')}
        onToggle={() => handleToggleAdvancedSection('quality')}
      >
        {qualitySection}
      </ConfiguratorAccordionSection>
      <ConfiguratorAccordionSection
        title="Providers"
        description="Manual ordering, per provider enablement, and custom styling overrides."
        isOpen={openAdvancedSections.includes('providers')}
        onToggle={() => handleToggleAdvancedSection('providers')}
      >
        {providersSection}
      </ConfiguratorAccordionSection>
    </div>
  );

  return (
    <div
      ref={pageRef}
      className="erdb-page min-h-screen bg-transparent text-zinc-300 selection:bg-violet-500/30"
    >
      <nav ref={navRef} className="erdb-chrome sticky top-0 z-50">
        <div className="erdb-nav-shell w-full px-6 py-4 2xl:px-8">
          <div className="erdb-nav-desktop flex flex-wrap items-center justify-between gap-4">
            <div className="erdb-nav-primary min-w-0">
              <BrandLockup compact />
              <span className="erdb-brand-tag">Stateless ratings engine</span>
              <DeploymentVersionPill compact />
              <LatestReleasePill
                compact
                releaseTag={latestReleaseTag}
                releaseUrl={latestReleaseUrl}
                loading={isLatestReleaseLoading}
                pendingTag={pendingReleaseTag}
              />
            </div>
            <div className="erdb-nav-links flex flex-wrap items-center gap-2 text-sm font-medium">
              <a href="#preview" onClick={handleAnchorClick} className="erdb-nav-link">Configurator</a>
              <a href="#proxy" onClick={handleAnchorClick} className="erdb-nav-link">Addon Proxy</a>
              <a href="#docs" onClick={handleAnchorClick} className="erdb-nav-link">API Docs</a>
              <a href={BRAND_GITHUB_URL} target="_blank" rel="noreferrer" className="erdb-nav-link">github</a>
              <UptimePill label="Uptime" />
              <SupportPill label="Support" />
            </div>
          </div>
          <div className="erdb-nav-mobile-row">
            <BrandLockup compact />
            <button
              type="button"
              className="erdb-nav-menu-button"
              aria-expanded={isMobileNavOpen}
              aria-controls="site-mobile-nav"
              aria-label={isMobileNavOpen ? 'Close site navigation' : 'Open site navigation'}
              onClick={() => setIsMobileNavOpen((current) => !current)}
            >
              {isMobileNavOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
              <span className="font-mono text-[11px] uppercase tracking-[0.22em]">
                {isMobileNavOpen ? 'Close' : 'Menu'}
              </span>
            </button>
          </div>
          {isMobileNavOpen ? (
            <div id="site-mobile-nav" className="erdb-mobile-nav-drawer">
              <div className="erdb-mobile-nav-status">
                <DeploymentVersionPill compact />
                <LatestReleasePill
                  compact
                  releaseTag={latestReleaseTag}
                  releaseUrl={latestReleaseUrl}
                  loading={isLatestReleaseLoading}
                  pendingTag={pendingReleaseTag}
                />
              </div>
              <div className="erdb-mobile-nav-links">
                <a href="#preview" onClick={handleAnchorClick} className="erdb-nav-link">Configurator</a>
                <a href="#proxy" onClick={handleAnchorClick} className="erdb-nav-link">Addon Proxy</a>
                <a href="#docs" onClick={handleAnchorClick} className="erdb-nav-link">API Docs</a>
                <a
                  href={BRAND_GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="erdb-nav-link"
                  onClick={closeMobileNav}
                >
                  github
                </a>
                <UptimePill label="Uptime" />
                <SupportPill label="Support" />
              </div>
            </div>
          ) : null}
        </div>
      </nav>

      <main className="erdb-main w-full px-6 py-16 md:py-20 2xl:px-8">
        <section ref={heroRef} className="erdb-hero-section relative">
          <div className="erdb-hero-orb absolute inset-0 rounded-[3rem] pointer-events-none" />
          <div className="erdb-hero-grid">
            <div className="erdb-hero-copy">
              <div className="erdb-hero-meta">
                <p className="site-section-eyebrow font-mono">IbbyLabs image engine</p>
                <div className="erdb-version-pill-group">
                  <DeploymentVersionPill />
                  <LatestReleasePill
                    releaseTag={latestReleaseTag}
                    releaseUrl={latestReleaseUrl}
                    loading={isLatestReleaseLoading}
                    pendingTag={pendingReleaseTag}
                  />
                </div>
              </div>
              <h1 className="erdb-hero-title font-bold text-white">
                Stunning Ratings.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-500 to-violet-600">
                  Stateless API.
                </span>
              </h1>
              <p className="erdb-hero-subtitle mt-4 text-lg text-zinc-400 leading-relaxed">
                Built by IbbyLabs, based on ERDB by RealBestia.
                Generate dynamic posters, backdrops, and logos with a cleaner config to output workflow.
              </p>
              <p className="erdb-hero-version-note font-mono">
                {versionStatusNote}
              </p>
              <div className="erdb-hero-actions flex flex-wrap items-center gap-4">
                <a href="#preview" onClick={handleAnchorClick} className="erdb-hero-primary">
                  Open Configurator
                </a>
                <a href="#docs" onClick={handleAnchorClick} className="erdb-hero-secondary">
                  Read API Docs
                </a>
              </div>
              <div className="site-discord-callout">
                <p className="site-discord-callout-title">Need help with ERDB, ratings, or the addon proxy?</p>
                <p className="site-discord-callout-copy">
                  Join the ERDB communities for help with rendering issues, badges, language settings, or addon setup. The AIOStreams channel is great for shared troubleshooting, and the official ERDB server is the direct project home.
                </p>
                <div className="site-discord-callout-actions">
                  <DiscordPill
                    href={BRAND_DISCORD_AIO_URL}
                    label={BRAND_DISCORD_AIO_LABEL}
                    title="Open the ERDB channel in the AIOStreams Discord"
                  />
                  <DiscordPill
                    href={BRAND_DISCORD_OFFICIAL_URL}
                    label={BRAND_DISCORD_OFFICIAL_LABEL}
                    title="Open the official ERDB Discord"
                  />
                </div>
                <span className="site-discord-fallback">
                  If an invite does not open or has expired, message{' '}
                  <a href={BRAND_DISCORD_DM_URL} target="_blank" rel="noreferrer">
                    {BRAND_DISCORD_DM_HANDLE}
                  </a>{' '}
                  on Discord.
                </span>
              </div>
              <div className="erdb-hero-strip">
                <div className="erdb-hero-chip">Poster, backdrop, and logo output</div>
                <div className="erdb-hero-chip">One config string for every integration</div>
                <div className="erdb-hero-chip">Manifest proxy for Stremio addons</div>
              </div>
              <RecentChanges
                commits={recentCommits}
                visibleCount={visibleRecentCommitCount}
                onLoadMore={setVisibleRecentCommitCount}
                loading={isRecentCommitsLoading}
                error={recentCommitsError}
                nowMs={nowMs}
              />
            </div>

            <aside className="erdb-panel erdb-hero-panel">
              <p className="erdb-panel-eyebrow font-mono">Workflow</p>
              <div className="erdb-hero-panel-stack">
                <div>
                  <h2 className="erdb-panel-title text-white">From config to artwork without a dashboard</h2>
                  <p className="erdb-panel-copy text-zinc-400">
                    Configure once, copy the string, and plug ERDB into direct image routes or a rewritten addon manifest.
                  </p>
                </div>
                <div className="erdb-hero-flow">
                  <div className="erdb-hero-flow-step">
                    <span className="erdb-hero-flow-index">1</span>
                    <div>
                      <div className="erdb-hero-flow-title">Set providers and layouts</div>
                      <div className="erdb-hero-flow-copy">Choose per type ratings, text, and badge behavior.</div>
                    </div>
                  </div>
                  <div className="erdb-hero-flow-step">
                    <span className="erdb-hero-flow-index">2</span>
                    <div>
                      <div className="erdb-hero-flow-title">Copy the generated output</div>
                      <div className="erdb-hero-flow-copy">Use a config string or a manifest URL depending on the integration.</div>
                    </div>
                  </div>
                  <div className="erdb-hero-flow-step">
                    <span className="erdb-hero-flow-index">3</span>
                    <div>
                      <div className="erdb-hero-flow-title">Render artwork on demand</div>
                      <div className="erdb-hero-flow-copy">Serve branded media images without storing user state server side.</div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section id="preview" className="erdb-section scroll-mt-24">
          <div className="rounded-[32px] border border-violet-500/15 bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.12),_transparent_60%),linear-gradient(180deg,rgba(30,22,42,0.95),rgba(14,10,22,0.98))] p-5 md:p-6 xl:p-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <SectionHeader
                eyebrow="Workspace"
                title="Configurator & Proxy"
                description="Tune layout, ratings, badges, and language once, then export a shareable config string or generate a proxy manifest from the same state. Saved workspace values stay in this browser until you copy or export them."
              />
              <div className="flex flex-wrap gap-2 xl:max-w-md xl:justify-end">
                {[
                  'Shared workspace',
                  'Live preview',
                  'Config string export',
                  'Proxy manifest export',
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-zinc-950/80 px-3 py-1 text-[11px] font-medium text-zinc-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-6 erdb-surface-grid grid items-start gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(0,1fr)_minmax(0,1fr)] xl:gap-6">
            <div id="workspace-settings" className="space-y-5 scroll-mt-24 xl:col-start-1">
              <div className="erdb-panel erdb-panel-form space-y-4 rounded-3xl border border-white/10 bg-zinc-900/60 p-4 md:p-5">
                <div className="erdb-panel-head">
                  <div>
                    <p className="erdb-panel-eyebrow font-mono">Inputs</p>
                    <h3 className="erdb-panel-title text-white">Configurator</h3>
                    <p className="erdb-panel-copy text-zinc-400">
                      Pick a setup mode, start from a preset, then tune the same state that powers the preview, config string, and addon proxy.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 min-[861px]:hidden">
                  <a
                    href="#workspace-preview"
                    onClick={handleAnchorClick}
                    className="erdb-nav-link text-[11px]"
                  >
                    Jump to preview
                  </a>
                </div>
                {setupModeSection}
                {presetHubSection}
                {experienceMode === 'simple' ? simpleConfiguratorContent : advancedConfiguratorContent}
              </div>
            </div>

            <div id="workspace-preview" className="space-y-5 scroll-mt-24 xl:col-start-2 xl:self-stretch">
              <div
                className={
                  stickyPreviewEnabled
                    ? 'xl:sticky xl:top-[var(--workspace-sticky-top)] xl:z-10'
                    : ''
                }
              >
                <div
                  className={`erdb-panel erdb-panel-preview rounded-3xl border border-white/10 bg-zinc-900/60 p-6 ${
                    stickyPreviewEnabled
                      ? 'xl:max-h-[calc(100vh-var(--workspace-sticky-top)-20px)] xl:overflow-auto'
                      : ''
                  }`}
                >
                  <div className="erdb-panel-head">
                    <div>
                      <p className="erdb-panel-eyebrow font-mono">Output</p>
                      <h3 className="text-xl font-semibold text-white">Preview Output</h3>
                      <p className="mt-2 text-sm text-zinc-400">
                        Stateless dynamic layout generated via query parameters.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-zinc-500">Sticky preview</span>
                    <button
                      type="button"
                      onClick={() => setStickyPreviewEnabled((current) => !current)}
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        stickyPreviewEnabled
                          ? 'border-violet-500/60 bg-zinc-800 text-white'
                          : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {stickyPreviewEnabled ? 'On' : 'Off'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 min-[861px]:hidden">
                    <a
                      href="#workspace-settings"
                      onClick={handleAnchorClick}
                      className="erdb-nav-link text-[11px]"
                    >
                      Back to settings
                    </a>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    {(['poster', 'backdrop', 'logo'] as const).map((type) => (
                      <span
                        key={`preview-pill-${type}`}
                        className={`rounded-full border px-3 py-1 text-[11px] font-medium ${
                          previewType === type
                            ? 'border-violet-500/60 bg-zinc-800 text-white'
                            : 'border-white/10 bg-zinc-950 text-zinc-400'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 rounded-2xl border border-white/10 bg-black/70 p-4 min-h-[280px] sm:min-h-[320px] flex items-center justify-center flex-col">
                    {previewUrl && !previewErrored ? (
                      <div className="z-10 w-full flex flex-col items-center gap-8">
                        <div className={`relative shadow-2xl shadow-black ring-1 ring-white/10 rounded-2xl overflow-hidden ${previewType === 'poster'
                          ? 'aspect-[2/3] w-full max-w-[18rem]'
                          : previewType === 'logo'
                            ? 'h-48 w-full max-w-xl'
                            : 'aspect-video w-full max-w-2xl'
                          }`}>
                          <Image
                            key={previewUrl}
                            src={previewUrl}
                            alt="Preview"
                            unoptimized
                            fill
                            className={previewType === 'logo' ? 'object-contain' : 'object-cover'}
                            onError={() => {
                              void handlePreviewImageError(previewUrl);
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-zinc-500 text-center max-w-sm leading-6">
                        {previewErrored
                          ? previewErrorDetails || 'Preview could not be rendered with the current media ID or settings.'
                          : tmdbKey.trim()
                            ? 'No preview available.'
                            : 'Add a TMDB key to enable live preview.'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="erdb-panel erdb-panel-preview rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Genre Badge Samples</div>
                    <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                      Curated movie, show, animation, and anime renders that keep the badge decision fixed while you compare mode, style, and placement.
                    </p>
                  </div>
                  <div className="flex gap-1 p-1 rounded-lg border border-white/10 bg-zinc-900">
                    {GENRE_BADGE_MODE_OPTIONS.map((option) => (
                      <button
                        key={`genre-preview-mode-${option.id}`}
                        type="button"
                        onClick={() => setGenrePreviewMode(option.id)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          genrePreviewMode === option.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                        }`}
                        title={option.description}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                {tmdbKey.trim() ? (
                  <div className="mt-5 grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-1">
                    {genrePreviewCards.map(({ sample, url }) => {
                      const family = GENRE_BADGE_FAMILY_META[sample.familyId];
                      const accentStyle = {
                        borderColor: hexToRgbaCss(family.accentColor, 0.45),
                        backgroundImage: `linear-gradient(145deg, ${hexToRgbaCss(family.accentColor, 0.18)}, rgba(24,24,27,0.88) 62%)`,
                      };
                      const mediaFrameClass =
                        sample.previewType === 'poster'
                          ? 'aspect-[2/3]'
                          : sample.previewType === 'logo'
                            ? 'h-40'
                            : 'aspect-video';

                      return (
                        <article key={sample.key} className="flex h-full flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-950/60 p-3">
                          <div className="flex min-h-[3.5rem] flex-col items-start gap-2">
                            <div className="min-w-0">
                              <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                                {sample.typeLabel}
                              </div>
                              <h4 className="mt-1 text-sm font-semibold text-white">{sample.title}</h4>
                            </div>
                            <span
                              className="shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-white"
                              style={accentStyle}
                            >
                              {family.label}
                            </span>
                          </div>
                          <div className={`relative overflow-hidden rounded-xl border border-white/10 bg-black/70 shadow-xl shadow-black/40 ${mediaFrameClass}`}>
                            <Image
                              key={url}
                              src={url}
                              alt={`${sample.title} ${sample.typeLabel} genre sample`}
                              unoptimized
                              fill
                              className={sample.previewType === 'logo' ? 'object-contain' : 'object-cover'}
                            />
                          </div>
                          <p className="text-[11px] leading-5 text-zinc-400">{sample.decision}</p>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-zinc-950/40 px-4 py-5 text-[11px] leading-5 text-zinc-500">
                    Add a TMDB key above to load the curated sample board.
                  </div>
                )}
              </div>
            </div>

            <div id="workspace-export" className="scroll-mt-24 xl:col-span-2 xl:col-start-1">
              <div className="erdb-panel erdb-panel-emphasis rounded-3xl border border-white/10 bg-zinc-900/60 p-4 md:p-5">
                <div className="erdb-panel-head">
                  <div>
                    <p className="erdb-panel-eyebrow font-mono">Export</p>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Code2 className="w-5 h-5 text-violet-500" /> ERDB Config String
                    </h3>
                    <p className="mt-2 text-sm text-zinc-400">
                      Base64url string containing API keys and all settings. Base URL is detected automatically from the current domain.
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[11px] leading-5 text-zinc-500">
                  Use this when another tool expects one ERDB config field. The settings travel inside this string, not inside your saved workspace by itself.
                </p>
                <div className="mt-3 rounded-2xl border border-white/10 bg-black/70 p-4 overflow-hidden">
                  <div className={`font-mono text-xs text-zinc-300 break-all${!showConfigString && configString ? ' select-none' : ''}`}>
                    {displayedConfigString || 'Add TMDB key and MDBList key to generate the config string.'}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleCopyConfig}
                    disabled={!canGenerateConfig}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${canGenerateConfig ? (configCopied ? 'bg-green-500 text-white' : 'bg-violet-500 text-white hover:bg-violet-400') : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
                  >
                    {configCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>COPIED</span>
                      </>
                    ) : (
                      <>
                        <Clipboard className="w-3.5 h-3.5" />
                        <span>COPY STRING</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowConfigString((prev) => !prev)}
                    disabled={!canGenerateConfig}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${canGenerateConfig ? 'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 hover:text-white border border-violet-500/30' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'}`}
                    aria-label={showConfigString ? 'Hide config string' : 'Show config string'}
                  >
                    {showConfigString ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showConfigString ? 'HIDE' : 'SHOW'}</span>
                  </button>
                </div>
                {!canGenerateConfig && (
                  <p className="mt-3 text-[11px] text-zinc-500">
                    Add TMDB key and MDBList key to generate a valid config string.
                  </p>
                )}
                <div className="mt-5 border-t border-white/10 pt-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                        AIOMetadata URLs
                      </div>
                      <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                        Ready to paste URL patterns for the AIOMetadata art override fields.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyAiometadata}
                      disabled={!aiometadataPatternRows.length}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                        aiometadataPatternRows.length
                          ? aiometadataCopied
                            ? 'bg-green-500 text-white'
                            : 'bg-violet-500 text-white hover:bg-violet-400'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      {aiometadataCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>COPIED</span>
                        </>
                      ) : (
                        <>
                          <Clipboard className="w-3.5 h-3.5" />
                          <span>COPY ALL</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-3 text-[11px] leading-5 text-zinc-500">
                    These presets match the live AIOMetadata defaults: background and logo use type aware TMDB IDs, episode thumbs use IMDb with season and episode placeholders, and poster uses the selected ID source mode.
                  </p>
                  <div className="mt-4 space-y-4 rounded-2xl border border-white/10 bg-black/35 p-4">
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                      <div className="rounded-xl border border-white/10 bg-zinc-950/70 p-3">
                        <div className="text-[11px] font-semibold text-zinc-200">Poster ID source</div>
                        <p className="mt-2 text-[10px] leading-4 text-zinc-500 mb-3">
                          Determines which database ID to include in poster URLs. Most users should leave this on auto for best poster rewrite coverage.
                        </p>
                        <div className="space-y-3">
                          <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                              type="radio"
                              name="posterIdMode"
                              value="auto"
                              checked={posterIdMode === 'auto'}
                              onChange={(e) => setPosterIdMode(e.target.value as 'auto' | 'tmdb' | 'imdb')}
                              className="mt-1 h-4 w-4 rounded-full border-white/20 bg-black accent-violet-500"
                            />
                            <span className="space-y-1">
                              <span className="block text-[11px] font-medium text-zinc-300">Auto (typed TMDB)</span>
                              <span className="block text-[10px] text-zinc-600">Pick this if posters fail to rewrite or you want the most reliable behavior. Defaults to TMDB IDs with type prefix.</span>
                            </span>
                          </label>
                          <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                              type="radio"
                              name="posterIdMode"
                              value="tmdb"
                              checked={posterIdMode === 'tmdb'}
                              onChange={(e) => setPosterIdMode(e.target.value as 'auto' | 'tmdb' | 'imdb')}
                              className="mt-1 h-4 w-4 rounded-full border-white/20 bg-black accent-violet-500"
                            />
                            <span className="space-y-1">
                              <span className="block text-[11px] font-medium text-zinc-300">TMDB</span>
                              <span className="block text-[10px] text-zinc-600">Same as auto but explicit. Use this if you want to be sure you are always using TMDB IDs.</span>
                            </span>
                          </label>
                          <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                              type="radio"
                              name="posterIdMode"
                              value="imdb"
                              checked={posterIdMode === 'imdb'}
                              onChange={(e) => setPosterIdMode(e.target.value as 'auto' | 'tmdb' | 'imdb')}
                              className="mt-1 h-4 w-4 rounded-full border-white/20 bg-black accent-violet-500"
                            />
                            <span className="space-y-1">
                              <span className="block text-[11px] font-medium text-zinc-300">IMDb</span>
                              <span className="block text-[10px] text-zinc-600">Only use this if your setup requires IMDb compatibility. Poster rewrites may fail if IMDb IDs are not available.</span>
                            </span>
                          </label>
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-zinc-950/70 p-3">
                        <div className="text-[11px] font-semibold text-zinc-200">Preset mapping</div>
                        <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                          Poster: <span className="font-mono text-zinc-300">{posterIdMode === 'imdb' ? '{imdb_id}' : 'tmdb:{type}:{tmdb_id}'}</span>
                        </p>
                        <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                          Background: <span className="font-mono text-zinc-300">tmdb:{'{type}'}:{'{tmdb_id}'}</span>
                        </p>
                        <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                          Logo: <span className="font-mono text-zinc-300">tmdb:{'{type}'}:{'{tmdb_id}'}</span>
                        </p>
                        <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                          Episode thumb: <span className="font-mono text-zinc-300">{'{imdb_id}'}</span>, <span className="font-mono text-zinc-300">{'{season}'}</span>, <span className="font-mono text-zinc-300">{'{episode}'}</span>
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-zinc-950/70 p-3">
                        <div className="space-y-3">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={hideAiometadataCredentials}
                              onChange={(event) => setHideAiometadataCredentials(event.target.checked)}
                              className="mt-0.5 h-4 w-4 rounded border-white/20 bg-black accent-violet-500"
                            />
                            <span className="space-y-1">
                              <span className="block text-[11px] font-semibold text-zinc-200">Hide credentials</span>
                              <span className="block text-[11px] leading-5 text-zinc-500">
                                Only affects the exported AIOMetadata patterns below. Live ERDB request URLs still use the real keys you provide and are replaced here with placeholders such as <span className="font-mono text-zinc-300">{'{erdb_key}'}</span>, <span className="font-mono text-zinc-300">{'{tmdb_key}'}</span>, <span className="font-mono text-zinc-300">{'{mdblist_key}'}</span>, and <span className="font-mono text-zinc-300">{'{fanart_key}'}</span> when needed.
                              </span>
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {aiometadataPatternRows.map((row) => (
                        <div key={row.key} className="rounded-xl border border-white/10 bg-black/60 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="text-[11px] font-semibold text-zinc-200">{row.label}</div>
                              <div className="mt-1 text-[11px] leading-5 text-zinc-500">{row.description}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                void navigator.clipboard.writeText(row.value);
                              }}
                              className="rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-200 hover:bg-zinc-800"
                            >
                              Copy
                            </button>
                          </div>
                          <div className="mt-3 rounded-lg border border-white/10 bg-zinc-950/80 p-3 font-mono text-[11px] leading-5 text-zinc-300 break-all">
                            {row.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div id="proxy" className="scroll-mt-24 xl:col-start-3 xl:row-start-1">
              <div className="erdb-panel erdb-panel-form space-y-4 rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
                <div className="erdb-panel-head">
                  <div>
                    <p className="erdb-panel-eyebrow font-mono">Proxy</p>
                    <h3 className="erdb-panel-title text-white">Addon Proxy</h3>
                    <p className="erdb-panel-copy text-zinc-400">
                      Paste a Stremio addon manifest here. The generated ERDB proxy manifest carries the configurator values from this workspace as its ERDB source of truth.
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/35 p-4 space-y-3">
                  <div className="text-[11px] font-semibold text-zinc-400">ERDB parameters</div>
                  <p className="text-[11px] leading-5 text-zinc-500">
                    Use the configurator for keys, language, ratings, layout, badges, and text.
                  </p>
                  <p className="text-[11px] leading-5 text-zinc-500">
                    A plain addon manifest URL will not pick up saved workspace values by itself. Use the generated ERDB proxy manifest below if you want those settings applied to addon artwork.
                  </p>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Manifest URL</label>
                    <input
                      type="url"
                      value={proxyManifestUrl}
                      onChange={(e) => setProxyManifestUrl(normalizeManifestUrl(e.target.value, true))}
                      placeholder="https://addon.example.com/manifest.json"
                      className="w-full min-w-0 bg-black border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:border-violet-500/50 outline-none"
                    />
                  </div>
                  <div className="rounded-xl border border-white/10 bg-zinc-950/70 p-3 space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={proxyTranslateMeta}
                        onChange={(event) => setProxyTranslateMeta(event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-white/20 bg-black accent-violet-500"
                      />
                      <span className="space-y-1">
                        <span className="block text-[11px] font-semibold text-zinc-200">Translate metadata in the proxy</span>
                        <span className="block text-[11px] leading-5 text-zinc-500">
                          Preserve good addon text by default, then backfill localized TMDB text. Anime native IDs can bridge through anime mapping plus AniList or Kitsu when TMDB is weak.
                        </span>
                      </span>
                    </label>

                    {proxyTranslateMeta && experienceMode === 'advanced' && (
                      <div className="space-y-3 rounded-xl border border-white/10 bg-black/40 p-3">
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Merge mode</div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {METADATA_TRANSLATION_MODE_OPTIONS.map((option) => (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => setProxyTranslateMetaMode(option.id)}
                                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                                  proxyTranslateMetaMode === option.id
                                    ? 'border-violet-500/60 bg-zinc-800 text-white'
                                    : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                          <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                            {METADATA_TRANSLATION_MODE_OPTIONS.find((option) => option.id === proxyTranslateMetaMode)?.description}
                          </p>
                        </div>

                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={proxyDebugMetaTranslation}
                            onChange={(event) => setProxyDebugMetaTranslation(event.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-black accent-violet-500"
                          />
                          <span className="space-y-1">
                            <span className="block text-[11px] font-semibold text-zinc-200">Attach debug provenance</span>
                            <span className="block text-[11px] leading-5 text-zinc-500">
                              Adds a `_erdbMetaTranslation` object to proxied meta items so you can see which fields came from upstream, TMDB, AniList, or Kitsu.
                            </span>
                          </span>
                        </label>
                      </div>
                    )}
                    {proxyTranslateMeta && experienceMode === 'simple' && (
                      <div className="rounded-xl border border-dashed border-white/10 bg-black/30 px-4 py-3 text-[11px] leading-5 text-zinc-500">
                        Simple mode keeps proxy translation on with the safe defaults from the preset.
                        Switch to advanced mode if you want to change merge mode or attach debug provenance.
                      </div>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                  <div className="erdb-panel-head">
                    <div>
                      <p className="erdb-panel-eyebrow font-mono">Export</p>
                      <h3 className="text-xl font-semibold text-white">Generated Manifest</h3>
                      <p className="mt-2 text-sm text-zinc-400">
                        Use this URL in Stremio. It ends with manifest.json and has no query params.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/70 p-4 overflow-hidden">
                    <div className={`font-mono text-xs text-zinc-300 break-all${!showProxyUrl && proxyUrl ? ' select-none' : ''}`}>
                      {displayedProxyUrl || `${baseUrl || 'https://erdb.example.com'}/proxy/{config}/manifest.json`}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleCopyProxy}
                      disabled={!canGenerateProxy}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${canGenerateProxy ? (proxyCopied ? 'bg-green-500 text-white' : 'bg-violet-500 text-white hover:bg-violet-400') : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
                    >
                      {proxyCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>COPIED</span>
                        </>
                      ) : (
                        <>
                          <Clipboard className="w-3.5 h-3.5" />
                          <span>COPY LINK</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowProxyUrl((prev) => !prev)}
                      disabled={!canGenerateProxy}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${canGenerateProxy ? 'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 hover:text-white border border-violet-500/30' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'}`}
                      aria-label={showProxyUrl ? 'Hide proxy URL' : 'Show proxy URL'}
                    >
                      {showProxyUrl ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showProxyUrl ? 'HIDE' : 'SHOW'}</span>
                    </button>
                    <a
                      href={canGenerateProxy ? proxyUrl : undefined}
                      target="_blank"
                      rel="noreferrer"
                      className={`px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition-colors ${canGenerateProxy ? 'border border-white/10 bg-zinc-900 text-zinc-200 hover:bg-zinc-800' : 'border border-white/5 bg-zinc-950 text-zinc-600 pointer-events-none'}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open
                    </a>
                  </div>
                  {!canGenerateProxy && (
                    <p className="mt-3 text-[11px] text-zinc-500">
                      Add manifest URL, TMDB key and MDBList key to generate a valid link.
                    </p>
                  )}
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/35 p-4 text-xs text-zinc-500">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-violet-500/10">
                      <Zap className="w-4 h-4 text-violet-500" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-zinc-200 font-semibold">Rewrite all addon artwork</div>
                      <div>Proxy rewrites `meta.poster`, `meta.background`, and `meta.logo` for both `catalog` and `meta` responses using the configurator state above.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

        <section id="docs" className="erdb-section scroll-mt-24 pb-20">
          <div className="w-full space-y-8">
            <SectionHeader
              eyebrow="Developers"
              title="Reference surfaces with clearer grouping"
              description="The docs area now follows the same section rhythm as the rest of the page, with feature summaries first and the heavier tables and prompt content grouped underneath."
              align="center"
            />

            <div className="erdb-doc-grid grid md:grid-cols-2 gap-4">
              <div className="erdb-feature-card p-6 bg-zinc-900/50 border border-white/10 rounded-2xl space-y-3 hover:border-violet-500/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-violet-500" />
                </div>
                <h4 className="text-lg font-bold text-white">Dynamic Rendering</h4>
                <p className="text-sm text-zinc-400">Stateless by default. Pass parameters in the query string and let ERDB handle metadata and rendering. Protected hosts can also require erdbKey.</p>
              </div>
              <div className="erdb-feature-card p-6 bg-zinc-900/50 border border-white/10 rounded-2xl space-y-3 hover:border-blue-500/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-blue-500" />
                </div>
                <h4 className="text-lg font-bold text-white">Addon Friendly</h4>
                <p className="text-sm text-zinc-400">Perfect for Stremio, Kodi or any media center addon. Use simple URL patterns for easy integration in your code.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="erdb-panel erdb-doc-card bg-zinc-900/40 border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-white/10 bg-zinc-900/60">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-violet-500" /> API Reference
                  </h3>
                </div>
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[560px] text-sm">
                    <thead>
                      <tr className="bg-white/5 text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                        <th className="px-5 py-2.5">Parameter</th>
                        <th className="px-5 py-2.5">Values</th>
                        <th className="px-5 py-2.5">Default</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">type <span className="text-zinc-500">(path)</span></td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">poster, backdrop, logo</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">none</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">id <span className="text-zinc-500">(path)</span></td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">IMDb, TMDB, Kitsu, etc.</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">none</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">ratings</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{RATING_PROVIDER_DOC_VALUES} (global fallback)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">all</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">posterRatings</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{RATING_PROVIDER_DOC_VALUES} (poster only)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">all</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">backdropRatings</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{RATING_PROVIDER_DOC_VALUES} (backdrop only)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">all</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">logoRatings</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{RATING_PROVIDER_DOC_VALUES} (logo only)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">all</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">lang</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{TMDB_LANGUAGE_DOC_COPY}</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">en</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">genreBadge</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">off, text, icon, both (global fallback)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">off</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">genreBadgeStyle</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{GENRE_BADGE_STYLE_DOC_VALUES} (global fallback)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">glass</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">genreBadgePosition</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{GENRE_BADGE_POSITION_DOC_VALUES} (global fallback)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">topLeft</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">streamBadges</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">auto, on, off (global fallback)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">auto</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">posterStreamBadges</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">auto, on, off (poster only)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">auto</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">backdropStreamBadges</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">auto, on, off (backdrop only)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">auto</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">qualityBadgesSide</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">left, right (poster top bottom layout only)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">left</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">posterQualityBadgesPosition</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">auto, left, right (poster top or bottom only)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">auto</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">posterQualityBadges</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{QUALITY_BADGE_DOC_VALUES} (poster only, empty string disables all)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">all</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">backdropQualityBadges</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{QUALITY_BADGE_DOC_VALUES} (backdrop only, empty string disables all)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">all</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">qualityBadgesStyle</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">glass, square, plain, media, silver (global fallback)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">glass</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">posterQualityBadgesStyle</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">glass, square, plain, media, silver (poster only)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">glass</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">backdropQualityBadgesStyle</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">glass, square, plain, media, silver (backdrop only)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">glass</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">posterQualityBadgesMax</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{OPTIONAL_BADGE_MAX_DOC_COPY}</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">auto</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">backdropQualityBadgesMax</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{OPTIONAL_BADGE_MAX_DOC_COPY}</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">auto</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">providerAppearance</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">base64url or JSON provider overrides for iconUrl, accentColor, iconScalePercent, stacked width, stacked body opacity, stacked accent mode, stacked line controls, and stacked X/Y offsets for line, logo, and rating</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">none</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">ratingPresentation</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">standard, minimal, average, dual, dual minimal, editorial, blockbuster</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">standard</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">aggregateRatingSource</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">overall, critics, audience</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">overall</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">ratingValueMode</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{RATING_VALUE_MODE_DOC_VALUES}</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">native</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">ratingStyle</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">glass, square, plain, stacked</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">glass (poster/backdrop), plain (logo)</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">genreBadgeScale</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{GENRE_BADGE_SCALE_DOC_COPY} (% scale, global fallback)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">100</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">posterRatingBadgeScale</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{BADGE_SCALE_DOC_COPY} (% scale)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">100</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">backdropRatingBadgeScale</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{BADGE_SCALE_DOC_COPY} (% scale)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">100</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">logoRatingBadgeScale</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{BADGE_SCALE_DOC_COPY} (% scale)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">100</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">posterQualityBadgeScale</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{BADGE_SCALE_DOC_COPY} (% scale)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">100</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">backdropQualityBadgeScale</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{BADGE_SCALE_DOC_COPY} (% scale)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">100</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">imageText</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">original, clean, alternative, random</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">original (poster), clean (backdrop)</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">posterImageSize</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">normal (580x859), large (1280x1896), 4k (2000x2926)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">normal</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">posterArtworkSource</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">tmdb, fanart, cinemeta, random (poster artwork source)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">tmdb</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">backdropArtworkSource</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">tmdb, fanart, cinemeta, random (backdrop artwork source)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">tmdb</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">posterRatingsLayout</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{POSTER_LAYOUT_DOC_VALUES}</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">{POSTER_LAYOUT_DOC_DEFAULT}</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">posterRatingsMax</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{OPTIONAL_BADGE_MAX_DOC_COPY}</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">auto</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">posterRatingsMaxPerSide</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{POSTER_RATINGS_MAX_DOC_COPY}</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">auto</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">backdropRatingsLayout</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{BACKDROP_LAYOUT_DOC_VALUES}</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">center</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">backdropRatingsMax</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{OPTIONAL_BADGE_MAX_DOC_COPY}</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">auto</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">posterEdgeOffset</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{POSTER_EDGE_OFFSET_DOC_COPY} (poster edge badges only)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">0</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">posterSideRatingsPosition</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{SIDE_RATING_POSITION_DOC_VALUES}</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">top</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">posterSideRatingsOffset</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{SIDE_RATING_OFFSET_DOC_COPY} (custom only)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">50</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">backdropSideRatingsPosition</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{SIDE_RATING_POSITION_DOC_VALUES}</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">top</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">backdropSideRatingsOffset</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{SIDE_RATING_OFFSET_DOC_COPY} (custom only)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">50</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">logoRatingsMax</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{OPTIONAL_BADGE_MAX_DOC_COPY}</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">auto</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">logoBackground</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{LOGO_BACKGROUND_DOC_VALUES}</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">transparent</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">logoArtworkSource</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">tmdb, fanart, cinemeta, random</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">tmdb</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">erdbKey</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">ERDB request key when the host enables route protection</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">none</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">tmdbKey <span className="font-bold">(req)</span></td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">TMDB v3 API Key</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">none</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">mdblistKey <span className="font-bold">(req)</span></td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">MDBList.com API Key</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">none</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">fanartKey</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">Fanart API Key for fanart poster, backdrop, and logo sources</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">service fallback when available</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">simklClientId</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">SIMKL client_id for direct SIMKL ratings</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">none</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">tmdbIdScope</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">TMDB ID collision handling mode</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">soft</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-white/10 bg-zinc-900/35 px-5 py-4 text-xs leading-6 text-zinc-400">
                  In the configurator UI, <span className="font-semibold text-zinc-200">Compact Average</span> maps to <span className="font-mono text-zinc-200">minimal</span>, <span className="font-semibold text-zinc-200">Labeled Average</span> maps to <span className="font-mono text-zinc-200">average</span>, <span className="font-semibold text-zinc-200">Critics + Audience</span> maps to <span className="font-mono text-zinc-200">dual</span>, and <span className="font-semibold text-zinc-200">Compact Critics + Audience</span> maps to <span className="font-mono text-zinc-200">dual minimal</span>. Query values remain unchanged.
                  <br />
                  Genre badges use a small curated family set. Strong buckets such as <span className="font-semibold text-zinc-200">horror</span>, <span className="font-semibold text-zinc-200">comedy</span>, <span className="font-semibold text-zinc-200">drama</span>, <span className="font-semibold text-zinc-200">sci fi</span>, <span className="font-semibold text-zinc-200">fantasy</span>, <span className="font-semibold text-zinc-200">crime</span>, <span className="font-semibold text-zinc-200">documentary</span>, <span className="font-semibold text-zinc-200">animation</span>, and <span className="font-semibold text-zinc-200">anime</span> resolve. <span className="font-semibold text-zinc-200">Thriller</span> and <span className="font-semibold text-zinc-200">mystery</span> now map into the crime family for consistent icon output.
                  <br />
                  Transparent provider icons stay transparent across <span className="font-semibold text-zinc-200">glass</span>, <span className="font-semibold text-zinc-200">square</span>, <span className="font-semibold text-zinc-200">plain</span>, and <span className="font-semibold text-zinc-200">stacked</span>. In <span className="font-semibold text-zinc-200">glass</span>, icons with transparency such as Kitsu render on a neutral inner chip with an accent ring so the accent color does not bleed through the icon cutouts.
                  <br />
                  Media quality badges use local asset based artwork for <span className="font-semibold text-zinc-200">4K</span>, <span className="font-semibold text-zinc-200">Bluray</span>, <span className="font-semibold text-zinc-200">HDR10</span>, <span className="font-semibold text-zinc-200">Dolby Vision</span>, and <span className="font-semibold text-zinc-200">Dolby Atmos</span>. Certification badges include a small <span className="font-semibold text-zinc-200">AGE</span> label above the rating.
                  <br />
                  <span className="font-mono text-zinc-200">erdbKey</span> is optional. Add it only when the ERDB host protects render or proxy routes with <span className="font-mono text-zinc-200">ERDB_REQUEST_API_KEY</span> or <span className="font-mono text-zinc-200">ERDB_REQUEST_API_KEYS</span>.
                  <br />
                  <span className="font-mono text-zinc-200">fanartKey</span> is optional. If present, ERDB uses your key first for fanart requests. If it is blank, ERDB falls back to <span className="font-mono text-zinc-200">ERDB_FANART_API_KEY</span> or <span className="font-mono text-zinc-200">FANART_API_KEY</span> when the server has one.
                  <br />
                  <span className="font-mono text-zinc-200">tmdbIdScope=soft</span> is the default for compatibility. Set <span className="font-mono text-zinc-200">tmdbIdScope=strict</span> to require typed TMDB IDs for backdrop and logo requests when you need to prevent movie and TV ID collisions.
                  <br />
                  Poster <span className="font-mono text-zinc-200">posterArtworkSource=fanart</span> uses fanart.tv poster art for <span className="font-mono text-zinc-200">original</span>, <span className="font-mono text-zinc-200">clean</span>, <span className="font-mono text-zinc-200">alternative</span>, and <span className="font-mono text-zinc-200">random</span>. Original and clean use the top ranked fanart image. Alternative uses the next ranked fanart image when one exists. Random uses a seeded pick. <span className="font-mono text-zinc-200">posterArtworkSource=cinemeta</span> uses the official MetaHub Cinemeta poster when ERDB can resolve an IMDb ID, then falls back to TMDB. <span className="font-mono text-zinc-200">posterArtworkSource=random</span> picks a seeded random source across TMDB, fanart, and Cinemeta when available.
                  <br />
                  Backdrop <span className="font-mono text-zinc-200">backdropArtworkSource=fanart</span> uses fanart.tv backdrop art for <span className="font-mono text-zinc-200">original</span>, <span className="font-mono text-zinc-200">clean</span>, <span className="font-mono text-zinc-200">alternative</span>, and <span className="font-mono text-zinc-200">random</span>. Original and clean use the top ranked fanart image. Alternative uses the next ranked fanart image when one exists. Random uses a seeded pick. <span className="font-mono text-zinc-200">backdropArtworkSource=cinemeta</span> uses the official MetaHub Cinemeta backdrop when ERDB can resolve an IMDb ID, then falls back to TMDB. <span className="font-mono text-zinc-200">backdropArtworkSource=random</span> picks a seeded random source across TMDB, fanart, and Cinemeta. <span className="font-mono text-zinc-200">logoArtworkSource=fanart</span> uses fanart.tv HD or clear logo assets for logo output. <span className="font-mono text-zinc-200">logoArtworkSource=cinemeta</span> uses the official MetaHub Cinemeta logo when ERDB can resolve an IMDb ID, then falls back to TMDB. <span className="font-mono text-zinc-200">logoArtworkSource=random</span> does a seeded pick across TMDB, fanart, and Cinemeta logos.
                  <br />
                  Future work: season aware fanart support is a good next step for TV because fanart.tv exposes <span className="font-mono text-zinc-200">seasonposter</span> and <span className="font-mono text-zinc-200">seasonthumb</span> assets.
                </div>
              </div>

              <div className="erdb-panel erdb-doc-card bg-zinc-900/40 border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-white/10 bg-zinc-900/60">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-violet-500" /> Type Configs
                  </h3>
                </div>
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[680px] text-sm">
                    <thead>
                      <tr className="bg-white/5 text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                        <th className="px-5 py-2.5">Type</th>
                        <th className="px-5 py-2.5">Config</th>
                        <th className="px-5 py-2.5">Layouts / Values</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">poster</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">
                          <div className="space-y-1">
                            <div>imageText</div>
                            <div>posterImageSize</div>
                            <div>posterArtworkSource</div>
                            <div>posterRatingPresentation</div>
                            <div>posterAggregateRatingSource</div>
                            <div>posterGenreBadge</div>
                            <div>posterGenreBadgeStyle</div>
                            <div>posterGenreBadgePosition</div>
                            <div>posterGenreBadgeScale</div>
                            <div>posterRatingsLayout</div>
                            <div>posterRatingsMax</div>
                            <div>posterEdgeOffset</div>
                            <div>posterSideRatingsPosition</div>
                            <div>posterSideRatingsOffset</div>
                            <div>posterQualityBadges</div>
                            <div>posterQualityBadgesPosition</div>
                            <div>posterRatingsMaxPerSide</div>
                            <div>posterQualityBadgesMax</div>
                            <div>posterRatingBadgeScale</div>
                            <div>posterQualityBadgeScale</div>
                          </div>
                        </td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">
                          <div className="space-y-1">
                            <div>original, clean, alternative, random</div>
                            <div>normal (580x859), large (1280x1896), 4k (2000x2926)</div>
                            <div>tmdb, fanart, cinemeta, random</div>
                            <div>standard, minimal, average, dual, dual minimal, editorial, blockbuster</div>
                            <div>overall, critics, audience</div>
                            <div>off, text, icon, both</div>
                            <div>{GENRE_BADGE_STYLE_DOC_VALUES}</div>
                            <div>{GENRE_BADGE_POSITION_DOC_VALUES}</div>
                            <div>{GENRE_BADGE_SCALE_DOC_COPY} (% scale)</div>
                            <div>{POSTER_LAYOUT_DOC_VALUES}</div>
                            <div>{OPTIONAL_BADGE_MAX_DOC_COPY} (auto if omitted)</div>
                            <div>{POSTER_EDGE_OFFSET_DOC_COPY} (edge aligned poster badges)</div>
                            <div>{SIDE_RATING_POSITION_DOC_VALUES} (side layouts only)</div>
                            <div>{SIDE_RATING_OFFSET_DOC_COPY} (custom only)</div>
                            <div>{QUALITY_BADGE_DOC_VALUES} (empty string hides all)</div>
                            <div>auto, left, right (top or bottom layouts only)</div>
                            <div>{POSTER_RATINGS_MAX_DOC_COPY} (auto if omitted)</div>
                            <div>{OPTIONAL_BADGE_MAX_DOC_COPY} (auto if omitted)</div>
                            <div>{GENRE_BADGE_SCALE_DOC_COPY} (% scale)</div>
                            <div>{GENRE_BADGE_SCALE_DOC_COPY} (% scale)</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">backdrop</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">
                          <div className="space-y-1">
                            <div>imageText</div>
                            <div>backdropArtworkSource</div>
                            <div>backdropRatingPresentation</div>
                            <div>backdropAggregateRatingSource</div>
                            <div>backdropGenreBadge</div>
                            <div>backdropGenreBadgeStyle</div>
                            <div>backdropGenreBadgePosition</div>
                            <div>backdropGenreBadgeScale</div>
                            <div>backdropRatingsLayout</div>
                            <div>backdropRatingsMax</div>
                            <div>backdropSideRatingsPosition</div>
                            <div>backdropSideRatingsOffset</div>
                            <div>backdropQualityBadges</div>
                            <div>backdropQualityBadgesMax</div>
                            <div>backdropRatingBadgeScale</div>
                            <div>backdropQualityBadgeScale</div>
                          </div>
                        </td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">
                          <div className="space-y-1">
                            <div>original, clean, alternative, random</div>
                            <div>tmdb, fanart, cinemeta, random</div>
                            <div>standard, minimal, average, dual, dual minimal, editorial, blockbuster</div>
                            <div>overall, critics, audience</div>
                            <div>off, text, icon, both</div>
                            <div>{GENRE_BADGE_STYLE_DOC_VALUES}</div>
                            <div>{GENRE_BADGE_POSITION_DOC_VALUES}</div>
                            <div>{GENRE_BADGE_SCALE_DOC_COPY} (% scale)</div>
                            <div>{BACKDROP_LAYOUT_DOC_VALUES}</div>
                            <div>{OPTIONAL_BADGE_MAX_DOC_COPY} (auto if omitted)</div>
                            <div>{SIDE_RATING_POSITION_DOC_VALUES} (right vertical only)</div>
                            <div>{SIDE_RATING_OFFSET_DOC_COPY} (custom only)</div>
                            <div>{QUALITY_BADGE_DOC_VALUES} (empty string hides all)</div>
                            <div>{OPTIONAL_BADGE_MAX_DOC_COPY} (auto if omitted)</div>
                            <div>{GENRE_BADGE_SCALE_DOC_COPY} (% scale)</div>
                            <div>{BADGE_SCALE_DOC_COPY} (% scale)</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">logo</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">
                          <div className="space-y-1">
                            <div>logoRatingsMax</div>
                            <div>logoBackground</div>
                            <div>logoArtworkSource</div>
                            <div>logoRatingPresentation</div>
                            <div>logoAggregateRatingSource</div>
                            <div>logoGenreBadge</div>
                            <div>logoGenreBadgeStyle</div>
                            <div>logoGenreBadgePosition</div>
                            <div>logoGenreBadgeScale</div>
                            <div>logoRatingBadgeScale</div>
                          </div>
                        </td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">
                          <div className="space-y-1">
                            <div>{OPTIONAL_BADGE_MAX_DOC_COPY} (auto if omitted)</div>
                            <div>{LOGO_BACKGROUND_DOC_VALUES}</div>
                            <div>tmdb, fanart, cinemeta, random</div>
                            <div>standard, minimal, average, dual, dual minimal, editorial, blockbuster</div>
                            <div>overall, critics, audience</div>
                            <div>off, text, icon, both</div>
                            <div>{GENRE_BADGE_STYLE_DOC_VALUES}</div>
                            <div>{GENRE_BADGE_POSITION_DOC_VALUES}</div>
                            <div>{BADGE_SCALE_DOC_COPY} (% scale)</div>
                            <div>{BADGE_SCALE_DOC_COPY} (% scale)</div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="px-5 pb-5 pt-3 text-[11px] text-zinc-500">
                  Direct image URLs support shared fallbacks like ratings, lang, ratingValueMode, genreBadge, genreBadgeStyle, genreBadgePosition, genreBadgeScale, ratingPresentation, aggregateRatingSource, aggregateAccentMode, aggregateAccentColor, aggregateAccentBarOffset, aggregateAccentBarVisible, ratingStyle, streamBadges, qualityBadgesStyle, and providerAppearance. Generated erdbConfig payloads usually emit per type fields instead, including poster/backdrop/logo genre badge overrides, and omit unchanged defaults.
                </div>
              </div>

              <div className="erdb-panel erdb-doc-card bg-zinc-900/40 border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-white/10 bg-zinc-900/60">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Hash className="w-5 h-5 text-violet-500" /> ID Formats
                  </h3>
                </div>
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-white/5 text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                        <th className="px-5 py-2.5">Source</th>
                        <th className="px-5 py-2.5">Format</th>
                        <th className="px-5 py-2.5">Example</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr>
                        <td className="px-5 py-2 font-bold text-zinc-300 text-xs">IMDb</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">tt + numbers</td>
                        <td className="px-5 py-2 font-mono text-violet-200/50 text-xs">tt0133093</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-bold text-zinc-300 text-xs">TMDB</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">tmdb:id or tmdb:movie:id or tmdb:tv:id (typed recommended)</td>
                        <td className="px-5 py-2 font-mono text-violet-200/50 text-xs">tmdb:movie:603, tmdb:tv:1399</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-bold text-zinc-300 text-xs">Kitsu</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">kitsu:id</td>
                        <td className="px-5 py-2 font-mono text-violet-200/50 text-xs">kitsu:1</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-bold text-zinc-300 text-xs">Anime</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">provider:id</td>
                        <td className="px-5 py-2 font-mono text-violet-200/50 text-xs">anilist:123, mal:456, tvdb:12345, anidb:6789</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="erdb-panel erdb-ai-card p-6 bg-black border border-white/10 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/20 blur-[80px] pointer-events-none" />

                <div className="mb-6">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Base Structure</h4>
                    <button
                      type="button"
                      onClick={handleCopyBaseStructure}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold transition-all ${
                        baseStructureCopied
                          ? 'bg-green-500 text-white'
                          : 'border border-violet-500/30 bg-violet-500/12 text-violet-200 hover:bg-violet-500/20 hover:text-white'
                      }`}
                    >
                      {baseStructureCopied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
                      <span>{baseStructureCopied ? 'Copied' : 'Copy Base Structure'}</span>
                    </button>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-zinc-900/60 p-4">
                    <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-6 text-zinc-300">
                      {displayedBaseStructureTemplate}
                    </pre>
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                    <div className="grid gap-1 sm:grid-cols-[auto,1fr] sm:gap-2">
                      <span className="text-violet-500 font-bold">lang (optional):</span>
                      <span className="min-w-0 text-zinc-400 [overflow-wrap:anywhere]">{TMDB_LANGUAGE_HELP_COPY}</span>
                    </div>
                    <div className="grid gap-1 sm:grid-cols-[auto,1fr] sm:gap-2">
                      <span className="text-violet-500 font-bold">id (required):</span>
                      <span className="min-w-0 text-zinc-400 [overflow-wrap:anywhere]">IMDb ID (tt...), TMDB ID (tmdb:id or typed tmdb:movie:id or tmdb:tv:id), or Kitsu ID (kitsu:...).</span>
                    </div>
                    <div className="grid gap-1 sm:grid-cols-[auto,1fr] sm:gap-2">
                      <span className="text-violet-500 font-bold">erdbKey (optional):</span>
                      <span className="min-w-0 text-zinc-400 [overflow-wrap:anywhere]">Only needed when the ERDB host enables route protection.</span>
                    </div>
                    <div className="grid gap-1 sm:grid-cols-[auto,1fr] sm:gap-2">
                      <span className="text-violet-500 font-bold">tmdbKey (required):</span>
                      <span className="min-w-0 text-zinc-400 [overflow-wrap:anywhere]">Your TMDB v3 API Key.</span>
                    </div>
                    <div className="grid gap-1 sm:grid-cols-[auto,1fr] sm:gap-2">
                      <span className="text-violet-500 font-bold">mdblistKey (required):</span>
                      <span className="min-w-0 text-zinc-400 [overflow-wrap:anywhere]">Your MDBList API Key.</span>
                    </div>
                    <div className="grid gap-1 sm:grid-cols-[auto,1fr] sm:gap-2 md:col-span-2">
                      <span className="text-violet-500 font-bold">fanartKey (optional):</span>
                      <span className="min-w-0 text-zinc-400 [overflow-wrap:anywhere]">Recommended when you use fanart sources. Your key is used first, then ERDB can fall back to the service key when one exists.</span>
                    </div>
                    <div className="grid gap-1 sm:grid-cols-[auto,1fr] sm:gap-2 md:col-span-2">
                      <span className="text-violet-500 font-bold">providerAppearance:</span>
                      <span className="min-w-0 text-zinc-400 [overflow-wrap:anywhere]">Accepts base64url or raw JSON overrides for iconUrl, accentColor, iconScalePercent, stackedWidthPercent, stackedSurfaceOpacityPercent, stackedAccentMode, stacked line controls, and per element offsets such as stackedLineOffsetY, stackedIconOffsetY, or stackedValueOffsetY.</span>
                    </div>
                    <div className="grid gap-1 sm:grid-cols-[auto,1fr] sm:gap-2 md:col-span-2">
                      <span className="text-violet-500 font-bold">posterQualityBadges / backdropQualityBadges:</span>
                      <span className="min-w-0 text-zinc-400 [overflow-wrap:anywhere]">Comma separated badge ids such as certification,hdr,remux. Send an empty string if you want no quality badges rendered for that type.</span>
                    </div>
                  </div>
                </div>

                <div className="mb-10 bg-violet-500/5 border border-violet-500/10 rounded-2xl md:rounded-3xl p-5 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-violet-500/20 rounded-2xl">
                        <Bot className="w-6 h-6 text-violet-500" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">AI Developer Prompt</h4>
                        <p className="text-xs text-zinc-500">Copy this prompt to help an AI agent implement this API in your addon.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleCopyPrompt}
                        className={`mt-4 px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${copied ? 'bg-green-500 text-white' : 'bg-violet-500 text-white hover:bg-violet-400'}`}
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>COPIED!</span>
                          </>
                        ) : (
                          <>
                            <Clipboard className="w-4 h-4" />
                            <span>COPY PROMPT</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-[11px] text-zinc-400 leading-relaxed overflow-auto relative max-h-[340px]">
                    <div className="whitespace-pre-wrap">{AI_DEVELOPER_PROMPT}</div>
                  </div>

                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Live Examples</h4>
                <pre className="text-xs font-mono text-zinc-400 leading-6 space-y-1.5">
                  <div className="text-zinc-600 font-bold">Movie Poster (IMDb)</div>
                  <div className="text-violet-200/70 truncate bg-white/5 p-3 rounded-lg border border-white/5">{`${baseUrl || 'http://localhost:3000'}/poster/tt0133093.jpg?ratings=imdb,tmdb&ratingStyle=plain`}</div>

                  <div className="text-zinc-600 font-bold mt-4">Backdrop (TMDB)</div>
                  <div className="text-violet-200/70 truncate bg-white/5 p-3 rounded-lg border border-white/5">{`${baseUrl || 'http://localhost:3000'}/backdrop/tmdb:movie:603.jpg?ratings=mdblist&backdropRatingsLayout=${encodeURIComponent('right vertical')}&backdropSideRatingsPosition=middle`}</div>

                </pre>
              </div>
            </div>
          </div>
        </div>
        </section>
      </main>

      {showExperienceModal ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,10,20,0.98),rgba(6,5,12,0.98))] p-5 shadow-[0_40px_120px_-55px_rgba(0,0,0,0.95)] md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-300">
                  <Sparkles className="h-3.5 w-3.5 text-violet-300" />
                  Welcome to ERDB
                </div>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  Choose how you want to configure it.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-400">
                  Simple keeps the main decisions visible. Advanced opens the full ERDB surface,
                  including provider ordering, layout offsets, badge sizing, and custom source styling.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {([
                {
                  id: 'simple',
                  label: 'Simple',
                  summary: 'Preset first workflow with just the everyday switches.',
                  lines: [
                    'Best if you want the fastest path to a working config.',
                    'Keeps presets, keys, media targeting, and visible artwork choices upfront.',
                  ],
                },
                {
                  id: 'advanced',
                  label: 'Advanced',
                  summary: 'Every ERDB control, reorganized into sections.',
                  lines: [
                    'Best if you plan to tune provider order, badge styling, or manual layout details.',
                    'Matches the full configurator behavior with a cleaner structure.',
                  ],
                },
              ] as const).map((option) => (
                <button
                  key={`modal-mode-${option.id}`}
                  type="button"
                  onClick={() => setExperienceModeDraft(option.id)}
                  className={`rounded-[1.5rem] border p-4 text-left transition-colors ${
                    experienceModeDraft === option.id
                      ? 'border-violet-500/60 bg-violet-500/12 text-white'
                      : 'border-white/10 bg-black/25 text-zinc-300 hover:border-white/20 hover:bg-black/35'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xl font-semibold">{option.label}</div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                        experienceModeDraft === option.id
                          ? 'bg-violet-500/20 text-violet-100'
                          : 'bg-white/5 text-zinc-500'
                      }`}
                    >
                      {experienceModeDraft === option.id ? 'Selected' : 'Choose'}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-zinc-300">{option.summary}</p>
                  <div className="mt-4 grid gap-2">
                    {option.lines.map((line) => (
                      <div
                        key={`${option.id}-${line}`}
                        className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-[11px] leading-5 text-zinc-400"
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] leading-5 text-zinc-500">
                You can switch modes later from the configurator without changing your saved ERDB settings.
              </p>
              <button
                type="button"
                onClick={handleContinueExperienceMode}
                className="rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-400"
              >
                Continue with {experienceModeDraft === 'simple' ? 'Simple' : 'Advanced'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="w-full px-6 pb-6 md:pb-10 2xl:px-8" aria-label="Status board information">
        <div className="rounded-2xl border border-white/10 bg-zinc-950/65 p-5 md:p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <h3 className="text-sm md:text-base font-semibold text-white">What is IbbyLabs Uptime Tracker?</h3>
            <p className="text-sm text-zinc-400">
              It is the IbbyLabs public status board for popular Stremio addons, including current health and incident updates.
            </p>
          </div>
          <div className="shrink-0">
            <UptimePill label="View the tracker" />
          </div>
        </div>
      </section>

      <footer className="erdb-footer py-8">
        <div className="w-full px-6 space-y-4 2xl:px-8">
          <div className="site-page-footer-top">
            <BrandLockup compact />
            <UptimePill />
            <SupportPill />
          </div>
          <div className="site-page-footer-links">
            <a href="#preview" onClick={handleAnchorClick} className="erdb-footer-link">Configurator</a>
            <a href="#proxy" onClick={handleAnchorClick} className="erdb-footer-link">Addon Proxy</a>
            <a href="#docs" onClick={handleAnchorClick} className="erdb-footer-link">API Docs</a>
            <a href={BRAND_GITHUB_URL} target="_blank" rel="noreferrer" className="erdb-footer-link">github</a>
            <a href={BRAND_DISCORD_AIO_URL} target="_blank" rel="noreferrer" className="erdb-footer-link">ERDB in AIOStreams</a>
            <a href={BRAND_DISCORD_OFFICIAL_URL} target="_blank" rel="noreferrer" className="erdb-footer-link">Official ERDB Discord</a>
          </div>
          <div className="site-page-credit">
            <Image src="/favicon.png" alt="" aria-hidden="true" width={20} height={20} />
            <span>
              Built by IbbyLabs. Based on ERDB by RealBestia at{' '}
              <a href="https://github.com/realbestia1/erdb" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-zinc-300">
                realbestia1/erdb
              </a>
            </span>
          </div>
          <p className="text-sm text-zinc-500 text-center md:text-left">
            © 2026 Easy Ratings Database Project. Consistent chrome, same lab.
          </p>
        </div>
      </footer>
    </div>
  );
}
