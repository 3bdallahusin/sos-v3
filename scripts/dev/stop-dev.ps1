# SOS V3 - Stop Development Servers Safely
$ErrorActionPreference = "Continue"

$ScriptDir = $PSScriptRoot
$ProjectRoot = (Resolve-Path "$ScriptDir\..\..").Path
$PidsDir = Join-Path $ProjectRoot ".pids"
$LogsDir = Join-Path $ProjectRoot "logs\dev"

$SupervisorPidFile = Join-Path $PidsDir "supervisor.pid"
$ApiPidFile = Join-Path $PidsDir "api.pid"
$WebPidFile = Join-Path $PidsDir "web.pid"
$StopSignalFile = Join-Path $PidsDir "stop.signal"

Write-Host "Stopping SOS V3 Development Servers..." -ForegroundColor Yellow

# 1. Write stop signal
if (-not (Test-Path $PidsDir)) {
    New-Item -ItemType Directory -Path $PidsDir -Force | Out-Null
}
"stop" | Set-Content -Path $StopSignalFile -Force

# 2. Terminate supervisor process
if (Test-Path $SupervisorPidFile) {
    $supPid = Get-Content $SupervisorPidFile -ErrorAction SilentlyContinue
    if ($supPid) {
        $p = Get-Process -Id $supPid -ErrorAction SilentlyContinue
        if ($p) {
            Stop-Process -Id $supPid -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped supervisor process (PID $supPid)." -ForegroundColor Gray
        }
    }
}

# 3. Terminate API process tree
if (Test-Path $ApiPidFile) {
    $apiPid = Get-Content $ApiPidFile -ErrorAction SilentlyContinue
    if ($apiPid) {
        & taskkill.exe /PID $apiPid /T /F 2>$null | Out-Null
        Write-Host "Terminated Fastify API process tree (PID $apiPid)." -ForegroundColor Gray
    }
}

# 4. Terminate Web process tree
if (Test-Path $WebPidFile) {
    $webPid = Get-Content $WebPidFile -ErrorAction SilentlyContinue
    if ($webPid) {
        & taskkill.exe /PID $webPid /T /F 2>$null | Out-Null
        Write-Host "Terminated Vite Web process tree (PID $webPid)." -ForegroundColor Gray
    }
}

# 5. Clean up any orphaned processes bound to ports 3001 or 5173 for SOS v3
foreach ($port in @(3001, 5173)) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($conn in $conns) {
        $pidToKill = $conn.OwningProcess
        $procInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $pidToKill" -ErrorAction SilentlyContinue
        if ($procInfo -and ($procInfo.CommandLine -like "*SOS v3*" -or $procInfo.CommandLine -like "*vite*" -or $procInfo.CommandLine -like "*tsx*")) {
            & taskkill.exe /PID $pidToKill /T /F 2>$null | Out-Null
        }
    }
}

Start-Sleep -Milliseconds 600

# 6. Remove PID files and stop signal
Remove-Item $SupervisorPidFile -Force -ErrorAction SilentlyContinue
Remove-Item $ApiPidFile -Force -ErrorAction SilentlyContinue
Remove-Item $WebPidFile -Force -ErrorAction SilentlyContinue
Remove-Item $StopSignalFile -Force -ErrorAction SilentlyContinue

$remaining3001 = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
$remaining5173 = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue

if (-not $remaining3001 -and -not $remaining5173) {
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host " SOS V3 Dev Servers stopped successfully." -ForegroundColor Green
    Write-Host " Ports 3001 and 5173 are now free." -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[WARN] One or more ports remain in use." -ForegroundColor Yellow
}
