import test from 'node:test';
import assert from 'node:assert/strict';

import {
  decodeProxyConfig,
  hasExplicitTmdbMediaTypeInErdbId,
  isAmbiguousTmdbErdbId,
  normalizeErdbId,
} from '../lib/addonProxy.ts';
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
      tmdbIdScope: 'strict',
      lang: 'fr',
      posterImageSize: 'large',
      posterImageText: 'clean',
      backdropImageText: 'clean',
      posterArtworkSource: 'fanart',
      backdropArtworkSource: 'fanart',
      logoArtworkSource: 'fanart',
      ratingValueMode: 'normalized',
      posterGenreBadgeMode: 'both',
      posterGenreBadgeStyle: 'square',
      posterGenreBadgePosition: 'bottomRight',
      posterGenreBadgeScale: 118,
      posterGenreBadgeAnimeGrouping: 'split',
      logoGenreBadgeMode: 'text',
      logoGenreBadgeStyle: 'plain',
      logoGenreBadgePosition: 'bottomCenter',
      logoGenreBadgeScale: 112,
      logoGenreBadgeAnimeGrouping: 'split',
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
      posterEdgeOffset: 24,
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
      aggregateAccentMode: 'custom',
      aggregateAccentColor: '#22d3ee',
      aggregateCriticsAccentColor: '#f97316',
      aggregateAudienceAccentColor: '#22c55e',
      aggregateAccentBarOffset: -3,
      aggregateAccentBarVisible: true,
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
      simklClientId: '',
      tmdbIdScope: 'strict',
      lang: 'fr',
      posterImageSize: 'large',
      posterImageText: 'clean',
      backdropImageText: 'clean',
      posterArtworkSource: 'fanart',
      backdropArtworkSource: 'fanart',
      logoArtworkSource: 'fanart',
      ratingValueMode: 'normalized',
      posterGenreBadgeMode: 'both',
      backdropGenreBadgeMode: 'off',
      logoGenreBadgeMode: 'text',
      posterGenreBadgeStyle: 'square',
      backdropGenreBadgeStyle: 'glass',
      logoGenreBadgeStyle: 'plain',
      posterGenreBadgePosition: 'bottomRight',
      backdropGenreBadgePosition: 'topLeft',
      logoGenreBadgePosition: 'bottomCenter',
      posterGenreBadgeScale: 118,
      backdropGenreBadgeScale: 100,
      logoGenreBadgeScale: 112,
      posterGenreBadgeAnimeGrouping: 'split',
      backdropGenreBadgeAnimeGrouping: 'split',
      logoGenreBadgeAnimeGrouping: 'split',
      posterRatingPreferences: ['imdb', 'tmdb'],
      backdropRatingPreferences: ['mdblist'],
      logoRatingPreferences: [],
      posterStreamBadges: 'on',
      backdropStreamBadges: 'off',
      qualityBadgesSide: 'right',
      posterQualityBadgesPosition: 'auto',
      posterQualityBadgePreferences: ['certification', 'hdr', 'remux'],
      backdropQualityBadgePreferences: ['4k', 'dolbyatmos'],
      logoQualityBadgePreferences: [
        'certification',
        '4k',
        'bluray',
        'hdr',
        'dolbyvision',
        'dolbyatmos',
        'remux',
      ],
      posterQualityBadgesStyle: 'media',
      backdropQualityBadgesStyle: 'plain',
      logoQualityBadgesStyle: 'glass',
      posterQualityBadgesMax: 2,
      backdropQualityBadgesMax: 3,
      logoQualityBadgesMax: null,
      posterRatingsLayout: 'top-bottom',
      backdropRatingsLayout: 'right-vertical',
      posterRatingsMax: 5,
      backdropRatingsMax: 4,
      posterEdgeOffset: 24,
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
      logoQualityBadgeScale: 100,
      posterRatingPresentation: 'minimal',
      backdropRatingPresentation: 'average',
      logoRatingPresentation: 'blockbuster',
      posterAggregateRatingSource: 'audience',
      backdropAggregateRatingSource: 'critics',
      logoAggregateRatingSource: 'overall',
      aggregateAccentMode: 'custom',
      aggregateAccentColor: '#22d3ee',
      aggregateCriticsAccentColor: '#f97316',
      aggregateAudienceAccentColor: '#22c55e',
      aggregateAccentBarOffset: -3,
      aggregateAccentBarVisible: true,
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

  const configString = buildConfigString('https://erdb.example.com', parsed.settings);
  assert.notEqual(configString, '');
  const decodedConfig = JSON.parse(decodeBase64Url(configString));
  assert.equal(decodedConfig.tmdbIdScope, 'strict');
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

