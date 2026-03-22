# Easy Ratings Database (ERDB) - Stateless Edition

ERDB generates poster/backdrop/logo images with dynamic ratings on-the-fly.

## Quick Start

## Install From GitHub

```bash
git clone https://github.com/IbbyLabs/erdb
cd erdb
```

1. Install dependencies: `sudo npm install`
2. Build: `npm run build`
3. Start the app: `npm run start`
4. App available at `http://localhost:3000`

## Stateless Architecture & API Keys (BYOK)

ERDB is designed with a **Bring Your Own Key (BYOK)** stateless architecture. 
This means that the ERDB server itself does not permanently store or centrally manage your TMDB or MDBList API keys. Instead:

1. Keys are saved locally in your browser's `localStorage` when using the configurator UI.
2. Keys are embedded directly into your generated URLs (`tmdbKey=...&mdblistKey=...`) and Addon proxy Base64 configurations.
3. The server solely reads these keys from incoming requests to fetch upstream metadata on-the-fly.

This intentional design allows you to host public ERDB proxy instances without paying for massive shared API usage, as every connected addon or user brings their own API key and rate limits. The visibility of keys in URLs and the configurator UI is expected behavior.

## Live Preview Gallery

These are live requests against production so readers can see current poster, backdrop, and logo output directly inside GitHub.

The gallery is intended to use the optional server side preview env vars `ERDB_README_PREVIEW_TMDB_KEY` and `ERDB_README_PREVIEW_MDBLIST_KEY` so the README does not need to expose a raw API key.

Each preview URL includes a `cb` cache buster token. Change that token when you want GitHub to fetch a fresh preview again.

### Posters

<table>
  <tr>
    <td><strong>The Boys</strong><br>Glass ratings, stream badges, original text</td>
    <td><strong>Dune Part Two</strong><br>Square ratings, clean text, compact layout</td>
    <td><strong>Attack on Titan</strong><br>Japanese text, anime ratings, poster stack</td>
  </tr>
  <tr>
    <td><a href="https://erdb.ibbylabs.dev/preview/the-boys-poster?cb=readmePreviewTheBoysPoster20260321refresh1"><img src="https://erdb.ibbylabs.dev/preview/the-boys-poster?cb=readmePreviewTheBoysPoster20260321refresh1" alt="The Boys poster live preview" width="220"></a></td>
    <td><a href="https://erdb.ibbylabs.dev/preview/dune-part-two-poster?cb=readmePreviewDunePoster20260321refresh1"><img src="https://erdb.ibbylabs.dev/preview/dune-part-two-poster?cb=readmePreviewDunePoster20260321refresh1" alt="Dune Part Two poster live preview" width="220"></a></td>
    <td><a href="https://erdb.ibbylabs.dev/preview/attack-on-titan-poster?cb=readmePreviewAttackOnTitanPoster20260321refresh1"><img src="https://erdb.ibbylabs.dev/preview/attack-on-titan-poster?cb=readmePreviewAttackOnTitanPoster20260321refresh1" alt="Attack on Titan poster live preview" width="220"></a></td>
  </tr>
</table>

### Backdrops

<table>
  <tr>
    <td><strong>Game of Thrones</strong><br>French backdrop, right side ratings</td>
    <td><strong>Stranger Things</strong><br>Square ratings, stream badges, left side stack</td>
  </tr>
  <tr>
    <td><a href="https://erdb.ibbylabs.dev/preview/game-of-thrones-backdrop?cb=readmePreviewGameOfThronesBackdrop20260321refresh1"><img src="https://erdb.ibbylabs.dev/preview/game-of-thrones-backdrop?cb=readmePreviewGameOfThronesBackdrop20260321refresh1" alt="Game of Thrones backdrop live preview" width="320"></a></td>
    <td><a href="https://erdb.ibbylabs.dev/preview/stranger-things-backdrop?cb=readmePreviewStrangerThingsBackdrop20260321refresh1"><img src="https://erdb.ibbylabs.dev/preview/stranger-things-backdrop?cb=readmePreviewStrangerThingsBackdrop20260321refresh1" alt="Stranger Things backdrop live preview" width="320"></a></td>
  </tr>
