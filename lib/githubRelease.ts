export const LATEST_GITHUB_RELEASE_TTL_SECONDS = 60;
const DEFAULT_GITHUB_REPOSITORY_URL = 'https://github.com/IbbyLabs/erdb';

export type GitHubRepository = {
  owner: string;
  name: string;
  htmlUrl: string;
  latestReleaseApiUrl: string;
  releasesApiUrl: string;
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
  draft?: unknown;
  prerelease?: unknown;
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
    releasesApiUrl: `https://api.github.com/repos/${owner}/${name}/releases?per_page=100`,
  };
}

function parseReleaseVersionParts(tagName: string): number[] | null {
  const normalized = normalizeReleaseTag(tagName);
  if (!normalized) {
    return null;
  }

  const coreVersion = normalized.replace(/^v/i, '').split(/[+-]/, 1)[0];
  if (!coreVersion) {
    return null;
  }

  const parts = coreVersion.split('.');
  if (!parts.length || parts.some((part) => !/^\d+$/.test(part))) {
    return null;
  }

  return parts.map((part) => Number(part));
}

function compareReleaseTagVersions(leftTagName: string, rightTagName: string): number {
  const leftParts = parseReleaseVersionParts(leftTagName);
  const rightParts = parseReleaseVersionParts(rightTagName);

  if (leftParts && rightParts) {
    const maxLength = Math.max(leftParts.length, rightParts.length);
    for (let index = 0; index < maxLength; index += 1) {
      const leftPart = leftParts[index] ?? 0;
      const rightPart = rightParts[index] ?? 0;
      if (leftPart !== rightPart) {
        return leftPart - rightPart;
      }
    }
  } else if (leftParts || rightParts) {
    return leftParts ? 1 : -1;
  }

  return leftTagName.localeCompare(rightTagName, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

function parsePublishedTimestamp(value: string | null): number {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
}

function selectLatestPublishedRelease(
  payload: GitHubReleaseApiResponse[],
  repository: GitHubRepository
): LatestGitHubRelease | null {
  const releases = payload
    .filter((entry) => entry?.draft !== true && entry?.prerelease !== true)
    .map((entry) => {
      const tagName = normalizeReleaseTag(entry.tag_name);
      if (!tagName) {
        return null;
      }

      const url =
        typeof entry.html_url === 'string' && entry.html_url.trim()
          ? entry.html_url.trim()
          : `${repository.htmlUrl}/releases/tag/${tagName}`;

      return {
        tagName,
        url,
        publishedAt:
          typeof entry.published_at === 'string' && entry.published_at.trim()
            ? entry.published_at.trim()
            : null,
      } satisfies LatestGitHubRelease;
    })
    .filter((entry): entry is LatestGitHubRelease => Boolean(entry));

  if (!releases.length) {
    return null;
  }

  releases.sort((left, right) => {
    const versionDifference = compareReleaseTagVersions(left.tagName, right.tagName);
    if (versionDifference !== 0) {
      return versionDifference;
    }

    return parsePublishedTimestamp(left.publishedAt) - parsePublishedTimestamp(right.publishedAt);
  });

  return releases.at(-1) ?? null;
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
    response = await fetchImpl(repository.releasesApiUrl, {
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

  let payload: GitHubReleaseApiResponse[];

  try {
    payload = (await response.json()) as GitHubReleaseApiResponse[];
  } catch {
    return null;
  }

  if (!Array.isArray(payload)) {
    return null;
  }

  return selectLatestPublishedRelease(payload, repository);
}
