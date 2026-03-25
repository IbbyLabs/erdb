# Changelog

> [!NOTE]
> This changelog may contain duplicate entries for certain changes. This occurs when an upstream commit is followed by a corresponding conventional commit used for release management and repository standards.

<a id="v2-23-1"></a>

<a id="v2-23-2"></a>

<a id="v2-23-3"></a>

<a id="v2-23-4"></a>

<a id="v2-23-5"></a>

<a id="v2-24-0"></a>

<a id="v2-24-1"></a>

<a id="v2-24-2"></a>

<a id="v2-24-3"></a>

<a id="v2-25-0"></a>

<a id="v2-26-0"></a>

<a id="v2-27-0"></a>

<a id="v2-28-0"></a>

<a id="v2-29-0"></a>

<a id="v2-29-1"></a>

<a id="v2-29-2"></a>

<a id="v2-29-3"></a>

<a id="v2-29-4"></a>

<a id="v2-29-5"></a>

<a id="v2-29-6"></a>

<a id="v2-30-0"></a>

<a id="v2-31-0"></a>

<a id="v2-31-1"></a>

<a id="v2-31-2"></a>

<a id="v2-32-0"></a>

<a id="v2-33-0"></a>

<a id="v2-34-0"></a>

<a id="v2-35-0"></a>

<a id="v2-35-1"></a>

<a id="v2-35-2"></a>

<a id="v2-35-3"></a>

<a id="v2-35-4"></a>

<a id="v2-35-5"></a>

<a id="v2-35-6"></a>

<a id="v2-36-0"></a>

<a id="v2-36-1"></a>

<a id="v2-36-2"></a>

<a id="v2-36-3"></a>

<a id="v2-36-4"></a>

<a id="v2-37-0"></a>

<a id="v2-37-1"></a>

<a id="v2-37-2"></a>

<a id="v2-37-3"></a>

<a id="v2-37-4"></a>

<a id="v2-37-5"></a>

<a id="v2-37-6"></a>

<a id="v2-37-7"></a>

<a id="v2-38-0"></a>

<a id="v2-39-0"></a>

<a id="v2-39-1"></a>

<a id="v2-39-2"></a>

<a id="v2-39-3"></a>

<a id="v2-39-4"></a>

<a id="v2-39-5"></a>

<a id="v2-39-6"></a>

<a id="v2-39-7"></a>

<a id="v2-39-8"></a>

## [v2.39.8] - 25/03/2026

### Fixed
* expand workspace to full width shell
  
  Remove the fixed max width wrappers on the main page shell so the configurator, preview, proxy, docs, status, and footer sections can use the full viewport width on desktop screens.
  
  Update the workspace grid ratio from 1/0.82/0.84 to 1.18/1/1 so preview and proxy columns scale more naturally in fullscreen layouts.
  
  Keep existing scroll, sticky preview behavior, and section anchor structure intact while improving large screen space usage.

## [v2.39.7] - 25/03/2026

### Fixed
* tidy preview workspace layout and chip spacing

## [v2.39.6] - 25/03/2026

### Fixed
* stabilize fullscreen workspace layout

## [v2.39.5] - 25/03/2026

### Fixed
* auto derive simkl app metadata from release version

## [v2.39.4] - 25/03/2026

### Fixed
* align simkl compliance flow and docs

## [v2.39.3] - 25/03/2026

### Added
* Simkl API compliance—add ID resolution cache TTL, implement two stage redirect+summary lookup, enforce header based auth
  
  Changes:
  • Add SIMKL_ID_CACHE_TTL_MS constant with configurable TTL (default: 3 days, min: 10 min, max: 30 days)
  • Implement fetchSimklId() function to resolve Simkl item IDs via /redirect endpoint
  • Refactor fetchSimklRating() to two stage flow: resolve ID first, then fetch ratings by ID
  • Enforce simkl api key header authentication (remove query param leakage)
  • Update .env.example with ERDB_SIMKL_ID_CACHE_TTL_MS documentation
  
  Addresses Simkl API requirements for proper authentication and endpoint usage.

## [v2.39.2] - 25/03/2026

### Fixed
* align ui config serialization and patch updates

## [v2.39.1] - 25/03/2026

### Fixed
* add simklClientId to round trip expected output

## [v2.39.0] - 25/03/2026

### Added
* add SIMKL as a rating provider
* add automatic cache pruning for expired objectStorage images
* add 'none' ratingPresentation mode to hide all ratings

### Fixed
* replace SIMKL favicon with official SVG logo
* remove extra comma in simklClientId default

### Other Changes
* resolve conflicts (keeping our codebase)

## [v2.38.0] - 25/03/2026

