-- Sprint 2 Migration: Align schema with backend routers
-- Run this after 001_initial_schema.sql

-- =====================================================
-- 1. ALTER users table — add columns needed by auth/admin
-- =====================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending'
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS matric_number VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS special_roles JSONB DEFAULT '[]'::jsonb;

-- Update existing test users to be approved and active
UPDATE users SET approval_status = 'approved', is_active = true, email_verified = true
WHERE email IN ('student@graduate.utm.my', 'lecturer@utm.my', 'coordinator@utm.my', 'hod@utm.my', 'admin@utm.my');

-- =====================================================
-- 2. ALTER courses table — add section/year columns used by routers
-- =====================================================
ALTER TABLE courses ALTER COLUMN lecturer_id DROP NOT NULL;
ALTER TABLE courses ALTER COLUMN department_id DROP NOT NULL;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS section VARCHAR(10) DEFAULT '01';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS year VARCHAR(20);
-- Backfill year from academic_year
UPDATE courses SET year = academic_year WHERE year IS NULL;

-- Drop the unique constraint on code so we can have same code different sections
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_code_key;
-- Add composite unique on code+section+semester+year
CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_code_section_sem_year
  ON courses(code, section, semester, year);

-- =====================================================
-- 3. ALTER enrollments table — add columns used by enrollment router
-- =====================================================
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual'
  CHECK (source IN ('manual', 'roster_upload', 'self_seeding'));
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS withdrawal_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Make semester/academic_year nullable (router doesn't require them)
ALTER TABLE enrollments ALTER COLUMN semester DROP NOT NULL;
ALTER TABLE enrollments ALTER COLUMN academic_year DROP NOT NULL;

-- Drop the old unique constraint and create a simpler one
ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_student_id_course_id_semester_academic_year_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_student_course_active
  ON enrollments(student_id, course_id) WHERE status = 'active';

-- =====================================================
-- 4. CREATE assessments table
-- =====================================================
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  assessment_type VARCHAR(50) NOT NULL CHECK (assessment_type IN ('quiz', 'test', 'assignment', 'project', 'exam', 'other')),
  max_score NUMERIC(8, 2) NOT NULL DEFAULT 100,
  weight_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (weight_percentage >= 0 AND weight_percentage <= 100),
  is_locked BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  "order" INTEGER DEFAULT 0,
  due_date TIMESTAMP WITH TIME ZONE,
  published_date TIMESTAMP WITH TIME ZONE,
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessments_course_id ON assessments(course_id);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(assessment_type);

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. CREATE marks table
-- =====================================================
CREATE TABLE IF NOT EXISTS marks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  score NUMERIC(8, 2),
  is_delayed VARCHAR(10) DEFAULT 'no' CHECK (is_delayed IN ('yes', 'no')),
  is_flagged VARCHAR(10) DEFAULT 'no' CHECK (is_flagged IN ('yes', 'no')),
  flag_reason TEXT,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  modified_by UUID REFERENCES users(id),
  modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_marks_student_id ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_course_id ON marks(course_id);
CREATE INDEX IF NOT EXISTS idx_marks_assessment_id ON marks(assessment_id);
CREATE INDEX IF NOT EXISTS idx_marks_status ON marks(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_marks_student_assessment ON marks(student_id, assessment_id);

CREATE TRIGGER update_marks_updated_at BEFORE UPDATE ON marks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. CREATE audit_log table (used by AuditService)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action VARCHAR(255) NOT NULL,
  actor_id UUID REFERENCES users(id),
  target_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- =====================================================
-- 7. CREATE queries table (for student mark queries)
-- =====================================================
CREATE TABLE IF NOT EXISTS queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id),
  assessment_id UUID REFERENCES assessments(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  question TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'escalated', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS query_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_id UUID NOT NULL REFERENCES queries(id) ON DELETE CASCADE,
  response TEXT NOT NULL,
  responded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_queries_student_id ON queries(student_id);
CREATE INDEX IF NOT EXISTS idx_queries_course_id ON queries(course_id);
CREATE INDEX IF NOT EXISTS idx_queries_status ON queries(status);

-- =====================================================
-- 8. CREATE flags table (for mark flagging)
-- =====================================================
CREATE TABLE IF NOT EXISTS flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mark_id UUID NOT NULL REFERENCES marks(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  note TEXT,
  flagged_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_flags_mark_id ON flags(mark_id);

-- =====================================================
-- 9. Disable RLS for service-role access (backend uses service key)
-- =====================================================
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (backend uses service_role key)
CREATE POLICY "Service role full access" ON assessments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON marks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON audit_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON queries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON query_responses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON flags FOR ALL USING (true) WITH CHECK (true);

-- Also ensure existing tables allow service role
CREATE POLICY IF NOT EXISTS "Service role full access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Service role full access" ON courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Service role full access" ON enrollments FOR ALL USING (true) WITH CHECK (true);
