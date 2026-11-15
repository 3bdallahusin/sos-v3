# SOS V3 - Start Development Servers in Background
$ErrorActionPreference = "Continue"

$ScriptDir = $PSScriptRoot
$ProjectRoot = (Resolve-Path "$ScriptDir\..\..").Path
$PidsDir = Join-Path $ProjectRoot ".pids"
$LogsDir = Join-Path $ProjectRoot "logs\dev"
$SupervisorPidFile = Join-Path $PidsDir "supervisor.pid"
$SilentRunner = Join-Path $ScriptDir "run-silent.vbs"

Write-Host "Starting SOS V3 Development Servers..." -ForegroundColor Cyan

# 1. Check if supervisor is already active
if (Test-Path $SupervisorPidFile) {
    $supPid = Get-Content $SupervisorPidFile -ErrorAction SilentlyContinue
    if ($supPid) {
        $existingProc = Get-Process -Id $supPid -ErrorAction SilentlyContinue
        if ($existingProc -and ($existingProc.ProcessName -like "*powershell*" -or $existingProc.ProcessName -like "*pwsh*")) {
            Write-Host "Supervisor is already running with PID $supPid." -ForegroundColor Yellow
            & "$ScriptDir\status.ps1"
            exit 0
        }
    }
}

# 2. Launch supervisor (prefer Task Scheduler for detached persistence)
$task = Get-ScheduledTask -TaskName "SOS_V3_DevServers" -ErrorAction SilentlyContinue
if ($task) {
    Start-ScheduledTask -TaskName "SOS_V3_DevServers"
} else {
    Start-Process "powershell.exe" `
        -ArgumentList "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ScriptDir\supervisor.ps1`"" `
        -WorkingDirectory $ProjectRoot
}

Write-Host "Waiting for services to initialize..." -NoNewline -ForegroundColor Gray
$timeoutSec = 15
$startTime = Get-Date

$apiReady = $false
$webReady = $false

while ((Get-Date) - $startTime -lt (New-TimeSpan -Seconds $timeoutSec)) {
    Write-Host "." -NoNewline -ForegroundColor Gray
    Start-Sleep -Milliseconds 700

    if (-not $apiReady) {
        $conn = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
        if ($conn) { $apiReady = $true }
    }
    if (-not $webReady) {
        $conn = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
        if ($conn) { $webReady = $true }
    }

    if ($apiReady -and $webReady) {
        break
    }
}
Write-Host ""

& "$ScriptDir\status.ps1"
