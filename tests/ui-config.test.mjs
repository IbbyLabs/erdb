import test from 'node:test';
import assert from 'node:assert/strict';

import { decodeProxyConfig, normalizeErdbId } from '../lib/addonProxy.ts';
import { encodeRatingProviderAppearanceOverrides } from '../lib/badgeCustomization.ts';
import {
  buildAiometadataUrlPatterns,
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
    stackedWidthPercent: 86,
    stackedSurfaceOpacityPercent: 74,
    stackedAccentMode: 'logo',
    stackedLineVisible: false,
    stackedLineWidthPercent: 86,
  },
  imdb: {
    accentColor: '#facc15',
    stackedWidthPercent: 92,
    stackedLineHeightPercent: 124,
  },
};

const buildSampleSettings = () =>
  normalizeSavedUiConfig({
    settings: {
      erdbKey: 'shared-erdb-key-000',
      tmdbKey: 'tmdb-key-123',
      mdblistKey: 'mdblist-key-456',
      fanartKey: 'fanart-key-789',
      lang: 'fr',
      posterImageText: 'clean',
      backdropImageText: 'clean',
      posterArtworkSource: 'fanart',
      backdropArtworkSource: 'fanart',
      logoArtworkSource: 'fanart',
      ratingValueMode: 'normalized',
      genreBadgeMode: 'both',
      genreBadgeScale: 118,
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
      logoRatingStyle: 'stacked',
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
      erdbKey: 'shared-erdb-key-000',
      tmdbKey: 'tmdb-key-123',
      mdblistKey: 'mdblist-key-456',
      fanartKey: 'fanart-key-789',
      lang: 'fr',
      posterImageText: 'clean',
      backdropImageText: 'clean',
      posterArtworkSource: 'fanart',
      backdropArtworkSource: 'fanart',
      logoArtworkSource: 'fanart',
      ratingValueMode: 'normalized',
      genreBadgeMode: 'both',
      genreBadgeScale: 118,
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
      logoRatingStyle: 'stacked',
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
    erdbKey: 'shared-erdb-key-000',
    tmdbKey: 'tmdb-key-123',
    mdblistKey: 'mdblist-key-456',
    fanartKey: 'fanart-key-789',
    posterRatings: 'imdb,tmdb',
    backdropRatings: 'mdblist',
    logoRatings: '',
    lang: 'fr',
    ratingValueMode: 'normalized',
    genreBadge: 'both',
    genreBadgeScale: 118,
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
    logoRatingStyle: 'stacked',
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
    erdbKey: 'shared-erdb-key-000',
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
    ratingValueMode: 'normalized',
    genreBadge: 'both',
    genreBadgeScale: '118',
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
    logoRatingStyle: 'stacked',
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

test('AIOMetadata export builds masked patterns with placeholders', () => {
  const config = buildSampleSettings();

  const patterns = buildAiometadataUrlPatterns('https://erdb.example.com/', config.settings, {
    hideCredentials: true,
  });

  assert.equal(patterns?.posterUrlPattern.startsWith('https://erdb.example.com/poster/{imdb_id}.jpg?'), true);
  assert.equal(
    patterns?.backgroundUrlPattern.startsWith(
      'https://erdb.example.com/backdrop/{tmdb_id}.jpg?idSource=tmdb&',
    ),
    true,
  );
  assert.equal(
    patterns?.logoUrlPattern.startsWith('https://erdb.example.com/logo/{tmdb_id}.png?idSource=tmdb&'),
    true,
  );
  assert.equal(
    patterns?.episodeThumbnailUrlPattern.startsWith(
      'https://erdb.example.com/thumbnail/{imdb_id}/S{season}E{episode}.jpg?',
    ),
    true,
  );

  for (const value of Object.values(patterns ?? {})) {
    assert.match(value, /erdbKey=\{erdb_key\}/);
    assert.match(value, /tmdbKey=\{tmdb_key\}/);
    assert.match(value, /mdblistKey=\{mdblist_key\}/);
    assert.match(value, /fanartKey=\{fanart_key\}/);
    assert.match(value, /posterRatings=imdb%2Ctmdb/);
    assert.match(value, /backdropRatings=mdblist/);
    assert.match(value, /lang=fr/);
    assert.match(value, /qualityBadgesSide=right/);
    assert.match(value, /posterRatingsLayout=top-bottom/);
    assert.match(value, /backdropRatingsLayout=right-vertical/);
    assert.match(
      value,
      new RegExp(`providerAppearance=${encodeRatingProviderAppearanceOverrides(SAMPLE_PROVIDER_APPEARANCE)}`),
    );
    assert.equal(value.includes('%7Btmdb_key%7D'), false);
    assert.equal(value.includes('%7Bmdblist_key%7D'), false);
    assert.equal(value.includes('%7Bfanart_key%7D'), false);
    assert.equal(value.includes('%7Berdb_key%7D'), false);
  }

  assert.match(patterns?.backgroundUrlPattern ?? '', /idSource=tmdb/);
  assert.match(patterns?.logoUrlPattern ?? '', /idSource=tmdb/);
});

test('AIOMetadata export can keep live credentials while preserving live AIOM defaults', () => {
  const config = buildSampleSettings();

  const patterns = buildAiometadataUrlPatterns('https://erdb.example.com/', config.settings, {
    hideCredentials: false,
  });

  assert.equal(
    patterns?.posterUrlPattern.startsWith('https://erdb.example.com/poster/{imdb_id}.jpg?'),
    true,
  );
  assert.equal(
    patterns?.backgroundUrlPattern.startsWith('https://erdb.example.com/backdrop/{tmdb_id}.jpg?idSource=tmdb&'),
    true,
  );
  assert.equal(
    patterns?.logoUrlPattern.startsWith('https://erdb.example.com/logo/{tmdb_id}.png?idSource=tmdb&'),
    true,
  );
  assert.equal(
    patterns?.episodeThumbnailUrlPattern.startsWith(
      'https://erdb.example.com/thumbnail/{imdb_id}/S{season}E{episode}.jpg?',
    ),
    true,
  );

  for (const value of Object.values(patterns ?? {})) {
    assert.match(value, /tmdbKey=tmdb-key-123/);
    assert.match(value, /mdblistKey=mdblist-key-456/);
    assert.match(value, /erdbKey=shared-erdb-key-000/);
    assert.match(value, /fanartKey=fanart-key-789/);
  }
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

test('workspace normalization accepts cinemeta as a poster artwork source', () => {
  const config = normalizeSavedUiConfig({
    settings: {
      posterArtworkSource: 'cinemeta',
      backdropArtworkSource: 'cinemeta',
      logoArtworkSource: 'cinemeta',
    },
  });

  assert.equal(config.settings.posterArtworkSource, 'cinemeta');
  assert.equal(config.settings.backdropArtworkSource, 'cinemeta');
  assert.equal(config.settings.logoArtworkSource, 'cinemeta');
});

test('proxy ID normalization canonicalizes MAL aliases for anime image rewrites', () => {
  assert.equal(normalizeErdbId('mal:456', 'series'), 'mal:456');
  assert.equal(normalizeErdbId('myanimelist:456', 'series'), 'mal:456');
  assert.equal(normalizeErdbId('anilist:123:2', 'series'), 'anilist:123:2');
  assert.equal(normalizeErdbId('tvdb:789:3', 'series'), 'tvdb:789:3');
  assert.equal(normalizeErdbId('anidb:789', 'series'), 'anidb:789');
  assert.equal(normalizeErdbId('tt0944947:2', 'series'), 'tt0944947:2');
  assert.equal(normalizeErdbId('imdb:tt0944947:2', 'series'), 'imdb:tt0944947:2');
  assert.equal(normalizeErdbId('tmdb:tv:1399:2', 'series'), 'tmdb:tv:1399:2');
});
