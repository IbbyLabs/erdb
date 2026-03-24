export const STACKED_BADGE_MIN_VALUE_GAP = 6;
export const STACKED_BADGE_MIN_RAIL_GAP = 8;

export const getStackedBadgeHeight = ({
  iconSize,
  fontSize,
  paddingY,
}: {
  iconSize: number;
  fontSize: number;
  paddingY: number;
}) => {
  const baseHeight = iconSize + paddingY * 2;
  return baseHeight + Math.max(18, Math.round(fontSize * 1.15) + Math.round(paddingY * 1.1));
};

export const computeStackedBadgeLayout = ({
  width,
  height,
  paddingX,
  fontSize,
  renderIconSize,
  accentLineVisible = true,
  accentLineWidthPercent = 100,
  accentLineHeightPercent = 100,
  accentLineGapPercent = 100,
}: {
  width: number;
  height: number;
  paddingX: number;
  fontSize: number;
  renderIconSize: number;
  accentLineVisible?: boolean;
  accentLineWidthPercent?: number;
  accentLineHeightPercent?: number;
  accentLineGapPercent?: number;
}) => {
  const outerPadding = Math.max(8, Math.round(paddingX * 0.82));
  const lineWidthScale = Math.max(0.4, Math.min(1.6, accentLineWidthPercent / 100));
  const lineHeightScale = Math.max(0.5, Math.min(2.2, accentLineHeightPercent / 100));
  const lineGapScale = Math.max(0, Math.min(2.2, accentLineGapPercent / 100));
  const baseAccentRailWidth = Math.max(18, Math.round(width * 0.42));
  const accentRailWidth = accentLineVisible
    ? Math.max(
        12,
        Math.min(width - outerPadding * 2, Math.round(baseAccentRailWidth * lineWidthScale)),
      )
    : 0;
  const accentRailHeight = accentLineVisible
    ? Math.max(3, Math.round(Math.max(4, Math.round(height * 0.08)) * lineHeightScale))
    : 0;
  const accentRailX = Math.round((width - accentRailWidth) / 2);
  const accentRailY = accentLineVisible ? Math.max(4, Math.round(height * 0.07)) : outerPadding;
  const railToIconGap = accentLineVisible
    ? Math.max(0, Math.round(Math.max(STACKED_BADGE_MIN_RAIL_GAP, Math.round(height * 0.1)) * lineGapScale))
    : 0;
  const iconPlateY = accentLineVisible
    ? Math.max(accentRailY + accentRailHeight + railToIconGap, Math.round(height * 0.18))
    : Math.max(outerPadding, Math.round(height * 0.13));
  const valueGap = Math.max(STACKED_BADGE_MIN_VALUE_GAP, Math.round(height * 0.07));
  const bottomPadding = Math.max(10, Math.round(height * 0.15));
  let valueFontSize = Math.max(11, Math.min(fontSize, Math.round(height * 0.22)));
  const minIconPlateSize = Math.max(renderIconSize + 4, 18);
  const desiredIconPlateSize = Math.max(renderIconSize + 6, Math.round(height * 0.34));

  while (
    valueFontSize > 10 &&
    iconPlateY + minIconPlateSize + valueGap + valueFontSize > height - bottomPadding
  ) {
    valueFontSize -= 1;
  }

  const maxIconPlateBottom = height - bottomPadding - valueFontSize - valueGap;
  const maxIconPlateSize = Math.max(minIconPlateSize, maxIconPlateBottom - iconPlateY);
  const iconPlateSize = Math.max(minIconPlateSize, Math.min(desiredIconPlateSize, maxIconPlateSize));
  const iconPlateX = Math.round((width - iconPlateSize) / 2);
  const iconX = iconPlateX + Math.round((iconPlateSize - renderIconSize) / 2);
  const iconY = iconPlateY + Math.round((iconPlateSize - renderIconSize) / 2);
  const iconCenterX = Math.round(width / 2);
  const iconCenterY = iconPlateY + Math.round(iconPlateSize / 2);
  const iconRadius = Math.max(9, Math.round(iconPlateSize * 0.32));
  const iconFontSize = Math.max(11, Math.round(renderIconSize * 0.44));
  const valueTopY = iconPlateY + iconPlateSize + valueGap;
  const valueAvailableWidth = Math.max(0, width - outerPadding * 2);

  return {
    showAccentRail: accentLineVisible && accentRailWidth > 0 && accentRailHeight > 0,
    accentRailWidth,
    accentRailHeight,
    accentRailX,
    accentRailY,
    outerPadding,
    iconPlateSize,
    iconPlateX,
    iconPlateY,
    iconX,
    iconY,
    iconCenterX,
    iconCenterY,
    iconRadius,
    iconFontSize,
    valueFontSize,
    valueTopY,
    valueAvailableWidth,
    bottomPadding,
  };
};