</table>

### Logos

<table>
  <tr>
    <td><strong>The Boys</strong><br>Dark canvas, glass ratings</td>
    <td><strong>Attack on Titan</strong><br>Japanese logo with anime ratings</td>
  </tr>
  <tr>
    <td><a href="https://erdb.ibbylabs.dev/preview/the-boys-logo?cb=readmePreviewTheBoysLogo20260321refresh1"><img src="https://erdb.ibbylabs.dev/preview/the-boys-logo?cb=readmePreviewTheBoysLogo20260321refresh1" alt="The Boys logo live preview" width="320"></a></td>
    <td><a href="https://erdb.ibbylabs.dev/preview/attack-on-titan-logo?cb=readmePreviewAttackOnTitanLogo20260321refresh1"><img src="https://erdb.ibbylabs.dev/preview/attack-on-titan-logo?cb=readmePreviewAttackOnTitanLogo20260321refresh1" alt="Attack on Titan logo live preview" width="320"></a></td>
  </tr>
</table>


## Scalability & Docker

The compose file includes a reverse proxy (Caddy) to handle app scaling.

## Releases & Packages

Pushing a version tag that matches `v*` now starts two independent workflows:

- publishes a GitHub release with generated release notes
- pushes a multi-arch container image to GHCR as `ghcr.io/ibbylabs/erdb`

The GitHub release is no longer blocked on the Docker publish job finishing.

Pull examples:

```bash
docker pull ghcr.io/ibbylabs/erdb:latest
docker pull ghcr.io/ibbylabs/erdb:v2.1.0
```

Release flow:

```bash
npm run release:patch
```

If the GHCR package already existed before it was linked to this repository, open the package in GitHub and:

1. connect it to `IbbyLabs/erdb`
2. enable permission inheritance from the repository
3. set visibility to public if you want anonymous pulls

## Recommended Requirements

For high performance (on-the-fly image rendering), a server with a strong CPU and plenty of RAM is recommended.

Minimum recommended:
- CPU: 4 vCPU
- RAM: 4 GB

Basic start:
```bash
docker compose up -d --build
```

If you are using the bundled Docker setup, the app should bind internally to `0.0.0.0`.
Set `ERDB_BIND_HOST=0.0.0.0` in the same `.env` file that `docker compose` reads if you need to override it explicitly.
This is only the container bind host. It is not your public domain name.

Scale to multiple instances (e.g. 4):
```bash
docker compose up -d --build --scale app=4
```

The public port is `ERDB_HTTP_PORT` (default `3000`) exposed by Caddy. Set it in the `.env` file.
Data (SQLite database and image cache) is persisted in `./data`.

Custom port (with scale):
```bash
ERDB_HTTP_PORT=4000 docker compose up -d --build --scale app=4
```
## HuggingFace Guide (NOT RECOMMENDED)

(to avoid bans on HuggingFace)
1. Go to the ERDB GitHub repo: https://github.com/IbbyLabs/erdb
2. Click the "Fork" button in the top-right corner
3. Choose any name for the fork (do not use "erdb")

### HuggingFace Steps

1. Create a new Space
2. Choose any name
3. Select Docker
4. Select Blank
5. Set it as a Public space
6. Click Create Space

Now click "Create the Dockerfile" (near the bottom of the page).

Copy and paste the content of `Dockerfile.hf` into the editor that opens,
replacing "IbbyLabs" with your GitHub username.

Line to change:

```text
RUN git clone https://github.com/IbbyLabs/erdb.git .
```

After the edit, click "Commit new file to main".

### ERDB URL

To get your personal link:

1. Click the three dots in the top-right corner
2. Go to "Embed this Space"
3. Copy the Direct URL

Done! Your ERDB is ready to use on HuggingFace.

Note: to update ERDB quickly, go to the Space settings and click
"Factory Rebuild" only after syncing your fork on GitHub.

