import test from 'node:test';
import assert from 'node:assert/strict';

import {
  fetchLatestGitHubRelease,
  parseGitHubRepositoryUrl,
} from '../lib/githubRelease.ts';

test('parseGitHubRepositoryUrl resolves repository metadata from GitHub URLs', () => {
  assert.deepEqual(
    parseGitHubRepositoryUrl('git+https://github.com/IbbyLabs/erdb.git'),
    {
      owner: 'IbbyLabs',
      name: 'erdb',
      htmlUrl: 'https://github.com/IbbyLabs/erdb',
      latestReleaseApiUrl: 'https://api.github.com/repos/IbbyLabs/erdb/releases/latest',
    }
  );

  assert.deepEqual(
    parseGitHubRepositoryUrl('https://github.com/IbbyLabs/erdb#readme'),
    {
      owner: 'IbbyLabs',
      name: 'erdb',
      htmlUrl: 'https://github.com/IbbyLabs/erdb',
      latestReleaseApiUrl: 'https://api.github.com/repos/IbbyLabs/erdb/releases/latest',
    }
  );
});

test('parseGitHubRepositoryUrl ignores non GitHub URLs', () => {
  assert.equal(parseGitHubRepositoryUrl('https://example.com/IbbyLabs/erdb'), null);
  assert.equal(parseGitHubRepositoryUrl(''), null);
});

test('fetchLatestGitHubRelease returns the latest release payload', async () => {
  const release = await fetchLatestGitHubRelease({
    repository: parseGitHubRepositoryUrl('https://github.com/IbbyLabs/erdb'),
    fetchImpl: async (url, init) => {
      assert.equal(url, 'https://api.github.com/repos/IbbyLabs/erdb/releases/latest');
      assert.equal(init?.headers?.accept, 'application/vnd.github+json');

      return new Response(
        JSON.stringify({
          tag_name: 'v2.23.5',
          html_url: 'https://github.com/IbbyLabs/erdb/releases/tag/v2.23.5',
          published_at: '2026-03-23T10:00:00Z',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    },
  });

  assert.deepEqual(release, {
    tagName: 'v2.23.5',
    url: 'https://github.com/IbbyLabs/erdb/releases/tag/v2.23.5',
    publishedAt: '2026-03-23T10:00:00Z',
  });
});

test('fetchLatestGitHubRelease falls back to null when the release is unavailable', async () => {
  const release = await fetchLatestGitHubRelease({
    repository: parseGitHubRepositoryUrl('https://github.com/IbbyLabs/erdb'),
    fetchImpl: async () => new Response('not found', { status: 404 }),
  });

  assert.equal(release, null);
});
