# Easy Ratings Database (ERDB) - Stateless Edition

ERDB genera poster/backdrop/logo con ratings dinamici on-the-fly.

## Avvio Rapido

## Installazione da GitHub

```bash
git clone https://github.com/realbestia1/erdb
cd erdb
```

1. Installa le dipendenze: `npm install`
2. Build: `npm run build`
3. Avvia l'app: `npm run start`
4. App disponibile su `http://localhost:3000`

## Scalabilità & Docker

Il compose include un reverse proxy (Caddy) per gestire lo scale dell'app.

## Requisiti Consigliati

Per performance elevate (rendering immagini on-the-fly), è consigliato un server con CPU potente e molta RAM.

Minimo consigliato:
- CPU: 4 vCPU
- RAM: 4 GB

Avvio base:
```bash
docker compose up -d --build
```

Scale su più istanze (es. 4):
```bash
docker compose up -d --build --scale app=4
```

La porta pubblica è `ERDB_HTTP_PORT` (default `3000`) esposta da Caddy. Impostala nel file `.env`.
I dati (database SQLite e cache immagini) sono persistiti nel volume `./data`.

Porta custom (con scale):
```bash
ERDB_HTTP_PORT=4000 docker compose up -d --build --scale app=4
```

## Utilizzo API

L'endpoint principale è:
`GET /{type}/{id}.jpg?ratings={providers}&lang={lang}&ratingStyle={style}...`

### Esempi
- **Poster con IMDb e TMDB**: `/poster/tt0133093.jpg?ratings=imdb,tmdb&lang=it`
- **Backdrop minimal**: `/backdrop/tmdb:603.jpg?ratings=mdblist&style=minimal`

### Parametri Query Supportati

| Parametro | Descrizione | Valori Supportati | Default |
|-----------|-------------|-------------------|---------|
| `type` | Tipo immagine (Path) | `poster`, `backdrop`, `logo` | - |
| `id` | ID del Media (Path) | IMDb (tt...), TMDB (tmdb:...), Kitsu (kitsu:...) | - |
| `lang` | Lingua immagini | Tutti i codici TMDB ISO 639-1 (es. `it`, `en`, `es`, `fr`, `de`, `ru`, `ja`) | `en` |
| `ratings` | Provider rating | `tmdb, mdblist, imdb, tomatoes, tomatoesaudience, letterboxd, metacritic, metacriticuser, trakt, rogerebert, myanimelist, anilist, kitsu` | `all` |
| `ratingStyle` (o `style`) | Stile badge | `glass` (Pill), `square` (Dark), `plain` (No BG) | `glass` (poster/backdrop), `plain` (logo) |
| `tmdbKey` | TMDB v3 API Key (Stateless) | String (es. `your_key`) | **Richiesto** |
| `mdblistKey` | MDBList API Key (Stateless) | String (es. `your_key`) | **Richiesto** |
| `imageText` | Testo sulle immagini | `original`, `clean`, `alternative` | `original` (poster/logo), `clean` (backdrop) |
| `posterRatingsLayout` | Layout Poster | `top`, `bottom`, `left`, `right`, `top-bottom`, `left-right` | `top-bottom` |
| `posterRatingsMaxPerSide` | Max Badge Side | Numero (1-20) | `auto` |
| `backdropRatingsLayout` | Layout Backdrop | `center`, `right`, `right-vertical` | `center` |

### Formati ID Supportati

ERDB supporta diversi formati per identificare i media:

