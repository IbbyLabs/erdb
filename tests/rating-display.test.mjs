import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatDisplayRatingValue,
  normalizeRatingToTenPointValue,
  normalizeRatingValueMode,
} from '../lib/ratingDisplay.ts';

test('provider default rating display keeps native scales by default', () => {
  assert.equal(formatDisplayRatingValue('trakt', '9.2'), '9.2/10');
  assert.equal(formatDisplayRatingValue('trakt', '76'), '7.6/10');
  assert.equal(formatDisplayRatingValue('metacritic', '84'), '84/100');
  assert.equal(formatDisplayRatingValue('mdblist', '79'), '79/100');
  assert.equal(formatDisplayRatingValue('tomatoes', '93'), '93%');
  assert.equal(formatDisplayRatingValue('kitsu', '82'), '82%');
  assert.equal(formatDisplayRatingValue('letterboxd', '3.9'), '3.9/5');
  assert.equal(formatDisplayRatingValue('rogerebert', '3.5'), '3.5/4');
});

test('normalized display mode is opt in', () => {
  assert.equal(formatDisplayRatingValue('trakt', '73', { valueMode: 'normalized' }), '7.3');
  assert.equal(formatDisplayRatingValue('tomatoes', '93', { valueMode: 'normalized' }), '9.3');
  assert.equal(formatDisplayRatingValue('kitsu', '82', { valueMode: 'normalized' }), '8.2');
});

test('rating value mode normalization accepts supported options only', () => {
  assert.equal(normalizeRatingValueMode(undefined), 'native');
  assert.equal(normalizeRatingValueMode(' normalized '), 'normalized');
  assert.equal(normalizeRatingValueMode('unexpected', 'normalized'), 'normalized');
});

test('numeric normalization exports the 0 to 10 values used by aggregate modes', () => {
  assert.equal(normalizeRatingToTenPointValue('tomatoes', '93'), 9.3);
  assert.equal(normalizeRatingToTenPointValue('rogerebert', '3.5'), 8.75);
  assert.equal(normalizeRatingToTenPointValue('trakt', '76'), 7.6);
});
