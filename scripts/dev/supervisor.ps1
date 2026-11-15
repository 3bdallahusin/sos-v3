# SOS V3 - Persistent Development Server Supervisor
# Manages Fastify API (3001) and Vite Web (5173) in background with auto-restart.

$ErrorActionPreference = "Continue"

$ScriptDir = $PSScriptRoot
$ProjectRoot = (Resolve-Path "$ScriptDir\..\..").Path
$LogsDir = Join-Path $ProjectRoot "logs\dev"
$PidsDir = Join-Path $ProjectRoot ".pids"

$SupervisorLog = Join-Path $LogsDir "supervisor.log"
$ApiLog = Join-Path $LogsDir "api.log"
$WebLog = Join-Path $LogsDir "web.log"

$SupervisorPidFile = Join-Path $PidsDir "supervisor.pid"
$ApiPidFile = Join-Path $PidsDir "api.pid"
$WebPidFile = Join-Path $PidsDir "web.pid"
$StopSignalFile = Join-Path $PidsDir "stop.signal"

if (-not (Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null
}
if (-not (Test-Path $PidsDir)) {
    New-Item -ItemType Directory -Path $PidsDir -Force | Out-Null
}

function Write-SupervisorLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$timestamp] [$Level] $Message"
    Add-Content -Path $SupervisorLog -Value $line
}

# 1. Prevent duplicate supervisor instances
if (Test-Path $SupervisorPidFile) {
    $existingPid = Get-Content $SupervisorPidFile -ErrorAction SilentlyContinue
    if ($existingPid) {
        $p = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
        if ($p -and ($p.ProcessName -like "*powershell*" -or $p.ProcessName -like "*pwsh*")) {
            Write-SupervisorLog "Supervisor already active with PID $existingPid. Exiting." "WARN"
            exit 0
        }
    }
}

# Clear any previous stop signal
if (Test-Path $StopSignalFile) {
    Remove-Item $StopSignalFile -Force -ErrorAction SilentlyContinue
}

$PID | Set-Content -Path $SupervisorPidFile -Force
Write-SupervisorLog "Supervisor started with PID $PID for project root: $ProjectRoot" "INFO"

# Locate Node.exe
$nodePath = "C:\Program Files\nodejs\node.exe"
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCmd) { $nodePath = $nodeCmd.Source }

$apiDir = Join-Path $ProjectRoot "apps\api"
$webDir = Join-Path $ProjectRoot "apps\web"

$tsxPath = Join-Path $apiDir "node_modules\tsx\dist\cli.mjs"
$vitePath = Join-Path $webDir "node_modules\vite\bin\vite.js"

function Start-ApiService {
    Write-SupervisorLog "Starting Fastify API server via tsx..." "INFO"
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "cmd.exe"
    $psi.Arguments = "/c `"`"$nodePath`" `"$tsxPath`" watch src/index.ts >> `"$ApiLog`" 2>&1`""
    $psi.WorkingDirectory = $apiDir
    $psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
    $psi.CreateNoWindow = $true
    $psi.UseShellExecute = $false

    $proc = [System.Diagnostics.Process]::Start($psi)
    $proc.Id | Set-Content -Path $ApiPidFile -Force
    Write-SupervisorLog "Fastify API process started (PID: $($proc.Id))" "INFO"
    return $proc
}

function Start-WebService {
    Write-SupervisorLog "Starting Vite Web server on http://localhost:5173/..." "INFO"
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "cmd.exe"
    $psi.Arguments = "/c `"`"$nodePath`" `"$vitePath`" --host localhost --port 5173 >> `"$WebLog`" 2>&1`""
    $psi.WorkingDirectory = $webDir
    $psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
    $psi.CreateNoWindow = $true
    $psi.UseShellExecute = $false

    $proc = [System.Diagnostics.Process]::Start($psi)
    $proc.Id | Set-Content -Path $WebPidFile -Force
    Write-SupervisorLog "Vite Web process started (PID: $($proc.Id))" "INFO"
    return $proc
}

$apiProc = Start-ApiService
$webProc = Start-WebService

# 2. Continuous Monitoring Loop
$maxCrashesPerMinute = 5
$apiCrashes = New-Object System.Collections.Generic.List[datetime]
$webCrashes = New-Object System.Collections.Generic.List[datetime]

while ($true) {
    Start-Sleep -Seconds 3

    # Check for manual stop signal
    if (Test-Path $StopSignalFile) {
        Write-SupervisorLog "Stop signal detected. Terminating child services..." "INFO"
        if ($apiProc -and -not $apiProc.HasExited) {
            & taskkill.exe /PID $apiProc.Id /T /F 2>$null | Out-Null
        }
        if ($webProc -and -not $webProc.HasExited) {
            & taskkill.exe /PID $webProc.Id /T /F 2>$null | Out-Null
        }
        Remove-Item $SupervisorPidFile -Force -ErrorAction SilentlyContinue
        Remove-Item $ApiPidFile -Force -ErrorAction SilentlyContinue
        Remove-Item $WebPidFile -Force -ErrorAction SilentlyContinue
        Remove-Item $StopSignalFile -Force -ErrorAction SilentlyContinue
        Write-SupervisorLog "Supervisor shutdown cleanly." "INFO"
        exit 0
    }

    # Monitor API process
    if ($apiProc.HasExited) {
        $now = Get-Date
        $apiCrashes.Add($now)
        $oneMinAgo = $now.AddSeconds(-60)
        $apiCrashes = [System.Collections.Generic.List[datetime]]($apiCrashes | Where-Object { $_ -gt $oneMinAgo })

        if ($apiCrashes.Count -ge $maxCrashesPerMinute) {
            Write-SupervisorLog "Fastify API crashed $($apiCrashes.Count) times in 60s. Halting restarts to prevent loop." "ERROR"
        } else {
            Write-SupervisorLog "Fastify API process (PID $($apiProc.Id)) exited. Restarting..." "WARN"
            Start-Sleep -Seconds 1
            $apiProc = Start-ApiService
        }
    }

    # Monitor Web process
    if ($webProc.HasExited) {
        $now = Get-Date
        $webCrashes.Add($now)
        $oneMinAgo = $now.AddSeconds(-60)
        $webCrashes = [System.Collections.Generic.List[datetime]]($webCrashes | Where-Object { $_ -gt $oneMinAgo })

        if ($webCrashes.Count -ge $maxCrashesPerMinute) {
            Write-SupervisorLog "Vite Web crashed $($webCrashes.Count) times in 60s. Halting restarts to prevent loop." "ERROR"
        } else {
            Write-SupervisorLog "Vite Web process (PID $($webProc.Id)) exited. Restarting..." "WARN"
            Start-Sleep -Seconds 1
            $webProc = Start-WebService
        }
    }
}
