import { NextRequest, NextResponse } from 'next/server';

import {
  buildReadmePreviewTargetUrl,
  resolveReadmePreviewDefinition,
  resolveReadmePreviewOrigins,
} from '@/lib/readmePreview';

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

const copyPreviewHeaders = (response: Response, contentLength?: number) => {
  const headers = new Headers();
  const contentType = response.headers.get('content-type');
  const cacheControl = response.headers.get('cache-control');
  const upstreamContentLength = response.headers.get('content-length');
  const etag = response.headers.get('etag');

  if (contentType) headers.set('content-type', contentType);
  if (cacheControl) headers.set('cache-control', cacheControl);
  if (typeof contentLength === 'number' && Number.isFinite(contentLength) && contentLength >= 0) {
    headers.set('content-length', String(contentLength));
  } else if (upstreamContentLength) {
    headers.set('content-length', upstreamContentLength);
  }
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
  const previewOrigins = resolveReadmePreviewOrigins({
    requestOrigin: request.nextUrl.origin,
    internalOrigin: process.env.PREVIEW_INTERNAL_ORIGIN,
    bindHost: process.env.HOSTNAME,
    port: process.env.PORT,
  });

  let upstreamResponse: Response | null = null;
  for (const previewOrigin of previewOrigins) {
    const targetUrl = buildReadmePreviewTargetUrl({
      origin: previewOrigin,
      definition,
      tmdbKey,
      mdblistKey,
      cacheBuster,
    });

    try {
      upstreamResponse = await fetch(targetUrl.toString(), { cache: 'no-store' });
    } catch {
      continue;
    }

    if (upstreamResponse.ok) {
      break;
    }
  }

  if (!upstreamResponse) {
    return buildTextResponse('README preview fetch failed.', 502);
  }

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

  let payload: ArrayBuffer;
  try {
    payload = await upstreamResponse.arrayBuffer();
  } catch {
    return buildTextResponse('README preview fetch failed.', 502);
  }

  return new NextResponse(payload, {
    status: upstreamResponse.status,
    headers: copyPreviewHeaders(upstreamResponse, payload.byteLength),
  });
}
