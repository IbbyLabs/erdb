import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computeStackedBadgeLayout,
  getStackedBadgeHeight,
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

  assert.ok(layout.valueTopY - iconPlateBottom >= STACKED_BADGE_MIN_VALUE_GAP);
  assert.ok(valueBottom <= height - layout.bottomPadding);
  assert.ok(layout.iconPlateSize >= 20);
});
