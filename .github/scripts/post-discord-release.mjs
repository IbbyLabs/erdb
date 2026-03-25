#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

import {
  selectLatestPublishedReleaseEntry,
  selectPreviousPublishedReleaseTag,
} from '../../lib/githubRelease.ts';

const DISCORD_EMBED_COLOR = 0x7c3aed;
const MAX_RELEASE_LOOKUP_ATTEMPTS = Number(process.env.RELEASE_LOOKUP_ATTEMPTS || 5);
const RELEASE_LOOKUP_DELAY_SECONDS = Number(process.env.RELEASE_LOOKUP_DELAY_SECONDS || 2);
const AVATAR_URL = 'https://raw.githubusercontent.com/IbbyLabs/erdb/main/public/favicon-96x96.png';

function requireEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function stripMarkdown(value) {
  return String(value || '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function trimField(value, maxLength = 1024) {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function normalizeSectionTitle(value) {
  const normalized = stripMarkdown(value).replace(/[:]+$/g, '');
  if (!normalized) {
    return '';
  }

  const aliases = new Map([
    ['bug fixes', 'Fixed'],
    ['fixes', 'Fixed'],
    ['added', 'Added'],
    ['new', 'Added'],
    ['changed', 'Changed'],
    ['changes', 'Changed'],
    ['other changes', 'Other Changes'],
    ['improved', 'Improved'],
    ['improvements', 'Improved'],
    ['security', 'Security'],
  ]);

  return aliases.get(normalized.toLowerCase()) || normalized;
}

function parseReleaseBodySections(body) {
  const sections = [];
  const intro = [];
  let currentSection = null;

  const ensureSection = (title) => {
    const normalizedTitle = normalizeSectionTitle(title);
    if (!normalizedTitle) {
      return null;
    }

    const existing = sections.find((section) => section.title === normalizedTitle);
    if (existing) {
      return existing;
    }

    const next = { title: normalizedTitle, items: [] };
    sections.push(next);
    return next;
  };

  for (const rawLine of String(body || '').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (line.startsWith('[!') || /^>/.test(line) || /^changelog:/i.test(line)) {
      continue;
    }

    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      currentSection = ensureSection(headingMatch[1]);
      continue;
    }

    const bulletMatch = line.match(/^[-*]\s+(.+)$/) || line.match(/^\d+\.\s+(.+)$/);
    if (bulletMatch) {
      const item = stripMarkdown(bulletMatch[1]);
      if (!item) {
        continue;
      }
      if (currentSection) {
        currentSection.items.push(item);
      } else {
        intro.push(item);
      }
      continue;
    }

    const plainText = stripMarkdown(line);
    if (!plainText) {
      continue;
    }

    if (currentSection) {
      currentSection.items.push(plainText);
    } else {
      intro.push(plainText);
    }
  }

  return {
    intro: trimField(intro.join(' '), 320),
    sections: sections.filter((section) => section.items.length > 0),
  };
}

function buildSectionFields(body) {
  const { intro, sections } = parseReleaseBodySections(body);
  const fields = [];

  if (intro) {
    fields.push({
      name: 'Summary',
      value: intro,
      inline: false,
    });
  }

  for (const section of sections.slice(0, 3)) {
    const bullets = [];
    let remaining = 4;
    for (const item of section.items) {
      if (remaining <= 0) {
        break;
      }
      bullets.push(`• ${item}`);
      remaining -= 1;
    }

    if (section.items.length > bullets.length) {
      bullets.push(`• ${section.items.length - bullets.length} more`);
    }

    const value = trimField(bullets.join('\n'));
    if (value) {
      fields.push({
        name: section.title,
        value,
        inline: false,
      });
    }
  }

  if (!fields.length) {
    fields.push({
      name: 'Summary',
      value: 'New ERDB release published.',
      inline: false,
    });
  }

  return fields;
}

function resolveCompareUrl(repository, currentTag, previousTag) {
  if (!previousTag) {
    return '';
  }

  return `https://github.com/${repository}/compare/${previousTag}...${currentTag}`;
}

function resolvePackageUrl(repository) {
  const [, repoName = 'erdb'] = repository.split('/');
  return `https://github.com/${repository}/pkgs/container/${repoName}`;
}

function buildLinksField({ releaseUrl, compareUrl, repositoryUrl, packageUrl }) {
  const lines = [];
  if (releaseUrl) {
    lines.push(`[Release notes](${releaseUrl})`);
  }
  if (compareUrl) {
    lines.push(`[Full compare](${compareUrl})`);
  }
  if (packageUrl) {
    lines.push(`[Container package](${packageUrl})`);
  }
  if (repositoryUrl) {
    lines.push(`[Repository](${repositoryUrl})`);
  }

  return trimField(lines.join('\n'));
}

