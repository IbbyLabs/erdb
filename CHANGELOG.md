# Changelog

> [!NOTE]
> This changelog may contain duplicate entries for certain changes. This occurs when an upstream commit is followed by a corresponding conventional commit used for release management and repository standards.

## [v2.18.1] - 21/03/2026

### Added
- feat(proxy): add anime reverse-mapping fallback for metadata translation
  
  Route proxy metadata translation through a dedicated resolver that keeps the existing direct TMDB and IMDb path first, and only falls back to anime reverse mapping for anime-native IDs when the direct path does not apply.
  
  Use the Stremio anime mapping service to resolve mal/myanimelist, anilist, kitsu, and anidb IDs to TMDB, then probe the preferred TV/movie order before fetching localized TMDB details for translated titles, overviews, and episode metadata.
  
  Also add cached anime-mapping fetches plus regression tests covering MAL alias normalization, direct-path precedence over anime fallback, and alternate media-type fallback when the preferred TMDB type is missing.

### Fixed
- fix(proxy): canonicalize MAL addon proxy IDs for anime image rewrites
  
  Accept both mal:* and myanimelist:* addon IDs in proxy normalization, and canonicalize both forms to mal:* before building ERDB image URLs.
  
  This keeps proxy-side poster/background/logo rewrites aligned with the renderer's native anime mapping provider set, which recognizes mal as the canonical MyAnimeList provider prefix.
  
  Also add regression coverage for MAL alias normalization so anime addons emitting either form continue to resolve stable ERDB image URLs.

### Other Changes
- Update addonProxy.ts

## [v2.18.0] - 20/03/2026

### Added
- feat: polish homepage guidance and clean poster rendering
  
  Bring over the post-v2.17.4 UX and rendering improvements while keeping the existing IbbyLabs branding, proxy flow, and security-related behavior intact.
  
  - add hydration-safe client origin handling for generated URLs\n- add offset-aware smooth scrolling for nav, hero, and footer anchor links\n- add a prominent ERDB Discord support callout styled to match the landing page\n- keep the new support entry configurable with brand Discord env vars\n- only apply clean poster title and logo overlays when the selected poster is actually textless
  
  Tests:\n- npm run lint\n- npm test\n- npx tsc --noEmit

## [v2.17.4] - 20/03/2026

### Other Changes
- chore: added disclaimer to CHANGELOG.md to explain duplicate commits

## [v2.17.3] - 20/03/2026

### Documentation
- docs: update README.md (Upstream change - video link)

### Other Changes
- Update README.md

## [v2.17.2] - 20/03/2026

### Added
- feat(changelog): support multi-line commit messages and backfill history
  
  This update refactors the changelog script to capture full commit bodies (using %b) and correctly indent them in the Markdown output.
  
  It also adds a --rebuild flag to systematically backfill the entire project history, ensuring older commits also show their detailed descriptions in the changelog and the 'Recent Changes' UI.

## [v2.17.1] - 20/03/2026

### Added
- feat: include all lines of commit message

## [v2.17.0] - 20/03/2026

### Added
- feat: refine recent changes feed
  
  - enhance [generate-commits-json.mjs] to include author/isUpstream metadata
  - add UI badges and custom styling in for upstream attribution
  - configure GitHub action to fetch full history (fetch-depth: 0)

## [v2.16.2] - 20/03/2026

### Added
- feat(ui): implement select-all as default for rating preferences
- feat(badge): normalize ratings to 0-10 scale and optimize backdrop layout for multi-row
  
  This update standardizes ratings across poster, backdrop, and logo outputs by converting all providers to a 0-10 visual scale. It also improves backdrop rating rendering with dynamic multi-row layouts and prioritizes anime-specific providers.
- feat(ui): add show/hide toggles for config string and proxy URL
  
  Add ability to toggle visibility of the ERDB config string and
  generated proxy URL to prevent accidental exposure during
  screen-sharing or streaming.
  
  - Import `Eye` and `EyeOff` icons from lucide-react
  - Add `maskSensitiveText` helper that replaces visible characters
    with asterisks
  - Add `showConfigString` and `showProxyUrl` state with `useEffect`
    hooks to auto-hide when the underlying values are cleared
  - Compute `displayedConfigString` and `displayedProxyUrl` using
    masked values when hidden
  - Add toggle buttons next to copy buttons in both the config string
    and proxy URL sections
  - Apply `select-none` CSS class when masked to prevent clipboard
    selection of asterisks
- feat(render,ui): add posterQualityBadgesPosition setting
  
  Introduce `posterQualityBadgesPosition` to control quality-badge
  placement for poster `top`/`bottom` layouts. Accepted values:
  `auto` (default), `left`, `right`.
  
  Server (`route.tsx`):
  - Add `PosterQualityBadgesPosition` type and `normalizePosterQualityBadgesPosition`
  - Add `resolvePosterQualityBadgePlacement` resolver that determines
    placement based on layout, qualityBadgesSide, and the new setting
  - Replace hardcoded placement logic in `renderWithSharp` with the
    resolver function
  - Parse `posterQualityBadgesPosition` from URL search params
  - Include in both render-seed and final-image cache keys
  
  Client (`page.tsx`):
  - Add state, derived visibility booleans, and a Position toggle UI
    (auto/left/right) shown only for `top` or `bottom` poster layouts
  - Include in preview URL, config export, proxy URL, and AI prompt
  
  Config (`uiConfig.ts`):
  - Add type, default (`auto`), normalizer, and include in
    `SharedErdbSettings`, `normalizeSharedErdbSettings`, and
    `buildSharedPayload`
- feat(proxy): add posterQualityBadgesPosition to addon proxy config
  
  Register `posterQualityBadgesPosition` across the proxy layer:
  
  - Add to `ERDB_OPTIONAL_PARAMS` array
  - Include in the `ProxyConfig` type definition
  - Add to `PROXY_OPTIONAL_STRING_KEYS` for optional string handling
  
  This ensures the poster quality badge position setting is recognized,
  typed, and treated as an optional string key for proxy URL generation.
