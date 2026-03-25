import { NextRequest, NextResponse } from 'next/server';
import {
  ERDB_RESERVED_PARAMS,
  buildErdbImageUrl,
  buildProxyId,
  decodeProxyConfig,
  getProxyConfigFromQuery,
  normalizeErdbId,
  parseAddonBaseUrl,
  type ProxyConfig,
} from '@/lib/addonProxy';
import { DEFAULT_METADATA_TRANSLATION_MODE } from '@/lib/metadataTranslation';
import { assertSafeUpstreamUrl } from '@/lib/networkSecurity';
import {
  applyTranslatedTextFields,
  extractTmdbTextCandidates,
  hasMeaningfulText,
  isAnimeErdbId,
  resolveAnimeTextFallback,
  resolveTmdbTranslationFieldAvailability,
  resolveTmdbTranslationTarget,
} from '@/lib/proxyMetaTranslation';
import {
  ERDB_REQUEST_KEY_ERROR_MESSAGE,
  getConfiguredErdbRequestKeys,
  isErdbRequestAuthorized,
} from '@/lib/erdbRequestKey';
import { TMDB_API_BASE_URL } from '@/lib/serviceBaseUrls';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const ERDB_REQUEST_API_KEYS = getConfiguredErdbRequestKeys();

const getAllowedCorsOrigins = () => {
  const raw = process.env.ERDB_PROXY_ALLOWED_ORIGINS;
  if (!raw || !raw.trim()) return [];
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
};

const buildCorsHeaders = (request: NextRequest) => {
  const requestOrigin = request.headers.get('origin');
  const allowedOrigins = getAllowedCorsOrigins();

  let allowOrigin = '*';
  if (allowedOrigins.length > 0) {
    if (allowedOrigins.includes('*')) {
      allowOrigin = '*';
    } else if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      allowOrigin = requestOrigin;
    } else {
      allowOrigin = allowedOrigins[0]!;
    }
  }

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-ERDB-Key, X-API-Key',
    Vary: 'Origin',
  };
};

const parseForwardedProto = (value: string | null) => {
  const candidate = (value || '').split(',')[0]?.trim().toLowerCase();
  if (candidate === 'http' || candidate === 'https') return candidate;
  return null;
};

const parseForwardedHost = (value: string | null) => {
  const candidate = (value || '').split(',')[0]?.trim();
  if (!candidate) return null;
  try {
    const parsed = new URL(`http://${candidate}`);
    return parsed.host;
  } catch {
    return null;
  }
};

const ANILIST_GRAPHQL_URL = process.env.ERDB_ANILIST_GRAPHQL_URL?.trim() || 'https://graphql.anilist.co';
const ANILIST_MEDIA_QUERY = `
  query ErdbAnimeTextFallback($id: Int) {
    Media(id: $id, type: ANIME) {
      title {
        romaji
        english
        native
        userPreferred
      }
      description(asHtml: false)
    }
  }
`;
type CacheEntry<T> = { value: T; expiresAt: number };
const tmdbFetchCache = new Map<string, CacheEntry<Promise<any>>>();
const animeMappingFetchCache = new Map<string, CacheEntry<Promise<any>>>();
const kitsuFetchCache = new Map<string, CacheEntry<Promise<any>>>();
const anilistFetchCache = new Map<string, CacheEntry<Promise<any>>>();
const TMDB_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const TMDB_FAILED_TTL_MS = 2 * 60 * 1000;
const ANIME_MAPPING_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const ANIME_MAPPING_FAILED_TTL_MS = 2 * 60 * 1000;

const prunePromiseCache = (cache: Map<string, CacheEntry<Promise<any>>>) => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
};

const createCachedValueFetcher = <T,>(
  cache: Map<string, CacheEntry<Promise<any>>>,
  successTtlMs: number,
  failedTtlMs: number,
  resolver: (key: string) => Promise<T>,
) => async (key: string): Promise<T | null> => {
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  if (cache.size > 2000) prunePromiseCache(cache);

  const entry: CacheEntry<Promise<any>> = { value: Promise.resolve(null), expiresAt: now + successTtlMs };
  cache.set(key, entry);

  const promise = (async () => {
    let result: T | null = null;
    try {
      result = await resolver(key);
    } catch {
      // fallback
    }

    entry.expiresAt = Date.now() + (result ? successTtlMs : failedTtlMs);
    return result;
  })();

  entry.value = promise;
  return promise;
};

const createCachedJsonFetcher = (
  cache: Map<string, CacheEntry<Promise<any>>>,
  successTtlMs: number,
  failedTtlMs: number,
) =>
  createCachedValueFetcher(cache, successTtlMs, failedTtlMs, async (url: string) => {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      return null;
    }
    return response.json();
  });