## API Usage

Main endpoint:
`GET /{type}/{id}.jpg?ratings={providers}&lang={lang}&ratingStyle={style}...`

### Examples
- **Poster with IMDb and TMDB**: `/poster/tt0133093.jpg?ratings=imdb,tmdb&lang=en`
- **Minimal backdrop**: `/backdrop/tmdb:603.jpg?ratings=mdblist&style=plain`

### Supported Query Parameters

| Parameter | Description | Supported Values | Default |
|-----------|-------------|------------------|---------|
| `type` | Image type (Path) | `poster`, `backdrop`, `logo` | - |
| `id` | Media ID (Path) | IMDb (tt...), TMDB (tmdb:...), Kitsu (kitsu:...) | - |
| `lang` | Image language | Any TMDB ISO 639-1 code (e.g. `it`, `en`, `es`, `fr`, `de`, `ru`, `ja`) | `en` |
| `streamBadges` | Quality badges via Torrentio (global fallback) | `auto`, `on`, `off` | `auto` |
| `posterStreamBadges` | Poster quality badges | `auto`, `on`, `off` | `auto` |
| `backdropStreamBadges` | Backdrop quality badges | `auto`, `on`, `off` | `auto` |
| `qualityBadgesSide` | Quality badges side (poster only) | `left`, `right` | `left` |
| `qualityBadgesStyle` | Quality badges style (global fallback) | `glass`, `square`, `plain` | `glass` |
| `posterQualityBadgesStyle` | Poster quality badges style | `glass`, `square`, `plain` | `glass` |
| `backdropQualityBadgesStyle` | Backdrop quality badges style | `glass`, `square`, `plain` | `glass` |
| `posterQualityBadgesMax` | Poster quality badge limit | Number (1-20) | `auto` |
| `backdropQualityBadgesMax` | Backdrop quality badge limit | Number (1-20) | `auto` |
| `ratings` | Rating providers (global fallback) | `tmdb, mdblist, imdb, tomatoes, tomatoesaudience, letterboxd, metacritic, metacriticuser, trakt, rogerebert, myanimelist, anilist, kitsu` | `all` |
| `posterRatings` | Poster rating providers | `tmdb, mdblist, imdb, tomatoes, tomatoesaudience, letterboxd, metacritic, metacriticuser, trakt, rogerebert, myanimelist, anilist, kitsu` | `all` |
| `backdropRatings` | Backdrop rating providers | `tmdb, mdblist, imdb, tomatoes, tomatoesaudience, letterboxd, metacritic, metacriticuser, trakt, rogerebert, myanimelist, anilist, kitsu` | `all` |
| `logoRatings` | Logo rating providers | `tmdb, mdblist, imdb, tomatoes, tomatoesaudience, letterboxd, metacritic, metacriticuser, trakt, rogerebert, myanimelist, anilist, kitsu` | `all` |
| `ratingStyle` (or `style`) | Badge style | `glass` (Pill), `square` (Dark), `plain` (No BG) | `glass` (poster/backdrop), `plain` (logo) |
| `tmdbKey` | TMDB v3 API Key (Stateless) | String (e.g. `your_key`) | **Required** |
| `mdblistKey` | MDBList API Key (Stateless) | String (e.g. `your_key`) | **Required** |
| `imageText` | Image text (poster/backdrop only) | `original`, `clean`, `alternative` | `original` (poster), `clean` (backdrop) |
| `posterRatingsLayout` | Poster layout | `top`, `bottom`, `left`, `right`, `top-bottom`, `left-right` | `top-bottom` |
| `posterRatingsMaxPerSide` | Max badges per side | Number (1-20) | `auto` |
| `backdropRatingsLayout` | Backdrop layout | `center`, `right`, `right-vertical` | `center` |
| `logoRatingsMax` | Logo badge limit | Number (1-20) | `auto` (`6` if omitted) |
| `logoBackground` | Logo canvas background | `transparent`, `dark` | `transparent` |

