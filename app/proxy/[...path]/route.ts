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

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const tmdbFetchCache = new Map<string, Promise<any>>();

const fetchTmdbJson = async (url: string) => {
  const cached = tmdbFetchCache.get(url);
  if (cached) return cached;
  const promise = fetch(url, { cache: 'no-store' })
    .then(async (response) => {
      if (!response.ok) return null;
      try {
        return await response.json();
      } catch {
        return null;
      }
    })
    .catch(() => null);
  tmdbFetchCache.set(url, promise);
  return promise;
};

const normalizeStremioType = (value: unknown): 'movie' | 'tv' | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === 'movie' || normalized === 'film') return 'movie';
  if (normalized === 'series' || normalized === 'tv' || normalized === 'show') return 'tv';
  return null;
};

const resolveTmdbFromErdbId = async (
  erdbId: string,
  metaType: unknown,
  tmdbKey: string,
  lang: string | null,
) => {
  if (!erdbId) return null;
  const stremioType = normalizeStremioType(metaType);

  if (erdbId.startsWith('tmdb:')) {
    const parts = erdbId.split(':');
    if (parts.length >= 3 && (parts[1] === 'movie' || parts[1] === 'tv')) {
      const id = Number(parts[2]);
      if (Number.isFinite(id)) {
        return { id, type: parts[1] as 'movie' | 'tv' };
      }
    }
    if (parts.length >= 2) {
      const id = Number(parts[1]);
      if (Number.isFinite(id) && stremioType) {
        return { id, type: stremioType };
      }
    }
    return null;
  }

  if (erdbId.startsWith('tt')) {
    const findUrl = new URL(`${TMDB_BASE_URL}/find/${encodeURIComponent(erdbId)}`);
    findUrl.searchParams.set('api_key', tmdbKey);
    findUrl.searchParams.set('external_source', 'imdb_id');
    if (lang) {
      findUrl.searchParams.set('language', lang);
    }
    const data = await fetchTmdbJson(findUrl.toString());
    if (!data || typeof data !== 'object') return null;

    const movieResults = Array.isArray(data.movie_results) ? data.movie_results : [];
    const tvResults = Array.isArray(data.tv_results) ? data.tv_results : [];

    if (stremioType === 'movie' && movieResults[0]?.id) {
      return { id: Number(movieResults[0].id), type: 'movie' };
    }
    if (stremioType === 'tv' && tvResults[0]?.id) {
      return { id: Number(tvResults[0].id), type: 'tv' };
    }

    if (movieResults[0]?.id) {
      return { id: Number(movieResults[0].id), type: 'movie' };
    }
    if (tvResults[0]?.id) {
      return { id: Number(tvResults[0].id), type: 'tv' };
    }
  }

  return null;
};

const translateTextFields = (
  target: Record<string, unknown>,
  translatedTitle: string | null,
  translatedOverview: string | null,
) => {
  if (translatedTitle) {
    if (typeof target.name === 'string') {
      target.name = translatedTitle;
    }
    if (typeof target.title === 'string') {
      target.title = translatedTitle;
    }
    if (typeof target.name !== 'string' && typeof target.title !== 'string') {
      target.name = translatedTitle;
    }
  }

  if (translatedOverview) {
    if (typeof target.description === 'string') {
      target.description = translatedOverview;
    }
    if (typeof target.overview === 'string') {
      target.overview = translatedOverview;
    }
    if (typeof target.plot === 'string') {
      target.plot = translatedOverview;
    }
    if (typeof target.synopsis === 'string') {
      target.synopsis = translatedOverview;
    }
    if (
      typeof target.description !== 'string' &&
      typeof target.overview !== 'string' &&
      typeof target.plot !== 'string' &&
      typeof target.synopsis !== 'string'
    ) {
      target.description = translatedOverview;
    }
  }
};

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
  const lang = config.lang || requestUrl.searchParams.get('lang');
  if (!lang) return meta;

  const rawId = typeof meta.id === 'string' ? meta.id : null;
  const rawType = typeof meta.type === 'string' ? meta.type : null;
  const erdbId = normalizeErdbId(rawId, rawType);
  if (!erdbId) return meta;

  const tmdbRef = await resolveTmdbFromErdbId(erdbId, rawType, config.tmdbKey, lang);
  if (!tmdbRef) return meta;

  const detailsUrl = new URL(`${TMDB_BASE_URL}/${tmdbRef.type}/${tmdbRef.id}`);
  detailsUrl.searchParams.set('api_key', config.tmdbKey);
  detailsUrl.searchParams.set('language', lang);
  const details = await fetchTmdbJson(detailsUrl.toString());
  if (!details || typeof details !== 'object') return meta;

  const translatedTitle =
    typeof details.title === 'string'
      ? details.title
      : typeof details.name === 'string'
        ? details.name
        : null;
  const translatedOverview = typeof details.overview === 'string' ? details.overview : null;

  const nextMeta: Record<string, unknown> = { ...meta };
  translateTextFields(nextMeta, translatedTitle, translatedOverview);

  if (tmdbRef.type === 'tv' && Array.isArray(nextMeta.videos) && nextMeta.videos.length > 0) {
    const videos = nextMeta.videos as Array<Record<string, unknown>>;
    const translatedVideos = await mapWithConcurrency(videos, 6, async (video) => {
      const seasonValue = typeof video.season === 'number' ? video.season : parseInt(String(video.season || ''), 10);
      const episodeValue = typeof video.episode === 'number' ? video.episode : parseInt(String(video.episode || ''), 10);
      if (!Number.isFinite(seasonValue) || !Number.isFinite(episodeValue)) {
        return video;
      }

      const episodeUrl = new URL(
        `${TMDB_BASE_URL}/tv/${tmdbRef.id}/season/${seasonValue}/episode/${episodeValue}`,
      );
      episodeUrl.searchParams.set('api_key', config.tmdbKey);
      episodeUrl.searchParams.set('language', lang);
      const episodeData = await fetchTmdbJson(episodeUrl.toString());
      if (!episodeData || typeof episodeData !== 'object') {
        return video;
      }

      const episodeTitle = typeof episodeData.name === 'string' ? episodeData.name : null;
      const episodeOverview = typeof episodeData.overview === 'string' ? episodeData.overview : null;
      if (!episodeTitle && !episodeOverview) return video;

      const nextVideo = { ...video };
      translateTextFields(nextVideo, episodeTitle, episodeOverview);
      return nextVideo;
    });

    nextMeta.videos = translatedVideos;
  }

  return nextMeta;
};