export function buildDiscordReleasePayload({
  repository,
  release,
  previousReleaseTag = '',
}) {
  const repositoryUrl = `https://github.com/${repository}`;
  const compareUrl = resolveCompareUrl(repository, release.tag_name, previousReleaseTag);
  const packageUrl = resolvePackageUrl(repository);
  const publishedAt = String(release.published_at || release.created_at || '').trim();
  const publishedTimestamp = Number.isFinite(Date.parse(publishedAt))
    ? Math.floor(Date.parse(publishedAt) / 1000)
    : null;

  const fields = [
    {
      name: 'Tag',
      value: `\`${release.tag_name}\``,
      inline: true,
    },
    {
      name: 'Published',
      value: publishedTimestamp
        ? `<t:${publishedTimestamp}:F>\n<t:${publishedTimestamp}:R>`
        : 'Unknown',
      inline: true,
    },
    {
      name: 'Links',
      value: buildLinksField({
        releaseUrl: release.html_url,
        compareUrl,
        repositoryUrl,
        packageUrl,
      }),
      inline: true,
    },
    ...buildSectionFields(release.body || ''),
  ].filter((field) => field.value);

  return {
    username: 'ERDB Releases',
    avatar_url: AVATAR_URL,
    allowed_mentions: { parse: [] },
    embeds: [
      {
        author: {
          name: 'Easy Ratings Database',
          url: repositoryUrl,
          icon_url: AVATAR_URL,
        },
        title: release.name || release.tag_name || 'ERDB Release',
        url: release.html_url || repositoryUrl,
        description: `New ERDB release published for \`${release.tag_name}\`.`,
        color: DISCORD_EMBED_COLOR,
        thumbnail: {
          url: AVATAR_URL,
        },
        fields,
        footer: {
          text: `${repository} • release`,
          icon_url: AVATAR_URL,
        },
        ...(publishedAt ? { timestamp: publishedAt } : {}),
      },
    ],
  };
}

async function fetchJson(url, token) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'erdb/discord-release',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub request failed with ${response.status} for ${url}`);
  }

  return response.json();
}

async function lookupRelease({ apiUrl, releaseTag, token }) {
  const endpoint = releaseTag
    ? `${apiUrl}/releases/tags/${encodeURIComponent(releaseTag)}`
    : `${apiUrl}/releases?per_page=100`;

  let lastError = null;
  for (let attempt = 1; attempt <= MAX_RELEASE_LOOKUP_ATTEMPTS; attempt += 1) {
    try {
      const payload = await fetchJson(endpoint, token);
      if (releaseTag) {
        return payload;
      }

      const release = Array.isArray(payload) ? selectLatestPublishedReleaseEntry(payload) : null;
      if (release) {
        return release;
      }

      throw new Error('Unable to resolve the highest published release tag from GitHub');
    } catch (error) {
      lastError = error;
      if (attempt === MAX_RELEASE_LOOKUP_ATTEMPTS) {
        break;
      }
      console.error(
        `Release lookup attempt ${attempt}/${MAX_RELEASE_LOOKUP_ATTEMPTS} failed. Retrying in ${RELEASE_LOOKUP_DELAY_SECONDS}s.`
      );
      await new Promise((resolve) => setTimeout(resolve, RELEASE_LOOKUP_DELAY_SECONDS * 1000));
    }
  }

  throw lastError || new Error(`Unable to fetch release details from ${endpoint}`);
}

async function resolvePreviousPublishedReleaseTag({ apiUrl, token, currentTag }) {
  try {
    const releases = await fetchJson(`${apiUrl}/releases?per_page=20`, token);
    if (!Array.isArray(releases)) {
      return '';
    }

    return selectPreviousPublishedReleaseTag(releases, currentTag);
  } catch {
    return '';
  }
}

async function postToDiscord(webhookUrl, payload) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`Discord webhook failed with ${response.status}${details ? `: ${details}` : ''}`);
  }
}

export async function main() {
  const token = requireEnv('GITHUB_TOKEN');
  const webhookUrl = requireEnv('WEBHOOK_URL');
  const repository = requireEnv('REPOSITORY');
  const releaseTag = String(process.env.RELEASE_TAG || '').trim();
  const apiUrl = `https://api.github.com/repos/${repository}`;

  const release = await lookupRelease({ apiUrl, releaseTag, token });
  const currentTag = String(release.tag_name || '').trim();
  if (!currentTag) {
    throw new Error('Unable to resolve a release tag from GitHub');
  }

  const previousReleaseTag = await resolvePreviousPublishedReleaseTag({
    apiUrl,
    token,
    currentTag,
  });

  const payload = buildDiscordReleasePayload({
    repository,
    release,
    previousReleaseTag,
  });

  await postToDiscord(webhookUrl, payload);

  console.log(`Sent Discord release notification for ${currentTag}`);
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
