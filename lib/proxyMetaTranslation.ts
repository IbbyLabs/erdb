export type TmdbMediaType = 'movie' | 'tv';

export type TmdbTranslationTarget = {
  id: number;
  type: TmdbMediaType;
  details: Record<string, unknown>;
};

const TITLE_FIELD_KEYS = ['name', 'title'] as const;
const OVERVIEW_FIELD_KEYS = ['description', 'overview', 'plot', 'synopsis'] as const;

type AnimeMappingProvider = 'mal' | 'anilist' | 'kitsu' | 'anidb';
type AnimeMappingLookup = {
  provider: AnimeMappingProvider;
  externalId: string;
  season: string | null;
};
type JsonFetcher = (url: string) => Promise<unknown>;

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const ANIME_MAPPING_BASE_URL = 'https://animemapping.stremio.dpdns.org';
const IMDB_RE = /^tt\d+$/i;
const ANIME_MAPPING_PROVIDER_SET = new Set<AnimeMappingProvider>(['mal', 'anilist', 'kitsu', 'anidb']);

const toNonEmptyString = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized || null;
};

const PLACEHOLDER_TEXT_SET = new Set(['-', '--', 'n/a', 'na', 'none', 'null', 'undefined', 'unknown', 'tbd']);

const hasMeaningfulText = (value: unknown) => {
  const normalized = toNonEmptyString(value);
  if (!normalized) return false;
  return !PLACEHOLDER_TEXT_SET.has(normalized.toLowerCase());
};

export const mergeTranslatedTextFields = (
  target: Record<string, unknown>,
  translatedTitle: string | null,
  translatedOverview: string | null,
) => {
  if (translatedTitle) {
    const hasExistingTitle = TITLE_FIELD_KEYS.some((key) => hasMeaningfulText(target[key]));
    if (!hasExistingTitle) {
      target.name = translatedTitle;
    }
  }

  if (translatedOverview) {
    const hasExistingOverview = OVERVIEW_FIELD_KEYS.some((key) => hasMeaningfulText(target[key]));
    if (!hasExistingOverview) {
      target.description = translatedOverview;
    }
  }

  return target;
};

const normalizeTmdbId = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const asInt = Math.trunc(value);
    return asInt > 0 ? asInt : null;
  }

  const normalized = toNonEmptyString(value);
  if (!normalized) return null;

  const match = normalized.match(/\d+/);
  if (!match) return null;

  const asInt = Number(match[0]);
  return Number.isFinite(asInt) && asInt > 0 ? asInt : null;
};

export const normalizeStremioType = (value: unknown): TmdbMediaType | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === 'movie' || normalized === 'film') return 'movie';
  if (normalized === 'series' || normalized === 'tv' || normalized === 'show') return 'tv';
  return null;
};

const buildPreferredTypeOrder = (preferredType: TmdbMediaType | null): TmdbMediaType[] => {
  if (preferredType === 'movie') return ['movie', 'tv'];
  if (preferredType === 'tv') return ['tv', 'movie'];
  return ['movie', 'tv'];
};

const extractAnimeSubtypeFromMapping = (payload: any) => {
  const candidates = [
    payload?.requested?.subtype,
    payload?.subtype,
    payload?.kitsu?.subtype,
    payload?.mappings?.subtype,
    payload?.data?.requested?.subtype,
    payload?.data?.subtype,
    payload?.data?.kitsu?.subtype,
    payload?.data?.mappings?.subtype,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    const normalized = candidate.trim().toLowerCase();
    if (normalized) return normalized;
  }

  return null;
};

const getAnimeMappingTypeOrder = (metaType: unknown, payload: any): TmdbMediaType[] => {
  const stremioType = normalizeStremioType(metaType);
  if (stremioType) return buildPreferredTypeOrder(stremioType);

  return extractAnimeSubtypeFromMapping(payload) === 'movie' ? ['movie', 'tv'] : ['tv', 'movie'];
};

const extractTmdbIdFromAnimeMapping = (payload: any) => {
  const candidates = [
    payload?.mappings?.ids?.tmdb,
    payload?.data?.mappings?.ids?.tmdb,
  ];

  for (const candidate of candidates) {
    const tmdbId = normalizeTmdbId(candidate);
    if (tmdbId) return tmdbId;
  }

  return null;
};

const parseAnimeMappingLookup = (erdbId: string): AnimeMappingLookup | null => {
  const parts = erdbId.split(':');
  const rawPrefix = (parts[0] || '').trim().toLowerCase();
  const prefix = rawPrefix === 'myanimelist' ? 'mal' : rawPrefix;
  if (!ANIME_MAPPING_PROVIDER_SET.has(prefix as AnimeMappingProvider)) {
    return null;
  }

  const externalId = toNonEmptyString(parts[1]);
  if (!externalId) return null;

  return {
    provider: prefix as AnimeMappingProvider,
    externalId,
    season: prefix === 'kitsu' ? null : toNonEmptyString(parts[2]),
  };
};

