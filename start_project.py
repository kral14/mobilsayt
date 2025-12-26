import subprocess
import threading
import os
import sys
import signal
import time
import socket

# Configuration
# Use absolute paths to avoid cwd issues
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(SCRIPT_DIR, "backend-rust")
FRONTEND_DIR = os.path.join(SCRIPT_DIR, "web")

ENV_VARS = {
    "DATABASE_URL": "postgresql://neondb_owner:npg_NVL31qxTnQrC@ep-wild-queen-adh4tc1u-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require",
    "HOST": "0.0.0.0",
    "PORT": "8080",
    "RUST_LOG": "info"
}

# Colors
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def run_process(command, cwd, env, prefix, color):
    # Ensure directory exists
    if not os.path.exists(cwd):
        print(f"{Colors.FAIL}Error: Directory {cwd} does not exist!{Colors.ENDC}")
        return

    process = subprocess.Popen(
        command,
        cwd=cwd,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        shell=True,
        bufsize=1,
        universal_newlines=True,
        encoding='utf-8',
        errors='replace'
    )
    
    for line in process.stdout:
        print(f"{color}[{prefix}]{Colors.ENDC} {line.strip()}")
        sys.stdout.flush()
    
    return process

def kill_process_on_port(port):
    """Kills any process listening on the specified port on Windows."""
    if os.name == 'nt':
        try:
            # Find PID
            cmd = f"netstat -ano | findstr :{port}"
            result = subprocess.run(cmd, capture_output=True, shell=True, text=True)
            lines = result.stdout.strip().split('\n')
            for line in lines:
                if f":{port}" in line and "LISTENING" in line:
                    parts = line.split()
                    pid = parts[-1]
                    print(f"{Colors.WARNING}Killing process {pid} on port {port}...{Colors.ENDC}")
                    os.system(f"taskkill /F /PID {pid} >nul 2>&1")
        except Exception as e:
            print(f"{Colors.FAIL}Error killing port {port}: {e}{Colors.ENDC}")

def wait_for_port(port, timeout=300):
    """Waits for the port to be open (meaning backend is ready)"""
    start_time = time.time()
    print(f"{Colors.BLUE}Waiting for Backend to start on port {port}...{Colors.ENDC}")
    while time.time() - start_time < timeout:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex(('localhost', port))
            sock.close()
            if result == 0:
                print(f"{Colors.GREEN}Backend is ready on port {port}!{Colors.ENDC}")
                return True
        except:
            pass
        time.sleep(1)
    print(f"{Colors.FAIL}Timeout: Backend did not start on port {port} in time.{Colors.ENDC}")
    return False

def main():
    print(f"{Colors.HEADER}{Colors.BOLD}🚀 Starting MobilSayt Project (Rust Backend + React Frontend){Colors.ENDC}")
    print(f"{Colors.HEADER}=============================================================={Colors.ENDC}")

    # Clean up ports
    print(f"{Colors.BLUE}Cleaning up ports...{Colors.ENDC}")
    kill_process_on_port(8080)
    kill_process_on_port(5173)

    # Prepare environments
    backend_env = os.environ.copy()
    backend_env.update(ENV_VARS)
    
    frontend_env = os.environ.copy()

    # Find Cargo
    cargo_path = "cargo"
    user_cargo = os.path.expanduser("~/.cargo/bin/cargo.exe")
    if os.path.exists(user_cargo):
        cargo_path = user_cargo


# Global variable to control the backend process
backend_process = None
backend_lock = threading.Lock()

def run_backend(cargo_path, env):
    global backend_process
    while True:
        with backend_lock:
            print(f"{Colors.GREEN}Starting Backend ({cargo_path} run)...{Colors.ENDC}")
            backend_process = subprocess.Popen(
                f'"{cargo_path}" run',
                cwd=BACKEND_DIR,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                shell=True,
                bufsize=1,
                universal_newlines=True,
                encoding='utf-8',
                errors='replace'
            )
        
        # Stream output
        try:
            for line in backend_process.stdout:
                print(f"{Colors.BLUE}[Backend]{Colors.ENDC} {line.strip()}")
                sys.stdout.flush()
        except:
            pass
            
        # Process ended
        with backend_lock:
            if backend_process:
                return_code = backend_process.poll()
                backend_process = None
                if return_code is not None and return_code != 0:
                    print(f"{Colors.FAIL}Backend crashed or stopped. Waiting for file changes to restart...{Colors.ENDC}")
                    # Break inner loop to waiting state (handled by watcher triggering restart or just wait)
                    # Actually, for auto-reload, we just want it to run. If it crashes, we might want to wait.
                    # But the Watcher will be responsible for killing and restarting.
                    return 

