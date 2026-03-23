import test from 'node:test';
import assert from 'node:assert/strict';

import sharp from 'sharp';

import { RATING_PROVIDER_OPTIONS } from '../lib/ratingPreferences.ts';

test('kitsu embedded icon keeps transparent corners for plain badge rendering', async () => {
  const kitsu = RATING_PROVIDER_OPTIONS.find((provider) => provider.id === 'kitsu');
  assert.ok(kitsu);
  assert.match(kitsu.iconUrl, /^data:image\/png;base64,/);

  const base64 = kitsu.iconUrl.slice('data:image/png;base64,'.length);
  const buffer = Buffer.from(base64, 'base64');
  const metadata = await sharp(buffer).metadata();

  assert.equal(metadata.hasAlpha, true);
  assert.equal(metadata.width, 64);
  assert.equal(metadata.height, 64);

  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const alphaAt = (x, y) => data[(y * info.width + x) * info.channels + 3];

  assert.equal(alphaAt(0, 0), 0);
  assert.equal(alphaAt(info.width - 1, 0), 0);
  assert.equal(alphaAt(0, info.height - 1), 0);
  assert.equal(alphaAt(info.width - 1, info.height - 1), 0);
  assert.ok(alphaAt(Math.floor(info.width / 2), Math.floor(info.height / 2)) > 0);
});
