# Changelog

> [!NOTE]
> This changelog may contain duplicate entries for certain changes. This occurs when an upstream commit is followed by a corresponding conventional commit used for release management and repository standards.

## [v2.21.8] - 22/03/2026

### Fixed
* respect explicit anime rating order

## [v2.21.7] - 22/03/2026

### Documentation
* refresh anime logo comparison

## [v2.21.6] - 22/03/2026

### Added
* add logo and quality badge limits

### Documentation
* add rendering comparison boards
* remove nontechnical hyphens from user copy

### Other Changes
* cover reverse mapping fallback
* ignore output artifacts

## [v2.21.5] - 21/03/2026

### Fixed
* refresh live gallery cards and darken logo demos
  
  Wrap the README preview images in direct preview links and rotate the cache buster tokens so GitHub fetches fresh renders instead of keeping the old broken camo entries.
  
  Add a dark logo background option to the image renderer and use it for the curated The Boys logo preset so the live README sample stays visible on GitHub's light canvas.
  
  Replace the old video attachment URLs with static demo thumbnails captured from the live erdb.ibbylabs.dev fork and link them to the live Configurator and Addon Proxy sections.

## [v2.21.4] - 21/03/2026

### Fixed
* fall back to the container bind host

## [v2.21.3] - 21/03/2026

### Fixed
* buffer proxied preview images before returning them
  
  The live README preview route itself was reachable, but successful preview slugs still failed at the edge while direct image URLs worked. That pointed at the nested image passthrough path rather than slug resolution or key lookup.
  
  Buffer the fetched preview payload into an ArrayBuffer before constructing the outgoing response instead of re streaming the nested fetch body directly. Preserve the important response headers and set the final content length from the buffered payload so reverse proxies receive a normal concrete image response.

## [v2.21.2] - 21/03/2026

### Other Changes
* stop tracking the generated recent changes feed
  
  Treat public/commits.json as generated build output instead of a tracked repository artifact.
  
  • ignore public/commits.json so build and dev regeneration does not create noisy diffs
  • remove the file from the git index while keeping local/generated copies available
  • add a predev hook so local development regenerates the feed before the app starts
  • keep the existing build time generation path so production images still ship the feed

## [v2.21.1] - 21/03/2026

### Fixed
* route live gallery requests through the internal app origin
  
  The README preview proxy was building its target URL from the public request origin even though production already injects PREVIEW_INTERNAL_ORIGIN for internal self fetches. Behind Cloudflare and the reverse proxy that caused the live gallery route to collapse into a blank 500 while the underlying poster and backdrop endpoints were still healthy.
  
  • prefer PREVIEW_INTERNAL_ORIGIN when building the internal preview target URL
  • fall back to the public request origin when the internal override is missing or invalid
  • return a controlled 502 text response when the internal fetch itself fails instead of bubbling an empty 500
  • add regression coverage for the preview origin resolution helper

### Documentation
* regenerate recent changes feed after the preview fix
  
  Refresh public/commits.json after the README live preview route fix so the tracked recent changes feed reflects the latest main branch work.

## [v2.21.0] - 21/03/2026

### Added
* add dedicated README preview gallery route

### Fixed
* fall back to Kitsu assets when reverse mappings miss TMDB
  
  Reverse mapped anime IDs could still fail in the image renderer when animemapping returned no TMDB target or when the resolved TMDB record no longer produced usable media. That branch exited before the existing raw Kitsu fallback helpers had a chance to recover poster, backdrop, or logo output.
  
  • try the reverse Kitsu lookup before returning a hard 404 for anime native IDs
  • reuse the raw Kitsu asset fallback when TMDB reverse mapping succeeds but the follow up TMDB fetch still produces no media
  • accept anidb prefixed IDs in proxy normalization so addon rewrites stay aligned with the main renderer
  • cover the proxy side anidb normalization path in the regression suite

### Documentation
* regenerate recent changes feed for the anime fallback fix
  
  Refresh public/commits.json after the anime fallback and proxy normalization changes so the tracked recent changes feed reflects the post v2.20.5 work that is about to ship in the next release.

### Other Changes
* pass README preview env vars through docker compose

## [v2.20.5] - 21/03/2026

### Documentation
* rebuild changelog and recent changes after message rewrite
  
  Regenerate CHANGELOG.md and public/commits.json from the rewritten forward facing commit history so the repo outputs match the updated user facing subjects and bodies.

## [v2.20.4] - 21/03/2026

### Fixed
* preserve standard ISO notation in user facing commit copy
  
  Keep standard labels such as ISO 639-1 intact when commit titles and bodies are normalized for the recent changes feed and changelog.
  
  Add regression coverage for the preserved standard notation and regenerate the tracked commit feed from the updated rules.

## [v2.20.3] - 21/03/2026

### Fixed
* remove user facing hyphens across the full page
  
  Refresh the docs, prompt, and metadata translation copy so the visible page text uses plain language without hyphenated phrases.
  
  Accept spaced layout names such as "top bottom", "left right", and "right vertical" so the updated docs and examples stay accurate.
  
  Add a regression test for spaced layout normalization and keep the rendered page text clean end to end.

### Documentation
* restore standard ISO notation
  
  Bring back the correct ISO 639-1 label in the docs and prompt copy while keeping the rest of the full page cleanup in place.
  
  The rendered page text now only includes the intended standard hyphen in 639 to 1.

## [v2.20.2] - 21/03/2026

### Fixed
* remove visible hyphens from recent changes copy
  
  Normalize user facing commit titles and bodies before they reach the recent changes panel and changelog output.
  
  Rewrite low signal history entries into clearer summaries, convert list marker dashes into bullet points, and strip hyphen compounds from display text while keeping git history intact.

## [v2.20.1] - 21/03/2026

### Fixed
* verify episode requested language translations before replacement
  
  Apply the same requested language TMDB translation availability check to episode metadata that the top level proxy meta path already uses, so prefer requested language no longer overwrites episode titles or overviews from season detail responses unless TMDB exposes a real translation for that exact episode locale.
  
  Add a reusable local smoke verifier that boots a mock upstream addon plus mock TMDB, anime mapping, AniList, and Kitsu services against a local Next server, and add seeded randomized merge tests so the translation rules are exercised across many title and overview combinations.
  
  Also add a narrowly scoped non production test override for private upstream URLs so the local verifier can drive the real proxy route without weakening the production SSRF checks.

## [v2.20.0] - 21/03/2026

### Added
* add configurable metadata translation modes and anime fallback
  
  Expose proxy side metadata translation controls end to end so generated proxy manifests can opt into localized metadata merging without changing the shared ERDB image renderer settings.
  
  Add explicit fill missing, prefer upstream, prefer requested language, and prefer tmdb modes, verify exact TMDB translation availability before requested language replacement, and use AniList or Kitsu text as a fallback when anime native IDs cannot get strong TMDB text.
  
  Also attach optional _erdbMetaTranslation provenance data for debugging, wire the new settings through saved UI config and the configurator, update the README, and add regression coverage for translation target resolution, selection modes, and proxy payload encoding.

## [v2.19.0] - 21/03/2026

