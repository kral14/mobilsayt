#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Mobil Sayt - Backend və Mobil Tətbiq Başlatma Scripti
Bu script həm backend serveri, həm də mobil tətbiqi eyni anda işə salır.
"""

import subprocess
import sys
import os
import time
import signal
import socket
from pathlib import Path

# Rəng kodları (Windows üçün)
class Colors:
    GREEN = '\033[92m'
    BLUE = '\033[94m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

# Windows-da rəngləri aktivləşdir
if sys.platform == 'win32':
    try:
        import ctypes
        kernel32 = ctypes.windll.kernel32
        kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
    except:
        pass

def print_colored(message, color=Colors.RESET):
    """Rəngli mətn çap et"""
    print(f"{color}{message}{Colors.RESET}")

# Logger funksiyası (sadə)
def logger_debug(message, data=None):
    """Debug log"""
    pass  # İstəsək burada log yaza bilərik

def check_node_installed():
    """Node.js quraşdırılıbmı yoxla"""
    try:
        # Windows üçün cmd /c istifadə et
        if sys.platform == 'win32':
            result = subprocess.run(['cmd', '/c', 'node', '--version'], 
                                  capture_output=True, 
                                  text=True, 
                                  timeout=5,
                                  shell=False)
        else:
            result = subprocess.run(['node', '--version'], 
                                  capture_output=True, 
                                  text=True, 
                                  timeout=5)
        
        if result.returncode == 0:
            version = result.stdout.strip() or result.stderr.strip()
            print_colored(f"✓ Node.js tapıldı: {version}", Colors.GREEN)
            return True
    except FileNotFoundError:
        pass
    except subprocess.TimeoutExpired:
        pass
    except Exception:
        pass
    
    print_colored("✗ Node.js tapılmadı! Zəhmət olmasa Node.js quraşdırın.", Colors.RED)
    print_colored("  Download: https://nodejs.org/", Colors.YELLOW)
    return False

def check_npm_installed():
    """npm quraşdırılıbmı yoxla"""
    try:
        # Windows üçün cmd /c istifadə et
        if sys.platform == 'win32':
            result = subprocess.run(['cmd', '/c', 'npm', '--version'], 
                                  capture_output=True, 
                                  text=True, 
                                  timeout=5,
                                  shell=False)
        else:
            result = subprocess.run(['npm', '--version'], 
                                  capture_output=True, 
                                  text=True, 
                                  timeout=5)
        
        if result.returncode == 0:
            version = result.stdout.strip() or result.stderr.strip()
            print_colored(f"✓ npm tapıldı: {version}", Colors.GREEN)
            return True
    except FileNotFoundError:
        pass
    except subprocess.TimeoutExpired:
        pass
    except Exception as e:
        # Əgər npm tapılmadısa, Node.js ilə birlikdə gəldiyini yoxla
        try:
            # Node.js quraşdırılıbsa, npm də olmalıdır
            node_result = subprocess.run(['node', '--version'], 
                                       capture_output=True, 
                                       text=True, 
                                       timeout=5)
            if node_result.returncode == 0:
                print_colored("⚠ npm komandası birbaşa tapılmadı, amma Node.js quraşdırılıb.", Colors.YELLOW)
                print_colored("  npm Node.js ilə birlikdə gəlməlidir. Davam edilir...", Colors.YELLOW)
                return True
        except:
            pass
    
    print_colored("✗ npm tapılmadı! Zəhmət olmasa npm quraşdırın.", Colors.RED)
    print_colored("  npm adətən Node.js ilə birlikdə gəlir.", Colors.YELLOW)
    return False

def check_port_available(port):
    """Portun boş olub-olmadığını yoxla"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        return result != 0  # 0 olsa, port istifadə olunur
    except:
        return True

def kill_process_on_port(port):
    """Portda işləyən prosesi dayandır"""
    try:
        if sys.platform == 'win32':
            # Windows üçün netstat və taskkill istifadə et
            result = subprocess.run(
                ['cmd', '/c', 'netstat', '-ano', '|', 'findstr', f':{port}'],
                capture_output=True,
                text=True,
                shell=True
            )
            if result.stdout:
                lines = result.stdout.strip().split('\n')
                for line in lines:
                    if f':{port}' in line and 'LISTENING' in line:
                        parts = line.split()
                        if len(parts) > 0:
                            pid = parts[-1]
                            try:
                                subprocess.run(
                                    ['cmd', '/c', 'taskkill', '/F', '/PID', pid],
                                    capture_output=True,
                                    timeout=5
                                )
                                print_colored(f"  ✓ Port {port} üzərindəki proses dayandırıldı (PID: {pid})", Colors.GREEN)
                                time.sleep(1)
                                return True
                            except:
                                pass
        else:
            # Linux/Mac üçün lsof istifadə et
            result = subprocess.run(
                ['lsof', '-ti', f':{port}'],
                capture_output=True,
                text=True
            )
            if result.stdout:
                pid = result.stdout.strip()
                try:
                    os.kill(int(pid), signal.SIGTERM)
                    print_colored(f"  ✓ Port {port} üzərindəki proses dayandırıldı (PID: {pid})", Colors.GREEN)
                    time.sleep(1)
                    return True
                except:
                    pass
    except Exception as e:
        logger_debug(f"kill_process_on_port xətası: {e}")
    return False