const fetchTmdbJson = createCachedJsonFetcher(tmdbFetchCache, TMDB_CACHE_TTL_MS, TMDB_FAILED_TTL_MS);
const fetchAnimeMappingJson = createCachedJsonFetcher(
  animeMappingFetchCache,
  ANIME_MAPPING_CACHE_TTL_MS,
  ANIME_MAPPING_FAILED_TTL_MS,
);
const fetchKitsuJson = createCachedJsonFetcher(
  kitsuFetchCache,
  ANIME_MAPPING_CACHE_TTL_MS,
  ANIME_MAPPING_FAILED_TTL_MS,
);
const fetchAniListMediaJson = createCachedValueFetcher(
  anilistFetchCache,
  ANIME_MAPPING_CACHE_TTL_MS,
  ANIME_MAPPING_FAILED_TTL_MS,
  async (id: string) => {
    const mediaId = Number.parseInt(id, 10);
    if (!Number.isFinite(mediaId) || mediaId <= 0) {
      return null;
    }

    const response = await fetch(ANILIST_GRAPHQL_URL, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        query: ANILIST_MEDIA_QUERY,
        variables: { id: mediaId },
      }),
    });
    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    if (payload?.errors) {
      return null;
    }
    return payload;
  },
);

const mapWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>,
) => {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (true) {
      const currentIndex = nextIndex++;
      if (currentIndex >= items.length) return;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  });

  await Promise.all(workers);
  return results;
};