### Added
* added a 'Hide All Ratings' option and an 'Enable All' option.
  
  feat: added a proxy/image fallback support so rewwritten urls keep upstream images.

## [v2.37.7] - 25/03/2026

### Fixed
* reconcile GitHub release latest tag with actual latest release

## [v2.37.6] - 25/03/2026

### Documentation
* rename shared host copy to public instance

## [v2.37.5] - 25/03/2026

### Fixed
* infer bluray coverage from remux quality badges

## [v2.37.4] - 25/03/2026

### Fixed
* tighten mobile configurator layout and refresh renderer cache

## [v2.37.3] - 25/03/2026

### Documentation
* normalize configurator copy

## [v2.37.2] - 25/03/2026

### Fixed
* mobile navigation and image routing

## [v2.37.1] - 25/03/2026

### Other Changes
* fix mobile navigation and image routing

## [v2.37.0] - 25/03/2026

### Added
* add setup modes and guided presets
  
  Add a first run mode picker that lets people choose between a simplified preset driven workspace and the full advanced configurator.
  
  Introduce preset definitions plus a guided wizard that recommends starter, balanced, public fast, or full stack defaults while preserving keys and proxy manifest state.
  
  Reorganize advanced controls into accordion sections, keep simple mode focused on everyday artwork switches, add preset coverage tests, and remove user facing hyphenated copy from the new surfaces.

## [v2.36.4] - 25/03/2026

### Fixed
* align documented env defaults with runtime behavior

## [v2.36.3] - 25/03/2026

### Documentation
* add public fast preset and correct sharp defaults

## [v2.36.2] - 25/03/2026

### Fixed
* improve mobile configurator layout

## [v2.36.1] - 25/03/2026

### Added
* add poster edge offset controls
* add per type genre badge settings

## [v2.36.0] - 25/03/2026

### Other Changes
* add poster edge offset controls
* Add per type genre badge settings

## [v2.35.6] - 25/03/2026

### Fixed
* prevent provider styling overlap

## [v2.35.5] - 25/03/2026

### Documentation
* clarify AIOM credential masking

## [v2.35.4] - 25/03/2026

### Fixed
* improve plain rating badge readability

## [v2.35.3] - 25/03/2026

### Fixed
* keep sticky preview above samples

## [v2.35.2] - 25/03/2026

### Fixed
* normalize GHCR image name for latest promotion

## [v2.35.1] - 25/03/2026

### Fixed
* add drama genre badge fallback

## [v2.35.0] - 25/03/2026

### Added
* add compact dual aggregate rating mode

### Other Changes
* separate latest image promotion from release builds

## [v2.34.0] - 25/03/2026

### Added
* add hundred point rating normalization

### Fixed
* tighten media quality badge accuracy

## [v2.33.0] - 25/03/2026

### Added
* add dual aggregate mode and accent controls
* keep configurator preview in frame

### Fixed
* include badge render settings in image cache key

## [v2.32.0] - 25/03/2026

### Added
* add genre badge style and placement controls

## [v2.31.2] - 25/03/2026

### Fixed
* post Discord releases from project workflows
* clarify pending release state

## [v2.31.1] - 25/03/2026

### Fixed
* tighten provider preview layout

## [v2.31.0] - 25/03/2026

### Added
* add optional ERDB request protection
* add ERDB community Discord links

### Other Changes
* notify Discord after release workflow completes

## [v2.30.0] - 24/03/2026

### Added
* add silver quality badge style

### Fixed
* retry Discord release lookups
* repair Discord release notifications

## [v2.29.6] - 24/03/2026

### Fixed
* refine stacked badges and mobile docs
* use official Trakt badge asset

### Other Changes
* remove inline rating comment

## [v2.29.5] - 24/03/2026

### Fixed
* correct Trakt badge artwork
* sync AIOMetadata export presets

### Other Changes
* cover poster rating max caps
* add Discord release notifications

## [v2.29.4] - 24/03/2026

### Added
* add AIOMetadata export and badge controls

## [v2.29.3] - 24/03/2026

### Added
* added a new poster preset
  
  fix: fixed a bug in the stacked badge layout

## [v2.29.2] - 24/03/2026

### Fixed
* adjusted badges. layout and sizing

## [v2.29.1] - 24/03/2026

### Fixed
* tighten stacked badge rating layout

## [v2.29.0] - 24/03/2026

### Added
* add native rating modes and season aware badge fixes

## [v2.28.0] - 24/03/2026

### Added
* add badge customization controls

## [v2.27.0] - 24/03/2026

### Added
* expand fanart artwork sources
* add configurable clean poster sources
* expose fanart poster preset in configurator
* add experimental fanart clean poster mode

## [v2.26.0] - 24/03/2026

### Added
* add asset backed badge rendering controls
* add media quality badge rendering

