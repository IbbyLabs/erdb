import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getRebuildCommand,
  isNativeAbiMismatch,
} from '../scripts/ensure-native-deps.mjs';

test('detects better-sqlite3 ABI mismatch output', () => {
  const output = [
    "Error: The module '/tmp/better_sqlite3.node'",
    'was compiled against a different Node.js version using',
    'NODE_MODULE_VERSION 137.',
    'Please try re-compiling or re-installing better-sqlite3.',
  ].join('\n');

  assert.equal(isNativeAbiMismatch(output), true);
});

test('ignores unrelated native load failures', () => {
  const output = [
    "Error: Cannot find module 'sharp'",
    'Require stack:',
    '- /tmp/test.js',
  ].join('\n');

  assert.equal(isNativeAbiMismatch(output), false);
});

test('uses pnpm rebuild when scripts run under pnpm', () => {
  assert.deepEqual(
    getRebuildCommand({
      userAgent: 'pnpm/10.32.1 npm/? node/v22.7.0 darwin arm64',
    }),
    {
      command: 'pnpm',
      args: ['rebuild', 'better-sqlite3'],
    },
  );
});

test('defaults to npm rebuild outside pnpm', () => {
  assert.deepEqual(
    getRebuildCommand({
      userAgent: 'npm/10.8.2 node/v22.7.0 darwin arm64 workspaces/false',
    }),
    {
      command: 'npm',
      args: ['rebuild', 'better-sqlite3'],
    },
  );
});