- feat(render): handle 3-badge top row in left-right poster layout
  
  Add support for an extra centered top badge when using the left-right
  poster ratings layout with an odd number of badges.
  
  - `splitPosterBadgesByLayout` now surfaces a single top badge when
    the total is odd, with remaining badges split evenly across left
    and right columns
  - `getMaxBadgeColumnCount` and `fitPosterBadgeMetricsToHeight` gain
    a `reservedTopRows` parameter so column heights correctly subtract
    the reserved top-row space
  - `renderWithSharp` gains `splitAcrossHalves` and `spreadAcrossThirds`
    composition flags for the row renderer
  - `getPosterRatingLayoutMaxBadges` for `left-right` now returns
    `n*2 + 1` and `describePosterRatingLayoutLimit` includes the
    top-center badge in the human-readable description
- feat(proxy): route Torrentio requests through HTTP_PROXY/HTTPS_PROXY
  
  Node.js native fetch does not respect HTTP_PROXY/HTTPS_PROXY env vars.
  This adds undici's ProxyAgent to route Torrentio stream badge requests
  through the configured proxy (e.g. gluetun VPN container).
  
  Also includes the User-Agent fix from v2.13.5 to bypass Cloudflare
  bot protection on Torrentio.
- feat(proxy): added an override for badges
- feat: tighten the merged configurator workspace layout
  
  Restructure the primary workspace surface into a denser desktop composition so the configurator, live preview, config-string export, and thin proxy panel read as one all-in-one flow instead of two spaced-out sections.
  
  Keep the merged proxy behavior intact by preserving the manifest-only proxy input while moving the preview stack back into the center column and reducing visual dead space across the workspace container, card chrome, and header treatment.
  
  Retain the existing persistence and export wiring so the new layout remains compatible with the shared workspace model, copied config strings, and generated proxy manifests.
- feat: collapse proxy configuration into the shared configurator flow
  
  Remove the duplicate proxy-side ERDB controls so the addon proxy only accepts an upstream manifest URL and consumes the configurator state above as its single source of truth.
  
  Drop proxy enabled-type state from the saved workspace model and proxy URL builder, while continuing to normalize older saved payloads that still include legacy enabled flags.
  
  Update browser-facing copy to make the merged workflow explicit and extend regression coverage for workspace serialization plus proxy payload generation under the new contract.
- feat: unify configurator and addon proxy workflows
  
  - remove the duplicated proxy-side ERDB settings state and drive both exports from one shared configuration model
  
  - add full workspace save and JSON download/import support with migration from the legacy API-key-only local storage format
  
  - extract shared UI config helpers for serialization, proxy payload generation, and browser-safe base64url encoding
  
  - add regression tests for workspace round-tripping and shared config/proxy manifest generation
  
  - validate with npm run lint, npm test, npm run build, browser verification of shared-state persistence and JSON download, and live proxy checks against Cinemeta meta rewriting
- feat(ui): surface uptime tracker across landing page
  
  Changes since last release (v2.5.0):
  
  - add a dedicated status pill component that links to the IbbyLabs uptime tracker
  
  - wire uptime links into top navigation and footer for faster status access
  
  - add a status-board explainer section near the page end with a clear CTA
  
  - introduce focused status pill styles with hover and focus-visible states
  
  - update hero copy to clarify project positioning in the same ecosystem
- feat(ui): improve preview error feedback and hero layout
  
  Add detailed preview error diagnostics for image load failures, including TMDB key hints and API/network messaging. Update hero overflow and mobile commit window sizing to prevent clipping and improve small-screen layout.
- feat(config): save api key config
- feat: add recent changes feed and restore automated release flow
  
  - add a Recent changes panel on the homepage with commit type badges, relative timestamps, and incremental loading
  
  - mirror uptime-status commit feed behavior by loading /commits.json and adding robust client-side handling for loading and empty/error states
  
  - add a git-log export utility (scripts/generate-commits-json.mjs) and package script to regenerate public/commits.json
  
  - harden commit subject parsing to accept both colon-with-space and colon-without-space conventional commit forms
  
  - update release automation to require a clean tree and push commit+tag automatically after npm version so chore release commits are restored
  
  - include styling and integration updates needed for the new recent changes workflow surface
- feat: refresh branding, stabilize UI, and improve release pipeline
  
  - update ERDB page structure and styling with a redesigned hero, section headers, and panel system
  
  - fix layout overflow and preview regressions by tightening responsive shrink behavior and client-side preview URL handling
  
  - remove redundant footer subtitle copy for fork-safe presentation
  
  - add complete favicon/web manifest asset set and align layout metadata/icons
  
  - update Docker publishing workflow and Dockerfile to improve release publishing and cache behavior
  
  - revise README instructions and bump package version to 2.2.0 for this feature release
- feat(ui): align branding and chrome theme
- feat(ci): split ci and publish
- feat(ci): add docker publish workflow

### Fixed
- fix: recent changes ui
- fix(badge): display 10.0 as 10 for cleaner visuals
  
  Rounding values of 10.0 to 10 to ensure a consistent look across providers when they reach the maximum normalized rating.
- fix(poster): improve badge layout spacing and column limits
  
  - Capped quality badges strictly at 2 items per column (left/right) to prevent vertical overflow.
  
  - Dynamically adjust vertical start offset when backdrop ratings layout is 'center' matching top/bottom badges, preventing overlap with rating badges.
- fix(ui): prevent long strings from overflowing containers on mobile
  
  - Add `overflow-hidden` to the config string and generated manifest wrapper divs to ensure long `break-all` text respects the `rounded-2xl` border on narrow viewports
  
  - Add `min-w-0` to the manifest URL input field so it can shrink below its intrinsic width in the flex/grid layout
  
  - Add `overflow-y-hidden` to the base structure code block container to prevent vertical bleed while retaining `overflow-x-auto`
- fix: sync pnpm lockfile for undici dependency
- fix(proxy): add User-Agent header to Torrentio fetch to bypass 403
  
  Torrentio/Cloudflare returns 403 for requests without a browser-like
  User-Agent header. This caused all stream quality badges (4K, HDR, DV,
  Atmos) to silently fail in production. Adding a Chrome User-Agent to
  the fetch request resolves the issue.
