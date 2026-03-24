export type RatingStyle = 'glass' | 'square' | 'plain';
export type QualityBadgeStyle = RatingStyle | 'media';

export const DEFAULT_RATING_STYLE: RatingStyle = 'glass';
export const DEFAULT_QUALITY_BADGES_STYLE: QualityBadgeStyle = 'glass';

export const RATING_STYLE_OPTIONS: Array<{ id: RatingStyle; label: string }> = [
  { id: 'glass', label: 'Pill Glass' },
  { id: 'square', label: 'Square Dark' },
  { id: 'plain', label: 'No Background' },
];
export const QUALITY_BADGE_STYLE_OPTIONS: Array<{ id: QualityBadgeStyle; label: string }> = [
  ...RATING_STYLE_OPTIONS,
  { id: 'media', label: 'Media Marks' },
];

export const normalizeRatingStyle = (value?: string | null): RatingStyle => {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'glass' || normalized === 'square' || normalized === 'plain') {
    return normalized;
  }
  return DEFAULT_RATING_STYLE;
};

export const normalizeQualityBadgeStyle = (value?: string | null): QualityBadgeStyle => {
  const normalized = (value || '').trim().toLowerCase();
  if (
    normalized === 'glass' ||
    normalized === 'square' ||
    normalized === 'plain' ||
    normalized === 'media'
  ) {
    return normalized;
  }
  return DEFAULT_QUALITY_BADGES_STYLE;
};