### Fixed
* label age rating badges more clearly
* bust cached media badge renders

### Documentation
* align badge copy and UI wording

## [v2.25.0] - 24/03/2026

### Added
* add configurable genre badges
* add aggregate rating presentations and blockbuster poster collages
  
  • add per type rating presentation and aggregate source controls across the UI, proxy config, and docs
  • render minimal and average aggregate badges with source aware accents, outlines, and fallback logic
  • add blockbuster poster collages with quote blurbs, source callouts, density tuning, anti collision placement, and near vertical review cards

### Fixed
* clarify rating presentation behavior

### Other Changes
* update project internals

## [v2.24.3] - 23/03/2026

### Fixed
* track latest published GitHub release

## [v2.24.2] - 23/03/2026

### Fixed
* validate sqlite native binding during preflight

## [v2.24.1] - 23/03/2026

### Added
* shrink navbar and hero on scroll

### Other Changes
* sync upstream changes

## [v2.24.0] - 23/03/2026

### Added
* show latest GitHub release on homepage

### Fixed
* retry doc asset fetches during local compiles
* auto rebuild better sqlite after Node changes

## [v2.23.5] - 23/03/2026

### Fixed
* keep poster provider list single column on mobile

### Other Changes
* parallelize tag releases safely

## [v2.23.4] - 23/03/2026

### Other Changes
* auto load local env for release scripts

## [v2.23.3] - 23/03/2026

### Added
* show deployed version on homepage
  
  Add a visible deployment version badge in the nav and hero so the homepage reflects the version the current container is serving.
  
  Include a short note that GitHub releases can appear before container auto updates catch up.

### Documentation
* highlight changelog links in release notes
* highlight changelog links in README
* move changelog links near top of README

## [v2.23.2] - 23/03/2026

### Other Changes
* add README changelog links
* rebuild changelog history and release notes

## [v2.23.1] - 23/03/2026

### Fixed
* transparent Kitsu badge rendering

### Documentation
* clarify transparent badge behavior
* refresh screenshots and static assets
* expand proxy metadata translation guide

### Other Changes
* refresh docs assets and preview cache busters
* sync upstream changes

<a id="v2-23-0"></a>

## [v2.23.0] - 23/03/2026

### Added
* add rating provider ordering and anime fallbacks

<a id="v2-22-2"></a>

## [v2.22.2] - 23/03/2026

### Fixed
* prevent poster badge rows from clipping
* remove hard badge caps from auto layouts

<a id="v2-22-1"></a>

## [v2.22.1] - 23/03/2026

### Fixed
* restore missing translated anime art and direct trakt scale

<a id="v2-22-0"></a>

## [v2.22.0] - 23/03/2026

### Added
* add direct MAL and Trakt ratings

<a id="v2-21-10"></a>

## [v2.21.10] - 22/03/2026

### Fixed
* make rating fallback selection explicit

<a id="v2-21-9"></a>

## [v2.21.9] - 22/03/2026

### Fixed
* render anime rating badges reliably

<a id="v2-21-8"></a>

## [v2.21.8] - 22/03/2026

### Fixed
* respect explicit anime rating order

<a id="v2-21-7"></a>

## [v2.21.7] - 22/03/2026

### Documentation
* refresh anime logo comparison

<a id="v2-21-6"></a>

## [v2.21.6] - 22/03/2026

### Added
* add logo and quality badge limits

### Documentation
* add rendering comparison boards
* remove nontechnical hyphens from user copy

### Other Changes
* cover reverse mapping fallback
* ignore output artifacts

<a id="v2-21-5"></a>

## [v2.21.5] - 21/03/2026

### Fixed
* refresh live gallery cards and darken logo demos
  
  Wrap the README preview images in direct preview links and rotate the cache buster tokens so GitHub fetches fresh renders instead of keeping the old broken camo entries.
  
  Add a dark logo background option to the image renderer and use it for the curated The Boys logo preset so the live README sample stays visible on GitHub's light canvas.
  
  Replace the old video attachment URLs with static demo thumbnails captured from the live erdb.ibbylabs.dev fork and link them to the live Configurator and Addon Proxy sections.

<a id="v2-21-4"></a>

## [v2.21.4] - 21/03/2026

### Fixed
* fall back to the container bind host

<a id="v2-21-3"></a>

## [v2.21.3] - 21/03/2026

### Fixed
* buffer proxied preview images before returning them
  
  The live README preview route itself was reachable, but successful preview slugs still failed at the edge while direct image URLs worked. That pointed at the nested image passthrough path rather than slug resolution or key lookup.
  
  Buffer the fetched preview payload into an ArrayBuffer before constructing the outgoing response instead of re streaming the nested fetch body directly. Preserve the important response headers and set the final content length from the buffered payload so reverse proxies receive a normal concrete image response.