- fix(proxy): strip internal port from public-facing image URLs
  
  When ERDB runs behind a reverse proxy (ERDB_TRUST_PROXY_HEADERS=true),
  the internal port (e.g. :3000) was leaking into generated image URLs.
  This made all poster, backdrop, and logo URLs unreachable through the
  reverse proxy, causing blank posters and missing badges in Stremio.
  
  Now strips the port from generated URLs when behind a trusted proxy,
  so URLs use the reverse proxy's default port instead.
- fix(proxy): remove torrentio language filter for badge detection
  
  The `language=italian` filter in the Torrentio stream URL caused empty
  results for all non-Italian content, preventing quality badges (4K, HDR,
  Dolby Vision, etc.) from appearing on most titles.
  
  Since badge detection only needs to know WHETHER quality streams exist
  (not their language), the language filter is now removed entirely.
  This ensures Torrentio returns all available streams for accurate
  badge generation regardless of content language.
  
  Also adds ERDB_TORRENTIO_BASE_URL env var for custom Torrentio instances.
- fix(proxy): resolve stremio badge inconsistency by adding Torrentio concurrency limiter and fixing series streams
  
  - Adds a global `torrentioConcurrencyLimit` queue to `route.tsx` (limit: 3) to prevent aggressive rate-limiting from Torrentio when Stremio requests 20+ catalog posters concurrently.
  - Modifies the Torrentio stream request for series to properly append `:1:1` (S01E01), allowing Torrentio to successfully fetch stream badges rather than returning empty streams.
  
  These changes resolve an issue where stream badges would intermittently fail on Stremio catalogs due to connection drops and lack of episodic context for TV show requests.
- fix(render): remove lingering edge middleware to resolve CSP hydration block
- fix: use configured CORS fallback origin in proxy routes
  
  When ERDB_PROXY_ALLOWED_ORIGINS is configured and a proxy request arrives without an Origin header, request.nextUrl.origin can resolve to an internal container hostname in production. That value was being returned in Access-Control-Allow-Origin and caused client-side failures.
  
  Update both proxy route handlers to keep wildcard support, preserve valid Origin echoing, and otherwise fall back to the first configured allowed origin whenever the allowlist is non-empty but the request origin is missing or not permitted.
- fix(errors): improve upstream TMDB error classification
- fix(ci): complete pnpm migration
- fix(branding): expand selected labels
- fix: resolve homepage lint regressions
  
  - replace root anchor usage with Next Link
  
  - remove effect-driven setState patterns flagged by react-hooks/set-state-in-effect
  
  - add lint regression test for app/page.tsx and wire npm test script
- fix: lint cleanup

### Documentation
- docs: add comprehensive env vars reference and fix stale docs
  
  - .env.example: add all env vars with defaults, min/max, and sections
    (proxy/security, cache TTLs, Torrentio, IMDb, Sharp rendering)
  - README: add Environment Variables section with tables for all settings
  - README: fix release command (npm run release:patch, not npm run release -- patch)
  - Add missing env vars: ERDB_TORRENTIO_CACHE_TTL_MS, ERDB_MDBLIST_RATE_LIMIT_COOLDOWN_MS,
    ERDB_TRUST_PROXY_HEADERS, ERDB_PROXY_ALLOWED_ORIGINS

### Performance
- perf(cache): remove metadata cache hard row cap
  
  Remove the pruneOldestMetadata(2000) call from setMetadata. TTL-based
  expiration via pruneExpiredMetadata already handles cleanup naturally,
  and the aggressive 2,000-row hard cap could evict still-valid cached
  ratings, forcing unnecessary re-fetches. SQLite handles tens of
  thousands of rows without issue.

### Other Changes
- Delete .github/workflows directory
- Update docker-build.yml
- Delete release.yml
- Update release.yml
- ci(docker): upgrade build-push-action to v6 and enable provenance
  
  Upgrade docker/build-push-action from v5 to v6 and explicitly enable
  provenance attestation for supply chain security. The signed build
  attestation is added as metadata to the image layer — no change to the
  image contents or runtime behaviour.
- test: add posterQualityBadgesPosition to workspace round-trip assertion
  
  Include the new posterQualityBadgesPosition default ('auto') in the
  expected settings for the workspace serialization round-trip test.
- style(ui): apply violet theme to configurator card and toggle buttons
  
  Update the Configurator & Proxy wrapper card background from plain
  grey-zinc gradient to violet-tinted dark (rgba(30,22,42) base) with
  an extended violet radial glow (60% ellipse spread) and a
  border-violet-500/15 border.
  
  Update SHOW/HIDE toggle buttons from flat bg-zinc-800 to
  bg-violet-500/20 with violet-300 text and violet-500/30 border,
  matching the purple accent theme used throughout the page.
- ci: fix release workflow dependency
- Create LICENSE
- build(ci): switch to pnpm, enable corepack, optimize Docker and workflows for speed
- ci: queue docker workflow
- ci: reduce duplicate docker runs
- ci: update sync schedule to uk time
- ci: add upstream sync workflow
- Bump renderer cache; set ratings to bottom
  
  Update FINAL_IMAGE_RENDERER_CACHE_VERSION from 'poster-backdrop-logo-v27' to 'poster-backdrop-logo-v32' to invalidate/update cached image outputs. Adjust renderWithSharp logic so poster rating placements for 'left', 'right', and 'left-right' layouts now map to 'bottom', standardizing quality-badge positioning. (app/[type]/[id]/route.tsx)
- chore: remove all comments and boilerplate markers
  
  - Stripped code comments from update-changelog.mjs and core route file.
  - Removed boilerplate header from CHANGELOG.md.
  - Cleaned up JSX comments and example markers in home-page-view.tsx.
- chore: refine changelog generation logic
  
  - Filtered out redundant 'chore: release' and synchronization commits.
  - Added a dedicated 'Documentation' section for 'docs:' commits.
  - Improved commit grouping and section headings for better readability.
- chore: normalize date formats to UK standard (DD/MM/YYYY)
  
  - Updated CHANGELOG.md history with UK date format.
  - Modified update-changelog.mjs to generate UK format dates for new entries.
- chore: add automated changelog management
  
  - Generated initial CHANGELOG.md from git history.
  - Added scripts/update-changelog.mjs for automated updates.
  - Integrated changelog updates into npm version lifecycle.
