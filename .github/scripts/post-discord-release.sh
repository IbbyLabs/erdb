#!/usr/bin/env bash
set -euo pipefail

: "${GITHUB_TOKEN:?GITHUB_TOKEN is required}"
: "${WEBHOOK_URL:?WEBHOOK_URL is required}"
: "${REPOSITORY:?REPOSITORY is required}"

release_tag="${RELEASE_TAG:-}"
api_url="https://api.github.com/repos/${REPOSITORY}"

if [ -n "${release_tag}" ]; then
  release_endpoint="${api_url}/releases/tags/${release_tag}"
else
  release_endpoint="${api_url}/releases/latest"
fi

release_json="$(
  curl -fsSL \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "${release_endpoint}"
)"

tag_name="$(printf '%s' "${release_json}" | jq -r '.tag_name // empty')"
release_name="$(printf '%s' "${release_json}" | jq -r '.name // .tag_name // "ERDB Release"')"
release_url="$(printf '%s' "${release_json}" | jq -r '.html_url // empty')"
published_at="$(printf '%s' "${release_json}" | jq -r '.published_at // .created_at // empty')"
description="$(printf '%s' "${release_json}" | jq -r '.body // ""' | tr -d '\r')"

if [ -z "${tag_name}" ]; then
  echo "Unable to resolve a release tag from ${release_endpoint}" >&2
  exit 1
fi

if [ -z "${description}" ]; then
  description="New ERDB release published."
fi

max_description_chars=3800
if [ "${#description}" -gt "${max_description_chars}" ]; then
  description="$(printf '%s' "${description}" | head -c "${max_description_chars}")"
  description="${description}"$'\n\n'"Full release notes: ${release_url}"
fi

payload="$(
  jq -n \
    --arg username "ERDB Releases" \
    --arg avatar_url "https://raw.githubusercontent.com/IbbyLabs/erdb/main/public/favicon-96x96.png" \
    --arg title "${release_name}" \
    --arg url "${release_url}" \
    --arg description "${description}" \
    --arg tag_name "${tag_name}" \
    --arg repository "${REPOSITORY}" \
    --arg published_at "${published_at}" \
    '{
      username: $username,
      avatar_url: $avatar_url,
      embeds: [
        ({
          title: $title,
          url: $url,
          description: $description,
          color: 7754499,
          fields: [
            { name: "Tag", value: $tag_name, inline: true },
            { name: "Repository", value: $repository, inline: true }
          ],
          footer: { text: "IbbyLabs ERDB" }
        } + (if $published_at != "" then { timestamp: $published_at } else {} end))
      ]
    }'
)"

curl -fsSL \
  -H "Content-Type: application/json" \
  -d "${payload}" \
  "${WEBHOOK_URL}" >/dev/null

echo "Sent Discord release notification for ${tag_name}"
