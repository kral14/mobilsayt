#!/usr/bin/env python3
"""Sadə git push skripti."""

from __future__ import annotations

import argparse
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def run(cmd: list[str]) -> None:
  print(f"$ {' '.join(cmd)}")
  result = subprocess.run(cmd, cwd=ROOT)
  if result.returncode != 0:
    raise RuntimeError(f"Command failed: {' '.join(cmd)}")


def has_changes() -> bool:
  result = subprocess.run(
    ["git", "status", "--short"],
    cwd=ROOT,
    capture_output=True,
    text=True,
    check=True,
  )
  return bool(result.stdout.strip())


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
  parser = argparse.ArgumentParser(description="Yalnız git push əməliyyatı")
  parser.add_argument(
    "-m",
    "--message",
    default=f"push: {datetime.now(timezone.utc):%Y-%m-%d %H:%M:%S} UTC",
    help="Commit mesajı",
  )
  parser.add_argument("--remote", default="origin", help="Remote adı (default: origin)")
  parser.add_argument("--branch", default="main", help="Branch adı (default: main)")
  args = parser.parse_args()

  if not has_changes():
    print("Heç bir dəyişiklik yoxdur, yalnız push icra olunur.")
  else:
    ensure_git_identity()
    run(["git", "add", "."])
    run(["git", "commit", "-m", args.message])

  run(["git", "push", args.remote, args.branch])
  print("✅ Push tamamlandı.")


if __name__ == "__main__":
  try:
    main()
  except RuntimeError as exc:
    print(f"❌ {exc}")
    sys.exit(1)
