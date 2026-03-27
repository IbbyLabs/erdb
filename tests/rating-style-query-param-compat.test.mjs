import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const routeSource = readFileSync(
  new URL('../app/[type]/[id]/route.tsx', import.meta.url),
  'utf8',
);

test('rating style query param precedence keeps canonical and legacy aliases', () => {
  assert.match(
    routeSource,
    /const typeRatingStyleParam =\s*imageType === 'poster'\s*\?\s*request\.nextUrl\.searchParams\.get\('posterRatingStyle'\)\s*\?\?\s*request\.nextUrl\.searchParams\.get\('posterRatingsStyle'\)\s*:\s*imageType === 'backdrop'\s*\?\s*request\.nextUrl\.searchParams\.get\('backdropRatingStyle'\)\s*\?\?\s*request\.nextUrl\.searchParams\.get\('backdropRatingsStyle'\)\s*:\s*imageType === 'logo'\s*\?\s*request\.nextUrl\.searchParams\.get\('logoRatingStyle'\)\s*\?\?\s*request\.nextUrl\.searchParams\.get\('logoRatingsStyle'\)\s*:\s*null;/,
  );
  assert.match(
    routeSource,
    /request\.nextUrl\.searchParams\.get\('ratingStyle'\)\s*\|\|\s*request\.nextUrl\.searchParams\.get\('ratingsStyle'\)\s*\|\|\s*typeRatingStyleParam\s*\|\|\s*request\.nextUrl\.searchParams\.get\('style'\)/,
  );
});