test('workspace normalization accepts hundred point rating value aliases and preserves them in payloads', () => {
  const config = normalizeSavedUiConfig({
    settings: {
      tmdbKey: 'tmdb-key-123',
      mdblistKey: 'mdblist-key-456',
      ratingValueMode: 'normalized-100',
    },
  });

  assert.equal(config.settings.ratingValueMode, 'normalized100');

  const configString = buildConfigString('https://erdb.example.com', config.settings);
  assert.notEqual(configString, '');

  const decodedConfig = JSON.parse(decodeBase64Url(configString));
  assert.equal(decodedConfig.ratingValueMode, 'normalized100');
});

test('legacy shared genre badge settings expand to per type fields and re-compress in payloads', () => {
  const config = normalizeSavedUiConfig({
    settings: {
      tmdbKey: 'tmdb-key-123',
      mdblistKey: 'mdblist-key-456',
      genreBadgeMode: 'both',
      genreBadgeStyle: 'square',
      genreBadgePosition: 'bottomRight',
      genreBadgeScale: 118,
    },
  });

  assert.equal(config.settings.posterGenreBadgeMode, 'both');
  assert.equal(config.settings.backdropGenreBadgeMode, 'both');
  assert.equal(config.settings.logoGenreBadgeMode, 'both');
  assert.equal(config.settings.posterGenreBadgeStyle, 'square');
  assert.equal(config.settings.backdropGenreBadgeStyle, 'square');
  assert.equal(config.settings.logoGenreBadgeStyle, 'square');
  assert.equal(config.settings.posterGenreBadgePosition, 'bottomRight');
  assert.equal(config.settings.backdropGenreBadgePosition, 'bottomRight');
  assert.equal(config.settings.logoGenreBadgePosition, 'bottomRight');
  assert.equal(config.settings.posterGenreBadgeScale, 118);
  assert.equal(config.settings.backdropGenreBadgeScale, 118);
  assert.equal(config.settings.logoGenreBadgeScale, 118);

  const configString = buildConfigString('https://erdb.example.com', config.settings);
  assert.notEqual(configString, '');

  const decodedConfig = JSON.parse(decodeBase64Url(configString));
  assert.equal(decodedConfig.genreBadge, 'both');
  assert.equal(decodedConfig.genreBadgeStyle, 'square');
  assert.equal(decodedConfig.genreBadgePosition, 'bottomRight');
  assert.equal(decodedConfig.genreBadgeScale, 118);
  assert.equal(decodedConfig.posterGenreBadge, undefined);
  assert.equal(decodedConfig.backdropGenreBadge, undefined);
  assert.equal(decodedConfig.logoGenreBadge, undefined);
});

test('workspace normalization preserves compact dual aggregate presentation aliases', () => {
  const config = normalizeSavedUiConfig({
    settings: {
      tmdbKey: 'tmdb-key-123',
      mdblistKey: 'mdblist-key-456',
      posterRatingPresentation: 'dual-minimal',
      backdropRatingPresentation: 'compact-dual',
    },
  });

  assert.equal(config.settings.posterRatingPresentation, 'dual-minimal');
  assert.equal(config.settings.backdropRatingPresentation, 'dual-minimal');

  const configString = buildConfigString('https://erdb.example.com', config.settings);
  assert.notEqual(configString, '');

  const decodedConfig = JSON.parse(decodeBase64Url(configString));
  assert.equal(decodedConfig.posterRatingPresentation, 'dual-minimal');
  assert.equal(decodedConfig.backdropRatingPresentation, 'dual-minimal');
});

test('workspace normalization accepts none rating presentation to remove all ratings', () => {
  const config = normalizeSavedUiConfig({
    settings: {
      tmdbKey: 'tmdb-key-123',
      mdblistKey: 'mdblist-key-456',
      posterRatingPresentation: 'none',
      backdropRatingPresentation: 'none',
      logoRatingPresentation: 'none',
    },
  });

  assert.equal(config.settings.posterRatingPresentation, 'none');
  assert.equal(config.settings.backdropRatingPresentation, 'none');
  assert.equal(config.settings.logoRatingPresentation, 'none');

  const configString = buildConfigString('https://erdb.example.com', config.settings);
  assert.notEqual(configString, '');

  const decodedConfig = JSON.parse(decodeBase64Url(configString));
  assert.equal(decodedConfig.posterRatingPresentation, 'none');
  assert.equal(decodedConfig.backdropRatingPresentation, 'none');
  assert.equal(decodedConfig.logoRatingPresentation, 'none');
});