### Added
* prefer upstream metadata and only fill missing translated fields
  
  Change translateMeta merging so localized TMDB text no longer blindly overwrites addon provided titles and overviews.
  
  Preserve existing upstream title and overview fields when they already contain meaningful text, treat common placeholders as missing, and only backfill missing metadata from TMDB after ID resolution succeeds.
  
  Keep anime reverse mapping as the fallback ID resolution path for anime native IDs, and add regression tests covering upstream preserving merge behavior plus placeholder and episode field backfilling.

## [v2.18.1] - 21/03/2026

### Added
* add anime reverse mapping fallback for metadata translation
  
  Route proxy metadata translation through a dedicated resolver that keeps the existing direct TMDB and IMDb path first, and only falls back to anime reverse mapping for anime native IDs when the direct path does not apply.
  
  Use the Stremio anime mapping service to resolve mal/myanimelist, anilist, kitsu, and anidb IDs to TMDB, then probe the preferred TV/movie order before fetching localized TMDB details for translated titles, overviews, and episode metadata.
  
  Also add cached anime mapping fetches plus regression tests covering MAL alias normalization, direct path precedence over anime fallback, and alternate media type fallback when the preferred TMDB type is missing.

### Fixed
* canonicalize MAL addon proxy IDs for anime image rewrites
  
  Accept both mal:* and myanimelist:* addon IDs in proxy normalization, and canonicalize both forms to mal:* before building ERDB image URLs.
  
  This keeps proxy side poster/background/logo rewrites aligned with the renderer's native anime mapping provider set, which recognizes mal as the canonical MyAnimeList provider prefix.
  
  Also add regression coverage for MAL alias normalization so anime addons emitting either form continue to resolve stable ERDB image URLs.
* update addon proxy handling

## [v2.18.0] - 20/03/2026

### Added
* polish homepage guidance and clean poster rendering
  
  Bring over the post v2.17.4 UX and rendering improvements while keeping the existing IbbyLabs branding, proxy flow, and security related behavior intact.
  
  • add hydration safe client origin handling for generated URLs
  • add offset aware smooth scrolling for nav, hero, and footer anchor links
  • add a prominent ERDB Discord support callout styled to match the landing page
  • keep the new support entry configurable with brand Discord env vars
  • only apply clean poster title and logo overlays when the selected poster is actually textless
  
  Tests:
  • npm run lint
  • npm test
  • npx tsc noEmit

## [v2.17.4] - 20/03/2026

### Other Changes
* added disclaimer to CHANGELOG.md to explain duplicate commits

## [v2.17.3] - 20/03/2026

### Documentation
* refresh README guide
* refresh README guide

## [v2.17.2] - 20/03/2026

### Added
* support multi line commit messages and backfill history
  
  This update refactors the changelog script to capture full commit bodies (using %b) and correctly indent them in the Markdown output.
  
  It also adds a rebuild flag to systematically backfill the entire project history, ensuring older commits also show their detailed descriptions in the changelog and the 'Recent Changes' UI.

## [v2.17.1] - 20/03/2026

### Added
* include all lines of commit message

## [v2.17.0] - 20/03/2026

### Added
* refine recent changes feed
  
  • enhance [generate commits json.mjs] to include author/isUpstream metadata
  • add UI badges and custom styling in for upstream attribution
  • configure GitHub action to fetch full history (fetch depth: 0)

## [v2.16.2] - 20/03/2026

### Added
* add automated changelog management
  
  • Generated initial CHANGELOG.md from git history.
  • Added scripts/update changelog.mjs for automated updates.
  • Integrated changelog updates into npm version lifecycle.
* implement select all as default for rating preferences
* normalize ratings to 0 to 10 scale and optimize backdrop layout for multi row
  
  This update standardizes ratings across poster, backdrop, and logo outputs by converting all providers to a 0 to 10 visual scale. It also improves backdrop rating rendering with dynamic multi row layouts and prioritizes anime specific providers.
* add show/hide toggles for config string and proxy URL
  
  Add ability to toggle visibility of the ERDB config string and
  generated proxy URL to prevent accidental exposure during
  screen sharing or streaming.
  
  • Import `Eye` and `EyeOff` icons from lucide react
  • Add `maskSensitiveText` helper that replaces visible characters
    with asterisks
  • Add `showConfigString` and `showProxyUrl` state with `useEffect`
    hooks to auto hide when the underlying values are cleared
  • Compute `displayedConfigString` and `displayedProxyUrl` using
    masked values when hidden
  • Add toggle buttons next to copy buttons in both the config string
    and proxy URL sections
  • Apply `select none` CSS class when masked to prevent clipboard
    selection of asterisks
* add posterQualityBadgesPosition setting
  
  Introduce `posterQualityBadgesPosition` to control quality badge
  placement for poster `top`/`bottom` layouts. Accepted values:
  `auto` (default), `left`, `right`.
  
  Server (`route.tsx`):
  • Add `PosterQualityBadgesPosition` type and `normalizePosterQualityBadgesPosition`
  • Add `resolvePosterQualityBadgePlacement` resolver that determines
    placement based on layout, qualityBadgesSide, and the new setting
  • Replace hardcoded placement logic in `renderWithSharp` with the
    resolver function
  • Parse `posterQualityBadgesPosition` from URL search params
  • Include in both render seed and final image cache keys
  
  Client (`page.tsx`):
  • Add state, derived visibility booleans, and a Position toggle UI
    (auto/left/right) shown only for `top` or `bottom` poster layouts
  • Include in preview URL, config export, proxy URL, and AI prompt
  
  Config (`uiConfig.ts`):
  • Add type, default (`auto`), normalizer, and include in
    `SharedErdbSettings`, `normalizeSharedErdbSettings`, and
    `buildSharedPayload`
* add posterQualityBadgesPosition to addon proxy config
  
  Register `posterQualityBadgesPosition` across the proxy layer:
  
  • Add to `ERDB_OPTIONAL_PARAMS` array
  • Include in the `ProxyConfig` type definition
  • Add to `PROXY_OPTIONAL_STRING_KEYS` for optional string handling
  
  This ensures the poster quality badge position setting is recognized,
  typed, and treated as an optional string key for proxy URL generation.
* handle 3 badge top row in left right poster layout
  
  Add support for an extra centered top badge when using the left right
  poster ratings layout with an odd number of badges.
  
  • `splitPosterBadgesByLayout` now surfaces a single top badge when
    the total is odd, with remaining badges split evenly across left
    and right columns
  • `getMaxBadgeColumnCount` and `fitPosterBadgeMetricsToHeight` gain
    a `reservedTopRows` parameter so column heights correctly subtract
    the reserved top row space
  • `renderWithSharp` gains `splitAcrossHalves` and `spreadAcrossThirds`
    composition flags for the row renderer
  • `getPosterRatingLayoutMaxBadges` for `left right` now returns
    `n*2 + 1` and `describePosterRatingLayoutLimit` includes the
    top center badge in the human readable description
* route Torrentio requests through HTTP_PROXY/HTTPS_PROXY
  
  Node.js native fetch does not respect HTTP_PROXY/HTTPS_PROXY env vars.
  This adds undici's ProxyAgent to route Torrentio stream badge requests
  through the configured proxy (e.g. gluetun VPN container).
  
  Also includes the User Agent fix from v2.13.5 to bypass Cloudflare
  bot protection on Torrentio.
* add per request log to verify deployed code version
  
  Logs every image request with type, id, and streamBadges param
  to confirm the deployed Docker image contains the latest code.
