import test from 'node:test';
import assert from 'node:assert/strict';

import { buildErdbImageUrl, decodeProxyConfig } from '../lib/addonProxy.ts';
import { encodeRatingProviderAppearanceOverrides } from '../lib/badgeCustomization.ts';
import { buildProxyUrl, normalizeSavedUiConfig } from '../lib/uiConfig.ts';

test('generated proxy manifest carries configurator settings into rewritten logo artwork', () => {
  const providerAppearance = {
    mdblist: {
      accentColor: '#22c55e',
      iconScalePercent: 112,
      stackedLineWidthPercent: 88,
    },
  };
  const uiConfig = normalizeSavedUiConfig({
    settings: {
      tmdbKey: 'tmdb-key-123',
      mdblistKey: 'mdblist-key-456',
      fanartKey: 'fanart-key-789',
      lang: 'en',
      ratingValueMode: 'normalized',
      genreBadgeMode: 'text',
      genreBadgeScale: 112,
      logoRatingPreferences: ['mdblist', 'tomatoes', 'letterboxd'],
      logoRatingStyle: 'stacked',
      logoRatingPresentation: 'average',
      logoAggregateRatingSource: 'audience',
      logoRatingsMax: 3,
      logoBackground: 'dark',
      logoArtworkSource: 'fanart',
      logoRatingBadgeScale: 94,
      ratingProviderAppearanceOverrides: providerAppearance,
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
  assert.equal(rewrittenLogoUrl.searchParams.get('fanartKey'), 'fanart-key-789');
  assert.equal(rewrittenLogoUrl.searchParams.get('lang'), 'en');
  assert.equal(rewrittenLogoUrl.searchParams.get('ratingValueMode'), 'normalized');
  assert.equal(rewrittenLogoUrl.searchParams.get('genreBadge'), 'text');
  assert.equal(rewrittenLogoUrl.searchParams.get('genreBadgeScale'), '112');
  assert.equal(rewrittenLogoUrl.searchParams.get('logoRatings'), 'mdblist,tomatoes,letterboxd');
  assert.equal(rewrittenLogoUrl.searchParams.get('logoRatingsMax'), '3');
  assert.equal(rewrittenLogoUrl.searchParams.get('logoBackground'), 'dark');
  assert.equal(rewrittenLogoUrl.searchParams.get('logoArtworkSource'), 'fanart');
  assert.equal(rewrittenLogoUrl.searchParams.get('logoRatingPresentation'), 'average');
  assert.equal(rewrittenLogoUrl.searchParams.get('logoAggregateRatingSource'), 'audience');
  assert.equal(rewrittenLogoUrl.searchParams.get('logoRatingBadgeScale'), '94');
  assert.equal(
    rewrittenLogoUrl.searchParams.get('providerAppearance'),
    encodeRatingProviderAppearanceOverrides(providerAppearance),
  );
  assert.equal(rewrittenLogoUrl.searchParams.get('ratingStyle'), 'stacked');
});

test('proxy image rewrites upgrade legacy logo source params to artwork source params', () => {
  const rewrittenLogoUrl = new URL(
    buildErdbImageUrl({
      reqUrl: new URL(
        'https://proxy.example.net/proxy/example/meta/series/example.json?logoSource=fanart&logoBackground=dark'
      ),
      imageType: 'logo',
      erdbId: 'tt0386676',
      tmdbKey: 'tmdb-key-123',
      mdblistKey: 'mdblist-key-456',
      config: {
        url: 'https://addon.example.com/manifest.json',
        tmdbKey: 'tmdb-key-123',
        mdblistKey: 'mdblist-key-456',
      },
    })
  );

  assert.equal(rewrittenLogoUrl.searchParams.get('logoArtworkSource'), 'fanart');
  assert.equal(rewrittenLogoUrl.searchParams.get('logoSource'), null);
});

test('proxy image rewrites carry side rating placement for poster layouts', () => {
  const providerAppearance = {
    trakt: {
      iconUrl: 'https://cdn.example.com/trakt-custom.svg',
      accentColor: '#7c3aed',
      iconScalePercent: 116,
      stackedLineVisible: false,
    },
  };
  const uiConfig = normalizeSavedUiConfig({
    settings: {
      tmdbKey: 'tmdb-key-123',
      mdblistKey: 'mdblist-key-456',
      fanartKey: 'fanart-key-789',
      posterImageText: 'clean',
      posterArtworkSource: 'fanart',
      backdropImageText: 'clean',
      backdropArtworkSource: 'fanart',
      ratingValueMode: 'normalized',
      genreBadgeScale: 116,
      posterRatingPreferences: ['imdb', 'trakt', 'metacritic'],
      posterRatingsLayout: 'left-right',
      posterRatingsMax: 3,
      posterQualityBadgePreferences: ['certification', 'hdr'],
      posterQualityBadgesStyle: 'plain',
      posterQualityBadgeScale: 118,
      posterRatingBadgeScale: 111,
      sideRatingsPosition: 'custom',
      sideRatingsOffset: 68,
      ratingProviderAppearanceOverrides: providerAppearance,
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

  const rewrittenPosterUrl = new URL(
    buildErdbImageUrl({
      reqUrl: new URL('https://proxy.example.net/proxy/example/meta/movie/example.json'),
      imageType: 'poster',
      erdbId: 'tt0468569',
      tmdbKey: decodedProxyConfig.tmdbKey,
      mdblistKey: decodedProxyConfig.mdblistKey,
      config: decodedProxyConfig,
    })
  );

  assert.equal(rewrittenPosterUrl.searchParams.get('posterRatings'), 'imdb,trakt,metacritic');
  assert.equal(rewrittenPosterUrl.searchParams.get('fanartKey'), 'fanart-key-789');
  assert.equal(rewrittenPosterUrl.searchParams.get('ratingValueMode'), 'normalized');
  assert.equal(rewrittenPosterUrl.searchParams.get('genreBadgeScale'), '116');
  assert.equal(rewrittenPosterUrl.searchParams.get('imageText'), 'clean');
  assert.equal(rewrittenPosterUrl.searchParams.get('posterArtworkSource'), 'fanart');
  assert.equal(rewrittenPosterUrl.searchParams.get('posterRatingsLayout'), 'left-right');
  assert.equal(rewrittenPosterUrl.searchParams.get('posterRatingsMax'), '3');
  assert.equal(rewrittenPosterUrl.searchParams.get('posterQualityBadges'), 'certification,hdr');
  assert.equal(rewrittenPosterUrl.searchParams.get('posterQualityBadgesStyle'), 'plain');
  assert.equal(rewrittenPosterUrl.searchParams.get('posterQualityBadgeScale'), '118');
  assert.equal(rewrittenPosterUrl.searchParams.get('posterRatingBadgeScale'), '111');
  assert.equal(rewrittenPosterUrl.searchParams.get('sideRatingsPosition'), 'custom');
  assert.equal(rewrittenPosterUrl.searchParams.get('sideRatingsOffset'), '68');
  assert.equal(
    rewrittenPosterUrl.searchParams.get('providerAppearance'),
    encodeRatingProviderAppearanceOverrides(providerAppearance),
  );
});

test('proxy image rewrites carry artwork source selection for backdrops', () => {
  const uiConfig = normalizeSavedUiConfig({
    settings: {
      tmdbKey: 'tmdb-key-123',
      mdblistKey: 'mdblist-key-456',
      fanartKey: 'fanart-key-789',
      backdropImageText: 'clean',
      backdropArtworkSource: 'fanart',
      genreBadgeScale: 122,
      backdropRatingPreferences: ['imdb'],
      backdropRatingsMax: 2,
      backdropQualityBadgePreferences: ['4k', 'dolbyatmos'],
      backdropQualityBadgesStyle: 'media',
      backdropQualityBadgeScale: 106,
      backdropRatingBadgeScale: 109,
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

  const rewrittenBackdropUrl = new URL(
    buildErdbImageUrl({
      reqUrl: new URL('https://proxy.example.net/proxy/example/meta/series/example.json'),
      imageType: 'backdrop',
      erdbId: 'tt0386676',
      tmdbKey: decodedProxyConfig.tmdbKey,
      mdblistKey: decodedProxyConfig.mdblistKey,
      config: decodedProxyConfig,
    })
  );

  assert.equal(rewrittenBackdropUrl.searchParams.get('imageText'), 'clean');
  assert.equal(rewrittenBackdropUrl.searchParams.get('fanartKey'), 'fanart-key-789');
  assert.equal(rewrittenBackdropUrl.searchParams.get('genreBadgeScale'), '122');
  assert.equal(rewrittenBackdropUrl.searchParams.get('backdropArtworkSource'), 'fanart');
  assert.equal(rewrittenBackdropUrl.searchParams.get('backdropRatingsMax'), '2');
  assert.equal(rewrittenBackdropUrl.searchParams.get('backdropQualityBadges'), '4k,dolbyatmos');
  assert.equal(rewrittenBackdropUrl.searchParams.get('backdropQualityBadgesStyle'), 'media');
  assert.equal(rewrittenBackdropUrl.searchParams.get('backdropQualityBadgeScale'), '106');
  assert.equal(rewrittenBackdropUrl.searchParams.get('backdropRatingBadgeScale'), '109');
});

test('proxy image rewrites preserve cinemeta as a poster artwork source', () => {
  const uiConfig = normalizeSavedUiConfig({
    settings: {
      tmdbKey: 'tmdb-key-123',
      mdblistKey: 'mdblist-key-456',
      posterImageText: 'clean',
      posterArtworkSource: 'cinemeta',
      posterRatingPreferences: ['imdb'],
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

  const rewrittenPosterUrl = new URL(
    buildErdbImageUrl({
      reqUrl: new URL('https://proxy.example.net/proxy/example/meta/movie/example.json'),
      imageType: 'poster',
      erdbId: 'tt0133093',
      tmdbKey: decodedProxyConfig.tmdbKey,
      mdblistKey: decodedProxyConfig.mdblistKey,
      config: decodedProxyConfig,
    }),
  );

  assert.equal(rewrittenPosterUrl.searchParams.get('posterArtworkSource'), 'cinemeta');
});

test('proxy image rewrites upgrade legacy clean source params to artwork source params', () => {
  const rewrittenPosterUrl = new URL(
    buildErdbImageUrl({
      reqUrl: new URL(
        'https://proxy.example.net/proxy/example/meta/movie/example.json?imageText=alternative&posterCleanSource=fanart'
      ),
      imageType: 'poster',
      erdbId: 'tt0133093',
      tmdbKey: 'tmdb-key-123',
      mdblistKey: 'mdblist-key-456',
      config: {
        url: 'https://addon.example.com/manifest.json',
        tmdbKey: 'tmdb-key-123',
        mdblistKey: 'mdblist-key-456',
      },
    })
  );

  assert.equal(rewrittenPosterUrl.searchParams.get('posterArtworkSource'), 'fanart');
  assert.equal(rewrittenPosterUrl.searchParams.get('posterCleanSource'), null);
});
