$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

param(
    [switch]$WithAdmin
)

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

    throw "cloudflared не найден. Установите cloudflared или добавьте его в PATH."
}

function Start-WindowProcess {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
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
Write-Host "  Birzha Kanaliv Local Domain Launcher  "
Write-Host "========================================"
Write-Host ""

Write-Step "Проверка окружения..."
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    throw "npm не найден в PATH."
}

$cloudflaredExe = Resolve-CloudflaredPath
if (-not (Test-Path $cloudflaredConfig)) {
    throw "Не найден файл конфигурации cloudflared: $cloudflaredConfig"
}

Write-Step "Запуск backend/frontend в отдельных окнах..."
$processes = @()
$processes += Start-WindowProcess -Name "API" -WorkDir (Join-Path $root "server") -Command "npm.cmd run dev"
$processes += Start-WindowProcess -Name "Client" -WorkDir (Join-Path $root "client") -Command "npm.cmd run dev"

if ($WithAdmin) {
    $processes += Start-WindowProcess -Name "Admin" -WorkDir (Join-Path $root "admin-frontend") -Command "npm.cmd run dev"
}

Write-Step "Запуск cloudflared tunnel через config.yml..."
$cloudflaredCommand = "& '$cloudflaredExe' tunnel --config '$cloudflaredConfig' run"
$processes += Start-WindowProcess -Name "Cloudflared" -WorkDir $root -Command $cloudflaredCommand

Write-Host ""
Write-Host "Backend:      http://localhost:3001"
Write-Host "Frontend:     http://localhost:5173"
if ($WithAdmin) {
    Write-Host "Admin:        http://localhost:5174"
}
Write-Host "Domain:       https://$domain"
Write-Host ""
Write-Host "Нажмите Enter, чтобы остановить все запущенные процессы..." -ForegroundColor Yellow
[void](Read-Host)

Write-Step "Остановка процессов..."
foreach ($process in $processes) {
    try {
        if ($process -and -not $process.HasExited) {
            Stop-Process -Id $process.Id -Force
        }
    } catch {
        # ignore
    }
}

Write-Host "Готово." -ForegroundColor Green
