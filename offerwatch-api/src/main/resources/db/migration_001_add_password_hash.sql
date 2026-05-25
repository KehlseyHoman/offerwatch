-- Migration 001: Add password_hash to users table
-- Run this once in Supabase: Dashboard → SQL Editor → paste & run

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT '';

-- Remove the default once the column exists (passwords are set on register)
ALTER TABLE users
    ALTER COLUMN password_hash DROP DEFAULT;