All rendered ratings are normalized to a `0-10` display scale for `poster`, `backdrop`, and `logo` outputs. Providers that already use `/10` are shown without the suffix, percentage sources are converted to decimal (`69%` -> `6.9`), `/5` sources are doubled (`4.2/5` -> `8.4`), and `/4` sources are multiplied by `2.5`.

### Supported ID Formats

ERDB supports multiple formats to identify media:

- **IMDb**: `tt0133093` (standard `tt` + numbers)
- **TMDB**: `tmdb:603` (prefix `tmdb:` followed by the ID)
- **Kitsu**: `kitsu:1` (prefix `kitsu:` followed by the ID)
- **Anime Mappings**: `provider:id` (e.g. `anilist:123`, `myanimelist:456`)

## Addon Developer Guide

To integrate ERDB into your addon:

1. **Config String**: use a single `erdbConfig` string (base64url) generated by the ERDB configurator. It contains base URL, TMDB key, MDBList key, and all parameters (ratings with per-type overrides, lang, quality badges with per-type overrides, side, style, per-type style, per-type text, per-type max limits, and logo background).
2. **Addon UI**: show ONLY the toggles to enable/disable `poster`, `backdrop`, `logo`. No modal and no extra settings panels.
3. **Fallback**: if a type is disabled, keep the original artwork (do not call ERDB for that type).
4. **Decode**: decode `erdbConfig` (base64url -> JSON) once and reuse it.
5. **URL build**: `{baseUrl}/{type}/{id}.jpg?tmdbKey=...&mdblistKey=...&ratings=...&posterRatings=...&backdropRatings=...&logoRatings=...&lang=...&streamBadges=...&posterStreamBadges=...&backdropStreamBadges=...&qualityBadgesSide=...&qualityBadgesStyle=...&posterQualityBadgesStyle=...&backdropQualityBadgesStyle=...&posterQualityBadgesMax=...&backdropQualityBadgesMax=...&ratingStyle=...&imageText=...&logoRatingsMax=...&logoBackground=...` using the per-type config fields:
   - `poster`: `posterRatingStyle`, `posterImageText`
   - `backdrop`: `backdropRatingStyle`, `backdropImageText`
   - `logo`: `logoRatingStyle`, `logoBackground` (omit `imageText`)

### AI Integration Prompt

If you are using an AI agent (Claude, ChatGPT, etc.) to build your addon, copy this prompt:

