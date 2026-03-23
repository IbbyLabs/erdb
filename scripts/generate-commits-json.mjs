import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { normalizeCommitForDisplay } from './commit-display-utils.mjs';

const COMMIT_LIMIT = 120;
const prettyFormat = '%H%x1f%h%x1f%an%x1f%ae%x1f%cI%x1f%s%x1f%b%x1e';
const output = execSync(`git log --first-parent -n ${COMMIT_LIMIT} --date=iso-strict --pretty=format:${prettyFormat}`, {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
});

const commitRecords = output
  .split('\x1e')
  .map((entry) => entry.trim())
  .filter(Boolean)
  .map((entry) => {
    const [hash, shortHash, authorName, authorEmail, date, subject, body] = entry.split('\x1f');
    const normalized = normalizeCommitForDisplay({
      hash,
      subject,
      body,
    });

    const isUpstream = authorName !== 'IbbyLabs' && !authorEmail.includes('IbbyLabs');

    return {
      hash: String(hash || '').trim(),
      shortHash: String(shortHash || '').trim(),
      author: {
        name: authorName,
        email: authorEmail,
      },
      isUpstream,
      date: String(date || '').trim(),
      type: normalized.type,
      title: normalized.title,
      body: normalized.body,
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