* add diagnostic logging for Torrentio fetch failures
  
  Logs warnings when Torrentio fetch throws (network/timeout), returns
  non 200, or has zero streams. This helps diagnose why stream quality
  badges are not appearing in production.
* added an override for badges
* tighten the merged configurator workspace layout
  
  Restructure the primary workspace surface into a denser desktop composition so the configurator, live preview, config string export, and thin proxy panel read as one all in one flow instead of two spaced out sections.
  
  Keep the merged proxy behavior intact by preserving the manifest only proxy input while moving the preview stack back into the center column and reducing visual dead space across the workspace container, card chrome, and header treatment.
  
  Retain the existing persistence and export wiring so the new layout remains compatible with the shared workspace model, copied config strings, and generated proxy manifests.
* collapse proxy configuration into the shared configurator flow
  
  Remove the duplicate proxy side ERDB controls so the addon proxy only accepts an upstream manifest URL and consumes the configurator state above as its single source of truth.
  
  Drop proxy enabled type state from the saved workspace model and proxy URL builder, while continuing to normalize older saved payloads that still include legacy enabled flags.
  
  Update browser facing copy to make the merged workflow explicit and extend regression coverage for workspace serialization plus proxy payload generation under the new contract.
* unify configurator and addon proxy workflows
  
  • remove the duplicated proxy side ERDB settings state and drive both exports from one shared configuration model
  
  • add full workspace save and JSON download/import support with migration from the legacy API key only local storage format
  
  • extract shared UI config helpers for serialization, proxy payload generation, and browser safe base64url encoding
  
  • add regression tests for workspace round tripping and shared config/proxy manifest generation
  
  • validate with npm run lint, npm test, npm run build, browser verification of shared state persistence and JSON download, and live proxy checks against Cinemeta meta rewriting
* surface uptime tracker across landing page
  
  Changes since last release (v2.5.0):
  
  • add a dedicated status pill component that links to the IbbyLabs uptime tracker
  
  • wire uptime links into top navigation and footer for faster status access
  
  • add a status board explainer section near the page end with a clear CTA
  
  • introduce focused status pill styles with hover and focus visible states
  
  • update hero copy to clarify project positioning in the same ecosystem
* improve preview error feedback and hero layout
  
  Add detailed preview error diagnostics for image load failures, including TMDB key hints and API/network messaging. Update hero overflow and mobile commit window sizing to prevent clipping and improve small screen layout.
* save api key config
* add recent changes feed and restore automated release flow
  
  • add a Recent changes panel on the homepage with commit type badges, relative timestamps, and incremental loading
  
  • mirror uptime status commit feed behavior by loading /commits.json and adding robust client side handling for loading and empty/error states
  
  • add a git log export utility (scripts/generate commits json.mjs) and package script to regenerate public/commits.json
  
  • harden commit subject parsing to accept both colon with space and colon without space conventional commit forms
  
  • update release automation to require a clean tree and push commit+tag automatically after npm version so chore release commits are restored
  
  • include styling and integration updates needed for the new recent changes workflow surface
* refresh branding, stabilize UI, and improve release pipeline
  
  • update ERDB page structure and styling with a redesigned hero, section headers, and panel system
  
  • fix layout overflow and preview regressions by tightening responsive shrink behavior and client side preview URL handling
  
  • remove redundant footer subtitle copy for fork safe presentation
  
  • add complete favicon/web manifest asset set and align layout metadata/icons
  
  • update Docker publishing workflow and Dockerfile to improve release publishing and cache behavior
  
  • revise README instructions and bump package version to 2.2.0 for this feature release
* align branding and chrome theme
* add renovate configuration
* split ci and publish
* add docker publish workflow

### Fixed
* recent changes ui
* normalize date formats to UK standard (DD/MM/YYYY)
  
  • Updated CHANGELOG.md history with UK date format.
  • Modified update changelog.mjs to generate UK format dates for new entries.
* display 10.0 as 10 for cleaner visuals
  
  Rounding values of 10.0 to 10 to ensure a consistent look across providers when they reach the maximum normalized rating.
* improve badge layout spacing and column limits
  
  • Capped quality badges strictly at 2 items per column (left/right) to prevent vertical overflow.
  
  • Dynamically adjust vertical start offset when backdrop ratings layout is 'center' matching top/bottom badges, preventing overlap with rating badges.
* prevent long strings from overflowing containers on mobile
  
  • Add `overflow hidden` to the config string and generated manifest wrapper divs to ensure long `break all` text respects the `rounded 2xl` border on narrow viewports
  
  • Add `min w 0` to the manifest URL input field so it can shrink below its intrinsic width in the flex/grid layout
  
  • Add `overflow y hidden` to the base structure code block container to prevent vertical bleed while retaining `overflow x auto`
* sync pnpm lockfile for undici dependency
* add User Agent header to Torrentio fetch to bypass 403
  
  Torrentio/Cloudflare returns 403 for requests without a browser like
  User Agent header. This caused all stream quality badges (4K, HDR, DV,
  Atmos) to silently fail in production. Adding a Chrome User Agent to
  the fetch request resolves the issue.
* strip internal port from public facing image URLs
  
  When ERDB runs behind a reverse proxy (ERDB_TRUST_PROXY_HEADERS=true),
  the internal port (e.g. :3000) was leaking into generated image URLs.
  This made all poster, backdrop, and logo URLs unreachable through the
  reverse proxy, causing blank posters and missing badges in Stremio.
  
  Now strips the port from generated URLs when behind a trusted proxy,
  so URLs use the reverse proxy's default port instead.
* remove torrentio language filter for badge detection
  
  The `language=italian` filter in the Torrentio stream URL caused empty
  results for all non Italian content, preventing quality badges (4K, HDR,
  Dolby Vision, etc.) from appearing on most titles.
  
  Since badge detection only needs to know WHETHER quality streams exist
  (not their language), the language filter is now removed entirely.
  This ensures Torrentio returns all available streams for accurate
  badge generation regardless of content language.
  
  Also adds ERDB_TORRENTIO_BASE_URL env var for custom Torrentio instances.
* resolve stremio badge inconsistency by adding Torrentio concurrency limiter and fixing series streams
  
  • Adds a global `torrentioConcurrencyLimit` queue to `route.tsx` (limit: 3) to prevent aggressive rate limiting from Torrentio when Stremio requests 20+ catalog posters concurrently.
  • Modifies the Torrentio stream request for series to properly append `:1:1` (S01E01), allowing Torrentio to successfully fetch stream badges rather than returning empty streams.
  
  These changes resolve an issue where stream badges would intermittently fail on Stremio catalogs due to connection drops and lack of episodic context for TV show requests.
* remove lingering edge middleware to resolve CSP hydration block
* use configured CORS fallback origin in proxy routes
  
  When ERDB_PROXY_ALLOWED_ORIGINS is configured and a proxy request arrives without an Origin header, request.nextUrl.origin can resolve to an internal container hostname in production. That value was being returned in Access Control Allow Origin and caused client side failures.
  
  Update both proxy route handlers to keep wildcard support, preserve valid Origin echoing, and otherwise fall back to the first configured allowed origin whenever the allowlist is non empty but the request origin is missing or not permitted.
