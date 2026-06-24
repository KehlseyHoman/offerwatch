-- Migration 002: Google OAuth support
-- Run in Supabase: Dashboard → SQL Editor → paste & run

-- Google users have no password, so make the column nullable
ALTER TABLE users
    ALTER COLUMN password_hash DROP NOT NULL;

-- Store Google's unique user ID for account linking
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;