```text
Act as an expert addon developer. I want to implement the ERDB Stateless API into my media center addon.

--- CONFIG INPUT ---
Add a single text field called "erdbConfig" (base64url). The user will paste it from the ERDB site after configuring there.
Do NOT hardcode API keys or base URL. Always use cfg.baseUrl from erdbConfig.

--- DECODE ---
Node/JS: const cfg = JSON.parse(Buffer.from(erdbConfig, 'base64url').toString('utf8'));

--- FULL API REFERENCE ---
Endpoint: GET /{type}/{id}.jpg?...queryParams

Parameter               | Values                                                              | Default
type (path)             | poster, backdrop, logo                                               | -
id (path)               | IMDb (tt...), TMDB (tmdb:id / tmdb:movie:id / tmdb:tv:id), Kitsu (kitsu:id), AniList, MAL          | -
ratings                 | tmdb, mdblist, imdb, tomatoes, tomatoesaudience, letterboxd,         | all
                        | metacritic, metacriticuser, trakt, rogerebert, myanimelist,          |
                        | anilist, kitsu (global fallback)                                     |
posterRatings           | tmdb, mdblist, imdb, tomatoes, tomatoesaudience, letterboxd,         | all
                        | metacritic, metacriticuser, trakt, rogerebert, myanimelist,          |
                        | anilist, kitsu (poster only)                                         |
backdropRatings         | tmdb, mdblist, imdb, tomatoes, tomatoesaudience, letterboxd,         | all
                        | metacritic, metacriticuser, trakt, rogerebert, myanimelist,          |
                        | anilist, kitsu (backdrop only)                                       |
logoRatings             | tmdb, mdblist, imdb, tomatoes, tomatoesaudience, letterboxd,         | all
                        | metacritic, metacriticuser, trakt, rogerebert, myanimelist,          |
                        | anilist, kitsu (logo only)                                           |
lang                    | Any TMDB ISO 639-1 code (en, it, fr, es, de, ja, ko, etc.)            | en
streamBadges            | auto, on, off (global fallback)                                      | auto
posterStreamBadges      | auto, on, off (poster only)                                          | auto
backdropStreamBadges    | auto, on, off (backdrop only)                                        | auto
qualityBadgesSide       | left, right (poster only)                                            | left
qualityBadgesStyle      | glass, square, plain (global fallback)                               | glass
posterQualityBadgesStyle| glass, square, plain (poster only)                                   | glass
backdropQualityBadgesStyle| glass, square, plain (backdrop only)                               | glass
posterQualityBadgesMax  | Number (1-20)                                                        | auto
backdropQualityBadgesMax| Number (1-20)                                                        | auto
ratingStyle             | glass, square, plain                                                 | glass
imageText               | original, clean, alternative                                         | original
posterRatingsLayout     | top, bottom, left, right, top-bottom, left-right                     | top-bottom
posterRatingsMaxPerSide | Number (1-20)                                                        | auto
backdropRatingsLayout   | center, right, right-vertical                                        | center
logoRatingsMax          | Number (1-20)                                                        | auto (6 if omitted)
logoBackground          | transparent, dark                                                    | transparent
tmdbKey (REQUIRED)      | Your TMDB v3 API Key                                                 | -
mdblistKey (REQUIRED)   | Your MDBList.com API Key                                             | -

--- INTEGRATION REQUIREMENTS ---
1. Use ONLY the "erdbConfig" field (no modal and no extra settings panels).
2. Add toggles to enable/disable: poster, backdrop, logo.
3. If a type is disabled, keep the original artwork (do not call ERDB for that type).
4. Build ERDB URLs using the decoded config and inject them into both catalog and meta responses.

--- PER-TYPE SETTINGS ---
poster   -> ratingStyle = cfg.posterRatingStyle, imageText = cfg.posterImageText
backdrop -> ratingStyle = cfg.backdropRatingStyle, imageText = cfg.backdropImageText
logo     -> ratingStyle = cfg.logoRatingStyle, logoBackground = cfg.logoBackground (omit imageText)
Ratings providers can be set per-type via cfg.posterRatings / cfg.backdropRatings / cfg.logoRatings (fallback to cfg.ratings).
Quality badges can be set per-type via cfg.posterStreamBadges / cfg.backdropStreamBadges (fallback to cfg.streamBadges).
Quality badges style/max can be set per-type via cfg.posterQualityBadgesStyle / cfg.backdropQualityBadgesStyle and cfg.posterQualityBadgesMax / cfg.backdropQualityBadgesMax.

--- URL BUILD ---
const typeRatingStyle = type === 'poster' ? cfg.posterRatingStyle : type === 'backdrop' ? cfg.backdropRatingStyle : cfg.logoRatingStyle;
const typeImageText = type === 'backdrop' ? cfg.backdropImageText : cfg.posterImageText;
${cfg.baseUrl}/${type}/${id}.jpg?tmdbKey=${cfg.tmdbKey}&mdblistKey=${cfg.mdblistKey}&ratings=${cfg.ratings}&posterRatings=${cfg.posterRatings}&backdropRatings=${cfg.backdropRatings}&logoRatings=${cfg.logoRatings}&lang=${cfg.lang}&streamBadges=${cfg.streamBadges}&posterStreamBadges=${cfg.posterStreamBadges}&backdropStreamBadges=${cfg.backdropStreamBadges}&qualityBadgesSide=${cfg.qualityBadgesSide}&qualityBadgesStyle=${cfg.qualityBadgesStyle}&posterQualityBadgesStyle=${cfg.posterQualityBadgesStyle}&backdropQualityBadgesStyle=${cfg.backdropQualityBadgesStyle}&posterQualityBadgesMax=${cfg.posterQualityBadgesMax}&backdropQualityBadgesMax=${cfg.backdropQualityBadgesMax}&ratingStyle=${typeRatingStyle}&imageText=${typeImageText}&posterRatingsLayout=${cfg.posterRatingsLayout}&posterRatingsMaxPerSide=${cfg.posterRatingsMaxPerSide}&backdropRatingsLayout=${cfg.backdropRatingsLayout}&logoRatingsMax=${cfg.logoRatingsMax}&logoBackground=${cfg.logoBackground}

Omit imageText when type=logo.

Skip any params that are undefined. Keep empty ratings/posterRatings/backdropRatings/logoRatings to disable providers.
```