* improve upstream TMDB error classification
* complete pnpm migration
* expand selected labels
* resolve homepage lint regressions
  
  • replace root anchor usage with Next Link
  
  • remove effect driven setState patterns flagged by react hooks/set state in effect
  
  • add lint regression test for app/page.tsx and wire npm test script
* bump renderer cache; set ratings to bottom
  
  Update FINAL_IMAGE_RENDERER_CACHE_VERSION from 'poster backdrop logo v27' to 'poster backdrop logo v32' to invalidate/update cached image outputs. Adjust renderWithSharp logic so poster rating placements for 'left', 'right', and 'left right' layouts now map to 'bottom', standardizing quality badge positioning. (app/[type]/[id]/route.tsx)
* lint cleanup

### Documentation
* add comprehensive env vars reference and fix stale docs
  
  • .env.example: add all env vars with defaults, min/max, and sections
    (proxy/security, cache TTLs, Torrentio, IMDb, Sharp rendering)
  • README: add Environment Variables section with tables for all settings
  • README: fix release command (npm run release:patch, not npm run release patch)
  • Add missing env vars: ERDB_TORRENTIO_CACHE_TTL_MS, ERDB_MDBLIST_RATE_LIMIT_COOLDOWN_MS,
    ERDB_TRUST_PROXY_HEADERS, ERDB_PROXY_ALLOWED_ORIGINS

### Performance
* remove metadata cache hard row cap
  
  Remove the pruneOldestMetadata(2000) call from setMetadata. TTL based
  expiration via pruneExpiredMetadata already handles cleanup naturally,
  and the aggressive 2,000 row hard cap could evict still valid cached
  ratings, forcing unnecessary re fetches. SQLite handles tens of
  thousands of rows without issue.

### Other Changes
* remove GitHub workflows
* update GitHub workflows
* remove GitHub workflows
* update GitHub workflows
* upgrade build push action to v6 and enable provenance
  
  Upgrade docker/build push action from v5 to v6 and explicitly enable
  provenance attestation for supply chain security. The signed build
  attestation is added as metadata to the image layer — no change to the
  image contents or runtime behaviour.
* add posterQualityBadgesPosition to workspace round trip assertion
  
  Include the new posterQualityBadgesPosition default ('auto') in the
  expected settings for the workspace serialization round trip test.
* apply violet theme to configurator card and toggle buttons
  
  Update the Configurator & Proxy wrapper card background from plain
  grey zinc gradient to violet tinted dark (rgba(30,22,42) base) with
  an extended violet radial glow (60% ellipse spread) and a
  border violet 500/15 border.
  
  Update SHOW/HIDE toggle buttons from flat bg zinc 800 to
  bg violet 500/20 with violet 300 text and violet 500/30 border,
  matching the purple accent theme used throughout the page.
* fix release workflow dependency
* switch to pnpm, enable corepack, optimize Docker and workflows for speed
* queue docker workflow
* reduce duplicate docker runs
* update sync schedule to uk time
* add upstream sync workflow
* remove all comments and boilerplate markers
  
  • Stripped code comments from update changelog.mjs and core route file.
  • Removed boilerplate header from CHANGELOG.md.
  • Cleaned up JSX comments and example markers in home page view.tsx.
* refine changelog generation logic
  
  • Filtered out redundant 'chore: release' and synchronization commits.
  • Added a dedicated 'Documentation' section for 'docs:' commits.
  • Improved commit grouping and section headings for better readability.
* remove temporary commit file
* repo wide performance and security fixes
  
  • fix(proxy): rewrite TMDB translation payloads to fetch at the season level instead of concurrently per episode, preventing TMDB API rate limit bans
  • feat(cache): implement TTL based map for TMDB fetch caching to prevent permanent memory leaks
  • fix(sharp): cap unset ERDB_SHARP_CONCURRENCY and MEMORY_MB parameters to safe thresholds (2 threads, 512MB) rather than maxing out host resources
  • feat(cache): integrate disk level eviction sweeper (pruneOldestImageCache) for local object storage S3 fallbacks
  • feat(cache): integrate SQLite hook for pruneOldestMetadata to cap local JSON cache rows
  • security(cors): correct proxy manifest and proxy endpoints to default to Access Control Allow Origin: * rather than aggressively reflecting arbitrary origin headers
  • fix(render): migrate app/layout.tsx dynamic await connections and middleware.ts CSP nonce restrictions into a purely static next.config.ts header, restoring static generation for the homepage
  • ci(tests): add test suite execution explicitly to GitHub Actions pipeline
  • docs(readme): document the necessity and architectural intent of the Bring Your Own Key (BYOK) paradigm
* repo wide performance and security fixes
  
  • fix(proxy): rewrite TMDB translation payloads to fetch at the season level instead of concurrently per episode, preventing TMDB API rate limit bans
  • feat(cache): implement TTL based map for TMDB fetch caching to prevent permanent memory leaks
  • fix(sharp): cap unset ERDB_SHARP_CONCURRENCY and MEMORY_MB parameters to safe thresholds (2 threads, 512MB) rather than maxing out host resources
  • feat(cache): integrate disk level eviction sweeper (pruneOldestImageCache) for local object storage S3 fallbacks
  • feat(cache): integrate SQLite hook for pruneOldestMetadata to cap local JSON cache rows
  • security(cors): correct proxy manifest and proxy endpoints to default to Access Control Allow Origin: * rather than aggressively reflecting arbitrary origin headers
  • fix(render): migrate app/layout.tsx dynamic await connections and middleware.ts CSP nonce restrictions into a purely static next.config.ts header, restoring static generation for the homepage
  • ci(tests): add test suite execution explicitly to GitHub Actions pipeline
  • docs(readme): document the necessity and architectural intent of the Bring Your Own Key (BYOK) paradigm
* tightened some wording
* detail post v2.7.2 updates
  
  Changes since v2.7.2:
  
  • docs: update README example language to en and clarify proxy CORS fallback behavior
  
  • ui: normalize supported language labels on the home page to English display names
  
  • proxy: adjust CORS logic in both proxy routes to reflect incoming Origin when allowlist is empty
  
  • imdb: switch import progress number formatting from en US to en GB in sync/import scripts
  
  • git: keep local planning notes local by ignoring future stuff.md
* cleanup
* create LICENSE
* disable next telemetry in docker, pin node to 22
* adjust renovate config
* enable fork processing
* enable renovate onboarding
* enable docker layer cache
* adjust docker base image
* update proxy and docker setup
* adjust release script

## [main-latest] - 20/03/2026

### Other Changes
* update GitHub workflows

## [v2.16.1] - 19/03/2026

### Other Changes
* remove all comments and boilerplate markers
  
  • Stripped code comments from update changelog.mjs and core route file.
  • Removed boilerplate header from CHANGELOG.md.
  • Cleaned up JSX comments and example markers in home page view.tsx.
* refine changelog generation logic
  
  • Filtered out redundant 'chore: release' and synchronization commits.
  • Added a dedicated 'Documentation' section for 'docs:' commits.
  • Improved commit grouping and section headings for better readability.

## [v2.16.0] - 19/03/2026

### Added
* add automated changelog management
  
  • Generated initial CHANGELOG.md from git history.
  • Added scripts/update changelog.mjs for automated updates.
  • Integrated changelog updates into npm version lifecycle.

### Fixed
* normalize date formats to UK standard (DD/MM/YYYY)
  
  • Updated CHANGELOG.md history with UK date format.
  • Modified update changelog.mjs to generate UK format dates for new entries.

