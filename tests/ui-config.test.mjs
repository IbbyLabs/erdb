import test from 'node:test';
import assert from 'node:assert/strict';

import { decodeProxyConfig } from '../lib/addonProxy.ts';
import {
  buildConfigString,
  buildProxyUrl,
  decodeBase64Url,
  normalizeSavedUiConfig,
  parseSavedUiConfig,
  serializeSavedUiConfig,
} from '../lib/uiConfig.ts';

const buildSampleSettings = () =>
  normalizeSavedUiConfig({
    settings: {
      tmdbKey: 'tmdb-key-123',
      mdblistKey: 'mdblist-key-456',
      lang: 'fr',
      posterImageText: 'original',
      backdropImageText: 'alternative',
      posterRatingPreferences: ['imdb', 'tmdb'],
      backdropRatingPreferences: ['mdblist'],
      logoRatingPreferences: [],
      posterStreamBadges: 'on',
      backdropStreamBadges: 'off',
      qualityBadgesSide: 'right',
      posterQualityBadgesStyle: 'square',
      backdropQualityBadgesStyle: 'plain',
      posterRatingsLayout: 'top-bottom',
      backdropRatingsLayout: 'right-vertical',
      posterRatingStyle: 'square',
      backdropRatingStyle: 'plain',
      logoRatingStyle: 'glass',
      posterRatingsMaxPerSide: 7,
    },
    proxy: {
      manifestUrl: 'stremio://addon.example.com/manifest.json',
    },
  });

test('workspace serialization round-trips shared settings and proxy state', () => {
  const config = buildSampleSettings();

  const raw = serializeSavedUiConfig(config);
  const parsed = parseSavedUiConfig(raw);

  assert.deepEqual(parsed, {
    version: 1,
    settings: {
      tmdbKey: 'tmdb-key-123',
      mdblistKey: 'mdblist-key-456',
      lang: 'fr',
      posterImageText: 'original',
      backdropImageText: 'alternative',
      posterRatingPreferences: ['imdb', 'tmdb'],
      backdropRatingPreferences: ['mdblist'],
      logoRatingPreferences: [],
      posterStreamBadges: 'on',
      backdropStreamBadges: 'off',
      qualityBadgesSide: 'right',
      posterQualityBadgesStyle: 'square',
      backdropQualityBadgesStyle: 'plain',
      posterRatingsLayout: 'top-bottom',
      backdropRatingsLayout: 'right-vertical',
      posterRatingStyle: 'square',
      backdropRatingStyle: 'plain',
      logoRatingStyle: 'glass',
      posterRatingsMaxPerSide: 7,
    },
    proxy: {
      manifestUrl: 'https://addon.example.com/manifest.json',
    },
  });
});

test('workspace normalization ignores legacy proxy enabled flags', () => {
  const config = normalizeSavedUiConfig({
    settings: {
      tmdbKey: 'tmdb-key-123',
      mdblistKey: 'mdblist-key-456',
    },
    proxy: {
      manifestUrl: 'https://addon.example.com/manifest.json',
      enabledTypes: {
        poster: false,
        backdrop: false,
        logo: false,
      },
    },
  });

  assert.deepEqual(config.proxy, {
    manifestUrl: 'https://addon.example.com/manifest.json',
  });
});

test('config string and proxy manifest use the same shared ERDB settings', () => {
  const config = buildSampleSettings();
  const baseUrl = 'https://erdb.example.com/';

  const configString = buildConfigString(baseUrl, config.settings);
  assert.notEqual(configString, '');

  const decodedConfig = JSON.parse(decodeBase64Url(configString));
  assert.deepEqual(decodedConfig, {
    baseUrl: 'https://erdb.example.com',
    tmdbKey: 'tmdb-key-123',
    mdblistKey: 'mdblist-key-456',
    posterRatings: 'imdb,tmdb',
    backdropRatings: 'mdblist',
    logoRatings: '',
    lang: 'fr',
    posterStreamBadges: 'on',
    backdropStreamBadges: 'off',
    qualityBadgesSide: 'right',
    posterQualityBadgesStyle: 'square',
    backdropQualityBadgesStyle: 'plain',
    posterRatingStyle: 'square',
    backdropRatingStyle: 'plain',
    logoRatingStyle: 'glass',
    posterImageText: 'original',
    backdropImageText: 'alternative',
    posterRatingsLayout: 'top-bottom',
    backdropRatingsLayout: 'right-vertical',
  });

  const proxyUrl = buildProxyUrl(baseUrl, config.proxy.manifestUrl, config.settings);
  assert.match(proxyUrl, /^https:\/\/erdb\.example\.com\/proxy\/.+\/manifest\.json$/);

  const encodedConfig = proxyUrl.split('/proxy/')[1]?.replace('/manifest.json', '');
  assert.ok(encodedConfig);

  const decodedProxy = decodeProxyConfig(encodedConfig);
  assert.deepEqual(decodedProxy, {
    url: 'https://addon.example.com/manifest.json',
    tmdbKey: 'tmdb-key-123',
    mdblistKey: 'mdblist-key-456',
    posterRatings: 'imdb,tmdb',
    backdropRatings: 'mdblist',
    logoRatings: '',
    lang: 'fr',
    posterStreamBadges: 'on',
    backdropStreamBadges: 'off',
    qualityBadgesSide: 'right',
    posterQualityBadgesStyle: 'square',
    backdropQualityBadgesStyle: 'plain',
    posterRatingStyle: 'square',
    backdropRatingStyle: 'plain',
    logoRatingStyle: 'glass',
    posterImageText: 'original',
    backdropImageText: 'alternative',
    posterRatingsLayout: 'top-bottom',
    backdropRatingsLayout: 'right-vertical',
    erdbBase: 'https://erdb.example.com',
  });
});

test('proxy manifest generation stops when required inputs are missing', () => {
  const config = buildSampleSettings();

  assert.equal(
    buildProxyUrl('https://erdb.example.com', '', config.settings),
    '',
  );

  assert.equal(
    buildProxyUrl(
      'https://erdb.example.com',
      'https://addon.example.com/manifest.json',
      {
        ...config.settings,
        tmdbKey: '',
      },
    ),
    '',
  );
});