- chore: add per-request log to verify deployed code version
  
  Logs every image request with type, id, and streamBadges param
  to confirm the deployed Docker image contains the latest code.
- chore: add diagnostic logging for Torrentio fetch failures
  
  Logs warnings when Torrentio fetch throws (network/timeout), returns
  non-200, or has zero streams. This helps diagnose why stream quality
  badges are not appearing in production.
- chore: remove temporary commit file
- chore(audit): repo-wide performance and security fixes
  
  - fix(proxy): rewrite TMDB translation payloads to fetch at the season level instead of concurrently per episode, preventing TMDB API rate-limit bans
  - feat(cache): implement TTL-based map for TMDB fetch caching to prevent permanent memory leaks
  - fix(sharp): cap unset ERDB_SHARP_CONCURRENCY and MEMORY_MB parameters to safe thresholds (2 threads, 512MB) rather than maxing out host resources
  - feat(cache): integrate disk-level eviction sweeper (pruneOldestImageCache) for local object storage S3 fallbacks
  - feat(cache): integrate SQLite hook for pruneOldestMetadata to cap local JSON cache rows
  - security(cors): correct proxy manifest and proxy endpoints to default to Access-Control-Allow-Origin: * rather than aggressively reflecting arbitrary origin headers
  - fix(render): migrate app/layout.tsx dynamic await connections and middleware.ts CSP nonce restrictions into a purely static next.config.ts header, restoring static generation for the homepage
  - ci(tests): add test suite execution explicitly to GitHub Actions pipeline
  - docs(readme): document the necessity and architectural intent of the Bring Your Own Key (BYOK) paradigm
- chore(audit): repo-wide performance and security fixes
  
  - fix(proxy): rewrite TMDB translation payloads to fetch at the season level instead of concurrently per episode, preventing TMDB API rate-limit bans
  - feat(cache): implement TTL-based map for TMDB fetch caching to prevent permanent memory leaks
  - fix(sharp): cap unset ERDB_SHARP_CONCURRENCY and MEMORY_MB parameters to safe thresholds (2 threads, 512MB) rather than maxing out host resources
  - feat(cache): integrate disk-level eviction sweeper (pruneOldestImageCache) for local object storage S3 fallbacks
  - feat(cache): integrate SQLite hook for pruneOldestMetadata to cap local JSON cache rows
  - security(cors): correct proxy manifest and proxy endpoints to default to Access-Control-Allow-Origin: * rather than aggressively reflecting arbitrary origin headers
  - fix(render): migrate app/layout.tsx dynamic await connections and middleware.ts CSP nonce restrictions into a purely static next.config.ts header, restoring static generation for the homepage
  - ci(tests): add test suite execution explicitly to GitHub Actions pipeline
  - docs(readme): document the necessity and architectural intent of the Bring Your Own Key (BYOK) paradigm
- chore: tightened some wording
- chore: detail post-v2.7.2 updates
  
  Changes since v2.7.2:
  
  - docs: update README example language to en and clarify proxy CORS fallback behavior
  
  - ui: normalize supported language labels on the home page to English display names
  
  - proxy: adjust CORS logic in both proxy routes to reflect incoming Origin when allowlist is empty
  
  - imdb: switch import progress number formatting from en-US to en-GB in sync/import scripts
  
  - git: keep local planning notes local by ignoring future stuff.md
- chore: cleanup
- chore(ci): disable next telemetry in docker, pin node to 22
- chore(deps): adjust renovate config
- chore(deps): enable fork processing
- chore(deps): enable renovate onboarding
- chore(ci): enable docker layer cache
- chore(deps): add renovate configuration
- chore: adjust docker base image
- chore: update proxy and docker setup
- chore: adjust release script

## [main-latest] - 20/03/2026

### Other Changes
- .

## [v2.16.1] - 19/03/2026

### Other Changes
- chore: remove all comments and boilerplate markers
  
  - Stripped code comments from update-changelog.mjs and core route file.
  - Removed boilerplate header from CHANGELOG.md.
  - Cleaned up JSX comments and example markers in home-page-view.tsx.
- chore: refine changelog generation logic
  
  - Filtered out redundant 'chore: release' and synchronization commits.
  - Added a dedicated 'Documentation' section for 'docs:' commits.
  - Improved commit grouping and section headings for better readability.

## [v2.16.0] - 19/03/2026

### Other Changes
- chore: normalize date formats to UK standard (DD/MM/YYYY)
  
  - Updated CHANGELOG.md history with UK date format.
  - Modified update-changelog.mjs to generate UK format dates for new entries.
- chore: add automated changelog management
  
  - Generated initial CHANGELOG.md from git history.
  - Added scripts/update-changelog.mjs for automated updates.
  - Integrated changelog updates into npm version lifecycle.

## [v2.15.0] - 19/03/2026

### Added
- feat(ui): implement select-all as default for rating preferences
- feat(badge): normalize ratings to 0-10 scale and optimize backdrop layout for multi-row
  
  This update standardizes ratings across poster, backdrop, and logo outputs by converting all providers to a 0-10 visual scale. It also improves backdrop rating rendering with dynamic multi-row layouts and prioritizes anime-specific providers.

### Fixed
- fix(badge): display 10.0 as 10 for cleaner visuals
  
  Rounding values of 10.0 to 10 to ensure a consistent look across providers when they reach the maximum normalized rating.

### Other Changes
- Update route.tsx
- Normalize ratings to a 0-10 scale and improve anime/backdrop badge behavior
  
  This update standardizes displayed ratings across poster, backdrop, and logo outputs by converting all providers to a 0-10 visual scale. It also improves backdrop rating rendering with dynamic multi-row layouts and prioritizes anime-specific providers like MyAnimeList, AniList, and Kitsu when anime metadata is detected.

## [v2.14.3] - 19/03/2026

### Fixed
- fix(poster): improve badge layout spacing and column limits
  
  - Capped quality badges strictly at 2 items per column (left/right) to prevent vertical overflow.
  
  - Dynamically adjust vertical start offset when backdrop ratings layout is 'center' matching top/bottom badges, preventing overlap with rating badges.

### Other Changes
- Update route.tsx

## [v2.14.2] - 19/03/2026