<a id="v2-21-2"></a>

## [v2.21.2] - 21/03/2026

### Other Changes
* stop tracking the generated recent changes feed
  
  Treat public/commits.json as generated build output instead of a tracked repository artifact.
  
  • ignore public/commits.json so build and dev regeneration does not create noisy diffs
  • remove the file from the git index while keeping local/generated copies available
  • add a predev hook so local development regenerates the feed before the app starts
  • keep the existing build time generation path so production images still ship the feed

<a id="v2-21-1"></a>

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

### Other Changes
* sync upstream changes
  
  Record upstream/main as merged so GitHub no longer reports this fork behind while preserving the current IbbyLabs tree, release history, and local customizations.

<a id="v2-21-0"></a>

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

<a id="v2-20-5"></a>

## [v2.20.5] - 21/03/2026

### Documentation
* rebuild changelog and recent changes after message rewrite
  
  Regenerate CHANGELOG.md and public/commits.json from the rewritten forward facing commit history so the repo outputs match the updated user facing subjects and bodies.

<a id="v2-20-4"></a>

## [v2.20.4] - 21/03/2026

### Fixed
* preserve standard ISO notation in user facing commit copy
  
  Keep standard labels such as ISO 639-1 intact when commit titles and bodies are normalized for the recent changes feed and changelog.
  
  Add regression coverage for the preserved standard notation and regenerate the tracked commit feed from the updated rules.

<a id="v2-20-3"></a>

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

<a id="v2-20-2"></a>

## [v2.20.2] - 21/03/2026

### Fixed
* remove visible hyphens from recent changes copy
  
  Normalize user facing commit titles and bodies before they reach the recent changes panel and changelog output.
  
  Rewrite low signal history entries into clearer summaries, convert list marker dashes into bullet points, and strip hyphen compounds from display text while keeping git history intact.

<a id="v2-20-1"></a>

## [v2.20.1] - 21/03/2026

### Fixed
* verify episode requested language translations before replacement
  
  Apply the same requested language TMDB translation availability check to episode metadata that the top level proxy meta path already uses, so prefer requested language no longer overwrites episode titles or overviews from season detail responses unless TMDB exposes a real translation for that exact episode locale.
  
  Add a reusable local smoke verifier that boots a mock upstream addon plus mock TMDB, anime mapping, AniList, and Kitsu services against a local Next server, and add seeded randomized merge tests so the translation rules are exercised across many title and overview combinations.
  
  Also add a narrowly scoped non production test override for private upstream URLs so the local verifier can drive the real proxy route without weakening the production SSRF checks.

<a id="v2-20-0"></a>

## [v2.20.0] - 21/03/2026

### Added
* add configurable metadata translation modes and anime fallback
  
  Expose proxy side metadata translation controls end to end so generated proxy manifests can opt into localized metadata merging without changing the shared ERDB image renderer settings.
  
  Add explicit fill missing, prefer upstream, prefer requested language, and prefer tmdb modes, verify exact TMDB translation availability before requested language replacement, and use AniList or Kitsu text as a fallback when anime native IDs cannot get strong TMDB text.
  
  Also attach optional _erdbMetaTranslation provenance data for debugging, wire the new settings through saved UI config and the configurator, update the README, and add regression coverage for translation target resolution, selection modes, and proxy payload encoding.

<a id="v2-19-0"></a>

## [v2.19.0] - 21/03/2026

### Added
* prefer upstream metadata and only fill missing translated fields
  
  Change translateMeta merging so localized TMDB text no longer blindly overwrites addon provided titles and overviews.
  
  Preserve existing upstream title and overview fields when they already contain meaningful text, treat common placeholders as missing, and only backfill missing metadata from TMDB after ID resolution succeeds.
  
  Keep anime reverse mapping as the fallback ID resolution path for anime native IDs, and add regression tests covering upstream preserving merge behavior plus placeholder and episode field backfilling.

<a id="v2-18-1"></a>

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

### Other Changes
* sync upstream changes

<a id="v2-18-0"></a>

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

<a id="v2-17-4"></a>

## [v2.17.4] - 20/03/2026

### Other Changes
* added disclaimer to CHANGELOG.md to explain duplicate commits

<a id="v2-17-3"></a>

## [v2.17.3] - 20/03/2026

### Documentation
* refresh README guide

### Other Changes
* sync upstream changes

<a id="v2-17-2"></a>

## [v2.17.2] - 20/03/2026

