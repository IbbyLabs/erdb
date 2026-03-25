import test from 'node:test';
import assert from 'node:assert/strict';

import { buildFinalImageRenderSeedKey } from '../lib/finalImageRenderSeed.ts';

const createInput = (overrides = {}) => ({
  cacheVersion: 'poster-backdrop-logo-v72',
  imageType: 'poster',
  outputFormat: 'png',
  cleanId: 'tt0111161',
  requestedImageLang: 'en',
  posterTextPreference: 'clean',
  posterArtworkSource: 'fanart',
  backdropArtworkSource: 'tmdb',
  logoArtworkSource: 'tmdb',
  posterRatingsLayout: 'left-right',
  posterRatingsMaxPerSide: 2,
  posterRatingsMax: 3,
  backdropRatingsLayout: 'right-vertical',
  backdropRatingsMax: 2,
  logoRatingsMax: 3,
  qualityBadgesSide: 'left',
  posterQualityBadgesPosition: 'auto',
  qualityBadgesStyle: 'plain',
  qualityBadgesMax: 2,
  qualityBadgePreferences: ['certification', 'hdr'],
  sideRatingsPosition: 'center',
  sideRatingsOffset: 50,
  ratingPresentation: 'average',
  blockbusterDensity: 'balanced',
  aggregateRatingSource: 'combined',
  ratingStyle: 'stacked',
  ratingValueMode: 'normalized',
  posterRatingBadgeScale: 100,
  backdropRatingBadgeScale: 100,
  logoRatingBadgeScale: 100,
  posterQualityBadgeScale: 100,
  backdropQualityBadgeScale: 100,
  genreBadgeMode: 'text',
  genreBadgeStyle: 'plain',
  genreBadgePosition: 'bottomCenter',
  genreBadgeScale: 100,
  logoBackground: 'dark',
  effectiveRatingPreferences: ['imdb', 'tmdb'],
  providerAppearanceOverrides: {},
  streamBadgesCacheKeySeed: 'off',
  fanartKeyHash: 'fanart-hash',
  fanartClientKeyHash: 'fanart-client-hash',
  renderCacheBuster: '',
  ...overrides,
});

test('final image render seed changes when poster rating badge scale changes', () => {
  const baseKey = buildFinalImageRenderSeedKey(createInput());
  const scaledKey = buildFinalImageRenderSeedKey(
    createInput({ posterRatingBadgeScale: 118 }),
  );

  assert.notEqual(baseKey, scaledKey);
});

test('final image render seed changes when quality badge settings change', () => {
  const baseKey = buildFinalImageRenderSeedKey(createInput());
  const changedPreferenceKey = buildFinalImageRenderSeedKey(
    createInput({ qualityBadgePreferences: ['certification', 'dolbyvision'] }),
  );
  const changedScaleKey = buildFinalImageRenderSeedKey(
    createInput({ posterQualityBadgeScale: 114 }),
  );

  assert.notEqual(baseKey, changedPreferenceKey);
  assert.notEqual(baseKey, changedScaleKey);
});

test('final image render seed includes canonical provider appearance overrides', () => {
  const baseOverrides = {
    imdb: { iconScalePercent: 112 },
    trakt: { stackedWidthPercent: 88, stackedAccentMode: 'logo' },
  };
  const reorderedOverrides = {
    trakt: { stackedWidthPercent: 88, stackedAccentMode: 'logo' },
    imdb: { iconScalePercent: 112 },
  };
  const changedOverrides = {
    imdb: { iconScalePercent: 112 },
    trakt: { stackedWidthPercent: 92, stackedAccentMode: 'logo' },
  };

  const baseKey = buildFinalImageRenderSeedKey(
    createInput({ providerAppearanceOverrides: baseOverrides }),
  );
  const reorderedKey = buildFinalImageRenderSeedKey(
    createInput({ providerAppearanceOverrides: reorderedOverrides }),
  );
  const changedKey = buildFinalImageRenderSeedKey(
    createInput({ providerAppearanceOverrides: changedOverrides }),
  );

  assert.equal(baseKey, reorderedKey);
  assert.notEqual(baseKey, changedKey);
});
