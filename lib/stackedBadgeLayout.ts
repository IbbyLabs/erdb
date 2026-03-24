export const STACKED_BADGE_MIN_VALUE_GAP = 6;

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
  return baseHeight + Math.max(14, Math.round(fontSize * 1.05) + Math.round(paddingY * 0.8));
};

export const computeStackedBadgeLayout = ({
  width,
  height,
  paddingX,
  fontSize,
  renderIconSize,
}: {
  width: number;
  height: number;
  paddingX: number;
  fontSize: number;
  renderIconSize: number;
}) => {
  const outerPadding = Math.max(8, Math.round(paddingX * 0.82));
  const accentRailWidth = Math.max(18, Math.round(width * 0.42));
  const accentRailHeight = Math.max(4, Math.round(height * 0.08));
  const accentRailX = Math.round((width - accentRailWidth) / 2);
  const accentRailY = Math.max(5, Math.round(height * 0.09));
  const iconPlateY = Math.max(accentRailY + accentRailHeight + 5, Math.round(height * 0.15));
  const valueGap = Math.max(STACKED_BADGE_MIN_VALUE_GAP, Math.round(height * 0.07));
  const bottomPadding = Math.max(8, Math.round(height * 0.12));
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
