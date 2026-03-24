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
} from 'react';
import { Image as ImageIcon, Settings2, Globe2, Layers, Cpu, Code2, Terminal, ExternalLink, Zap, ChevronRight, Hash, Sparkles, MonitorPlay, Bot, Clipboard, Check, Eye, EyeOff, Tag } from 'lucide-react';
import {
  ALL_RATING_PREFERENCES,
  stringifyRatingPreferencesAllowEmpty,
  type RatingPreference,
} from '@/lib/ratingPreferences';
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
  DEFAULT_RATING_STYLE,
  RATING_STYLE_OPTIONS,
  type RatingStyle,
} from '@/lib/ratingStyle';
import {
  AGGREGATE_RATING_SOURCE_OPTIONS,
  DEFAULT_AGGREGATE_RATING_SOURCE,
  DEFAULT_RATING_PRESENTATION,
  preservesSelectedRatingLayout,
  RATING_PRESENTATION_OPTIONS,
  usesAggregateRatingSource,
  type AggregateRatingSource,
  type RatingPresentation,
} from '@/lib/ratingPresentation';
import {
  buildConfigString,
  buildProxyUrl,
  normalizeSavedUiConfig,
  parseSavedUiConfig,
  serializeSavedUiConfig,
  normalizeBaseUrl,
  normalizeManifestUrl,
  type LogoBackground,
  type QualityBadgesSide,
  type PosterQualityBadgesPosition,
  type SavedUiConfig,
  type StreamBadgesSetting,
} from '@/lib/uiConfig';
import {
  DEFAULT_METADATA_TRANSLATION_MODE,
  METADATA_TRANSLATION_MODE_OPTIONS,
  type MetadataTranslationMode,
} from '@/lib/metadataTranslation';
import {
  DEFAULT_GENRE_BADGE_MODE,
  GENRE_BADGE_FAMILY_META,
  GENRE_BADGE_MODE_OPTIONS,
  GENRE_BADGE_PREVIEW_SAMPLES,
  type GenreBadgeMode,
} from '@/lib/genreBadge';

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
const PROXY_TYPES = ['poster', 'backdrop', 'logo'] as const;
type ProxyType = (typeof PROXY_TYPES)[number];
type ProxyEnabledTypes = Record<ProxyType, boolean>;
const DEFAULT_QUALITY_BADGES_STYLE: RatingStyle = 'glass';
const BRAND_GITHUB_URL = process.env.NEXT_PUBLIC_BRAND_GITHUB_URL || 'https://github.com/IbbyLabs/erdb';
const BRAND_SUPPORT_URL = process.env.NEXT_PUBLIC_BRAND_SUPPORT_URL || 'https://kofi.ibbylabs.dev';
const BRAND_UPTIME_URL = process.env.NEXT_PUBLIC_BRAND_UPTIME_URL || 'https://uptime.ibbylabs.dev';
const BRAND_DISCORD_URL = process.env.NEXT_PUBLIC_BRAND_DISCORD_URL || 'https://discordapp.com/users/947862578682548255';
const BRAND_DISCORD_HANDLE = process.env.NEXT_PUBLIC_BRAND_DISCORD_HANDLE || '@ibbys89';
const PACKAGE_VERSION = `v${String(packageJson.version || '').trim() || 'dev'}`;
const DEPLOYMENT_VERSION = String(process.env.NEXT_PUBLIC_DEPLOYMENT_VERSION || PACKAGE_VERSION).trim() || 'dev';
const maskSensitiveText = (value: string) => value.replace(/[^\s]/g, '*');
const STREAM_BADGE_OPTIONS: Array<{ id: StreamBadgesSetting; label: string }> = [
  { id: 'auto', label: 'Auto' },
  { id: 'on', label: 'On' },
  { id: 'off', label: 'Off' },
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
const RATING_PROVIDER_DOC_VALUES = ALL_RATING_PREFERENCES.join(', ');
const TMDB_LANGUAGE_DOC_COPY = 'Any TMDB ISO 639-1 code (en, it, fr, es, de, ja, ko, etc.)';
const TMDB_LANGUAGE_HELP_COPY = 'All TMDB ISO 639-1 codes are supported (en, it, fr, es, de, etc.). Default: en.';
const POSTER_LAYOUT_DOC_VALUES = 'top, bottom, left, right, top bottom, left right';
const POSTER_LAYOUT_DOC_DEFAULT = 'top bottom';
const POSTER_RATINGS_MAX_DOC_COPY = '1+';
const OPTIONAL_BADGE_MAX_DOC_COPY = '1+';
const BACKDROP_LAYOUT_DOC_VALUES = 'center, right, right vertical';
const LOGO_BACKGROUND_DOC_VALUES = 'transparent, dark';
const AGGREGATE_SOURCE_ACCENT_BY_ID: Record<AggregateRatingSource, string> = {
  overall: '#a78bfa',
  critics: '#fb923c',
  audience: '#34d399',
};

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
const buildGenreSamplePreviewUrl = ({
  baseUrl,
  tmdbKey,
  sample,
  mode,
}: {
  baseUrl: string;
  tmdbKey: string;
  sample: (typeof GENRE_BADGE_PREVIEW_SAMPLES)[number];
  mode: GenreBadgeMode;
}) => {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const normalizedTmdbKey = tmdbKey.trim();
  if (!normalizedBaseUrl || !normalizedTmdbKey) {
    return '';
  }

  const query = new URLSearchParams({
    tmdbKey: normalizedTmdbKey,
    lang: sample.lang,
  });
  if (mode !== DEFAULT_GENRE_BADGE_MODE) {
    query.set('genreBadge', mode);
  }
  for (const [key, value] of Object.entries(sample.params)) {
    query.set(key, value);
  }

  return `${normalizedBaseUrl}/${sample.previewType}/${encodeURIComponent(sample.mediaId)}.jpg?${query.toString()}`;
};
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
id (path)               | IMDb (tt...), TMDB (tmdb:id / tmdb:movie:id / tmdb:tv:id), Kitsu (kitsu:id), AniList, MAL          | none
ratings                 | ${RATING_PROVIDER_DOC_VALUES} (global fallback)                      | all
posterRatings           | ${RATING_PROVIDER_DOC_VALUES} (poster only)                          | all
backdropRatings         | ${RATING_PROVIDER_DOC_VALUES} (backdrop only)                        | all
logoRatings             | ${RATING_PROVIDER_DOC_VALUES} (logo only)                            | all
lang                    | ${TMDB_LANGUAGE_DOC_COPY}                                             | en
genreBadge             | off, text, icon, both                                                | off
streamBadges            | auto, on, off (global fallback)                                      | auto
posterStreamBadges      | auto, on, off (poster only)                                          | auto
backdropStreamBadges    | auto, on, off (backdrop only)                                        | auto
qualityBadgesSide       | left, right (poster top bottom layout only)                          | left
posterQualityBadgesPosition | auto, left, right (poster top or bottom only)                    | auto
qualityBadgesStyle      | glass, square, plain (global fallback)                               | glass
posterQualityBadgesStyle| glass, square, plain (poster only)                                   | glass
backdropQualityBadgesStyle| glass, square, plain (backdrop only)                               | glass
posterQualityBadgesMax  | Number (${OPTIONAL_BADGE_MAX_DOC_COPY})                              | auto
backdropQualityBadgesMax| Number (${OPTIONAL_BADGE_MAX_DOC_COPY})                              | auto
ratingPresentation      | standard, minimal, average, blockbuster                              | standard
aggregateRatingSource   | overall, critics, audience                                           | overall
ratingStyle             | glass, square, plain                                                 | glass
imageText               | original, clean, alternative                                         | original
posterRatingsLayout     | ${POSTER_LAYOUT_DOC_VALUES}                                           | ${POSTER_LAYOUT_DOC_DEFAULT}
posterRatingsMaxPerSide | Number (${POSTER_RATINGS_MAX_DOC_COPY})                              | auto
backdropRatingsLayout   | ${BACKDROP_LAYOUT_DOC_VALUES}                                         | center
logoRatingsMax          | Number (${OPTIONAL_BADGE_MAX_DOC_COPY})                              | auto
logoBackground          | ${LOGO_BACKGROUND_DOC_VALUES}                                         | transparent
tmdbKey (REQUIRED)      | Your TMDB v3 API Key                                                 | none
mdblistKey (REQUIRED)   | Your MDBList.com API Key                                             | none

TMDB NOTE: Always prefer tmdb:movie:id or tmdb:tv:id. Using bare tmdb:id can collide between movie and tv.
STYLE NOTE: Transparent provider icons stay transparent in every style. In glass, icons with transparency such as Kitsu render on a neutral inner chip with an accent ring to avoid accent color bleed through.

INTEGRATION REQUIREMENTS
1. Use ONLY the "erdbConfig" field (no modal and no extra settings panels).
2. Add toggles to enable or disable poster, backdrop, and logo.
3. If a type is disabled, keep the original artwork (do not call ERDB for that type).
4. Build ERDB URLs using the decoded config and inject them into both catalog and meta responses.

PER TYPE SETTINGS
poster   : ratingStyle = cfg.posterRatingStyle, imageText = cfg.posterImageText
backdrop : ratingStyle = cfg.backdropRatingStyle, imageText = cfg.backdropImageText
logo     : ratingStyle = cfg.logoRatingStyle, logoBackground = cfg.logoBackground (omit imageText)
all      : genreBadge = cfg.genreBadge (optional global genre badge)
Ratings providers can be set per type via cfg.posterRatings / cfg.backdropRatings / cfg.logoRatings (fallback to cfg.ratings). Provider order is respected.
Rating presentation can be set per type via cfg.posterRatingPresentation / cfg.backdropRatingPresentation / cfg.logoRatingPresentation (fallback to cfg.ratingPresentation).
Aggregate source can be set per type via cfg.posterAggregateRatingSource / cfg.backdropAggregateRatingSource / cfg.logoAggregateRatingSource (fallback to cfg.aggregateRatingSource).
Use cfg.qualityBadgesSide for poster top bottom layouts and cfg.posterQualityBadgesPosition for poster top or bottom layouts.
Quality badge style/max can be set per type via cfg.posterQualityBadgesStyle / cfg.backdropQualityBadgesStyle and cfg.posterQualityBadgesMax / cfg.backdropQualityBadgesMax.

URL BUILD
const typeRatingStyle = type === 'poster' ? cfg.posterRatingStyle : type === 'backdrop' ? cfg.backdropRatingStyle : cfg.logoRatingStyle;
const typeImageText = type === 'backdrop' ? cfg.backdropImageText : cfg.posterImageText;
\${cfg.baseUrl}/\${type}/\${id}.jpg?tmdbKey=\${cfg.tmdbKey}&mdblistKey=\${cfg.mdblistKey}&ratings=\${cfg.ratings}&posterRatings=\${cfg.posterRatings}&backdropRatings=\${cfg.backdropRatings}&logoRatings=\${cfg.logoRatings}&lang=\${cfg.lang}&genreBadge=\${cfg.genreBadge}&streamBadges=\${cfg.streamBadges}&posterStreamBadges=\${cfg.posterStreamBadges}&backdropStreamBadges=\${cfg.backdropStreamBadges}&qualityBadgesSide=\${cfg.qualityBadgesSide}&posterQualityBadgesPosition=\${cfg.posterQualityBadgesPosition}&qualityBadgesStyle=\${cfg.qualityBadgesStyle}&posterQualityBadgesStyle=\${cfg.posterQualityBadgesStyle}&backdropQualityBadgesStyle=\${cfg.backdropQualityBadgesStyle}&posterQualityBadgesMax=\${cfg.posterQualityBadgesMax}&backdropQualityBadgesMax=\${cfg.backdropQualityBadgesMax}&ratingPresentation=\${cfg.ratingPresentation}&aggregateRatingSource=\${cfg.aggregateRatingSource}&ratingStyle=\${typeRatingStyle}&imageText=\${typeImageText}&posterRatingsLayout=\${cfg.posterRatingsLayout}&posterRatingsMaxPerSide=\${cfg.posterRatingsMaxPerSide}&backdropRatingsLayout=\${cfg.backdropRatingsLayout}&logoRatingsMax=\${cfg.logoRatingsMax}&logoBackground=\${cfg.logoBackground}

Omit imageText when type=logo.

Skip any params that are undefined. Keep empty ratings/posterRatings/backdropRatings/logoRatings to disable providers.`;

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
}: {
  compact?: boolean;
  releaseTag: string;
  releaseUrl: string;
  loading: boolean;
}) {
  const value = loading ? 'Checking' : releaseTag || 'Unknown';
  const title = loading
    ? 'Checking GitHub for the latest release.'
    : releaseUrl
      ? `Open ${value} on GitHub`
      : 'Latest GitHub release is unavailable right now.';
  const content = (
    <>
      <Tag className="erdb-release-pill-icon" aria-hidden="true" />
      <span className="erdb-release-pill-label font-mono">
        {compact ? 'Latest' : 'Latest release'}
      </span>
      <span className="erdb-release-pill-value font-mono">{value}</span>
    </>
  );

  if (releaseUrl) {
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
      className={`erdb-release-pill${compact ? ' erdb-release-pill-compact' : ''}`}
      aria-label={`Latest release version ${value}`}
      title={title}
    >
      {content}
    </span>
  );
}

function DiscordPill({ label = BRAND_DISCORD_HANDLE }: { label?: string }) {
  return (
    <a
      className="site-discord-pill"
      href={BRAND_DISCORD_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Message IbbyLabs on Discord"
      title="Message IbbyLabs on Discord"
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
  const [previewType, setPreviewType] = useState<'poster' | 'backdrop' | 'logo'>('poster');
  const [mediaId, setMediaId] = useState('tt0133093');
  const [lang, setLang] = useState('en');
  const [posterImageText, setPosterImageText] = useState<'original' | 'clean' | 'alternative'>('clean');
  const [backdropImageText, setBackdropImageText] = useState<'original' | 'clean' | 'alternative'>('clean');
  const [genreBadgeMode, setGenreBadgeMode] = useState<GenreBadgeMode>(DEFAULT_GENRE_BADGE_MODE);
  const [genrePreviewMode, setGenrePreviewMode] = useState<GenreBadgeMode>(SAMPLE_GENRE_BADGE_MODE_DEFAULT);
  const [posterRatingRows, setPosterRatingRows] = useState<RatingProviderRow[]>(buildDefaultRatingRows);
  const [backdropRatingRows, setBackdropRatingRows] = useState<RatingProviderRow[]>(buildDefaultRatingRows);
  const [logoRatingRows, setLogoRatingRows] = useState<RatingProviderRow[]>(buildDefaultRatingRows);
  const [posterStreamBadges, setPosterStreamBadges] = useState<StreamBadgesSetting>('auto');
  const [backdropStreamBadges, setBackdropStreamBadges] = useState<StreamBadgesSetting>('auto');
  const [qualityBadgesSide, setQualityBadgesSide] = useState<QualityBadgesSide>('left');
  const [posterQualityBadgesPosition, setPosterQualityBadgesPosition] =
    useState<PosterQualityBadgesPosition>('auto');
  const [posterQualityBadgesStyle, setPosterQualityBadgesStyle] = useState<RatingStyle>(DEFAULT_QUALITY_BADGES_STYLE);
  const [backdropQualityBadgesStyle, setBackdropQualityBadgesStyle] = useState<RatingStyle>(DEFAULT_QUALITY_BADGES_STYLE);
  const [posterQualityBadgesMax, setPosterQualityBadgesMax] = useState<number | null>(null);
  const [backdropQualityBadgesMax, setBackdropQualityBadgesMax] = useState<number | null>(null);
  const [posterRatingsLayout, setPosterRatingsLayout] = useState<PosterRatingLayout>('bottom');
  const [backdropRatingsLayout, setBackdropRatingsLayout] = useState<BackdropRatingLayout>(DEFAULT_BACKDROP_RATING_LAYOUT);
  const [posterRatingStyle, setPosterRatingStyle] = useState<RatingStyle>(DEFAULT_RATING_STYLE);
  const [backdropRatingStyle, setBackdropRatingStyle] = useState<RatingStyle>(DEFAULT_RATING_STYLE);
  const [logoRatingStyle, setLogoRatingStyle] = useState<RatingStyle>('plain');
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
  const [posterRatingsMaxPerSide, setPosterRatingsMaxPerSide] = useState<number | null>(DEFAULT_POSTER_RATINGS_MAX_PER_SIDE);
  const [logoRatingsMax, setLogoRatingsMax] = useState<number | null>(null);
  const [logoBackground, setLogoBackground] = useState<LogoBackground>('transparent');
  const [supportedLanguages, setSupportedLanguages] = useState(SUPPORTED_LANGUAGES);
  const [mdblistKey, setMdblistKey] = useState('');
  const [tmdbKey, setTmdbKey] = useState('');
  const [proxyManifestUrl, setProxyManifestUrl] = useState('');
  const [proxyTranslateMeta, setProxyTranslateMeta] = useState(false);
  const [proxyTranslateMetaMode, setProxyTranslateMetaMode] =
    useState<MetadataTranslationMode>(DEFAULT_METADATA_TRANSLATION_MODE);
  const [proxyDebugMetaTranslation, setProxyDebugMetaTranslation] = useState(false);
  const [proxyCopied, setProxyCopied] = useState(false);
  const [configCopied, setConfigCopied] = useState(false);
  const [showConfigString, setShowConfigString] = useState(false);
  const [showProxyUrl, setShowProxyUrl] = useState(false);
  const [previewErroredForUrl, setPreviewErroredForUrl] = useState('');
  const [previewErrorDetails, setPreviewErrorDetails] = useState('');
  const [recentCommits, setRecentCommits] = useState<RecentCommit[]>([]);
  const [recentCommitsError, setRecentCommitsError] = useState('');
  const [isRecentCommitsLoading, setIsRecentCommitsLoading] = useState(true);
  const [visibleRecentCommitCount, setVisibleRecentCommitCount] = useState(COMMIT_PAGE_SIZE);
  const [latestReleaseTag, setLatestReleaseTag] = useState('');
  const [latestReleaseUrl, setLatestReleaseUrl] = useState('');
  const [isLatestReleaseLoading, setIsLatestReleaseLoading] = useState(true);
  const [nowMs, setNowMs] = useState(Date.now());
  const [savedConfigStatus, setSavedConfigStatus] = useState<
    '' | 'loaded' | 'saved' | 'cleared' | 'imported' | 'error' | 'invalid'
  >('');
  const [configAutoSave, setConfigAutoSave] = useState(false);
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
  const qualityBadgeTypeLabel = previewType === 'backdrop' ? 'Backdrop' : 'Poster';
  const activeStreamBadges = previewType === 'backdrop' ? backdropStreamBadges : posterStreamBadges;
  const setActiveStreamBadges = previewType === 'backdrop' ? setBackdropStreamBadges : setPosterStreamBadges;
  const activeQualityBadgesStyle =
    previewType === 'backdrop' ? backdropQualityBadgesStyle : posterQualityBadgesStyle;
  const setActiveQualityBadgesStyle =
    previewType === 'backdrop' ? setBackdropQualityBadgesStyle : setPosterQualityBadgesStyle;
  const activeQualityBadgesMax =
    previewType === 'backdrop' ? backdropQualityBadgesMax : posterQualityBadgesMax;
  const setActiveQualityBadgesMax =
    previewType === 'backdrop' ? setBackdropQualityBadgesMax : setPosterQualityBadgesMax;

  const scrollToHash = useCallback((hash: string, behavior: ScrollBehavior = 'smooth') => {
    if (typeof window === 'undefined') return;
    if (!hash || !hash.startsWith('#')) return;
    const target = document.querySelector(hash);
    if (!target) return;
    const navHeight = navRef.current?.getBoundingClientRect().height ?? 0;
    const offset = navHeight + 12;
    const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);
    window.scrollTo({ top, behavior });
  }, []);

  const handleAnchorClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      const href = event.currentTarget.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      event.preventDefault();
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', href);
      }
      scrollToHash(href);
    },
    [scrollToHash]
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
    if (typeof window === 'undefined') {
      return;
    }

    const page = pageRef.current;
    const hero = heroRef.current;
    if (!page || !hero) {
      return;
    }

    let frame = 0;

    const updateCompactProgress = () => {
      frame = 0;
      const maxDistance = Math.max(180, Math.min(320, hero.offsetHeight * 0.45));
      const progress = Math.min(1, Math.max(0, window.scrollY / maxDistance));
      page.style.setProperty('--scroll-compact-progress', progress.toFixed(3));
      page.dataset.compactNav = progress > 0.04 ? 'true' : 'false';
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

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener('scroll', queueUpdate);
      window.removeEventListener('resize', queueUpdate);
      page.style.removeProperty('--scroll-compact-progress');
      delete page.dataset.compactNav;
    };
  }, []);

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

        if (!active) {
          return;
        }

        setLatestReleaseTag(nextTag);
        setLatestReleaseUrl(nextUrl);
      } catch (error: any) {
        if (!active || error?.name === 'AbortError') {
          return;
        }

        setLatestReleaseTag('');
        setLatestReleaseUrl('');
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
    (config: SavedUiConfig, status: 'loaded' | 'imported' = 'loaded') => {
      const normalized = normalizeSavedUiConfig(config);

      setTmdbKey(normalized.settings.tmdbKey);
      setMdblistKey(normalized.settings.mdblistKey);
      setLang(normalized.settings.lang);
      setPosterImageText(normalized.settings.posterImageText);
      setBackdropImageText(normalized.settings.backdropImageText);
      setGenreBadgeMode(normalized.settings.genreBadgeMode);
      setPosterRatingRows(enabledOrderedToRows(normalized.settings.posterRatingPreferences));
      setBackdropRatingRows(enabledOrderedToRows(normalized.settings.backdropRatingPreferences));
      setLogoRatingRows(enabledOrderedToRows(normalized.settings.logoRatingPreferences));
      setPosterStreamBadges(normalized.settings.posterStreamBadges);
      setBackdropStreamBadges(normalized.settings.backdropStreamBadges);
      setQualityBadgesSide(normalized.settings.qualityBadgesSide);
      setPosterQualityBadgesPosition(normalized.settings.posterQualityBadgesPosition);
      setPosterQualityBadgesStyle(normalized.settings.posterQualityBadgesStyle);
      setBackdropQualityBadgesStyle(normalized.settings.backdropQualityBadgesStyle);
      setPosterQualityBadgesMax(normalized.settings.posterQualityBadgesMax);
      setBackdropQualityBadgesMax(normalized.settings.backdropQualityBadgesMax);
      setPosterRatingsLayout(normalized.settings.posterRatingsLayout);
      setBackdropRatingsLayout(normalized.settings.backdropRatingsLayout);
      setPosterRatingStyle(normalized.settings.posterRatingStyle);
      setBackdropRatingStyle(normalized.settings.backdropRatingStyle);
      setLogoRatingStyle(normalized.settings.logoRatingStyle);
      setPosterRatingPresentation(normalized.settings.posterRatingPresentation);
      setBackdropRatingPresentation(normalized.settings.backdropRatingPresentation);
      setLogoRatingPresentation(normalized.settings.logoRatingPresentation);
      setPosterAggregateRatingSource(normalized.settings.posterAggregateRatingSource);
      setBackdropAggregateRatingSource(normalized.settings.backdropAggregateRatingSource);
      setLogoAggregateRatingSource(normalized.settings.logoAggregateRatingSource);
      setPosterRatingsMaxPerSide(normalized.settings.posterRatingsMaxPerSide);
      setLogoRatingsMax(normalized.settings.logoRatingsMax);
      setLogoBackground(normalized.settings.logoBackground);
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
        tmdbKey: tmdbKey.trim(),
        mdblistKey: mdblistKey.trim(),
        lang,
        posterImageText,
        backdropImageText,
        genreBadgeMode,
        posterRatingPreferences,
        backdropRatingPreferences,
        logoRatingPreferences,
        posterStreamBadges,
        backdropStreamBadges,
        qualityBadgesSide,
        posterQualityBadgesPosition,
        posterQualityBadgesStyle,
        backdropQualityBadgesStyle,
        posterQualityBadgesMax,
        backdropQualityBadgesMax,
        posterRatingsLayout,
        backdropRatingsLayout,
        posterRatingStyle,
        backdropRatingStyle,
        logoRatingStyle,
        posterRatingPresentation,
        backdropRatingPresentation,
        logoRatingPresentation,
        posterAggregateRatingSource,
        backdropAggregateRatingSource,
        logoAggregateRatingSource,
        posterRatingsMaxPerSide,
        logoRatingsMax,
        logoBackground,
      },
      proxy: {
        manifestUrl: normalizeManifestUrl(proxyManifestUrl, true),
        translateMeta: proxyTranslateMeta,
        translateMetaMode: proxyTranslateMetaMode,
        debugMetaTranslation: proxyDebugMetaTranslation,
      },
    }),
    [
      tmdbKey,
      mdblistKey,
      lang,
      posterImageText,
      backdropImageText,
      genreBadgeMode,
      posterRatingPreferences,
      backdropRatingPreferences,
      logoRatingPreferences,
      posterStreamBadges,
      backdropStreamBadges,
      qualityBadgesSide,
      posterQualityBadgesPosition,
      posterQualityBadgesStyle,
      backdropQualityBadgesStyle,
      posterQualityBadgesMax,
      backdropQualityBadgesMax,
      posterRatingsLayout,
      backdropRatingsLayout,
      posterRatingStyle,
      backdropRatingStyle,
      logoRatingStyle,
      posterRatingPresentation,
      backdropRatingPresentation,
      logoRatingPresentation,
      posterAggregateRatingSource,
      backdropAggregateRatingSource,
      logoAggregateRatingSource,
      posterRatingsMaxPerSide,
      logoRatingsMax,
      logoBackground,
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
        const settings = JSON.parse(settingsRaw) as { autoSave?: boolean };
        setConfigAutoSave(Boolean(settings.autoSave));
      }

      const raw = window.localStorage.getItem(UI_CONFIG_STORAGE_KEY);
      if (raw) {
        const parsed = parseSavedUiConfig(raw);
        if (!parsed) {
          setSavedConfigStatus('error');
          return;
        }
        applySavedUiConfig(parsed, 'loaded');
        return;
      }

      const legacyRaw = window.localStorage.getItem(LEGACY_API_KEY_CONFIG_STORAGE_KEY);
      if (!legacyRaw) {
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
    } catch {
      setSavedConfigStatus('error');
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

  const handleCopyPrompt = useCallback(() => {
    navigator.clipboard.writeText(AI_DEVELOPER_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const previewUrl = useMemo(() => {
    const normalizedTmdbKey = tmdbKey.trim();
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
      previewType === 'backdrop' ? backdropQualityBadgesStyle : posterQualityBadgesStyle;
    const query = new URLSearchParams({
      ratingStyle: ratingStyleForType,
      lang,
    });
    if (genreBadgeMode !== DEFAULT_GENRE_BADGE_MODE) {
      query.set('genreBadge', genreBadgeMode);
    }
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
    if (previewType !== 'logo' && qualityBadgesStyleForType !== DEFAULT_QUALITY_BADGES_STYLE) {
      query.set(
        previewType === 'backdrop' ? 'backdropQualityBadgesStyle' : 'posterQualityBadgesStyle',
        qualityBadgesStyleForType
      );
    }
    if (previewType !== 'logo' && activeQualityBadgesMax !== null) {
      query.set(
        previewType === 'backdrop' ? 'backdropQualityBadgesMax' : 'posterQualityBadgesMax',
        String(activeQualityBadgesMax)
      );
    }

    if (mdblistKey) {
      query.set('mdblistKey', mdblistKey);
    }
    query.set('tmdbKey', normalizedTmdbKey);

    if (previewType === 'poster' || previewType === 'backdrop') {
      query.set('imageText', imageTextForType);
    }
    if (previewType === 'poster') {
      query.set('posterRatingsLayout', posterRatingsLayout);
      if (isVerticalPosterRatingLayout(posterRatingsLayout) && posterRatingsMaxPerSide !== null) {
        query.set('posterRatingsMaxPerSide', String(posterRatingsMaxPerSide));
      }
    } else if (previewType === 'backdrop') {
      query.set('backdropRatingsLayout', backdropRatingsLayout);
    } else {
      if (logoRatingsMax !== null) {
        query.set('logoRatingsMax', String(logoRatingsMax));
      }
      if (logoBackground !== 'transparent') {
        query.set('logoBackground', logoBackground);
      }
    }

    return `${baseUrl}/${previewType}/${normalizedMediaId}.jpg?${query.toString()}`;
  }, [
    previewType,
    mediaId,
    lang,
    posterImageText,
    backdropImageText,
    genreBadgeMode,
    posterRatingPreferences,
    backdropRatingPreferences,
    logoRatingPreferences,
    posterStreamBadges,
    backdropStreamBadges,
    posterRatingsLayout,
    posterRatingsMaxPerSide,
    activeQualityBadgesMax,
    backdropRatingsLayout,
    qualityBadgesSide,
    posterQualityBadgesPosition,
    posterQualityBadgesStyle,
    backdropQualityBadgesStyle,
    posterRatingStyle,
    backdropRatingStyle,
    logoRatingStyle,
    posterRatingPresentation,
    backdropRatingPresentation,
    logoRatingPresentation,
    posterAggregateRatingSource,
    backdropAggregateRatingSource,
    logoAggregateRatingSource,
    logoRatingsMax,
    logoBackground,
    baseUrl,
    shouldShowQualityBadgesSide,
    shouldShowQualityBadgesPosition,
    mdblistKey,
    tmdbKey,
  ]);

  const previewErrored = Boolean(previewUrl) && previewErroredForUrl === previewUrl;
  const genrePreviewCards = useMemo(
    () =>
      GENRE_BADGE_PREVIEW_SAMPLES.map((sample) => ({
        sample,
        url: buildGenreSamplePreviewUrl({
          baseUrl,
          tmdbKey,
          sample,
          mode: genrePreviewMode,
        }),
      })),
    [baseUrl, tmdbKey, genrePreviewMode]
  );
  const latestReleaseMatchesDeployment = latestReleaseTag && latestReleaseTag === DEPLOYMENT_VERSION;
  const versionStatusNote = isLatestReleaseLoading
    ? 'Checking the latest release on GitHub now.'
    : latestReleaseTag
      ? latestReleaseMatchesDeployment
        ? 'Live matches the latest release on GitHub.'
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

      if (response.status === 400 && body.toLowerCase().includes('tmdb')) {
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
    if (typeof window === 'undefined') {
      return;
    }

    const next = !configAutoSave;
    setConfigAutoSave(next);

    try {
      window.localStorage.setItem(
        UI_CONFIG_SETTINGS_STORAGE_KEY,
        JSON.stringify({ autoSave: next })
      );
      if (next) {
        persistUiConfig(false);
      }
    } catch {
      setSavedConfigStatus('error');
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
  const activeAggregateAccent = AGGREGATE_SOURCE_ACCENT_BY_ID[activeAggregateRatingSource];
  const activeImageText = previewType === 'backdrop' ? backdropImageText : posterImageText;
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
  const showsAggregateRatingSource = usesAggregateRatingSource(activeRatingPresentation);
  const activePresentationPreservesLayout = preservesSelectedRatingLayout(activeRatingPresentation);
  const layoutPlacementHelp =
    previewType === 'poster'
      ? 'top, bottom, left, or right'
      : previewType === 'backdrop'
        ? 'center, right, or right vertical'
        : null;

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

  const setImageTextForType = (value: 'original' | 'clean' | 'alternative') => {
    if (previewType === 'backdrop') {
      setBackdropImageText(value);
      return;
    }
    setPosterImageText(value);
  };

  return (
    <div
      ref={pageRef}
      className="erdb-page min-h-screen bg-transparent text-zinc-300 selection:bg-violet-500/30"
    >
      <nav ref={navRef} className="erdb-chrome sticky top-0 z-50">
        <div className="erdb-nav-shell max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 min-w-0">
            <BrandLockup />
            <span className="erdb-brand-tag">Stateless ratings engine</span>
            <DeploymentVersionPill compact />
            <LatestReleasePill
              compact
              releaseTag={latestReleaseTag}
              releaseUrl={latestReleaseUrl}
              loading={isLatestReleaseLoading}
            />
          </div>
          <div className="erdb-nav-links flex flex-wrap items-center gap-2 text-sm font-medium">
            <a href="#preview" onClick={handleAnchorClick} className="erdb-nav-link">Configurator</a>
            <a href="#proxy" onClick={handleAnchorClick} className="erdb-nav-link">Addon Proxy</a>
            <a href="#docs" onClick={handleAnchorClick} className="erdb-nav-link">API Docs</a>
            <a href={BRAND_GITHUB_URL} target="_blank" rel="noreferrer" className="erdb-nav-link">github</a>
            <UptimePill />
            <SupportPill />
          </div>
        </div>
      </nav>

      <main className="erdb-main max-w-7xl mx-auto px-6 py-16 md:py-20">
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
                Forked by IbbyLabs for the same ecosystem as Uptime Tracker.
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
                  If you hit a rendering issue, need help with badges or language, or want a hand wiring this project into your setup, message me on Discord.
                </p>
                <div className="site-discord-callout-actions">
                  <DiscordPill />
                  <span className="site-discord-fallback">If the button does not open, search for {BRAND_DISCORD_HANDLE} in Discord.</span>
                </div>
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
            <div className="mt-6 erdb-surface-grid grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)_minmax(0,0.84fr)] items-start">
            <div className="space-y-5">
              <div className="erdb-panel erdb-panel-form space-y-3 rounded-3xl border border-white/10 bg-zinc-900/60 p-4 md:p-5">
                <div className="erdb-panel-head">
                  <div>
                    <p className="erdb-panel-eyebrow font-mono">Inputs</p>
                    <h3 className="erdb-panel-title text-white">Configurator</h3>
                    <p className="erdb-panel-copy text-zinc-400">Adjust parameters once. The config string, live preview, and addon proxy export all reuse this same ERDB setup.</p>
                  </div>
                </div>
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
                                : savedConfigStatus === 'invalid'
                                  ? 'Invalid workspace file.'
                                  : 'Unable to access local storage.'}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-zinc-400 mb-2">Access Keys</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">TMDB</label>
                      <input type="password" value={tmdbKey} onChange={(e) => setTmdbKey(e.target.value)} placeholder="v3 Key" className="w-full bg-black border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:border-violet-500/50 outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">MDBList</label>
                      <input type="password" value={mdblistKey} onChange={(e) => setMdblistKey(e.target.value)} placeholder="Key" className="w-full bg-black border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:border-violet-500/50 outline-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-zinc-400 mb-2">Media Target</div>
                  <div className="flex flex-wrap gap-2 items-end">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Type</span>
                      <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg border border-white/10">
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

                <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-3">
                  <div className="text-[11px] font-semibold text-zinc-400">Presentation</div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {RATING_PRESENTATION_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setRatingPresentationForType(option.id)}
                        className={`rounded-xl border p-3 text-left transition-colors ${
                          activeRatingPresentation === option.id
                            ? 'border-violet-500/60 bg-violet-500/10 text-white'
                            : 'border-white/10 bg-zinc-900/60 text-zinc-300 hover:border-white/20 hover:bg-zinc-900'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold">{option.label}</span>
                          {activeRatingPresentation === option.id && (
                            <span className="rounded-full border border-violet-400/40 bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-200">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
                          {option.description}
                        </p>
                      </button>
                    ))}
                  </div>
                  {layoutPlacementHelp ? (
                    <p className="text-[11px] leading-relaxed text-zinc-500">
                      {activePresentationPreservesLayout
                        ? `This mode still respects the selected layout below, so you can move ratings to ${layoutPlacementHelp}.`
                        : `Blockbuster uses a fixed ${previewType === 'poster' ? 'left/right poster stack' : 'right vertical backdrop stack'}. Switch to another presentation to use ${layoutPlacementHelp}.`}
                    </p>
                  ) : (
                    <p className="text-[11px] leading-relaxed text-zinc-500">
                      Logo presentation keeps the output controls below available.
                    </p>
                  )}
                  {showsAggregateRatingSource && (
                    <div
                      className="rounded-xl border bg-zinc-900/50 p-3 space-y-2"
                      style={{
                        borderColor: hexToRgbaCss(activeAggregateAccent, 0.24),
                        backgroundImage: `linear-gradient(145deg, ${hexToRgbaCss(activeAggregateAccent, 0.12)}, rgba(24,24,27,0.78) 58%)`,
                      }}
                    >
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
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-3">
                  <div className="flex flex-wrap gap-3 items-center">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">{styleLabel}</span>
                      <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg border border-white/10">
                        {RATING_STYLE_OPTIONS.map(opt => (
                          <button key={opt.id} onClick={() => setRatingStyleForType(opt.id as RatingStyle)} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${activeRatingStyle === opt.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}>{opt.label}</button>
                        ))}
                      </div>
                    </div>
                    {previewType !== 'logo' && (
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">{textLabel}</span>
                        <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg border border-white/10">
                          {(['original', 'clean', 'alternative'] as const).map(option => (
                            <button key={option} onClick={() => setImageTextForType(option)} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${activeImageText === option ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}>{option.charAt(0).toUpperCase() + option.slice(1)}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Genre Badge</span>
                      <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg border border-white/10">
                        {GENRE_BADGE_MODE_OPTIONS.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => setGenreBadgeMode(option.id)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                              genreBadgeMode === option.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                            }`}
                            title={option.description}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] leading-relaxed text-zinc-500">
                    Genre badges use a small curated bucket set. Clear genres such as horror, comedy, sci fi, fantasy, crime, documentary, and anime resolve; fuzzy cases stay off.
                  </p>
                </div>

                {(previewType === 'poster' || previewType === 'backdrop' || previewType === 'logo') && (
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
                        </div>
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
                      </div>
                    )}

                    {previewType === 'logo' && (
                      <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-3 space-y-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Logo Output</div>
                        <div className="flex flex-wrap gap-3 items-end">
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Background</span>
                            <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg border border-white/10">
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
                      </div>
                    )}
                  </div>
                )}

                {previewType !== 'logo' && (
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2">
                    <div className="text-[11px] font-semibold text-zinc-400">
                      Quality Badges · {qualityBadgeTypeLabel}
                    </div>
                    <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg border border-white/10">
                    {STREAM_BADGE_OPTIONS.map(option => (
                      <button key={option.id} onClick={() => setActiveStreamBadges(option.id)} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${activeStreamBadges === option.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}>
                        {option.label}
                      </button>
                    ))}
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Quality Badge Style</span>
                      <div className="flex flex-wrap gap-1">
                      {RATING_STYLE_OPTIONS.map(option => (
                        <button key={`quality-style-${option.id}`} onClick={() => setActiveQualityBadgesStyle(option.id)} className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors ${activeQualityBadgesStyle === option.id ? 'border-violet-500/60 bg-zinc-800 text-white' : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'}`}>
                          {option.label}
                        </button>
                      ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Max badges</span>
                      <input type="number" value={activeQualityBadgesMax ?? ''} onChange={(e) => setActiveQualityBadgesMax(normalizeOptionalBadgeCountInput(e.target.value))} placeholder="Auto" min={POSTER_RATINGS_MAX_PER_SIDE_MIN} className="w-16 bg-black border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-violet-500/50 outline-none" />
                      <button onClick={() => setActiveQualityBadgesMax(null)} className="rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-[11px] text-zinc-300 hover:bg-zinc-800">Auto</button>
                    </div>
                    {shouldShowQualityBadgesSide && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Side</span>
                        <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg border border-white/10">
                          {QUALITY_BADGE_SIDE_OPTIONS.map(option => (
                            <button key={option.id} onClick={() => setQualityBadgesSide(option.id)} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${qualityBadgesSide === option.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}>
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {shouldShowQualityBadgesPosition && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Position</span>
                        <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg border border-white/10">
                          {QUALITY_BADGE_POSITION_OPTIONS.map(option => (
                            <button key={option.id} onClick={() => setPosterQualityBadgesPosition(option.id)} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${posterQualityBadgesPosition === option.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}>
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block">
                    {providersLabel} · drag to reorder
                  </span>
                  <p className="text-[10px] leading-4 text-zinc-500">
                    ERDB respects this order when rendering badges. Disabled providers stay available but are skipped.
                  </p>
                  <RatingProviderSortableList
                    rows={ratingProviderRows}
                    onReorder={reorderRatingPreference}
                    onToggle={toggleRatingPreference}
                    fillDirection="row"
                  />
                </div>
              </div>

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
              </div>
            </div>

            <div className="space-y-5">
              <div className="erdb-panel erdb-panel-preview rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
                <div className="erdb-panel-head">
                  <div>
                    <p className="erdb-panel-eyebrow font-mono">Output</p>
                    <h3 className="text-xl font-semibold text-white">Preview Output</h3>
                    <p className="mt-2 text-sm text-zinc-400">
                      Stateless dynamic layout generated via query parameters.
                    </p>
                  </div>
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
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/70 p-4 min-h-[320px] flex items-center justify-center flex-col">
                  {previewUrl && !previewErrored ? (
                    <div className="z-10 w-full flex flex-col items-center gap-8">
                      <div className={`relative shadow-2xl shadow-black ring-1 ring-white/10 rounded-2xl overflow-hidden ${previewType === 'poster'
                        ? 'aspect-[2/3] w-72'
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
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/60 p-4 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Genre Badge Samples</div>
                      <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                        Curated movie, show, and anime renders that keep the badge decision fixed while you compare text, icon, and combined modes.
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
                    <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                            <div className="flex min-h-[3.5rem] items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
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
                    <div className="rounded-xl border border-dashed border-white/10 bg-zinc-950/40 px-4 py-5 text-[11px] leading-5 text-zinc-500">
                      Add a TMDB key above to load the curated sample board.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div id="proxy" className="scroll-mt-24">
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

                    {proxyTranslateMeta && (
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
          <div className="max-w-5xl mx-auto space-y-8">
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
                <p className="text-sm text-zinc-400">No tokens needed. Pass parameters in the query string and let ERDB handle metadata and rendering.</p>
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
                        <td className="px-5 py-2 text-zinc-400 text-xs">off, text, icon, both (global genre badge)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">off</td>
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
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">qualityBadgesStyle</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">glass, square, plain (global fallback)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">glass</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">posterQualityBadgesStyle</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">glass, square, plain (poster only)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">glass</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">backdropQualityBadgesStyle</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">glass, square, plain (backdrop only)</td>
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
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">ratingPresentation</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">standard, minimal, average, blockbuster</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">standard</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">aggregateRatingSource</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">overall, critics, audience</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">overall</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">ratingStyle</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">glass, square, plain</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">glass (poster/backdrop), plain (logo)</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">imageText</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">original, clean, alternative</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">original (poster), clean (backdrop)</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">posterRatingsLayout</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{POSTER_LAYOUT_DOC_VALUES}</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">{POSTER_LAYOUT_DOC_DEFAULT}</td>
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
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">tmdbKey <span className="font-bold">(req)</span></td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">TMDB v3 API Key</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">none</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">mdblistKey <span className="font-bold">(req)</span></td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">MDBList.com API Key</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">none</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-white/10 bg-zinc-900/35 px-5 py-4 text-xs leading-6 text-zinc-400">
                  In the configurator UI, <span className="font-semibold text-zinc-200">Compact Average</span> maps to <span className="font-mono text-zinc-200">minimal</span> and <span className="font-semibold text-zinc-200">Labeled Average</span> maps to <span className="font-mono text-zinc-200">average</span>. Query values remain unchanged.
                  <br />
                  Genre badges use a small curated family set. Strong buckets such as <span className="font-semibold text-zinc-200">horror</span>, <span className="font-semibold text-zinc-200">comedy</span>, <span className="font-semibold text-zinc-200">sci fi</span>, <span className="font-semibold text-zinc-200">fantasy</span>, <span className="font-semibold text-zinc-200">crime</span>, <span className="font-semibold text-zinc-200">documentary</span>, and <span className="font-semibold text-zinc-200">anime</span> resolve; ambiguous combinations stay off.
                  <br />
                  Transparent provider icons stay transparent across <span className="font-semibold text-zinc-200">glass</span>, <span className="font-semibold text-zinc-200">square</span>, and <span className="font-semibold text-zinc-200">plain</span>. In <span className="font-semibold text-zinc-200">glass</span>, icons with transparency such as Kitsu render on a neutral inner chip with an accent ring so the accent color does not bleed through the icon cutouts.
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
                            <div>posterRatingPresentation</div>
                            <div>posterAggregateRatingSource</div>
                            <div>posterRatingsLayout</div>
                            <div>posterQualityBadgesPosition</div>
                            <div>posterRatingsMaxPerSide</div>
                            <div>posterQualityBadgesMax</div>
                          </div>
                        </td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">
                          <div className="space-y-1">
                            <div>original, clean, alternative</div>
                            <div>standard, minimal, average, blockbuster</div>
                            <div>overall, critics, audience</div>
                            <div>{POSTER_LAYOUT_DOC_VALUES}</div>
                            <div>auto, left, right (top or bottom layouts only)</div>
                            <div>{POSTER_RATINGS_MAX_DOC_COPY} (auto if omitted)</div>
                            <div>{OPTIONAL_BADGE_MAX_DOC_COPY} (auto if omitted)</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">backdrop</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">
                          <div className="space-y-1">
                            <div>imageText</div>
                            <div>backdropRatingPresentation</div>
                            <div>backdropAggregateRatingSource</div>
                            <div>backdropRatingsLayout</div>
                            <div>backdropQualityBadgesMax</div>
                          </div>
                        </td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">
                          <div className="space-y-1">
                            <div>original, clean, alternative</div>
                            <div>standard, minimal, average, blockbuster</div>
                            <div>overall, critics, audience</div>
                            <div>{BACKDROP_LAYOUT_DOC_VALUES}</div>
                            <div>{OPTIONAL_BADGE_MAX_DOC_COPY} (auto if omitted)</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">logo</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">
                          <div className="space-y-1">
                            <div>logoRatingsMax</div>
                            <div>logoBackground</div>
                            <div>logoRatingPresentation</div>
                            <div>logoAggregateRatingSource</div>
                          </div>
                        </td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">
                          <div className="space-y-1">
                            <div>{OPTIONAL_BADGE_MAX_DOC_COPY} (auto if omitted)</div>
                            <div>{LOGO_BACKGROUND_DOC_VALUES}</div>
                            <div>standard, minimal, average, blockbuster</div>
                            <div>overall, critics, audience</div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="px-5 pb-5 pt-3 text-[11px] text-zinc-500">
                  Direct image URLs support shared fallbacks like ratings, lang, genreBadge, ratingPresentation, aggregateRatingSource, ratingStyle, streamBadges, and qualityBadgesStyle. Generated erdbConfig payloads usually emit the per type fields instead and omit unchanged defaults.
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
                        <td className="px-5 py-2 text-zinc-400 text-xs">tmdb:id or tmdb:movie:id or tmdb:tv:id</td>
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
                        <td className="px-5 py-2 font-mono text-violet-200/50 text-xs">anilist:123, mal:456</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="erdb-panel erdb-ai-card p-6 bg-black border border-white/10 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/20 blur-[80px] pointer-events-none" />

                <div className="mb-6">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Base Structure</h4>
                  <div className="p-4 bg-zinc-900/60 border border-white/5 rounded-xl font-mono text-xs overflow-x-auto overflow-y-hidden whitespace-nowrap pb-2">
                    <span className="text-zinc-500">{baseUrl || 'http://localhost:3000'}</span>
                    <span className="text-white">/</span>
                    <span className="text-violet-500 font-bold">{'{type}'}</span>
                    <span className="text-white">/</span>
                    <span className="text-violet-500 font-bold">{'{id}'}</span>
                    <span className="text-white">.jpg?</span>
                    <span className="text-violet-400 font-bold">ratings</span>=<span className="text-zinc-400 font-bold">{'{ratings}'}</span>
                    <span className="text-white">&</span>
                    <span className="text-violet-400 font-bold">lang</span>=<span className="text-zinc-400 font-bold">{'{lang}'}</span>
                    <span className="text-white">&</span>
                    <span className="text-violet-400 font-bold">ratingStyle</span>=<span className="text-zinc-400 font-bold">{'{style}'}</span>
                    <span className="text-white">&</span>
                    <span className="text-violet-400 font-bold">imageText</span>=<span className="text-zinc-400 font-bold">{'{text}'}</span>
                    <span className="text-white">&</span>
                    <span className="text-violet-400 font-bold">posterRatingsLayout</span>=<span className="text-zinc-400 font-bold">{'{layout}'}</span>
                    <span className="text-white">&</span>
                    <span className="text-violet-400 font-bold">posterRatingsMaxPerSide</span>=<span className="text-zinc-400 font-bold">{'{max}'}</span>
                    <span className="text-white">&</span>
                    <span className="text-violet-400 font-bold">backdropRatingsLayout</span>=<span className="text-zinc-400 font-bold">{'{bLayout}'}</span>
                    <span className="text-white">&</span>
                    <span className="text-violet-400 font-bold">tmdbKey</span>=<span className="text-zinc-400 font-bold">{'{tmdbKey}'}</span>
                    <span className="text-white">&</span>
                    <span className="text-violet-400 font-bold">mdblistKey</span>=<span className="text-zinc-400 font-bold">{'{mdbKey}'}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                    <div className="flex gap-2">
                      <span className="text-violet-500 font-bold shrink-0">lang (optional):</span>
                      <span className="text-zinc-400">{TMDB_LANGUAGE_HELP_COPY}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-violet-500 font-bold shrink-0">id (required):</span>
                      <span className="text-zinc-400">IMDb ID (tt...), TMDB ID (prefer tmdb:movie:id or tmdb:tv:id), or Kitsu ID (kitsu:...).</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-violet-500 font-bold shrink-0">tmdbKey (required):</span>
                      <span className="text-zinc-400">Your TMDB v3 API Key.</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-violet-500 font-bold shrink-0">mdblistKey (required):</span>
                      <span className="text-zinc-400">Your MDBList API Key.</span>
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
                  <div className="text-violet-200/70 truncate bg-white/5 p-3 rounded-lg border border-white/5">{`${baseUrl || 'http://localhost:3000'}/backdrop/tmdb:movie:603.jpg?ratings=mdblist&backdropRatingsLayout=${encodeURIComponent('right vertical')}`}</div>

                </pre>
              </div>
            </div>
          </div>
        </div>
        </section>
      </main>

      <section className="max-w-7xl mx-auto px-6 pb-6 md:pb-10" aria-label="Status board information">
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
        <div className="max-w-7xl mx-auto px-6 space-y-4">
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
          </div>
          <div className="site-page-credit">
            <Image src="/favicon.png" alt="" aria-hidden="true" width={20} height={20} />
            <span>Forked by IbbyLabs</span>
          </div>
          <p className="text-sm text-zinc-500 text-center md:text-left">
            © 2026 Easy Ratings Database Project. Consistent chrome, same lab.
          </p>
        </div>
      </footer>
    </div>
  );
}
