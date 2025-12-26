import subprocess
import os

def run_git_command(command):
    try:
        print(f"Executing: {' '.join(command)}")
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error: {e.stderr}")
        return False

def main():
    repo_url = "https://github.com/kral14/rust-sistemi-ile-.git"
    remote_name = "rustpush"
    
    # 1. Check if remote exists, if not add it
    remotes = subprocess.run(["git", "remote"], capture_output=True, text=True).stdout.split()
    if remote_name not in remotes:
        print(f"Adding remote {remote_name}...")
        run_git_command(["git", "remote", "add", remote_name, repo_url])
    else:
        print(f"Remote {remote_name} already exists.")

    # 2. Add all changes
    print("Staging changes...")
    run_git_command(["git", "add", "."])

    # 3. Commit
    commit_msg = "Automated push: Performance optimizations and fixes"
    print(f"Committing with message: {commit_msg}")
    # We use a try-except here because if there's nothing to commit, it returns non-zero
    subprocess.run(["git", "commit", "-m", commit_msg])

    # 4. Push
    print(f"Pushing to {remote_name} main...")
    if run_git_command(["git", "push", remote_name, "main", "--force"]):
        print("\n✅ Success! Code pushed to rust-sistemi-ile-")
    else:
        print("\n❌ Push failed. Check your internet connection or repository permissions.")

if __name__ == "__main__":
    main()