### Added
* support multi line commit messages and backfill history
  
  This update refactors the changelog script to capture full commit bodies (using %b) and correctly indent them in the Markdown output.
  
  It also adds a rebuild flag to systematically backfill the entire project history, ensuring older commits also show their detailed descriptions in the changelog and the 'Recent Changes' UI.

<a id="v2-17-1"></a>

## [v2.17.1] - 20/03/2026

### Added
* include all lines of commit message

<a id="v2-17-0"></a>

## [v2.17.0] - 20/03/2026

### Added
* refine recent changes feed
  
  • enhance [generate commits json.mjs] to include author/isUpstream metadata
  • add UI badges and custom styling in for upstream attribution
  • configure GitHub action to fetch full history (fetch depth: 0)

<a id="v2-16-2"></a>

## [v2.16.2] - 20/03/2026

### Fixed
* recent changes ui

### Other Changes
* sync upstream changes (2 commits)

<a id="v2-16-1"></a>

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

<a id="v2-16-0"></a>

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

<a id="v2-15-0"></a>

## [v2.15.0] - 19/03/2026

### Added
* implement select all as default for rating preferences
* normalize ratings to 0 to 10 scale and optimize backdrop layout for multi row
  
  This update standardizes ratings across poster, backdrop, and logo outputs by converting all providers to a 0 to 10 visual scale. It also improves backdrop rating rendering with dynamic multi row layouts and prioritizes anime specific providers.

### Fixed
* display 10.0 as 10 for cleaner visuals
  
  Rounding values of 10.0 to 10 to ensure a consistent look across providers when they reach the maximum normalized rating.

### Other Changes
* sync upstream changes

<a id="v2-14-3"></a>

## [v2.14.3] - 19/03/2026

### Fixed
* improve badge layout spacing and column limits
  
  • Capped quality badges strictly at 2 items per column (left/right) to prevent vertical overflow.
  
  • Dynamically adjust vertical start offset when backdrop ratings layout is 'center' matching top/bottom badges, preventing overlap with rating badges.

### Other Changes
* sync upstream changes

<a id="v2-14-2"></a>

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

<a id="v2-14-1"></a>

## [v2.14.1] - 19/03/2026

### Other Changes
* add posterQualityBadgesPosition to workspace round trip assertion
  
  Include the new posterQualityBadgesPosition default ('auto') in the
  expected settings for the workspace serialization round trip test.

<a id="v2-14-0"></a>

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
* sync upstream changes

<a id="v2-13-8"></a>

## [v2.13.8] - 19/03/2026

### Documentation
* add comprehensive env vars reference and fix stale docs
  
  • .env.example: add all env vars with defaults, min/max, and sections
    (proxy/security, cache TTLs, Torrentio, IMDb, Sharp rendering)
  • README: add Environment Variables section with tables for all settings
  • README: fix release command (npm run release:patch, not npm run release patch)
  • Add missing env vars: ERDB_TORRENTIO_CACHE_TTL_MS, ERDB_MDBLIST_RATE_LIMIT_COOLDOWN_MS,
    ERDB_TRUST_PROXY_HEADERS, ERDB_PROXY_ALLOWED_ORIGINS

<a id="v2-13-7"></a>

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

<a id="v2-13-5"></a>

## [v2.13.5] - 19/03/2026

### Fixed
* add User Agent header to Torrentio fetch to bypass 403
  
  Torrentio/Cloudflare returns 403 for requests without a browser like
  User Agent header. This caused all stream quality badges (4K, HDR, DV,
  Atmos) to silently fail in production. Adding a Chrome User Agent to
  the fetch request resolves the issue.

<a id="v2-13-4"></a>

## [v2.13.4] - 19/03/2026

### Added
* add per request log to verify deployed code version
  
  Logs every image request with type, id, and streamBadges param
  to confirm the deployed Docker image contains the latest code.

<a id="v2-13-3"></a>

## [v2.13.3] - 19/03/2026

### Added
* add diagnostic logging for Torrentio fetch failures
  
  Logs warnings when Torrentio fetch throws (network/timeout), returns
  non 200, or has zero streams. This helps diagnose why stream quality
  badges are not appearing in production.

<a id="v2-13-2"></a>

## [v2.13.2] - 18/03/2026

### Fixed
* strip internal port from public facing image URLs
  
  When ERDB runs behind a reverse proxy (ERDB_TRUST_PROXY_HEADERS=true),
  the internal port (e.g. :3000) was leaking into generated image URLs.
  This made all poster, backdrop, and logo URLs unreachable through the
  reverse proxy, causing blank posters and missing badges in Stremio.
  
  Now strips the port from generated URLs when behind a trusted proxy,
  so URLs use the reverse proxy's default port instead.

<a id="v2-13-1"></a>

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

<a id="v2-13-0"></a>

## [v2.13.0] - 18/03/2026