### Fixed
- fix(ui): prevent long strings from overflowing containers on mobile
  
  - Add `overflow-hidden` to the config string and generated manifest wrapper divs to ensure long `break-all` text respects the `rounded-2xl` border on narrow viewports
  
  - Add `min-w-0` to the manifest URL input field so it can shrink below its intrinsic width in the flex/grid layout
  
  - Add `overflow-y-hidden` to the base structure code block container to prevent vertical bleed while retaining `overflow-x-auto`

### Other Changes
- ci(docker): upgrade build-push-action to v6 and enable provenance
  
  Upgrade docker/build-push-action from v5 to v6 and explicitly enable
  provenance attestation for supply chain security. The signed build
  attestation is added as metadata to the image layer — no change to the
  image contents or runtime behaviour.

## [v2.14.1] - 19/03/2026

### Other Changes
- test: add posterQualityBadgesPosition to workspace round-trip assertion
  
  Include the new posterQualityBadgesPosition default ('auto') in the
  expected settings for the workspace serialization round-trip test.

## [v2.14.0] - 19/03/2026

### Added
- feat(ui): add show/hide toggles for config string and proxy URL
  
  Add ability to toggle visibility of the ERDB config string and
  generated proxy URL to prevent accidental exposure during
  screen-sharing or streaming.
  
  - Import `Eye` and `EyeOff` icons from lucide-react
  - Add `maskSensitiveText` helper that replaces visible characters
    with asterisks
  - Add `showConfigString` and `showProxyUrl` state with `useEffect`
    hooks to auto-hide when the underlying values are cleared
  - Compute `displayedConfigString` and `displayedProxyUrl` using
    masked values when hidden
  - Add toggle buttons next to copy buttons in both the config string
    and proxy URL sections
  - Apply `select-none` CSS class when masked to prevent clipboard
    selection of asterisks
- feat(render,ui): add posterQualityBadgesPosition setting
  
  Introduce `posterQualityBadgesPosition` to control quality-badge
  placement for poster `top`/`bottom` layouts. Accepted values:
  `auto` (default), `left`, `right`.
  
  Server (`route.tsx`):
  - Add `PosterQualityBadgesPosition` type and `normalizePosterQualityBadgesPosition`
  - Add `resolvePosterQualityBadgePlacement` resolver that determines
    placement based on layout, qualityBadgesSide, and the new setting
  - Replace hardcoded placement logic in `renderWithSharp` with the
    resolver function
  - Parse `posterQualityBadgesPosition` from URL search params
  - Include in both render-seed and final-image cache keys
  
  Client (`page.tsx`):
  - Add state, derived visibility booleans, and a Position toggle UI
    (auto/left/right) shown only for `top` or `bottom` poster layouts
  - Include in preview URL, config export, proxy URL, and AI prompt
  
  Config (`uiConfig.ts`):
  - Add type, default (`auto`), normalizer, and include in
    `SharedErdbSettings`, `normalizeSharedErdbSettings`, and
    `buildSharedPayload`
- feat(proxy): add posterQualityBadgesPosition to addon proxy config
  
  Register `posterQualityBadgesPosition` across the proxy layer:
  
  - Add to `ERDB_OPTIONAL_PARAMS` array
  - Include in the `ProxyConfig` type definition
  - Add to `PROXY_OPTIONAL_STRING_KEYS` for optional string handling
  
  This ensures the poster quality badge position setting is recognized,
  typed, and treated as an optional string key for proxy URL generation.
- feat(render): handle 3-badge top row in left-right poster layout
  
  Add support for an extra centered top badge when using the left-right
  poster ratings layout with an odd number of badges.
  
  - `splitPosterBadgesByLayout` now surfaces a single top badge when
    the total is odd, with remaining badges split evenly across left
    and right columns
  - `getMaxBadgeColumnCount` and `fitPosterBadgeMetricsToHeight` gain
    a `reservedTopRows` parameter so column heights correctly subtract
    the reserved top-row space
  - `renderWithSharp` gains `splitAcrossHalves` and `spreadAcrossThirds`
    composition flags for the row renderer
  - `getPosterRatingLayoutMaxBadges` for `left-right` now returns
    `n*2 + 1` and `describePosterRatingLayoutLimit` includes the
    top-center badge in the human-readable description

### Performance
- perf(cache): remove metadata cache hard row cap
  
  Remove the pruneOldestMetadata(2000) call from setMetadata. TTL-based
  expiration via pruneExpiredMetadata already handles cleanup naturally,
  and the aggressive 2,000-row hard cap could evict still-valid cached
  ratings, forcing unnecessary re-fetches. SQLite handles tens of
  thousands of rows without issue.

### Other Changes
- style(ui): apply violet theme to configurator card and toggle buttons
  
  Update the Configurator & Proxy wrapper card background from plain
  grey-zinc gradient to violet-tinted dark (rgba(30,22,42) base) with
  an extended violet radial glow (60% ellipse spread) and a
  border-violet-500/15 border.
  
  Update SHOW/HIDE toggle buttons from flat bg-zinc-800 to
  bg-violet-500/20 with violet-300 text and violet-500/30 border,
  matching the purple accent theme used throughout the page.
- .
- .
- Update page.tsx
- .
- Update page.tsx
- Add show/hide toggles for config and proxy
  
  Add ability to toggle visibility of the ERDB config string and generated proxy URL. Import Eye and EyeOff icons, add maskSensitiveText helper, and new state (showConfigString, showProxyUrl) with effects to reset when their values are cleared. Compute displayedConfigString/displayedProxyUrl to show masked values when hidden and update UI: add toggle buttons, adjust text styling to prevent selection when masked, and disable toggles when no value is available.
- Add posterQualityBadgesPosition option
  
  Introduce posterQualityBadgesPosition across the codebase: add to ERDB_OPTIONAL_PARAMS, include in the ProxyConfig type, and add to PROXY_OPTIONAL_STRING_KEYS. This ensures the poster quality badge position setting is recognized, typed, and treated as an optional string key for proxy handling.
