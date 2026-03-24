import type { RatingPreference } from './ratingPreferences.ts';

export type RatingProviderBadgeAppearance = {
  iconUrl: string;
  accentColor: string;
  label: string;
};

const SVG_DATA_URI_PREFIX = 'data:image/svg+xml;charset=utf-8,';

const buildSvgDataUri = (svg: string) =>
  `${SVG_DATA_URI_PREFIX}${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;

const parseNumericRatingValue = (value?: string | null) => {
  const normalized = String(value || '')
    .replace('%', '')
    .split('/')[0]
    .replace(',', '.')
    .trim();
  const numericValue = Number(normalized);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const buildTomatoIconSvg = ({
  bodyColor,
  leafColor,
  accentRingColor,
  showBadge = false,
  badgeColor = '#f59e0b',
  badgeText = '',
}: {
  bodyColor: string;
  leafColor: string;
  accentRingColor?: string;
  showBadge?: boolean;
  badgeColor?: string;
  badgeText?: string;
}) => `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
${accentRingColor ? `<circle cx="48" cy="52" r="31" fill="none" stroke="${accentRingColor}" stroke-width="7" />` : ''}
<path d="M37 24c2-8 20-8 22 0 7-3 13-1 17 5-7 3-12 6-17 12-4-6-12-10-22-11Z" fill="${leafColor}"/>
<circle cx="48" cy="55" r="24" fill="${bodyColor}"/>
<circle cx="61" cy="42" r="7" fill="rgba(255,255,255,0.28)"/>
${showBadge ? `<circle cx="70" cy="23" r="14" fill="${badgeColor}"/><path d="M63 23l4 4 9-10" fill="none" stroke="white" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>${badgeText ? `<text x="70" y="76" text-anchor="middle" font-family="'Noto Sans',Arial,sans-serif" font-size="9" font-weight="800" fill="${badgeColor}">${badgeText}</text>` : ''}` : ''}
</svg>`;

const buildRottenSplatSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
<path d="M48 13c5 0 8 7 12 9 5 2 12-1 16 3 4 4 2 11 4 16 2 5 9 8 9 13s-7 8-9 13c-2 5 0 12-4 16-4 4-11 1-16 3-4 2-7 9-12 9s-8-7-12-9c-5-2-12 1-16-3-4-4-2-11-4-16-2-5-9-8-9-13s7-8 9-13c2-5 0-12 4-16 4-4 11-1 16-3 4-2 7-9 12-9Z" fill="#84cc16"/>
<path d="M39 22c2-7 15-7 17 0 6-2 10-1 13 4-5 2-9 5-12 9-4-4-10-7-18-8Z" fill="#365314"/>
<circle cx="60" cy="40" r="6" fill="rgba(255,255,255,0.22)"/>
</svg>`;

const buildAudiencePopcornSvg = ({ spilled = false }: { spilled?: boolean }) => `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
${spilled ? `<g transform="translate(10 6) rotate(-14 38 46)">` : '<g>'}
<circle cx="34" cy="24" r="10" fill="#fff7d6"/>
<circle cx="47" cy="18" r="11" fill="#fff7d6"/>
<circle cx="60" cy="24" r="10" fill="#fff7d6"/>
<path d="M28 30h40l-6 39c-1 8-8 14-16 14s-15-6-16-14Z" fill="#fff7d6" stroke="#d97706" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M33 31h10v48H31Z" fill="#ef4444"/>
<path d="M53 31h10v48H51Z" fill="#ef4444"/>
</g>
${spilled ? '<circle cx="67" cy="69" r="6" fill="#fff7d6"/><circle cx="78" cy="61" r="5" fill="#fff7d6"/><circle cx="80" cy="74" r="4" fill="#fff7d6"/>' : ''}
</svg>`;

