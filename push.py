#!/usr/bin/env python3
"""Git push skripti avtomatik versiya idarəetməsi ilə."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def run(cmd: list[str], capture: bool = False) -> str:
  """Run a command and optionally capture output."""
  print(f"$ {' '.join(cmd)}")
  if capture:
    result = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    if result.returncode != 0:
      raise RuntimeError(f"Command failed: {' '.join(cmd)}")
    return result.stdout.strip()
  else:
    result = subprocess.run(cmd, cwd=ROOT)
    if result.returncode != 0:
      raise RuntimeError(f"Command failed: {' '.join(cmd)}")
    return ""


def has_changes() -> bool:
  """Check if there are uncommitted changes."""
  result = subprocess.run(
    ["git", "status", "--short"],
    cwd=ROOT,
    capture_output=True,
    text=True,
    check=True,
  )
  return bool(result.stdout.strip())


def get_latest_version() -> tuple[int, int]:
  """Get the latest version tag (major, minor) from git tags."""
  result = subprocess.run(
    ["git", "tag", "-l", "v*"],
    cwd=ROOT,
    capture_output=True,
    text=True,
  )
  
  if result.returncode != 0:
    return (7, 0)  # Start from v7.0 if no tags exist
  
  tags = result.stdout.strip().split('\n')
  if not tags or tags == ['']:
    return (7, 0)  # Start from v7.0 if no tags exist
  
  # Parse version tags (v7.1, v7.2, etc.)
  versions = []
  for tag in tags:
    match = re.match(r'v(\d+)\.(\d+)', tag)
    if match:
      major, minor = int(match.group(1)), int(match.group(2))
      versions.append((major, minor))
  
  if not versions:
    return (7, 0)  # Start from v7.0 if no valid tags
  
  # Return the latest version
  return max(versions)


def increment_version(major: int, minor: int, bump: str = "minor") -> tuple[int, int]:
  """Increment version based on bump type."""
  if bump == "major":
    return (major + 1, 0)
  else:  # minor
    return (major, minor + 1)


def ensure_git_identity() -> None:
  """Ensure git user.name and user.email are configured."""
  # Check if user.name is set (local or global)
  result = subprocess.run(
    ["git", "config", "user.name"],
    cwd=ROOT,
    capture_output=True,
    text=True,
  )
  has_name = result.returncode == 0 and result.stdout.strip()

  # Check if user.email is set (local or global)
  result = subprocess.run(
    ["git", "config", "user.email"],
    cwd=ROOT,
    capture_output=True,
    text=True,
  )
  has_email = result.returncode == 0 and result.stdout.strip()

  if not has_name or not has_email:
    # Try to get from environment or use defaults
    import os
    name = os.environ.get("GIT_USER_NAME", "Git User")
    email = os.environ.get("GIT_USER_EMAIL", "git@localhost")

    if not has_name:
      print(f"⚠️  Git user.name yoxdur, lokal olaraq təyin edilir: {name}")
      subprocess.run(
        ["git", "config", "user.name", name],
        cwd=ROOT,
        check=True,
      )

    if not has_email:
      print(f"⚠️  Git user.email yoxdur, lokal olaraq təyin edilir: {email}")
      subprocess.run(
        ["git", "config", "user.email", email],
        cwd=ROOT,
        check=True,
      )


def main() -> None:
  parser = argparse.ArgumentParser(description="Git push avtomatik versiya ilə")
  parser.add_argument(
    "-m",
    "--message",
    help="Commit mesajı (default: avtomatik versiya mesajı)",
  )
  parser.add_argument("--remote", default="origin", help="Remote adı (default: origin)")
  parser.add_argument("--branch", default="main", help="Branch adı (default: main)")
  parser.add_argument(
    "--bump",
    choices=["major", "minor"],
    default="minor",
    help="Versiya artırma tipi: major (v7.x -> v8.0) və ya minor (v7.1 -> v7.2)",
  )
  parser.add_argument(
    "--no-tag",
    action="store_true",
    help="Versiya tag-i yaratma",
  )
  args = parser.parse_args()

  if not has_changes():
    print("ℹ️  Heç bir dəyişiklik yoxdur, yalnız push icra olunur.")
    run(["git", "push", args.remote, args.branch])
    print("✅ Push tamamlandı.")
    return

  # Get current version and increment
  major, minor = get_latest_version()
  new_major, new_minor = increment_version(major, minor, args.bump)
  version_tag = f"v{new_major}.{new_minor}"
  
  print(f"📦 Cari versiya: v{major}.{minor}")
  print(f"📦 Yeni versiya: {version_tag}")

  # Prepare commit message
  if args.message:
    commit_msg = f"{version_tag}: {args.message}"
  else:
    commit_msg = f"{version_tag}: update {datetime.now(timezone.utc):%Y-%m-%d %H:%M:%S} UTC"

  # Commit changes
  ensure_git_identity()
  run(["git", "add", "."])
  run(["git", "commit", "-m", commit_msg])

  # Create version tag
  if not args.no_tag:
    run(["git", "tag", "-a", version_tag, "-m", commit_msg])
    print(f"🏷️  Tag yaradıldı: {version_tag}")

  # Push with tags
  run(["git", "push", args.remote, args.branch])
  if not args.no_tag:
    run(["git", "push", args.remote, version_tag])
  
  print(f"✅ Push tamamlandı: {version_tag}")


if __name__ == "__main__":
  try:
    main()
  except RuntimeError as exc:
    print(f"❌ {exc}")
    sys.exit(1)
