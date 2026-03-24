import { NextResponse } from 'next/server';

const EPISODE_THUMBNAIL_TOKEN_RE = /^S(\d+)E(\d+)(?:\.(?:jpg|jpeg|png|webp))?$/i;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; episodeToken: string }> },
) {
  const { id, episodeToken } = await params;
  const match = EPISODE_THUMBNAIL_TOKEN_RE.exec(episodeToken);
  const season = match?.[1] || null;
  const episode = match?.[2] || null;
  if (!season || !episode) {
    return new Response('Invalid episode thumbnail token', { status: 400 });
  }

  const redirectUrl = new URL(request.url);
  redirectUrl.pathname = `/backdrop/${id}:${season}:${episode}.jpg`;

  return NextResponse.redirect(redirectUrl, 307);
}
