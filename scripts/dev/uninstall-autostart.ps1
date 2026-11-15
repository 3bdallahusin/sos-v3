# SOS V3 - Uninstall Auto-start Task from Windows Task Scheduler
$ErrorActionPreference = "Continue"

$TaskName = "SOS_V3_DevServers"

Write-Host "Unregistering scheduled task '$TaskName'..." -ForegroundColor Yellow

try {
    $existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($existing) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false | Out-Null
        Write-Host ""
        Write-Host "==========================================================" -ForegroundColor Green
        Write-Host " Scheduled task '$TaskName' removed successfully." -ForegroundColor Green
        Write-Host "==========================================================" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "Scheduled task '$TaskName' was not found." -ForegroundColor Gray
    }
} catch {
    Write-Host "[ERROR] Failed to unregister task: $($_.Exception.Message)" -ForegroundColor Red
}
