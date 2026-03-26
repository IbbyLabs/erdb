import test from 'node:test';
import assert from 'node:assert/strict';

import {
  RATING_PROVIDER_OPTIONS,
  orderRatingPreferencesForRender,
  parseRatingPreferencesAllowEmpty,
  normalizeRatingPreference,
  selectAvailableRatingPreferences,
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

test('selection keeps falling through ordered providers until the requested count is filled', () => {
  const ordered = parseRatingPreferencesAllowEmpty(
    'myanimelist,kitsu,anilist,imdb,tomatoes,metacritic,letterboxd',
  );

  assert.deepEqual(
    selectAvailableRatingPreferences(
      ordered,
      ['imdb', 'tomatoes', 'metacritic', 'letterboxd'],
      3,
    ),
    ['imdb', 'tomatoes', 'metacritic'],
  );

  assert.deepEqual(
    selectAvailableRatingPreferences(
      ordered,
      ['myanimelist', 'kitsu', 'imdb', 'tomatoes', 'metacritic'],
      4,
    ),
    ['myanimelist', 'kitsu', 'imdb', 'tomatoes'],
  );
});

test('explicit rating max still caps side layouts when auto per side is in play', () => {
  const ordered = parseRatingPreferencesAllowEmpty(
    'tmdb,mdblist,imdb,tomatoes,tomatoesaudience,letterboxd,metacritic,metacriticuser,trakt,rogerebert',
  );

  assert.deepEqual(
    selectAvailableRatingPreferences(ordered, ordered, 2),
    ['tmdb', 'mdblist'],
  );
});

test('kitsu uses the embedded logo source instead of a remote fallback icon', () => {
  const kitsu = RATING_PROVIDER_OPTIONS.find((provider) => provider.id === 'kitsu');

  assert.ok(kitsu);
  assert.match(kitsu.iconUrl, /^data:image\/png;base64,/);
});

test('rating preference normalization accepts anilist.co aliases', () => {
  assert.equal(normalizeRatingPreference('AniList.co'), 'anilist');
  assert.equal(normalizeRatingPreference('ani.list_co'), 'anilist');
});

test('rating preference normalization accepts RPDB critic and audience aliases', () => {
  assert.equal(normalizeRatingPreference('tomatoes-critics'), 'tomatoes');
  assert.equal(normalizeRatingPreference('tomatoes-audience'), 'tomatoesaudience');
  assert.equal(normalizeRatingPreference('metacritic-critics'), 'metacritic');
  assert.equal(normalizeRatingPreference('metacritic-audience'), 'metacriticuser');
});
