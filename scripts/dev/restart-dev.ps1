# SOS V3 - Restart Development Servers
$ErrorActionPreference = "Continue"

$ScriptDir = $PSScriptRoot

Write-Host "Restarting SOS V3 Dev Servers..." -ForegroundColor Cyan
& "$ScriptDir\stop-dev.ps1"
Start-Sleep -Seconds 1
& "$ScriptDir\start-dev.ps1"