const getPublicRequestUrl = (request: NextRequest) => {
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
  if (!forwardedHost) return request.nextUrl;
  const protoHeader = request.headers.get('x-forwarded-proto');
  const proto = (protoHeader?.split(',')[0].trim() || request.nextUrl.protocol.replace(':', '')).toLowerCase();
  const host = forwardedHost.split(',')[0].trim();
  const url = new URL(request.nextUrl.toString());
  url.protocol = `${proto}:`;
  url.host = host;
  return url;
};

const buildError = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status, headers: corsHeaders });

const isTypeEnabled = (config: ProxyConfig, type: 'poster' | 'backdrop' | 'logo') => {
  if (type === 'poster') return config.posterEnabled !== false;
  if (type === 'backdrop') return config.backdropEnabled !== false;
  return config.logoEnabled !== false;
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
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

  if (isTypeEnabled(config, 'poster')) {
    nextMeta.poster = buildErdbImageUrl({
      reqUrl: requestUrl,
      imageType: 'poster',
      erdbId,
      tmdbKey: config.tmdbKey,
      mdblistKey: config.mdblistKey,
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
      return buildError('Missing "url" query parameter.');
    }
    return buildError('Missing "tmdbKey" or "mdblistKey" query parameter.');
  }

  let config: ProxyConfig | null = queryConfig;
  let resourceSegments = pathSegments;
  let configSeed: string | undefined;

  if (!config) {
    if (pathSegments.length < 2) {
      return buildError('Missing proxy config in path.');
    }
    configSeed = pathSegments[0];
    config = decodeProxyConfig(configSeed);
    if (!config) {
      return buildError('Invalid proxy config in path.');
    }
    resourceSegments = pathSegments.slice(1);
  }

  if (resourceSegments.length === 0) {
    return buildError('Missing addon resource path.');
  }

  const publicRequestUrl = getPublicRequestUrl(request);

  if (!hasQueryConfig && resourceSegments.length === 1 && resourceSegments[0] === 'manifest.json') {
    let manifestResponse: Response;
    try {
      manifestResponse = await fetch(config.url, { cache: 'no-store' });
    } catch (error) {
      return buildError('Unable to reach the source manifest.', 502);
    }

    if (!manifestResponse.ok) {
      return buildError(`Source manifest returned ${manifestResponse.status}.`, 502);
    }

    let manifest: Record<string, unknown>;
    try {
      manifest = (await manifestResponse.json()) as Record<string, unknown>;
    } catch (error) {
      return buildError('Source manifest is not valid JSON.', 502);
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

    return NextResponse.json(proxyManifest, { status: 200, headers: corsHeaders });
  }

  let originBase: string;
  try {
    originBase = parseAddonBaseUrl(config.url);
  } catch (error) {
    return buildError('Invalid source manifest URL.', 400);
  }

  const resource = resourceSegments[0] || '';
  const forwardUrl = new URL(originBase);
  // Preserve Stremio "extra" path segments like `search=...` and `skip=...`.
  // Encoding each segment would turn `=` into `%3D`, breaking upstream parsing.
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
    upstreamResponse = await fetch(forwardUrl.toString(), { cache: 'no-store' });
  } catch (error) {
    return buildError('Unable to reach the source addon.', 502);
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
    headers.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
    headers.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
    headers.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
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
    headers.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
    headers.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
    headers.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
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

  return NextResponse.json(payload, { status: 200, headers: corsHeaders });
}
