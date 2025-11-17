#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Avtomatik Git Commit və Deploy Script
Hər dəfə işə salanda dəyişiklikləri commit edir və GitHub-a push edir
Render avtomatik olaraq deploy edəcək
"""

import subprocess
import sys
import os
from datetime import datetime

def run_command(command, cwd=None, check=True):
    """Komanda işə salır və nəticəni qaytarır"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            check=check,
            capture_output=True,
            text=True,
            encoding='utf-8'
        )
        return result.stdout.strip(), result.stderr.strip(), result.returncode
    except subprocess.CalledProcessError as e:
        return e.stdout.strip(), e.stderr.strip(), e.returncode

def get_git_status():
    """Git status yoxlayır"""
    stdout, stderr, code = run_command('git status --porcelain', check=False)
    return stdout, code == 0

def get_untracked_files():
    """Untracked faylları tapır"""
    stdout, stderr, code = run_command('git ls-files --others --exclude-standard', check=False)
    return stdout.split('\n') if stdout else []

def main():
    print("🚀 Deploy Script Başladı...")
    print("=" * 60)
    
    # Git repository yoxla
    stdout, stderr, code = run_command('git rev-parse --git-dir', check=False)
    if code != 0:
        print("❌ Xəta: Bu qovluq Git repository deyil!")
        print("   Git repository yaradın: git init")
        sys.exit(1)
    
    # Git status yoxla
    print("\n📊 Git status yoxlanılır...")
    status_output, status_ok = get_git_status()
    
    if not status_output:
        print("✅ Dəyişiklik yoxdur. Deploy lazım deyil.")
        sys.exit(0)
    
    # Dəyişiklikləri göstər
    print("\n📝 Dəyişikliklər:")
    print("-" * 60)
    lines = status_output.split('\n')
    for line in lines:
        if line.strip():
            status = line[:2]
            file = line[3:]
            if status == '??':
                print(f"  ➕ Yeni fayl: {file}")
            elif status.startswith('M'):
                print(f"  ✏️  Dəyişdirildi: {file}")
            elif status.startswith('D'):
                print(f"  🗑️  Silindi: {file}")
            elif status.startswith('A'):
                print(f"  ➕ Əlavə edildi: {file}")
    
    # Commit mesajı soruş
    print("\n" + "=" * 60)
    default_message = f"Deploy: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    commit_message = input(f"💬 Commit mesajı (Enter = '{default_message}'): ").strip()
    
    if not commit_message:
        commit_message = default_message
    
    # Git add
    print("\n📦 Dəyişikliklər əlavə edilir...")
    stdout, stderr, code = run_command('git add -A')
    if code != 0:
        print(f"❌ Xəta: git add uğursuz oldu!")
        print(f"   {stderr}")
        sys.exit(1)
    print("✅ Dəyişikliklər əlavə edildi")
    
    # Git commit
    print(f"\n💾 Commit edilir: '{commit_message}'...")
    stdout, stderr, code = run_command(f'git commit -m "{commit_message}"', check=False)
    if code != 0:
        if "nothing to commit" in stderr.lower():
            print("ℹ️  Commit ediləcək dəyişiklik yoxdur")
        else:
            print(f"❌ Xəta: git commit uğursuz oldu!")
            print(f"   {stderr}")
            sys.exit(1)
    else:
        print("✅ Commit uğurla tamamlandı")
    
    # Git branch yoxla
    stdout, stderr, code = run_command('git branch --show-current', check=False)
    current_branch = stdout.strip() if stdout else 'main'
    
    # Remote yoxla
    stdout, stderr, code = run_command('git remote -v', check=False)
    if code != 0 or not stdout:
        print("\n⚠️  Remote repository yoxdur!")
        add_remote = input("   Remote əlavə etmək istəyirsiniz? (y/n): ").strip().lower()
        if add_remote == 'y':
            remote_url = input("   Remote URL (məsələn: https://github.com/kral14/mobilsayt.git): ").strip()
            if remote_url:
                run_command(f'git remote add origin {remote_url}')
                print(f"✅ Remote əlavə edildi: {remote_url}")
            else:
                print("❌ Remote URL boşdur!")
                sys.exit(1)
        else:
            print("ℹ️  Remote olmadan push edilə bilməz")
            sys.exit(0)
    
    # Git push
    print(f"\n🚀 GitHub-a push edilir (branch: {current_branch})...")
    stdout, stderr, code = run_command(f'git push -u origin {current_branch}', check=False)
    
    if code != 0:
        if "no upstream branch" in stderr.lower():
            # İlk push
            print("ℹ️  İlk push, upstream branch yaradılır...")
            stdout, stderr, code = run_command(f'git push --set-upstream origin {current_branch}', check=False)
        
        if code != 0:
            print(f"❌ Xəta: git push uğursuz oldu!")
            print(f"   {stderr}")
            print("\n💡 Təklif:")
            print("   1. GitHub-da repository yaradıldığını yoxlayın")
            print("   2. Git credentials düzgündürmü yoxlayın")
            print("   3. Manual push edin: git push -u origin main")
            sys.exit(1)
    
    print("✅ Push uğurla tamamlandı")
    
    # Render deploy info
    print("\n" + "=" * 60)
    print("🎉 Deploy tamamlandı!")
    print("\n📌 Növbəti addımlar:")
    print("   1. Render dashboard-da service-lərin deploy olduğunu yoxlayın")
    print("   2. Build log-larını yoxlayın (Render dashboard → Logs)")
    print("   3. Service URL-lərini test edin")
    print("\n🔗 Render Dashboard: https://dashboard.render.com/")
    print("=" * 60)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Əməliyyat istifadəçi tərəfindən dayandırıldı")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Gözlənilməz xəta: {e}")
        sys.exit(1)