const translateMetaPayload = async (
  meta: Record<string, unknown>,
  requestUrl: URL,
  config: ProxyConfig,
) => {
  if (!config.translateMeta) return meta;
  const mode = config.translateMetaMode || DEFAULT_METADATA_TRANSLATION_MODE;
  const debugMetaTranslation = config.debugMetaTranslation === true;
  const lang = config.lang || requestUrl.searchParams.get('lang');
  if (!lang) return meta;

  const rawId = typeof meta.id === 'string' ? meta.id : null;
  const rawType = typeof meta.type === 'string' ? meta.type : null;
  const erdbId = normalizeErdbId(rawId, rawType);
  if (!erdbId) return meta;

  const tmdbTarget = await resolveTmdbTranslationTarget({
    erdbId,
    metaType: rawType,
    tmdbKey: config.tmdbKey,
    lang,
    fetchTmdbJson,
    fetchAnimeMappingJson,
  });
  const tmdbId = tmdbTarget?.id ?? null;
  const tmdbType = tmdbTarget?.type ?? null;
  const details = tmdbTarget?.details ?? null;
  const { title: translatedTitle, overview: translatedOverview } = extractTmdbTextCandidates(details);
  const needsTmdbLanguageCheck = mode === 'prefer-requested-language' || debugMetaTranslation;
  const tmdbRequestedLanguage = tmdbTarget && needsTmdbLanguageCheck
    ? await resolveTmdbTranslationFieldAvailability({
        tmdbId: tmdbTarget.id,
        type: tmdbTarget.type,
        tmdbKey: config.tmdbKey,
        lang,
        fetchTmdbJson,
      })
    : { title: null, overview: null };

  const shouldFetchAnimeFallback =
    isAnimeErdbId(erdbId) &&
    (debugMetaTranslation ||
      !tmdbTarget ||
      (mode === 'prefer-requested-language' &&
        (tmdbRequestedLanguage.title === false || tmdbRequestedLanguage.overview === false)) ||
      !hasMeaningfulText(translatedTitle) ||
      !hasMeaningfulText(translatedOverview));

  const animeFallback = shouldFetchAnimeFallback
    ? await resolveAnimeTextFallback({
        erdbId,
        lang,
        fetchAnimeMappingJson,
        fetchKitsuJson,
        fetchAniListMediaJson,
      })
    : null;

  const nextMeta: Record<string, unknown> = { ...meta };
  const topLevelDebug = applyTranslatedTextFields(nextMeta, {
    mode,
    tmdbTitle: translatedTitle,
    tmdbOverview: translatedOverview,
    tmdbTitleExactRequestedLanguage: tmdbRequestedLanguage.title,
    tmdbOverviewExactRequestedLanguage: tmdbRequestedLanguage.overview,
    animeTitle: animeFallback?.title.value ?? null,
    animeOverview: animeFallback?.overview.value ?? null,
    animeTitleSource: animeFallback?.title.source ?? null,
    animeOverviewSource: animeFallback?.overview.source ?? null,
    animeTitleExactRequestedLanguage: animeFallback?.title.exactRequestedLanguage ?? null,
    animeOverviewExactRequestedLanguage: animeFallback?.overview.exactRequestedLanguage ?? null,
  });

  if (debugMetaTranslation) {
    nextMeta._erdbMetaTranslation = {
      requestedLanguage: lang,
      mode,
      erdbId,
      resolutionPath: erdbId.startsWith('tmdb:')
        ? 'tmdb'
        : /^tt\d+$/i.test(erdbId)
          ? 'imdb'
          : isAnimeErdbId(erdbId)
            ? 'anime'
            : 'unknown',
      tmdbTarget:
        tmdbId && tmdbType
          ? {
              id: tmdbId,
              type: tmdbType,
              requestedLanguage: tmdbRequestedLanguage,
            }
          : null,
      animeFallback:
        animeFallback
          ? {
              titleSource: animeFallback.title.source,
              titleExactRequestedLanguage: animeFallback.title.exactRequestedLanguage,
              overviewSource: animeFallback.overview.source,
              overviewExactRequestedLanguage: animeFallback.overview.exactRequestedLanguage,
            }
          : null,
      fields: topLevelDebug,
    };
  }

  if (tmdbType === 'tv' && tmdbId && Array.isArray(nextMeta.videos) && nextMeta.videos.length > 0) {
    const videos = nextMeta.videos as Array<Record<string, unknown>>;
    const seasonValues = new Set<number>();
    for (const video of videos) {
      const seasonValue = typeof video.season === 'number' ? video.season : parseInt(String(video.season || ''), 10);
      if (Number.isFinite(seasonValue)) seasonValues.add(seasonValue);
    }

    const seasonDataMap = new Map<number, any>();
    await mapWithConcurrency(Array.from(seasonValues), 6, async (seasonValue) => {
      const seasonUrl = new URL(`${TMDB_API_BASE_URL}/tv/${tmdbId}/season/${seasonValue}`);
      seasonUrl.searchParams.set('api_key', config.tmdbKey);
      seasonUrl.searchParams.set('language', lang);
      const seasonData = await fetchTmdbJson(seasonUrl.toString());
      if (seasonData && typeof seasonData === 'object') {
        seasonDataMap.set(seasonValue, seasonData);
      }
    });

    const translatedVideos = await mapWithConcurrency(videos, 6, async (video) => {
      const seasonValue = typeof video.season === 'number' ? video.season : parseInt(String(video.season || ''), 10);
      const episodeValue = typeof video.episode === 'number' ? video.episode : parseInt(String(video.episode || ''), 10);
      if (!Number.isFinite(seasonValue) || !Number.isFinite(episodeValue)) {
        return video;
      }

      const seasonData = seasonDataMap.get(seasonValue);
      const episodesArray = Array.isArray(seasonData?.episodes) ? seasonData.episodes : [];
      const episodeData = episodesArray.find((ep: any) => Number(ep.episode_number) === episodeValue);

      if (!episodeData) return video;

      const episodeTitle = typeof episodeData.name === 'string' ? episodeData.name : null;
      const episodeOverview = typeof episodeData.overview === 'string' ? episodeData.overview : null;
      if (!episodeTitle && !episodeOverview) return video;

      const episodeRequestedLanguage = needsTmdbLanguageCheck
        ? await resolveTmdbTranslationFieldAvailability({
            tmdbId,
            type: tmdbType,
            tmdbKey: config.tmdbKey,
            lang,
            fetchTmdbJson,
            seasonNumber: seasonValue,
            episodeNumber: episodeValue,
          })
        : { title: null, overview: null };

      const nextVideo = { ...video };
      const episodeDebug = applyTranslatedTextFields(nextVideo, {
        mode,
        tmdbTitle: episodeTitle,
        tmdbOverview: episodeOverview,
        tmdbTitleExactRequestedLanguage: episodeRequestedLanguage.title,
        tmdbOverviewExactRequestedLanguage: episodeRequestedLanguage.overview,
      });
      if (debugMetaTranslation) {
        nextVideo._erdbMetaTranslation = {
          scope: 'episode',
          requestedLanguage: lang,
          mode,
          tmdbTarget: {
            id: tmdbId,
            type: tmdbType,
            season: seasonValue,
            episode: episodeValue,
            requestedLanguage: episodeRequestedLanguage,
          },
          fields: episodeDebug,
        };
      }
      return nextVideo;
    });

    nextMeta.videos = translatedVideos;
  }

  return nextMeta;
};

