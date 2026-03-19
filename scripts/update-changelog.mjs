import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const pkgPath = path.resolve('package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const newVersion = `v${pkg.version}`;
const today = new Date().toLocaleDateString('en-GB');

function lastTag() {
  try {
    return execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function getCommitsSince(tag) {
  const range = tag ? `${tag}..HEAD` : 'HEAD';
  try {
    return execSync(`git log ${range} --oneline --no-merges`, { encoding: 'utf8' })
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

const prevTag = lastTag();

// If the version hasn't changed or already exists in the changelog, skip (manual check)
const existingChangelog = fs.readFileSync('CHANGELOG.md', 'utf8');
if (existingChangelog.includes(`## [${newVersion}]`)) {
  console.log(`Changelog already contains entry for ${newVersion}. Skipping.`);
  process.exit(0);
}

const commits = getCommitsSince(prevTag);
if (commits.length === 0) {
  console.log('No new commits since last tag. Skipping changelog update.');
  process.exit(0);
}

const groups = {
  feat: [],
  fix: [],
  docs: [],
  refactor: [],
  perf: [],
  chore: [],
  other: []
};

for (const commit of commits) {
  const message = commit.split(' ').slice(1).join(' ');
  const lower = message.toLowerCase();
  
  // Filter out redundant release commits and synchronization chores
  if (lower.startsWith('chore: release') || lower.includes('synchronize with upstream')) {
    continue;
  }

  if (lower.startsWith('feat')) groups.feat.push(message);
  else if (lower.startsWith('fix')) groups.fix.push(message);
  else if (lower.startsWith('docs')) groups.docs.push(message);
  else if (lower.startsWith('refactor')) groups.refactor.push(message);
  else if (lower.startsWith('perf')) groups.perf.push(message);
  else if (lower.startsWith('chore')) groups.chore.push(message);
  else groups.other.push(message);
}

let newEntry = `## [${newVersion}] - ${today}\n\n`;

if (groups.feat.length) {
  newEntry += `### Added\n${groups.feat.map(m => `- ${m}`).join('\n')}\n\n`;
}
if (groups.fix.length) {
  newEntry += `### Fixed\n${groups.fix.map(m => `- ${m}`).join('\n')}\n\n`;
}
if (groups.docs.length) {
  newEntry += `### Documentation\n${groups.docs.map(m => `- ${m}`).join('\n')}\n\n`;
}
if (groups.perf.length) {
  newEntry += `### Performance\n${groups.perf.map(m => `- ${m}`).join('\n')}\n\n`;
}

const otherChanges = [...groups.other, ...groups.refactor, ...groups.chore];
if (otherChanges.length) {
  newEntry += `### Other Changes\n${otherChanges.map(m => `- ${m}`).join('\n')}\n\n`;
}

const lines = existingChangelog.split('\n');
const headerEndIndex = lines.findIndex(line => line.startsWith('## ['));
const header = lines.slice(0, headerEndIndex).join('\n');
const rest = lines.slice(headerEndIndex).join('\n');

const updatedChangelog = `${header}${newEntry}${rest}`;
fs.writeFileSync('CHANGELOG.md', updatedChangelog);

console.log(`Updated CHANGELOG.md with ${newVersion} changes.`);
