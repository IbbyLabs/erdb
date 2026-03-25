import { spawnSync } from 'node:child_process';

import { loadLocalEnv } from './load-local-env.mjs';

loadLocalEnv();

const RELEASE_GUARD_BYPASS = process.env.ERDB_SKIP_RELEASE_WORKFLOW_GUARD === '1';
const BUILD_WORKFLOW_FILENAME = 'build-and-push-docker.yml';

const level = process.argv[2];
const allowedLevels = new Set(['patch', 'minor', 'major']);

if (!allowedLevels.has(level)) {
  console.error('Usage: npm run release -- <patch|minor|major>');
  process.exit(1);
}

function run(command, args, { stdio = 'inherit' } = {}) {
  const result = spawnSync(command, args, { stdio });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
  return result;
}

function runCapture(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    return null;
  }
  return String(result.stdout || '').trim();
}

function parseGitHubRepositoryFromRemote(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return null;
  }

  const sshMatch = /^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/.exec(trimmed);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  try {
    const url = new URL(trimmed.replace(/^git\+/, ''));
    if (!['github.com', 'www.github.com'].includes(url.hostname.toLowerCase())) {
      return null;
    }
    const [owner, repo] = url.pathname
      .replace(/^\/+/, '')
      .replace(/\/+$/, '')
      .replace(/\.git$/, '')
      .split('/');
    if (!owner || !repo) {
      return null;
    }
    return { owner, repo };
  } catch {
    return null;
  }
}

async function ensureNoActiveDockerReleaseRuns() {
  if (RELEASE_GUARD_BYPASS) {
    return;
  }

  const remoteUrl = runCapture('git', ['config', '--get', 'remote.origin.url']);
  const repository = parseGitHubRepositoryFromRemote(remoteUrl);
  if (!repository) {
    console.error(
      'Release aborted: could not determine the GitHub repository from remote.origin.url. Set ERDB_SKIP_RELEASE_WORKFLOW_GUARD=1 to bypass.'
    );
    process.exit(1);
  }

  const headers = {
    accept: 'application/vnd.github+json',
    'user-agent': 'erdb/release-guard',
  };
  const token =
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    process.env.GITHUB_PAT ||
    process.env.ERDB_GITHUB_TOKEN ||
    '';
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `https://api.github.com/repos/${repository.owner}/${repository.repo}/actions/workflows/${BUILD_WORKFLOW_FILENAME}/runs?per_page=20`,
    { headers }
  ).catch(() => null);

  if (!response?.ok) {
    console.error(
      'Release aborted: could not verify active Docker publish workflows on GitHub. Set ERDB_SKIP_RELEASE_WORKFLOW_GUARD=1 to bypass.'
    );
    process.exit(1);
  }

  const payload = await response.json().catch(() => null);
  const workflowRuns = Array.isArray(payload?.workflow_runs) ? payload.workflow_runs : [];
  const activeRuns = workflowRuns.filter((run) => {
    const status = String(run?.status || '').trim().toLowerCase();
    const headBranch = String(run?.head_branch || '').trim();
    return status && status !== 'completed' && headBranch.startsWith('v');
  });

  if (activeRuns.length === 0) {
    return;
  }

  console.error('Release aborted: Docker publish is still running for:');
  for (const run of activeRuns) {
    const branch = String(run?.head_branch || '').trim() || 'unknown';
    const status = String(run?.status || '').trim() || 'unknown';
    console.error(`- ${branch} (${status})`);
  }
  console.error('Wait for the active Docker workflow to finish, then run the release again.');
  console.error('If you need to bypass this guard, set ERDB_SKIP_RELEASE_WORKFLOW_GUARD=1.');
  process.exit(1);
}

const dirtyCheck = spawnSync('git', ['status', '--porcelain'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
if (dirtyCheck.error) {
  throw dirtyCheck.error;
}
if (dirtyCheck.status !== 0) {
  process.exit(dirtyCheck.status ?? 1);
}
if (String(dirtyCheck.stdout || '').trim()) {
  console.error('Release aborted: working tree is not clean. Commit or stash changes first.');
  process.exit(1);
}

await ensureNoActiveDockerReleaseRuns();

run('npm', ['version', level, '-m', 'chore: release %s']);
run('git', ['push', 'origin', 'HEAD', '--follow-tags']);
