export type GenreBadgeMode = 'off' | 'text' | 'icon' | 'both';
export type GenreBadgeFamilyId =
  | 'anime'
  | 'horror'
  | 'comedy'
  | 'romance'
  | 'action'
  | 'scifi'
  | 'fantasy'
  | 'crime'
  | 'documentary';

export type GenreBadgeFamilyMeta = {
  id: GenreBadgeFamilyId;
  label: string;
  accentColor: string;
};

export type GenreBadgePreviewSample = {
  key: string;
  title: string;
  typeLabel: string;
  previewType: 'poster' | 'backdrop' | 'logo';
  mediaId: string;
  lang: string;
  familyId: GenreBadgeFamilyId;
  decision: string;
  params: Record<string, string>;
};

export const DEFAULT_GENRE_BADGE_MODE: GenreBadgeMode = 'off';

export const GENRE_BADGE_MODE_OPTIONS: Array<{
  id: GenreBadgeMode;
  label: string;
  description: string;
}> = [
  {
    id: 'off',
    label: 'Off',
    description: 'Disable genre badges.',
  },
  {
    id: 'text',
    label: 'Text',
    description: 'Render a small genre label only.',
  },
  {
    id: 'icon',
    label: 'Icon',
    description: 'Render the icon only.',
  },
  {
    id: 'both',
    label: 'Both',
    description: 'Render the icon with a short text label.',
  },
];

const GENRE_BADGE_MODE_SET = new Set<GenreBadgeMode>(
  GENRE_BADGE_MODE_OPTIONS.map((option) => option.id),
);

export const normalizeGenreBadgeMode = (
  value: unknown,
  fallback: GenreBadgeMode = DEFAULT_GENRE_BADGE_MODE,
): GenreBadgeMode => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return GENRE_BADGE_MODE_SET.has(normalized as GenreBadgeMode)
    ? (normalized as GenreBadgeMode)
    : fallback;
};

export const GENRE_BADGE_FAMILY_META: Record<GenreBadgeFamilyId, GenreBadgeFamilyMeta> = {
  anime: {
    id: 'anime',
    label: 'ANIME',
    accentColor: '#f59e0b',
  },
  horror: {
    id: 'horror',
    label: 'HORROR',
    accentColor: '#ef4444',
  },
  comedy: {
    id: 'comedy',
    label: 'COMEDY',
    accentColor: '#facc15',
  },
  romance: {
    id: 'romance',
    label: 'ROMANCE',
    accentColor: '#fb7185',
  },
  action: {
    id: 'action',
    label: 'ACTION',
    accentColor: '#fb923c',
  },
  scifi: {
    id: 'scifi',
    label: 'SCI FI',
    accentColor: '#22d3ee',
  },
  fantasy: {
    id: 'fantasy',
    label: 'FANTASY',
    accentColor: '#34d399',
  },
  crime: {
    id: 'crime',
    label: 'CRIME',
    accentColor: '#60a5fa',
  },
  documentary: {
    id: 'documentary',
    label: 'DOC',
    accentColor: '#a3e635',
  },
};

const TMDB_GENRE = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  fantasy: 14,
  horror: 27,
  mystery: 9648,
  romance: 10749,
  scienceFictionMovie: 878,
  thriller: 53,
  war: 10752,
  western: 37,
  actionAdventureTv: 10759,
  kids: 10762,
  scifiFantasyTv: 10765,
} as const;

const normalizeGenreName = (value: string) => value.trim().toLowerCase().replace(/[_-]+/g, ' ');

const collectGenreNames = (
  genres: Array<{ id?: number | null; name?: string | null } | string | null | undefined>,
) => {
  const result = new Set<string>();
  for (const genre of genres) {
    if (typeof genre === 'string') {
      const normalized = normalizeGenreName(genre);
      if (normalized) result.add(normalized);
      continue;
    }
    if (genre && typeof genre === 'object' && typeof genre.name === 'string') {
      const normalized = normalizeGenreName(genre.name);
      if (normalized) result.add(normalized);
    }
  }
  return result;
};

const collectGenreIds = (
  genres: Array<{ id?: number | null; name?: string | null } | string | null | undefined>,
  extraGenreIds: Array<number | string | null | undefined> = [],
) => {
  const result = new Set<number>();

  for (const genre of genres) {
    if (!genre || typeof genre !== 'object') continue;
    if (typeof genre.id === 'number' && Number.isFinite(genre.id)) {
      result.add(genre.id);
    }
  }

  for (const value of extraGenreIds) {
    const parsed =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number.parseInt(value, 10)
          : Number.NaN;
    if (Number.isFinite(parsed)) {
      result.add(parsed);
    }
  }

  return result;
};

const hasGenreName = (genreNames: Set<string>, ...candidates: string[]) =>
  candidates.some((candidate) => genreNames.has(normalizeGenreName(candidate)));

const hasGenreId = (genreIds: Set<number>, ...candidates: number[]) =>
  candidates.some((candidate) => genreIds.has(candidate));

