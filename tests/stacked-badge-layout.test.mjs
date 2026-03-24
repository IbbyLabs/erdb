import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computeStackedBadgeLayout,
  getStackedBadgeHeight,
  STACKED_BADGE_MIN_RAIL_GAP,
  STACKED_BADGE_MIN_VALUE_GAP,
} from '../lib/stackedBadgeLayout.ts';

test('stacked badge layout keeps the value below the icon plate with breathing room', () => {
  const height = getStackedBadgeHeight({
    iconSize: 24,
    fontSize: 18,
    paddingY: 6,
  });
  const layout = computeStackedBadgeLayout({
    width: 118,
    height,
    paddingX: 8,
    fontSize: 18,
    renderIconSize: 16,
  });

  const iconPlateBottom = layout.iconPlateY + layout.iconPlateSize;
  const valueBottom = layout.valueTopY + layout.valueFontSize;
  const railBottom = layout.accentRailY + layout.accentRailHeight;

  assert.ok(layout.iconPlateY - railBottom >= STACKED_BADGE_MIN_RAIL_GAP);
  assert.ok(layout.valueTopY - iconPlateBottom >= STACKED_BADGE_MIN_VALUE_GAP);
  assert.ok(valueBottom <= height - layout.bottomPadding);
  assert.ok(layout.iconPlateSize >= 20);
});

test('stacked badge layout supports hiding the accent rail and tightening the top spacing', () => {
  const height = getStackedBadgeHeight({
    iconSize: 24,
    fontSize: 18,
    paddingY: 6,
  });
  const defaultLayout = computeStackedBadgeLayout({
    width: 118,
    height,
    paddingX: 8,
    fontSize: 18,
    renderIconSize: 16,
  });
  const hiddenRailLayout = computeStackedBadgeLayout({
    width: 118,
    height,
    paddingX: 8,
    fontSize: 18,
    renderIconSize: 16,
    accentLineVisible: false,
  });

  assert.equal(hiddenRailLayout.showAccentRail, false);
  assert.equal(hiddenRailLayout.accentRailWidth, 0);
  assert.equal(hiddenRailLayout.accentRailHeight, 0);
  assert.ok(hiddenRailLayout.iconPlateY < defaultLayout.iconPlateY);
  assert.ok(
    hiddenRailLayout.valueTopY - (hiddenRailLayout.iconPlateY + hiddenRailLayout.iconPlateSize) >=
      STACKED_BADGE_MIN_VALUE_GAP,
  );
});
