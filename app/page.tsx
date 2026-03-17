'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon, Settings2, Globe2, Layers, Cpu, Code2, Terminal, ExternalLink, Zap, ChevronRight, Hash, Sparkles, MonitorPlay, Bot, Clipboard, Check } from 'lucide-react';
import {
  RATING_PROVIDER_OPTIONS,
  stringifyRatingPreferencesAllowEmpty,
  type RatingPreference,
} from '@/lib/ratingPreferences';
import {
  BACKDROP_RATING_LAYOUT_OPTIONS,
  DEFAULT_BACKDROP_RATING_LAYOUT,
  type BackdropRatingLayout,
} from '@/lib/backdropRatingLayout';
import {
  DEFAULT_POSTER_RATINGS_MAX_PER_SIDE,
  DEFAULT_POSTER_RATING_LAYOUT,
  POSTER_RATING_LAYOUT_OPTIONS,
  isVerticalPosterRatingLayout,
  type PosterRatingLayout,
} from '@/lib/posterRatingLayout';
import {
  DEFAULT_RATING_STYLE,
  RATING_STYLE_OPTIONS,
  type RatingStyle,
} from '@/lib/ratingStyle';

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
];
const VISIBLE_RATING_PROVIDER_OPTIONS = RATING_PROVIDER_OPTIONS;
const DEFAULT_RATING_PREFERENCES: RatingPreference[] = ['imdb', 'tmdb', 'mdblist'];
const PROXY_TYPES = ['poster', 'backdrop', 'logo'] as const;
type ProxyType = (typeof PROXY_TYPES)[number];
type ProxyEnabledTypes = Record<ProxyType, boolean>;
type StreamBadgesSetting = 'auto' | 'on' | 'off';
type QualityBadgesSide = 'left' | 'right';
const DEFAULT_QUALITY_BADGES_STYLE: RatingStyle = 'glass';
const DEFAULT_PROXY_QUALITY_BADGES_STYLE: RatingStyle = DEFAULT_QUALITY_BADGES_STYLE;
const BRAND_GITHUB_URL = process.env.NEXT_PUBLIC_BRAND_GITHUB_URL || 'https://github.com/IbbyLabs/erdb';
const BRAND_SUPPORT_URL = process.env.NEXT_PUBLIC_BRAND_SUPPORT_URL || 'https://kofi.ibbylabs.dev';
const STREAM_BADGE_OPTIONS: Array<{ id: StreamBadgesSetting; label: string }> = [
  { id: 'auto', label: 'Auto' },
  { id: 'on', label: 'On' },
  { id: 'off', label: 'Off' },
];
const QUALITY_BADGE_SIDE_OPTIONS: Array<{ id: QualityBadgesSide; label: string }> = [
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
];
type RecentCommitType = 'feat' | 'fix' | 'chore' | 'refactor' | 'perf' | 'test' | 'build' | 'ci' | 'style' | 'revert';
type RecentCommit = {
  hash: string;
  shortHash: string;
  date: string;
  type: RecentCommitType;
  title: string;
  body: string | null;
};
const COMMIT_FEED_URL = '/commits.json';
const COMMIT_PAGE_SIZE = 5;
const API_KEY_CONFIG_STORAGE_KEY = 'erdb.apiKeyConfig.v1';
const API_KEY_CONFIG_SETTINGS_STORAGE_KEY = 'erdb.apiKeyConfig.settings.v1';

type ApiKeyConfigStorage = {
  tmdbKey: string;
  mdblistKey: string;
  proxyTmdbKey: string;
  proxyMdblistKey: string;
  proxyManifestUrl: string;
};

function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className={`site-brand-lockup${compact ? ' site-brand-lockup-compact' : ''}`}>
      <span className="site-brand-badge" aria-hidden="true">
        <Image src="/favicon.png" alt="" className="site-brand-logo" width={38} height={38} priority />
      </span>
      <span className="site-brand-copy">
        <span className="site-brand-eyebrow">IbbyLabs</span>
        <span className="site-brand-name">ERDB</span>
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

const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, '');

