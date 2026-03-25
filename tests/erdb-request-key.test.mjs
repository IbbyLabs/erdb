import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ERDB_REQUEST_KEY_QUERY_PARAM,
  ERDB_REQUEST_KEY_QUERY_PARAM_LEGACY,
  getErdbRequestKeyFromHeaders,
  getErdbRequestKeyFromSearchParams,
  isErdbRequestAuthorized,
  parseErdbRequestKeyList,
  resolveProvidedErdbRequestKey,
} from '../lib/erdbRequestKey.ts';

test('parseErdbRequestKeyList normalizes separators and removes duplicates', () => {
  assert.deepEqual(
    parseErdbRequestKeyList('  alpha, beta ; gamma', 'beta delta', undefined, 'alpha'),
    ['alpha', 'beta', 'gamma', 'delta'],
  );
});

test('getErdbRequestKeyFromSearchParams reads primary and legacy query params', () => {
  const primary = new URLSearchParams(`${ERDB_REQUEST_KEY_QUERY_PARAM}=primary-key`);
  const legacy = new URLSearchParams(`${ERDB_REQUEST_KEY_QUERY_PARAM_LEGACY}=legacy-key`);

  assert.equal(getErdbRequestKeyFromSearchParams(primary), 'primary-key');
  assert.equal(getErdbRequestKeyFromSearchParams(legacy), 'legacy-key');
});

test('getErdbRequestKeyFromHeaders reads explicit headers and bearer auth', () => {
  assert.equal(getErdbRequestKeyFromHeaders(new Headers({ 'x-erdb-key': 'header-key' })), 'header-key');
  assert.equal(getErdbRequestKeyFromHeaders(new Headers({ 'x-api-key': 'api-key' })), 'api-key');
  assert.equal(
    getErdbRequestKeyFromHeaders(new Headers({ authorization: 'Bearer bearer-key' })),
    'bearer-key',
  );
});

test('resolveProvidedErdbRequestKey falls back from query to headers to embedded config', () => {
  assert.equal(
    resolveProvidedErdbRequestKey({
      searchParams: new URLSearchParams(`${ERDB_REQUEST_KEY_QUERY_PARAM}=query-key`),
      headers: new Headers({ 'x-erdb-key': 'header-key' }),
      fallbackKey: 'embedded-key',
    }),
    'query-key',
  );

  assert.equal(
    resolveProvidedErdbRequestKey({
      searchParams: new URLSearchParams(),
      headers: new Headers({ 'x-erdb-key': 'header-key' }),
      fallbackKey: 'embedded-key',
    }),
    'header-key',
  );

  assert.equal(
    resolveProvidedErdbRequestKey({
      searchParams: new URLSearchParams(),
      headers: new Headers(),
      fallbackKey: 'embedded-key',
    }),
    'embedded-key',
  );
});

test('isErdbRequestAuthorized bypasses checks when no keys are configured', () => {
  assert.equal(
    isErdbRequestAuthorized({
      configuredKeys: [],
      searchParams: new URLSearchParams(),
      headers: new Headers(),
    }),
    true,
  );
});

test('isErdbRequestAuthorized accepts matching keys from query header and fallback config', () => {
  const configuredKeys = ['match-me'];

  assert.equal(
    isErdbRequestAuthorized({
      configuredKeys,
      searchParams: new URLSearchParams(`${ERDB_REQUEST_KEY_QUERY_PARAM}=match-me`),
      headers: new Headers(),
    }),
    true,
  );

  assert.equal(
    isErdbRequestAuthorized({
      configuredKeys,
      searchParams: new URLSearchParams(),
      headers: new Headers({ authorization: 'Bearer match-me' }),
    }),
    true,
  );

  assert.equal(
    isErdbRequestAuthorized({
      configuredKeys,
      searchParams: new URLSearchParams(),
      headers: new Headers(),
      fallbackKey: 'match-me',
    }),
    true,
  );
});

test('isErdbRequestAuthorized rejects missing or incorrect keys', () => {
  const configuredKeys = ['match-me'];

  assert.equal(
    isErdbRequestAuthorized({
      configuredKeys,
      searchParams: new URLSearchParams(),
      headers: new Headers(),
    }),
    false,
  );

  assert.equal(
    isErdbRequestAuthorized({
      configuredKeys,
      searchParams: new URLSearchParams(`${ERDB_REQUEST_KEY_QUERY_PARAM}=wrong-key`),
      headers: new Headers(),
    }),
    false,
  );
});
