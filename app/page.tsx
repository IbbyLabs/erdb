'use client';

import { HomePageView, type HomePageViewProps } from '@/components/home-page-view';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
} from 'react';
import {
  RATING_PROVIDER_OPTIONS,
  parseRatingPreferencesAllowEmpty,
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
  { code: 'en', label: 'English', flag: '\uD83C\uDDFA\uD83C\uDDF8' },
  { code: 'it', label: 'Italiano', flag: '\uD83C\uDDEE\uD83C\uDDF9' },
  { code: 'es', label: 'Espa\u00f1ol', flag: '\uD83C\uDDEA\uD83C\uDDF8' },
  { code: 'fr', label: 'Fran\u00e7ais', flag: '\uD83C\uDDEB\uD83C\uDDF7' },
  { code: 'de', label: 'Deutsch', flag: '\uD83C\uDDE9\uD83C\uDDEA' },
  { code: 'pt', label: 'Portugu\u00eas', flag: '\uD83C\uDDF5\uD83C\uDDF9' },
  { code: 'ru', label: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439', flag: '\uD83C\uDDF7\uD83C\uDDFA' },
  { code: 'ja', label: '\u65e5\u672c\u8a9e', flag: '\uD83C\uDDEF\uD83C\uDDF5' },
  { code: 'zh', label: '\u4e2d\u6587', flag: '\uD83C\uDDE8\uD83C\uDDF3' },
  { code: 'tr', label: 'T\u00fcrk\u00e7e', flag: '\uD83C\uDDF9\uD83C\uDDF7' },
];
const VISIBLE_RATING_PROVIDER_OPTIONS = RATING_PROVIDER_OPTIONS;
const DEFAULT_RATING_PREFERENCES: RatingPreference[] = ['imdb', 'tmdb', 'mdblist'];
const PROXY_TYPES = ['poster', 'backdrop', 'logo'] as const;
type ProxyType = (typeof PROXY_TYPES)[number];
type ProxyEnabledTypes = Record<ProxyType, boolean>;
type StreamBadgesSetting = 'auto' | 'on' | 'off';
type QualityBadgesSide = 'left' | 'right';
type PosterQualityBadgesPosition = 'auto' | QualityBadgesSide;
const DEFAULT_QUALITY_BADGES_STYLE: RatingStyle = 'glass';
const STREAM_BADGE_OPTIONS: Array<{ id: StreamBadgesSetting; label: string }> = [
  { id: 'auto', label: 'Auto' },
  { id: 'on', label: 'On' },
  { id: 'off', label: 'Off' },
];
const QUALITY_BADGE_SIDE_OPTIONS: Array<{ id: QualityBadgesSide; label: string }> = [
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
];
const POSTER_QUALITY_BADGE_POSITION_OPTIONS: Array<{
  id: PosterQualityBadgesPosition;
  label: string;
}> = [
  { id: 'auto', label: 'Auto' },
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
];
const TMDB_KEY_STORAGE_KEY = 'erdb_tmdb_key';
const MDBLIST_KEY_STORAGE_KEY = 'erdb_mdblist_key';
const EXPORT_CONFIG_VERSION = 1;
const RATING_PROVIDER_IDS = new Set(RATING_PROVIDER_OPTIONS.map((option) => option.id));
const isRatingProviderId = (value: string): value is RatingPreference =>
  RATING_PROVIDER_IDS.has(value as RatingPreference);

const isProxyType = (value: unknown): value is ProxyType =>
  PROXY_TYPES.includes(value as ProxyType);
const isStreamBadgesSetting = (value: unknown): value is StreamBadgesSetting =>
  value === 'auto' || value === 'on' || value === 'off';
const isQualityBadgesSide = (value: unknown): value is QualityBadgesSide =>
  value === 'left' || value === 'right';
const isPosterQualityBadgesPosition = (value: unknown): value is PosterQualityBadgesPosition =>
  value === 'auto' || value === 'left' || value === 'right';
const isImageText = (value: unknown): value is 'original' | 'clean' | 'alternative' =>
  value === 'original' || value === 'clean' || value === 'alternative';
const isRatingStyle = (value: unknown): value is RatingStyle =>
  RATING_STYLE_OPTIONS.some((option) => option.id === value);
const isPosterRatingLayout = (value: unknown): value is PosterRatingLayout =>
  POSTER_RATING_LAYOUT_OPTIONS.some((option) => option.id === value);
const isBackdropRatingLayout = (value: unknown): value is BackdropRatingLayout =>
  BACKDROP_RATING_LAYOUT_OPTIONS.some((option) => option.id === value);

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

const safeLocalStorageGet = (key: string) => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeLocalStorageSet = (key: string, value: string) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore storage failures (private mode, quota, etc.)
  }
};

