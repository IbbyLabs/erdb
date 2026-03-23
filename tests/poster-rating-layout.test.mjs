import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getPosterRatingLayoutLimit,
  normalizePosterRatingsMaxPerSide,
} from '../lib/posterRatingLayout.ts';
import { normalizeSavedUiConfig } from '../lib/uiConfig.ts';

test('poster layout rows no longer apply fixed hard badge caps', () => {
  assert.equal(getPosterRatingLayoutLimit('top'), null);
  assert.equal(getPosterRatingLayoutLimit('bottom'), null);
  assert.equal(getPosterRatingLayoutLimit('top-bottom'), null);
});

test('badge max normalization preserves larger explicit values', () => {
  assert.equal(normalizePosterRatingsMaxPerSide(50), 50);

  const config = normalizeSavedUiConfig({
    settings: {
      posterQualityBadgesMax: 50,
      backdropQualityBadgesMax: 40,
      posterRatingsMaxPerSide: 30,
      logoRatingsMax: 25,
    },
  });

  assert.equal(config.settings.posterQualityBadgesMax, 50);
  assert.equal(config.settings.backdropQualityBadgesMax, 40);
  assert.equal(config.settings.posterRatingsMaxPerSide, 30);
  assert.equal(config.settings.logoRatingsMax, 25);
});
