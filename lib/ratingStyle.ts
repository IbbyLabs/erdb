export type RatingStyle = 'glass' | 'square' | 'plain';

export const DEFAULT_RATING_STYLE: RatingStyle = 'glass';

export const RATING_STYLE_OPTIONS: Array<{ id: RatingStyle; label: string }> = [
  { id: 'glass', label: 'Pill Glass' },
  { id: 'square', label: 'Square Dark' },
  { id: 'plain', label: 'No Background' },
];

export const normalizeRatingStyle = (value?: string | null): RatingStyle => {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'glass' || normalized === 'square' || normalized === 'plain') {
    return normalized;
  }
  return DEFAULT_RATING_STYLE;
};
