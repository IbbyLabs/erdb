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
import { assertSafeUpstreamUrl } from '@/lib/networkSecurity';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

  let allowOrigin = request.nextUrl.origin;
  if (allowedOrigins.includes('*')) {
    allowOrigin = '*';
  } else if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    allowOrigin = requestOrigin;
  }

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    payload.metas = payload.metas.map((meta) =>
      rewriteMetaImages(meta as Record<string, unknown>, publicRequestUrl, config),
    );
  }

  if (resource === 'meta' && payload.meta && typeof payload.meta === 'object') {
    payload.meta = rewriteMetaImages(payload.meta as Record<string, unknown>, publicRequestUrl, config);
  }

  return NextResponse.json(payload, { status: 200, headers: buildCorsHeaders(request) });
}
