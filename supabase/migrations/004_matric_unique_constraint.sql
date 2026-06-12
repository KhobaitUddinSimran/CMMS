-- Migration: Add unique constraint on matric_number for roster lookups
-- This enables reliable student matching by matric number during roster upload

-- Add unique constraint on matric_number (nullable unique - only non-null values must be unique)
ALTER TABLE users ADD CONSTRAINT unique_matric_number UNIQUE (matric_number);

-- Add index for faster matric lookups
CREATE INDEX IF NOT EXISTS idx_users_matric_number ON users(matric_number);

-- Note: Email remains required for login; this migration only ensures matric
-- can be used as a reliable primary key for student identification in rosters.