const getPublicRequestUrl = (request: NextRequest) => {
  const trustForwarded = process.env.ERDB_TRUST_PROXY_HEADERS === 'true';
  const hostHeader = trustForwarded
    ? request.headers.get('x-forwarded-host') || request.headers.get('host')
    : request.headers.get('host');
  const host = parseForwardedHost(hostHeader);
  if (!host) return request.nextUrl;

  const proto = trustForwarded
    ? parseForwardedProto(request.headers.get('x-forwarded-proto')) || request.nextUrl.protocol.replace(':', '')
    : request.nextUrl.protocol.replace(':', '');

  if (proto !== 'http' && proto !== 'https') return request.nextUrl;

  const url = new URL(request.nextUrl.toString());
  url.protocol = `${proto}:`;
  url.host = host;
  // When behind a reverse proxy, strip the internal port (e.g. :3000)
  // so public-facing URLs only use the reverse proxy's default port.
  if (trustForwarded && url.port) {
    url.port = '';
  }
  return url;
};

const buildError = (request: NextRequest, message: string, status = 400) =>
  NextResponse.json({ error: message }, { status, headers: buildCorsHeaders(request) });

const isTypeEnabled = (config: ProxyConfig, type: 'poster' | 'backdrop' | 'logo') => {
  if (type === 'poster') return config.posterEnabled !== false;
  if (type === 'backdrop') return config.backdropEnabled !== false;
  return config.logoEnabled !== false;
};

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(request) });
}

