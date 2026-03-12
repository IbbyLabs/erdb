import { NextRequest, NextResponse } from 'next/server';
import { buildProxyId } from '@/lib/addonProxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

const buildError = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status, headers: corsHeaders });

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sourceUrl = searchParams.get('url');
  const tmdbKey = searchParams.get('tmdbKey');
  const mdblistKey = searchParams.get('mdblistKey');

  if (!sourceUrl) {
    return buildError('Missing "url" query parameter.');
  }
  if (!tmdbKey || !mdblistKey) {
    return buildError('Missing "tmdbKey" or "mdblistKey" query parameter.');
  }

  let manifestResponse: Response;
  try {
    manifestResponse = await fetch(sourceUrl, { cache: 'no-store' });
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

  return NextResponse.json(proxyManifest, { status: 200, headers: corsHeaders });
}
