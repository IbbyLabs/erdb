import test from 'node:test';
import assert from 'node:assert/strict';

import { formatDisplayRatingValue } from '../lib/ratingDisplay.ts';

test('trakt direct ratings render on the same 0 to 10 scale as imdb', () => {
  assert.equal(formatDisplayRatingValue('trakt', '9.2', 'poster'), '9.2');
  assert.equal(formatDisplayRatingValue('trakt', '7.6', 'logo'), '7.6');
});

test('trakt mdb list ratings still normalize from percentage style values', () => {
  assert.equal(formatDisplayRatingValue('trakt', '73', 'poster'), '7.3');
});

test('percentage based providers still normalize to poster friendly decimal values', () => {
  assert.equal(formatDisplayRatingValue('tomatoes', '93', 'poster'), '9.3');
  assert.equal(formatDisplayRatingValue('kitsu', '82', 'poster'), '8.2');
});
