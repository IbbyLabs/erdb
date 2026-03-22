export const RATING_PROVIDER_OPTIONS = [
  {
    id: 'tmdb',
    label: 'TMDB',
    iconUrl: 'https://www.google.com/s2/favicons?domain=themoviedb.org&sz=64',
    accentColor: '#01b4e4',
  },
  {
    id: 'mdblist',
    label: 'MDBList',
    iconUrl: 'https://www.google.com/s2/favicons?domain=mdblist.com&sz=64',
    accentColor: '#f97316',
  },
  {
    id: 'imdb',
    label: 'IMDb',
    iconUrl: 'https://www.google.com/s2/favicons?domain=imdb.com&sz=64',
    accentColor: '#f5c518',
  },
  {
    id: 'tomatoes',
    label: 'Rotten Tomatoes',
    iconUrl: 'https://www.google.com/s2/favicons?domain=rottentomatoes.com&sz=64',
    accentColor: '#fa320a',
  },
  {
    id: 'tomatoesaudience',
    label: 'Popcorntime',
    iconUrl:
      'https://upload.wikimedia.org/wikipedia/commons/d/da/Rotten_Tomatoes_positive_audience.svg',
    accentColor: '#198754',
  },
  {
    id: 'letterboxd',
    label: 'Letterboxd',
    iconUrl: 'https://www.google.com/s2/favicons?domain=letterboxd.com&sz=64',
    accentColor: '#00a5ff',
  },
  {
    id: 'metacritic',
    label: 'Metacritic',
    iconUrl: 'https://www.google.com/s2/favicons?domain=metacritic.com&sz=64',
    accentColor: '#66cc33',
  },
  {
    id: 'metacriticuser',
    label: 'Metacritic User',
    iconUrl: 'https://www.google.com/s2/favicons?domain=metacritic.com&sz=64',
    accentColor: '#4caf50',
  },
  {
    id: 'trakt',
    label: 'Trakt',
    iconUrl: 'https://www.google.com/s2/favicons?domain=trakt.tv&sz=64',
    accentColor: '#ed1c24',
  },
  {
    id: 'rogerebert',
    label: 'Roger Ebert',
    iconUrl: 'https://www.google.com/s2/favicons?domain=rogerebert.com&sz=64',
    accentColor: '#c1121f',
  },
  {
    id: 'myanimelist',
    label: 'MyAnimeList',
    iconUrl: 'https://www.google.com/s2/favicons?domain=myanimelist.net&sz=64',
    accentColor: '#2e51a2',
  },
  {
    id: 'anilist',
    label: 'AniList',
    iconUrl: 'https://www.google.com/s2/favicons?domain=anilist.co&sz=64',
    accentColor: '#02a9ff',
  },
  {
    id: 'kitsu',
    label: 'Kitsu',
    iconUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAbFBMVEXt8PH3UTbt8/Ts9vj3TzP4RST3RyfwzMj3Siz4RCHt7u73TTD4PRb4QR33Vz3t6urv1NH2YUv4Og/0hHX2ZlHwxcDyrqbu4N/2a1fyo5n2WkLs+/3xv7n1emnznpP0j4LzmIzxtq/1cV/1gG/DdN76AAACqUlEQVRYhe1WW4NzMBCVTG4ECYoKiu7//49fhG3tdsm2ffx2XujlnDlzyyQI/uzPDgzDm/iqwW/huziu3tJgTMaiNwTwvOry5nUJ0MQ1GPS6BChQ1E5593IeoUi74SSKZ2PAYM16xbiXTBBinowB80tRXMoIeCrQbLR2Xy+8/nBwnQgp4jwdGHF4FGoLVrwaimKsdAQ+DiWQVrpCi/tZAQc9pCETUgoWmrH25MS23xlDKdGdIMoF+fxEBB2DYxHQ5Of6jpgJQrQ1ZmofQ7zBPxIgQrWHoUoOCWwcPg3cMHJAgOTpEG8zGTSIyn0CxC6+/gRc9olLxY8EyBeEbShoVZOFgoQ8+InAIwE6Zpq6BT5Io+oNAZGMsvlpDhVAxQgRrO+CVgXtcOtKQVFf6XJmYEelhCZZkk3TkfOCrc6ZHErVtsHkCKZ9Aqjipdpi7lwm1+4xk7LzOPXMEYr9s27By+RU3bUTmnV2nNWFrXxIjHsE0NmcybDnFnBa20mkE7ZnQSNvjEgMOwSYM+vvyu3c43p1Hw4KAtAntq3jXgiRjRt17uiBD+dQoBLmwKjc4PeTGKVxEbnfcEndP69qPiGH5Fsz75URK71qg2zOQDLMaqCgX/Ek3UnhTLE+nIDEhQoF+4o/KMLN4GwFhG65QvMwDcw3TAHWySfevX4TsFfEjQDbRXTReWuHTQaUDx9EkqxbDXcPASSeQ9GhqMzW17OUX/Fx59+XuMzDJU9Y59WH2MAJ+wV+buk1z7iKdXS+l1EY/bt9/blIoZAYRwNddgUJC/XkhQHOp3kU6jFzhwJ/+sqDTe+aKWpkmE3e5fwDQXaFAEcXmvflL+4HjwZXA6BN/qFf8O4IRqo4leWLcHdhmOxGf+PGWjMWemfvyGDMp/du7fjZ1vmz/9T+AVUuIe+9A1X8AAAAAElFTkSuQmCC',
    accentColor: '#f75239',
  },
] as const;

