#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  if command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
  else
    echo "sudo not found. Run this script as root."
    exit 1
  fi
else
  SUDO=""
fi

if command -v apt-get >/dev/null 2>&1; then
  $SUDO apt-get update
  $SUDO apt-get install -y fontconfig fonts-dejavu fonts-freefont-ttf fonts-noto-core
elif command -v dnf >/dev/null 2>&1; then
  $SUDO dnf install -y fontconfig dejavu-fonts-all gnu-free-fonts google-noto-sans-fonts google-noto-serif-fonts
elif command -v pacman >/dev/null 2>&1; then
  $SUDO pacman -Sy --needed fontconfig ttf-dejavu gnu-free-fonts noto-fonts
elif command -v apk >/dev/null 2>&1; then
  $SUDO apk add --no-cache fontconfig ttf-dejavu ttf-freefont font-noto
else
  echo "Unsupported distro. Install fontconfig + DejaVu + FreeFont + Noto manually."
  exit 1
fi

$SUDO fc-cache -f
echo "Fonts installed and cache refreshed."
