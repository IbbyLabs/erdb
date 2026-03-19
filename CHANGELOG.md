## [v2.16.0] - 19/03/2026

### Other Changes
- chore: normalize date formats to UK standard (DD/MM/YYYY)
- chore: add automated changelog management

## [v2.15.0] - 19/03/2026

### Added
- feat(ui): implement select-all as default for rating preferences
- feat(badge): normalize ratings to 0-10 scale and optimize backdrop layout for multi-row

### Fixed
- fix(badge): display 10.0 as 10 for cleaner visuals

### Other Changes
- Update route.tsx
- Normalize ratings to a 0-10 scale and improve anime/backdrop badge behavior

## [v2.14.3] - 19/03/2026

### Fixed
- fix(poster): improve badge layout spacing and column limits

### Other Changes
- Update route.tsx

## [v2.14.2] - 19/03/2026

### Fixed
- fix(ui): prevent long strings from overflowing containers on mobile

### Other Changes
- ci(docker): upgrade build-push-action to v6 and enable provenance

## [v2.14.1] - 19/03/2026

### Other Changes
- test: add posterQualityBadgesPosition to workspace round-trip assertion

## [v2.14.0] - 19/03/2026

### Added
- feat(ui): add show/hide toggles for config string and proxy URL
- feat(render,ui): add posterQualityBadgesPosition setting
- feat(proxy): add posterQualityBadgesPosition to addon proxy config
- feat(render): handle 3-badge top row in left-right poster layout

### Performance
- perf(cache): remove metadata cache hard row cap

### Other Changes
- style(ui): apply violet theme to configurator card and toggle buttons
- .
- .
- Update page.tsx
- .
- Update page.tsx
- Add show/hide toggles for config and proxy
- Add posterQualityBadgesPosition option
- Add posterQualityBadgesPosition support
- Handle 3-badge top row in left-right layout

## [v2.13.8] - 19/03/2026

### Documentation
- docs: add comprehensive env vars reference and fix stale docs

## [v2.13.7] - 19/03/2026

### Added
- feat(proxy): route Torrentio requests through HTTP_PROXY/HTTPS_PROXY

### Fixed
- fix: sync pnpm lockfile for undici dependency

## [v2.13.5] - 19/03/2026

### Fixed
- fix(proxy): add User-Agent header to Torrentio fetch to bypass 403

## [v2.13.4] - 19/03/2026

### Other Changes
- chore: add per-request log to verify deployed code version

## [v2.13.3] - 19/03/2026

### Other Changes
- chore: add diagnostic logging for Torrentio fetch failures

## [v2.13.2] - 18/03/2026

### Fixed
- fix(proxy): strip internal port from public-facing image URLs

## [v2.13.1] - 18/03/2026

### Fixed
- fix(proxy): remove torrentio language filter for badge detection

## [v2.13.0] - 18/03/2026

### Added
- feat(proxy): added an override for badges

## [v2.11.2] - 18/03/2026

### Fixed
- fix(proxy): resolve stremio badge inconsistency by adding Torrentio concurrency limiter and fixing series streams

### Other Changes
- ci: fix release workflow dependency

## [v2.11.1] - 18/03/2026

### Fixed
- fix(render): remove lingering edge middleware to resolve CSP hydration block

### Other Changes
- chore: remove temporary commit file

## [v2.11.0] - 18/03/2026

### Other Changes
- chore(audit): repo-wide performance and security fixes
- chore(audit): repo-wide performance and security fixes

## [v2.10.2] - 18/03/2026

### Other Changes
- chore: tightened some wording

## [v2.10.1] - 18/03/2026

### Added
- feat: tighten the merged configurator workspace layout

## [v2.10.0] - 18/03/2026

### Added
- feat: collapse proxy configuration into the shared configurator flow

## [v2.9.0] - 18/03/2026

### Added
- feat: unify configurator and addon proxy workflows

## [v2.8.1] - 18/03/2026

### Fixed
- fix: use configured CORS fallback origin in proxy routes

## [v2.8.0] - 18/03/2026

### Other Changes
- chore: detail post-v2.7.2 updates

## [v2.7.2] - 18/03/2026

### Fixed
- fix(errors): improve upstream TMDB error classification

