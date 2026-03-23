import { NextResponse } from 'next/server';

import {
  fetchLatestGitHubRelease,
  resolveGitHubRepository,
} from '@/lib/githubRelease';

const LATEST_RELEASE_CACHE_SECONDS = 300;
export const revalidate = 300;

const CACHE_CONTROL = `public, s-maxage=${LATEST_RELEASE_CACHE_SECONDS}, stale-while-revalidate=86400`;

export async function GET() {
  const repository = resolveGitHubRepository();
  const release = await fetchLatestGitHubRelease({ repository });

  return NextResponse.json(
    {
      repositoryUrl: repository?.htmlUrl || null,
      tagName: release?.tagName || null,
      url: release?.url || null,
      publishedAt: release?.publishedAt || null,
    },
    {
      headers: {
        'Cache-Control': CACHE_CONTROL,
      },
    }
  );
}