const rewriteMetaImages = (
  meta: Record<string, unknown>,
  requestUrl: URL,
  config: ProxyConfig,
) => {
  if (!meta || typeof meta !== 'object') return meta;
  const rawId = typeof meta.id === 'string' ? meta.id : null;
  const rawType = typeof meta.type === 'string' ? meta.type : null;
  const erdbId = normalizeErdbId(rawId, rawType);
  if (!erdbId) return meta;

  const nextMeta: Record<string, unknown> = { ...meta };
  const upstreamPosterUrl = typeof meta.poster === 'string' ? meta.poster.trim() : '';
  const upstreamBackdropUrl = typeof meta.background === 'string' ? meta.background.trim() : '';
  const upstreamLogoUrl = typeof meta.logo === 'string' ? meta.logo.trim() : '';

  if (isTypeEnabled(config, 'poster')) {
    nextMeta.poster = buildErdbImageUrl({
      reqUrl: requestUrl,
      imageType: 'poster',
      erdbId,
      tmdbKey: config.tmdbKey,
      mdblistKey: config.mdblistKey,
      fallbackUrl: upstreamPosterUrl || null,
      config,
    });
  }

  if (isTypeEnabled(config, 'backdrop')) {
    nextMeta.background = buildErdbImageUrl({
      reqUrl: requestUrl,
      imageType: 'backdrop',
      erdbId,
      tmdbKey: config.tmdbKey,
      mdblistKey: config.mdblistKey,
      fallbackUrl: upstreamBackdropUrl || null,
      config,
    });
  }

  if (isTypeEnabled(config, 'logo')) {
    nextMeta.logo = buildErdbImageUrl({
      reqUrl: requestUrl,
      imageType: 'logo',
      erdbId,
      tmdbKey: config.tmdbKey,
      mdblistKey: config.mdblistKey,
      fallbackUrl: upstreamLogoUrl || null,
      config,
    });
  }

  return nextMeta;
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { searchParams } = request.nextUrl;
  const params = await context.params;
  const pathSegments = params?.path || [];
  const hasQueryConfig = searchParams.has('url') || searchParams.has('tmdbKey') || searchParams.has('mdblistKey');
  const queryConfig = hasQueryConfig ? getProxyConfigFromQuery(searchParams) : null;

  if (hasQueryConfig && !queryConfig) {
    if (!searchParams.get('url')) {
      return buildError(request, 'Missing "url" query parameter.');
    }
    return buildError(request, 'Missing "tmdbKey" or "mdblistKey" query parameter.');
  }

  let config: ProxyConfig | null = queryConfig;
  let resourceSegments = pathSegments;
  let configSeed: string | undefined;

  if (!config) {
    if (pathSegments.length < 2) {
      return buildError(request, 'Missing proxy config in path.');
    }
    configSeed = pathSegments[0];
    config = decodeProxyConfig(configSeed);
    if (!config) {
      return buildError(request, 'Invalid proxy config in path.');
    }
    resourceSegments = pathSegments.slice(1);
  }

  if (
    !isErdbRequestAuthorized({
      configuredKeys: ERDB_REQUEST_API_KEYS,
      searchParams,
      headers: request.headers,
      fallbackKey: config.erdbKey,
    })
  ) {
    return buildError(request, ERDB_REQUEST_KEY_ERROR_MESSAGE, 401);
  }

  if (resourceSegments.length === 0) {
    return buildError(request, 'Missing addon resource path.');
  }

  let safeManifestUrl: URL;
  try {
    safeManifestUrl = await assertSafeUpstreamUrl(config.url);
  } catch (error) {
    return buildError(request, 'Invalid or unsafe source manifest URL.', 400);
  }

  const publicRequestUrl = getPublicRequestUrl(request);

  if (!hasQueryConfig && resourceSegments.length === 1 && resourceSegments[0] === 'manifest.json') {
    let manifestResponse: Response;
    try {
      manifestResponse = await fetch(safeManifestUrl.toString(), { cache: 'no-store', redirect: 'error' });
    } catch (error) {
      return buildError(request, 'Unable to reach the source manifest.', 502);
    }

    if (!manifestResponse.ok) {
      return buildError(request, `Source manifest returned ${manifestResponse.status}.`, 502);
    }

    let manifest: Record<string, unknown>;
    try {
      manifest = (await manifestResponse.json()) as Record<string, unknown>;
    } catch (error) {
      return buildError(request, 'Source manifest is not valid JSON.', 502);
    }

    const proxyId = buildProxyId(config.url, configSeed);
    const originalName = typeof manifest.name === 'string' ? manifest.name : 'Addon';
    const originalDescription =
      typeof manifest.description === 'string' ? manifest.description : 'Proxied via ERDB';

    const proxyManifest = {
      ...manifest,
      id: proxyId,
      name: `ERDB Proxy - ${originalName}`,
      description: `${originalDescription} (proxied via ERDB)`,
    };

    return NextResponse.json(proxyManifest, { status: 200, headers: buildCorsHeaders(request) });
  }

  let originBase: string;
  try {
    originBase = parseAddonBaseUrl(safeManifestUrl.toString());
  } catch (error) {
    return buildError(request, 'Invalid source manifest URL.', 400);
  }

  const resource = resourceSegments[0] || '';
  const forwardUrl = new URL(originBase);
  forwardUrl.pathname = `${forwardUrl.pathname.replace(/\/$/, '')}/${resourceSegments.join('/')}`;

  const forwardParams = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (!ERDB_RESERVED_PARAMS.has(key)) {
      forwardParams.append(key, value);
    }
  }
  forwardUrl.search = forwardParams.toString();

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(forwardUrl.toString(), { cache: 'no-store', redirect: 'error' });
  } catch (error) {
    return buildError(request, 'Unable to reach the source addon.', 502);
  }

  if (!upstreamResponse.ok) {
    const errorBody = await upstreamResponse.text();
    return new NextResponse(errorBody, {
      status: upstreamResponse.status,
      headers: {
        'content-type': upstreamResponse.headers.get('content-type') || 'text/plain',
      },
    });
  }

  if (resource !== 'catalog' && resource !== 'meta') {
    const passthroughBody = await upstreamResponse.arrayBuffer();
    const headers = new Headers(upstreamResponse.headers);
    headers.delete('content-encoding');
    headers.delete('content-length');
    const corsHeaders = buildCorsHeaders(request);
    headers.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
    headers.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
    headers.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
    headers.set('Vary', corsHeaders.Vary);
    return new NextResponse(passthroughBody, {
      status: upstreamResponse.status,
      headers,
    });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await upstreamResponse.json()) as Record<string, unknown>;
  } catch (error) {
    const passthroughBody = await upstreamResponse.arrayBuffer();
    const headers = new Headers(upstreamResponse.headers);
    headers.delete('content-encoding');
    headers.delete('content-length');
    const corsHeaders = buildCorsHeaders(request);
    headers.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
    headers.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
    headers.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
    headers.set('Vary', corsHeaders.Vary);
    return new NextResponse(passthroughBody, {
      status: upstreamResponse.status,
      headers,
    });
  }

  if (resource === 'catalog' && Array.isArray(payload.metas)) {
    const metasWithImages = payload.metas.map((meta) =>
      rewriteMetaImages(meta as Record<string, unknown>, publicRequestUrl, config),
    );
    payload.metas = await mapWithConcurrency(
      metasWithImages as Array<Record<string, unknown>>,
      6,
      async (meta) => translateMetaPayload(meta, publicRequestUrl, config),
    );
  }

  if (resource === 'meta' && payload.meta && typeof payload.meta === 'object') {
    const metaWithImages = rewriteMetaImages(payload.meta as Record<string, unknown>, publicRequestUrl, config);
    payload.meta = await translateMetaPayload(metaWithImages, publicRequestUrl, config);
  }

  return NextResponse.json(payload, { status: 200, headers: buildCorsHeaders(request) });
}