def check_dependencies():
    """Dependencies quraşdırılıbmı yoxla"""
    node_modules = Path('node_modules')
    if not node_modules.exists():
        print_colored("⚠ node_modules tapılmadı. Dependencies quraşdırılır...", Colors.YELLOW)
        print_colored("Bu bir dəfəyə baş verəcək və bir neçə dəqiqə çəkə bilər...", Colors.YELLOW)
        try:
            if sys.platform == 'win32':
                subprocess.run(['cmd', '/c', 'npm', 'install'], check=True, timeout=300)
            else:
                subprocess.run(['npm', 'install'], check=True, timeout=300)
            print_colored("✓ Dependencies quraşdırıldı!", Colors.GREEN)
        except subprocess.TimeoutExpired:
            print_colored("✗ Dependencies quraşdırılarkən timeout baş verdi.", Colors.RED)
            return False
        except subprocess.CalledProcessError as e:
            print_colored(f"✗ Dependencies quraşdırılarkən xəta baş verdi: {e}", Colors.RED)
            return False
        except Exception as e:
            print_colored(f"✗ Xəta: {e}", Colors.RED)
            return False
    else:
        print_colored("✓ Dependencies mövcuddur", Colors.GREEN)
    return True

def start_backend():
    """Backend serveri işə sal"""
    print_colored("\n" + "="*60, Colors.BLUE)
    print_colored("🚀 BACKEND SERVERİ İŞƏ SALINIR...", Colors.BOLD + Colors.BLUE)
    print_colored("="*60, Colors.BLUE)
    
    try:
        # Windows və digər OS üçün
        # CREATE_NEW_CONSOLE ilə ayrı pəncərədə açırıq, amma stdout/stderr-i oxuya bilmirik
        # Ona görə də əvvəlcə test edək
        if sys.platform == 'win32':
            # Test: server.js faylının mövcudluğunu yoxla
            server_file = Path('server.js')
            if not server_file.exists():
                print_colored("✗ server.js faylı tapılmadı!", Colors.RED)
                return None
            
            # Ayrı pəncərədə aç
            process = subprocess.Popen(
                ['cmd', '/c', 'start', 'cmd', '/k', 'npm', 'run', 'server'],
                shell=False
            )
        else:
            process = subprocess.Popen(
                ['npm', 'run', 'server'],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
        
        # Backend-in işə düşməsini gözlə
        print_colored("Backend serveri başladılır...", Colors.YELLOW)
        print_colored("  (Ayrı pəncərədə açılacaq - xəta mesajlarını orada görə bilərsiniz)", Colors.YELLOW)
        time.sleep(3)
        
        return process
    except Exception as e:
        print_colored(f"✗ Backend serveri işə salınarkən xəta: {e}", Colors.RED)
        return None

def start_mobile():
    """Mobil tətbiqi işə sal"""
    print_colored("\n" + "="*60, Colors.GREEN)
    print_colored("📱 MOBİL TƏTBİQİ İŞƏ SALINIR...", Colors.BOLD + Colors.GREEN)
    print_colored("="*60, Colors.GREEN)
    
    try:
        # Windows və digər OS üçün
        if sys.platform == 'win32':
            # Ayrı pəncərədə aç
            process = subprocess.Popen(
                ['cmd', '/c', 'start', 'cmd', '/k', 'npm', 'start'],
                shell=False
            )
        else:
            process = subprocess.Popen(
                ['npm', 'start'],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
        
        print_colored("Mobil tətbiq başladılır...", Colors.YELLOW)
        print_colored("  (Ayrı pəncərədə açılacaq)", Colors.YELLOW)
        return process
    except Exception as e:
        print_colored(f"✗ Mobil tətbiq işə salınarkən xəta: {e}", Colors.RED)
        return None

def main():
    """Əsas funksiya"""
    print_colored("\n" + "="*60, Colors.BOLD)
    print_colored("  MOBİL SAYT - BACKEND VƏ MOBİL TƏTBİQ BAŞLATMA", Colors.BOLD)
    print_colored("="*60 + "\n", Colors.BOLD)
    
    # Yoxlamalar
    print_colored("🔍 Sistem yoxlamaları aparılır...\n", Colors.YELLOW)
    
    if not check_node_installed():
        sys.exit(1)
    
    if not check_npm_installed():
        sys.exit(1)
    
    if not check_dependencies():
        sys.exit(1)
    
    print_colored("\n" + "="*60, Colors.BOLD)
    print_colored("✅ Bütün yoxlamalar keçildi!\n", Colors.GREEN)
    
    # Port 3000-i yoxla
    print_colored("🔍 Port 3000 yoxlanılır...", Colors.YELLOW)
    if not check_port_available(3000):
        print_colored("⚠️  Port 3000 artıq istifadə olunur!", Colors.YELLOW)
        response = input("  Port 3000 üzərindəki prosesi dayandırmaq istəyirsiniz? (y/n): ").strip().lower()
        if response == 'y' or response == 'yes' or response == '':
            if kill_process_on_port(3000):
                print_colored("  Port 3000 artıq boşdur", Colors.GREEN)
            else:
                print_colored("  ⚠️  Prosesi dayandırmaq mümkün olmadı. Zəhmət olmasa manual dayandırın.", Colors.YELLOW)
                print_colored("  Və ya başqa port istifadə edin (PORT=3001 npm run server)", Colors.YELLOW)
        else:
            print_colored("  ⚠️  Port 3000 istifadə olunur. Server başlamaya bilər.", Colors.YELLOW)
    else:
        print_colored("✓ Port 3000 boşdur", Colors.GREEN)
    
    print_colored("", Colors.RESET)  # Boş sətir
    
    processes = []
    
    # Backend serveri işə sal
    backend_process = start_backend()
    if backend_process:
        processes.append(('Backend Server', backend_process))
    
    # Bir az gözlə
    time.sleep(2)
    
    # Mobil tətbiqi işə sal
    mobile_process = start_mobile()
    if mobile_process:
        processes.append(('Mobil Tətbiq', mobile_process))
    
    if not processes:
        print_colored("\n✗ Heç bir proses işə salına bilmədi!", Colors.RED)
        sys.exit(1)
    
    print_colored("\n" + "="*60, Colors.BOLD)
    print_colored("✅ Hər iki proses işə salındı!", Colors.GREEN)
    print_colored("="*60, Colors.BOLD)
    print_colored("\n📝 Məlumat:", Colors.YELLOW)
    print_colored("  • Backend Server: http://localhost:3000", Colors.BLUE)
    print_colored("  • Mobil Tətbiq: Expo DevTools açılacaq", Colors.BLUE)
    print_colored("\n⚠️  QEYD:", Colors.YELLOW)
    print_colored("  • Prosesləri dayandırmaq üçün Ctrl+C basın", Colors.YELLOW)
    print_colored("  • Hər proses ayrı pəncərədə açılacaq (Windows)", Colors.YELLOW)
    print_colored("\n" + "="*60 + "\n", Colors.BOLD)
    
    try:
        # Prosesləri izlə
        print_colored("\n💡 İPUCU: Prosesləri dayandırmaq üçün Ctrl+C basın\n", Colors.YELLOW)
        print_colored("   Xəta mesajlarını ayrı pəncərələrdə görə bilərsiniz.\n", Colors.YELLOW)
        
        # Proseslərin işlədiyini yoxla (Windows-da ayrı pəncərələrdə olduğu üçün poll() işləməyə bilər)
        while True:
            time.sleep(5)
            # Windows-da ayrı pəncərələrdə işlədiyi üçün poll() həmişə None qaytaracaq
            # Ona görə də sadəcə gözləyirik
            if sys.platform != 'win32':
                # Linux/Mac üçün poll() işləyir
                for name, process in processes:
                    if process.poll() is not None:
                        print_colored(f"\n⚠️  {name} prosesi dayandı (exit code: {process.returncode})", Colors.YELLOW)
    except KeyboardInterrupt:
        print_colored("\n\n🛑 Proseslər dayandırılır...", Colors.YELLOW)
        
        # Bütün prosesləri dayandır
        for name, process in processes:
            try:
                print_colored(f"  • {name} dayandırılır...", Colors.YELLOW)
                if sys.platform == 'win32':
                    process.terminate()
                else:
                    process.send_signal(signal.SIGTERM)
                process.wait(timeout=5)
                print_colored(f"  ✓ {name} dayandırıldı", Colors.GREEN)
            except:
                try:
                    process.kill()
                except:
                    pass
        
        print_colored("\n✅ Bütün proseslər dayandırıldı. Görüşənədək!\n", Colors.GREEN)
        sys.exit(0)

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print_colored(f"\n✗ Gözlənilməz xəta: {e}", Colors.RED)
        sys.exit(1)