export const resolveGenreBadgeFamily = (input: {
  genres?: Array<{ id?: number | null; name?: string | null } | string | null | undefined> | null;
  genreIds?: Array<number | string | null | undefined> | null;
  isAnimeContent?: boolean;
}): GenreBadgeFamilyMeta | null => {
  const genres = Array.isArray(input.genres) ? input.genres : [];
  const genreNames = collectGenreNames(genres);
  const genreIds = collectGenreIds(genres, Array.isArray(input.genreIds) ? input.genreIds : []);

  if (input.isAnimeContent) {
    return GENRE_BADGE_FAMILY_META.anime;
  }

  if (hasGenreName(genreNames, 'horror') || hasGenreId(genreIds, TMDB_GENRE.horror)) {
    return GENRE_BADGE_FAMILY_META.horror;
  }

  if (hasGenreName(genreNames, 'documentary') || hasGenreId(genreIds, TMDB_GENRE.documentary)) {
    return GENRE_BADGE_FAMILY_META.documentary;
  }

  if (hasGenreName(genreNames, 'comedy') || hasGenreId(genreIds, TMDB_GENRE.comedy)) {
    return GENRE_BADGE_FAMILY_META.comedy;
  }

  if (hasGenreName(genreNames, 'romance') || hasGenreId(genreIds, TMDB_GENRE.romance)) {
    return GENRE_BADGE_FAMILY_META.romance;
  }

  if (
    hasGenreName(genreNames, 'science fiction', 'sci fi & fantasy', 'sci-fi & fantasy') ||
    hasGenreId(genreIds, TMDB_GENRE.scienceFictionMovie, TMDB_GENRE.scifiFantasyTv)
  ) {
    return GENRE_BADGE_FAMILY_META.scifi;
  }

  if (hasGenreName(genreNames, 'fantasy') || hasGenreId(genreIds, TMDB_GENRE.fantasy)) {
    return GENRE_BADGE_FAMILY_META.fantasy;
  }

  if (hasGenreName(genreNames, 'crime') || hasGenreId(genreIds, TMDB_GENRE.crime)) {
    return GENRE_BADGE_FAMILY_META.crime;
  }

  if (
    hasGenreName(genreNames, 'action', 'adventure', 'war', 'western', 'action & adventure') ||
    hasGenreId(
      genreIds,
      TMDB_GENRE.action,
      TMDB_GENRE.adventure,
      TMDB_GENRE.war,
      TMDB_GENRE.western,
      TMDB_GENRE.actionAdventureTv,
    )
  ) {
    return GENRE_BADGE_FAMILY_META.action;
  }

  return null;
};

export const GENRE_BADGE_PREVIEW_SAMPLES: ReadonlyArray<GenreBadgePreviewSample> = [
  {
    key: 'evil-dead-poster',
    title: 'The Evil Dead',
    typeLabel: 'Movie Poster',
    previewType: 'poster',
    mediaId: 'tt0083907',
    lang: 'en',
    familyId: 'horror',
    decision: 'Direct horror match. The badge stays literal instead of trying to infer a more abstract mood.',
    params: {
      posterRatings: 'tmdb',
      ratingStyle: 'glass',
      imageText: 'original',
      posterRatingsLayout: 'bottom',
    },
  },
  {
    key: 'lotr-poster',
    title: 'The Fellowship of the Ring',
    typeLabel: 'Movie Poster',
    previewType: 'poster',
    mediaId: 'tt0120737',
    lang: 'en',
    familyId: 'fantasy',
    decision: 'Fantasy wins over adventure and action so the badge stays distinct from the action bucket.',
    params: {
      posterRatings: 'tmdb',
      ratingStyle: 'glass',
      imageText: 'original',
      posterRatingsLayout: 'top bottom',
    },
  },
  {
    key: 'matrix-backdrop',
    title: 'The Matrix',
    typeLabel: 'Movie Backdrop',
    previewType: 'backdrop',
    mediaId: 'tt0133093',
    lang: 'en',
    familyId: 'scifi',
    decision: 'Science fiction outranks action so the icon stays orbit focused instead of collapsing into a generic action marker.',
    params: {
      backdropRatings: 'tmdb',
      ratingStyle: 'square',
      imageText: 'clean',
      backdropRatingsLayout: 'right',
    },
  },
  {
    key: 'office-backdrop',
    title: 'The Office',
    typeLabel: 'Show Backdrop',
    previewType: 'backdrop',
    mediaId: 'tt0386676',
    lang: 'en',
    familyId: 'comedy',
    decision: 'Comedy is a strong bucket. Secondary workplace and drama signals are ignored for badge clarity.',
    params: {
      backdropRatings: 'tmdb',
      ratingStyle: 'glass',
      imageText: 'clean',
      backdropRatingsLayout: 'center',
    },
  },
  {
    key: 'breaking-bad-logo',
    title: 'Breaking Bad',
    typeLabel: 'Show Logo',
    previewType: 'logo',
    mediaId: 'tt0903747',
    lang: 'en',
    familyId: 'crime',
    decision: 'Crime is the cleanest bucket here. Thriller and drama stay out because their icon language is too fuzzy.',
    params: {
      logoRatings: 'tmdb',
      ratingStyle: 'plain',
      logoBackground: 'dark',
    },
  },
  {
    key: 'attack-on-titan-poster',
    title: 'Attack on Titan',
    typeLabel: 'Anime Poster',
    previewType: 'poster',
    mediaId: 'mal:16498',
    lang: 'ja',
    familyId: 'anime',
    decision: 'Anime native inputs force the anime bucket so the badge does not flatten into generic animation.',
    params: {
      posterRatings: 'tmdb',
      ratingStyle: 'glass',
      imageText: 'original',
      posterRatingsLayout: 'top bottom',
    },
  },
] as const;
