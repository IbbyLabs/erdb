$ErrorActionPreference = "Stop"

function Get-FontFamilyName {
  param([string]$FontPath)
  try {
    Add-Type -AssemblyName System.Drawing -ErrorAction Stop
    $pfc = New-Object System.Drawing.Text.PrivateFontCollection
    $pfc.AddFontFile($FontPath)
    if ($pfc.Families.Length -gt 0) {
      return $pfc.Families[0].Name
    }
  } catch {
    # Fallback to filename if parsing fails
  }
  return [System.IO.Path]::GetFileNameWithoutExtension($FontPath)
}

function Install-FontFile {
  param([string]$FontPath)
  if (-not $script:installedHashes) {
    $script:installedHashes = @{}
  }
  try {
    $hash = (Get-FileHash -Path $FontPath -Algorithm SHA256).Hash
    if ($script:installedHashes.ContainsKey($hash)) {
      Write-Host "Skipping duplicate font file: $(Split-Path $FontPath -Leaf)"
      return
    }
    $script:installedHashes[$hash] = $true
  } catch {
    # If hashing fails, continue without dedupe
  }
  $fontsDir = Join-Path $env:LOCALAPPDATA "Microsoft\Windows\Fonts"
  if (-not (Test-Path $fontsDir)) {
    New-Item -ItemType Directory -Path $fontsDir | Out-Null
  }
  $dest = Join-Path $fontsDir (Split-Path $FontPath -Leaf)
  Copy-Item $FontPath $dest -Force

  $family = Get-FontFamilyName -FontPath $dest
  $ext = [System.IO.Path]::GetExtension($dest).ToLowerInvariant()
  $fontType = if ($ext -eq ".otf") { "OpenType" } else { "TrueType" }
  $regPath = "HKCU:\Software\Microsoft\Windows NT\CurrentVersion\Fonts"
  $valueName = "$family ($fontType)"
  Set-ItemProperty -Path $regPath -Name $valueName -Value (Split-Path $dest -Leaf)
  $script:installedAny = $true
}

function Download-FirstAvailable {
  param(
    [string[]]$Urls,
    [string]$OutPath
  )
  foreach ($u in $Urls) {
    try {
      Invoke-WebRequest -Uri $u -OutFile $OutPath -UseBasicParsing
      $size = (Get-Item $OutPath).Length
      if ($size -ge 10240) {
        return $u
      }
      Remove-Item $OutPath -Force -ErrorAction SilentlyContinue
    } catch {
      # try next
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
$installedAny = $false
if ($env:ERDB_FONT_DOWNLOAD -eq "0") {
  Write-Warning "Font download disabled (ERDB_FONT_DOWNLOAD=0)."
  exit 1
}

Write-Host "Downloading fonts directly..."
  $downloadTargets = @(
    @{
      Label = "Noto Sans"
      Files = @(
        @{
          Name = "NotoSans-Regular.ttf"
          Urls = @(
            "https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/static/NotoSans-Regular.ttf",
            "https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/NotoSans[wdth,wght].ttf",
            "https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/NotoSans-VariableFont_wdth,wght.ttf"
          )
        },
        @{
          Name = "NotoSans-Bold.ttf"
          Urls = @(
            "https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/static/NotoSans-Bold.ttf",
            "https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/NotoSans[wdth,wght].ttf",
            "https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/NotoSans-VariableFont_wdth,wght.ttf"
          )
        }
      )
    },
    @{
      Label = "Noto Serif"
      Files = @(
        @{
          Name = "NotoSerif-Regular.ttf"
          Urls = @(
            "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserif/static/NotoSerif-Regular.ttf",
            "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserif/NotoSerif[wght].ttf",
            "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserif/NotoSerif[wdth,wght].ttf",
            "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserif/NotoSerif-VariableFont_wght.ttf",
            "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserif/NotoSerif-VariableFont_wdth,wght.ttf"
          )
        },
        @{
          Name = "NotoSerif-Bold.ttf"
          Urls = @(
            "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserif/static/NotoSerif-Bold.ttf",
            "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserif/NotoSerif[wght].ttf",
            "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserif/NotoSerif[wdth,wght].ttf",
            "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserif/NotoSerif-VariableFont_wght.ttf",
            "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserif/NotoSerif-VariableFont_wdth,wght.ttf"
          )
        }
      )
    }
  )

  foreach ($d in $downloadTargets) {
    $tmpDir = Join-Path $env:TEMP ("erdb-fonts-" + [guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Path $tmpDir | Out-Null
    try {
      Write-Host "Downloading $($d.Label)..."
      foreach ($f in $d.Files) {
        $outPath = Join-Path $tmpDir $f.Name
        $usedUrl = Download-FirstAvailable -Urls $f.Urls -OutPath $outPath
        if (-not $usedUrl) {
          Write-Warning "Download failed for $($f.Name)."
          continue
        }
        Write-Host "Downloaded $($f.Name) from $usedUrl"
        Install-FontFile -FontPath $outPath
      }
    } catch {
      Write-Warning "Download/install failed for $($d.Label): $($_.Exception.Message)"
    } finally {
      Remove-Item $tmpDir -Recurse -Force -ErrorAction SilentlyContinue
    }
  }

if (-not $installedAny) {
  Write-Warning "No fonts installed. You may need to install manually."
  exit 1
}

Write-Host "Fonts installation complete."