## [v2.15.0] - 19/03/2026

### Added
* implement select all as default for rating preferences
* normalize ratings to 0 to 10 scale and optimize backdrop layout for multi row
  
  This update standardizes ratings across poster, backdrop, and logo outputs by converting all providers to a 0 to 10 visual scale. It also improves backdrop rating rendering with dynamic multi row layouts and prioritizes anime specific providers.

### Fixed
* display 10.0 as 10 for cleaner visuals
  
  Rounding values of 10.0 to 10 to ensure a consistent look across providers when they reach the maximum normalized rating.
* update image rendering route
* normalize ratings to a 0 to 10 scale and improve anime/backdrop badge behavior
  
  This update standardizes displayed ratings across poster, backdrop, and logo outputs by converting all providers to a 0 to 10 visual scale. It also improves backdrop rating rendering with dynamic multi row layouts and prioritizes anime specific providers like MyAnimeList, AniList, and Kitsu when anime metadata is detected.

## [v2.14.3] - 19/03/2026

### Fixed
* improve badge layout spacing and column limits
  
  • Capped quality badges strictly at 2 items per column (left/right) to prevent vertical overflow.
  
  • Dynamically adjust vertical start offset when backdrop ratings layout is 'center' matching top/bottom badges, preventing overlap with rating badges.
* update image rendering route

## [v2.14.2] - 19/03/2026

### Fixed
* prevent long strings from overflowing containers on mobile
  
  • Add `overflow hidden` to the config string and generated manifest wrapper divs to ensure long `break all` text respects the `rounded 2xl` border on narrow viewports
  
  • Add `min w 0` to the manifest URL input field so it can shrink below its intrinsic width in the flex/grid layout
  
  • Add `overflow y hidden` to the base structure code block container to prevent vertical bleed while retaining `overflow x auto`

### Other Changes
* upgrade build push action to v6 and enable provenance
  
  Upgrade docker/build push action from v5 to v6 and explicitly enable
  provenance attestation for supply chain security. The signed build
  attestation is added as metadata to the image layer — no change to the
  image contents or runtime behaviour.

## [v2.14.1] - 19/03/2026

### Other Changes
* add posterQualityBadgesPosition to workspace round trip assertion
  
  Include the new posterQualityBadgesPosition default ('auto') in the
  expected settings for the workspace serialization round trip test.

## [v2.14.0] - 19/03/2026

### Added
* add show/hide toggles for config string and proxy URL
  
  Add ability to toggle visibility of the ERDB config string and
  generated proxy URL to prevent accidental exposure during
  screen sharing or streaming.
  
  • Import `Eye` and `EyeOff` icons from lucide react
  • Add `maskSensitiveText` helper that replaces visible characters
    with asterisks
  • Add `showConfigString` and `showProxyUrl` state with `useEffect`
    hooks to auto hide when the underlying values are cleared
  • Compute `displayedConfigString` and `displayedProxyUrl` using
    masked values when hidden
  • Add toggle buttons next to copy buttons in both the config string
    and proxy URL sections
  • Apply `select none` CSS class when masked to prevent clipboard
    selection of asterisks
* add posterQualityBadgesPosition setting
  
  Introduce `posterQualityBadgesPosition` to control quality badge
  placement for poster `top`/`bottom` layouts. Accepted values:
  `auto` (default), `left`, `right`.
  
  Server (`route.tsx`):
  • Add `PosterQualityBadgesPosition` type and `normalizePosterQualityBadgesPosition`
  • Add `resolvePosterQualityBadgePlacement` resolver that determines
    placement based on layout, qualityBadgesSide, and the new setting
  • Replace hardcoded placement logic in `renderWithSharp` with the
    resolver function
  • Parse `posterQualityBadgesPosition` from URL search params
  • Include in both render seed and final image cache keys
  
  Client (`page.tsx`):
  • Add state, derived visibility booleans, and a Position toggle UI
    (auto/left/right) shown only for `top` or `bottom` poster layouts
  • Include in preview URL, config export, proxy URL, and AI prompt
  
  Config (`uiConfig.ts`):
  • Add type, default (`auto`), normalizer, and include in
    `SharedErdbSettings`, `normalizeSharedErdbSettings`, and
    `buildSharedPayload`
* add posterQualityBadgesPosition to addon proxy config
  
  Register `posterQualityBadgesPosition` across the proxy layer:
  
  • Add to `ERDB_OPTIONAL_PARAMS` array
  • Include in the `ProxyConfig` type definition
  • Add to `PROXY_OPTIONAL_STRING_KEYS` for optional string handling
  
  This ensures the poster quality badge position setting is recognized,
  typed, and treated as an optional string key for proxy URL generation.
* handle 3 badge top row in left right poster layout
  
  Add support for an extra centered top badge when using the left right
  poster ratings layout with an odd number of badges.
  
  • `splitPosterBadgesByLayout` now surfaces a single top badge when
    the total is odd, with remaining badges split evenly across left
    and right columns
  • `getMaxBadgeColumnCount` and `fitPosterBadgeMetricsToHeight` gain
    a `reservedTopRows` parameter so column heights correctly subtract
    the reserved top row space
  • `renderWithSharp` gains `splitAcrossHalves` and `spreadAcrossThirds`
    composition flags for the row renderer
  • `getPosterRatingLayoutMaxBadges` for `left right` now returns
    `n*2 + 1` and `describePosterRatingLayoutLimit` includes the
    top center badge in the human readable description
* update homepage and configurator
* update homepage and configurator
* update homepage and configurator
* update homepage and configurator
* add show/hide toggles for config and proxy
  
  Add ability to toggle visibility of the ERDB config string and generated proxy URL. Import Eye and EyeOff icons, add maskSensitiveText helper, and new state (showConfigString, showProxyUrl) with effects to reset when their values are cleared. Compute displayedConfigString/displayedProxyUrl to show masked values when hidden and update UI: add toggle buttons, adjust text styling to prevent selection when masked, and disable toggles when no value is available.
* add posterQualityBadgesPosition option
  
  Introduce posterQualityBadgesPosition across the codebase: add to ERDB_OPTIONAL_PARAMS, include in the ProxyConfig type, and add to PROXY_OPTIONAL_STRING_KEYS. This ensures the poster quality badge position setting is recognized, typed, and treated as an optional string key for proxy handling.
* add posterQualityBadgesPosition support
  
  Introduce a new posterQualityBadgesPosition setting to control quality badge placement for poster top/bottom layouts. README updated with docs and URL parameter. Server: add types, normalization, resolver and use the new value in rendering logic and URL parsing so badge placement is computed correctly. Client: add UI control, state, validation and include the setting in preview, exported config and proxy manifest URLs; refactor preview/config/proxy generation to use useMemo and a client origin helper, and use requestAnimationFrame when loading stored keys for smoother startup.

### Fixed
* update multiple project areas
  
  Touches image rendering route and project internals.
