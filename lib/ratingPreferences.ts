import { METACRITIC_LOGO_DATA_URI, TRAKT_LOGO_DATA_URI } from './ratingProviderBrandAssets.ts';

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
    label: 'RT Audience',
    iconUrl:
      'https://upload.wikimedia.org/wikipedia/commons/d/da/Rotten_Tomatoes_positive_audience.svg',
    accentColor: '#f59e0b',
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
    iconUrl: METACRITIC_LOGO_DATA_URI,
    accentColor: '#66cc33',
  },
  {
    id: 'metacriticuser',
    label: 'Metacritic User',
    iconUrl: METACRITIC_LOGO_DATA_URI,
    accentColor: '#4caf50',
  },
  {
    id: 'trakt',
    label: 'Trakt',
    iconUrl: TRAKT_LOGO_DATA_URI,
    accentColor: '#8b5cf6',
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
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAFSUlEQVR42u2bvavUQBTF339gZ2chCDYWgmAhWCiKoIi8SrARG0EsxMLGSsRSsLDRxkaw1E6w0kawsBHstRbf833vgki8v+PcIRuT7GY3s1ndFMMm2SQ799yvc+/MrqxtbK4s81jpAegB6AHoAegB6AHoAUg3tndWvu8NlxQAE37r5Yts6/nTjOPlAsAE3nz7Jhue3K8BEItoCUlfvnfldKZx7UI2OHc4W1tfXxIATPsbHz9kwxP7pHlZAsfmCotmBUleipAIi+mvf/2C0LKEwerxhbOCZADsPLjjAmfff/7KNl+/khVgDYsUENMCcPmkBN55dD/bu76aDc4fybi+SG4wdV7PjxGNcmxj9+6NbHDxqIIfgg8uHdPAFRbJDaYKbtvPHkuTDI433r+TUIDB92heQpsLFMfw7CHiQum7K8FN6DKNhGfiw1MH/giHdu1Ted58G6ExdWkcbZcILwDOHMx+fP40IvDat28CjozBOyK4Tx7qmu4PALcNRrMHbKKuWZtUZuf6ZJISsELrRQtAWIRBMIFm4AFMdBfADQBzje9wHQBBCW3GkKnZ3d7Ny0RzpThcQBMeI3weADQqy/H4MO5Z7sHi7HmAiG4z7yAYc7xNHhDI8xMLUQQArU/wzF/DrAKLUCyZEYSZiU4T4VsDIFgE74rxZN48QCCY7ysodgFAzi1msYSZCQ/CiOaOif5JAGBY7IFkdccEA/K4hAtYFxBbByDEBPjINNmhVforomQZARYY+ULBKpIAEFLwNK7QagnsOdqKH3EGrIJegAQNYHAsAOyZtgGYxgpa0z78wNMTggsMA8LjhAgP/kotYOCIVTYBAEsKtYXcjJhT+F7vnrcFeDaIQTBEZs5xBZW/3Beswo8FyATM0ckPx7zPqbHIVxEEO2+aFttpfODvFRFakzeqC3vDEmQNlMrFyRe1zff2PECp2DLwZFEAab9Nf6EMAK7PBYDIAyBDFfk5ajhHY12wOnKDKUsQhM5VhVxTmc07ygC032jadmtXeDRu1kBe9spuIjN3wS1g4jIj5bCBQHCLQtfVHARCs7SkAHjAGwlgCG7naMcrPR/qBNURJACic+Smm6v/xS28KpwwEwB6OgBCQySaX9Dc7u2rUfDofyEt1mrdQGPCbuoOMIFMwNXFiQoA0rqAkZcRH7fj2OQsBB4msXvvVrn2wjWCW36y0bXGsMk6Rpg2CAIAzQvzfSK5entlPxYYoaev4iSxGKXEQi8Ra6jMKBMCkDYN8mKbOD9SZ2byfVaDijTYhJPJFyzGu8ilgDUhSqac+dQCdQhXaB/hy/wzttCb+nsLGSDJuoC0b52ivPYJdmWLo5FItVETGIDdFkNB+7hH3o+rhC+7dxbtN01/SQCQOefIjzcwyyY2EUdo4vuhzuh2aYwsQfoKabJyGcy7yy2YPhY0S1+w/Q0RIYeTBeruVZzw/v+0wls6durc/eKoR39rl6PZyoDkvh/2DlSSpXFmD+mZUfgkQRBKXBuNw74htKfVJVs+lzVMmgYNLKrFcVyku+XxMYuZMe+b6bOypGEgiAXiPlXrDF47wECLLPJf2ifoPIEMwLKaXdPgmFUmsoZYZEmPIBZc//RGSQKgCUPpnAfAQcAavAzWoig9AitwUqwMdweACUVBFAEIbkDjA20TINVboBW2MPsDWnQBhMcKAIBBMORcgltWiAFuDnuJOgEAP0fT7C/QdrrAHWJ/YI6bqDpxAd9j4J1dX+ruYvNUJxuT1CoLTc5a0vS/AhDdgH2DHuGX7v8CobvU9abJ/g8TPQA9AD0APQA9AD0AywvAb9ClQfi5P4ruAAAAAElFTkSuQmCC',
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
  anilistco: 'anilist',
  kitsu: 'kitsu',
};

export const normalizeRatingPreference = (value: string): RatingPreference | null => {
  const normalized = value.trim().toLowerCase().replace(/[\s._-]+/g, '');
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

export const selectAvailableRatingPreferences = (
  preferences: RatingPreference[],
  available: Iterable<RatingPreference>,
  maxCount?: number | null,
) => {
  const availableSet = new Set(available);
  const normalizedMaxCount =
    typeof maxCount === 'number' && Number.isFinite(maxCount) && maxCount > 0
      ? Math.floor(maxCount)
      : null;

  const selected: RatingPreference[] = [];
  for (const provider of preferences) {
    if (!availableSet.has(provider)) continue;
    selected.push(provider);
    // Apply the explicit max before any later layout splitting so side stacks
    // cannot silently grow past the requested provider count.
    if (normalizedMaxCount !== null && selected.length >= normalizedMaxCount) {
      break;
    }
  }

  return selected;
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
