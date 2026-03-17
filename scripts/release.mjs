import { spawnSync } from 'node:child_process';

const level = process.argv[2];
const allowedLevels = new Set(['patch', 'minor', 'major']);

if (!allowedLevels.has(level)) {
  console.error('Usage: npm run release -- <patch|minor|major>');
  process.exit(1);
}

const result = spawnSync(
  'npm',
  ['version', level, '-m', 'chore: release %s'],
  { stdio: 'inherit' }
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
