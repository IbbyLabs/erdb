import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveTmdbTranslationTarget } from '../lib/proxyMetaTranslation.ts';

test('anime metadata translation falls back through MAL reverse mapping', async () => {
  const tmdbUrls = [];
  const mappingUrls = [];

  const result = await resolveTmdbTranslationTarget({
    erdbId: 'myanimelist:1',
    metaType: 'series',
    tmdbKey: 'tmdb-key-123',
    lang: 'fr',
    fetchTmdbJson: async (url) => {
      tmdbUrls.push(url);
      if (url.includes('/tv/30991')) {
        return {
          name: 'Cowboy Bebop',
          overview: 'French overview',
        };
      }
      return null;
    },
    fetchAnimeMappingJson: async (url) => {
      mappingUrls.push(url);
      return {
        ok: true,
        requested: {
          provider: 'mal',
          externalId: '1',
        },
        kitsu: {
          subtype: 'TV',
        },
        mappings: {
          ids: {
            tmdb: '30991',
          },
        },
      };
    },
  });

  assert.deepEqual(result, {
    id: 30991,
    type: 'tv',
    details: {
      name: 'Cowboy Bebop',
      overview: 'French overview',
    },
  });
  assert.deepEqual(mappingUrls, ['https://animemapping.stremio.dpdns.org/mal/1']);
  assert.equal(tmdbUrls.length, 1);
  assert.match(tmdbUrls[0], /\/tv\/30991\?/);
});

test('direct IMDb translation does not invoke anime reverse mapping', async () => {
  let animeMappingCalls = 0;
  const tmdbUrls = [];

  const result = await resolveTmdbTranslationTarget({
    erdbId: 'tt0213338',
    metaType: 'series',
    tmdbKey: 'tmdb-key-123',
    lang: 'fr',
    fetchTmdbJson: async (url) => {
      tmdbUrls.push(url);
      if (url.includes('/find/tt0213338')) {
        return {
          movie_results: [],
          tv_results: [{ id: 30991 }],
        };
      }
      if (url.includes('/tv/30991')) {
        return {
          name: 'Cowboy Bebop',
          overview: 'French overview',
        };
      }
      return null;
    },
    fetchAnimeMappingJson: async () => {
      animeMappingCalls += 1;
      return null;
    },
  });

  assert.equal(animeMappingCalls, 0);
  assert.deepEqual(result, {
    id: 30991,
    type: 'tv',
    details: {
      name: 'Cowboy Bebop',
      overview: 'French overview',
    },
  });
  assert.equal(tmdbUrls.length, 2);
  assert.match(tmdbUrls[0], /\/find\/tt0213338\?/);
  assert.match(tmdbUrls[1], /\/tv\/30991\?/);
});

test('anime mapping translation falls back to the alternate TMDB media type when needed', async () => {
  const tmdbUrls = [];

  const result = await resolveTmdbTranslationTarget({
    erdbId: 'anilist:16498',
    metaType: 'series',
    tmdbKey: 'tmdb-key-123',
    lang: 'fr',
    fetchTmdbJson: async (url) => {
      tmdbUrls.push(url);
      if (url.includes('/tv/1429')) {
        return null;
      }
      if (url.includes('/movie/1429')) {
        return {
          title: 'Spirited Away',
          overview: 'French overview',
        };
      }
      return null;
    },
    fetchAnimeMappingJson: async () => ({
      ok: true,
      kitsu: {
        subtype: 'movie',
      },
      mappings: {
        ids: {
          tmdb: '1429',
        },
      },
    }),
  });

  assert.deepEqual(result, {
    id: 1429,
    type: 'movie',
    details: {
      title: 'Spirited Away',
      overview: 'French overview',
    },
  });
  assert.equal(tmdbUrls.length, 2);
  assert.match(tmdbUrls[0], /\/tv\/1429\?/);
  assert.match(tmdbUrls[1], /\/movie\/1429\?/);
});
