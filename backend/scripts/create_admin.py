"""
Create or promote an admin user.

Usage:
  # Create a brand-new admin account
  python scripts/create_admin.py --email admin@example.com --password s3cur3P@ss

  # Promote an already-existing user to admin
  python scripts/create_admin.py --email admin@example.com --promote
"""

import argparse
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()

from db.supabase_client import supabase_admin  # noqa: E402


def create_admin(email: str, password: str) -> None:
    print(f"Creating admin user: {email}")

    res = supabase_admin.auth.admin.create_user(
        {
            "email": email,
            "password": password,
            "app_metadata": {"role": "admin"},
            "email_confirm": True,
        }
    )
    user = res.user
    if not user:
        print("ERROR: Failed to create user (no user returned).")
        sys.exit(1)

    _upsert_profile(user.id, email)
    print(f"Admin created — id: {user.id}")


def promote_admin(email: str) -> None:
    print(f"Promoting existing user to admin: {email}")

    # Look up the user by email via the admin list API
    page = supabase_admin.auth.admin.list_users()
    user = next((u for u in page if u.email == email), None)
    if not user:
        print(f"ERROR: No user found with email '{email}'.")
        sys.exit(1)

    supabase_admin.auth.admin.update_user_by_id(
        user.id,
        {"app_metadata": {"role": "admin"}},
    )

    _upsert_profile(user.id, email)
    print(f"User promoted to admin — id: {user.id}")


def _upsert_profile(user_id: str, email: str) -> None:
    """Keep the profiles table in sync."""
    supabase_admin.table("profiles").upsert(
        {"id": user_id, "email": email, "role": "admin"},
        on_conflict="id",
    ).execute()
    print("profiles table updated.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Create or promote an admin user.")
    parser.add_argument("--email", required=True, help="Admin email address")
    parser.add_argument(
        "--password",
        help="Password (required when creating a new user; omit with --promote)",
    )
    parser.add_argument(
        "--promote",
        action="store_true",
        help="Promote an existing user instead of creating a new one",
    )
    args = parser.parse_args()

    if args.promote:
        promote_admin(args.email)
    else:
        if not args.password:
            parser.error("--password is required when creating a new admin user")
        create_admin(args.email, args.password)


if __name__ == "__main__":
    main()