test('config payload includes aggregate accent bar visibility when disabled', () => {
  const config = normalizeSavedUiConfig({
    settings: {
      tmdbKey: 'tmdb-key-123',
      mdblistKey: 'mdblist-key-456',
      aggregateAccentBarVisible: false,
    },
  });

  assert.equal(config.settings.aggregateAccentBarVisible, false);

  const configString = buildConfigString('https://erdb.example.com', config.settings);
  assert.notEqual(configString, '');
  const decodedConfig = JSON.parse(decodeBase64Url(configString));
  assert.equal(decodedConfig.aggregateAccentBarVisible, false);
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
    tmdbIdScope: 'strict',
    posterRatings: 'imdb,tmdb',
    backdropRatings: 'mdblist',
    logoRatings: '',
    lang: 'fr',
    ratingValueMode: 'normalized',
    posterGenreBadge: 'both',
    logoGenreBadge: 'text',
    posterGenreBadgeStyle: 'square',
    logoGenreBadgeStyle: 'plain',
    posterGenreBadgePosition: 'bottomRight',
    logoGenreBadgePosition: 'bottomCenter',
    posterGenreBadgeScale: 118,
    logoGenreBadgeScale: 112,
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
    aggregateAccentMode: 'custom',
    aggregateAccentColor: '#22d3ee',
    aggregateCriticsAccentColor: '#f97316',
    aggregateAudienceAccentColor: '#22c55e',
    aggregateAccentBarOffset: -3,
    posterImageSize: 'large',
    posterImageText: 'clean',
    backdropImageText: 'clean',
    posterArtworkSource: 'fanart',
    backdropArtworkSource: 'fanart',
    posterRatingsLayout: 'top-bottom',
    posterRatingsMax: 5,
    posterEdgeOffset: 24,
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
    tmdbIdScope: 'strict',
    translateMeta: true,
    translateMetaMode: 'prefer-requested-language',
    debugMetaTranslation: true,
    posterRatings: 'imdb,tmdb',
    backdropRatings: 'mdblist',
    logoRatings: '',
    lang: 'fr',
    ratingValueMode: 'normalized',
    posterGenreBadge: 'both',
    logoGenreBadge: 'text',
    posterGenreBadgeStyle: 'square',
    logoGenreBadgeStyle: 'plain',
    posterGenreBadgePosition: 'bottomRight',
    logoGenreBadgePosition: 'bottomCenter',
    posterGenreBadgeScale: '118',
    logoGenreBadgeScale: '112',
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
    aggregateAccentMode: 'custom',
    aggregateAccentColor: '#22d3ee',
    aggregateCriticsAccentColor: '#f97316',
    aggregateAudienceAccentColor: '#22c55e',
    aggregateAccentBarOffset: '-3',
    posterImageSize: 'large',
    posterImageText: 'clean',
    backdropImageText: 'clean',
    posterArtworkSource: 'fanart',
    backdropArtworkSource: 'fanart',
    posterRatingsLayout: 'top-bottom',
    posterRatingsMax: '5',
    posterEdgeOffset: '24',
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

  assert.equal(
    patterns?.posterUrlPattern.startsWith(
      'https://erdb.example.com/poster/tmdb:{type}:{tmdb_id}.jpg?idSource=tmdb&',
    ),
    true,
  );
  assert.equal(
    patterns?.backgroundUrlPattern.startsWith(
      'https://erdb.example.com/backdrop/tmdb:{type}:{tmdb_id}.jpg?idSource=tmdb&',
    ),
    true,
  );
  assert.equal(
    patterns?.logoUrlPattern.startsWith(
      'https://erdb.example.com/logo/tmdb:{type}:{tmdb_id}.png?idSource=tmdb&',
    ),
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
    assert.match(value, /lang=fr/);
    assert.match(value, /aggregateAccentMode=custom/);
    assert.match(value, /aggregateAccentColor=%2322d3ee/);
    assert.match(value, /aggregateCriticsAccentColor=%23f97316/);
    assert.match(value, /aggregateAudienceAccentColor=%2322c55e/);
    assert.match(value, /aggregateAccentBarOffset=-3/);
    assert.match(
      value,
      new RegExp(`providerAppearance=${encodeRatingProviderAppearanceOverrides(SAMPLE_PROVIDER_APPEARANCE)}`),
    );
    assert.equal(value.includes('%7Btmdb_key%7D'), false);
    assert.equal(value.includes('%7Bmdblist_key%7D'), false);
    assert.equal(value.includes('%7Bfanart_key%7D'), false);
    assert.equal(value.includes('%7Berdb_key%7D'), false);
  }

  assert.match(patterns?.posterUrlPattern ?? '', /posterRatings=imdb%2Ctmdb/);
  assert.match(patterns?.posterUrlPattern ?? '', /posterRatingsLayout=top-bottom/);
  assert.match(patterns?.posterUrlPattern ?? '', /posterEdgeOffset=24/);
  assert.match(patterns?.posterUrlPattern ?? '', /qualityBadgesSide=right/);
  assert.equal((patterns?.posterUrlPattern ?? '').includes('backdropRatings='), false);
  assert.equal((patterns?.posterUrlPattern ?? '').includes('logoRatings='), false);
  assert.equal((patterns?.posterUrlPattern ?? '').includes('backdropRatingsLayout='), false);

  assert.match(patterns?.backgroundUrlPattern ?? '', /backdropRatings=mdblist/);
  assert.match(patterns?.backgroundUrlPattern ?? '', /backdropRatingsLayout=right-vertical/);
  assert.equal((patterns?.backgroundUrlPattern ?? '').includes('posterRatings='), false);
  assert.equal((patterns?.backgroundUrlPattern ?? '').includes('logoRatings='), false);
  assert.equal((patterns?.backgroundUrlPattern ?? '').includes('qualityBadgesSide='), false);

  assert.match(patterns?.logoUrlPattern ?? '', /logoRatings=/);
  assert.equal((patterns?.logoUrlPattern ?? '').includes('posterRatings='), false);
  assert.equal((patterns?.logoUrlPattern ?? '').includes('backdropRatings='), false);
  assert.equal((patterns?.logoUrlPattern ?? '').includes('qualityBadgesSide='), false);

  assert.match(patterns?.backgroundUrlPattern ?? '', /idSource=tmdb/);
  assert.match(patterns?.logoUrlPattern ?? '', /idSource=tmdb/);
  assert.match(patterns?.posterUrlPattern ?? '', /idSource=tmdb/);
  assert.match(patterns?.posterUrlPattern ?? '', /posterImageSize=large/);
});