* handle 3 badge top row in left right layout
  
  Add support for an extra centered top badge when using the left right poster ratings layout. Reserved top rows are now accounted for in sizing (getMaxBadgeColumnCount, fitPosterBadgeMetricsToHeight) so column heights subtract the reserved top row space. splitPosterBadgesByLayout now surfaces a single top badge when the total is odd, and renderWithSharp gains helpers and options to correctly compose a three badge top row and to align side columns (composeEdgeAlignedPosterBadge, updated composeBadgeColumn, splitAcrossHalves/spreadAcrossThirds flags). The GET flow is updated to compute fitted columns, reservedTopRows and effective per side limits when the extra top badge is present. Also update posterRatingLayout helpers to include the additional top center badge in counts and human readable descriptions.

### Performance
* remove metadata cache hard row cap
  
  Remove the pruneOldestMetadata(2000) call from setMetadata. TTL based
  expiration via pruneExpiredMetadata already handles cleanup naturally,
  and the aggressive 2,000 row hard cap could evict still valid cached
  ratings, forcing unnecessary re fetches. SQLite handles tens of
  thousands of rows without issue.

### Other Changes
* apply violet theme to configurator card and toggle buttons
  
  Update the Configurator & Proxy wrapper card background from plain
  grey zinc gradient to violet tinted dark (rgba(30,22,42) base) with
  an extended violet radial glow (60% ellipse spread) and a
  border violet 500/15 border.
  
  Update SHOW/HIDE toggle buttons from flat bg zinc 800 to
  bg violet 500/20 with violet 300 text and violet 500/30 border,
  matching the purple accent theme used throughout the page.

## [v2.13.8] - 19/03/2026

### Documentation
* add comprehensive env vars reference and fix stale docs
  
  • .env.example: add all env vars with defaults, min/max, and sections
    (proxy/security, cache TTLs, Torrentio, IMDb, Sharp rendering)
  • README: add Environment Variables section with tables for all settings
  • README: fix release command (npm run release:patch, not npm run release patch)
  • Add missing env vars: ERDB_TORRENTIO_CACHE_TTL_MS, ERDB_MDBLIST_RATE_LIMIT_COOLDOWN_MS,
    ERDB_TRUST_PROXY_HEADERS, ERDB_PROXY_ALLOWED_ORIGINS

## [v2.13.7] - 19/03/2026

### Added
* route Torrentio requests through HTTP_PROXY/HTTPS_PROXY
  
  Node.js native fetch does not respect HTTP_PROXY/HTTPS_PROXY env vars.
  This adds undici's ProxyAgent to route Torrentio stream badge requests
  through the configured proxy (e.g. gluetun VPN container).
  
  Also includes the User Agent fix from v2.13.5 to bypass Cloudflare
  bot protection on Torrentio.

### Fixed
* sync pnpm lockfile for undici dependency

## [v2.13.5] - 19/03/2026

### Fixed
* add User Agent header to Torrentio fetch to bypass 403
  
  Torrentio/Cloudflare returns 403 for requests without a browser like
  User Agent header. This caused all stream quality badges (4K, HDR, DV,
  Atmos) to silently fail in production. Adding a Chrome User Agent to
  the fetch request resolves the issue.

## [v2.13.4] - 19/03/2026

### Added
* add per request log to verify deployed code version
  
  Logs every image request with type, id, and streamBadges param
  to confirm the deployed Docker image contains the latest code.

## [v2.13.3] - 19/03/2026

### Added
* add diagnostic logging for Torrentio fetch failures
  
  Logs warnings when Torrentio fetch throws (network/timeout), returns
  non 200, or has zero streams. This helps diagnose why stream quality
  badges are not appearing in production.

## [v2.13.2] - 18/03/2026

### Fixed
* strip internal port from public facing image URLs
  
  When ERDB runs behind a reverse proxy (ERDB_TRUST_PROXY_HEADERS=true),
  the internal port (e.g. :3000) was leaking into generated image URLs.
  This made all poster, backdrop, and logo URLs unreachable through the
  reverse proxy, causing blank posters and missing badges in Stremio.
  
  Now strips the port from generated URLs when behind a trusted proxy,
  so URLs use the reverse proxy's default port instead.

## [v2.13.1] - 18/03/2026

### Fixed
* remove torrentio language filter for badge detection
  
  The `language=italian` filter in the Torrentio stream URL caused empty
  results for all non Italian content, preventing quality badges (4K, HDR,
  Dolby Vision, etc.) from appearing on most titles.
  
  Since badge detection only needs to know WHETHER quality streams exist
  (not their language), the language filter is now removed entirely.
  This ensures Torrentio returns all available streams for accurate
  badge generation regardless of content language.
  
  Also adds ERDB_TORRENTIO_BASE_URL env var for custom Torrentio instances.

## [v2.13.0] - 18/03/2026

### Added
* added an override for badges

## [v2.11.2] - 18/03/2026

### Fixed
* resolve stremio badge inconsistency by adding Torrentio concurrency limiter and fixing series streams
  
  • Adds a global `torrentioConcurrencyLimit` queue to `route.tsx` (limit: 3) to prevent aggressive rate limiting from Torrentio when Stremio requests 20+ catalog posters concurrently.
  • Modifies the Torrentio stream request for series to properly append `:1:1` (S01E01), allowing Torrentio to successfully fetch stream badges rather than returning empty streams.
  
  These changes resolve an issue where stream badges would intermittently fail on Stremio catalogs due to connection drops and lack of episodic context for TV show requests.

### Other Changes
* fix release workflow dependency

## [v2.11.1] - 18/03/2026

### Fixed
* remove lingering edge middleware to resolve CSP hydration block

### Other Changes
* remove temporary commit file

## [v2.11.0] - 18/03/2026

### Other Changes
* repo wide performance and security fixes
  
  • fix(proxy): rewrite TMDB translation payloads to fetch at the season level instead of concurrently per episode, preventing TMDB API rate limit bans
  • feat(cache): implement TTL based map for TMDB fetch caching to prevent permanent memory leaks
  • fix(sharp): cap unset ERDB_SHARP_CONCURRENCY and MEMORY_MB parameters to safe thresholds (2 threads, 512MB) rather than maxing out host resources
  • feat(cache): integrate disk level eviction sweeper (pruneOldestImageCache) for local object storage S3 fallbacks
  • feat(cache): integrate SQLite hook for pruneOldestMetadata to cap local JSON cache rows
  • security(cors): correct proxy manifest and proxy endpoints to default to Access Control Allow Origin: * rather than aggressively reflecting arbitrary origin headers
  • fix(render): migrate app/layout.tsx dynamic await connections and middleware.ts CSP nonce restrictions into a purely static next.config.ts header, restoring static generation for the homepage
  • ci(tests): add test suite execution explicitly to GitHub Actions pipeline
  • docs(readme): document the necessity and architectural intent of the Bring Your Own Key (BYOK) paradigm
* repo wide performance and security fixes
  
  • fix(proxy): rewrite TMDB translation payloads to fetch at the season level instead of concurrently per episode, preventing TMDB API rate limit bans
  • feat(cache): implement TTL based map for TMDB fetch caching to prevent permanent memory leaks
  • fix(sharp): cap unset ERDB_SHARP_CONCURRENCY and MEMORY_MB parameters to safe thresholds (2 threads, 512MB) rather than maxing out host resources
  • feat(cache): integrate disk level eviction sweeper (pruneOldestImageCache) for local object storage S3 fallbacks
  • feat(cache): integrate SQLite hook for pruneOldestMetadata to cap local JSON cache rows
  • security(cors): correct proxy manifest and proxy endpoints to default to Access Control Allow Origin: * rather than aggressively reflecting arbitrary origin headers
  • fix(render): migrate app/layout.tsx dynamic await connections and middleware.ts CSP nonce restrictions into a purely static next.config.ts header, restoring static generation for the homepage
  • ci(tests): add test suite execution explicitly to GitHub Actions pipeline
  • docs(readme): document the necessity and architectural intent of the Bring Your Own Key (BYOK) paradigm

