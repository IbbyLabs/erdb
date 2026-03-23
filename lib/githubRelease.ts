export const LATEST_GITHUB_RELEASE_TTL_SECONDS = 300;
const DEFAULT_GITHUB_REPOSITORY_URL = 'https://github.com/IbbyLabs/erdb';

export type GitHubRepository = {
  owner: string;
  name: string;
  htmlUrl: string;
  latestReleaseApiUrl: string;
};

export type LatestGitHubRelease = {
  tagName: string;
  url: string;
  publishedAt: string | null;
};

type GitHubReleaseApiResponse = {
  tag_name?: unknown;
  html_url?: unknown;
  published_at?: unknown;
};

type NextFetchInit = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

function getRepositoryCandidates(): string[] {
  return [
    String(process.env.NEXT_PUBLIC_BRAND_GITHUB_URL || '').trim(),
    DEFAULT_GITHUB_REPOSITORY_URL,
  ].filter(Boolean);
}

export function normalizeReleaseTag(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

export function parseGitHubRepositoryUrl(value: string): GitHubRepository | null {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return null;
  }

  let url: URL;

  try {
    url = new URL(trimmed.replace(/^git\+/, ''));
  } catch {
    return null;
  }

  if (!['github.com', 'www.github.com'].includes(url.hostname.toLowerCase())) {
    return null;
  }

  const [owner, name] = url.pathname
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .replace(/\.git$/, '')
    .split('/');

  if (!owner || !name) {
    return null;
  }

  const htmlUrl = `https://github.com/${owner}/${name}`;

  return {
    owner,
    name,
    htmlUrl,
    latestReleaseApiUrl: `https://api.github.com/repos/${owner}/${name}/releases/latest`,
  };
}

export function resolveGitHubRepository(): GitHubRepository | null {
  for (const candidate of getRepositoryCandidates()) {
    const repository = parseGitHubRepositoryUrl(candidate);
    if (repository) {
      return repository;
    }
  }

  return null;
}

export async function fetchLatestGitHubRelease({
  repository = resolveGitHubRepository(),
  fetchImpl = fetch,
}: {
  repository?: GitHubRepository | null;
  fetchImpl?: typeof fetch;
} = {}): Promise<LatestGitHubRelease | null> {
  if (!repository) {
    return null;
  }

  let response: Response;

  try {
    response = await fetchImpl(repository.latestReleaseApiUrl, {
      headers: {
        accept: 'application/vnd.github+json',
        'user-agent': 'erdb/latest-release',
      },
      next: {
        revalidate: LATEST_GITHUB_RELEASE_TTL_SECONDS,
      },
    } as NextFetchInit);
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  let payload: GitHubReleaseApiResponse;

  try {
    payload = (await response.json()) as GitHubReleaseApiResponse;
  } catch {
    return null;
  }

  const tagName = normalizeReleaseTag(payload.tag_name);
  if (!tagName) {
    return null;
  }

  const url =
    typeof payload.html_url === 'string' && payload.html_url.trim()
      ? payload.html_url.trim()
      : `${repository.htmlUrl}/releases`;

  return {
    tagName,
    url,
    publishedAt:
      typeof payload.published_at === 'string' && payload.published_at.trim()
        ? payload.published_at.trim()
        : null,
  };
}