export type RatingPreference = (typeof RATING_PROVIDER_OPTIONS)[number]['id'];
export const ALL_RATING_PREFERENCES: RatingPreference[] = RATING_PROVIDER_OPTIONS.map((item) => item.id);
const ANIME_PRIORITY_RATING_PREFERENCES: RatingPreference[] = ['myanimelist', 'anilist', 'kitsu'];
const ALIASES: Record<string, RatingPreference> = {
  tmdb: 'tmdb',
  mdblist: 'mdblist',
  mdb: 'mdblist',
  imdb: 'imdb',
  tomatoes: 'tomatoes',
  rottentomatoes: 'tomatoes',
  rottentomato: 'tomatoes',
  rt: 'tomatoes',
  tomatoesaudience: 'tomatoesaudience',
  rottentomatoesaudience: 'tomatoesaudience',
  rtaudience: 'tomatoesaudience',
  popcorntime: 'tomatoesaudience',
  letterboxd: 'letterboxd',
  metacritic: 'metacritic',
  metacriticuser: 'metacriticuser',
  trakt: 'trakt',
  rogerebert: 'rogerebert',
  myanimelist: 'myanimelist',
  mal: 'myanimelist',
  anilist: 'anilist',
  kitsu: 'kitsu',
};

export const normalizeRatingPreference = (value: string): RatingPreference | null => {
  const normalized = value.trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (!normalized) return null;
  return ALIASES[normalized] || null;
};

export const parseRatingPreferencesAllowEmpty = (raw?: string | null) => {
  if (raw === null || raw === undefined) {
    return [...ALL_RATING_PREFERENCES];
  }

  const parsed = raw
    .split(',')
    .map((item) => normalizeRatingPreference(item))
    .filter((item): item is RatingPreference => item !== null);

  return [...new Set(parsed)];
};

export const parseRatingPreferences = (raw?: string | null) => {
  if (!raw) {
    return [...ALL_RATING_PREFERENCES];
  }

  const parsed = raw
    .split(',')
    .map((item) => normalizeRatingPreference(item))
    .filter((item): item is RatingPreference => item !== null);

  if (parsed.length === 0) {
    return [...ALL_RATING_PREFERENCES];
  }

  return [...new Set(parsed)];
};

export const stringifyRatingPreferencesAllowEmpty = (ratings: RatingPreference[]) => {
  const normalized = ratings
    .map((rating) => normalizeRatingPreference(rating))
    .filter((item): item is RatingPreference => item !== null);
  return [...new Set(normalized)].join(',');
};

export const stringifyRatingPreferences = (ratings: RatingPreference[]) => {
  const normalized = ratings
    .map((rating) => normalizeRatingPreference(rating))
    .filter((item): item is RatingPreference => item !== null);

  if (normalized.length === 0) {
    return ALL_RATING_PREFERENCES.join(',');
  }

  return [...new Set(normalized)].join(',');
};

export const orderRatingPreferencesForRender = (
  preferences: RatingPreference[],
  {
    prioritizeAnimeRatings = false,
    preserveInputOrder = false,
  }: {
    prioritizeAnimeRatings?: boolean;
    preserveInputOrder?: boolean;
  } = {},
) => {
  if (!prioritizeAnimeRatings || preserveInputOrder) {
    return [...preferences];
  }

  const prioritized = ANIME_PRIORITY_RATING_PREFERENCES.filter((provider) => preferences.includes(provider));
  const remaining = preferences.filter((provider) => !ANIME_PRIORITY_RATING_PREFERENCES.includes(provider));
  return [...prioritized, ...remaining];
};
