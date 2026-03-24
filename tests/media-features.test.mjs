import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildMediaFeatureBadgesFromFlags,
  buildCertificationBadgeMeta,
  collectMediaFeatureFlags,
  normalizeCertificationBadgeLabel,
  normalizeUserFacingMediaBadgeLabel,
  parseMediaFeatureFlagsFromFilename,
  resolveMovieCertificationBadge,
  resolveTvCertificationBadge,
} from '../lib/mediaFeatures.ts';

test('media feature parsing recognizes bluray premium audio video flags', () => {
  const flags = parseMediaFeatureFlagsFromFilename(
    'Movie.2024.2160p.BluRay.DoVi.Atmos.BDREMUX.mkv',
  );

  assert.deepEqual(flags, {
    has4k: true,
    hasBluray: true,
    hasHdr: true,
    hasDolbyVision: true,
    hasDolbyAtmos: true,
    hasRemux: true,
  });
});

test('media feature badges prefer bluray over remux and dolby vision over hdr', () => {
  const badges = buildMediaFeatureBadgesFromFlags({
    has4k: true,
    hasBluray: true,
    hasHdr: true,
    hasDolbyVision: true,
    hasDolbyAtmos: true,
    hasRemux: true,
  });

  assert.deepEqual(
    badges.map((badge) => badge.key),
    ['4k', 'bluray', 'dolbyvision', 'dolbyatmos'],
  );
  assert.deepEqual(
    badges.map((badge) => badge.label),
    ['4K', 'Blu Ray', 'Dolby Vision', 'Dolby Atmos'],
  );
});

test('media feature flag collection merges multiple filenames', () => {
  const flags = collectMediaFeatureFlags([
    'Movie.2024.2160p.WEB-DL.DV.mkv',
    'Movie.2024.Atmos.mkv',
  ]);

  assert.equal(flags.has4k, true);
  assert.equal(flags.hasDolbyVision, true);
  assert.equal(flags.hasDolbyAtmos, true);
  assert.equal(flags.hasBluray, false);
});

test('certification labels remove user facing hyphens and unknown values', () => {
  assert.equal(normalizeCertificationBadgeLabel('pg-13'), 'PG 13');
  assert.equal(normalizeCertificationBadgeLabel('tv-ma'), 'TV MA');
  assert.equal(normalizeCertificationBadgeLabel('18+'), '18+');
  assert.equal(normalizeCertificationBadgeLabel('NR'), null);
});

test('generic media badge labels collapse user facing hyphens into spaces', () => {
  assert.equal(normalizeUserFacingMediaBadgeLabel('Blu-ray'), 'Blu ray');
  assert.equal(normalizeUserFacingMediaBadgeLabel('Dolby-Atmos'), 'Dolby Atmos');
});

test('certification badge meta stores sanitized labels', () => {
  assert.equal(buildCertificationBadgeMeta('tv-ma').label, 'TV MA');
});

test('movie certification resolution prefers the requested region first', () => {
  const certification = resolveMovieCertificationBadge(
    {
      results: [
        {
          iso_3166_1: 'US',
          release_dates: [{ certification: 'PG-13', type: 3 }],
        },
        {
          iso_3166_1: 'GB',
          release_dates: [{ certification: '15', type: 3 }],
        },
      ],
    },
    'en-GB',
  );

  assert.equal(certification, '15');
});

test('tv certification resolution falls back to available regions', () => {
  const certification = resolveTvCertificationBadge(
    {
      results: [
        { iso_3166_1: 'US', rating: 'TV-MA' },
      ],
    },
    'fr',
  );

  assert.equal(certification, 'TV MA');
});
