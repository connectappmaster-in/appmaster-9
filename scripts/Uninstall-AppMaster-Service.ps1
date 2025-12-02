# AppMaster Agent Service Uninstaller
# Run this script as Administrator to uninstall the AppMaster Agent service

#Requires -RunAsAdministrator

param(
    [Parameter(Mandatory=$false)]
    [string]$ServiceName = "AppMaster_Agent",
    
    [Parameter(Mandatory=$false)]
    [switch]$RemoveData
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " AppMaster Agent Service Uninstaller" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if script is running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERROR: This script must be run as Administrator" -ForegroundColor Red
    exit 1
}

Write-Host "[1/3] Checking for service..." -ForegroundColor Yellow
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue

if (-not $service) {
    Write-Host "  Service not found: $ServiceName" -ForegroundColor Yellow
    Write-Host "  Nothing to uninstall" -ForegroundColor Gray
}
else {
    Write-Host "  Service found: $ServiceName" -ForegroundColor Gray
    
    Write-Host "[2/3] Stopping service..." -ForegroundColor Yellow
    if ($service.Status -eq 'Running') {
        Stop-Service -Name $ServiceName -Force
        Write-Host "  Service stopped" -ForegroundColor Green
    }
    else {
        Write-Host "  Service already stopped" -ForegroundColor Gray
    }
    
    Write-Host "[3/3] Removing service..." -ForegroundColor Yellow
    & sc.exe delete $ServiceName | Out-Null
    Start-Sleep -Seconds 2
    Write-Host "  Service removed successfully" -ForegroundColor Green
}

if ($RemoveData) {
    Write-Host ""
    Write-Host "[OPTIONAL] Removing installation directory..." -ForegroundColor Yellow
    $installPath = "C:\ProgramData\AppMaster"
    
    if (Test-Path $installPath) {
        Remove-Item -Path $installPath -Recurse -Force
        Write-Host "  Removed: $installPath" -ForegroundColor Green
    }
    else {
        Write-Host "  Directory not found: $installPath" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Uninstallation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