def restart_backend(cargo_path, env):
    global backend_process
    print(f"\n{Colors.WARNING}🔄 File change detected! Restarting backend...{Colors.ENDC}")
    
    with backend_lock:
        if backend_process:
            # Kill the process tree (Windows specific)
            os.system(f"taskkill /F /T /PID {backend_process.pid} >nul 2>&1")
            backend_process = None
    
    # Start new thread
    t = threading.Thread(target=run_backend, args=(cargo_path, env))
    t.daemon = True
    t.start()

def get_file_mtimes(directory):
    mtimes = {}
    for root, _, files in os.walk(directory):
        if "target" in root or ".git" in root:
            continue
        for f in files:
            if f.endswith(".rs") or f.endswith(".toml"):
                path = os.path.join(root, f)
                try:
                    mtimes[path] = os.path.getmtime(path)
                except:
                    pass
    return mtimes

def watch_backend(cargo_path, env):
    last_mtimes = get_file_mtimes(BACKEND_DIR)
    
    # Start initial backend
    restart_backend(cargo_path, env)
    
    while True:
        time.sleep(1) # Check every second
        current_mtimes = get_file_mtimes(BACKEND_DIR)
        
        changed = False
        if len(current_mtimes) != len(last_mtimes):
            changed = True
        else:
            for path, mtime in current_mtimes.items():
                if path not in last_mtimes or last_mtimes[path] != mtime:
                    changed = True
                    break
        
        if changed:
            last_mtimes = current_mtimes
            restart_backend(cargo_path, env)

def run_frontend(cwd, env):
    run_process("npm run dev", cwd, env, "Frontend", Colors.WARNING)

def main():
    print(f"{Colors.HEADER}{Colors.BOLD}🚀 Starting MobilSayt Project (Rust Backend + React Frontend){Colors.ENDC}")
    print(f"{Colors.HEADER}=============================================================={Colors.ENDC}")
    print(f"{Colors.HEADER}ℹ️  Auto-reload enabled for Backend (.rs files){Colors.ENDC}")

    # Clean up ports
    print(f"{Colors.BLUE}Cleaning up ports...{Colors.ENDC}")
    kill_process_on_port(8080)
    kill_process_on_port(5173)

    # Prepare environments
    backend_env = os.environ.copy()
    backend_env.update(ENV_VARS)
    
    frontend_env = os.environ.copy()

    # Find Cargo
    cargo_path = "cargo"
    user_cargo = os.path.expanduser("~/.cargo/bin/cargo.exe")
    if os.path.exists(user_cargo):
        cargo_path = user_cargo

    try:
        # Start Backend Watcher in a separate thread
        watcher_thread = threading.Thread(
            target=watch_backend,
            args=(cargo_path, backend_env)
        )
        watcher_thread.daemon = True
        watcher_thread.start()
        
        # WAIT for backend to be ready before starting frontend (initial wait)
        if wait_for_port(8080, timeout=600): # Longer timeout for first build
            # Start Frontend
            print(f"{Colors.GREEN}Starting Frontend (npm run dev)...{Colors.ENDC}")
            frontend_thread = threading.Thread(
                target=run_frontend,
                args=(FRONTEND_DIR, frontend_env)
            )
            frontend_thread.daemon = True
            frontend_thread.start()

            print(f"{Colors.HEADER}Services are running. Press Ctrl+C to stop.{Colors.ENDC}")
            
            # Keep main thread alive
            while True:
                time.sleep(1)
        else:
            print(f"{Colors.FAIL}Backend failed to start initially. Exiting.{Colors.ENDC}")
            sys.exit(1)

    except KeyboardInterrupt:
        print(f"\n{Colors.FAIL}Stopping all services...{Colors.ENDC}")
        if os.name == 'nt':
             os.system("taskkill /F /IM mobilsayt_backend.exe /T 2>nul")
             os.system("taskkill /F /IM node.exe /T 2>nul")
        sys.exit(0)
if __name__ == "__main__":
    main()