const buildTmdbDetailsUrl = (
  tmdbId: number,
  type: TmdbMediaType,
  tmdbKey: string,
  lang: string | null,
) => {
  const url = new URL(`${TMDB_BASE_URL}/${type}/${tmdbId}`);
  url.searchParams.set('api_key', tmdbKey);
  if (lang) {
    url.searchParams.set('language', lang);
  }
  return url.toString();
};

const resolveDetailsForTypes = async ({
  tmdbId,
  candidateTypes,
  tmdbKey,
  lang,
  fetchTmdbJson,
}: {
  tmdbId: number;
  candidateTypes: TmdbMediaType[];
  tmdbKey: string;
  lang: string | null;
  fetchTmdbJson: JsonFetcher;
}): Promise<TmdbTranslationTarget | null> => {
  for (const type of candidateTypes) {
    const details = await fetchTmdbJson(buildTmdbDetailsUrl(tmdbId, type, tmdbKey, lang));
    if (!details || typeof details !== 'object' || Array.isArray(details)) continue;
    return { id: tmdbId, type, details: details as Record<string, unknown> };
  }

  return null;
};

export const resolveTmdbTranslationTarget = async ({
  erdbId,
  metaType,
  tmdbKey,
  lang,
  fetchTmdbJson,
  fetchAnimeMappingJson,
}: {
  erdbId: string;
  metaType: unknown;
  tmdbKey: string;
  lang: string | null;
  fetchTmdbJson: JsonFetcher;
  fetchAnimeMappingJson: JsonFetcher;
}): Promise<TmdbTranslationTarget | null> => {
  if (!erdbId) return null;

  const stremioType = normalizeStremioType(metaType);

  if (erdbId.startsWith('tmdb:')) {
    const parts = erdbId.split(':');
    const explicitTypeCandidate = (parts[1] || '').trim().toLowerCase();
    if ((explicitTypeCandidate === 'movie' || explicitTypeCandidate === 'tv') && parts.length >= 3) {
      const tmdbId = normalizeTmdbId(parts[2]);
      if (tmdbId) {
        return resolveDetailsForTypes({
          tmdbId,
          candidateTypes: [explicitTypeCandidate as TmdbMediaType],
          tmdbKey,
          lang,
          fetchTmdbJson,
        });
      }
    }

    const tmdbId = normalizeTmdbId(parts[1]);
    if (!tmdbId) return null;

    return resolveDetailsForTypes({
      tmdbId,
      candidateTypes: buildPreferredTypeOrder(stremioType),
      tmdbKey,
      lang,
      fetchTmdbJson,
    });
  }

  if (IMDB_RE.test(erdbId)) {
    const findUrl = new URL(`${TMDB_BASE_URL}/find/${encodeURIComponent(erdbId)}`);
    findUrl.searchParams.set('api_key', tmdbKey);
    findUrl.searchParams.set('external_source', 'imdb_id');
    if (lang) {
      findUrl.searchParams.set('language', lang);
    }

    const data = await fetchTmdbJson(findUrl.toString());
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;

    const movieResults = Array.isArray((data as any).movie_results) ? (data as any).movie_results : [];
    const tvResults = Array.isArray((data as any).tv_results) ? (data as any).tv_results : [];
    const movieId = normalizeTmdbId(movieResults[0]?.id);
    const tvId = normalizeTmdbId(tvResults[0]?.id);

    const candidateRefs: Array<{ id: number | null; type: TmdbMediaType }> =
      stremioType === 'movie'
        ? [
            { id: movieId, type: 'movie' },
            { id: tvId, type: 'tv' },
          ]
        : stremioType === 'tv'
          ? [
              { id: tvId, type: 'tv' },
              { id: movieId, type: 'movie' },
            ]
          : [
              { id: movieId, type: 'movie' },
              { id: tvId, type: 'tv' },
            ];

    for (const candidateRef of candidateRefs) {
      if (!candidateRef.id) continue;
      const resolved = await resolveDetailsForTypes({
        tmdbId: candidateRef.id,
        candidateTypes: [candidateRef.type],
        tmdbKey,
        lang,
        fetchTmdbJson,
      });
      if (resolved) return resolved;
    }

    return null;
  }

  const animeLookup = parseAnimeMappingLookup(erdbId);
  if (!animeLookup) return null;

  const mappingUrl = new URL(
    `${ANIME_MAPPING_BASE_URL}/${animeLookup.provider}/${encodeURIComponent(animeLookup.externalId)}`,
  );
  if (animeLookup.season) {
    mappingUrl.searchParams.set('s', animeLookup.season);
  }

  const mappingData = await fetchAnimeMappingJson(mappingUrl.toString());
  if (!mappingData || typeof mappingData !== 'object' || Array.isArray(mappingData)) return null;
  if ((mappingData as any).ok === false) return null;

  const tmdbId = extractTmdbIdFromAnimeMapping(mappingData);
  if (!tmdbId) return null;

  return resolveDetailsForTypes({
    tmdbId,
    candidateTypes: getAnimeMappingTypeOrder(metaType, mappingData),
    tmdbKey,
    lang,
    fetchTmdbJson,
  });
};
