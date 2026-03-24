import test from 'node:test';
import assert from 'node:assert/strict';

import {
  QUALITY_BADGE_STYLE_OPTIONS,
  normalizeQualityBadgeStyle,
} from '../lib/ratingStyle.ts';

test('quality badge style normalizer accepts silver marks', () => {
  assert.equal(normalizeQualityBadgeStyle('silver'), 'silver');
  assert.equal(normalizeQualityBadgeStyle(' Silver '), 'silver');
});

test('quality badge style options expose silver marks in the UI list', () => {
  assert.ok(
    QUALITY_BADGE_STYLE_OPTIONS.some((option) => option.id === 'silver' && option.label === 'Silver Marks'),
  );
});