### Added
* added an override for badges

<a id="v2-11-2"></a>

## [v2.11.2] - 18/03/2026

### Fixed
* resolve stremio badge inconsistency by adding Torrentio concurrency limiter and fixing series streams
  
  • Adds a global `torrentioConcurrencyLimit` queue to `route.tsx` (limit: 3) to prevent aggressive rate limiting from Torrentio when Stremio requests 20+ catalog posters concurrently.
  • Modifies the Torrentio stream request for series to properly append `:1:1` (S01E01), allowing Torrentio to successfully fetch stream badges rather than returning empty streams.
  
  These changes resolve an issue where stream badges would intermittently fail on Stremio catalogs due to connection drops and lack of episodic context for TV show requests.

### Other Changes
* fix release workflow dependency

<a id="v2-11-1"></a>

## [v2.11.1] - 18/03/2026

### Fixed
* remove lingering edge middleware to resolve CSP hydration block

### Other Changes
* remove temporary commit file

<a id="v2-11-0"></a>

## [v2.11.0] - 18/03/2026

### Other Changes
* repo wide performance and security fixes (2 commits)
  
  • fix(proxy): rewrite TMDB translation payloads to fetch at the season level instead of concurrently per episode, preventing TMDB API rate limit bans
  • feat(cache): implement TTL based map for TMDB fetch caching to prevent permanent memory leaks
  • fix(sharp): cap unset ERDB_SHARP_CONCURRENCY and MEMORY_MB parameters to safe thresholds (2 threads, 512MB) rather than maxing out host resources
  • feat(cache): integrate disk level eviction sweeper (pruneOldestImageCache) for local object storage S3 fallbacks
  • feat(cache): integrate SQLite hook for pruneOldestMetadata to cap local JSON cache rows
  • security(cors): correct proxy manifest and proxy endpoints to default to Access Control Allow Origin: * rather than aggressively reflecting arbitrary origin headers
  • fix(render): migrate app/layout.tsx dynamic await connections and middleware.ts CSP nonce restrictions into a purely static next.config.ts header, restoring static generation for the homepage
  • ci(tests): add test suite execution explicitly to GitHub Actions pipeline
  • docs(readme): document the necessity and architectural intent of the Bring Your Own Key (BYOK) paradigm

<a id="v2-10-2"></a>

## [v2.10.2] - 18/03/2026

### Other Changes
* tightened some wording

<a id="v2-10-1"></a>

## [v2.10.1] - 18/03/2026

### Added
* tighten the merged configurator workspace layout
  
  Restructure the primary workspace surface into a denser desktop composition so the configurator, live preview, config string export, and thin proxy panel read as one all in one flow instead of two spaced out sections.
  
  Keep the merged proxy behavior intact by preserving the manifest only proxy input while moving the preview stack back into the center column and reducing visual dead space across the workspace container, card chrome, and header treatment.
  
  Retain the existing persistence and export wiring so the new layout remains compatible with the shared workspace model, copied config strings, and generated proxy manifests.

<a id="v2-10-0"></a>

## [v2.10.0] - 18/03/2026

### Added
* collapse proxy configuration into the shared configurator flow
  
  Remove the duplicate proxy side ERDB controls so the addon proxy only accepts an upstream manifest URL and consumes the configurator state above as its single source of truth.
  
  Drop proxy enabled type state from the saved workspace model and proxy URL builder, while continuing to normalize older saved payloads that still include legacy enabled flags.
  
  Update browser facing copy to make the merged workflow explicit and extend regression coverage for workspace serialization plus proxy payload generation under the new contract.

<a id="v2-9-0"></a>

## [v2.9.0] - 18/03/2026

### Added
* unify configurator and addon proxy workflows
  
  • remove the duplicated proxy side ERDB settings state and drive both exports from one shared configuration model
  
  • add full workspace save and JSON download/import support with migration from the legacy API key only local storage format
  
  • extract shared UI config helpers for serialization, proxy payload generation, and browser safe base64url encoding
  
  • add regression tests for workspace round tripping and shared config/proxy manifest generation
  
  • validate with npm run lint, npm test, npm run build, browser verification of shared state persistence and JSON download, and live proxy checks against Cinemeta meta rewriting

<a id="v2-8-1"></a>

## [v2.8.1] - 18/03/2026

### Fixed
* use configured CORS fallback origin in proxy routes
  
  When ERDB_PROXY_ALLOWED_ORIGINS is configured and a proxy request arrives without an Origin header, request.nextUrl.origin can resolve to an internal container hostname in production. That value was being returned in Access Control Allow Origin and caused client side failures.
  
  Update both proxy route handlers to keep wildcard support, preserve valid Origin echoing, and otherwise fall back to the first configured allowed origin whenever the allowlist is non empty but the request origin is missing or not permitted.

