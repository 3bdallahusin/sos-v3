# SOS V3 - Development Servers Status Inspector
$ErrorActionPreference = "Continue"

$ScriptDir = $PSScriptRoot
$ProjectRoot = (Resolve-Path "$ScriptDir\..\..").Path
$PidsDir = Join-Path $ProjectRoot ".pids"
$LogsDir = Join-Path $ProjectRoot "logs\dev"

$SupervisorPidFile = Join-Path $PidsDir "supervisor.pid"
$ApiPidFile = Join-Path $PidsDir "api.pid"
$WebPidFile = Join-Path $PidsDir "web.pid"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "             SOS V3 Dev Servers Status                    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Supervisor Status
$supRunning = $false
if (Test-Path $SupervisorPidFile) {
    $supPid = Get-Content $SupervisorPidFile -ErrorAction SilentlyContinue
    if ($supPid -and (Get-Process -Id $supPid -ErrorAction SilentlyContinue)) {
        Write-Host " Supervisor:   RUNNING (PID: $supPid)" -ForegroundColor Green
        $supRunning = $true
    }
}
if (-not $supRunning) {
    Write-Host " Supervisor:   STOPPED" -ForegroundColor Red
}

# 2. Fastify API Status
$apiConn = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
if ($apiConn) {
    $apiPid = $apiConn.OwningProcess[0]
    Write-Host " Fastify API:  RUNNING (Port 3001, PID: $apiPid)" -ForegroundColor Green

    # Health check
    try {
        $health = Invoke-RestMethod -Uri "http://127.0.0.1:3001/health" -Method Get -TimeoutSec 2
        Write-Host "   /health:    OK (status: $($health.status), uptime: $([math]::Round($health.uptime, 1))s)" -ForegroundColor Gray
    } catch {
        Write-Host "   /health:    FAILED ($($_.Exception.Message))" -ForegroundColor Red
    }

    # Readiness check
    try {
        $ready = Invoke-RestMethod -Uri "http://127.0.0.1:3001/ready" -Method Get -TimeoutSec 2
        Write-Host "   /ready:     READY (db: $($ready.databaseName), role: $($ready.databaseUser))" -ForegroundColor Gray
    } catch {
        Write-Host "   /ready:     NOT READY ($($_.Exception.Message))" -ForegroundColor Yellow
    }
} else {
    Write-Host " Fastify API:  STOPPED (Port 3001 not listening)" -ForegroundColor Red
}

# 3. Vite Web Status
$webConn = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if ($webConn) {
    $webPid = $webConn.OwningProcess[0]
    Write-Host " Vite Web:     RUNNING (Port 5173, PID: $webPid)" -ForegroundColor Green
    try {
        $webRes = Invoke-WebRequest -Uri "http://localhost:5173" -Method Get -TimeoutSec 2 -UseBasicParsing
        if ($webRes.StatusCode -eq 200) {
            Write-Host "   Frontend:   OK (HTTP 200 - http://localhost:5173)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "   Frontend:   WARNING ($($_.Exception.Message))" -ForegroundColor Yellow
    }
} else {
    Write-Host " Vite Web:     STOPPED (Port 5173 not listening)" -ForegroundColor Red
}

# 4. Windows Task Scheduler Task Status
$task = Get-ScheduledTask -TaskName "SOS_V3_DevServers" -ErrorAction SilentlyContinue
if ($task) {
    Write-Host " Auto-start:   INSTALLED (Task: SOS_V3_DevServers, State: $($task.State))" -ForegroundColor Green
} else {
    Write-Host " Auto-start:   NOT INSTALLED (Run install-autostart.ps1 to enable)" -ForegroundColor Yellow
}

Write-Host " Logs Dir:     $LogsDir" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan
