import { timingSafeEqual } from 'node:crypto';

export const ERDB_REQUEST_KEY_ERROR_MESSAGE = 'Missing or invalid ERDB request key.';
export const ERDB_REQUEST_KEY_QUERY_PARAM = 'erdbKey';
export const ERDB_REQUEST_KEY_QUERY_PARAM_LEGACY = 'erdb_key';
export const ERDB_REQUEST_KEY_PLACEHOLDER = '{erdb_key}';

const REQUEST_KEY_HEADER_NAMES = ['x-erdb-key', 'x-api-key'] as const;

export const parseErdbRequestKeyList = (...values: Array<string | undefined>) => {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    for (const candidate of (value || '').split(/[\s,;]+/)) {
      const normalized = candidate.trim();
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      result.push(normalized);
    }
  }

  return result;
};

const safeCompareText = (left: string, right: string) => {
  if (!left || !right || left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(left), Buffer.from(right));
};

export const getConfiguredErdbRequestKeys = () =>
  parseErdbRequestKeyList(process.env.ERDB_REQUEST_API_KEYS, process.env.ERDB_REQUEST_API_KEY);

export const getErdbRequestKeyFromSearchParams = (searchParams: URLSearchParams) => {
  const queryKey =
    searchParams.get(ERDB_REQUEST_KEY_QUERY_PARAM) ||
    searchParams.get(ERDB_REQUEST_KEY_QUERY_PARAM_LEGACY) ||
    '';
  const normalized = queryKey.trim();
  return normalized || null;
};

export const getErdbRequestKeyFromHeaders = (headers: Headers) => {
  for (const headerName of REQUEST_KEY_HEADER_NAMES) {
    const headerValue = headers.get(headerName);
    if (headerValue?.trim()) {
      return headerValue.trim();
    }
  }

  const authorization = headers.get('authorization') || '';
  const bearerMatch = /^\s*Bearer\s+(.+)\s*$/i.exec(authorization);
  const normalized = bearerMatch?.[1]?.trim() || '';
  return normalized || null;
};

export const resolveProvidedErdbRequestKey = ({
  searchParams,
  headers,
  fallbackKey,
}: {
  searchParams: URLSearchParams;
  headers: Headers;
  fallbackKey?: string | null;
}) => {
  return (
    getErdbRequestKeyFromSearchParams(searchParams) ||
    getErdbRequestKeyFromHeaders(headers) ||
    fallbackKey?.trim() ||
    null
  );
};

export const isErdbRequestAuthorized = ({
  configuredKeys,
  searchParams,
  headers,
  fallbackKey,
}: {
  configuredKeys: string[];
  searchParams: URLSearchParams;
  headers: Headers;
  fallbackKey?: string | null;
}) => {
  if (configuredKeys.length === 0) {
    return true;
  }

  const providedKey = resolveProvidedErdbRequestKey({ searchParams, headers, fallbackKey });
  if (!providedKey) {
    return false;
  }

  return configuredKeys.some((configuredKey) => safeCompareText(providedKey, configuredKey));
};
