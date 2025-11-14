@echo off
REM Windows üçün batch faylı - Python scriptini işə salır
chcp 65001 >nul
echo.
echo ============================================================
echo   MOBİL SAYT - BACKEND VƏ MOBİL TƏTBİQ BAŞLATMA
echo ============================================================
echo.

REM Python yoxla
python --version >nul 2>&1
if errorlevel 1 (
    echo [XƏTA] Python tapılmadı!
    echo Zəhmət olmasa Python quraşdırın: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Python scriptini işə sal
python start.py

pause

