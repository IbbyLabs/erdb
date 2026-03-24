import type { RatingPreference } from './ratingPreferences';

const PERCENTAGE_RATING_PROVIDERS = new Set<RatingPreference>([
  'mdblist',
  'tomatoes',
  'tomatoesaudience',
  'metacritic',
  'anilist',
  'kitsu',
]);

const SCALE_SUFFIX_RATING_PROVIDERS: Partial<Record<RatingPreference, string>> = {
  tmdb: '/10',
  imdb: '/10',
  metacriticuser: '/10',
  letterboxd: '/5',
  myanimelist: '/10',
  rogerebert: '/4',
};

const isImageOutput = (imageType?: 'poster' | 'backdrop' | 'logo') =>
  imageType === 'poster' || imageType === 'backdrop' || imageType === 'logo';

export const parseNumericRatingValue = (value: string) => {
  const numericValue = Number(value.replace('%', '').replace(',', '.').trim());
  return Number.isNaN(numericValue) || !Number.isFinite(numericValue) ? null : numericValue;
};

export const formatRatingNumber = (value: number) => {
  const rounded = value.toFixed(1);
  return rounded === '10.0' ? '10' : rounded;
};

export const normalizeRatingToTenPointValue = (
  provider: RatingPreference,
  baseValue: string,
): number | null => {
  if (baseValue === 'N/A') return null;

  const numericValue = parseNumericRatingValue(baseValue);
  if (numericValue === null) return null;

  if (provider === 'trakt') {
    return numericValue > 10 ? numericValue / 10 : numericValue;
  }

  if (PERCENTAGE_RATING_PROVIDERS.has(provider)) {
    return numericValue / 10;
  }

  const suffix = SCALE_SUFFIX_RATING_PROVIDERS[provider];
  if (suffix === '/10') return numericValue;
  if (suffix === '/5') return numericValue * 2;
  if (suffix === '/4') return numericValue * 2.5;

  return numericValue;
};

export const formatDisplayRatingValue = (
  provider: RatingPreference,
  baseValue: string,
  imageType?: 'poster' | 'backdrop' | 'logo'
) => {
  if (baseValue === 'N/A') return baseValue;

  if (provider === 'trakt') {
    const numericValue = parseNumericRatingValue(baseValue);
    if (isImageOutput(imageType) && numericValue !== null) {
      return formatRatingNumber(normalizeRatingToTenPointValue(provider, baseValue) as number);
    }
    if (numericValue !== null) {
      if (numericValue > 10) {
        return baseValue.endsWith('%') ? baseValue : `${baseValue}%`;
      }
      if (!baseValue.includes('/') && !baseValue.endsWith('%')) {
        return `${baseValue}/10`;
      }
    }
    return baseValue;
  }

  if (PERCENTAGE_RATING_PROVIDERS.has(provider)) {
    const numericValue = parseNumericRatingValue(baseValue);
    if (isImageOutput(imageType) && numericValue !== null) {
      return formatRatingNumber(normalizeRatingToTenPointValue(provider, baseValue) as number);
    }
    return baseValue.endsWith('%') ? baseValue : `${baseValue}%`;
  }

  const suffix = SCALE_SUFFIX_RATING_PROVIDERS[provider];
  const normalizedValue = normalizeRatingToTenPointValue(provider, baseValue);
  if (isImageOutput(imageType) && normalizedValue !== null) {
    return formatRatingNumber(normalizedValue);
  }
  if (suffix && !baseValue.includes('/') && !baseValue.endsWith('%')) {
    return `${baseValue}${suffix}`;
  }

  return baseValue;
};