const safeLocalStorageRemove = (key: string) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore storage failures
  }
};

const subscribeToNothing = () => () => {};

const useClientOrigin = () =>
  useSyncExternalStore(
    subscribeToNothing,
    () => window.location.origin,
    () => ''
  );

const encodeBase64Url = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const downloadJsonFile = (payload: Record<string, unknown>, filename: string) => {
  if (typeof window === 'undefined') return;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const maskSensitiveText = (value: string) => value.replace(/[^\s]/g, '*');

export default function Home() {
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
  const [posterQualityBadgesPosition, setPosterQualityBadgesPosition] =
    useState<PosterQualityBadgesPosition>('auto');
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
  const [proxyEnabledTypes, setProxyEnabledTypes] = useState<ProxyEnabledTypes>({
    poster: true,
    backdrop: true,
    logo: true,
  });
  const [proxyTranslateMeta, setProxyTranslateMeta] = useState(false);
  const [proxyCopied, setProxyCopied] = useState(false);
  const [configCopied, setConfigCopied] = useState(false);
  const [showConfigString, setShowConfigString] = useState(false);
  const [showProxyUrl, setShowProxyUrl] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'with' | 'without'>('idle');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const navRef = useRef<HTMLElement | null>(null);
  const baseUrl = normalizeBaseUrl(useClientOrigin());

  const [copied, setCopied] = useState(false);
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedTmdbKey = safeLocalStorageGet(TMDB_KEY_STORAGE_KEY);
    const storedMdblistKey = safeLocalStorageGet(MDBLIST_KEY_STORAGE_KEY);
    if (!storedTmdbKey && !storedMdblistKey) {
      return;
    }
    const frameId = window.requestAnimationFrame(() => {
      if (storedTmdbKey) {
        setTmdbKey(storedTmdbKey);
      }
      if (storedMdblistKey) {
        setMdblistKey(storedMdblistKey);
      }
    });
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (tmdbKey) {
      safeLocalStorageSet(TMDB_KEY_STORAGE_KEY, tmdbKey);
    } else {
      safeLocalStorageRemove(TMDB_KEY_STORAGE_KEY);
    }
  }, [tmdbKey]);

  useEffect(() => {
    if (mdblistKey) {
      safeLocalStorageSet(MDBLIST_KEY_STORAGE_KEY, mdblistKey);
    } else {
      safeLocalStorageRemove(MDBLIST_KEY_STORAGE_KEY);
    }
  }, [mdblistKey]);

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
    (event: React.MouseEvent<HTMLAnchorElement>) => {
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
    if (typeof window === 'undefined') return;
    const handleHashChange = () => scrollToHash(window.location.hash);
    if (window.location.hash) {
      requestAnimationFrame(() => scrollToHash(window.location.hash, 'auto'));
    }
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [scrollToHash]);

  useEffect(() => {
    if (tmdbKey && tmdbKey.length > 10) {
      fetch(`https://api.themoviedb.org/3/configuration/languages?api_key=${tmdbKey}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const formatted = data.map((l: any) => ({
              code: l.iso_639_1,
              label: l.english_name || l.name,
              flag: '\uD83C\uDF10'
            })).sort((a, b) => a.label.localeCompare(b.label));
            setSupportedLanguages(formatted);
          }
        })
        .catch(() => { });
    }
  }, [tmdbKey]);

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
qualityBadgesSide       | left, right (poster top-bottom only)                                 | left
posterQualityBadgesPosition | auto, left, right (poster top/bottom only)                       | auto
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
\${cfg.baseUrl}/\${type}/\${id}.jpg?tmdbKey=\${cfg.tmdbKey}&mdblistKey=\${cfg.mdblistKey}&ratings=\${cfg.ratings}&posterRatings=\${cfg.posterRatings}&backdropRatings=\${cfg.backdropRatings}&logoRatings=\${cfg.logoRatings}&lang=\${cfg.lang}&streamBadges=\${cfg.streamBadges}&posterStreamBadges=\${cfg.posterStreamBadges}&backdropStreamBadges=\${cfg.backdropStreamBadges}&qualityBadgesSide=\${cfg.qualityBadgesSide}&posterQualityBadgesPosition=\${cfg.posterQualityBadgesPosition}&qualityBadgesStyle=\${cfg.qualityBadgesStyle}&posterQualityBadgesStyle=\${cfg.posterQualityBadgesStyle}&backdropQualityBadgesStyle=\${cfg.backdropQualityBadgesStyle}&ratingStyle=\${typeRatingStyle}&imageText=\${typeImageText}&posterRatingsLayout=\${cfg.posterRatingsLayout}&posterRatingsMaxPerSide=\${cfg.posterRatingsMaxPerSide}&backdropRatingsLayout=\${cfg.backdropRatingsLayout}

Omit imageText when type=logo.

Skip any params that are undefined. Keep empty ratings/posterRatings/backdropRatings/logoRatings to disable providers.`;

    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const previewUrl = useMemo(() => {
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
    if (shouldShowQualityBadgesPosition && posterQualityBadgesPosition !== 'auto') {
      query.set('posterQualityBadgesPosition', posterQualityBadgesPosition);
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
    if (tmdbKey) {
      query.set('tmdbKey', tmdbKey);
    }

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

    if (!baseUrl) {
      return '';
    }
    return `${baseUrl}/${previewType}/${mediaId}.jpg?${query.toString()}`;
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
    shouldShowQualityBadgesSide,
    shouldShowQualityBadgesPosition,
    posterRatingsLayout,
    posterRatingsMaxPerSide,
    backdropRatingsLayout,
    qualityBadgesSide,
    posterQualityBadgesPosition,
    posterQualityBadgesStyle,
    backdropQualityBadgesStyle,
    posterRatingStyle,
    backdropRatingStyle,
    logoRatingStyle,
    baseUrl,
    mdblistKey,
    tmdbKey,
  ]);

  const configString = useMemo(() => {
    const tmdb = tmdbKey.trim();
    const mdb = mdblistKey.trim();
    if (!baseUrl || !tmdb || !mdb) {
      return '';
    }

    const config: Record<string, string | number> = {
      baseUrl,
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
    if (shouldShowPosterQualityBadgesPosition && posterQualityBadgesPosition !== 'auto') {
      config.posterQualityBadgesPosition = posterQualityBadgesPosition;
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
    shouldShowPosterQualityBadgesSide,
    shouldShowPosterQualityBadgesPosition,
    qualityBadgesSide,
    posterQualityBadgesPosition,
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
  ]);

  const proxyUrl = useMemo(() => {
    if (!baseUrl) {
      return '';
    }
    const manifestUrl = normalizeManifestUrl(proxyManifestUrl);
    const tmdb = tmdbKey.trim();
    const mdb = mdblistKey.trim();
    if (!manifestUrl || isBareHttpUrl(manifestUrl) || !tmdb || !mdb) {
      return '';
    }

    const config: Record<string, string | boolean> = {
      url: manifestUrl,
      tmdbKey: tmdb,
      mdblistKey: mdb,
    };

    const proxyPosterRatingsQuery = stringifyRatingPreferencesAllowEmpty(posterRatingPreferences);
    const proxyBackdropRatingsQuery = stringifyRatingPreferencesAllowEmpty(backdropRatingPreferences);
    const proxyLogoRatingsQuery = stringifyRatingPreferencesAllowEmpty(logoRatingPreferences);
    const proxyRatingsMatch =
      proxyPosterRatingsQuery === proxyBackdropRatingsQuery && proxyPosterRatingsQuery === proxyLogoRatingsQuery;
    if (proxyRatingsMatch) {
      config.ratings = proxyPosterRatingsQuery;
    } else {
      config.posterRatings = proxyPosterRatingsQuery;
      config.backdropRatings = proxyBackdropRatingsQuery;
      config.logoRatings = proxyLogoRatingsQuery;
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
    if (shouldShowPosterQualityBadgesPosition && posterQualityBadgesPosition !== 'auto') {
      config.posterQualityBadgesPosition = posterQualityBadgesPosition;
    }
    if (posterQualityBadgesStyle !== DEFAULT_QUALITY_BADGES_STYLE) {
      config.posterQualityBadgesStyle = posterQualityBadgesStyle;
    }
    if (backdropQualityBadgesStyle !== DEFAULT_QUALITY_BADGES_STYLE) {
      config.backdropQualityBadgesStyle = backdropQualityBadgesStyle;
    }

    config.posterRatingStyle = posterRatingStyle;
    config.backdropRatingStyle = backdropRatingStyle;
    config.logoRatingStyle = logoRatingStyle;
    config.posterImageText = posterImageText;
    config.backdropImageText = backdropImageText;
    config.posterEnabled = proxyEnabledTypes.poster;
    config.backdropEnabled = proxyEnabledTypes.backdrop;
    config.logoEnabled = proxyEnabledTypes.logo;
    if (proxyTranslateMeta) {
      config.translateMeta = true;
    }

    if (posterRatingsLayout) {
      config.posterRatingsLayout = posterRatingsLayout;
    }
    if (isVerticalPosterRatingLayout(posterRatingsLayout) && posterRatingsMaxPerSide !== null) {
      config.posterRatingsMaxPerSide = String(posterRatingsMaxPerSide);
    }
    if (backdropRatingsLayout) {
      config.backdropRatingsLayout = backdropRatingsLayout;
    }

    config.erdbBase = baseUrl;
    const encoded = encodeBase64Url(JSON.stringify(config));
    return `${baseUrl}/proxy/${encoded}/manifest.json`;
  }, [
    proxyManifestUrl,
    tmdbKey,
    mdblistKey,
    posterRatingPreferences,
    backdropRatingPreferences,
    logoRatingPreferences,
    lang,
    posterStreamBadges,
    backdropStreamBadges,
    shouldShowPosterQualityBadgesSide,
    shouldShowPosterQualityBadgesPosition,
    qualityBadgesSide,
    posterQualityBadgesPosition,
    posterQualityBadgesStyle,
    backdropQualityBadgesStyle,
    posterRatingStyle,
    backdropRatingStyle,
    logoRatingStyle,
    posterImageText,
    backdropImageText,
    posterRatingsLayout,
    posterRatingsMaxPerSide,
    backdropRatingsLayout,
    proxyEnabledTypes,
    proxyTranslateMeta,
    baseUrl,
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

  const handleExportConfig = (includeKeys: boolean) => {
    const payload: Record<string, unknown> = {
      version: EXPORT_CONFIG_VERSION,
      createdAt: new Date().toISOString(),
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
      qualityBadgesSide,
      posterQualityBadgesPosition,
      posterQualityBadgesStyle,
      backdropQualityBadgesStyle,
      posterRatingStyle,
      backdropRatingStyle,
      logoRatingStyle,
      posterRatingsLayout,
      posterRatingsMaxPerSide,
      backdropRatingsLayout,
      proxyManifestUrl,
      proxyEnabledTypes,
      translateMeta: proxyTranslateMeta,
    };

    if (includeKeys) {
      payload.tmdbKey = tmdbKey;
      payload.mdblistKey = mdblistKey;
    }

    const filename = includeKeys ? 'erdb-config-with-keys.json' : 'erdb-config.json';
    downloadJsonFile(payload, filename);
    setExportStatus(includeKeys ? 'with' : 'without');
    setTimeout(() => setExportStatus('idle'), 2000);
  };

  const applyImportedConfig = (payload: Record<string, unknown>) => {
    if (typeof payload.tmdbKey === 'string') {
      setTmdbKey(payload.tmdbKey);
    }
    if (typeof payload.mdblistKey === 'string') {
      setMdblistKey(payload.mdblistKey);
    }
    if (typeof payload.mediaId === 'string') {
      setMediaId(payload.mediaId);
    }
    if (typeof payload.lang === 'string') {
      setLang(payload.lang);
    }
    if (typeof payload.previewType === 'string' && isProxyType(payload.previewType)) {
      setPreviewType(payload.previewType);
    }
    if (typeof payload.posterImageText === 'string' && isImageText(payload.posterImageText)) {
      setPosterImageText(payload.posterImageText);
    }
    if (typeof payload.backdropImageText === 'string' && isImageText(payload.backdropImageText)) {
      setBackdropImageText(payload.backdropImageText);
    }
    if (typeof payload.posterStreamBadges === 'string' && isStreamBadgesSetting(payload.posterStreamBadges)) {
      setPosterStreamBadges(payload.posterStreamBadges);
    }
    if (typeof payload.backdropStreamBadges === 'string' && isStreamBadgesSetting(payload.backdropStreamBadges)) {
      setBackdropStreamBadges(payload.backdropStreamBadges);
    }
    if (typeof payload.qualityBadgesSide === 'string' && isQualityBadgesSide(payload.qualityBadgesSide)) {
      setQualityBadgesSide(payload.qualityBadgesSide);
    }
    if (
      typeof payload.posterQualityBadgesPosition === 'string' &&
      isPosterQualityBadgesPosition(payload.posterQualityBadgesPosition)
    ) {
      setPosterQualityBadgesPosition(payload.posterQualityBadgesPosition);
    }
    if (typeof payload.posterQualityBadgesStyle === 'string' && isRatingStyle(payload.posterQualityBadgesStyle)) {
      setPosterQualityBadgesStyle(payload.posterQualityBadgesStyle);
    }
    if (typeof payload.backdropQualityBadgesStyle === 'string' && isRatingStyle(payload.backdropQualityBadgesStyle)) {
      setBackdropQualityBadgesStyle(payload.backdropQualityBadgesStyle);
    }
    if (typeof payload.posterRatingStyle === 'string' && isRatingStyle(payload.posterRatingStyle)) {
      setPosterRatingStyle(payload.posterRatingStyle);
    }
    if (typeof payload.backdropRatingStyle === 'string' && isRatingStyle(payload.backdropRatingStyle)) {
      setBackdropRatingStyle(payload.backdropRatingStyle);
    }
    if (typeof payload.logoRatingStyle === 'string' && isRatingStyle(payload.logoRatingStyle)) {
      setLogoRatingStyle(payload.logoRatingStyle);
    }
    if (typeof payload.posterRatingsLayout === 'string' && isPosterRatingLayout(payload.posterRatingsLayout)) {
      setPosterRatingsLayout(payload.posterRatingsLayout);
    }
    if (typeof payload.backdropRatingsLayout === 'string' && isBackdropRatingLayout(payload.backdropRatingsLayout)) {
      setBackdropRatingsLayout(payload.backdropRatingsLayout);
    }

    if (payload.posterRatingsMaxPerSide === null) {
      setPosterRatingsMaxPerSide(null);
    } else if (typeof payload.posterRatingsMaxPerSide === 'number' || typeof payload.posterRatingsMaxPerSide === 'string') {
      const parsed = typeof payload.posterRatingsMaxPerSide === 'number'
        ? payload.posterRatingsMaxPerSide
        : parseInt(payload.posterRatingsMaxPerSide, 10);
      if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 20) {
        setPosterRatingsMaxPerSide(parsed);
      }
    }

    const normalizeRatingArray = (value: unknown) => {
      if (!Array.isArray(value)) return null;
      const normalized = value
        .map((item) => (typeof item === 'string' ? item : null))
        .filter((item): item is RatingPreference => item !== null && isRatingProviderId(item));
      return [...new Set(normalized)];
    };

    const resolveRatingPreferences = (arrayValue: unknown, stringValue?: unknown) => {
      const fromArray = normalizeRatingArray(arrayValue);
      if (fromArray !== null) return fromArray;
      if (typeof stringValue === 'string') {
        return parseRatingPreferencesAllowEmpty(stringValue);
      }
      return null;
    };

    const posterRatings =
      resolveRatingPreferences(payload.posterRatingPreferences, payload.posterRatings) ??
      resolveRatingPreferences(null, payload.ratings);
    if (posterRatings !== null) {
      setPosterRatingPreferences(posterRatings);
    }

    const backdropRatings =
      resolveRatingPreferences(payload.backdropRatingPreferences, payload.backdropRatings) ??
      resolveRatingPreferences(null, payload.ratings);
    if (backdropRatings !== null) {
      setBackdropRatingPreferences(backdropRatings);
    }

    const logoRatings =
      resolveRatingPreferences(payload.logoRatingPreferences, payload.logoRatings) ??
      resolveRatingPreferences(null, payload.ratings);
    if (logoRatings !== null) {
      setLogoRatingPreferences(logoRatings);
    }

    if (typeof payload.proxyManifestUrl === 'string') {
      setProxyManifestUrl(normalizeManifestUrl(payload.proxyManifestUrl, true));
    }
    if (payload.proxyEnabledTypes && typeof payload.proxyEnabledTypes === 'object') {
      const enabled = payload.proxyEnabledTypes as Record<string, unknown>;
      setProxyEnabledTypes((current) => ({
        poster: typeof enabled.poster === 'boolean' ? enabled.poster : current.poster,
        backdrop: typeof enabled.backdrop === 'boolean' ? enabled.backdrop : current.backdrop,
        logo: typeof enabled.logo === 'boolean' ? enabled.logo : current.logo,
      }));
    }
    if (typeof payload.translateMeta === 'boolean') {
      setProxyTranslateMeta(payload.translateMeta);
    }

    setImportStatus('success');
    setImportMessage('Config loaded.');
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    setImportStatus('idle');
    setImportMessage('');

    let payload: Record<string, unknown> | null = null;
    try {
      const raw = (await file.text()).trim();
      if (raw.startsWith('{')) {
        payload = JSON.parse(raw);
      } else if (raw) {
        const decoded = decodeBase64Url(raw);
        payload = JSON.parse(decoded);
      }
    } catch {
      payload = null;
    }

    if (!payload || typeof payload !== 'object') {
      setImportStatus('error');
      setImportMessage('Invalid config file.');
      return;
    }

    applyImportedConfig(payload);
  };

  const canGenerateConfig = Boolean(configString);
  const normalizedProxyManifestUrl = normalizeManifestUrl(proxyManifestUrl);
  const canGenerateProxy = Boolean(
    normalizedProxyManifestUrl &&
    !isBareHttpUrl(normalizedProxyManifestUrl) &&
    tmdbKey.trim() &&
    mdblistKey.trim()
  );
  const isConfigStringVisible = canGenerateConfig && showConfigString;
  const isProxyUrlVisible = Boolean(proxyUrl) && showProxyUrl;
  const proxyDisplayValue = proxyUrl || `${baseUrl || 'https://erdb.example.com'}/proxy/{config}/manifest.json`;
  const displayedConfigString =
    canGenerateConfig && !isConfigStringVisible ? maskSensitiveText(configString) : configString;
  const displayedProxyUrl = isProxyUrlVisible ? proxyDisplayValue : maskSensitiveText(proxyDisplayValue);
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

  const viewProps: HomePageViewProps = {
    refs: {
      navRef,
    },
    state: {
      previewType,
      mediaId,
      lang,
      supportedLanguages,
      tmdbKey,
      mdblistKey,
      proxyManifestUrl,
      proxyEnabledTypes,
      proxyTranslateMeta,
      exportStatus,
      importStatus,
      importMessage,
      posterRatingsLayout,
      posterRatingsMaxPerSide,
      backdropRatingsLayout,
      qualityBadgesSide,
      posterQualityBadgesPosition,
      configCopied,
      proxyCopied,
      copied,
    },
    derived: {
      baseUrl,
      previewUrl,
      proxyUrl,
      canGenerateConfig,
      canGenerateProxy,
      isConfigStringVisible,
      isProxyUrlVisible,
      displayedConfigString,
      displayedProxyUrl,
      styleLabel,
      textLabel,
      providersLabel,
      activeRatingStyle,
      activeImageText,
      activeRatingPreferences,
      shouldShowQualityBadgesPosition,
      shouldShowQualityBadgesSide,
      qualityBadgeTypeLabel,
      activeStreamBadges,
      activeQualityBadgesStyle,
    },
    actions: {
      handleAnchorClick,
      handleExportConfig,
      handleImportFile,
      handleCopyConfig,
      handleCopyProxy,
      handleCopyPrompt,
      setPreviewType,
      setMediaId,
      setLang,
      setTmdbKey,
      setMdblistKey,
      setPosterRatingsLayout,
      setPosterRatingsMaxPerSide,
      setBackdropRatingsLayout,
      setPosterQualityBadgesPosition,
      setQualityBadgesSide,
      setRatingStyleForType,
      setImageTextForType,
      setActiveStreamBadges,
      setActiveQualityBadgesStyle,
      toggleRatingPreference,
      updateProxyManifestUrl: (value) => setProxyManifestUrl(normalizeManifestUrl(value, true)),
      toggleProxyEnabledType,
      toggleProxyTranslateMeta: () => setProxyTranslateMeta((value) => !value),
      toggleConfigStringVisibility: () => {
        if (!canGenerateConfig) return;
        setShowConfigString((value) => !value);
      },
      toggleProxyUrlVisibility: () => setShowProxyUrl((value) => !value),
    },
  };

  return <HomePageView {...viewProps} />;
}
