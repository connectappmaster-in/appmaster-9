# AppMaster Agent Service Installer
# Run this script as Administrator to install the AppMaster Agent as a Windows Service

#Requires -RunAsAdministrator

param(
    [Parameter(Mandatory=$false)]
    [string]$ServiceName = "AppMaster_Agent",
    
    [Parameter(Mandatory=$false)]
    [string]$DisplayName = "AppMaster Device Agent",
    
    [Parameter(Mandatory=$false)]
    [string]$Description = "AppMaster device monitoring and management agent"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " AppMaster Agent Service Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if script is running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERROR: This script must be run as Administrator" -ForegroundColor Red
    exit 1
}

# Paths
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$agentScriptPath = Join-Path $scriptPath "AppMaster-Agent-Service.ps1"
$installPath = "C:\ProgramData\AppMaster"
$installedScriptPath = Join-Path $installPath "AppMaster-Agent-Service.ps1"

# Check if agent script exists
if (-not (Test-Path $agentScriptPath)) {
    Write-Host "ERROR: Agent script not found at: $agentScriptPath" -ForegroundColor Red
    exit 1
}

Write-Host "[1/5] Creating installation directory..." -ForegroundColor Yellow
if (-not (Test-Path $installPath)) {
    New-Item -ItemType Directory -Path $installPath -Force | Out-Null
    Write-Host "  Created: $installPath" -ForegroundColor Gray
}

Write-Host "[2/5] Copying agent script..." -ForegroundColor Yellow
Copy-Item -Path $agentScriptPath -Destination $installedScriptPath -Force
Write-Host "  Copied to: $installedScriptPath" -ForegroundColor Gray

Write-Host "[3/5] Checking for existing service..." -ForegroundColor Yellow
$existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue

if ($existingService) {
    Write-Host "  Service already exists. Stopping and removing..." -ForegroundColor Yellow
    if ($existingService.Status -eq 'Running') {
        Stop-Service -Name $ServiceName -Force
        Write-Host "  Service stopped" -ForegroundColor Gray
    }
    
    # Use sc.exe to delete the service
    & sc.exe delete $ServiceName | Out-Null
    Start-Sleep -Seconds 2
    Write-Host "  Service removed" -ForegroundColor Gray
}

Write-Host "[4/5] Installing service..." -ForegroundColor Yellow

# Create wrapper script for NSSM or use PowerShell service creation
$wrapperScriptPath = Join-Path $installPath "ServiceWrapper.ps1"
$wrapperContent = @"
# Service Wrapper for AppMaster Agent
Set-ExecutionPolicy Bypass -Scope Process -Force
& '$installedScriptPath'
"@

Set-Content -Path $wrapperScriptPath -Value $wrapperContent -Force

# Try to use NSSM if available, otherwise use New-Service
$nssmPath = "C:\Windows\nssm.exe"
if (Test-Path $nssmPath) {
    Write-Host "  Using NSSM to install service..." -ForegroundColor Gray
    & $nssmPath install $ServiceName "powershell.exe" "-ExecutionPolicy Bypass -NoProfile -File `"$installedScriptPath`""
    & $nssmPath set $ServiceName Description $Description
    & $nssmPath set $ServiceName Start SERVICE_AUTO_START
}
else {
    Write-Host "  Using New-Service (NSSM not found)..." -ForegroundColor Gray
    Write-Host "  Note: For best results, install NSSM from https://nssm.cc/" -ForegroundColor Yellow
    
    $serviceBinary = "powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File `"$installedScriptPath`""
    
    New-Service -Name $ServiceName `
        -BinaryPathName $serviceBinary `
        -DisplayName $DisplayName `
        -Description $Description `
        -StartupType Automatic
}

Write-Host "  Service installed successfully" -ForegroundColor Green

Write-Host "[5/5] Starting service..." -ForegroundColor Yellow
Start-Service -Name $ServiceName
Start-Sleep -Seconds 2

$service = Get-Service -Name $ServiceName
if ($service.Status -eq 'Running') {
    Write-Host "  Service started successfully" -ForegroundColor Green
}
else {
    Write-Host "  WARNING: Service installed but not running. Status: $($service.Status)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service Name: $ServiceName" -ForegroundColor White
Write-Host "Status: $($service.Status)" -ForegroundColor White
Write-Host "Installation Path: $installPath" -ForegroundColor White
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Yellow
Write-Host "  Check status:    Get-Service -Name $ServiceName" -ForegroundColor Gray
Write-Host "  Stop service:    Stop-Service -Name $ServiceName" -ForegroundColor Gray
Write-Host "  Start service:   Start-Service -Name $ServiceName" -ForegroundColor Gray
Write-Host "  Restart service: Restart-Service -Name $ServiceName" -ForegroundColor Gray
Write-Host "  View logs:       Get-Content C:\ProgramData\AppMaster\Logs\agent-*.log -Tail 50" -ForegroundColor Gray
Write-Host ""
