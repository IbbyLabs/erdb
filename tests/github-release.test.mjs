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
      releasesApiUrl: 'https://api.github.com/repos/IbbyLabs/erdb/releases?per_page=100',
    }
  );

  assert.deepEqual(
    parseGitHubRepositoryUrl('https://github.com/IbbyLabs/erdb#readme'),
    {
      owner: 'IbbyLabs',
      name: 'erdb',
      htmlUrl: 'https://github.com/IbbyLabs/erdb',
      latestReleaseApiUrl: 'https://api.github.com/repos/IbbyLabs/erdb/releases/latest',
      releasesApiUrl: 'https://api.github.com/repos/IbbyLabs/erdb/releases?per_page=100',
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
      assert.equal(url, 'https://api.github.com/repos/IbbyLabs/erdb/releases?per_page=100');
      assert.equal(init?.headers?.accept, 'application/vnd.github+json');

      return new Response(
        JSON.stringify([
          {
            tag_name: 'v2.24.1',
            html_url: 'https://github.com/IbbyLabs/erdb/releases/tag/v2.24.1',
            published_at: '2026-03-23T19:13:31Z',
            draft: false,
            prerelease: false,
          },
          {
            tag_name: 'v2.24.0',
            html_url: 'https://github.com/IbbyLabs/erdb/releases/tag/v2.24.0',
            published_at: '2026-03-23T08:48:01Z',
            draft: false,
            prerelease: false,
          },
        ]),
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
    tagName: 'v2.24.1',
    url: 'https://github.com/IbbyLabs/erdb/releases/tag/v2.24.1',
    publishedAt: '2026-03-23T19:13:31Z',
  });
});

test('fetchLatestGitHubRelease ignores drafts and prereleases while choosing the highest published version', async () => {
  const release = await fetchLatestGitHubRelease({
    repository: parseGitHubRepositoryUrl('https://github.com/IbbyLabs/erdb'),
    fetchImpl: async () =>
      new Response(
        JSON.stringify([
          {
            tag_name: 'v2.24.3',
            html_url: 'https://github.com/IbbyLabs/erdb/releases/tag/v2.24.3',
            published_at: '2026-03-23T21:00:00Z',
            draft: true,
            prerelease: false,
          },
          {
            tag_name: 'v2.24.2',
            html_url: 'https://github.com/IbbyLabs/erdb/releases/tag/v2.24.2',
            published_at: '2026-03-23T20:00:00Z',
            draft: false,
            prerelease: true,
          },
          {
            tag_name: 'v2.24.10',
            html_url: 'https://github.com/IbbyLabs/erdb/releases/tag/v2.24.10',
            published_at: '2026-03-23T22:00:00Z',
            draft: false,
            prerelease: false,
          },
          {
            tag_name: 'v2.24.9',
            html_url: 'https://github.com/IbbyLabs/erdb/releases/tag/v2.24.9',
            published_at: '2026-03-23T23:00:00Z',
            draft: false,
            prerelease: false,
          },
        ]),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      ),
  });

  assert.deepEqual(release, {
    tagName: 'v2.24.10',
    url: 'https://github.com/IbbyLabs/erdb/releases/tag/v2.24.10',
    publishedAt: '2026-03-23T22:00:00Z',
  });
});

test('fetchLatestGitHubRelease falls back to null when the release is unavailable', async () => {
  const release = await fetchLatestGitHubRelease({
    repository: parseGitHubRepositoryUrl('https://github.com/IbbyLabs/erdb'),
    fetchImpl: async () => new Response('not found', { status: 404 }),
  });

  assert.equal(release, null);
});
