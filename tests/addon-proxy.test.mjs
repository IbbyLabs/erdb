import test from 'node:test';
import assert from 'node:assert/strict';

import { buildErdbImageUrl, decodeProxyConfig } from '../lib/addonProxy.ts';
import { buildProxyUrl, normalizeSavedUiConfig } from '../lib/uiConfig.ts';

test('generated proxy manifest carries configurator settings into rewritten logo artwork', () => {
  const uiConfig = normalizeSavedUiConfig({
    settings: {
      tmdbKey: 'tmdb-key-123',
      mdblistKey: 'mdblist-key-456',
      lang: 'en',
      logoRatingPreferences: ['mdblist', 'tomatoes', 'letterboxd'],
      logoRatingStyle: 'plain',
      logoRatingPresentation: 'average',
      logoAggregateRatingSource: 'audience',
      logoRatingsMax: 3,
      logoBackground: 'dark',
    },
    proxy: {
      manifestUrl: 'https://addon.example.com/manifest.json',
    },
  });

  const proxyUrl = buildProxyUrl('https://erdb.example.com', uiConfig.proxy, uiConfig.settings);
  const encodedConfig = proxyUrl.split('/proxy/')[1]?.replace('/manifest.json', '');

  assert.ok(encodedConfig);

  const decodedProxyConfig = decodeProxyConfig(encodedConfig);
  assert.ok(decodedProxyConfig);

  const rewrittenLogoUrl = new URL(
    buildErdbImageUrl({
      reqUrl: new URL(
        `https://proxy.example.net/proxy/${encodedConfig}/meta/series/example.json?logoRatings=myanimelist,anilist&logoRatingsMax=1&logoBackground=transparent&logoRatingStyle=glass&lang=ja`
      ),
      imageType: 'logo',
      erdbId: 'mal:16498',
      tmdbKey: decodedProxyConfig.tmdbKey,
      mdblistKey: decodedProxyConfig.mdblistKey,
      config: decodedProxyConfig,
    })
  );

  assert.equal(rewrittenLogoUrl.origin, 'https://erdb.example.com');
  assert.equal(rewrittenLogoUrl.pathname, '/logo/mal%3A16498.jpg');
  assert.equal(rewrittenLogoUrl.searchParams.get('tmdbKey'), 'tmdb-key-123');
  assert.equal(rewrittenLogoUrl.searchParams.get('mdblistKey'), 'mdblist-key-456');
  assert.equal(rewrittenLogoUrl.searchParams.get('lang'), 'en');
  assert.equal(rewrittenLogoUrl.searchParams.get('logoRatings'), 'mdblist,tomatoes,letterboxd');
  assert.equal(rewrittenLogoUrl.searchParams.get('logoRatingsMax'), '3');
  assert.equal(rewrittenLogoUrl.searchParams.get('logoBackground'), 'dark');
  assert.equal(rewrittenLogoUrl.searchParams.get('logoRatingPresentation'), 'average');
  assert.equal(rewrittenLogoUrl.searchParams.get('logoAggregateRatingSource'), 'audience');
  assert.equal(rewrittenLogoUrl.searchParams.get('ratingStyle'), 'plain');
});
