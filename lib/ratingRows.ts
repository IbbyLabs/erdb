import { RATING_PROVIDER_OPTIONS, type RatingPreference } from './ratingPreferences.ts';

export type RatingProviderRow = {
  id: RatingPreference;
  enabled: boolean;
};

export const buildDefaultRatingRows = (): RatingProviderRow[] =>
  RATING_PROVIDER_OPTIONS.map((provider) => ({
    id: provider.id,
    enabled: true,
  }));

export const rowsToEnabledOrdered = (rows: RatingProviderRow[]): RatingPreference[] =>
  rows.filter((row) => row.enabled).map((row) => row.id);

export const enabledOrderedToRows = (enabledOrdered: RatingPreference[]): RatingProviderRow[] => {
  const enabledSet = new Set(enabledOrdered);
  const catalogIds = RATING_PROVIDER_OPTIONS.map((provider) => provider.id);
  const orderedIds = [
    ...enabledOrdered,
    ...catalogIds.filter((providerId) => !enabledSet.has(providerId)),
  ];

  return orderedIds.map((providerId) => ({
    id: providerId,
    enabled: enabledSet.has(providerId),
  }));
};