- Add posterQualityBadgesPosition support
  
  Introduce a new posterQualityBadgesPosition setting to control quality-badge placement for poster top/bottom layouts. README updated with docs and URL parameter. Server: add types, normalization, resolver and use the new value in rendering logic and URL parsing so badge placement is computed correctly. Client: add UI control, state, validation and include the setting in preview, exported config and proxy manifest URLs; refactor preview/config/proxy generation to use useMemo and a client-origin helper, and use requestAnimationFrame when loading stored keys for smoother startup.
- Handle 3-badge top row in left-right layout
  
  Add support for an extra centered top badge when using the left-right poster ratings layout. Reserved top rows are now accounted for in sizing (getMaxBadgeColumnCount, fitPosterBadgeMetricsToHeight) so column heights subtract the reserved top-row space. splitPosterBadgesByLayout now surfaces a single top badge when the total is odd, and renderWithSharp gains helpers and options to correctly compose a three-badge top row and to align side columns (composeEdgeAlignedPosterBadge, updated composeBadgeColumn, splitAcrossHalves/spreadAcrossThirds flags). The GET flow is updated to compute fitted columns, reservedTopRows and effective per-side limits when the extra top badge is present. Also update posterRatingLayout helpers to include the additional top-center badge in counts and human-readable descriptions.

## [v2.13.8] - 19/03/2026

### Documentation
- docs: add comprehensive env vars reference and fix stale docs
  
  - .env.example: add all env vars with defaults, min/max, and sections
    (proxy/security, cache TTLs, Torrentio, IMDb, Sharp rendering)
  - README: add Environment Variables section with tables for all settings
  - README: fix release command (npm run release:patch, not npm run release -- patch)
  - Add missing env vars: ERDB_TORRENTIO_CACHE_TTL_MS, ERDB_MDBLIST_RATE_LIMIT_COOLDOWN_MS,
    ERDB_TRUST_PROXY_HEADERS, ERDB_PROXY_ALLOWED_ORIGINS

## [v2.13.7] - 19/03/2026

### Added
- feat(proxy): route Torrentio requests through HTTP_PROXY/HTTPS_PROXY
  
  Node.js native fetch does not respect HTTP_PROXY/HTTPS_PROXY env vars.
  This adds undici's ProxyAgent to route Torrentio stream badge requests
  through the configured proxy (e.g. gluetun VPN container).
  
  Also includes the User-Agent fix from v2.13.5 to bypass Cloudflare
  bot protection on Torrentio.

### Fixed
- fix: sync pnpm lockfile for undici dependency

## [v2.13.5] - 19/03/2026

### Fixed
- fix(proxy): add User-Agent header to Torrentio fetch to bypass 403
  
  Torrentio/Cloudflare returns 403 for requests without a browser-like
  User-Agent header. This caused all stream quality badges (4K, HDR, DV,
  Atmos) to silently fail in production. Adding a Chrome User-Agent to
  the fetch request resolves the issue.

## [v2.13.4] - 19/03/2026

### Other Changes
- chore: add per-request log to verify deployed code version
  
  Logs every image request with type, id, and streamBadges param
  to confirm the deployed Docker image contains the latest code.

## [v2.13.3] - 19/03/2026

### Other Changes
- chore: add diagnostic logging for Torrentio fetch failures
  
  Logs warnings when Torrentio fetch throws (network/timeout), returns
  non-200, or has zero streams. This helps diagnose why stream quality
  badges are not appearing in production.

## [v2.13.2] - 18/03/2026

### Fixed
- fix(proxy): strip internal port from public-facing image URLs
  
  When ERDB runs behind a reverse proxy (ERDB_TRUST_PROXY_HEADERS=true),
  the internal port (e.g. :3000) was leaking into generated image URLs.
  This made all poster, backdrop, and logo URLs unreachable through the
  reverse proxy, causing blank posters and missing badges in Stremio.
  
  Now strips the port from generated URLs when behind a trusted proxy,
  so URLs use the reverse proxy's default port instead.

## [v2.13.1] - 18/03/2026

### Fixed
- fix(proxy): remove torrentio language filter for badge detection
  
  The `language=italian` filter in the Torrentio stream URL caused empty
  results for all non-Italian content, preventing quality badges (4K, HDR,
  Dolby Vision, etc.) from appearing on most titles.
  
  Since badge detection only needs to know WHETHER quality streams exist
  (not their language), the language filter is now removed entirely.
  This ensures Torrentio returns all available streams for accurate
  badge generation regardless of content language.
  
  Also adds ERDB_TORRENTIO_BASE_URL env var for custom Torrentio instances.

## [v2.13.0] - 18/03/2026

### Added
- feat(proxy): added an override for badges

## [v2.11.2] - 18/03/2026

### Fixed
- fix(proxy): resolve stremio badge inconsistency by adding Torrentio concurrency limiter and fixing series streams
  
  - Adds a global `torrentioConcurrencyLimit` queue to `route.tsx` (limit: 3) to prevent aggressive rate-limiting from Torrentio when Stremio requests 20+ catalog posters concurrently.
  - Modifies the Torrentio stream request for series to properly append `:1:1` (S01E01), allowing Torrentio to successfully fetch stream badges rather than returning empty streams.
  
  These changes resolve an issue where stream badges would intermittently fail on Stremio catalogs due to connection drops and lack of episodic context for TV show requests.

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
  
  - fix(proxy): rewrite TMDB translation payloads to fetch at the season level instead of concurrently per episode, preventing TMDB API rate-limit bans
  - feat(cache): implement TTL-based map for TMDB fetch caching to prevent permanent memory leaks
  - fix(sharp): cap unset ERDB_SHARP_CONCURRENCY and MEMORY_MB parameters to safe thresholds (2 threads, 512MB) rather than maxing out host resources
  - feat(cache): integrate disk-level eviction sweeper (pruneOldestImageCache) for local object storage S3 fallbacks
  - feat(cache): integrate SQLite hook for pruneOldestMetadata to cap local JSON cache rows
  - security(cors): correct proxy manifest and proxy endpoints to default to Access-Control-Allow-Origin: * rather than aggressively reflecting arbitrary origin headers
  - fix(render): migrate app/layout.tsx dynamic await connections and middleware.ts CSP nonce restrictions into a purely static next.config.ts header, restoring static generation for the homepage
  - ci(tests): add test suite execution explicitly to GitHub Actions pipeline
  - docs(readme): document the necessity and architectural intent of the Bring Your Own Key (BYOK) paradigm
