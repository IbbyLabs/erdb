$ErrorActionPreference = "Stop"

function Test-Command {
  param([string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

if (-not (Test-Command "winget")) {
  Write-Warning "winget not found. Install the App Installer from Microsoft Store, then retry."
  exit 1
}

function Find-WingetId {
  param(
    [string]$Query,
    [string]$IdRegex
  )
  $output = winget search --name $Query --source winget --accept-source-agreements 2>$null
  if (-not $output) { return $null }

  foreach ($line in $output) {
    if ($line -match '^\s*Name\s+Id\s+Version') { continue }
    if ($line -match '^-{3,}') { continue }
    if ($line -match '^\s*(?<Name>.+?)\s{2,}(?<Id>[\w\.\-]+)\s{2,}(?<Version>\S+)\s{2,}(?<Source>\S+)') {
      $name = $Matches['Name']
      $id = $Matches['Id']
      if ([string]::IsNullOrEmpty($IdRegex)) { return $id }
      if ($id -match $IdRegex -or $name -match $IdRegex) { return $id }
    }
  }

  return $null
}

$targets = @(
  @{ Label = "Noto Sans"; Query = "Noto Sans"; IdRegex = "Noto.*Sans" },
  @{ Label = "Noto Serif"; Query = "Noto Serif"; IdRegex = "Noto.*Serif" },
  @{ Label = "DejaVu"; Query = "DejaVu"; IdRegex = "DejaVu|dejavu" },
  @{ Label = "FreeFont"; Query = "FreeFont"; IdRegex = "FreeFont|freefont" }
)

$installedAny = $false
foreach ($t in $targets) {
  Write-Host "Searching for $($t.Label)..."
  $id = Find-WingetId -Query $t.Query -IdRegex $t.IdRegex
  if (-not $id) {
    Write-Warning "No winget package found for $($t.Label)."
    continue
  }

  Write-Host "Installing $($t.Label) ($id)..."
  winget install --id $id --source winget --accept-source-agreements --accept-package-agreements --silent
  if ($LASTEXITCODE -eq 0) {
    $installedAny = $true
  } else {
    Write-Warning "Install failed for $($t.Label) ($id)."
  }
}

if (-not $installedAny) {
  Write-Warning "No fonts installed. You may need to install manually."
  exit 1
}

Write-Host "Fonts installation complete."