const normalizeManifestUrl = (value: string, allowBareScheme = false) => {
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

const isBareHttpUrl = (value: string) => value === 'http://' || value === 'https://';

const encodeBase64Url = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const formatCommitTimestamp = (value: string, nowMs: number) => {
  const commitMs = Date.parse(value);
  if (!Number.isFinite(commitMs)) {
    return '--';
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
  const [baseUrl] = useState(() =>
    normalizeBaseUrl(typeof window !== 'undefined' ? window.location.origin : '')
  );
  const [previewType, setPreviewType] = useState<'poster' | 'backdrop' | 'logo'>('poster');
  const [mediaId, setMediaId] = useState('tt0133093');
  const [lang, setLang] = useState('en');
  const [posterImageText, setPosterImageText] = useState<'original' | 'clean' | 'alternative'>('clean');
  const [backdropImageText, setBackdropImageText] = useState<'original' | 'clean' | 'alternative'>('clean');
  const [posterRatingPreferences, setPosterRatingPreferences] = useState<RatingPreference[]>(
    DEFAULT_RATING_PREFERENCES
  );
  const [backdropRatingPreferences, setBackdropRatingPreferences] = useState<RatingPreference[]>(
    DEFAULT_RATING_PREFERENCES
  );
  const [logoRatingPreferences, setLogoRatingPreferences] = useState<RatingPreference[]>(
    DEFAULT_RATING_PREFERENCES
  );
  const [posterStreamBadges, setPosterStreamBadges] = useState<StreamBadgesSetting>('auto');
  const [backdropStreamBadges, setBackdropStreamBadges] = useState<StreamBadgesSetting>('auto');
  const [qualityBadgesSide, setQualityBadgesSide] = useState<QualityBadgesSide>('left');
  const [posterQualityBadgesStyle, setPosterQualityBadgesStyle] = useState<RatingStyle>(DEFAULT_QUALITY_BADGES_STYLE);
  const [backdropQualityBadgesStyle, setBackdropQualityBadgesStyle] = useState<RatingStyle>(DEFAULT_QUALITY_BADGES_STYLE);
  const [posterRatingsLayout, setPosterRatingsLayout] = useState<PosterRatingLayout>('bottom');
  const [backdropRatingsLayout, setBackdropRatingsLayout] = useState<BackdropRatingLayout>(DEFAULT_BACKDROP_RATING_LAYOUT);
  const [posterRatingStyle, setPosterRatingStyle] = useState<RatingStyle>(DEFAULT_RATING_STYLE);
  const [backdropRatingStyle, setBackdropRatingStyle] = useState<RatingStyle>(DEFAULT_RATING_STYLE);
  const [logoRatingStyle, setLogoRatingStyle] = useState<RatingStyle>('plain');
  const [posterRatingsMaxPerSide, setPosterRatingsMaxPerSide] = useState<number | null>(DEFAULT_POSTER_RATINGS_MAX_PER_SIDE);
  const [supportedLanguages, setSupportedLanguages] = useState(SUPPORTED_LANGUAGES);
  const [mdblistKey, setMdblistKey] = useState('');
  const [tmdbKey, setTmdbKey] = useState('');
  const [proxyManifestUrl, setProxyManifestUrl] = useState('');
  const [proxyTmdbKey, setProxyTmdbKey] = useState('');
  const [proxyMdblistKey, setProxyMdblistKey] = useState('');
  const [proxyPosterRatingPreferences, setProxyPosterRatingPreferences] = useState<RatingPreference[]>(
    DEFAULT_RATING_PREFERENCES
  );
  const [proxyBackdropRatingPreferences, setProxyBackdropRatingPreferences] = useState<RatingPreference[]>(
    DEFAULT_RATING_PREFERENCES
  );
  const [proxyLogoRatingPreferences, setProxyLogoRatingPreferences] = useState<RatingPreference[]>(
    DEFAULT_RATING_PREFERENCES
  );
  const [proxyPosterStreamBadges, setProxyPosterStreamBadges] = useState<StreamBadgesSetting>('auto');
  const [proxyBackdropStreamBadges, setProxyBackdropStreamBadges] = useState<StreamBadgesSetting>('auto');
  const [proxyQualityBadgesSide, setProxyQualityBadgesSide] = useState<QualityBadgesSide>('left');
  const [proxyPosterQualityBadgesStyle, setProxyPosterQualityBadgesStyle] = useState<RatingStyle>(DEFAULT_PROXY_QUALITY_BADGES_STYLE);
  const [proxyBackdropQualityBadgesStyle, setProxyBackdropQualityBadgesStyle] = useState<RatingStyle>(DEFAULT_PROXY_QUALITY_BADGES_STYLE);
  const [proxyLang, setProxyLang] = useState('en');
  const [proxyConfigType, setProxyConfigType] = useState<'poster' | 'backdrop' | 'logo'>('poster');
  const [proxyEnabledTypes, setProxyEnabledTypes] = useState<ProxyEnabledTypes>({
    poster: true,
    backdrop: true,
    logo: true,
  });
  const [proxyPosterRatingStyle, setProxyPosterRatingStyle] = useState<RatingStyle>(DEFAULT_RATING_STYLE);
  const [proxyBackdropRatingStyle, setProxyBackdropRatingStyle] = useState<RatingStyle>(DEFAULT_RATING_STYLE);
  const [proxyLogoRatingStyle, setProxyLogoRatingStyle] = useState<RatingStyle>('plain');
  const [proxyPosterImageText, setProxyPosterImageText] = useState<'original' | 'clean' | 'alternative'>('clean');
  const [proxyBackdropImageText, setProxyBackdropImageText] = useState<'original' | 'clean' | 'alternative'>('clean');
  const [proxyPosterRatingsLayout, setProxyPosterRatingsLayout] = useState<PosterRatingLayout>('bottom');
  const [proxyPosterRatingsMaxPerSide, setProxyPosterRatingsMaxPerSide] = useState<number | null>(DEFAULT_POSTER_RATINGS_MAX_PER_SIDE);
  const [proxyBackdropRatingsLayout, setProxyBackdropRatingsLayout] = useState<BackdropRatingLayout>(DEFAULT_BACKDROP_RATING_LAYOUT);
  const [proxyCopied, setProxyCopied] = useState(false);
  const [configCopied, setConfigCopied] = useState(false);
  const [previewErroredForUrl, setPreviewErroredForUrl] = useState('');
  const [recentCommits, setRecentCommits] = useState<RecentCommit[]>([]);
  const [recentCommitsError, setRecentCommitsError] = useState('');
  const [isRecentCommitsLoading, setIsRecentCommitsLoading] = useState(true);
  const [visibleRecentCommitCount, setVisibleRecentCommitCount] = useState(COMMIT_PAGE_SIZE);
  const [nowMs, setNowMs] = useState(Date.now());
  const [apiKeyConfigStatus, setApiKeyConfigStatus] = useState<'' | 'loaded' | 'saved' | 'cleared' | 'error'>('');
  const [apiKeyConfigAutoSave, setApiKeyConfigAutoSave] = useState(false);

  const [copied, setCopied] = useState(false);
  const shouldShowPosterQualityBadgesSide = posterRatingsLayout === 'top-bottom';
  const shouldShowQualityBadgesSide = previewType === 'poster' && shouldShowPosterQualityBadgesSide;
  const shouldShowProxyPosterQualityBadgesSide = proxyPosterRatingsLayout === 'top-bottom';
  const shouldShowProxyQualityBadgesSide =
    proxyConfigType === 'poster' && shouldShowProxyPosterQualityBadgesSide;
  const qualityBadgeTypeLabel = previewType === 'backdrop' ? 'Backdrop' : 'Poster';
  const proxyQualityBadgeTypeLabel = proxyConfigType === 'backdrop' ? 'Backdrop' : 'Poster';
  const activeStreamBadges = previewType === 'backdrop' ? backdropStreamBadges : posterStreamBadges;
  const setActiveStreamBadges = previewType === 'backdrop' ? setBackdropStreamBadges : setPosterStreamBadges;
  const activeQualityBadgesStyle =
    previewType === 'backdrop' ? backdropQualityBadgesStyle : posterQualityBadgesStyle;
  const setActiveQualityBadgesStyle =
    previewType === 'backdrop' ? setBackdropQualityBadgesStyle : setPosterQualityBadgesStyle;
  const proxyStreamBadgesForType =
    proxyConfigType === 'backdrop' ? proxyBackdropStreamBadges : proxyPosterStreamBadges;
  const setProxyStreamBadgesForType =
    proxyConfigType === 'backdrop' ? setProxyBackdropStreamBadges : setProxyPosterStreamBadges;
  const proxyQualityBadgesStyleForType =
    proxyConfigType === 'backdrop' ? proxyBackdropQualityBadgesStyle : proxyPosterQualityBadgesStyle;
  const setProxyQualityBadgesStyleForType =
    proxyConfigType === 'backdrop' ? setProxyBackdropQualityBadgesStyle : setProxyPosterQualityBadgesStyle;
  const effectiveProxyTmdbKey = proxyTmdbKey.trim() || tmdbKey.trim();
  const effectiveProxyMdblistKey = proxyMdblistKey.trim() || mdblistKey.trim();

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
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const raw = window.localStorage.getItem(API_KEY_CONFIG_STORAGE_KEY);
      const settingsRaw = window.localStorage.getItem(API_KEY_CONFIG_SETTINGS_STORAGE_KEY);
      if (settingsRaw) {
        const settings = JSON.parse(settingsRaw) as { autoSave?: boolean };
        setApiKeyConfigAutoSave(Boolean(settings.autoSave));
      }
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as Partial<ApiKeyConfigStorage>;
      setTmdbKey(typeof parsed.tmdbKey === 'string' ? parsed.tmdbKey : '');
      setMdblistKey(typeof parsed.mdblistKey === 'string' ? parsed.mdblistKey : '');
      setProxyTmdbKey(typeof parsed.proxyTmdbKey === 'string' ? parsed.proxyTmdbKey : '');
      setProxyMdblistKey(typeof parsed.proxyMdblistKey === 'string' ? parsed.proxyMdblistKey : '');
      setProxyManifestUrl(typeof parsed.proxyManifestUrl === 'string' ? parsed.proxyManifestUrl : '');
      setApiKeyConfigStatus('loaded');
    } catch {
      setApiKeyConfigStatus('error');
    }
  }, []);

  const persistApiKeyConfig = useCallback((showSavedStatus = true) => {
    if (typeof window === 'undefined') {
      return;
    }

    const payload: ApiKeyConfigStorage = {
      tmdbKey: tmdbKey.trim(),
      mdblistKey: mdblistKey.trim(),
      proxyTmdbKey: proxyTmdbKey.trim(),
      proxyMdblistKey: proxyMdblistKey.trim(),
      proxyManifestUrl: normalizeManifestUrl(proxyManifestUrl, true),
    };

    try {
      window.localStorage.setItem(API_KEY_CONFIG_STORAGE_KEY, JSON.stringify(payload));
      if (showSavedStatus) {
        setApiKeyConfigStatus('saved');
      }
    } catch {
      setApiKeyConfigStatus('error');
    }
  }, [tmdbKey, mdblistKey, proxyTmdbKey, proxyMdblistKey, proxyManifestUrl]);

  useEffect(() => {
    if (!apiKeyConfigAutoSave) {
      return;
    }
    persistApiKeyConfig(false);
  }, [
    apiKeyConfigAutoSave,
    tmdbKey,
    mdblistKey,
    proxyTmdbKey,
    proxyMdblistKey,
    proxyManifestUrl,
    persistApiKeyConfig,
  ]);

  const handleCopyPrompt = useCallback(() => {
    const prompt = `Act as an expert addon developer. I want to implement the ERDB Stateless API into my media center addon.

--- CONFIG INPUT ---
Add a single text field called \"erdbConfig\" (base64url). The user will paste it from the ERDB site after configuring there.
Do NOT hardcode API keys or base URL. Always use cfg.baseUrl from erdbConfig.

--- DECODE ---
Node/JS: const cfg = JSON.parse(Buffer.from(erdbConfig, 'base64url').toString('utf8'));

--- FULL API REFERENCE ---
Endpoint: GET /{type}/{id}.jpg?...queryParams

Parameter               | Values                                                              | Default
type (path)             | poster, backdrop, logo                                               | -
id (path)               | IMDb (tt...), TMDB (tmdb:id / tmdb:movie:id / tmdb:tv:id), Kitsu (kitsu:id), AniList, MAL          | -
ratings                 | tmdb, mdblist, imdb, tomatoes, tomatoesaudience, letterboxd,         | all
                        | metacritic, metacriticuser, trakt, rogerebert, myanimelist,          |
                        | anilist, kitsu (global fallback)                                     |
posterRatings           | tmdb, mdblist, imdb, tomatoes, tomatoesaudience, letterboxd,         | all
                        | metacritic, metacriticuser, trakt, rogerebert, myanimelist,          |
                        | anilist, kitsu (poster only)                                         |
backdropRatings         | tmdb, mdblist, imdb, tomatoes, tomatoesaudience, letterboxd,         | all
                        | metacritic, metacriticuser, trakt, rogerebert, myanimelist,          |
                        | anilist, kitsu (backdrop only)                                       |
logoRatings             | tmdb, mdblist, imdb, tomatoes, tomatoesaudience, letterboxd,         | all
                        | metacritic, metacriticuser, trakt, rogerebert, myanimelist,          |
                        | anilist, kitsu (logo only)                                           |
lang                    | Any TMDB ISO 639-1 code (en, it, fr, es, de, ja, ko, etc.)            | en
streamBadges            | auto, on, off (global fallback)                                      | auto
posterStreamBadges      | auto, on, off (poster only)                                          | auto
backdropStreamBadges    | auto, on, off (backdrop only)                                        | auto
qualityBadgesSide       | left, right (poster only)                                            | left
qualityBadgesStyle      | glass, square, plain (global fallback)                               | glass
posterQualityBadgesStyle| glass, square, plain (poster only)                                   | glass
backdropQualityBadgesStyle| glass, square, plain (backdrop only)                               | glass
ratingStyle             | glass, square, plain                                                 | glass
imageText               | original, clean, alternative                                         | original
posterRatingsLayout     | top, bottom, left, right, top-bottom, left-right                     | top-bottom
posterRatingsMaxPerSide | Number (1-20)                                                        | auto
backdropRatingsLayout   | center, right, right-vertical                                        | center
tmdbKey (REQUIRED)      | Your TMDB v3 API Key                                                 | -
mdblistKey (REQUIRED)   | Your MDBList.com API Key                                             | -

--- INTEGRATION REQUIREMENTS ---
1. Use ONLY the \"erdbConfig\" field (no modal and no extra settings panels).
2. Add toggles to enable/disable: poster, backdrop, logo.
3. If a type is disabled, keep the original artwork (do not call ERDB for that type).
4. Build ERDB URLs using the decoded config and inject them into both catalog and meta responses.

--- PER-TYPE SETTINGS ---
poster   -> ratingStyle = cfg.posterRatingStyle, imageText = cfg.posterImageText
backdrop -> ratingStyle = cfg.backdropRatingStyle, imageText = cfg.backdropImageText
logo     -> ratingStyle = cfg.logoRatingStyle (omit imageText)
Ratings providers can be set per-type via cfg.posterRatings / cfg.backdropRatings / cfg.logoRatings (fallback to cfg.ratings).
Quality badges style can be set per-type via cfg.posterQualityBadgesStyle / cfg.backdropQualityBadgesStyle (fallback to cfg.qualityBadgesStyle).

--- URL BUILD ---
const typeRatingStyle = type === 'poster' ? cfg.posterRatingStyle : type === 'backdrop' ? cfg.backdropRatingStyle : cfg.logoRatingStyle;
const typeImageText = type === 'backdrop' ? cfg.backdropImageText : cfg.posterImageText;
\${cfg.baseUrl}/\${type}/\${id}.jpg?tmdbKey=\${cfg.tmdbKey}&mdblistKey=\${cfg.mdblistKey}&ratings=\${cfg.ratings}&posterRatings=\${cfg.posterRatings}&backdropRatings=\${cfg.backdropRatings}&logoRatings=\${cfg.logoRatings}&lang=\${cfg.lang}&streamBadges=\${cfg.streamBadges}&posterStreamBadges=\${cfg.posterStreamBadges}&backdropStreamBadges=\${cfg.backdropStreamBadges}&qualityBadgesSide=\${cfg.qualityBadgesSide}&qualityBadgesStyle=\${cfg.qualityBadgesStyle}&posterQualityBadgesStyle=\${cfg.posterQualityBadgesStyle}&backdropQualityBadgesStyle=\${cfg.backdropQualityBadgesStyle}&ratingStyle=\${typeRatingStyle}&imageText=\${typeImageText}&posterRatingsLayout=\${cfg.posterRatingsLayout}&posterRatingsMaxPerSide=\${cfg.posterRatingsMaxPerSide}&backdropRatingsLayout=\${cfg.backdropRatingsLayout}

Omit imageText when type=logo.

Skip any params that are undefined. Keep empty ratings/posterRatings/backdropRatings/logoRatings to disable providers.`;

    navigator.clipboard.writeText(prompt);
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
    const imageTextForType = previewType === 'backdrop' ? backdropImageText : posterImageText;
    const streamBadgesForType = previewType === 'backdrop' ? backdropStreamBadges : posterStreamBadges;
    const qualityBadgesStyleForType =
      previewType === 'backdrop' ? backdropQualityBadgesStyle : posterQualityBadgesStyle;
    const query = new URLSearchParams({
      ratingStyle: ratingStyleForType,
      lang,
    });
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
    if (previewType !== 'logo' && qualityBadgesStyleForType !== DEFAULT_QUALITY_BADGES_STYLE) {
      query.set(
        previewType === 'backdrop' ? 'backdropQualityBadgesStyle' : 'posterQualityBadgesStyle',
        qualityBadgesStyleForType
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
    }

    return `${baseUrl}/${previewType}/${normalizedMediaId}.jpg?${query.toString()}`;
  }, [
    previewType,
    mediaId,
    lang,
    posterImageText,
    backdropImageText,
    posterRatingPreferences,
    backdropRatingPreferences,
    logoRatingPreferences,
    posterStreamBadges,
    backdropStreamBadges,
    posterRatingsLayout,
    posterRatingsMaxPerSide,
    backdropRatingsLayout,
    qualityBadgesSide,
    posterQualityBadgesStyle,
    backdropQualityBadgesStyle,
    posterRatingStyle,
    backdropRatingStyle,
    logoRatingStyle,
    baseUrl,
    shouldShowQualityBadgesSide,
    mdblistKey,
    tmdbKey,
  ]);

  const previewErrored = Boolean(previewUrl) && previewErroredForUrl === previewUrl;

  const configString = useMemo(() => {
    const origin = normalizeBaseUrl(baseUrl || (typeof window !== 'undefined' ? window.location.origin : ''));
    const tmdb = tmdbKey.trim();
    const mdb = mdblistKey.trim();
    if (!origin || !tmdb || !mdb) {
      return '';
    }

    const config: Record<string, string | number> = {
      baseUrl: origin,
      tmdbKey: tmdb,
      mdblistKey: mdb,
    };

    const posterRatingsQuery = stringifyRatingPreferencesAllowEmpty(posterRatingPreferences);
    const backdropRatingsQuery = stringifyRatingPreferencesAllowEmpty(backdropRatingPreferences);
    const logoRatingsQuery = stringifyRatingPreferencesAllowEmpty(logoRatingPreferences);
    const ratingsMatch =
      posterRatingsQuery === backdropRatingsQuery && posterRatingsQuery === logoRatingsQuery;
    if (ratingsMatch) {
      config.ratings = posterRatingsQuery;
    } else {
      config.posterRatings = posterRatingsQuery;
      config.backdropRatings = backdropRatingsQuery;
      config.logoRatings = logoRatingsQuery;
    }
    if (lang) {
      config.lang = lang;
    }
    if (posterStreamBadges !== 'auto') {
      config.posterStreamBadges = posterStreamBadges;
    }
    if (backdropStreamBadges !== 'auto') {
      config.backdropStreamBadges = backdropStreamBadges;
    }
    if (shouldShowPosterQualityBadgesSide && qualityBadgesSide !== 'left') {
      config.qualityBadgesSide = qualityBadgesSide;
    }
    if (posterQualityBadgesStyle !== DEFAULT_QUALITY_BADGES_STYLE) {
      config.posterQualityBadgesStyle = posterQualityBadgesStyle;
    }
    if (backdropQualityBadgesStyle !== DEFAULT_QUALITY_BADGES_STYLE) {
      config.backdropQualityBadgesStyle = backdropQualityBadgesStyle;
    }
    if (posterRatingStyle) {
      config.posterRatingStyle = posterRatingStyle;
    }
    if (backdropRatingStyle) {
      config.backdropRatingStyle = backdropRatingStyle;
    }
    if (logoRatingStyle) {
      config.logoRatingStyle = logoRatingStyle;
    }
    if (posterImageText) {
      config.posterImageText = posterImageText;
    }
    if (backdropImageText) {
      config.backdropImageText = backdropImageText;
    }
    if (posterRatingsLayout) {
      config.posterRatingsLayout = posterRatingsLayout;
    }
    if (isVerticalPosterRatingLayout(posterRatingsLayout) && posterRatingsMaxPerSide !== null) {
      config.posterRatingsMaxPerSide = posterRatingsMaxPerSide;
    }
    if (backdropRatingsLayout) {
      config.backdropRatingsLayout = backdropRatingsLayout;
    }

    return encodeBase64Url(JSON.stringify(config));
  }, [
    baseUrl,
    tmdbKey,
    mdblistKey,
    posterRatingPreferences,
    backdropRatingPreferences,
    logoRatingPreferences,
    posterStreamBadges,
    backdropStreamBadges,
    qualityBadgesSide,
    posterQualityBadgesStyle,
    backdropQualityBadgesStyle,
    lang,
    posterRatingStyle,
    backdropRatingStyle,
    logoRatingStyle,
    posterImageText,
    backdropImageText,
    posterRatingsLayout,
    posterRatingsMaxPerSide,
    backdropRatingsLayout,
    shouldShowPosterQualityBadgesSide,
  ]);

  const proxyUrl = useMemo(() => {
    const origin = normalizeBaseUrl(baseUrl || (typeof window !== 'undefined' ? window.location.origin : ''));
    if (!origin) {
      return '';
    }

    const manifestUrl = normalizeManifestUrl(proxyManifestUrl);
    const tmdb = effectiveProxyTmdbKey;
    const mdb = effectiveProxyMdblistKey;
    if (!manifestUrl || isBareHttpUrl(manifestUrl) || !tmdb || !mdb) {
      return '';
    }

    const config: Record<string, string | boolean> = {
      url: manifestUrl,
      tmdbKey: tmdb,
      mdblistKey: mdb,
    };

    const proxyPosterRatingsQuery = stringifyRatingPreferencesAllowEmpty(proxyPosterRatingPreferences);
    const proxyBackdropRatingsQuery = stringifyRatingPreferencesAllowEmpty(proxyBackdropRatingPreferences);
    const proxyLogoRatingsQuery = stringifyRatingPreferencesAllowEmpty(proxyLogoRatingPreferences);
    const proxyRatingsMatch =
      proxyPosterRatingsQuery === proxyBackdropRatingsQuery && proxyPosterRatingsQuery === proxyLogoRatingsQuery;
    if (proxyRatingsMatch) {
      config.ratings = proxyPosterRatingsQuery;
    } else {
      config.posterRatings = proxyPosterRatingsQuery;
      config.backdropRatings = proxyBackdropRatingsQuery;
      config.logoRatings = proxyLogoRatingsQuery;
    }
    if (proxyLang) {
      config.lang = proxyLang;
    }
    if (proxyPosterStreamBadges !== 'auto') {
      config.posterStreamBadges = proxyPosterStreamBadges;
    }
    if (proxyBackdropStreamBadges !== 'auto') {
      config.backdropStreamBadges = proxyBackdropStreamBadges;
    }
    if (shouldShowProxyPosterQualityBadgesSide && proxyQualityBadgesSide !== 'left') {
      config.qualityBadgesSide = proxyQualityBadgesSide;
    }
    if (proxyPosterQualityBadgesStyle !== DEFAULT_QUALITY_BADGES_STYLE) {
      config.posterQualityBadgesStyle = proxyPosterQualityBadgesStyle;
    }
    if (proxyBackdropQualityBadgesStyle !== DEFAULT_QUALITY_BADGES_STYLE) {
      config.backdropQualityBadgesStyle = proxyBackdropQualityBadgesStyle;
    }

    config.posterRatingStyle = proxyPosterRatingStyle;
    config.backdropRatingStyle = proxyBackdropRatingStyle;
    config.logoRatingStyle = proxyLogoRatingStyle;
    config.posterImageText = proxyPosterImageText;
    config.backdropImageText = proxyBackdropImageText;
    config.posterEnabled = proxyEnabledTypes.poster;
    config.backdropEnabled = proxyEnabledTypes.backdrop;
    config.logoEnabled = proxyEnabledTypes.logo;

    if (proxyPosterRatingsLayout) {
      config.posterRatingsLayout = proxyPosterRatingsLayout;
    }
    if (isVerticalPosterRatingLayout(proxyPosterRatingsLayout) && proxyPosterRatingsMaxPerSide !== null) {
      config.posterRatingsMaxPerSide = String(proxyPosterRatingsMaxPerSide);
    }
    if (proxyBackdropRatingsLayout) {
      config.backdropRatingsLayout = proxyBackdropRatingsLayout;
    }

    if (origin) {
      config.erdbBase = origin;
    }

    const encoded = encodeBase64Url(JSON.stringify(config));
    return `${origin}/proxy/${encoded}/manifest.json`;
  }, [
    proxyManifestUrl,
    effectiveProxyTmdbKey,
    effectiveProxyMdblistKey,
    proxyPosterRatingPreferences,
    proxyBackdropRatingPreferences,
    proxyLogoRatingPreferences,
    proxyLang,
    proxyPosterStreamBadges,
    proxyBackdropStreamBadges,
    proxyQualityBadgesSide,
    proxyPosterQualityBadgesStyle,
    proxyBackdropQualityBadgesStyle,
    proxyPosterRatingStyle,
    proxyBackdropRatingStyle,
    proxyLogoRatingStyle,
    proxyPosterImageText,
    proxyBackdropImageText,
    proxyPosterRatingsLayout,
    proxyPosterRatingsMaxPerSide,
    proxyBackdropRatingsLayout,
    proxyEnabledTypes,
    baseUrl,
    shouldShowProxyPosterQualityBadgesSide,
  ]);

  const updateRatingPreferencesForType = (
    type: 'poster' | 'backdrop' | 'logo',
    updater: (current: RatingPreference[]) => RatingPreference[]
  ) => {
    if (type === 'poster') {
      setPosterRatingPreferences(updater);
      return;
    }
    if (type === 'backdrop') {
      setBackdropRatingPreferences(updater);
      return;
    }
    setLogoRatingPreferences(updater);
  };

  const toggleRatingPreference = (rating: RatingPreference) => {
    updateRatingPreferencesForType(previewType, (current) =>
      current.includes(rating)
        ? current.filter((item) => item !== rating)
        : [...current, rating]
    );
  };

  const updateProxyRatingPreferencesForType = (
    type: ProxyType,
    updater: (current: RatingPreference[]) => RatingPreference[]
  ) => {
    if (type === 'poster') {
      setProxyPosterRatingPreferences(updater);
      return;
    }
    if (type === 'backdrop') {
      setProxyBackdropRatingPreferences(updater);
      return;
    }
    setProxyLogoRatingPreferences(updater);
  };

  const toggleProxyRatingPreference = (rating: RatingPreference) => {
    updateProxyRatingPreferencesForType(proxyConfigType, (current) =>
      current.includes(rating)
        ? current.filter((item) => item !== rating)
        : [...current, rating]
    );
  };

  const toggleProxyEnabledType = (type: ProxyType) => {
    setProxyEnabledTypes((current) => ({
      ...current,
      [type]: !current[type],
    }));
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

  const handleSaveApiKeyConfig = useCallback(() => {
    persistApiKeyConfig(true);
  }, [persistApiKeyConfig]);

  const handleClearApiKeyConfig = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.removeItem(API_KEY_CONFIG_STORAGE_KEY);
      setApiKeyConfigStatus('cleared');
    } catch {
      setApiKeyConfigStatus('error');
    }
  }, []);

  const handleToggleApiKeyConfigAutoSave = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const next = !apiKeyConfigAutoSave;
    setApiKeyConfigAutoSave(next);

    try {
      window.localStorage.setItem(
        API_KEY_CONFIG_SETTINGS_STORAGE_KEY,
        JSON.stringify({ autoSave: next })
      );
      if (next) {
        persistApiKeyConfig(false);
      }
    } catch {
      setApiKeyConfigStatus('error');
    }
  }, [apiKeyConfigAutoSave, persistApiKeyConfig]);

  const canGenerateConfig = Boolean(configString);
  const normalizedProxyManifestUrl = normalizeManifestUrl(proxyManifestUrl);
  const canGenerateProxy = Boolean(
    normalizedProxyManifestUrl &&
    !isBareHttpUrl(normalizedProxyManifestUrl) &&
    proxyTmdbKey.trim() &&
    proxyMdblistKey.trim()
  );
  const activeRatingStyle =
    previewType === 'poster'
      ? posterRatingStyle
      : previewType === 'backdrop'
        ? backdropRatingStyle
        : logoRatingStyle;
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
  const activeRatingPreferences =
    previewType === 'poster'
      ? posterRatingPreferences
      : previewType === 'backdrop'
        ? backdropRatingPreferences
        : logoRatingPreferences;
  const proxyProvidersLabel =
    proxyConfigType === 'poster'
      ? 'Poster Providers'
      : proxyConfigType === 'backdrop'
        ? 'Backdrop Providers'
        : 'Logo Providers';
  const proxyRatingPreferencesForType =
    proxyConfigType === 'poster'
      ? proxyPosterRatingPreferences
      : proxyConfigType === 'backdrop'
        ? proxyBackdropRatingPreferences
        : proxyLogoRatingPreferences;

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

  const setImageTextForType = (value: 'original' | 'clean' | 'alternative') => {
    if (previewType === 'backdrop') {
      setBackdropImageText(value);
      return;
    }
    setPosterImageText(value);
  };

  return (
    <div className="erdb-page min-h-screen bg-transparent text-zinc-300 selection:bg-violet-500/30">
      <nav className="erdb-chrome sticky top-0 z-50">
        <div className="erdb-nav-shell max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <BrandLockup />
            <span className="erdb-brand-tag">Stateless ratings engine</span>
          </div>
          <div className="erdb-nav-links flex flex-wrap items-center gap-2 text-sm font-medium">
            <a href="#preview" className="erdb-nav-link">Configurator</a>
            <a href="#proxy" className="erdb-nav-link">Addon Proxy</a>
            <a href="#docs" className="erdb-nav-link">API Docs</a>
            <a href={BRAND_GITHUB_URL} target="_blank" rel="noreferrer" className="erdb-nav-link">github</a>
            <SupportPill />
          </div>
        </div>
      </nav>

      <main className="erdb-main max-w-7xl mx-auto px-6 py-16 md:py-20">
        <section className="erdb-hero-section relative">
          <div className="erdb-hero-orb absolute inset-0 rounded-[3rem] pointer-events-none" />
          <div className="erdb-hero-grid">
            <div className="erdb-hero-copy">
              <p className="site-section-eyebrow font-mono">IbbyLabs image engine</p>
              <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight">
                Stunning Ratings.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-500 to-violet-600">
                  Stateless API.
                </span>
              </h1>
              <p className="erdb-hero-subtitle mt-4 text-lg text-zinc-400 leading-relaxed">
                Built by IbbyLabs for the same ecosystem as Uptime Tracker.
                Generate dynamic posters, backdrops, and logos with a cleaner config to output workflow.
              </p>
              <div className="erdb-hero-actions flex flex-wrap items-center gap-4">
                <a href="#preview" className="erdb-hero-primary">
                  Open Configurator
                </a>
                <a href="#docs" className="erdb-hero-secondary">
                  Read API Docs
                </a>
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
          <SectionHeader
            eyebrow="Configure"
            title="Build the exact output you want"
            description="The configurator is the primary workflow surface. Inputs, generated config, and live artwork preview are grouped more tightly so the path from choice to result reads faster."
          />
          <div className="erdb-surface-grid grid xl:grid-cols-[1fr_1fr] gap-8 items-start">
            <div className="space-y-3">
              <div className="erdb-panel erdb-panel-form space-y-3 rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
                <div className="erdb-panel-head">
                  <div>
                    <p className="erdb-panel-eyebrow font-mono">Inputs</p>
                    <h3 className="erdb-panel-title text-white">Configurator</h3>
                    <p className="erdb-panel-copy text-zinc-400">Adjust parameters to generate the config string and update the live preview.</p>
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
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveApiKeyConfig}
                      className="rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-200 hover:bg-zinc-800"
                    >
                      Save API key config
                    </button>
                    <button
                      type="button"
                      onClick={handleClearApiKeyConfig}
                      className="rounded-lg border border-white/10 bg-zinc-950 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300"
                    >
                      Clear saved
                    </button>
                    <label className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-950 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-300">
                      <input
                        type="checkbox"
                        checked={apiKeyConfigAutoSave}
                        onChange={handleToggleApiKeyConfigAutoSave}
                        className="h-3 w-3 accent-violet-500"
                      />
                      <span>Auto save</span>
                    </label>
                    {apiKeyConfigStatus ? (
                      <span className={`text-[10px] ${apiKeyConfigStatus === 'error' ? 'text-rose-400' : 'text-zinc-500'}`}>
                        {apiKeyConfigStatus === 'loaded'
                          ? 'Saved API config loaded.'
                          : apiKeyConfigStatus === 'saved'
                            ? 'API config saved.'
                            : apiKeyConfigStatus === 'cleared'
                              ? 'Saved API config cleared.'
                              : 'Unable to access local storage.'}
                      </span>
                    ) : null}
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
                  </div>
                </div>

                {(previewType === 'poster' || previewType === 'backdrop') && (
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
                              <input type="number" value={posterRatingsMaxPerSide ?? ''} onChange={(e) => setPosterRatingsMaxPerSide(e.target.value === '' ? null : parseInt(e.target.value))} placeholder="Auto" className="w-16 bg-black border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-violet-500/50 outline-none" />
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
                  </div>
                )}

                <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block">{providersLabel}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {VISIBLE_RATING_PROVIDER_OPTIONS.map(provider => (
                      <label key={provider.id} className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] cursor-pointer select-none transition-colors ${activeRatingPreferences.includes(provider.id as RatingPreference) ? 'border-violet-500/60 bg-zinc-800 text-white' : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'}`}>
                        <input type="checkbox" checked={activeRatingPreferences.includes(provider.id as RatingPreference)} onChange={() => toggleRatingPreference(provider.id as RatingPreference)} className="h-3 w-3 accent-violet-500" />
                        <span>{provider.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="erdb-panel erdb-panel-emphasis rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
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
                <div className="mt-3 rounded-2xl border border-white/10 bg-black/70 p-4">
                  <div className="font-mono text-xs text-zinc-300 break-all">
                    {configString || 'Add TMDB key and MDBList key to generate the config string.'}
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
                          onError={() => setPreviewErroredForUrl(previewUrl)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-zinc-500 text-center max-w-sm leading-6">
                      {previewErrored
                        ? 'Preview could not be rendered with the current media ID or settings.'
                        : tmdbKey.trim()
                          ? 'No preview available.'
                          : 'Add a TMDB key to enable live preview.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="proxy" className="erdb-section scroll-mt-24">
          <SectionHeader
            eyebrow="Proxy"
            title="Rewrite an addon manifest with the same visual system"
            description="The proxy flow now mirrors the configurator structure: setup on the left, generated output and operational notes on the right."
          />
          <div className="erdb-surface-grid grid xl:grid-cols-[1fr_1fr] gap-8 items-start">
            <div className="space-y-4">
              <div className="erdb-panel erdb-panel-form space-y-3 rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
                <div className="erdb-panel-head">
                  <div>
                    <p className="erdb-panel-eyebrow font-mono">Inputs</p>
                    <h3 className="erdb-panel-title text-white">Addon Proxy</h3>
                    <p className="erdb-panel-copy text-zinc-400">Paste a Stremio addon manifest to generate a new manifest and choose which image types to replace.</p>
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-zinc-400">ERDB parameters</div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Manifest URL</label>
                  <input
                    type="url"
                    value={proxyManifestUrl}
                    onChange={(e) => setProxyManifestUrl(normalizeManifestUrl(e.target.value, true))}
                    placeholder="https://addon.example.com/manifest.json"
                    className="w-full bg-black border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:border-violet-500/50 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">TMDB</label>
                    <input
                      type="password"
                      value={proxyTmdbKey}
                      onChange={(e) => setProxyTmdbKey(e.target.value)}
                      placeholder="v3 Key"
                      className="w-full bg-black border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:border-violet-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">MDBList</label>
                    <input
                      type="password"
                      value={proxyMdblistKey}
                      onChange={(e) => setProxyMdblistKey(e.target.value)}
                      placeholder="Key"
                      className="w-full bg-black border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:border-violet-500/50 outline-none"
                    />
                  </div>
                </div>

                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1.5">Enabled Types</span>
                    <div className="flex flex-wrap gap-1.5">
                      {PROXY_TYPES.map(type => (
                        <label key={`proxy-enabled-${type}`} className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] cursor-pointer select-none transition-colors ${proxyEnabledTypes[type] ? 'border-violet-500/60 bg-zinc-800 text-white' : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'}`}>
                          <input type="checkbox" checked={proxyEnabledTypes[type]} onChange={() => toggleProxyEnabledType(type)} className="h-3 w-3 accent-violet-500" />
                          <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-1 text-[10px] text-zinc-500">Disabled types keep the original artwork.</div>
                  </div>
                    <div className="flex flex-wrap gap-4 items-end">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Type</span>
                        <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg border border-white/10">
                          {PROXY_TYPES.map(type => (
                            <button key={`proxy-type-${type}`} onClick={() => setProxyConfigType(type)} className={`px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1 ${proxyConfigType === type ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}>
                              {type === 'poster' && <ImageIcon className="w-3.5 h-3.5" />}
                              {type === 'backdrop' && <MonitorPlay className="w-3.5 h-3.5" />}
                              {type === 'logo' && <Layers className="w-3.5 h-3.5" />}
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                      {proxyTmdbKey ? (
                        <div className="w-32">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 flex items-center gap-1 mb-1"><Globe2 className="w-3 h-3" /> Lang</span>
                          <div className="relative">
                            <select value={proxyLang} onChange={(e) => setProxyLang(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white appearance-none outline-none focus:border-violet-500/50">
                              {supportedLanguages.map(l => <option key={`proxy-lang-${l.code}`} value={l.code} className="bg-zinc-900">{l.flag} {l.code}</option>)}
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

                    <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-3">
                      {proxyConfigType === 'poster' && (
                        <div className="flex flex-wrap gap-4 items-center">
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Poster Ratings Style</span>
                            <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg border border-white/10">
                              {RATING_STYLE_OPTIONS.map(opt => (
                                <button key={`proxy-poster-style-${opt.id}`} onClick={() => setProxyPosterRatingStyle(opt.id as RatingStyle)} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${proxyPosterRatingStyle === opt.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}>{opt.label}</button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Poster Text</span>
                            <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg border border-white/10">
                              {(['original', 'clean', 'alternative'] as const).map(option => (
                                <button key={`proxy-poster-text-${option}`} onClick={() => setProxyPosterImageText(option)} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${proxyPosterImageText === option ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}>{option.charAt(0).toUpperCase() + option.slice(1)}</button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {proxyConfigType === 'backdrop' && (
                        <div className="flex flex-wrap gap-4 items-center">
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Backdrop Ratings Style</span>
                            <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg border border-white/10">
                              {RATING_STYLE_OPTIONS.map(opt => (
                                <button key={`proxy-backdrop-style-${opt.id}`} onClick={() => setProxyBackdropRatingStyle(opt.id as RatingStyle)} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${proxyBackdropRatingStyle === opt.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}>{opt.label}</button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Backdrop Text</span>
                            <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg border border-white/10">
                              {(['original', 'clean', 'alternative'] as const).map(option => (
                                <button key={`proxy-backdrop-text-${option}`} onClick={() => setProxyBackdropImageText(option)} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${proxyBackdropImageText === option ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}>{option.charAt(0).toUpperCase() + option.slice(1)}</button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {proxyConfigType === 'logo' && (
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Logo Ratings Style</span>
                          <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg border border-white/10">
                            {RATING_STYLE_OPTIONS.map(opt => (
                              <button key={`proxy-logo-style-${opt.id}`} onClick={() => setProxyLogoRatingStyle(opt.id as RatingStyle)} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${proxyLogoRatingStyle === opt.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}>{opt.label}</button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {(proxyConfigType === 'poster' || proxyConfigType === 'backdrop') && (
                      <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block">Layouts</span>
                        {proxyConfigType === 'poster' && (
                          <div className="flex flex-wrap gap-4 items-end">
                            <div>
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Poster Layout</span>
                              <div className="flex flex-wrap gap-1">
                                {POSTER_RATING_LAYOUT_OPTIONS.map(opt => (
                                  <button key={`proxy-poster-layout-${opt.id}`} onClick={() => setProxyPosterRatingsLayout(opt.id as PosterRatingLayout)} className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors ${proxyPosterRatingsLayout === opt.id ? 'border-violet-500/60 bg-zinc-800 text-white' : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'}`}>{opt.label}</button>
                                ))}
                              </div>
                            </div>
                            {isVerticalPosterRatingLayout(proxyPosterRatingsLayout) && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Max/side</span>
                                <input type="number" value={proxyPosterRatingsMaxPerSide ?? ''} onChange={(e) => setProxyPosterRatingsMaxPerSide(e.target.value === '' ? null : parseInt(e.target.value))} placeholder="Auto" className="w-16 bg-black border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-violet-500/50 outline-none" />
                                <button onClick={() => setProxyPosterRatingsMaxPerSide(null)} className="rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-[11px] text-zinc-300 hover:bg-zinc-800">Auto</button>
                              </div>
                            )}
                          </div>
                        )}

                        {proxyConfigType === 'backdrop' && (
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Backdrop Layout</span>
                            <div className="flex flex-wrap gap-1">
                              {BACKDROP_RATING_LAYOUT_OPTIONS.map(opt => (
                                <button key={`proxy-backdrop-layout-${opt.id}`} onClick={() => setProxyBackdropRatingsLayout(opt.id as BackdropRatingLayout)} className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors ${proxyBackdropRatingsLayout === opt.id ? 'border-violet-500/60 bg-zinc-800 text-white' : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'}`}>{opt.label}</button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {proxyConfigType !== 'logo' && (
                      <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block">
                          Quality Badges · {proxyQualityBadgeTypeLabel}
                        </span>
                        <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg border border-white/10">
                          {STREAM_BADGE_OPTIONS.map(option => (
                            <button key={`proxy-stream-${option.id}`} onClick={() => setProxyStreamBadgesForType(option.id)} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${proxyStreamBadgesForType === option.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}>
                              {option.label}
                            </button>
                          ))}
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Quality Badge Style</span>
                          <div className="flex flex-wrap gap-1">
                            {RATING_STYLE_OPTIONS.map(option => (
                              <button key={`proxy-quality-style-${option.id}`} onClick={() => setProxyQualityBadgesStyleForType(option.id)} className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors ${proxyQualityBadgesStyleForType === option.id ? 'border-violet-500/60 bg-zinc-800 text-white' : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'}`}>
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        {shouldShowProxyQualityBadgesSide && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Side</span>
                            <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg border border-white/10">
                              {QUALITY_BADGE_SIDE_OPTIONS.map(option => (
                                <button key={`proxy-quality-side-${option.id}`} onClick={() => setProxyQualityBadgesSide(option.id)} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${proxyQualityBadgesSide === option.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}>
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block">{proxyProvidersLabel}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {VISIBLE_RATING_PROVIDER_OPTIONS.map(provider => (
                          <label key={`proxy-${provider.id}`} className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] cursor-pointer select-none transition-colors ${proxyRatingPreferencesForType.includes(provider.id as RatingPreference) ? 'border-violet-500/60 bg-zinc-800 text-white' : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'}`}>
                            <input type="checkbox" checked={proxyRatingPreferencesForType.includes(provider.id as RatingPreference)} onChange={() => toggleProxyRatingPreference(provider.id as RatingPreference)} className="h-3 w-3 accent-violet-500" />
                            <span>{provider.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="erdb-panel erdb-panel-emphasis rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
                <div className="erdb-panel-head">
                  <div>
                    <p className="erdb-panel-eyebrow font-mono">Export</p>
                    <h3 className="text-xl font-semibold text-white">Generated Manifest</h3>
                    <p className="mt-2 text-sm text-zinc-400">
                      Use this URL in Stremio. It ends with manifest.json and has no query params.
                    </p>
                  </div>
                </div>
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/70 p-4">
                  <div className="font-mono text-xs text-zinc-300 break-all">
                    {proxyUrl || `${baseUrl || 'https://erdb.example.com'}/proxy/{config}/manifest.json`}
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

              <div className="erdb-panel erdb-panel-note rounded-2xl border border-white/10 bg-black/60 p-4 text-xs text-zinc-500">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <Zap className="w-4 h-4 text-violet-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-zinc-200 font-semibold">Replace enabled types</div>
                    <div>Proxy rewrites enabled `meta.poster`, `meta.background`, `meta.logo` for both `catalog` and `meta` responses.</div>
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
                        <td className="px-5 py-2 text-zinc-500 text-xs">—</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">id <span className="text-zinc-500">(path)</span></td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">IMDb, TMDB, Kitsu, etc.</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">—</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">ratings</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">tmdb, mdblist, imdb, tomatoes, letterboxd, metacritic, trakt, myanimelist, anilist, kitsu (global fallback)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">all</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">posterRatings</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">tmdb, mdblist, imdb, tomatoes, letterboxd, metacritic, trakt, myanimelist, anilist, kitsu (poster only)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">all</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">backdropRatings</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">tmdb, mdblist, imdb, tomatoes, letterboxd, metacritic, trakt, myanimelist, anilist, kitsu (backdrop only)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">all</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">logoRatings</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">tmdb, mdblist, imdb, tomatoes, letterboxd, metacritic, trakt, myanimelist, anilist, kitsu (logo only)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">all</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">lang</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">{SUPPORTED_LANGUAGES.map(l => l.code).join(', ')}</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">en</td>
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
                        <td className="px-5 py-2 text-zinc-400 text-xs">left, right (poster only)</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">left</td>
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
                        <td className="px-5 py-2 text-zinc-400 text-xs">top, bottom, left, right, top-bottom, left-right</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">top-bottom</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">posterRatingsMaxPerSide</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">1-20</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">auto</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">backdropRatingsLayout</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">center, right, right-vertical</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">center</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">tmdbKey <span className="font-bold">(req)</span></td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">TMDB v3 API Key</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">—</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">mdblistKey <span className="font-bold">(req)</span></td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">MDBList.com API Key</td>
                        <td className="px-5 py-2 text-zinc-500 text-xs">—</td>
                      </tr>
                    </tbody>
                  </table>
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
                            <div>posterRatingsLayout</div>
                            <div>posterRatingsMaxPerSide</div>
                          </div>
                        </td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">
                          <div className="space-y-1">
                            <div>original, clean, alternative</div>
                            <div>top, bottom, left, right, top-bottom, left-right</div>
                            <div>1-20 (auto if omitted)</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">backdrop</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">
                          <div className="space-y-1">
                            <div>imageText</div>
                            <div>backdropRatingsLayout</div>
                          </div>
                        </td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">
                          <div className="space-y-1">
                            <div>original, clean, alternative</div>
                            <div>center, right, right-vertical</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-violet-400 text-xs">logo</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">none (base params only)</td>
                        <td className="px-5 py-2 text-zinc-400 text-xs">—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="px-5 pb-5 pt-3 text-[11px] text-zinc-500">
                  Base params for all types: ratings (global fallback), lang, ratingStyle, tmdbKey, mdblistKey. Use posterRatings/backdropRatings/logoRatings to override per type.
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
                  <div className="p-4 bg-zinc-900/60 border border-white/5 rounded-xl font-mono text-xs overflow-x-auto whitespace-nowrap pb-2">
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
                      <span className="text-zinc-400">All TMDB ISO 639-1 codes are supported (en, it, fr, es, de, etc.). Default: en.</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-violet-500 font-bold shrink-0">id (required):</span>
                      <span className="text-zinc-400">IMDb ID (tt...), TMDB ID (tmdb:...), or Kitsu ID (kitsu:...).</span>
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
                    <div className="whitespace-pre-wrap">{`Act as an expert addon developer. I want to implement the ERDB Stateless API into my media center addon.

--- CONFIG INPUT ---
Add a single text field called "erdbConfig" (base64url). The user will paste it from the ERDB site after configuring there.
Do NOT hardcode API keys or base URL. Always use cfg.baseUrl from erdbConfig.

--- DECODE ---
Node/JS: const cfg = JSON.parse(Buffer.from(erdbConfig, 'base64url').toString('utf8'));

--- FULL API REFERENCE ---
Endpoint: GET /{type}/{id}.jpg?...queryParams

Parameter               | Values                                                              | Default
type (path)             | poster, backdrop, logo                                               | -
id (path)               | IMDb (tt...), TMDB (tmdb:id / tmdb:movie:id / tmdb:tv:id), Kitsu (kitsu:id), AniList, MAL          | -
ratings                 | tmdb, mdblist, imdb, tomatoes, tomatoesaudience, letterboxd,         | all
                        | metacritic, metacriticuser, trakt, rogerebert, myanimelist,          |
                        | anilist, kitsu (global fallback)                                     |
posterRatings           | tmdb, mdblist, imdb, tomatoes, tomatoesaudience, letterboxd,         | all
                        | metacritic, metacriticuser, trakt, rogerebert, myanimelist,          |
                        | anilist, kitsu (poster only)                                         |
backdropRatings         | tmdb, mdblist, imdb, tomatoes, tomatoesaudience, letterboxd,         | all
                        | metacritic, metacriticuser, trakt, rogerebert, myanimelist,          |
                        | anilist, kitsu (backdrop only)                                       |
logoRatings             | tmdb, mdblist, imdb, tomatoes, tomatoesaudience, letterboxd,         | all
                        | metacritic, metacriticuser, trakt, rogerebert, myanimelist,          |
                        | anilist, kitsu (logo only)                                           |
lang                    | Any TMDB ISO 639-1 code (en, it, fr, es, de, ja, ko, etc.)            | en
streamBadges            | auto, on, off (global fallback)                                      | auto
posterStreamBadges      | auto, on, off (poster only)                                          | auto
backdropStreamBadges    | auto, on, off (backdrop only)                                        | auto
qualityBadgesSide       | left, right (poster only)                                            | left
qualityBadgesStyle      | glass, square, plain (global fallback)                               | glass
posterQualityBadgesStyle| glass, square, plain (poster only)                                   | glass
backdropQualityBadgesStyle| glass, square, plain (backdrop only)                               | glass
ratingStyle             | glass, square, plain                                                 | glass
imageText               | original, clean, alternative                                         | original
posterRatingsLayout     | top, bottom, left, right, top-bottom, left-right                     | top-bottom
posterRatingsMaxPerSide | Number (1-20)                                                        | auto
backdropRatingsLayout   | center, right, right-vertical                                        | center
tmdbKey (REQUIRED)      | Your TMDB v3 API Key                                                 | -
mdblistKey (REQUIRED)   | Your MDBList.com API Key                                             | -

TMDB NOTE: Always prefer tmdb:movie:id or tmdb:tv:id. Using bare tmdb:id can collide between movie and tv.

--- INTEGRATION REQUIREMENTS ---
1. Use ONLY the "erdbConfig" field (no modal and no extra settings panels).
2. Add toggles to enable/disable: poster, backdrop, logo.
3. If a type is disabled, keep the original artwork (do not call ERDB for that type).
4. Build ERDB URLs using the decoded config and inject them into both catalog and meta responses.

--- PER-TYPE SETTINGS ---
poster   -> ratingStyle = cfg.posterRatingStyle, imageText = cfg.posterImageText
backdrop -> ratingStyle = cfg.backdropRatingStyle, imageText = cfg.backdropImageText
logo     -> ratingStyle = cfg.logoRatingStyle (omit imageText)
Ratings providers can be set per-type via cfg.posterRatings / cfg.backdropRatings / cfg.logoRatings (fallback to cfg.ratings).
Quality badges style can be set per-type via cfg.posterQualityBadgesStyle / cfg.backdropQualityBadgesStyle (fallback to cfg.qualityBadgesStyle).

--- URL BUILD ---
const typeRatingStyle = type === 'poster' ? cfg.posterRatingStyle : type === 'backdrop' ? cfg.backdropRatingStyle : cfg.logoRatingStyle;
const typeImageText = type === 'backdrop' ? cfg.backdropImageText : cfg.posterImageText;
\${cfg.baseUrl}/\${type}/\${id}.jpg?tmdbKey=\${cfg.tmdbKey}&mdblistKey=\${cfg.mdblistKey}&ratings=\${cfg.ratings}&posterRatings=\${cfg.posterRatings}&backdropRatings=\${cfg.backdropRatings}&logoRatings=\${cfg.logoRatings}&lang=\${cfg.lang}&streamBadges=\${cfg.streamBadges}&posterStreamBadges=\${cfg.posterStreamBadges}&backdropStreamBadges=\${cfg.backdropStreamBadges}&qualityBadgesSide=\${cfg.qualityBadgesSide}&qualityBadgesStyle=\${cfg.qualityBadgesStyle}&posterQualityBadgesStyle=\${cfg.posterQualityBadgesStyle}&backdropQualityBadgesStyle=\${cfg.backdropQualityBadgesStyle}&ratingStyle=\${typeRatingStyle}&imageText=\${typeImageText}&posterRatingsLayout=\${cfg.posterRatingsLayout}&posterRatingsMaxPerSide=\${cfg.posterRatingsMaxPerSide}&backdropRatingsLayout=\${cfg.backdropRatingsLayout}

Omit imageText when type=logo.

Skip any params that are undefined. Keep empty ratings/posterRatings/backdropRatings/logoRatings to disable providers.`}</div>
                </div>

                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Live Examples</h4>
                <pre className="text-xs font-mono text-zinc-400 leading-6 space-y-1.5">
                  <div className="text-zinc-600 font-bold">Movie Poster (IMDb)</div>
                  <div className="text-violet-200/70 truncate bg-white/5 p-3 rounded-lg border border-white/5">{`${baseUrl || 'http://localhost:3000'}/poster/tt0133093.jpg?ratings=imdb,tmdb&ratingStyle=plain`}</div>

                  <div className="text-zinc-600 font-bold mt-4">Backdrop (TMDB)</div>
                  <div className="text-violet-200/70 truncate bg-white/5 p-3 rounded-lg border border-white/5">{`${baseUrl || 'http://localhost:3000'}/backdrop/tmdb:603.jpg?ratings=mdblist&backdropRatingsLayout=right-vertical`}</div>

                </pre>
              </div>
            </div>
          </div>
        </div>
        </section>
      </main>

      <footer className="erdb-footer py-8">
        <div className="max-w-7xl mx-auto px-6 space-y-4">
          <div className="site-page-footer-top">
            <BrandLockup compact />
            <SupportPill />
          </div>
          <div className="site-page-footer-links">
            <a href="#preview" className="erdb-footer-link">Configurator</a>
            <a href="#proxy" className="erdb-footer-link">Addon Proxy</a>
            <a href="#docs" className="erdb-footer-link">API Docs</a>
            <a href={BRAND_GITHUB_URL} target="_blank" rel="noreferrer" className="erdb-footer-link">github</a>
          </div>
          <div className="site-page-credit">
            <Image src="/favicon.png" alt="" aria-hidden="true" width={20} height={20} />
            <span>Forked by IbbyLabs</span>
          </div>
          <p className="text-sm text-zinc-500 text-center md:text-left">
            © 2026 ERDB Project. Consistent chrome, same lab.
          </p>
        </div>
      </footer>
    </div>
  );
}


























