import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const COMMIT_LIMIT = 120;
const ALLOWED_TYPES = new Set([
  'feat',
  'fix',
  'chore',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'style',
  'revert',
]);

const prettyFormat = '%H%x1f%h%x1f%cI%x1f%s%x1f%b%x1e';
const output = execSync(`git log -n ${COMMIT_LIMIT} --date=iso-strict --pretty=format:${prettyFormat}`, {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
});

const commitRecords = output
  .split('\x1e')
  .map((entry) => entry.trim())
  .filter(Boolean)
  .map((entry) => {
    const [hash, shortHash, date, subject, body] = entry.split('\x1f');
    const normalizedSubject = String(subject || '').trim();
    const normalizedBody = String(body || '').trim() || null;

    const conventionalMatch = normalizedSubject.match(/^([a-z]+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/i);
    const typeRaw = conventionalMatch ? conventionalMatch[1].toLowerCase() : 'chore';
    const type = ALLOWED_TYPES.has(typeRaw) ? typeRaw : 'chore';
    const title = conventionalMatch ? conventionalMatch[4].trim() : normalizedSubject;

    return {
      hash: String(hash || '').trim(),
      shortHash: String(shortHash || '').trim(),
      date: String(date || '').trim(),
      type,
      title,
      body: normalizedBody,
    };
  })
  .filter((entry) => entry.hash && entry.shortHash && entry.date && entry.title);

const payload = {
  generatedAt: new Date().toISOString(),
  total: commitRecords.length,
  commits: commitRecords,
};

const outputPath = resolve(process.cwd(), 'public', 'commits.json');
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`Wrote ${commitRecords.length} commits to ${outputPath}`);
