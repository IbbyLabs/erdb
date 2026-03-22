import test from 'node:test';
import assert from 'node:assert/strict';

import {
  orderRatingPreferencesForRender,
  parseRatingPreferencesAllowEmpty,
} from '../lib/ratingPreferences.ts';

test('explicit rating order is preserved for anime renders', () => {
  const explicit = parseRatingPreferencesAllowEmpty('mdblist,tomatoes,metacritic,letterboxd,trakt,myanimelist,anilist,kitsu');

  assert.deepEqual(
    orderRatingPreferencesForRender(explicit, {
      prioritizeAnimeRatings: true,
      preserveInputOrder: true,
    }),
    ['mdblist', 'tomatoes', 'metacritic', 'letterboxd', 'trakt', 'myanimelist', 'anilist', 'kitsu'],
  );
});

test('default anime renders still prioritize anime specific providers', () => {
  const defaults = parseRatingPreferencesAllowEmpty(null);

  const ordered = orderRatingPreferencesForRender(defaults, {
    prioritizeAnimeRatings: true,
    preserveInputOrder: false,
  });

  assert.deepEqual(ordered.slice(0, 3), ['myanimelist', 'anilist', 'kitsu']);
  assert.deepEqual(
    ordered.slice(3),
    defaults.filter((provider) => !['myanimelist', 'anilist', 'kitsu'].includes(provider)),
  );
});