---

## Addon Proxy (Stremio)

ERDB can act as a proxy for any Stremio addon and always replace images
(poster, background, logo) with the ones generated by ERDB.

### Manifest Proxy (Stremio)

Stremio does not use query params here. **You must generate the link from the ERDB site** using the "Addon Proxy" section:

```text
https://YOUR_ERDB_HOST/proxy/{config}/manifest.json
```

`{config}` is created automatically by the site based on the inserted parameters.

### Notes
- The proxy rewrites enabled `meta.poster`, `meta.background`, `meta.logo` (types can be toggled in the Addon Proxy UI).
- The `url` field must point to the original addon's `manifest.json`.
- `tmdbKey` and `mdblistKey` are required.
- Optional proxy metadata translation can localize `meta.name` / `meta.description` and episode text.
- `translateMetaMode=fill-missing` is the safe default: keep good addon text and only backfill blanks or placeholders.
- `translateMetaMode=prefer-upstream` keeps any non-empty upstream text, even placeholders like `N/A`.
- `translateMetaMode=prefer-requested-language` replaces upstream text only when TMDB has an exact translation for the requested language; anime-native fallback can still fill missing fields.
- `translateMetaMode=prefer-tmdb` prefers TMDB text whenever it is available.
- When `debugMetaTranslation=true`, the proxy adds an `_erdbMetaTranslation` object to returned metas so you can inspect field provenance.

### Metadata Translation In Action

These screenshots were captured against the live deployment at `https://erdb.ibbylabs.dev` on `2026-03-21`.

To make each merge mode visible on demand, the production proxy was exercised against a temporary public test addon that returned controlled upstream metadata for three real IDs:

1. `tt0133093` (`The Matrix`) with placeholder movie text (`N/A`, blank overview)
2. `tt0944947` (`Game of Thrones`) with good top level upstream text plus mixed episode text
3. `mal:16498` (`Attack on Titan`) with blank anime text so TMDB and anime fallback behavior are both observable

That addon was only used to create deterministic before and after cases. The proxy requests still resolved real TMDB, AniList, and Kitsu data through the live ERDB deployment.

#### Settings Panel

![Proxy metadata translation settings](docs/images/metadata-translation/proxy-translation-settings-panel.png)

Fill Missing in French (France) replaces placeholder movie fields with TMDB French text.

![Fill missing movie example in French](docs/images/metadata-translation/proxy-translation-fill-missing-movie-fr.png)

Prefer Requested Language in French (Belgium) preserves good upstream series text when TMDB does not have an exact regional match, while still filling missing episode fields.

![Prefer requested language show example in French Belgium](docs/images/metadata-translation/proxy-translation-prefer-language-show-fr-be.png)

Anime fallback in English (United Kingdom): Prefer Requested Language falls back to anime native text when TMDB only has exact English (United States), and provenance records the fallback source.

![Anime fallback example in English United Kingdom](docs/images/metadata-translation/proxy-translation-anime-fallback-en-gb.png)

Production validation for this feature covered French (France), French (Belgium), English (United States), and English (United Kingdom).

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed. All cache TTL values are in **milliseconds**.

### Proxy & Security

