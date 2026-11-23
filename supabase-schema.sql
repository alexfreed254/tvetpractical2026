-- TVET e-ASSESS - Practical Assessment Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Institution Configuration
CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  short_name TEXT,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  level TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Units
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  level TEXT,
  credits INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classes
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  academic_year TEXT,
  term TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users (Trainers, Assessors, Verifiers, Trainees)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_number TEXT,
  admission_number TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'trainer', 'assessor', 'verifier', 'trainee')),
  department_id UUID REFERENCES departments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment Configuration
CREATE TABLE assessment_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  competency_threshold NUMERIC DEFAULT 50.0,
  pass_mark NUMERIC DEFAULT 50.0,
  enable_digital_signature BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessments (Assessment Paper Templates)
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID REFERENCES institutions(id),
  department_id UUID REFERENCES departments(id),
  course_id UUID REFERENCES courses(id),
  unit_id UUID REFERENCES units(id),
  class_id UUID REFERENCES classes(id),
  created_by UUID REFERENCES users(id),
  
  title TEXT NOT NULL,
  assessment_number TEXT,
  assessment_type TEXT DEFAULT 'Practical Assessment',
  academic_year TEXT,
  term TEXT,
  duration_minutes INTEGER,
  
  instructions TEXT,
  total_marks NUMERIC DEFAULT 0,
  
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Assessment Versions (Track changes to assessment templates)
CREATE TABLE assessment_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  data JSONB NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assessment_id, version_number)
);

-- Observation Checklist Criteria (Pre-assessment checklist)
CREATE TABLE checklist_criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES checklist_criteria(id) ON DELETE CASCADE,
  
  item_number TEXT NOT NULL,
  description TEXT NOT NULL,
  max_marks NUMERIC NOT NULL DEFAULT 0,
  
  display_order INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment Tasks
CREATE TABLE assessment_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  
  task_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  instructions TEXT,
  max_marks NUMERIC DEFAULT 0,
  
  display_order INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assessment_id, task_number)
);

-- Assessment Items (Criteria within tasks)
CREATE TABLE assessment_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES assessment_tasks(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES assessment_items(id) ON DELETE CASCADE,
  
  item_number TEXT NOT NULL,
  description TEXT NOT NULL,
  max_marks NUMERIC NOT NULL DEFAULT 0,
  
  display_order INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment Sessions (Individual trainee assessment instances)
CREATE TABLE assessment_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  trainee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assessor_id UUID REFERENCES users(id),
  
  assessment_date DATE,
  venue TEXT,
  
  total_marks_obtained NUMERIC DEFAULT 0,
  total_marks_available NUMERIC DEFAULT 0,
  percentage NUMERIC DEFAULT 0,
  
  outcome TEXT CHECK (outcome IN ('Competent', 'Not Yet Competent', 'Pending')),
  
  candidate_feedback TEXT,
  assessor_feedback TEXT,
  
  candidate_signature_url TEXT,
  candidate_signature_date DATE,
  
  assessor_signature_url TEXT,
  assessor_signature_date DATE,
  
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'verified', 'returned', 'rejected')),
  
  submitted_at TIMESTAMP WITH TIME ZONE,
  
  pdf_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assessment_id, trainee_id)
);

-- Checklist Results (Observation checklist scoring)
CREATE TABLE checklist_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  criterion_id UUID REFERENCES checklist_criteria(id) ON DELETE CASCADE,
  
  marks_obtained NUMERIC DEFAULT 0,
  max_marks NUMERIC NOT NULL,
  comments TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, criterion_id)
);

-- Criterion Results (Task criteria scoring)
CREATE TABLE criterion_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  item_id UUID REFERENCES assessment_items(id) ON DELETE CASCADE,
  
  marks_obtained NUMERIC DEFAULT 0,
  max_marks NUMERIC NOT NULL,
  comments TEXT,
  observations TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, item_id)
);

-- Assessment Verification
CREATE TABLE assessment_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  verifier_id UUID REFERENCES users(id),
  
  status TEXT NOT NULL CHECK (status IN ('approved', 'returned', 'rejected')),
  comments TEXT,
  verification_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_assessments_department ON assessments(department_id);
CREATE INDEX idx_assessments_course ON assessments(course_id);
CREATE INDEX idx_assessments_unit ON assessments(unit_id);
CREATE INDEX idx_assessments_status ON assessments(status);