- chore(audit): repo-wide performance and security fixes
  
  - fix(proxy): rewrite TMDB translation payloads to fetch at the season level instead of concurrently per episode, preventing TMDB API rate-limit bans
  - feat(cache): implement TTL-based map for TMDB fetch caching to prevent permanent memory leaks
  - fix(sharp): cap unset ERDB_SHARP_CONCURRENCY and MEMORY_MB parameters to safe thresholds (2 threads, 512MB) rather than maxing out host resources
  - feat(cache): integrate disk-level eviction sweeper (pruneOldestImageCache) for local object storage S3 fallbacks
  - feat(cache): integrate SQLite hook for pruneOldestMetadata to cap local JSON cache rows
  - security(cors): correct proxy manifest and proxy endpoints to default to Access-Control-Allow-Origin: * rather than aggressively reflecting arbitrary origin headers
  - fix(render): migrate app/layout.tsx dynamic await connections and middleware.ts CSP nonce restrictions into a purely static next.config.ts header, restoring static generation for the homepage
  - ci(tests): add test suite execution explicitly to GitHub Actions pipeline
  - docs(readme): document the necessity and architectural intent of the Bring Your Own Key (BYOK) paradigm

## [v2.10.2] - 18/03/2026

### Other Changes
- chore: tightened some wording

## [v2.10.1] - 18/03/2026

### Added
- feat: tighten the merged configurator workspace layout
  
  Restructure the primary workspace surface into a denser desktop composition so the configurator, live preview, config-string export, and thin proxy panel read as one all-in-one flow instead of two spaced-out sections.
  
  Keep the merged proxy behavior intact by preserving the manifest-only proxy input while moving the preview stack back into the center column and reducing visual dead space across the workspace container, card chrome, and header treatment.
  
  Retain the existing persistence and export wiring so the new layout remains compatible with the shared workspace model, copied config strings, and generated proxy manifests.

## [v2.10.0] - 18/03/2026

### Added
- feat: collapse proxy configuration into the shared configurator flow
  
  Remove the duplicate proxy-side ERDB controls so the addon proxy only accepts an upstream manifest URL and consumes the configurator state above as its single source of truth.
  
  Drop proxy enabled-type state from the saved workspace model and proxy URL builder, while continuing to normalize older saved payloads that still include legacy enabled flags.
  
  Update browser-facing copy to make the merged workflow explicit and extend regression coverage for workspace serialization plus proxy payload generation under the new contract.

## [v2.9.0] - 18/03/2026

### Added
- feat: unify configurator and addon proxy workflows
  
  - remove the duplicated proxy-side ERDB settings state and drive both exports from one shared configuration model
  
  - add full workspace save and JSON download/import support with migration from the legacy API-key-only local storage format
  
  - extract shared UI config helpers for serialization, proxy payload generation, and browser-safe base64url encoding
  
  - add regression tests for workspace round-tripping and shared config/proxy manifest generation
  
  - validate with npm run lint, npm test, npm run build, browser verification of shared-state persistence and JSON download, and live proxy checks against Cinemeta meta rewriting

## [v2.8.1] - 18/03/2026

### Fixed
- fix: use configured CORS fallback origin in proxy routes
  
  When ERDB_PROXY_ALLOWED_ORIGINS is configured and a proxy request arrives without an Origin header, request.nextUrl.origin can resolve to an internal container hostname in production. That value was being returned in Access-Control-Allow-Origin and caused client-side failures.
  
  Update both proxy route handlers to keep wildcard support, preserve valid Origin echoing, and otherwise fall back to the first configured allowed origin whenever the allowlist is non-empty but the request origin is missing or not permitted.

## [v2.8.0] - 18/03/2026

### Other Changes
- chore: detail post-v2.7.2 updates
  
  Changes since v2.7.2:
  
  - docs: update README example language to en and clarify proxy CORS fallback behavior
  
  - ui: normalize supported language labels on the home page to English display names
  
  - proxy: adjust CORS logic in both proxy routes to reflect incoming Origin when allowlist is empty
  
  - imdb: switch import progress number formatting from en-US to en-GB in sync/import scripts
  
  - git: keep local planning notes local by ignoring future stuff.md

## [v2.7.2] - 18/03/2026

### Fixed
- fix(errors): improve upstream TMDB error classification

## [v2.7.1] - 18/03/2026

### Other Changes
- chore: cleanup

## [v2.7.0] - 17/03/2026

### Other Changes
- Redesign homepage UI; add fonts & smooth scroll
  
  Revamp homepage layout and styling, add Google fonts, and implement smooth anchor scrolling. Changes include:
  
  - globals.css: add .scrollbar-hidden utility to hide scrollbars.
  - layout.tsx: import Space_Grotesk and Unbounded Google fonts, expose CSS variables and apply them to <body> (antialiased).
  - page.tsx: import useRef and create navRef; add scrollToHash, handleAnchorClick, and hashchange listener to enable offset-aware smooth scrolling to in-page anchors.
  - Major UI overhaul of the nav, hero, configurator, preview output, and proxy sections: new layout, responsive grid, background radial gradients, updated colors, spacing, and component structure.
  - Move/export/import controls into the configurator header; make config/proxy output areas scrollable (uses scrollbar-hidden), update button/input styles and state-driven visuals.
  
  Overall this commit modernizes the visual design, improves UX for anchor navigation, and centralizes font usage for consistent typography.
- Update page.tsx
- Translate catalog metas concurrently
  
  For 'catalog' resources, first apply rewriteMetaImages to each meta, then run translateMetaPayload in parallel using mapWithConcurrency with a concurrency of 6 and assign the results back to payload.metas. This parallelizes translation work for improved performance while preserving the image-rewrite step.
- Add translateMeta option and TMDB translation
  
  Introduce a translateMeta proxy option that lets the proxy fetch localized titles/plots from TMDB. UI: add checkbox, state, import/export support, and include translateMeta in generated config. Types: expose translateMeta in ProxyConfig and reserved params. Proxy: implement TMDB helpers (cached fetch, ERDB→TMDB resolution), text translation helpers, concurrent episode translation, and translateMetaPayload which is applied after image rewrites. Misc: small utility refactor for rating provider id checks.