| Variable | Default | Description |
|----------|---------|-------------|
| `ERDB_TRUST_PROXY_HEADERS` | `false` | Trust `x-forwarded-host` / `x-forwarded-proto` when behind a reverse proxy |
| `ERDB_PROXY_ALLOWED_ORIGINS` | (empty) | Comma-separated CORS allowlist. Empty = reflect incoming `Origin` header |
| `ERDB_BIND_HOST` | `0.0.0.0` | Docker-only helper variable that maps to the container `HOSTNAME` bind address for standalone Next.js |
| `PREVIEW_INTERNAL_ORIGIN` | `http://127.0.0.1:3000` | Internal self-fetch origin used by `/preview/{slug}` before falling back to the container hostname and public origin |
| `ERDB_README_PREVIEW_TMDB_KEY` | (empty) | Optional dedicated TMDB key for the fixed README preview gallery route |
| `ERDB_README_PREVIEW_MDBLIST_KEY` | (empty) | Optional dedicated MDBList key for the fixed README preview gallery route |

### Cache TTLs

| Variable | Default | Min | Max | Description |
|----------|---------|-----|-----|-------------|
| `ERDB_TMDB_CACHE_TTL_MS` | 3 days | 10 min | 30 days | TMDB metadata |
| `ERDB_MDBLIST_CACHE_TTL_MS` | 3 days | 10 min | 30 days | MDBList ratings |
| `ERDB_KITSU_CACHE_TTL_MS` | 3 days | 10 min | 30 days | Kitsu anime |
| `ERDB_TORRENTIO_CACHE_TTL_MS` | 6 hours | 10 min | 7 days | Torrentio stream badges |
| `ERDB_PROVIDER_ICON_CACHE_TTL_MS` | 7 days | 1 hour | 30 days | Rating provider icons |
| `ERDB_IMDB_DATASET_CACHE_TTL_MS` | 7 days | 1 hour | 365 days | Local IMDb dataset |
| `ERDB_MDBLIST_OLD_MOVIE_CACHE_TTL_MS` | 7 days | 1 hour | 30 days | Extended cache for old media |
| `ERDB_MDBLIST_OLD_MOVIE_AGE_DAYS` | 365 | 30 | 3,650 | Age threshold for "old media" logic |
| `ERDB_MDBLIST_RATE_LIMIT_COOLDOWN_MS` | 1 day | 30 sec | 7 days | Cooldown after MDBList rate limit |

### Torrentio

| Variable | Default | Description |
|----------|---------|-------------|
| `ERDB_TORRENTIO_BASE_URL` | `https://torrentio.strem.fun` | Custom Torrentio instance URL |

> **Note:** Torrentio requests use `HTTP_PROXY` / `HTTPS_PROXY` env vars (via `undici ProxyAgent`) when set.

### Sharp Rendering (advanced)

| Variable | Default | Description |
|----------|---------|-------------|
| `ERDB_SHARP_CONCURRENCY` | Sharp default | Max Sharp threads |
| `ERDB_SHARP_CACHE_MEMORY_MB` | Sharp default | Memory (MB) for Sharp internal cache |
| `ERDB_SHARP_CACHE_ITEMS` | Sharp default | Max cached items |
| `ERDB_SHARP_CACHE_FILES` | Sharp default | Max cached files/handles |

## Live Demo Cards

<table>
  <tr>
    <td><strong>Live Configurator Workspace</strong><br>The current configurator and preview workspace running on `erdb.ibbylabs.dev`.</td>
    <td><strong>Live Addon Proxy Workspace</strong><br>The current proxy panel and export flow running on `erdb.ibbylabs.dev`.</td>
  </tr>
  <tr>
    <td><a href="https://erdb.ibbylabs.dev/#preview"><img src="docs/images/demo-videos/configurator-live-demo.png" alt="Open the live ERDB configurator workspace" width="420"></a></td>
    <td><a href="https://erdb.ibbylabs.dev/#proxy"><img src="docs/images/demo-videos/addon-proxy-live-demo.png" alt="Open the live ERDB addon proxy workspace" width="304"></a></td>
  </tr>
</table>

© 2026 ERDB Project