## [v2.7.1] - 18/03/2026

### Other Changes
- chore: cleanup

## [v2.7.0] - 17/03/2026

### Other Changes
- Redesign homepage UI; add fonts & smooth scroll
- Update page.tsx
- Translate catalog metas concurrently
- Add translateMeta option and TMDB translation
- Add config export/import and refactor proxy UI
- Create LICENSE
- Bump renderer cache; set ratings to bottom

## [v2.6.0] - 17/03/2026

### Added
- feat(ui): surface uptime tracker across landing page

## [v2.5.0] - 17/03/2026

### Added
- feat(ui): improve preview error feedback and hero layout

### Other Changes
- Create LICENSE
- chore(ci): disable next telemetry in docker, pin node to 22

## [v2.4.4] - 17/03/2026

### Fixed
- fix(ci): complete pnpm migration

## [v2.4.3] - 17/03/2026

### Other Changes
- build(ci): switch to pnpm, enable corepack, optimize Docker and workflows for speed

## [v2.4.2] - 17/03/2026

### Fixed
- fix(branding): expand selected labels

## [v2.4.1] - 17/03/2026

### Other Changes
- ci: queue docker workflow

## [v2.4.0] - 17/03/2026

### Added
- feat(config): save api key config

## [v2.3.0] - 17/03/2026

### Added
- feat: add recent changes feed and restore automated release flow

## [v2.2.1] - 17/03/2026

### Fixed
- fix: resolve homepage lint regressions

## [v2.2.0] - 17/03/2026

### Added
- feat: refresh branding, stabilize UI, and improve release pipeline

## [v2.1.0] - 17/03/2026

### Added
- feat(ui): align branding and chrome theme

### Other Changes
- ci: reduce duplicate docker runs
- chore(deps): adjust renovate config
- chore(deps): enable fork processing
- chore(deps): enable renovate onboarding

## [v2.0.1] - 17/03/2026

### Other Changes
- chore(ci): enable docker layer cache
- chore(deps): add renovate configuration

## [v2.0.0] - 17/03/2026

## [v1.1.0] - 17/03/2026

### Other Changes
- ci: update sync schedule to uk time
- ci: add upstream sync workflow
- chore: adjust docker base image
- chore: update proxy and docker setup

## [v1.0.4] - 17/03/2026

### Other Changes
- Bump renderer cache; set ratings to bottom

## [v1.0.3] - 17/03/2026

### Fixed
- fix: lint cleanup

## [v1.0.2] - 17/03/2026

### Added
- feat(ci): split ci and publish

## [v1.0.1] - 17/03/2026

### Other Changes
- chore: adjust release script

## [v1.0.0] - 17/03/2026

## [v0.2.0] - 17/03/2026

### Added
- feat(ci): add docker publish workflow

### Fixed
- Fix typo in HuggingFace Guide section

### Other Changes
- Update route.tsx
- Update route.tsx
- Update page.tsx
- Update route.tsx
- Update route.tsx
- Render poster title/logo overlays & bump cache
- Handle square style stroke width in badge
- Add Torrentio stream quality badges & rendering
- Update README.md
- Update README to remove Dockerfile.hf note
- Update README.md
- Update README.md
- Update Dockerfile
- Update Dockerfile.hf
- Update Dockerfile.hf
- Update route.tsx
- .
- Update route.tsx
- Update route.tsx
- Update route.tsx
- .
- .
- Update route.ts
- Update page.tsx
- Update README.md
- Delete for unsupported addons.mp4
- Delete for supported addons.mp4
- Add files via upload
- Update Dockerfile
- .
- .
- Update addonProxy.ts
- Update page.tsx
- .
- HuggingFace Dockerfile
- Update Dockerfile
- .
- .
- Update README.md
- proxy any addon
- Update page.tsx
- Update README.md
- Update page.tsx
- Update route.tsx
- Update route.tsx
- .
- Update route.tsx
- Update route.tsx
- Update route.tsx
- Update README.md
- Update route.tsx
- Update route.tsx
- Update docker-compose.yml
- Update README.md
- .
- Update README.md
- Update README.md
- Update README.md
- Update README.md
- Initial commit