## [v2.10.2] - 18/03/2026

### Other Changes
* tightened some wording

## [v2.10.1] - 18/03/2026

### Added
* tighten the merged configurator workspace layout
  
  Restructure the primary workspace surface into a denser desktop composition so the configurator, live preview, config string export, and thin proxy panel read as one all in one flow instead of two spaced out sections.
  
  Keep the merged proxy behavior intact by preserving the manifest only proxy input while moving the preview stack back into the center column and reducing visual dead space across the workspace container, card chrome, and header treatment.
  
  Retain the existing persistence and export wiring so the new layout remains compatible with the shared workspace model, copied config strings, and generated proxy manifests.

## [v2.10.0] - 18/03/2026

### Added
* collapse proxy configuration into the shared configurator flow
  
  Remove the duplicate proxy side ERDB controls so the addon proxy only accepts an upstream manifest URL and consumes the configurator state above as its single source of truth.
  
  Drop proxy enabled type state from the saved workspace model and proxy URL builder, while continuing to normalize older saved payloads that still include legacy enabled flags.
  
  Update browser facing copy to make the merged workflow explicit and extend regression coverage for workspace serialization plus proxy payload generation under the new contract.

## [v2.9.0] - 18/03/2026

### Added
* unify configurator and addon proxy workflows
  
  • remove the duplicated proxy side ERDB settings state and drive both exports from one shared configuration model
  
  • add full workspace save and JSON download/import support with migration from the legacy API key only local storage format
  
  • extract shared UI config helpers for serialization, proxy payload generation, and browser safe base64url encoding
  
  • add regression tests for workspace round tripping and shared config/proxy manifest generation
  
  • validate with npm run lint, npm test, npm run build, browser verification of shared state persistence and JSON download, and live proxy checks against Cinemeta meta rewriting

## [v2.8.1] - 18/03/2026

### Fixed
* use configured CORS fallback origin in proxy routes
  
  When ERDB_PROXY_ALLOWED_ORIGINS is configured and a proxy request arrives without an Origin header, request.nextUrl.origin can resolve to an internal container hostname in production. That value was being returned in Access Control Allow Origin and caused client side failures.
  
  Update both proxy route handlers to keep wildcard support, preserve valid Origin echoing, and otherwise fall back to the first configured allowed origin whenever the allowlist is non empty but the request origin is missing or not permitted.

## [v2.8.0] - 18/03/2026

### Other Changes
* detail post v2.7.2 updates
  
  Changes since v2.7.2:
  
  • docs: update README example language to en and clarify proxy CORS fallback behavior
  
  • ui: normalize supported language labels on the home page to English display names
  
  • proxy: adjust CORS logic in both proxy routes to reflect incoming Origin when allowlist is empty
  
  • imdb: switch import progress number formatting from en US to en GB in sync/import scripts
  
  • git: keep local planning notes local by ignoring future stuff.md

## [v2.7.2] - 18/03/2026

### Fixed
* improve upstream TMDB error classification

## [v2.7.1] - 18/03/2026

### Other Changes
* cleanup

## [v2.7.0] - 17/03/2026

### Added
* update homepage and configurator
* add translateMeta option and TMDB translation
  
  Introduce a translateMeta proxy option that lets the proxy fetch localized titles/plots from TMDB. UI: add checkbox, state, import/export support, and include translateMeta in generated config. Types: expose translateMeta in ProxyConfig and reserved params. Proxy: implement TMDB helpers (cached fetch, ERDB→TMDB resolution), text translation helpers, concurrent episode translation, and translateMetaPayload which is applied after image rewrites. Misc: small utility refactor for rating provider id checks.
* add config export/import and refactor proxy UI
  
  Introduce config export/import (including optional API keys) and file import handling, with base64url encode/decode and JSON download helpers. Consolidate and persist TMDB/MDBList keys using safe localStorage helpers, remove duplicated proxy specific state in favor of the primary configurator state, and update proxy manifest generation to use the consolidated values. Add runtime validation/normalization helpers (type guards, URL normalization), adjust supported language entries to use escaped unicode flags/labels, and reorganize UI layout (grid changes, new Config Transfer section, simplified Addon Proxy panel) and copy/update behavior for proxy links.

### Fixed
* translate catalog metas concurrently
  
  For 'catalog' resources, first apply rewriteMetaImages to each meta, then run translateMetaPayload in parallel using mapWithConcurrency with a concurrency of 6 and assign the results back to payload.metas. This parallelizes translation work for improved performance while preserving the image rewrite step.
* bump renderer cache; set ratings to bottom
  
  Update FINAL_IMAGE_RENDERER_CACHE_VERSION from 'poster backdrop logo v27' to 'poster backdrop logo v32' to invalidate/update cached image outputs. Adjust renderWithSharp logic so poster rating placements for 'left', 'right', and 'left right' layouts now map to 'bottom', standardizing quality badge positioning. (app/[type]/[id]/route.tsx)

### Other Changes
* redesign homepage UI; add fonts & smooth scroll
  
  Revamp homepage layout and styling, add Google fonts, and implement smooth anchor scrolling. Changes include:
  
  • globals.css: add .scrollbar hidden utility to hide scrollbars.
  • layout.tsx: import Space_Grotesk and Unbounded Google fonts, expose CSS variables and apply them to <body> (antialiased).
  • page.tsx: import useRef and create navRef; add scrollToHash, handleAnchorClick, and hashchange listener to enable offset aware smooth scrolling to in page anchors.
  • Major UI overhaul of the nav, hero, configurator, preview output, and proxy sections: new layout, responsive grid, background radial gradients, updated colors, spacing, and component structure.
  • Move/export/import controls into the configurator header; make config/proxy output areas scrollable (uses scrollbar hidden), update button/input styles and state driven visuals.
  
  Overall this commit modernizes the visual design, improves UX for anchor navigation, and centralizes font usage for consistent typography.
* create LICENSE

## [pre-upstream-2026-03-17] - 17/03/2026

### Added
* surface uptime tracker across landing page
  
  Changes since last release (v2.5.0):
  
  • add a dedicated status pill component that links to the IbbyLabs uptime tracker
  
  • wire uptime links into top navigation and footer for faster status access
  
  • add a status board explainer section near the page end with a clear CTA
  
  • introduce focused status pill styles with hover and focus visible states
  
  • update hero copy to clarify project positioning in the same ecosystem

## [v2.5.0] - 17/03/2026

### Added
* improve preview error feedback and hero layout
  
  Add detailed preview error diagnostics for image load failures, including TMDB key hints and API/network messaging. Update hero overflow and mobile commit window sizing to prevent clipping and improve small screen layout.

### Other Changes
* create LICENSE
* disable next telemetry in docker, pin node to 22

## [v2.4.4] - 17/03/2026

### Fixed
* complete pnpm migration

## [v2.4.3] - 17/03/2026