- **IMDb**: `tt0133093` (Formato standard `tt` + numeri)
- **TMDB**: `tmdb:603` (Prefisso `tmdb:` seguito dall'ID)
- **Kitsu**: `kitsu:1` (Prefisso `kitsu:` seguito dall'ID)
- **Anime Mappings**: `provider:id` (es. `anilist:123`, `myanimelist:456`)

## Addon Developer Guide

Per integrare ERDB nel tuo addon:

1. **Impostazioni**: Crea un pannello opzioni per `ratings`, `ratingStyle`, `lang`, `imageText` e layout.
2. **UI consigliata**: Aggiungi un pulsante "Setup" che apre una modal con tutte le opzioni (mantieni la pagina principale pulita).
3. **Opzioni suggerite**:
   - Ratings (multi-select): tutti i provider della tabella.
   - Languages: tutti i codici TMDB ISO 639-1.
   - Style: `glass`, `square`, `plain`.
   - Per-type ratingStyle: override per poster/backdrop/logo.
   - Enable/Disable Types: toggle per poster/backdrop/logo.
   - Image Text: `original`, `clean`, `alternative`.
   - Layouts: `posterRatingsLayout`, `backdropRatingsLayout`.
   - Poster Max Ratings Per Side: 1-20 con default auto.
   - TMDB API Key (Required)
   - MDBList API Key (Required)
4. **Live Preview**: il pannello deve aggiornare l'immagine in tempo reale.
5. **Costruzione URL**: `{base_url}/{type}/{id}.jpg?tmdbKey=...&mdblistKey=...&ratings=...&lang=...&ratingStyle=...&imageText=...`

### AI Integration Prompt

Se stai usando un agente AI (Claude, ChatGPT, ecc.) per sviluppare il tuo addon, copia questo prompt:

```text
Act as an expert addon developer. I want to implement the ERDB Stateless API into my media center addon (e.g., Stremio, Kodi).

API Base URL: (YOUR_DEPLOYED_URL)
Base URL must be entered during configuration and must remain editable (do not hardcode or lock it).

--- FULL API REFERENCE ---

Endpoint: GET /{type}/{id}.jpg?...queryParams

| Parameter               | Values                                                                                                                                               | Default |
|-------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|---------|
| type (path)             | poster, backdrop, logo                                                                                                                               | -       |
| id (path)               | IMDb (tt0133093), TMDB (tmdb:603), Kitsu (kitsu:1), AniList (anilist:id), MAL (myanimelist:id)                                                      | -       |
| ratings                 | tmdb, mdblist, imdb, tomatoes, tomatoesaudience, letterboxd, metacritic, metacriticuser, trakt, rogerebert, myanimelist, anilist, kitsu             | all     |
| lang                    | Any TMDB ISO 639-1 code (en, it, fr, es, de, ja, ko, zh, pt, ru, ar, hi, etc.)                                                                     | en      |
| ratingStyle             | glass, square, plain                                                                                                                                 | glass (poster/backdrop), plain (logo)   |
| imageText               | original, clean, alternative                                                                                                                         | original (poster/logo), clean (backdrop)|
| posterRatingsLayout     | top, bottom, left, right, top-bottom, left-right                                                                                                     | top-bottom |
| posterRatingsMaxPerSide | Number (1-20)                                                                                                                                        | auto    |
| backdropRatingsLayout   | center, right, right-vertical                                                                                                                        | center  |
| tmdbKey (REQUIRED)      | Your TMDB v3 API Key                                                                                                                                 | -       |
| mdblistKey (REQUIRED)   | Your MDBList.com API Key                                                                                                                             | -       |

--- TYPE-SPECIFIC CONFIGS ---
poster:
- imageText: original, clean, alternative
- ratingStyle: glass, square, plain (per-type override)
- posterRatingsLayout: top, bottom, left, right, top-bottom, left-right
- posterRatingsMaxPerSide: 1-20 (auto if omitted)
backdrop:
- imageText: original, clean, alternative
- ratingStyle: glass, square, plain (per-type override)
- backdropRatingsLayout: center, right, right-vertical
logo:
- ratingStyle: glass, square, plain (per-type override)
- no extra layout config (base params only)

--- ID FORMATS ---
| Source          | Format          | Example              |
|-----------------|-----------------|----------------------|
| IMDb            | tt + numbers    | tt0133093            |
| TMDB            | tmdb:id         | tmdb:603             |
| Kitsu           | kitsu:id        | kitsu:1              |
| AniList         | anilist:id      | anilist:123          |
| MyAnimeList     | myanimelist:id  | myanimelist:456      |

--- INTEGRATION REQUIREMENTS ---
1. Create a configuration settings panel for users to customize the imagery.
2. Add a "Setup" button that opens a modal containing the full configuration UI (keep the main page clean).
3. The settings UI MUST be per-type (poster/backdrop/logo). Do NOT use global settings for ratings, lang, style, imageText, or layouts.
   When a user selects a type, show ONLY that type's settings.
4. Global required fields:
   - ERDB API Base URL (Required)
   - TMDB API Key (Required): Users MUST provide their own v3 key.
   - MDBList API Key (Required): Users MUST provide their own key.
5. Per-type settings (each type has its own values):
   - Ratings (Multi-select): All providers from the table above.
   - Language: MUST be a selectable list (dropdown) of TMDB ISO 639-1 codes, not a free text input.
   - Style: glass, square, plain.
   - Image Text: original, clean, alternative.
   - Layouts: posterRatingsLayout, backdropRatingsLayout (with all values from API Reference).
   - Poster Max Ratings Per Side: Number input (1-20) with Auto default (poster only).
6. Live Preview (Crucial): The settings panel MUST include a live image preview that updates instantly as the user changes parameters.
7. Dynamic URL Construction:
  Structure: ${baseUrl}/${type}/${id}.jpg?tmdbKey=${tmdbKey}&mdblistKey=${mdblistKey}&ratings=${ratings}&lang=${lang}&ratingStyle=${style}&imageText=${imageText}&posterRatingsLayout=${layout}&posterRatingsMaxPerSide=${max}&backdropRatingsLayout=${bLayout}

Goal: Generate the logic/code to manage these preferences and inject the generated URLs into the meta responses of the addon.
```

---

© 2026 ERDB Project