<a id="v2-8-0"></a>

## [v2.8.0] - 18/03/2026

### Other Changes
* detail post v2.7.2 updates
  
  Changes since v2.7.2:
  
  • docs: update README example language to en and clarify proxy CORS fallback behavior
  
  • ui: normalize supported language labels on the home page to English display names
  
  • proxy: adjust CORS logic in both proxy routes to reflect incoming Origin when allowlist is empty
  
  • imdb: switch import progress number formatting from en US to en GB in sync/import scripts
  
  • git: keep local planning notes local by ignoring future stuff.md

<a id="v2-7-2"></a>

## [v2.7.2] - 18/03/2026

### Fixed
* improve upstream TMDB error classification

<a id="v2-7-1"></a>

## [v2.7.1] - 18/03/2026

### Other Changes
* cleanup

<a id="v2-7-0"></a>

## [v2.7.0] - 17/03/2026

### Other Changes
* sync upstream changes

<a id="v2-6-0"></a>

## [v2.6.0] - 17/03/2026

### Added
* surface uptime tracker across landing page
  
  Changes since last release (v2.5.0):
  
  • add a dedicated status pill component that links to the IbbyLabs uptime tracker
  
  • wire uptime links into top navigation and footer for faster status access
  
  • add a status board explainer section near the page end with a clear CTA
  
  • introduce focused status pill styles with hover and focus visible states
  
  • update hero copy to clarify project positioning in the same ecosystem

<a id="v2-5-0"></a>

## [v2.5.0] - 17/03/2026

### Added
* improve preview error feedback and hero layout
  
  Add detailed preview error diagnostics for image load failures, including TMDB key hints and API/network messaging. Update hero overflow and mobile commit window sizing to prevent clipping and improve small screen layout.

### Other Changes
* create LICENSE
* disable next telemetry in docker, pin node to 22

<a id="v2-4-4"></a>

## [v2.4.4] - 17/03/2026

### Fixed
* complete pnpm migration

<a id="v2-4-3"></a>

## [v2.4.3] - 17/03/2026

### Other Changes
* switch to pnpm, enable corepack, optimize Docker and workflows for speed

<a id="v2-4-2"></a>

## [v2.4.2] - 17/03/2026

### Fixed
* expand selected labels

<a id="v2-4-1"></a>

## [v2.4.1] - 17/03/2026

### Other Changes
* queue docker workflow

<a id="v2-4-0"></a>

## [v2.4.0] - 17/03/2026

### Added
* save api key config

<a id="v2-3-0"></a>

## [v2.3.0] - 17/03/2026

### Added
* add recent changes feed and restore automated release flow
  
  • add a Recent changes panel on the homepage with commit type badges, relative timestamps, and incremental loading
  
  • mirror uptime status commit feed behavior by loading /commits.json and adding robust client side handling for loading and empty/error states
  
  • add a git log export utility (scripts/generate commits json.mjs) and package script to regenerate public/commits.json
  
  • harden commit subject parsing to accept both colon with space and colon without space conventional commit forms
  
  • update release automation to require a clean tree and push commit+tag automatically after npm version so chore release commits are restored
  
  • include styling and integration updates needed for the new recent changes workflow surface

<a id="v2-2-1"></a>

## [v2.2.1] - 17/03/2026

### Fixed
* resolve homepage lint regressions
  
  • replace root anchor usage with Next Link
  
  • remove effect driven setState patterns flagged by react hooks/set state in effect
  
  • add lint regression test for app/page.tsx and wire npm test script

<a id="v2-2-0"></a>

## [v2.2.0] - 17/03/2026

### Added
* refresh branding, stabilize UI, and improve release pipeline
  
  • update ERDB page structure and styling with a redesigned hero, section headers, and panel system
  
  • fix layout overflow and preview regressions by tightening responsive shrink behavior and client side preview URL handling
  
  • remove redundant footer subtitle copy for fork safe presentation
  
  • add complete favicon/web manifest asset set and align layout metadata/icons
  
  • update Docker publishing workflow and Dockerfile to improve release publishing and cache behavior
  
  • revise README instructions and bump package version to 2.2.0 for this feature release

<a id="v2-1-0"></a>

## [v2.1.0] - 17/03/2026

### Added
* align branding and chrome theme

### Other Changes
* reduce duplicate docker runs
* adjust renovate config
* enable fork processing
* enable renovate onboarding

<a id="v2-0-1"></a>

## [v2.0.1] - 17/03/2026

### Added
* add renovate configuration

### Other Changes
* enable docker layer cache

<a id="v2-0-0"></a>

## [v2.0.0] - 17/03/2026

<a id="v1-1-0"></a>

