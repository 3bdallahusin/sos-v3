# SOS V3 - Install Auto-start Task in Windows Task Scheduler
# Registers a background task that launches the development supervisor when the user logs in.

$ErrorActionPreference = "Continue"

$ScriptDir = $PSScriptRoot
$ProjectRoot = (Resolve-Path "$ScriptDir\..\..").Path
$SilentRunner = Join-Path $ScriptDir "run-silent.vbs"
$TaskName = "SOS_V3_DevServers"

$loggedUser = (Get-CimInstance Win32_ComputerSystem).UserName
if (-not $loggedUser) {
    $loggedUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
}

Write-Host "Registering scheduled task '$TaskName' for user '$loggedUser'..." -ForegroundColor Cyan

# Action: launch hidden powershell supervisor directly
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ScriptDir\supervisor.ps1`"" `
    -WorkingDirectory $ProjectRoot

# Trigger: at user logon
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $loggedUser

# Principal: interactive user session with limited user rights (no admin required)
$principal = New-ScheduledTaskPrincipal -UserId $loggedUser -LogonType Interactive -RunLevel Limited

# Settings: battery safe, infinite lifetime, auto-restart on system recovery
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit ([TimeSpan]::Zero) `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -MultipleInstances IgnoreNew

try {
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Automatically starts SOS V3 Web & Fastify development servers on Windows login." -Force | Out-Null

    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host " Scheduled task '$TaskName' registered successfully!" -ForegroundColor Green
    Write-Host " It will start automatically when $loggedUser logs in." -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "[ERROR] Failed to register scheduled task: $($_.Exception.Message)" -ForegroundColor Red
}
