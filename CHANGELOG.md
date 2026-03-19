# Changelog

All notable changes to this project will be documented in this file.
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
- chore: release 2.15.0

## [v2.14.3] - 19/03/2026

### Fixed
- fix(poster): improve badge layout spacing and column limits

### Other Changes
- Update route.tsx
- chore: release 2.14.3

## [v2.14.2] - 19/03/2026

### Fixed
- fix(ui): prevent long strings from overflowing containers on mobile

### Other Changes
- ci(docker): upgrade build-push-action to v6 and enable provenance
- chore: release 2.14.2

## [v2.14.1] - 19/03/2026

### Other Changes
- test: add posterQualityBadgesPosition to workspace round-trip assertion
- chore: release 2.14.1

## [v2.14.0] - 19/03/2026

### Added
- feat(ui): add show/hide toggles for config string and proxy URL
- feat(render,ui): add posterQualityBadgesPosition setting
- feat(proxy): add posterQualityBadgesPosition to addon proxy config
- feat(render): handle 3-badge top row in left-right poster layout

### Other Changes
- style(ui): apply violet theme to configurator card and toggle buttons
- perf(cache): remove metadata cache hard row cap
- .
- .
- Update page.tsx
- .
- Update page.tsx
- Add show/hide toggles for config and proxy
- Add posterQualityBadgesPosition option
- Add posterQualityBadgesPosition support
- Handle 3-badge top row in left-right layout
- chore: release 2.14.0

## [v2.13.8] - 19/03/2026

### Other Changes
- docs: add comprehensive env vars reference and fix stale docs
- chore: release 2.13.8

## [v2.13.7] - 19/03/2026

### Added
- feat(proxy): route Torrentio requests through HTTP_PROXY/HTTPS_PROXY

### Fixed
- fix: sync pnpm lockfile for undici dependency

### Other Changes
- chore: release 2.13.7
- chore: release 2.13.6

## [v2.13.5] - 19/03/2026

### Fixed
- fix(proxy): add User-Agent header to Torrentio fetch to bypass 403

### Other Changes
- chore: release 2.13.5

## [v2.13.4] - 19/03/2026

### Other Changes
- chore: release 2.13.4
- chore: add per-request log to verify deployed code version

## [v2.13.3] - 19/03/2026

### Other Changes
- chore: release 2.13.3
- chore: add diagnostic logging for Torrentio fetch failures

## [v2.13.2] - 18/03/2026

### Fixed
- fix(proxy): strip internal port from public-facing image URLs

### Other Changes
- chore: release 2.13.2

## [v2.13.1] - 18/03/2026

### Fixed
- fix(proxy): remove torrentio language filter for badge detection

### Other Changes
- chore: release 2.13.1

## [v2.13.0] - 18/03/2026

### Added
- feat(proxy): added an override for badges

### Other Changes
- chore: release 2.13.0
- chore: release 2.12.0

## [v2.11.2] - 18/03/2026

### Fixed
- fix(proxy): resolve stremio badge inconsistency by adding Torrentio concurrency limiter and fixing series streams

### Other Changes
- ci: fix release workflow dependency
- chore: release 2.11.2

## [v2.11.1] - 18/03/2026

### Fixed
- fix(render): remove lingering edge middleware to resolve CSP hydration block

### Other Changes
- chore: release 2.11.1
- chore: remove temporary commit file

## [v2.11.0] - 18/03/2026

### Other Changes
- chore: release 2.11.0
- chore(audit): repo-wide performance and security fixes
- chore(audit): repo-wide performance and security fixes

## [v2.10.2] - 18/03/2026

### Other Changes
- chore: release 2.10.2
- chore: tightened some wording

## [v2.10.1] - 18/03/2026

### Added
- feat: tighten the merged configurator workspace layout

### Other Changes
- chore: release 2.10.1

## [v2.10.0] - 18/03/2026

### Added
- feat: collapse proxy configuration into the shared configurator flow

### Other Changes
- chore: release 2.10.0

## [v2.9.0] - 18/03/2026

### Added
- feat: unify configurator and addon proxy workflows

### Other Changes
- chore: release 2.9.0

## [v2.8.1] - 18/03/2026

### Fixed
- fix: use configured CORS fallback origin in proxy routes

### Other Changes
- chore: release 2.8.1

## [v2.8.0] - 18/03/2026

### Other Changes
- chore: release 2.8.0
- chore: detail post-v2.7.2 updates

## [v2.7.2] - 18/03/2026

### Fixed
- fix(errors): improve upstream TMDB error classification

### Other Changes
- chore: release 2.7.2

## [v2.7.1] - 18/03/2026

### Other Changes
- chore: release 2.7.1
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
- chore: release 2.7.0

## [v2.6.0] - 17/03/2026

### Added
- feat(ui): surface uptime tracker across landing page

### Other Changes
- chore: release 2.6.0

## [v2.5.0] - 17/03/2026

### Added
- feat(ui): improve preview error feedback and hero layout

### Other Changes
- Create LICENSE
- chore: release 2.5.0
- chore(ci): disable next telemetry in docker, pin node to 22

## [v2.4.4] - 17/03/2026

### Fixed
- fix(ci): complete pnpm migration

### Other Changes
- chore: release 2.4.4

## [v2.4.3] - 17/03/2026

### Other Changes
- build(ci): switch to pnpm, enable corepack, optimize Docker and workflows for speed

## [v2.4.2] - 17/03/2026

### Fixed
- fix(branding): expand selected labels

### Other Changes
- chore: release 2.4.2

## [v2.4.1] - 17/03/2026

### Other Changes
- ci: queue docker workflow
- chore: release 2.4.1

## [v2.4.0] - 17/03/2026

### Added
- feat(config): save api key config

### Other Changes
- chore: release 2.4.0

## [v2.3.0] - 17/03/2026

### Added
- feat: add recent changes feed and restore automated release flow

### Other Changes
- chore: release 2.3.0

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
- chore: release 2.1.0
- chore(deps): adjust renovate config
- chore(deps): enable fork processing
- chore(deps): enable renovate onboarding

## [v2.0.1] - 17/03/2026

### Other Changes
- chore(ci): enable docker layer cache
- chore(deps): add renovate configuration

## [v2.0.0] - 17/03/2026

### Other Changes
- chore: release 2.0.0

## [v1.1.0] - 17/03/2026

### Other Changes
- ci: update sync schedule to uk time
- ci: add upstream sync workflow
- chore: release 1.1.0
- chore: adjust docker base image
- chore: update proxy and docker setup

## [v1.0.4] - 17/03/2026

### Other Changes
- Bump renderer cache; set ratings to bottom
- chore: release 1.0.4

## [v1.0.3] - 17/03/2026

### Fixed
- fix: lint cleanup

### Other Changes
- chore: release 1.0.3

## [v1.0.2] - 17/03/2026

### Added
- feat(ci): split ci and publish

### Other Changes
- chore: release 1.0.2

## [v1.0.1] - 17/03/2026

### Other Changes
- chore: release 1.0.1
- chore: adjust release script

## [v1.0.0] - 17/03/2026

### Other Changes
- chore: release 1.0.0

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
- chore: release 0.2.0

