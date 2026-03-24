import type { RatingPreference } from './ratingPreferences.ts';

export type RatingPresentation = 'standard' | 'minimal' | 'average' | 'blockbuster';
export type AggregateRatingSource = 'overall' | 'critics' | 'audience';

export const DEFAULT_RATING_PRESENTATION: RatingPresentation = 'standard';
export const DEFAULT_AGGREGATE_RATING_SOURCE: AggregateRatingSource = 'overall';

export const RATING_PRESENTATION_OPTIONS: Array<{
  id: RatingPresentation;
  label: string;
  description: string;
}> = [
  {
    id: 'standard',
    label: 'Standard',
    description: 'Current provider badges and layouts.',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'One clean score chip with the selected average source.',
  },
  {
    id: 'average',
    label: 'Average',
    description: 'One labeled average score for overall, critics, or audience.',
  },
  {
    id: 'blockbuster',
    label: 'Blockbuster',
    description: 'Deliberately dense badge rich promo mode.',
  },
];

export const AGGREGATE_RATING_SOURCE_OPTIONS: Array<{
  id: AggregateRatingSource;
  label: string;
  description: string;
}> = [
  {
    id: 'overall',
    label: 'Overall',
    description: 'Average across all available selected providers.',
  },
  {
    id: 'critics',
    label: 'Critics',
    description: 'Prefer critic focused sources such as Rotten Tomatoes and Metacritic.',
  },
  {
    id: 'audience',
    label: 'Audience',
    description: 'Prefer audience and user driven rating sources.',
  },
];

const CRITICS_RATING_PROVIDERS = new Set<RatingPreference>([
  'mdblist',
  'tomatoes',
  'metacritic',
  'rogerebert',
]);

const AUDIENCE_RATING_PROVIDERS = new Set<RatingPreference>([
  'tmdb',
  'imdb',
  'tomatoesaudience',
  'letterboxd',
  'metacriticuser',
  'trakt',
  'myanimelist',
  'anilist',
  'kitsu',
]);

export const normalizeRatingPresentation = (
  value: unknown,
  fallback: RatingPresentation = DEFAULT_RATING_PRESENTATION,
): RatingPresentation => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (
    normalized === 'standard' ||
    normalized === 'minimal' ||
    normalized === 'average' ||
    normalized === 'blockbuster'
  ) {
    return normalized;
  }
  return fallback;
};

export const normalizeAggregateRatingSource = (
  value: unknown,
  fallback: AggregateRatingSource = DEFAULT_AGGREGATE_RATING_SOURCE,
): AggregateRatingSource => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (normalized === 'overall' || normalized === 'critics' || normalized === 'audience') {
    return normalized;
  }
  return fallback;
};

export const usesAggregateRatingSource = (presentation: RatingPresentation) =>
  presentation === 'minimal' || presentation === 'average';

export const getAggregateRatingSourceLabel = (source: AggregateRatingSource) => {
  if (source === 'critics') return 'Critics';
  if (source === 'audience') return 'Audience';
  return 'Overall';
};

export const getAggregateRatingSourceShortLabel = (source: AggregateRatingSource) => {
  if (source === 'critics') return 'CRT';
  if (source === 'audience') return 'AUD';
  return 'AVG';
};

export const selectAggregateRatingProviders = (
  source: AggregateRatingSource,
  providers: RatingPreference[],
) => {
  if (source === 'overall') {
    return [...providers];
  }

  const filter =
    source === 'critics' ? CRITICS_RATING_PROVIDERS : AUDIENCE_RATING_PROVIDERS;
  const preferred = providers.filter((provider) => filter.has(provider));

  if (preferred.length > 0) {
    return preferred;
  }

  return [...providers];
};

export const hasAggregateRatingProvidersForSource = (
  source: AggregateRatingSource,
  providers: RatingPreference[],
) => {
  if (source === 'overall') {
    return providers.length > 0;
  }

  const filter =
    source === 'critics' ? CRITICS_RATING_PROVIDERS : AUDIENCE_RATING_PROVIDERS;
  return providers.some((provider) => filter.has(provider));
};