CREATE INDEX idx_assessment_tasks_assessment ON assessment_tasks(assessment_id);
CREATE INDEX idx_assessment_items_task ON assessment_items(task_id);
CREATE INDEX idx_checklist_criteria_assessment ON checklist_criteria(assessment_id);

CREATE INDEX idx_assessment_sessions_assessment ON assessment_sessions(assessment_id);
CREATE INDEX idx_assessment_sessions_trainee ON assessment_sessions(trainee_id);
CREATE INDEX idx_assessment_sessions_assessor ON assessment_sessions(assessor_id);
CREATE INDEX idx_assessment_sessions_status ON assessment_sessions(status);

CREATE INDEX idx_criterion_results_session ON criterion_results(session_id);
CREATE INDEX idx_checklist_results_session ON checklist_results(session_id);

-- Row Level Security Policies

-- Enable RLS
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE criterion_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_verifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = auth_id);

-- Trainers can create assessments
CREATE POLICY "Trainers can create assessments"
  ON assessments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND users.role IN ('trainer', 'assessor', 'admin')
    )
  );

-- Trainers can view their own assessments
CREATE POLICY "Trainers can view own assessments"
  ON assessments FOR SELECT
  USING (
    created_by IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Assessors can create assessment sessions
CREATE POLICY "Assessors can create sessions"
  ON assessment_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND users.role IN ('assessor', 'trainer', 'admin')
    )
  );

-- Trainees can view their own assessment sessions
CREATE POLICY "Trainees can view own sessions"
  ON assessment_sessions FOR SELECT
  USING (
    trainee_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
    OR
    assessor_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Functions for automatic calculation

-- Function to calculate assessment session totals
CREATE OR REPLACE FUNCTION calculate_session_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate totals from criterion_results and checklist_results
  WITH task_totals AS (
    SELECT 
      COALESCE(SUM(marks_obtained), 0) as obtained,
      COALESCE(SUM(max_marks), 0) as available
    FROM criterion_results
    WHERE session_id = NEW.session_id
  ),
  checklist_totals AS (
    SELECT 
      COALESCE(SUM(marks_obtained), 0) as obtained,
      COALESCE(SUM(max_marks), 0) as available
    FROM checklist_results
    WHERE session_id = NEW.session_id
  )
  UPDATE assessment_sessions
  SET 
    total_marks_obtained = (SELECT obtained FROM task_totals) + (SELECT obtained FROM checklist_totals),
    total_marks_available = (SELECT available FROM task_totals) + (SELECT available FROM checklist_totals),
    percentage = CASE 
      WHEN ((SELECT available FROM task_totals) + (SELECT available FROM checklist_totals)) > 0 
      THEN (((SELECT obtained FROM task_totals) + (SELECT obtained FROM checklist_totals)) / 
            ((SELECT available FROM task_totals) + (SELECT available FROM checklist_totals))) * 100
      ELSE 0
    END,
    updated_at = NOW()
  WHERE id = NEW.session_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic calculation
CREATE TRIGGER trigger_calculate_totals_criterion
  AFTER INSERT OR UPDATE ON criterion_results
  FOR EACH ROW
  EXECUTE FUNCTION calculate_session_totals();

CREATE TRIGGER trigger_calculate_totals_checklist
  AFTER INSERT OR UPDATE ON checklist_results
  FOR EACH ROW
  EXECUTE FUNCTION calculate_session_totals();

-- Function to update assessment outcome
CREATE OR REPLACE FUNCTION update_assessment_outcome()
RETURNS TRIGGER AS $$
DECLARE
  threshold NUMERIC;
BEGIN
  -- Get competency threshold
  SELECT competency_threshold INTO threshold
  FROM assessment_config
  WHERE institution_id = (
    SELECT institution_id FROM assessments WHERE id = (
      SELECT assessment_id FROM assessment_sessions WHERE id = NEW.id
    )
  )
  LIMIT 1;
  
  -- Default to 50% if not configured
  IF threshold IS NULL THEN
    threshold := 50.0;
  END IF;
  
  -- Update outcome based on percentage
  IF NEW.percentage >= threshold THEN
    NEW.outcome := 'Competent';
  ELSE
    NEW.outcome := 'Not Yet Competent';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_outcome
  BEFORE UPDATE OF percentage ON assessment_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_assessment_outcome();
