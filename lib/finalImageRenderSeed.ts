import {
  encodeRatingProviderAppearanceOverrides,
  type RatingProviderAppearanceOverrides,
} from './badgeCustomization.ts';
import { DEFAULT_GENRE_BADGE_MODE } from './genreBadge.ts';

type FinalImageRenderSeedInput = {
  cacheVersion: string;
  imageType: 'poster' | 'backdrop' | 'logo';
  outputFormat: string;
  cleanId: string;
  requestedImageLang: string;
  posterTextPreference: string;
  posterArtworkSource: string;
  backdropArtworkSource: string;
  logoArtworkSource: string;
  posterRatingsLayout: string;
  posterRatingsMaxPerSide: number | null;
  posterRatingsMax: number | null;
  backdropRatingsLayout: string;
  backdropRatingsMax: number | null;
  logoRatingsMax: number | null;
  qualityBadgesSide: string;
  posterQualityBadgesPosition: string;
  qualityBadgesStyle: string;
  qualityBadgesMax: number | null;
  qualityBadgePreferences: string[];
  sideRatingsPosition: string;
  sideRatingsOffset: number;
  ratingPresentation: string;
  blockbusterDensity: string;
  aggregateRatingSource: string;
  ratingStyle: string;
  ratingValueMode: string;
  posterRatingBadgeScale: number;
  backdropRatingBadgeScale: number;
  logoRatingBadgeScale: number;
  posterQualityBadgeScale: number;
  backdropQualityBadgeScale: number;
  genreBadgeMode: string;
  genreBadgeStyle: string;
  genreBadgePosition: string;
  genreBadgeScale: number;
  logoBackground: string;
  effectiveRatingPreferences: string[];
  providerAppearanceOverrides: RatingProviderAppearanceOverrides;
  streamBadgesCacheKeySeed: string;
  fanartKeyHash: string;
  fanartClientKeyHash: string;
  renderCacheBuster: string;
};

export const buildFinalImageRenderSeedKey = (input: FinalImageRenderSeedInput) => {
  const isPoster = input.imageType === 'poster';
  const isBackdrop = input.imageType === 'backdrop';
  const isLogo = input.imageType === 'logo';
  const ratingBadgeScale =
    input.imageType === 'poster'
      ? input.posterRatingBadgeScale
      : input.imageType === 'backdrop'
        ? input.backdropRatingBadgeScale
        : input.logoRatingBadgeScale;
  const qualityBadgeScale =
    input.imageType === 'backdrop'
      ? input.backdropQualityBadgeScale
      : input.posterQualityBadgeScale;
  const providerAppearanceKey =
    encodeRatingProviderAppearanceOverrides(input.providerAppearanceOverrides) || '-';

  return [
    input.cacheVersion,
    input.imageType,
    input.outputFormat,
    input.cleanId,
    input.requestedImageLang,
    input.posterTextPreference,
    isPoster ? input.posterArtworkSource : '-',
    isBackdrop ? input.backdropArtworkSource : '-',
    isLogo ? input.logoArtworkSource : '-',
    isPoster ? input.posterRatingsLayout : '-',
    isPoster ? String(input.posterRatingsMaxPerSide ?? 'auto') : '-',
    isPoster ? String(input.posterRatingsMax ?? 'auto') : '-',
    isBackdrop ? String(input.backdropRatingsMax ?? 'auto') : '-',
    isLogo ? String(input.logoRatingsMax ?? 'auto') : '-',
    isPoster ? input.qualityBadgesSide : '-',
    isPoster && (input.posterRatingsLayout === 'top' || input.posterRatingsLayout === 'bottom')
      ? input.posterQualityBadgesPosition
      : '-',
    isLogo ? '-' : input.qualityBadgesStyle,
    isLogo ? '-' : String(input.qualityBadgesMax ?? 'auto'),
    isLogo ? '-' : input.qualityBadgePreferences.join(',') || 'none',
    isLogo ? '-' : String(qualityBadgeScale),
    isBackdrop ? input.backdropRatingsLayout : '-',
    isPoster || isBackdrop ? input.sideRatingsPosition : '-',
    isPoster || isBackdrop ? String(input.sideRatingsOffset) : '-',
    input.ratingPresentation,
    isPoster ? input.blockbusterDensity : '-',
    input.aggregateRatingSource,
    input.ratingStyle,
    input.ratingValueMode,
    String(ratingBadgeScale),
    input.genreBadgeMode,
    input.genreBadgeMode !== DEFAULT_GENRE_BADGE_MODE ? input.genreBadgeStyle : '-',
    input.genreBadgeMode !== DEFAULT_GENRE_BADGE_MODE ? input.genreBadgePosition : '-',
    String(input.genreBadgeScale),
    isLogo ? input.logoBackground : '-',
    input.effectiveRatingPreferences.join(',') || 'none',
    providerAppearanceKey,
    input.streamBadgesCacheKeySeed,
    input.fanartKeyHash || '-',
    input.fanartClientKeyHash || '-',
    input.renderCacheBuster || '-',
    'v3',
  ].join('|');
};
