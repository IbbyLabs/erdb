import { NextRequest, NextResponse } from 'next/server';

import { buildReadmePreviewTargetUrl, resolveReadmePreviewDefinition } from '@/lib/readmePreview';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const buildTextResponse = (message: string, status: number) =>
  new NextResponse(message, {
    status,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
    },
  });

const copyPreviewHeaders = (response: Response) => {
  const headers = new Headers();
  const contentType = response.headers.get('content-type');
  const cacheControl = response.headers.get('cache-control');
  const contentLength = response.headers.get('content-length');
  const etag = response.headers.get('etag');

  if (contentType) headers.set('content-type', contentType);
  if (cacheControl) headers.set('cache-control', cacheControl);
  if (contentLength) headers.set('content-length', contentLength);
  if (etag) headers.set('etag', etag);
  headers.set('x-robots-tag', 'noindex');

  return headers;
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const definition = resolveReadmePreviewDefinition(slug);
  if (!definition) {
    return buildTextResponse('Unknown README preview.', 404);
  }

  const tmdbKey = process.env.ERDB_README_PREVIEW_TMDB_KEY?.trim();
  if (!tmdbKey) {
    return buildTextResponse('README preview TMDB key is not configured.', 503);
  }

  const mdblistKey = process.env.ERDB_README_PREVIEW_MDBLIST_KEY?.trim() || null;
  const cacheBuster = request.nextUrl.searchParams.get('cb');
  const targetUrl = buildReadmePreviewTargetUrl({
    origin: request.nextUrl.origin,
    definition,
    tmdbKey,
    mdblistKey,
    cacheBuster,
  });

  const upstreamResponse = await fetch(targetUrl.toString(), { cache: 'no-store' });
  if (!upstreamResponse.ok) {
    const fallbackBody = await upstreamResponse.text().catch(() => 'README preview fetch failed.');
    return new NextResponse(fallbackBody, {
      status: upstreamResponse.status,
      headers: {
        'content-type':
          upstreamResponse.headers.get('content-type') || 'text/plain; charset=utf-8',
        'cache-control': 'no-store',
        'x-robots-tag': 'noindex',
      },
    });
  }

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: copyPreviewHeaders(upstreamResponse),
  });
}
