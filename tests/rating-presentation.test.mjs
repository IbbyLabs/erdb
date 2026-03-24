import test from 'node:test';
import assert from 'node:assert/strict';

import {
  hasAggregateRatingProvidersForSource,
  normalizeAggregateRatingSource,
  normalizeRatingPresentation,
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
