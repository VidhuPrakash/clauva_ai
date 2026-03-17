import os

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()

# regular admin client — bypasses RLS, use ONLY in admin routes
supabase = create_client(
    os.getenv("SUPABASE_URL") or "", os.getenv("SUPABASE_ANON_KEY") or ""
)

supabase_admin = create_client(
    os.getenv("SUPABASE_URL") or "", os.getenv("SUPABASE_SERVICE_ROLE_KEY") or ""
)


def get_user_client(token: str) -> Client:
    """
    Creates a Supabase client with the user's JWT attached.
    This makes RLS policies work correctly — auth.uid() returns the user's id.
    """
    client = create_client(
        os.getenv("SUPABASE_URL") or "", os.getenv("SUPABASE_ANON_KEY") or ""
    )
    client.postgrest.auth(token)
    return client