test('AIOMetadata export can keep live credentials while preserving live AIOM defaults', () => {
  const config = buildSampleSettings();

  const patterns = buildAiometadataUrlPatterns('https://erdb.example.com/', config.settings, {
    hideCredentials: false,
  });

  assert.equal(
    patterns?.posterUrlPattern.startsWith(
      'https://erdb.example.com/poster/tmdb:{type}:{tmdb_id}.jpg?idSource=tmdb&',
    ),
    true,
  );
  assert.equal(
    patterns?.backgroundUrlPattern.startsWith(
      'https://erdb.example.com/backdrop/tmdb:{type}:{tmdb_id}.jpg?idSource=tmdb&',
    ),
    true,
  );
  assert.equal(
    patterns?.logoUrlPattern.startsWith(
      'https://erdb.example.com/logo/tmdb:{type}:{tmdb_id}.png?idSource=tmdb&',
    ),
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

test('AIOMetadata export auto poster ID mode resolves to typed TMDB poster URLs', () => {
  const config = buildSampleSettings();

  const patterns = buildAiometadataUrlPatterns('https://erdb.example.com/', config.settings, {
    hideCredentials: true,
    posterIdMode: 'auto',
  });

  assert.equal(
    patterns?.posterUrlPattern.startsWith(
      'https://erdb.example.com/poster/tmdb:{type}:{tmdb_id}.jpg?idSource=tmdb&',
    ),
    true,
  );
});

test('AIOMetadata export supports IMDb poster ID mode override', () => {
  const config = buildSampleSettings();

  const patterns = buildAiometadataUrlPatterns('https://erdb.example.com/', config.settings, {
    hideCredentials: true,
    posterIdMode: 'imdb',
  });

  assert.equal(patterns?.posterUrlPattern.startsWith('https://erdb.example.com/poster/{imdb_id}.jpg?'), true);
  assert.equal((patterns?.posterUrlPattern ?? '').includes('idSource=tmdb'), false);
  assert.match(patterns?.backgroundUrlPattern ?? '', /idSource=tmdb/);
  assert.match(patterns?.logoUrlPattern ?? '', /idSource=tmdb/);
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

test('workspace normalization clamps poster edge offset into the supported range', () => {
  const config = normalizeSavedUiConfig({
    settings: {
      posterEdgeOffset: 999,
    },
  });

  assert.equal(config.settings.posterEdgeOffset, 80);
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

test('workspace normalization accepts random artwork and image text preferences', () => {
  const config = normalizeSavedUiConfig({
    settings: {
      posterImageText: 'random',
      backdropImageText: 'random',
      posterArtworkSource: 'random',
      backdropArtworkSource: 'random',
      logoArtworkSource: 'random',
    },
  });

  assert.equal(config.settings.posterImageText, 'random');
  assert.equal(config.settings.backdropImageText, 'random');
  assert.equal(config.settings.posterArtworkSource, 'random');
  assert.equal(config.settings.backdropArtworkSource, 'random');
  assert.equal(config.settings.logoArtworkSource, 'random');
});

test('workspace normalization accepts poster image size aliases and payload omits default', () => {
  const aliasNormalized = normalizeSavedUiConfig({
    settings: {
      posterImageSize: '4k-slow',
    },
  });
  assert.equal(aliasNormalized.settings.posterImageSize, '4k');

  const defaultNormalized = normalizeSavedUiConfig({
    settings: {
      tmdbKey: 'tmdb-key-123',
      mdblistKey: 'mdblist-key-456',
      posterImageSize: 'standard',
    },
  });
  assert.equal(defaultNormalized.settings.posterImageSize, 'normal');

  const defaultConfigString = buildConfigString('https://erdb.example.com', defaultNormalized.settings);
  assert.notEqual(defaultConfigString, '');
  const defaultPayload = JSON.parse(decodeBase64Url(defaultConfigString));
  assert.equal(defaultPayload.posterImageSize, undefined);
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

test('workspace normalization maps RPDB order, bar position, and font scale aliases', () => {
  const config = normalizeSavedUiConfig({
    settings: {
      order: 'imdb,tomatoes-critics,metacritic-audience',
      ratingBarPos: 'right-center',
      fontScale: '1.2',
      imageSize: 'verylarge',
    },
  });

  assert.deepEqual(config.settings.posterRatingPreferences, ['imdb', 'tomatoes', 'metacriticuser']);
  assert.deepEqual(config.settings.backdropRatingPreferences, ['imdb', 'tomatoes', 'metacriticuser']);
  assert.deepEqual(config.settings.logoRatingPreferences, ['imdb', 'tomatoes', 'metacriticuser']);
  assert.equal(config.settings.posterRatingsLayout, 'right');
  assert.equal(config.settings.backdropRatingsLayout, 'right-vertical');
  assert.equal(config.settings.sideRatingsPosition, 'middle');
  assert.equal(config.settings.posterImageSize, '4k');
  assert.equal(config.settings.posterRatingBadgeScale, 120);
  assert.equal(config.settings.backdropRatingBadgeScale, 120);
  assert.equal(config.settings.logoRatingBadgeScale, 120);
});

test('workspace normalization keeps explicit ERDB settings over RPDB aliases', () => {
  const config = normalizeSavedUiConfig({
    settings: {
      ratingBarPos: 'left-top',
      posterRatingsLayout: 'top',
      sideRatingsPosition: 'custom',
      sideRatingsOffset: 63,
      fontScale: '1.4',
      posterRatingBadgeScale: 106,
    },
  });

  assert.equal(config.settings.posterRatingsLayout, 'top');
  assert.equal(config.settings.sideRatingsPosition, 'custom');
  assert.equal(config.settings.sideRatingsOffset, 63);
  assert.equal(config.settings.posterRatingBadgeScale, 106);
  assert.equal(config.settings.backdropRatingBadgeScale, 140);
  assert.equal(config.settings.logoRatingBadgeScale, 140);
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
  assert.equal(normalizeErdbId('tmdb:series:1399:2', 'series'), 'tmdb:tv:1399:2');
});

test('TMDB ID scope helpers detect explicit and ambiguous forms', () => {
  assert.equal(hasExplicitTmdbMediaTypeInErdbId('tmdb:movie:603'), true);
  assert.equal(hasExplicitTmdbMediaTypeInErdbId('tmdb:tv:1399:2'), true);
  assert.equal(hasExplicitTmdbMediaTypeInErdbId('tmdb:603'), false);

  assert.equal(isAmbiguousTmdbErdbId('tmdb:603'), true);
  assert.equal(isAmbiguousTmdbErdbId('tmdb:movie:603'), false);
  assert.equal(isAmbiguousTmdbErdbId('tmdb:tv:1399'), false);
  assert.equal(isAmbiguousTmdbErdbId('tt0133093'), false);
});
