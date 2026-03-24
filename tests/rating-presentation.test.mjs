import test from 'node:test';
import assert from 'node:assert/strict';

import {
  hasAggregateRatingProvidersForSource,
  normalizeAggregateRatingSource,
  normalizeRatingPresentation,
  preservesSelectedRatingLayout,
  resolveBackdropRatingLayoutForPresentation,
  resolveLogoRatingsMaxForPresentation,
  resolvePosterRatingLayoutForPresentation,
  resolvePosterRatingsMaxPerSideForPresentation,
  selectAggregateRatingProviders,
  usesAggregateRatingSource,
} from '../lib/ratingPresentation.ts';

test('presentation modes normalize to supported values', () => {
  assert.equal(normalizeRatingPresentation('minimal'), 'minimal');
  assert.equal(normalizeRatingPresentation('BLOCKBUSTER'), 'blockbuster');
  assert.equal(normalizeRatingPresentation('unknown'), 'standard');
});

test('aggregate rating sources normalize to supported values', () => {
  assert.equal(normalizeAggregateRatingSource('critics'), 'critics');
  assert.equal(normalizeAggregateRatingSource('AUDIENCE'), 'audience');
  assert.equal(normalizeAggregateRatingSource('bad-input'), 'overall');
});

test('aggregate source helpers distinguish summary modes and preferred providers', () => {
  assert.equal(usesAggregateRatingSource('standard'), false);
  assert.equal(usesAggregateRatingSource('minimal'), true);
  assert.deepEqual(
    selectAggregateRatingProviders('critics', ['imdb', 'tomatoes', 'metacriticuser']),
    ['tomatoes'],
  );
  assert.deepEqual(
    selectAggregateRatingProviders('audience', ['rogerebert', 'metacritic']),
    ['rogerebert', 'metacritic'],
  );
  assert.equal(
    hasAggregateRatingProvidersForSource('audience', ['rogerebert', 'metacritic']),
    false,
  );
});

test('non-blockbuster presentations preserve selected placement controls', () => {
  assert.equal(preservesSelectedRatingLayout('standard'), true);
  assert.equal(resolvePosterRatingLayoutForPresentation('minimal', 'top'), 'top');
  assert.equal(resolveBackdropRatingLayoutForPresentation('average', 'center'), 'center');
  assert.equal(resolvePosterRatingsMaxPerSideForPresentation('average', 5), 5);
  assert.equal(resolveLogoRatingsMaxForPresentation('minimal', 3), 3);
});

test('blockbuster uses fixed placement defaults', () => {
  assert.equal(preservesSelectedRatingLayout('blockbuster'), false);
  assert.equal(resolvePosterRatingLayoutForPresentation('blockbuster', 'bottom'), 'left-right');
  assert.equal(
    resolveBackdropRatingLayoutForPresentation('blockbuster', 'center'),
    'right-vertical',
  );
  assert.equal(resolvePosterRatingsMaxPerSideForPresentation('blockbuster', 5), null);
  assert.equal(resolveLogoRatingsMaxForPresentation('blockbuster', 3), null);
});