## [v1.1.0] - 17/03/2026

### Other Changes
* update sync schedule to uk time
* add upstream sync workflow
* adjust docker base image
* update proxy and docker setup

<a id="v1-0-4"></a>

## [v1.0.4] - 17/03/2026

### Fixed
* bump renderer cache; set ratings to bottom
  
  Update FINAL_IMAGE_RENDERER_CACHE_VERSION from 'poster backdrop logo v27' to 'poster backdrop logo v32' to invalidate/update cached image outputs. Adjust renderWithSharp logic so poster rating placements for 'left', 'right', and 'left right' layouts now map to 'bottom', standardizing quality badge positioning. (app/[type]/[id]/route.tsx)

<a id="v1-0-3"></a>

## [v1.0.3] - 17/03/2026

### Fixed
* lint cleanup

<a id="v1-0-2"></a>

## [v1.0.2] - 17/03/2026

### Added
* split ci and publish

<a id="v1-0-1"></a>

## [v1.0.1] - 17/03/2026

### Other Changes
* adjust release script

<a id="v1-0-0"></a>

## [v1.0.0] - 17/03/2026

<a id="v0-2-0"></a>

## [v0.2.0] - 17/03/2026

### Added
* add docker publish workflow
* update homepage and configurator (5 commits)
* render poster title/logo overlays & bump cache
  
  Bump image renderer cache version to v25 and add support for rendering a centered poster title SVG or TMDB logo overlay for "clean" poster mode. Introduces pickPosterTitleFromMedia and passes posterTitleText/posterLogoUrl through the rendering pipeline (including selection of TMDB logoPath), includes kitsu fallback title in fallback asset results, and adds buildPosterTitleSvg + helper to generate optimized SVG title images. Rendering logic now composes a poster title/logo overlay above bottom badges, handles logo resizing, and updates badge placement/quality badge positioning to accommodate the overlay. Also updates caching logic to consider clean poster text as a reason to cache the final image and tightens UI preview logic (only 'top bottom' now shows poster quality badges side) in app/page.tsx.
* add Torrentio stream quality badges & rendering
  
  Introduce stream/quality badges sourced from Torrentio and per type quality/rating controls. README: add new query/config params (streamBadges, posterStreamBadges, backdropStreamBadges, qualityBadgesSide, qualityBadgesStyle, poster/backdropQualityBadgesStyle and per type ratings overrides) and update URL build documentation. route.tsx: bump final image renderer cache version to v20; add Torrentio integration (fetchTorrentioBadges) with caching, dedupe in flight requests and TTL; new types (StreamBadgeKey, BadgeKey, StreamQualityFlags) and helpers to normalize settings and parse/merge stream flags from filenames. Add STREAM_BADGE_META, generation of quality badge SVGs (buildQualityBadgeSvg) and logic to include qualityBadges in the rendering pipeline for poster and backdrop (columns/rows, positioning, style). Update badge/build/render logic to accept quality badges and adjust provider icon mapping key type and some square style rendering details. Also add small fixes: support data: URIs for provider icons, add stream timing to server timing header, and adjust final image cache seed to account for stream badge state. Other file updates reflect README and UI/config changes.
* add addon proxy support
* bootstrap ERDB project

### Fixed
* update image rendering route (15 commits)
* handle square style stroke width in badge
  
  Update buildQualityBadgeSvg in app/[type]/[id]/route.tsx to add a specific strokeWidth case for style === 'square' (Math.max(1, Math.round(h * 0.05))). Previously the ternary only handled 'glass' and a default; this change ensures square badges use a slightly smaller stroke. Also split the expression across multiple lines for readability.
* fix typo in HuggingFace Guide section
* update multiple project areas
  
  Touches image rendering route and project tooling.
* update multiple project areas
  
  Touches image rendering route, project tooling, and rendering and data pipeline.
* update addon proxy handling (2 commits)
* update addon proxy handling
  
  Touches addon proxy, homepage and configurator, and README guide.
* update addon proxy handling (2 commits)
  
  Touches addon proxy, homepage and configurator, and image rendering route.

### Documentation
* refresh README guide (12 commits)
* refresh README guide
  
  Removed note about using Dockerfile.hf for Hugging Face Spaces.

### Other Changes
* update deployment setup (5 commits)
* update deployment setup
  
  Touches deployment setup and project tooling.
* remove demo videos (2 commits)
* add demo videos
* add Hugging Face Docker support
* update multiple project areas
  
  Touches deployment setup and image rendering route.
* update multiple project areas
  
  Touches project tooling and README guide.
* merge contributor changes
* update project internals
  
  Touches project internals and project tooling.
* update project internals
  
  Touches project internals, project tooling, and README guide.

