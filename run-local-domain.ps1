param(
    [switch]$WithAdmin
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Write-Step {
    param([string]$Text)
    Write-Host "[*] $Text" -ForegroundColor Cyan
}

function Resolve-CloudflaredPath {
    $fromPath = Get-Command cloudflared -ErrorAction SilentlyContinue
    if ($fromPath) {
        return $fromPath.Source
    }

    $localPath = Join-Path $env:USERPROFILE ".cloudflared\cloudflared.exe"
    if (Test-Path $localPath) {
        return $localPath
    }

    throw "cloudflared was not found. Install cloudflared or add it to PATH."
}

function Start-WindowProcess {
    param(
        [Parameter(Mandatory = $true)][string]$WorkDir,
        [Parameter(Mandatory = $true)][string]$Command
    )

    $arg = "-NoExit -Command `"Set-Location '$WorkDir'; $Command`""
    return Start-Process -FilePath "powershell.exe" -ArgumentList $arg -WindowStyle Normal -PassThru
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$cloudflaredConfig = Join-Path $env:USERPROFILE ".cloudflared\config.yml"
$domain = "birzha-kanaliv.biz.ua"

Write-Host "========================================"
Write-Host "   Birzha Kanaliv Local Domain Launcher "
Write-Host "========================================"
Write-Host ""

Write-Step "Checking environment..."
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    throw "npm was not found in PATH."
}

$cloudflaredExe = Resolve-CloudflaredPath
if (-not (Test-Path $cloudflaredConfig)) {
    throw "cloudflared config was not found: $cloudflaredConfig"
}

Write-Step "Starting backend/frontend in separate windows..."
$processes = @()
$processes += Start-WindowProcess -WorkDir (Join-Path $root "server") -Command "npm.cmd run dev"
$processes += Start-WindowProcess -WorkDir (Join-Path $root "client") -Command "npm.cmd run dev"

if ($WithAdmin) {
    $processes += Start-WindowProcess -WorkDir (Join-Path $root "admin-frontend") -Command "npm.cmd run dev"
}

Write-Step "Starting cloudflared tunnel via config.yml..."
$cloudflaredCommand = "& '$cloudflaredExe' tunnel --config '$cloudflaredConfig' run"
$processes += Start-WindowProcess -WorkDir $root -Command $cloudflaredCommand

Write-Step "Waiting for services to start..."
Start-Sleep -Seconds 6

Write-Step "Opening site in browser..."
Start-Process "https://$domain"

Write-Host ""
Write-Host "Backend:      http://localhost:3001"
Write-Host "Frontend:     http://localhost:5173"
if ($WithAdmin) {
    Write-Host "Admin:        http://localhost:5174"
}
Write-Host "Domain:       https://$domain"
Write-Host ""
Write-Host "Press Enter to stop all started processes..." -ForegroundColor Yellow
[void](Read-Host)

Write-Step "Stopping processes..."
foreach ($process in $processes) {
    try {
        if ($process -and -not $process.HasExited) {
            Stop-Process -Id $process.Id -Force
        }
    } catch {
        # ignore
    }
}

Write-Host "Done." -ForegroundColor Green
