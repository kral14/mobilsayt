@echo off
REM Rust Backend Starter Script (Windows Batch)
REM Usage: start.bat

echo.
echo ========================================
echo   Starting Rust Backend Server
echo ========================================
echo.

REM Database URL
set DATABASE_URL=postgresql://neondb_owner:npg_NVL31qxTnQrC@ep-wild-queen-adh4tc1u-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

REM Server Configuration
set HOST=0.0.0.0
set PORT=8080
set RUST_LOG=info

echo Configuration:
echo   HOST: %HOST%
echo   PORT: %PORT%
echo   DATABASE: Neon PostgreSQL
echo.

REM Check if release build exists
if exist "target\release\mobilsayt_backend.exe" (
    echo [OK] Using optimized release build
    echo.
    target\release\mobilsayt_backend.exe
) else (
    echo [WARNING] Release build not found. Building...
    echo.
    cargo build --release
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Build successful! Starting server...
        echo.
        target\release\mobilsayt_backend.exe
    ) else (
        echo [ERROR] Build failed!
        pause
        exit /b 1
    )
)
