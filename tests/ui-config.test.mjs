import test from 'node:test';
import assert from 'node:assert/strict';

import { decodeProxyConfig, normalizeErdbId } from '../lib/addonProxy.ts';
import { encodeRatingProviderAppearanceOverrides } from '../lib/badgeCustomization.ts';
import {
  buildConfigString,
  buildProxyUrl,
  decodeBase64Url,
  normalizeSavedUiConfig,
  parseSavedUiConfig,
  serializeSavedUiConfig,
} from '../lib/uiConfig.ts';

const SAMPLE_PROVIDER_APPEARANCE = {
  trakt: {
    iconUrl: 'https://cdn.example.com/trakt-custom.svg',
    accentColor: '#7c3aed',
    iconScalePercent: 118,
  },
  imdb: {
    accentColor: '#facc15',
  },
};

const buildSampleSettings = () =>
  normalizeSavedUiConfig({
    settings: {
      tmdbKey: 'tmdb-key-123',
      mdblistKey: 'mdblist-key-456',
      fanartKey: 'fanart-key-789',
      lang: 'fr',
      posterImageText: 'clean',
      backdropImageText: 'clean',
      posterArtworkSource: 'fanart',
      backdropArtworkSource: 'fanart',
      logoArtworkSource: 'fanart',
      genreBadgeMode: 'both',
      posterRatingPreferences: ['imdb', 'tmdb'],
      backdropRatingPreferences: ['mdblist'],
      logoRatingPreferences: [],
      posterStreamBadges: 'on',
      backdropStreamBadges: 'off',
      qualityBadgesSide: 'right',
      posterQualityBadgesStyle: 'media',
      backdropQualityBadgesStyle: 'plain',
      posterQualityBadgePreferences: ['certification', 'hdr', 'remux'],
      backdropQualityBadgePreferences: ['4k', 'dolbyatmos'],
      posterQualityBadgesMax: 2,
      backdropQualityBadgesMax: 3,
      posterRatingsLayout: 'top-bottom',
      backdropRatingsLayout: 'right-vertical',
      posterRatingsMax: 5,
      backdropRatingsMax: 4,
      sideRatingsPosition: 'custom',
      sideRatingsOffset: 62,
      posterRatingStyle: 'square',
      backdropRatingStyle: 'plain',
      logoRatingStyle: 'glass',
      posterRatingBadgeScale: 114,
      backdropRatingBadgeScale: 108,
      logoRatingBadgeScale: 96,
      posterQualityBadgeScale: 120,
      backdropQualityBadgeScale: 104,
      posterRatingPresentation: 'minimal',
      backdropRatingPresentation: 'average',
      logoRatingPresentation: 'blockbuster',
      posterAggregateRatingSource: 'audience',
      backdropAggregateRatingSource: 'critics',
      logoAggregateRatingSource: 'overall',
      posterRatingsMaxPerSide: 7,
      logoRatingsMax: 4,
      logoBackground: 'dark',
      ratingProviderAppearanceOverrides: SAMPLE_PROVIDER_APPEARANCE,
    },
    proxy: {
      manifestUrl: 'stremio://addon.example.com/manifest.json',
      translateMeta: true,
      translateMetaMode: 'prefer-requested-language',
      debugMetaTranslation: true,
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
      fanartKey: 'fanart-key-789',
      lang: 'fr',
      posterImageText: 'clean',
      backdropImageText: 'clean',
      posterArtworkSource: 'fanart',
      backdropArtworkSource: 'fanart',
      logoArtworkSource: 'fanart',
      genreBadgeMode: 'both',
      posterRatingPreferences: ['imdb', 'tmdb'],
      backdropRatingPreferences: ['mdblist'],
      logoRatingPreferences: [],
      posterStreamBadges: 'on',
      backdropStreamBadges: 'off',
      qualityBadgesSide: 'right',
      posterQualityBadgesPosition: 'auto',
      posterQualityBadgePreferences: ['certification', 'hdr', 'remux'],
      backdropQualityBadgePreferences: ['4k', 'dolbyatmos'],
      posterQualityBadgesStyle: 'media',
      backdropQualityBadgesStyle: 'plain',
      posterQualityBadgesMax: 2,
      backdropQualityBadgesMax: 3,
      posterRatingsLayout: 'top-bottom',
      backdropRatingsLayout: 'right-vertical',
      posterRatingsMax: 5,
      backdropRatingsMax: 4,
      sideRatingsPosition: 'custom',
      sideRatingsOffset: 62,
      posterRatingStyle: 'square',
      backdropRatingStyle: 'plain',
      logoRatingStyle: 'glass',
      posterRatingBadgeScale: 114,
      backdropRatingBadgeScale: 108,
      logoRatingBadgeScale: 96,
      posterQualityBadgeScale: 120,
      backdropQualityBadgeScale: 104,
      posterRatingPresentation: 'minimal',
      backdropRatingPresentation: 'average',
      logoRatingPresentation: 'blockbuster',
      posterAggregateRatingSource: 'audience',
      backdropAggregateRatingSource: 'critics',
      logoAggregateRatingSource: 'overall',
      posterRatingsMaxPerSide: 7,
      logoRatingsMax: 4,
      logoBackground: 'dark',
      ratingProviderAppearanceOverrides: SAMPLE_PROVIDER_APPEARANCE,
    },
    proxy: {
      manifestUrl: 'https://addon.example.com/manifest.json',
      translateMeta: true,
      translateMetaMode: 'prefer-requested-language',
      debugMetaTranslation: true,
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
    translateMeta: false,
    translateMetaMode: 'fill-missing',
    debugMetaTranslation: false,
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
    fanartKey: 'fanart-key-789',
    posterRatings: 'imdb,tmdb',
    backdropRatings: 'mdblist',
    logoRatings: '',
    lang: 'fr',
    genreBadge: 'both',
    posterStreamBadges: 'on',
    backdropStreamBadges: 'off',
    qualityBadgesSide: 'right',
    posterQualityBadges: 'certification,hdr,remux',
    backdropQualityBadges: '4k,dolbyatmos',
    posterQualityBadgesStyle: 'media',
    backdropQualityBadgesStyle: 'plain',
    posterQualityBadgesMax: 2,
    backdropQualityBadgesMax: 3,
    posterRatingStyle: 'square',
    backdropRatingStyle: 'plain',
    logoRatingStyle: 'glass',
    posterRatingBadgeScale: 114,
    backdropRatingBadgeScale: 108,
    logoRatingBadgeScale: 96,
    posterQualityBadgeScale: 120,
    backdropQualityBadgeScale: 104,
    posterRatingPresentation: 'minimal',
    backdropRatingPresentation: 'average',
    logoRatingPresentation: 'blockbuster',
    posterAggregateRatingSource: 'audience',
    backdropAggregateRatingSource: 'critics',
    posterImageText: 'clean',
    backdropImageText: 'clean',
    posterArtworkSource: 'fanart',
    backdropArtworkSource: 'fanart',
    posterRatingsLayout: 'top-bottom',
    posterRatingsMax: 5,
    backdropRatingsLayout: 'right-vertical',
    backdropRatingsMax: 4,
    sideRatingsPosition: 'custom',
    sideRatingsOffset: 62,
    logoRatingsMax: 4,
    logoBackground: 'dark',
    logoArtworkSource: 'fanart',
    providerAppearance: encodeRatingProviderAppearanceOverrides(SAMPLE_PROVIDER_APPEARANCE),
  });

  const proxyUrl = buildProxyUrl(baseUrl, config.proxy, config.settings);
  assert.match(proxyUrl, /^https:\/\/erdb\.example\.com\/proxy\/.+\/manifest\.json$/);

  const encodedConfig = proxyUrl.split('/proxy/')[1]?.replace('/manifest.json', '');
  assert.ok(encodedConfig);

  const decodedProxy = decodeProxyConfig(encodedConfig);
  assert.deepEqual(decodedProxy, {
    url: 'https://addon.example.com/manifest.json',
    tmdbKey: 'tmdb-key-123',
    mdblistKey: 'mdblist-key-456',
    fanartKey: 'fanart-key-789',
    translateMeta: true,
    translateMetaMode: 'prefer-requested-language',
    debugMetaTranslation: true,
    posterRatings: 'imdb,tmdb',
    backdropRatings: 'mdblist',
    logoRatings: '',
    lang: 'fr',
    genreBadge: 'both',
    posterStreamBadges: 'on',
    backdropStreamBadges: 'off',
    qualityBadgesSide: 'right',
    posterQualityBadges: 'certification,hdr,remux',
    backdropQualityBadges: '4k,dolbyatmos',
    posterQualityBadgesStyle: 'media',
    backdropQualityBadgesStyle: 'plain',
    posterQualityBadgeScale: '120',
    backdropQualityBadgeScale: '104',
    posterQualityBadgesMax: '2',
    backdropQualityBadgesMax: '3',
    posterRatingStyle: 'square',
    backdropRatingStyle: 'plain',
    logoRatingStyle: 'glass',
    posterRatingBadgeScale: '114',
    backdropRatingBadgeScale: '108',
    logoRatingBadgeScale: '96',
    posterRatingPresentation: 'minimal',
    backdropRatingPresentation: 'average',
    logoRatingPresentation: 'blockbuster',
    posterAggregateRatingSource: 'audience',
    backdropAggregateRatingSource: 'critics',
    posterImageText: 'clean',
    backdropImageText: 'clean',
    posterArtworkSource: 'fanart',
    backdropArtworkSource: 'fanart',
    posterRatingsLayout: 'top-bottom',
    posterRatingsMax: '5',
    backdropRatingsLayout: 'right-vertical',
    backdropRatingsMax: '4',
    sideRatingsPosition: 'custom',
    sideRatingsOffset: '62',
    logoRatingsMax: '4',
    logoBackground: 'dark',
    logoArtworkSource: 'fanart',
    providerAppearance: encodeRatingProviderAppearanceOverrides(SAMPLE_PROVIDER_APPEARANCE),
    erdbBase: 'https://erdb.example.com',
  });
});

