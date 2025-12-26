# Rust Backend Starter Script (Development Mode)
# Usage: .\start-dev.ps1

Write-Host "🔧 Starting Rust Backend (Development Mode)..." -ForegroundColor Yellow

# Database URL
$env:DATABASE_URL = "postgresql://neondb_owner:npg_NVL31qxTnQrC@ep-wild-queen-adh4tc1u-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Server Configuration
$env:HOST = "0.0.0.0"
$env:PORT = "8080"

# Debug logging
$env:RUST_LOG = "debug"

Write-Host "📝 Configuration:" -ForegroundColor Cyan
Write-Host "   MODE: Development (with auto-reload)"
Write-Host "   HOST: $env:HOST"
Write-Host "   PORT: $env:PORT"
Write-Host "   LOG_LEVEL: debug"
Write-Host ""

# Run with cargo (auto-recompile on changes)
cargo run
