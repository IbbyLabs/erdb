import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildReadmePreviewTargetUrl,
  getReadmePreviewDefinitions,
  resolveReadmePreviewDefinition,
  resolveReadmePreviewOrigin,
} from '../lib/readmePreview.ts';

test('README preview slugs resolve to curated definitions', () => {
  const slugs = getReadmePreviewDefinitions().map((definition) => definition.slug);

  assert.ok(slugs.includes('the-boys-poster'));
  assert.ok(slugs.includes('attack-on-titan-logo'));
  assert.equal(resolveReadmePreviewDefinition('the-boys-poster')?.imageType, 'poster');
  assert.equal(resolveReadmePreviewDefinition('attack-on-titan-logo')?.imageType, 'logo');
  assert.equal(resolveReadmePreviewDefinition('missing-slug'), null);
});

test('README preview target URLs inject the dedicated keys server side', () => {
  const definition = resolveReadmePreviewDefinition('attack-on-titan-poster');
  assert.ok(definition);

  const url = buildReadmePreviewTargetUrl({
    origin: 'https://erdb.ibbylabs.dev',
    definition,
    tmdbKey: 'tmdb-preview-key',
    mdblistKey: 'mdblist-preview-key',
    cacheBuster: 'preview123',
  });

  assert.equal(
    url.toString(),
    'https://erdb.ibbylabs.dev/poster/mal%3A16498.jpg?tmdbKey=tmdb-preview-key&mdblistKey=mdblist-preview-key&lang=ja&posterRatings=tmdb%2Canilist%2Ckitsu&posterRatingsLayout=top+bottom&posterStreamBadges=off&ratingStyle=glass&imageText=original&cb=preview123'
  );
});

test('README preview origin prefers the internal app origin when configured', () => {
  assert.equal(
    resolveReadmePreviewOrigin({
      requestOrigin: 'https://erdb.ibbylabs.dev',
      internalOrigin: 'http://127.0.0.1:3000/',
    }),
    'http://127.0.0.1:3000/'
  );

  assert.equal(
    resolveReadmePreviewOrigin({
      requestOrigin: 'https://erdb.ibbylabs.dev',
      internalOrigin: 'not a url',
    }),
    'https://erdb.ibbylabs.dev'
  );
});