test('proxy manifest generation stops when required inputs are missing', () => {
  const config = buildSampleSettings();

  assert.equal(
    buildProxyUrl('https://erdb.example.com', { ...config.proxy, manifestUrl: '' }, config.settings),
    '',
  );

  assert.equal(
    buildProxyUrl(
      'https://erdb.example.com',
      {
        ...config.proxy,
        manifestUrl: 'https://addon.example.com/manifest.json',
      },
      {
        ...config.settings,
        tmdbKey: '',
      },
    ),
    '',
  );
});

test('workspace normalization accepts spaced layout values from the page docs', () => {
  const config = normalizeSavedUiConfig({
    settings: {
      posterRatingsLayout: 'left right',
      backdropRatingsLayout: 'right vertical',
    },
  });

  assert.equal(config.settings.posterRatingsLayout, 'left-right');
  assert.equal(config.settings.backdropRatingsLayout, 'right-vertical');
});

test('workspace normalization maps legacy fanart poster mode into artwork source state', () => {
  const config = normalizeSavedUiConfig({
    settings: {
      posterImageText: 'fanartclean',
      backdropImageText: 'fanartclean',
    },
  });

  assert.equal(config.settings.posterImageText, 'clean');
  assert.equal(config.settings.backdropImageText, 'clean');
  assert.equal(config.settings.posterArtworkSource, 'fanart');
  assert.equal(config.settings.backdropArtworkSource, 'fanart');
});

test('proxy ID normalization canonicalizes MAL aliases for anime image rewrites', () => {
  assert.equal(normalizeErdbId('mal:456', 'series'), 'mal:456');
  assert.equal(normalizeErdbId('myanimelist:456', 'series'), 'mal:456');
  assert.equal(normalizeErdbId('anilist:123', 'series'), 'anilist:123');
  assert.equal(normalizeErdbId('anidb:789', 'series'), 'anidb:789');
});
