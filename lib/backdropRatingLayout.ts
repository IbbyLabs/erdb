export const BACKDROP_RATING_LAYOUT_OPTIONS = [
  { id: 'center', label: 'Center' },
  { id: 'right', label: 'Right' },
  { id: 'right-vertical', label: 'Right Vertical' },
] as const;

export type BackdropRatingLayout = (typeof BACKDROP_RATING_LAYOUT_OPTIONS)[number]['id'];

export const DEFAULT_BACKDROP_RATING_LAYOUT: BackdropRatingLayout = 'center';

const BACKDROP_RATING_LAYOUT_SET = new Set<BackdropRatingLayout>(
  BACKDROP_RATING_LAYOUT_OPTIONS.map((option) => option.id)
);

export const normalizeBackdropRatingLayout = (value?: string | null): BackdropRatingLayout => {
  const normalized = (value || '').trim().toLowerCase();
  return BACKDROP_RATING_LAYOUT_SET.has(normalized as BackdropRatingLayout)
    ? (normalized as BackdropRatingLayout)
    : DEFAULT_BACKDROP_RATING_LAYOUT;
};

export const isVerticalBackdropRatingLayout = (layout: BackdropRatingLayout) =>
  layout === 'right-vertical';
