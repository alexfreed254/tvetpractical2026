export interface ExportProjectFile {
  path: string;
  language: string;
  category: 'Database' | 'Config' | 'Lib' | 'App Routes' | 'API Routes' | 'Components' | 'Public';
  content: string;
}

export const PROJECT_CORE_FILES: ExportProjectFile[] = [
  {
    path: 'tvet-eassess/supabase/schema.sql',
    language: 'sql',
    category: 'Database',
    content: `-- supabase/schema.sql
-- TVET e-ASSESS Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Institutions
CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  logo_url TEXT,
  competency_threshold DECIMAL(5,2) DEFAULT 50.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Units
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  unit_code TEXT NOT NULL,
  unit_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classes
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  term TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trainees
CREATE TABLE trainees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admission_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessments (templates)
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id),
  course_id UUID REFERENCES courses(id),
  unit_id UUID REFERENCES units(id),
  class_id UUID REFERENCES classes(id),
  department_name TEXT,
  course_title TEXT,
  level TEXT,
  unit_code TEXT,
  unit_name TEXT,
  title TEXT NOT NULL,
  assessment_number INTEGER NOT NULL,
  assessment_type TEXT DEFAULT 'PRACTICAL',
  assessment_date DATE,
  duration_minutes INTEGER,
  academic_year TEXT,
  term TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment versions (for audit trail)
CREATE TABLE assessment_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  published_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment tasks
CREATE TABLE assessment_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  task_number INTEGER NOT NULL,
  task_title TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment items (criteria)
CREATE TABLE assessment_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES assessment_tasks(id) ON DELETE CASCADE,
  item_number TEXT NOT NULL,
  description TEXT NOT NULL,
  max_marks DECIMAL(5,2) NOT NULL DEFAULT 0,
  is_subcriterion BOOLEAN DEFAULT FALSE,
  parent_item_id UUID REFERENCES assessment_items(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  instruction TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Observation checklists (separate from task criteria)
CREATE TABLE observation_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instruction TEXT,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklist criteria
CREATE TABLE checklist_criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID REFERENCES observation_checklists(id) ON DELETE CASCADE,
  item_number TEXT NOT NULL,
  description TEXT NOT NULL,
  max_marks DECIMAL(5,2) NOT NULL DEFAULT 0,
  is_subitem BOOLEAN DEFAULT FALSE,
  parent_criteria_id UUID REFERENCES checklist_criteria(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  performance_indicator TEXT,
  competency_standard TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment sessions (instances of assessment for a trainee)
CREATE TABLE assessment_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  assessment_version_id UUID REFERENCES assessment_versions(id),
  trainee_id UUID REFERENCES trainees(id) ON DELETE CASCADE,
  assessor_id UUID REFERENCES auth.users(id),
  assessment_date DATE NOT NULL,
  venue TEXT,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'verified', 'returned', 'rejected')),
  grand_total_available DECIMAL(7,2) DEFAULT 0,
  grand_total_obtained DECIMAL(7,2) DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0,
  competency_outcome TEXT CHECK (competency_outcome IN ('Competent', 'Not Yet Competent', 'Pending')),
  verifier_id UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  verification_status TEXT CHECK (verification_status IN ('pending', 'approved', 'returned', 'rejected')),
  verification_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criterion results (marks awarded per item)
CREATE TABLE criterion_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  item_id UUID REFERENCES assessment_items(id) ON DELETE CASCADE,
  marks_obtained DECIMAL(5,2) DEFAULT 0,
  comments TEXT,
  observations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, item_id)
);

-- Checklist results
CREATE TABLE checklist_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  criteria_id UUID REFERENCES checklist_criteria(id) ON DELETE CASCADE,
  marks_obtained DECIMAL(5,2) DEFAULT 0,
  comments TEXT,
  observations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, criteria_id)
);

-- Assessment feedback
CREATE TABLE assessment_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID UNIQUE REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  feedback_from_candidate TEXT,
  feedback_to_candidate TEXT,
  candidate_signature_url TEXT,
  assessor_signature_url TEXT,
  candidate_signed_at TIMESTAMPTZ,
  assessor_signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated documents (PDFs)
CREATE TABLE generated_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainees ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE observation_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE criterion_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public institutions" ON institutions FOR SELECT USING (true);
CREATE POLICY "Authenticated can view departments" ON departments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can view courses" ON courses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can view units" ON units FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can view classes" ON classes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can view trainees" ON trainees FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can view assessments" ON assessments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Trainers can create assessments" ON assessments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Trainers can update own assessments" ON assessments FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Authenticated can view sessions" ON assessment_sessions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Assessors can create sessions" ON assessment_sessions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Assessors can update own sessions" ON assessment_sessions FOR UPDATE USING (assessor_id = auth.uid() AND status = 'in_progress');

-- Indexes
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_sessions_assessment ON assessment_sessions(assessment_id);
CREATE INDEX idx_sessions_trainee ON assessment_sessions(trainee_id);
CREATE INDEX idx_sessions_status ON assessment_sessions(status);
CREATE INDEX idx_criterion_results_session ON criterion_results(session_id);
CREATE INDEX idx_checklist_results_session ON checklist_results(session_id);
`,
  },
  {
    path: 'tvet-eassess/supabase/seed.sql',
    language: 'sql',
    category: 'Database',
    content: `-- supabase/seed.sql
-- Sample seed data for TVETPRACTICAL (Thika Technical Training Institute)

INSERT INTO institutions (id, name, department, competency_threshold)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'THIKA TECHNICAL TRAINING INSTITUTE',
  'ELECTRICAL & ELECTRONICS ENGINEERING',
  50.00
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO trainees (id, admission_number, full_name)
VALUES
  ('22222222-2222-2222-2222-222222222201', 'TTTI/EI/2025/041', 'Brian Mwangi Kamau'),
  ('22222222-2222-2222-2222-222222222202', 'TTTI/EI/2025/042', 'Faith Wanjiku Njoroge'),
  ('22222222-2222-2222-2222-222222222203', 'TTTI/EI/2025/048', 'Kevin Kiprop Tanui'),
  ('22222222-2222-2222-2222-222222222204', 'TTTI/EI/2025/053', 'Mercy Akinyi Otieno')
ON CONFLICT (admission_number) DO NOTHING;

INSERT INTO assessments (
  id, institution_id, department_name, course_title, level, unit_code, unit_name,
  title, assessment_number, assessment_type, assessment_date, duration_minutes,
  academic_year, term, status
)
VALUES (
  '33333333-3333-3333-3333-333333333301',
  '11111111-1111-1111-1111-111111111111',
  'ELECTRICAL & ELECTRONICS ENGINEERING',
  'ELECTRICAL INSTALLATION',
  'LEVEL 4, 5 & 6',
  'ENG/CU/EI/CR/03/5/MA',
  'Install Security System',
  'Install Security System — Practical Assessment 1',
  1,
  'PRACTICAL',
  '2026-11-18',
  180,
  '2026',
  'Term 3',
  'published'
)
ON CONFLICT (id) DO NOTHING;
`,
  },
  {
    path: 'tvet-eassess/public/logo.svg',
    language: 'xml',
    category: 'Public',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
  <circle cx="60" cy="60" r="54" stroke="#0F172A" stroke-width="4" />
  <circle cx="60" cy="60" r="46" stroke="#0F172A" stroke-width="1.5" />
  <circle cx="60" cy="60" r="24" stroke="#0F172A" stroke-width="3" />
  <path d="M62 42L50 62H60L57 78L71 57H61L62 42Z" fill="#0F172A" />
</svg>
`,
  },
  {
    path: 'tvet-eassess/package.json',
    language: 'json',
    category: 'Config',
    content: `{
  "name": "tvet-eassess",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.2",
    "bootstrap": "^5.3.3",
    "bootstrap-icons": "^1.11.3",
    "@react-pdf/renderer": "^3.4.4",
    "uuid": "^9.0.1",
    "date-fns": "^3.6.0"
  }
}
`,
  },
  {
    path: 'tvet-eassess/next.config.js',
    language: 'javascript',
    category: 'Config',
    content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['your_supabase_storage_domain.supabase.co']
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false
    };
    return config;
  }
};

module.exports = nextConfig;
`,
  },
  {
    path: 'tvet-eassess/.env.local.example',
    language: 'bash',
    category: 'Config',
    content: `NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
`,
  },
  {
    path: 'tvet-eassess/README.md',
    language: 'markdown',
    category: 'Config',
    content: `# TVET e-ASSESS

Competency-Based Education and Training (CBET) Assessment Management System built with Next.js App Router, Supabase (\`@supabase/supabase-js\` + \`@supabase/ssr\`), Bootstrap 5, and \`@react-pdf/renderer\`.

## Setup Instructions

\`\`\`bash
# 1. Install dependencies
cd tvet-eassess
npm install

# 2. Connect to your existing Supabase project
# - Run supabase/schema.sql (and optionally supabase/seed.sql) in the SQL Editor
# - Create a storage bucket called 'generated-documents'
# - Copy .env.local.example to .env.local and fill in NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

# 3. Run development server
npm run dev

# 4. Build for production
npm run build
npm start
\`\`\`
`,
  },
  {
    path: 'tvet-eassess/lib/supabase/client.js',
    language: 'javascript',
    category: 'Lib',
    content: `import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
`,
  },
  {
    path: 'tvet-eassess/lib/supabase/server.js',
    language: 'javascript',
    category: 'Lib',
    content: `import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored in Server Components when middleware handles cookie refresh.
          }
        }
      }
    }
  );
}
`,
  },
  {
    path: 'tvet-eassess/middleware.js',
    language: 'javascript',
    category: 'Config',
    content: `import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        }
      }
    }
  );

  await supabase.auth.getUser();
  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
};
`,
  },
  {
    path: 'tvet-eassess/lib/supabase.js',
    language: 'javascript',
    category: 'Lib',
    content: `import { createClient as createBrowserSupabase } from './supabase/client';
import { createClient as createBaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  typeof window !== 'undefined'
    ? createBrowserSupabase()
    : createBaseClient(supabaseUrl, supabaseKey);

export const getServerSupabase = (serverToken) => {
  return createBaseClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: \`Bearer \${serverToken}\` } }
  });
};
`,
  },
  {
    path: 'tvet-eassess/lib/calculations.js',
    language: 'javascript',
    category: 'Lib',
    content: `// Calculation engine for TVET assessments

export function calculateTaskSubtotal(items, results) {
  let subtotal = 0;
  items.forEach(item => {
    if (!item.is_subcriterion) {
      const result = results.find(r => r.item_id === item.id);
      if (result) {
        subtotal += parseFloat(result.marks_obtained) || 0;
      }
    }
  });
  return subtotal;
}

export function calculateChecklistSubtotal(criteria, results) {
  let subtotal = 0;
  criteria.forEach(c => {
    if (!c.is_subitem) {
      const result = results.find(r => r.criteria_id === c.id);
      if (result) {
        subtotal += parseFloat(result.marks_obtained) || 0;
      }
    }
  });
  return subtotal;
}

export function calculateGrandTotal(taskSubtotals, checklistSubtotal = 0) {
  const taskTotal = taskSubtotals.reduce((sum, t) => sum + t, 0);
  return taskTotal + checklistSubtotal;
}

export function calculatePercentage(obtained, available) {
  if (available === 0) return 0;
  return (obtained / available) * 100;
}

export function determineCompetency(percentage, threshold = 50) {
  return percentage >= threshold ? 'Competent' : 'Not Yet Competent';
}

export function calculateTotalAvailable(tasks, checklists) {
  let total = 0;
  tasks.forEach(task => {
    (task.items || []).forEach(item => {
      if (!item.is_subcriterion) {
        total += parseFloat(item.max_marks) || 0;
      }
    });
  });
  checklists.forEach(cl => {
    (cl.criteria || []).forEach(c => {
      if (!c.is_subitem) {
        total += parseFloat(c.max_marks) || 0;
      }
    });
  });
  return total;
}

export function validateMarks(marksObtained, maxMarks) {
  const obtained = parseFloat(marksObtained) || 0;
  const max = parseFloat(maxMarks) || 0;
  if (obtained < 0) return { valid: false, error: 'Negative marks not allowed' };
  if (obtained > max) return { valid: false, error: \`Cannot exceed maximum marks (\${max})\` };
  return { valid: true, value: obtained };
}
`,
  },
  {
    path: 'tvet-eassess/lib/pdf-generator.js',
    language: 'javascript',
    category: 'Lib',
    content: `import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, Image, Font
} from '@react-pdf/renderer';

Font.register({
  family: 'Times-Roman',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/timesnewroman/v1/TimesNewRoman.ttf' }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Times-Roman'
  },
  header: {
    textAlign: 'center',
    marginBottom: 15,
    borderBottom: 2,
    borderBottomColor: '#000',
    paddingBottom: 10
  },
  logo: {
    width: 60,
    height: 60,
    alignSelf: 'center',
    marginBottom: 8
  },
  institutionName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  departmentName: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  courseTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 3
  },
  level: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 3
  },
  unitCode: {
    fontSize: 9,
    textAlign: 'center',
    marginBottom: 2
  },
  unitName: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8
  },
  assessmentType: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 10
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 10
  },
  candidateTable: {
    width: '100%',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#000'
  },
  candidateRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000'
  },
  candidateLabel: {
    width: '30%',
    padding: 4,
    fontWeight: 'bold',
    borderRightWidth: 1,
    borderRightColor: '#000',
    backgroundColor: '#f8f9fa'
  },
  candidateValue: {
    width: '70%',
    padding: 4
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 10
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000'
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold'
  },
  itemCol: {
    width: '55%',
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#000'
  },
  marksCol: {
    width: '12%',
    padding: 4,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#000'
  },
  obtainedCol: {
    width: '12%',
    padding: 4,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#000'
  },
  commentsCol: {
    width: '21%',
    padding: 4
  },
  taskHeader: {
    backgroundColor: '#e9ecef',
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 6
  },
  subtotalRow: {
    backgroundColor: '#f8f9fa',
    fontWeight: 'bold'
  },
  grandTotalRow: {
    backgroundColor: '#e9ecef',
    fontWeight: 'bold',
    fontSize: 11
  },
  subcriterion: {
    width: '55%',
    padding: 4,
    paddingLeft: 15,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: '#000'
  },
  outcomeSection: {
    borderWidth: 1,
    borderColor: '#000',
    padding: 10,
    marginTop: 15,
    marginBottom: 15
  },
  outcomeTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    fontSize: 10,
    marginBottom: 8
  },
  checkboxRow: {
    flexDirection: 'row',
    marginBottom: 5
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 30,
    fontSize: 10
  },
  checkboxBox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: '#000',
    marginRight: 5
  },
  checkboxChecked: {
    backgroundColor: '#000'
  },
  feedbackSection: {
    marginTop: 10,
    marginBottom: 10
  },
  feedbackTitle: {
    fontWeight: 'bold',
    fontStyle: 'italic',
    fontSize: 10,
    marginBottom: 3
  },
  feedbackBox: {
    borderWidth: 1,
    borderColor: '#000',
    minHeight: 40,
    padding: 5,
    marginBottom: 8,
    fontSize: 9
  },
  signatureRow: {
    marginTop: 15,
    fontSize: 10
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 8,
    color: '#666'
  },
  instructionText: {
    fontSize: 8,
    fontStyle: 'italic',
    marginBottom: 5
  },
  percentageFormula: {
    textAlign: 'center',
    fontSize: 10,
    marginVertical: 10
  }
});

export function generateAssessmentPDF({ assessment, session, tasks, checklists, results, checklistResults, institution }) {
  const candidate = session?.trainees || session?.trainee || {};

  const calculateSubtotal = (items, itemResults) => {
    return items.reduce((sum, item) => {
      if (!item.is_subcriterion) {
        const r = itemResults?.find(res => res.item_id === item.id);
        return sum + (r ? parseFloat(r.marks_obtained) || 0 : 0);
      }
      return sum;
    }, 0);
  };

  const calculateChecklistSubtotal = (criteria, criteriaResults) => {
    return criteria.reduce((sum, c) => {
      if (!c.is_subitem) {
        const r = criteriaResults?.find(res => res.criteria_id === c.id);
        return sum + (r ? parseFloat(r.marks_obtained) || 0 : 0);
      }
      return sum;
    }, 0);
  };

  const calculateMaxSubtotal = (items) => {
    return items.reduce((sum, item) => {
      if (!item.is_subcriterion) {
        return sum + (parseFloat(item.max_marks) || 0);
      }
      return sum;
    }, 0);
  };

  const calculateChecklistMax = (criteria) => {
    return criteria.reduce((sum, c) => {
      if (!c.is_subitem) {
        return sum + (parseFloat(c.max_marks) || 0);
      }
      return sum;
    }, 0);
  };

  const totalAvailable = tasks.reduce((sum, t) => sum + calculateMaxSubtotal(t.items || t.assessment_items || []), 0) +
    checklists.reduce((sum, cl) => sum + calculateChecklistMax(cl.criteria || cl.checklist_criteria || []), 0);
  const totalObtained = tasks.reduce((sum, t) => sum + calculateSubtotal(t.items || t.assessment_items || [], results), 0) +
    checklists.reduce((sum, cl) => sum + calculateChecklistSubtotal(cl.criteria || cl.checklist_criteria || [], checklistResults), 0);
  const percentage = totalAvailable > 0 ? (totalObtained / totalAvailable) * 100 : 0;
  const threshold = institution?.competency_threshold || 50;
  const outcome = percentage >= threshold ? 'Competent' : 'Not Yet Competent';

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap={false}>
        <View style={styles.header}>
          {institution?.logo_url && <Image src={institution.logo_url} style={styles.logo} />}
          <Text style={styles.institutionName}>{institution?.name || 'THIKA TECHNICAL TRAINING INSTITUTE'}</Text>
          <Text style={styles.departmentName}>{assessment?.department_name || 'ELECTRICAL & ELECTRONICS ENGINEERING'}</Text>
          <Text style={styles.courseTitle}>{assessment?.course_title || 'ELECTRICAL INSTALLATION'}</Text>
          <Text style={styles.level}>{assessment?.level || 'LEVEL 4, 5 & 6'}</Text>
          <Text style={styles.unitCode}>Unit Code: {assessment?.unit_code || 'ENG/CU/EI/CR/03/5/MA'}</Text>
          <Text style={styles.unitName}>{assessment?.unit_name || 'Install Security System'}</Text>
          <Text style={styles.assessmentType}>
            {assessment?.assessment_type || 'PRACTICAL'} ASSESSMENT {assessment?.assessment_number || '1'}
          </Text>
          <Text style={styles.sectionHeading}>OBSERVATION CHECKLIST</Text>
        </View>

        <View style={styles.candidateTable}>
          <View style={styles.candidateRow}>
            <Text style={styles.candidateLabel}>Candidate's Name</Text>
            <Text style={styles.candidateValue}>{candidate?.full_name || ''}</Text>
          </View>
          <View style={styles.candidateRow}>
            <Text style={styles.candidateLabel}>Candidate's Adm. No.</Text>
            <Text style={styles.candidateValue}>{candidate?.admission_number || ''}</Text>
          </View>
          <View style={styles.candidateRow}>
            <Text style={styles.candidateLabel}>Date of Assessment</Text>
            <Text style={styles.candidateValue}>{session?.assessment_date || ''}</Text>
          </View>
        </View>

        <Text style={styles.instructionText}>
          Items to be Evaluated: Please award marks as appropriate. Give a brief comment on your observation.
        </Text>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.itemCol}>Item to be Evaluated</Text>
            <Text style={styles.marksCol}>Marks Available</Text>
            <Text style={styles.obtainedCol}>Marks Obtained</Text>
            <Text style={styles.commentsCol}>Comment</Text>
          </View>
          {checklists.map((cl) => (
            <React.Fragment key={cl.id}>
              {(cl.criteria || cl.checklist_criteria || []).map((c) => (
                <View key={c.id} style={styles.tableRow}>
                  <Text style={c.is_subitem ? styles.subcriterion : styles.itemCol}>
                    {c.is_subitem ? '• ' : ''}{c.item_number}. {c.description}
                  </Text>
                  <Text style={styles.marksCol}>{c.max_marks}</Text>
                  <Text style={styles.obtainedCol}>
                    {(() => {
                      const r = checklistResults?.find(res => res.criteria_id === c.id);
                      return r ? (parseFloat(r.marks_obtained) || 0) : 0;
                    })()}
                  </Text>
                  <Text style={styles.commentsCol}>
                    {(() => {
                      const r = checklistResults?.find(res => res.criteria_id === c.id);
                      return r?.comments || '';
                    })()}
                  </Text>
                </View>
              ))}
              <View style={[styles.tableRow, styles.subtotalRow]}>
                <Text style={{ ...styles.itemCol, textAlign: 'right' }}>Sub-total</Text>
                <Text style={styles.marksCol}>{calculateChecklistMax(cl.criteria || cl.checklist_criteria || [])}</Text>
                <Text style={styles.obtainedCol}>{calculateChecklistSubtotal(cl.criteria || cl.checklist_criteria || [], checklistResults)}</Text>
                <Text style={styles.commentsCol}></Text>
              </View>
            </React.Fragment>
          ))}
        </View>
        <Text style={styles.pageNumber}>Page 1 of 3</Text>
      </Page>

      <Page size="A4" style={styles.page} wrap={false}>
        {tasks.map((task) => {
          const items = task.items || task.assessment_items || [];
          return (
            <View key={task.id} style={{ marginBottom: 15 }}>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.taskHeader]}>
                  <Text style={{ textAlign: 'center', width: '100%' }}>
                    TASK {task.task_number} {task.task_title ? \`- \${task.task_title}\` : ''}
                  </Text>
                </View>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={styles.itemCol}>Criterion</Text>
                  <Text style={styles.marksCol}>Max Marks</Text>
                  <Text style={styles.obtainedCol}>Obtained</Text>
                  <Text style={styles.commentsCol}>Comment</Text>
                </View>
                {items.map((item) => (
                  <View key={item.id} style={styles.tableRow}>
                    <Text style={item.is_subcriterion ? styles.subcriterion : styles.itemCol}>
                      {item.is_subcriterion ? '• ' : ''}{item.item_number}. {item.description}
                      {item.instruction ? \`\\n(\${item.instruction})\` : ''}
                    </Text>
                    <Text style={styles.marksCol}>{item.max_marks}</Text>
                    <Text style={styles.obtainedCol}>
                      {(() => {
                        const r = results?.find(res => res.item_id === item.id);
                        return r ? (parseFloat(r.marks_obtained) || 0) : 0;
                      })()}
                    </Text>
                    <Text style={styles.commentsCol}>
                      {(() => {
                        const r = results?.find(res => res.item_id === item.id);
                        return r?.comments || '';
                      })()}
                    </Text>
                  </View>
                ))}
                <View style={[styles.tableRow, styles.subtotalRow]}>
                  <Text style={{ ...styles.itemCol, textAlign: 'right' }}>Sub-Total {task.task_number}</Text>
                  <Text style={styles.marksCol}>{calculateMaxSubtotal(items)}</Text>
                  <Text style={styles.obtainedCol}>{calculateSubtotal(items, results)}</Text>
                  <Text style={styles.commentsCol}></Text>
                </View>
              </View>
            </View>
          );
        })}
        <Text style={styles.pageNumber}>Page 2 of 3</Text>
      </Page>

      <Page size="A4" style={styles.page} wrap={false}>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.grandTotalRow]}>
            <Text style={{ ...styles.itemCol, textAlign: 'right' }}>GRAND TOTAL</Text>
            <Text style={styles.marksCol}>{totalAvailable}</Text>
            <Text style={styles.obtainedCol}>{totalObtained}</Text>
            <Text style={styles.commentsCol}></Text>
          </View>
        </View>

        <View style={styles.percentageFormula}>
          <Text>
            {totalObtained} / {totalAvailable} × 100 = {percentage.toFixed(2)}%
          </Text>
        </View>

        <View style={styles.outcomeSection}>
          <Text style={styles.outcomeTitle}>ASSESSMENT OUTCOME</Text>
          <Text style={{ fontSize: 10, marginBottom: 8 }}>The candidate was found to be:</Text>
          <View style={styles.checkboxRow}>
            <View style={styles.checkboxOption}>
              <View style={[styles.checkboxBox, outcome === 'Competent' && styles.checkboxChecked]} />
              <Text>Competent</Text>
            </View>
            <View style={styles.checkboxOption}>
              <View style={[styles.checkboxBox, outcome === 'Not Yet Competent' && styles.checkboxChecked]} />
              <Text>Not yet Competent</Text>
            </View>
          </View>
          <Text style={styles.instructionText}>(Please tick as appropriate)</Text>
          <Text style={styles.instructionText}>
            (The candidate is competent if the candidate obtains at least {threshold}%)
          </Text>
        </View>

        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackTitle}>Feedback from the Candidate:</Text>
          <View style={styles.feedbackBox}>
            <Text>{session?.assessment_feedback?.[0]?.feedback_from_candidate || ''}</Text>
          </View>
          <Text style={styles.feedbackTitle}>Feedback to the Candidate:</Text>
          <View style={styles.feedbackBox}>
            <Text>{session?.assessment_feedback?.[0]?.feedback_to_candidate || ''}</Text>
          </View>
        </View>

        <View style={styles.signatureRow}>
          <Text>Candidate Signature: _________________________</Text>
          <Text style={{ marginTop: 10 }}>Date: _________________________</Text>
        </View>
        <View style={{ ...styles.signatureRow, marginTop: 20 }}>
          <Text>Assessor's Signature: _________________________</Text>
          <Text style={{ marginTop: 10 }}>Date: _________________________</Text>
        </View>

        <Text style={styles.pageNumber}>Page 3 of 3</Text>
      </Page>
    </Document>
  );
}
`,
  },
];