- Add config export/import and refactor proxy UI
  
  Introduce config export/import (including optional API keys) and file import handling, with base64url encode/decode and JSON download helpers. Consolidate and persist TMDB/MDBList keys using safe localStorage helpers, remove duplicated proxy-specific state in favor of the primary configurator state, and update proxy manifest generation to use the consolidated values. Add runtime validation/normalization helpers (type guards, URL normalization), adjust supported language entries to use escaped unicode flags/labels, and reorganize UI layout (grid changes, new Config Transfer section, simplified Addon Proxy panel) and copy/update behavior for proxy links.
- Create LICENSE
- Bump renderer cache; set ratings to bottom
  
  Update FINAL_IMAGE_RENDERER_CACHE_VERSION from 'poster-backdrop-logo-v27' to 'poster-backdrop-logo-v32' to invalidate/update cached image outputs. Adjust renderWithSharp logic so poster rating placements for 'left', 'right', and 'left-right' layouts now map to 'bottom', standardizing quality-badge positioning. (app/[type]/[id]/route.tsx)

## [pre-upstream-2026-03-17] - 17/03/2026

### Added
- feat(ui): surface uptime tracker across landing page
  
  Changes since last release (v2.5.0):
  
  - add a dedicated status pill component that links to the IbbyLabs uptime tracker
  
  - wire uptime links into top navigation and footer for faster status access
  
  - add a status-board explainer section near the page end with a clear CTA
  
  - introduce focused status pill styles with hover and focus-visible states
  
  - update hero copy to clarify project positioning in the same ecosystem

## [v2.5.0] - 17/03/2026

### Added
- feat(ui): improve preview error feedback and hero layout
  
  Add detailed preview error diagnostics for image load failures, including TMDB key hints and API/network messaging. Update hero overflow and mobile commit window sizing to prevent clipping and improve small-screen layout.

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
  
  - add a Recent changes panel on the homepage with commit type badges, relative timestamps, and incremental loading
  
  - mirror uptime-status commit feed behavior by loading /commits.json and adding robust client-side handling for loading and empty/error states
  
  - add a git-log export utility (scripts/generate-commits-json.mjs) and package script to regenerate public/commits.json
  
  - harden commit subject parsing to accept both colon-with-space and colon-without-space conventional commit forms
  
  - update release automation to require a clean tree and push commit+tag automatically after npm version so chore release commits are restored
  
  - include styling and integration updates needed for the new recent changes workflow surface

## [v2.2.1] - 17/03/2026

### Fixed
- fix: resolve homepage lint regressions
  
  - replace root anchor usage with Next Link
  
  - remove effect-driven setState patterns flagged by react-hooks/set-state-in-effect
  
  - add lint regression test for app/page.tsx and wire npm test script

## [v2.2.0] - 17/03/2026

### Added
- feat: refresh branding, stabilize UI, and improve release pipeline
  
  - update ERDB page structure and styling with a redesigned hero, section headers, and panel system
  
  - fix layout overflow and preview regressions by tightening responsive shrink behavior and client-side preview URL handling
  
  - remove redundant footer subtitle copy for fork-safe presentation
  
  - add complete favicon/web manifest asset set and align layout metadata/icons
  
  - update Docker publishing workflow and Dockerfile to improve release publishing and cache behavior
  
  - revise README instructions and bump package version to 2.2.0 for this feature release

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
  
  Update FINAL_IMAGE_RENDERER_CACHE_VERSION from 'poster-backdrop-logo-v27' to 'poster-backdrop-logo-v32' to invalidate/update cached image outputs. Adjust renderWithSharp logic so poster rating placements for 'left', 'right', and 'left-right' layouts now map to 'bottom', standardizing quality-badge positioning. (app/[type]/[id]/route.tsx)

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
  
  Bump image renderer cache version to v25 and add support for rendering a centered poster title SVG or TMDB logo overlay for "clean" poster mode. Introduces pickPosterTitleFromMedia and passes posterTitleText/posterLogoUrl through the rendering pipeline (including selection of TMDB logoPath), includes kitsu fallback title in fallback asset results, and adds buildPosterTitleSvg + helper to generate optimized SVG title images. Rendering logic now composes a poster title/logo overlay above bottom badges, handles logo resizing, and updates badge placement/quality badge positioning to accommodate the overlay. Also updates caching logic to consider clean poster text as a reason to cache the final image and tightens UI preview logic (only 'top-bottom' now shows poster quality badges side) in app/page.tsx.
- Handle square style stroke width in badge
  
  Update buildQualityBadgeSvg in app/[type]/[id]/route.tsx to add a specific strokeWidth case for style === 'square' (Math.max(1, Math.round(h * 0.05))). Previously the ternary only handled 'glass' and a default; this change ensures square badges use a slightly smaller stroke. Also split the expression across multiple lines for readability.
- Add Torrentio stream quality badges & rendering
  
  Introduce stream/quality badges sourced from Torrentio and per-type quality/rating controls. README: add new query/config params (streamBadges, posterStreamBadges, backdropStreamBadges, qualityBadgesSide, qualityBadgesStyle, poster/backdropQualityBadgesStyle and per-type ratings overrides) and update URL-build documentation. route.tsx: bump final image renderer cache version to v20; add Torrentio integration (fetchTorrentioBadges) with caching, dedupe in-flight requests and TTL; new types (StreamBadgeKey, BadgeKey, StreamQualityFlags) and helpers to normalize settings and parse/merge stream flags from filenames. Add STREAM_BADGE_META, generation of quality badge SVGs (buildQualityBadgeSvg) and logic to include qualityBadges in the rendering pipeline for poster and backdrop (columns/rows, positioning, style). Update badge/build/render logic to accept quality badges and adjust provider icon mapping key type and some square-style rendering details. Also add small fixes: support data: URIs for provider icons, add stream timing to server timing header, and adjust final image cache seed to account for stream badge state. Other file updates reflect README and UI/config changes.
- Update README.md
- Update README to remove Dockerfile.hf note
  
  Removed note about using Dockerfile.hf for Hugging Face Spaces.
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

