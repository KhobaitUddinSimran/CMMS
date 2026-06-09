-- Sprint 6 Migration: Course enhancements to match ChEE Teaching Load format
-- Run this after 002_sprint2_schema.sql

-- =====================================================
-- 1. Add category, coordinator_id and academic fields
-- =====================================================

-- Course category matching the CSV teaching load format
ALTER TABLE courses ADD COLUMN IF NOT EXISTS category VARCHAR(50)
  DEFAULT 'engineering'
  CHECK (category IN ('engineering', 'mathematics', 'university', 'language'));

-- Course coordinator (distinct from the teaching lecturer_id)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS coordinator_id UUID REFERENCES users(id);

-- Final exam flag
ALTER TABLE courses ADD COLUMN IF NOT EXISTS has_final_exam BOOLEAN DEFAULT false;

-- Learning method hours breakdown
ALTER TABLE courses ADD COLUMN IF NOT EXISTS lecture_hours   SMALLINT DEFAULT 2;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS tutorial_hours  SMALLINT DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS lab_hours       SMALLINT DEFAULT 0;

-- Lab / scheduling metadata
ALTER TABLE courses ADD COLUMN IF NOT EXISTS lab_name       VARCHAR(255);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS special_notes  TEXT;

-- =====================================================
-- 2. Backfill category from course code prefix
--    SMJG / SMJM  → mathematics
--    ULRS / ULRF / UHLM / UHLB / UHLJ / SHLJ → university / language
--    Everything else → engineering (default)
-- =====================================================

UPDATE courses
SET category = 'mathematics'
WHERE code ~* '^(SMJG|SMJM)';

UPDATE courses
SET category = 'language'
WHERE code ~* '^(UHLJ|SHLJ|UHLB|UHLM)';

UPDATE courses
SET category = 'university'
WHERE code ~* '^(ULRS|ULRF)';

-- =====================================================
-- 3. Index for fast category-based queries
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_coordinator ON courses(coordinator_id);
