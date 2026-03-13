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
    iconUrl: 'https://www.google.com/s2/favicons?domain=kitsu.io&sz=64',
    accentColor: '#f75239',
  },
] as const;

export type RatingPreference = (typeof RATING_PROVIDER_OPTIONS)[number]['id'];
export const ALL_RATING_PREFERENCES: RatingPreference[] = RATING_PROVIDER_OPTIONS.map((item) => item.id);
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
