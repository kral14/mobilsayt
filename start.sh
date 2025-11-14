#!/bin/bash
# Linux/Mac üçün shell script - Python scriptini işə salır

echo ""
echo "============================================================"
echo "  MOBİL SAYT - BACKEND VƏ MOBİL TƏTBİQ BAŞLATMA"
echo "============================================================"
echo ""

# Python yoxla
if ! command -v python3 &> /dev/null; then
    echo "[XƏTA] Python3 tapılmadı!"
    echo "Zəhmət olmasa Python3 quraşdırın"
    exit 1
fi

# Python scriptini işə sal
python3 start.py

