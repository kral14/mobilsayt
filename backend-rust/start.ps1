# Rust Backend Starter Script
# Usage: .\start.ps1

Write-Host "Starting Rust Backend..." -ForegroundColor Green

# Database URL
$env:DATABASE_URL = "postgresql://neondb_owner:npg_NVL31qxTnQrC@ep-wild-queen-adh4tc1u-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Server Configuration
$env:HOST = "0.0.0.0"
$env:PORT = "8080"

# Logging
$env:RUST_LOG = "info"

Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "   HOST: $env:HOST"
Write-Host "   PORT: $env:PORT"
Write-Host "   DATABASE: Neon PostgreSQL"
Write-Host ""

# Check if release build exists
if (Test-Path ".\target\release\mobilsayt_backend.exe") {
    Write-Host "Using optimized release build" -ForegroundColor Green
    .\target\release\mobilsayt_backend.exe
} else {
    Write-Host "Release build not found. Building..." -ForegroundColor Yellow
    cargo build --release
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Build successful! Starting server..." -ForegroundColor Green
        .\target\release\mobilsayt_backend.exe
    } else {
        Write-Host "Build failed!" -ForegroundColor Red
        exit 1
    }
}