const buildMetacriticIconSvg = ({
  plateColor,
  iconColor = 'white',
  showStar = false,
}: {
  plateColor: string;
  iconColor?: string;
  showStar?: boolean;
}) => `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
<rect x="16" y="16" width="64" height="64" rx="16" fill="${plateColor}"/>
<text x="48" y="61" text-anchor="middle" font-family="'Arial Black','Noto Sans',Arial,sans-serif" font-size="42" font-weight="900" fill="${iconColor}">m</text>
${showStar ? '<path d="M75 22 78 30 87 30 80 35 83 43 75 38 67 43 70 35 63 30 72 30Z" fill="#facc15"/>' : ''}
</svg>`;

const buildMetacriticUserIconSvg = ({ plateColor }: { plateColor: string }) => `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
<circle cx="48" cy="48" r="32" fill="${plateColor}"/>
<circle cx="48" cy="39" r="11" fill="white"/>
<path d="M28 71c3-12 13-18 20-18s17 6 20 18" fill="white"/>
<path d="M64 25h10v8H64Z" fill="rgba(17,24,39,0.2)"/>
<path d="M69 24h4v18h-4Z" fill="rgba(17,24,39,0.2)"/>
</svg>`;

const buildTraktIconSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 48 48">
<path fill="#fff" d="M30.17 30.22 28.71 28.76 47.87 9.59a9 9 0 0 0-.23-1.15L27.33 28.77l2.16 2.16-1.46 1.46-3.62-3.62L46.85 6.29a11 11 0 0 0-.5-.88L23.02 28.76l4.31 4.31-1.46 1.46-14.39-14.4 1.46-1.46 8.62 8.62L45.1 3.72A11.22 11.22 0 0 0 36.73 0H11.27A11.28 11.28 0 0 0 0 11.27v25.48A11.27 11.27 0 0 0 11.27 48h25.47A11.27 11.27 0 0 0 48 36.75V12.38L30.17 30.22ZM21.54 25.91l-7.91-7.93 1.46-1.46L23 24.44l-1.46 1.47Zm2.15-2.17-7.91-7.92 1.46-1.46 7.92 7.92-1.47 1.46ZM43.4 35.12a8.29 8.29 0 0 1-8.28 8.28H12.88a8.29 8.29 0 0 1-8.28-8.28V12.88A8.29 8.29 0 0 1 12.88 4.6h20.78v2.08H12.88a6.21 6.21 0 0 0-6.2 6.2v22.23a6.21 6.21 0 0 0 6.2 6.21h22.24a6.21 6.21 0 0 0 6.2-6.21V31.6h2.08v3.51Z"/>
</svg>`;

const resolveTomatoesAppearance = (sourceValue: string | null | undefined) => {
  const numericValue = parseNumericRatingValue(sourceValue);
  if (numericValue === null) {
    return {
      iconUrl: buildSvgDataUri(
        buildTomatoIconSvg({ bodyColor: '#ef4444', leafColor: '#16a34a', accentRingColor: '#ef4444' })
      ),
      accentColor: '#fa320a',
      label: 'Rotten Tomatoes',
    };
  }
  if (numericValue >= 75) {
    return {
      iconUrl: buildSvgDataUri(
        buildTomatoIconSvg({
          bodyColor: '#ef4444',
          leafColor: '#16a34a',
          accentRingColor: '#f59e0b',
          showBadge: true,
        })
      ),
      accentColor: '#f59e0b',
      label: 'Rotten Tomatoes',
    };
  }
  if (numericValue >= 60) {
    return {
      iconUrl: buildSvgDataUri(
        buildTomatoIconSvg({ bodyColor: '#ef4444', leafColor: '#16a34a', accentRingColor: '#ef4444' })
      ),
      accentColor: '#fa320a',
      label: 'Rotten Tomatoes',
    };
  }
  return {
    iconUrl: buildSvgDataUri(buildRottenSplatSvg()),
    accentColor: '#84cc16',
    label: 'Rotten Tomatoes',
  };
};

const resolveAudienceTomatoesAppearance = (sourceValue: string | null | undefined) => {
  const numericValue = parseNumericRatingValue(sourceValue);
  const positive = numericValue === null ? true : numericValue >= 60;
  return {
    iconUrl: buildSvgDataUri(buildAudiencePopcornSvg({ spilled: !positive })),
    accentColor: positive ? '#f59e0b' : '#94a3b8',
    label: 'RT Audience',
  };
};

const resolveMetacriticAppearance = (sourceValue: string | null | undefined) => {
  const numericValue = parseNumericRatingValue(sourceValue);
  if (numericValue === null) {
    return {
      iconUrl: buildSvgDataUri(buildMetacriticIconSvg({ plateColor: '#66cc33' })),
      accentColor: '#66cc33',
      label: 'Metacritic',
    };
  }
  if (numericValue >= 81) {
    return {
      iconUrl: buildSvgDataUri(buildMetacriticIconSvg({ plateColor: '#65a30d', showStar: true })),
      accentColor: '#65a30d',
      label: 'Metacritic',
    };
  }
  if (numericValue >= 61) {
    return {
      iconUrl: buildSvgDataUri(buildMetacriticIconSvg({ plateColor: '#66cc33' })),
      accentColor: '#66cc33',
      label: 'Metacritic',
    };
  }
  if (numericValue >= 40) {
    return {
      iconUrl: buildSvgDataUri(buildMetacriticIconSvg({ plateColor: '#f59e0b', iconColor: '#111827' })),
      accentColor: '#f59e0b',
      label: 'Metacritic',
    };
  }
  return {
    iconUrl: buildSvgDataUri(buildMetacriticIconSvg({ plateColor: '#ef4444' })),
    accentColor: '#ef4444',
    label: 'Metacritic',
  };
};

const resolveMetacriticUserAppearance = (sourceValue: string | null | undefined) => {
  const numericValue = parseNumericRatingValue(sourceValue);
  if (numericValue === null) {
    return {
      iconUrl: buildSvgDataUri(buildMetacriticUserIconSvg({ plateColor: '#22c55e' })),
      accentColor: '#22c55e',
      label: 'Metacritic User',
    };
  }
  if (numericValue >= 8) {
    return {
      iconUrl: buildSvgDataUri(buildMetacriticUserIconSvg({ plateColor: '#22c55e' })),
      accentColor: '#22c55e',
      label: 'Metacritic User',
    };
  }
  if (numericValue >= 6) {
    return {
      iconUrl: buildSvgDataUri(buildMetacriticUserIconSvg({ plateColor: '#84cc16' })),
      accentColor: '#84cc16',
      label: 'Metacritic User',
    };
  }
  if (numericValue >= 4) {
    return {
      iconUrl: buildSvgDataUri(buildMetacriticUserIconSvg({ plateColor: '#f59e0b' })),
      accentColor: '#f59e0b',
      label: 'Metacritic User',
    };
  }
  return {
    iconUrl: buildSvgDataUri(buildMetacriticUserIconSvg({ plateColor: '#ef4444' })),
    accentColor: '#ef4444',
    label: 'Metacritic User',
  };
};

const resolveTraktAppearance = () => ({
  iconUrl: buildSvgDataUri(buildTraktIconSvg()),
  accentColor: '#8b5cf6',
  label: 'Trakt',
});

export const resolveRatingProviderBadgeAppearance = ({
  provider,
  label,
  iconUrl,
  accentColor,
  sourceValue,
}: {
  provider: RatingPreference;
  label: string;
  iconUrl: string;
  accentColor: string;
  sourceValue?: string | null;
}): RatingProviderBadgeAppearance => {
  if (provider === 'tomatoes') {
    return resolveTomatoesAppearance(sourceValue);
  }
  if (provider === 'tomatoesaudience') {
    return resolveAudienceTomatoesAppearance(sourceValue);
  }
  if (provider === 'metacritic') {
    return resolveMetacriticAppearance(sourceValue);
  }
  if (provider === 'metacriticuser') {
    return resolveMetacriticUserAppearance(sourceValue);
  }
  if (provider === 'trakt') {
    return resolveTraktAppearance();
  }
  return { iconUrl, accentColor, label };
};
