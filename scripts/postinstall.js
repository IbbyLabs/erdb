const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');

if (process.env.ERDB_SKIP_FONT_INSTALL === '1' || process.env.CI === 'true') {
  process.exit(0);
}

if (process.platform === 'linux') {
  const scriptPath = path.join(__dirname, 'install-fonts-linux.sh');
  if (!existsSync(scriptPath)) {
    console.log('[postinstall] fonts script not found, skipping.');
    process.exit(0);
  }

  console.log('[postinstall] Installing system fonts for Linux (requires sudo).');
  const result = spawnSync('bash', [scriptPath], { stdio: 'inherit' });
  if (result.status !== 0) {
    console.warn('[postinstall] Font installation failed. You can rerun: npm run fonts:install');
  }
  process.exit(0);
}

if (process.platform === 'win32') {
  const scriptPath = path.join(__dirname, 'install-fonts-windows.ps1');
  if (!existsSync(scriptPath)) {
    console.log('[postinstall] fonts script not found, skipping.');
    process.exit(0);
  }

  console.log('[postinstall] Installing system fonts for Windows (may require admin).');
  const result = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath], {
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    console.warn('[postinstall] Font installation failed. You can rerun: npm run fonts:install:win');
  }
  process.exit(0);
}

process.exit(0);