### Other Changes
* switch to pnpm, enable corepack, optimize Docker and workflows for speed

## [v2.4.2] - 17/03/2026

### Fixed
* expand selected labels

## [v2.4.1] - 17/03/2026

### Other Changes
* queue docker workflow

## [v2.4.0] - 17/03/2026

### Added
* save api key config

## [v2.3.0] - 17/03/2026

### Added
* add recent changes feed and restore automated release flow
  
  • add a Recent changes panel on the homepage with commit type badges, relative timestamps, and incremental loading
  
  • mirror uptime status commit feed behavior by loading /commits.json and adding robust client side handling for loading and empty/error states
  
  • add a git log export utility (scripts/generate commits json.mjs) and package script to regenerate public/commits.json
  
  • harden commit subject parsing to accept both colon with space and colon without space conventional commit forms
  
  • update release automation to require a clean tree and push commit+tag automatically after npm version so chore release commits are restored
  
  • include styling and integration updates needed for the new recent changes workflow surface

## [v2.2.1] - 17/03/2026

### Fixed
* resolve homepage lint regressions
  
  • replace root anchor usage with Next Link
  
  • remove effect driven setState patterns flagged by react hooks/set state in effect
  
  • add lint regression test for app/page.tsx and wire npm test script

## [v2.2.0] - 17/03/2026

### Added
* refresh branding, stabilize UI, and improve release pipeline
  
  • update ERDB page structure and styling with a redesigned hero, section headers, and panel system
  
  • fix layout overflow and preview regressions by tightening responsive shrink behavior and client side preview URL handling
  
  • remove redundant footer subtitle copy for fork safe presentation
  
  • add complete favicon/web manifest asset set and align layout metadata/icons
  
  • update Docker publishing workflow and Dockerfile to improve release publishing and cache behavior
  
  • revise README instructions and bump package version to 2.2.0 for this feature release

## [v2.1.0] - 17/03/2026

### Added
* align branding and chrome theme

### Other Changes
* reduce duplicate docker runs
* adjust renovate config
* enable fork processing
* enable renovate onboarding

## [v2.0.1] - 17/03/2026

### Added
* add renovate configuration

### Other Changes
* enable docker layer cache

## [v2.0.0] - 17/03/2026

## [v1.1.0] - 17/03/2026

### Other Changes
* update sync schedule to uk time
* add upstream sync workflow
* adjust docker base image
* update proxy and docker setup

## [v1.0.4] - 17/03/2026

### Fixed
* bump renderer cache; set ratings to bottom
  
  Update FINAL_IMAGE_RENDERER_CACHE_VERSION from 'poster backdrop logo v27' to 'poster backdrop logo v32' to invalidate/update cached image outputs. Adjust renderWithSharp logic so poster rating placements for 'left', 'right', and 'left right' layouts now map to 'bottom', standardizing quality badge positioning. (app/[type]/[id]/route.tsx)

## [v1.0.3] - 17/03/2026

### Fixed
* lint cleanup

## [v1.0.2] - 17/03/2026

### Added
* split ci and publish

## [v1.0.1] - 17/03/2026

### Other Changes
* adjust release script

## [v1.0.0] - 17/03/2026

## [v0.2.0] - 17/03/2026

### Added
* add docker publish workflow
* update homepage and configurator
* render poster title/logo overlays & bump cache
  
  Bump image renderer cache version to v25 and add support for rendering a centered poster title SVG or TMDB logo overlay for "clean" poster mode. Introduces pickPosterTitleFromMedia and passes posterTitleText/posterLogoUrl through the rendering pipeline (including selection of TMDB logoPath), includes kitsu fallback title in fallback asset results, and adds buildPosterTitleSvg + helper to generate optimized SVG title images. Rendering logic now composes a poster title/logo overlay above bottom badges, handles logo resizing, and updates badge placement/quality badge positioning to accommodate the overlay. Also updates caching logic to consider clean poster text as a reason to cache the final image and tightens UI preview logic (only 'top bottom' now shows poster quality badges side) in app/page.tsx.
* add Torrentio stream quality badges & rendering
  
  Introduce stream/quality badges sourced from Torrentio and per type quality/rating controls. README: add new query/config params (streamBadges, posterStreamBadges, backdropStreamBadges, qualityBadgesSide, qualityBadgesStyle, poster/backdropQualityBadgesStyle and per type ratings overrides) and update URL build documentation. route.tsx: bump final image renderer cache version to v20; add Torrentio integration (fetchTorrentioBadges) with caching, dedupe in flight requests and TTL; new types (StreamBadgeKey, BadgeKey, StreamQualityFlags) and helpers to normalize settings and parse/merge stream flags from filenames. Add STREAM_BADGE_META, generation of quality badge SVGs (buildQualityBadgeSvg) and logic to include qualityBadges in the rendering pipeline for poster and backdrop (columns/rows, positioning, style). Update badge/build/render logic to accept quality badges and adjust provider icon mapping key type and some square style rendering details. Also add small fixes: support data: URIs for provider icons, add stream timing to server timing header, and adjust final image cache seed to account for stream badge state. Other file updates reflect README and UI/config changes.
* update homepage and configurator
* update homepage and configurator
* add addon proxy support
* update homepage and configurator
* update homepage and configurator
* bootstrap ERDB project

### Fixed
* update image rendering route
* update image rendering route
* update image rendering route
* update image rendering route
* handle square style stroke width in badge
  
  Update buildQualityBadgeSvg in app/[type]/[id]/route.tsx to add a specific strokeWidth case for style === 'square' (Math.max(1, Math.round(h * 0.05))). Previously the ternary only handled 'glass' and a default; this change ensures square badges use a slightly smaller stroke. Also split the expression across multiple lines for readability.
* fix typo in HuggingFace Guide section
* update image rendering route
* update multiple project areas
  
  Touches image rendering route and project tooling.
* update image rendering route
* update image rendering route
* update image rendering route
* update multiple project areas
  
  Touches image rendering route, project tooling, and rendering and data pipeline.
* update addon proxy handling
* update addon proxy handling
* update addon proxy handling
  
  Touches addon proxy, homepage and configurator, and README guide.
* update addon proxy handling
  
  Touches addon proxy, homepage and configurator, and image rendering route.
* update addon proxy handling
  
  Touches addon proxy, homepage and configurator, and image rendering route.
* update image rendering route
* update image rendering route
* update image rendering route
* update image rendering route
* update image rendering route
* update image rendering route
* update image rendering route

### Documentation
* refresh README guide
* refresh README guide
  
  Removed note about using Dockerfile.hf for Hugging Face Spaces.
* refresh README guide
* refresh README guide
* refresh README guide
* refresh README guide
* refresh README guide
* refresh README guide
* refresh README guide
* refresh README guide
* refresh README guide
* refresh README guide
* refresh README guide

### Other Changes
* update deployment setup
* update deployment setup
* update deployment setup
* update deployment setup
  
  Touches deployment setup and project tooling.
* remove demo videos
* remove demo videos
* add demo videos
* update deployment setup
* add Hugging Face Docker support
* update deployment setup
* update multiple project areas
  
  Touches deployment setup and image rendering route.
* update deployment setup
* update multiple project areas
  
  Touches project tooling and README guide.
* update project internals
  
  Touches project internals and project tooling.
* update project internals
  
  Touches project internals, project tooling, and README guide.

