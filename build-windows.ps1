# EPUB Reader Windows Build Script
# Usage: .\build-windows.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EPUB Reader Windows Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "[1/5] Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Node.js not installed or not in PATH" -ForegroundColor Red
    exit 1
}
Write-Host "OK Node.js version: $nodeVersion" -ForegroundColor Green

# Check npm
Write-Host "[2/5] Checking npm..." -ForegroundColor Yellow
$npmVersion = npm --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: npm not installed or not in PATH" -ForegroundColor Red
    exit 1
}
Write-Host "OK npm version: $npmVersion" -ForegroundColor Green

# Clean old build files
Write-Host "[3/5] Cleaning old build files..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "OK Cleaned dist directory" -ForegroundColor Green
}

if (Test-Path "dist-electron") {
    try {
        Remove-Item -Recurse -Force "dist-electron" -ErrorAction Stop
        Write-Host "OK Cleaned dist-electron directory" -ForegroundColor Green
    } catch {
        Write-Host "Warning: Cannot delete dist-electron directory (may be in use)" -ForegroundColor Yellow
        Write-Host "  Please close all EPUB Reader processes and retry" -ForegroundColor Yellow
        exit 1
    }
}

# Install dependencies if needed
Write-Host "[4/5] Checking and installing dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Gray
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Dependency installation failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "OK Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "OK Dependencies already exist, skipping installation" -ForegroundColor Green
}

# Build the application
Write-Host "[5/5] Starting to build application..." -ForegroundColor Yellow
Write-Host ""

# Set environment variables
$env:msvs_version="2022"
$env:npm_config_electron_mirror="https://npmmirror.com/mirrors/electron/"

# Execute build command
npm run electron:build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Build successful!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Display generated files
$setupExe = "dist-electron\EPUB Reader Setup 1.0.0.exe"
if (Test-Path $setupExe) {
    $fileSize = (Get-Item $setupExe).Length / 1MB
    Write-Host "Package location:" -ForegroundColor Cyan
    Write-Host "   $setupExe" -ForegroundColor White
    Write-Host "   Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor White
    Write-Host ""
    
    # Ask if open folder
    $openFolder = Read-Host "Open output folder? (Y/N)"
    if ($openFolder -eq "Y" -or $openFolder -eq "y") {
        explorer.exe "dist-electron"
    }
} else {
    Write-Host "Warning: Installer file not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Build completed!" -ForegroundColor Green
