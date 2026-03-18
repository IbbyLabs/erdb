import { NextRequest, NextResponse } from 'next/server';
import { buildProxyId } from '@/lib/addonProxy';
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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
};

const buildError = (request: NextRequest, message: string, status = 400) =>
  NextResponse.json({ error: message }, { status, headers: buildCorsHeaders(request) });

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(request) });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sourceUrl = searchParams.get('url');
  const tmdbKey = searchParams.get('tmdbKey');
  const mdblistKey = searchParams.get('mdblistKey');

  if (!sourceUrl) {
    return buildError(request, 'Missing "url" query parameter.');
  }
  if (!tmdbKey || !mdblistKey) {
    return buildError(request, 'Missing "tmdbKey" or "mdblistKey" query parameter.');
  }

  let safeSourceUrl: URL;
  try {
    safeSourceUrl = await assertSafeUpstreamUrl(sourceUrl);
  } catch (error) {
    return buildError(request, 'Invalid or unsafe source manifest URL.', 400);
  }

  let manifestResponse: Response;
  try {
    manifestResponse = await fetch(safeSourceUrl.toString(), { cache: 'no-store', redirect: 'error' });
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

  const proxyId = buildProxyId(sourceUrl);
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
