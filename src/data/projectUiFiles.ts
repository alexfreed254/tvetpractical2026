import type { ExportProjectFile } from './projectCoreFiles';

export const PROJECT_APP_FILES: ExportProjectFile[] = [
  {
    path: 'tvet-eassess/app/globals.css',
    language: 'css',
    category: 'App Routes',
    content: `@import 'bootstrap/dist/css/bootstrap.min.css';
@import 'bootstrap-icons/font/bootstrap-icons.css';

:root {
  --a4-width: 210mm;
  --a4-height: 297mm;
  --page-margin: 15mm;
}

* {
  box-sizing: border-box;
}

body {
  font-family: 'Times New Roman', Times, serif;
  background-color: #f0f2f5;
  margin: 0;
  padding: 0;
}

.a4-page {
  width: var(--a4-width);
  min-height: var(--a4-height);
  background: white;
  margin: 20px auto;
  padding: var(--page-margin);
  box-shadow: 0 2px 10px rgba(0,0,0,0.15);
  position: relative;
  page-break-after: always;
}

.a4-page:last-child {
  page-break-after: auto;
}

.institution-header {
  text-align: center;
  margin-bottom: 20px;
  border-bottom: 2px solid #000;
  padding-bottom: 10px;
}

.institution-logo {
  max-width: 80px;
  max-height: 80px;
  margin-bottom: 8px;
}

.institution-name {
  font-size: 18pt;
  font-weight: bold;
  text-transform: uppercase;
  margin: 5px 0;
  letter-spacing: 1px;
}

.department-name {
  font-size: 14pt;
  font-weight: bold;
  text-transform: uppercase;
  margin: 5px 0;
}

.course-title {
  font-size: 12pt;
  font-weight: bold;
  text-transform: uppercase;
  margin: 5px 0;
}

.qualification-level {
  font-size: 11pt;
  font-weight: bold;
  text-transform: uppercase;
  margin: 5px 0;
}

.unit-code {
  font-size: 10pt;
  margin: 3px 0;
}

.unit-name {
  font-size: 11pt;
  font-weight: bold;
  margin: 5px 0;
}

.assessment-type {
  font-size: 12pt;
  font-weight: bold;
  text-transform: uppercase;
  margin: 10px 0 5px 0;
}

.candidate-info-table {
  width: 100%;
  border-collapse: collapse;
  margin: 15px 0;
  font-size: 10pt;
}

.candidate-info-table td {
  border: 1px solid #000;
  padding: 4px 8px;
}

.candidate-info-table .label-cell {
  font-weight: bold;
  width: 180px;
  background-color: #f8f9fa;
}

.assessment-table {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0;
  font-size: 9pt;
}

.assessment-table th,
.assessment-table td {
  border: 1px solid #000;
  padding: 4px 6px;
  vertical-align: top;
}

.assessment-table th {
  background-color: #f0f0f0;
  font-weight: bold;
  text-align: center;
}

.assessment-table .item-column { width: 55%; }
.assessment-table .marks-column { width: 12%; text-align: center; }
.assessment-table .obtained-column { width: 12%; text-align: center; }
.assessment-table .comments-column { width: 21%; }

.subtotal-row { font-weight: bold; background-color: #f8f9fa; }
.grand-total-row { font-weight: bold; background-color: #e9ecef; font-size: 10pt; }

.subcriterion {
  padding-left: 20px;
  font-size: 9pt;
}

.subcriterion::before {
  content: '• ';
}

.outcome-section {
  border: 1px solid #000;
  padding: 10px;
  margin: 15px 0;
}

.outcome-title {
  font-weight: bold;
  text-align: center;
  text-transform: uppercase;
  margin-bottom: 10px;
  font-size: 10pt;
}

.checkbox-option {
  display: inline-block;
  margin-right: 30px;
  font-size: 10pt;
}

.checkbox-box {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 1px solid #000;
  margin-right: 5px;
  vertical-align: middle;
}

.feedback-section { margin: 15px 0; font-size: 10pt; }
.feedback-title { font-weight: bold; font-style: italic; margin-bottom: 5px; }
.feedback-box { border: 1px solid #000; min-height: 60px; padding: 5px; margin-bottom: 10px; }
.signature-line { border-bottom: 1px solid #000; display: inline-block; min-width: 200px; margin: 0 10px; }
.signature-row { margin: 15px 0; font-size: 10pt; }

.builder-container {
  display: flex;
  gap: 20px;
  padding: 20px;
  min-height: 100vh;
}

.builder-left-panel {
  flex: 1;
  min-width: 400px;
  max-width: 50%;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow-y: auto;
  max-height: 100vh;
}

.builder-right-panel {
  flex: 1;
  min-width: 400px;
  background: #e9ecef;
  padding: 20px;
  overflow-y: auto;
  max-height: 100vh;
}

.digital-assessment { max-width: 1200px; margin: 0 auto; padding: 20px; }
.marks-input { width: 80px; text-align: center; border: 1px solid #ced4da; border-radius: 4px; padding: 4px; }

@media print {
  body { background: white; }
  .a4-page { margin: 0; box-shadow: none; page-break-after: always; }
  .no-print { display: none !important; }
}

.page-number { position: absolute; bottom: 10mm; right: 15mm; font-size: 9pt; color: #666; }
.section-heading { font-weight: bold; text-align: center; text-transform: uppercase; font-size: 10pt; margin: 10px 0 5px 0; }
.instruction-text { font-size: 9pt; font-style: italic; margin: 5px 0; color: #333; }
.percentage-formula { text-align: center; font-size: 10pt; margin: 10px 0; font-family: 'Times New Roman', serif; }
.percentage-formula .fraction { display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; margin: 0 5px; }
.percentage-formula .numerator { border-bottom: 1px solid #000; padding: 0 5px 2px 5px; }
.percentage-formula .denominator { padding: 2px 5px 0 5px; }
`,
  },
  {
    path: 'tvet-eassess/app/layout.js',
    language: 'javascript',
    category: 'App Routes',
    content: `import './globals.css';

export const metadata = {
  title: 'TVET e-ASSESS - Assessment Management System',
  description: 'Competency-Based Education and Training Assessment System'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark no-print">
          <div className="container-fluid">
            <a className="navbar-brand" href="/">
              <i className="bi bi-mortarboard-fill"></i> TVET e-ASSESS
            </a>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav">
                <li className="nav-item">
                  <a className="nav-link" href="/assessments">
                    <i className="bi bi-folder"></i> Assessments
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/assessments/builder">
                    <i className="bi bi-plus-circle"></i> Create Assessment
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/assessments/sessions">
                    <i className="bi bi-clipboard-data"></i> Sessions
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
`,
  },
  {
    path: 'tvet-eassess/app/page.js',
    language: 'javascript',
    category: 'App Routes',
    content: `export default function Home() {
  return (
    <div className="container mt-5">
      <div className="text-center">
        <h1 className="display-4"><i className="bi bi-mortarboard-fill"></i> TVET e-ASSESS</h1>
        <p className="lead">Competency-Based Education and Training Assessment Management System</p>
        <hr />
        <div className="row mt-4">
          <div className="col-md-4">
            <div className="card h-100">
              <div className="card-body text-center">
                <i className="bi bi-file-earmark-text display-4 text-primary"></i>
                <h5 className="card-title mt-3">Create Assessments</h5>
                <p className="card-text">Build professional practical assessment papers with tasks, criteria and observation checklists.</p>
                <a href="/assessments/builder" className="btn btn-primary">
                  <i className="bi bi-plus-circle"></i> New Assessment
                </a>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100">
              <div className="card-body text-center">
                <i className="bi bi-clipboard-data display-4 text-success"></i>
                <h5 className="card-title mt-3">Conduct Assessments</h5>
                <p className="card-text">Digitally assess trainees with automatic calculations and competency determination.</p>
                <a href="/assessments" className="btn btn-success">
                  <i className="bi bi-play-circle"></i> Start Assessment
                </a>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100">
              <div className="card-body text-center">
                <i className="bi bi-file-pdf display-4 text-danger"></i>
                <h5 className="card-title mt-3">Generate Reports</h5>
                <p className="card-text">Generate official PDF assessment documents matching institutional standards.</p>
                <a href="/assessments/sessions" className="btn btn-danger">
                  <i className="bi bi-file-pdf"></i> View Reports
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`,
  },
  {
    path: 'tvet-eassess/app/assessments/page.js',
    language: 'javascript',
    category: 'App Routes',
    content: `'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AssessmentsListPage() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    const { data } = await supabase
      .from('assessments')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setAssessments(data);
    setLoading(false);
  };

  if (loading) return <div className="container mt-4">Loading assessments...</div>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Assessments</h2>
        <a href="/assessments/builder" className="btn btn-primary">
          <i className="bi bi-plus-circle"></i> New Assessment
        </a>
      </div>
      <div className="row g-3">
        {assessments.map((a) => (
          <div key={a.id} className="col-md-6">
            <div className="card h-100">
              <div className="card-body">
                <h5>{a.title || a.unit_name}</h5>
                <p className="text-muted small mb-2">
                  {a.unit_code} • {a.assessment_type} ASSESSMENT {a.assessment_number}
                </p>
                <div className="d-flex gap-2">
                  <a href={\`/assessments/\${a.id}\`} className="btn btn-outline-secondary btn-sm">Preview Paper</a>
                  <a href={\`/assessments/\${a.id}/execute\`} className="btn btn-success btn-sm">Conduct Assessment</a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`,
  },
  {
    path: 'tvet-eassess/app/assessments/builder/page.js',
    language: 'javascript',
    category: 'App Routes',
    content: `'use client';

import React, { useState } from 'react';
import AssessmentBuilder from '@/components/AssessmentBuilder';
import LivePreview from '@/components/LivePreview';
import { supabase } from '@/lib/supabase';

export default function BuilderPage() {
  const [assessmentId, setAssessmentId] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [checklists, setChecklists] = useState([]);

  const handleAssessmentUpdate = (id) => {
    setAssessmentId(id);
    loadAssessment(id);
  };

  const loadAssessment = async (id) => {
    const { data } = await supabase
      .from('assessments')
      .select('*, assessment_tasks(*, assessment_items(*)), observation_checklists(*, checklist_criteria(*))')
      .eq('id', id)
      .single();

    if (data) {
      setAssessment(data);
      setTasks(data.assessment_tasks?.sort((a, b) => a.sort_order - b.sort_order) || []);
      setChecklists(data.observation_checklists?.sort((a, b) => a.sort_order - b.sort_order) || []);
    }
  };

  return (
    <div className="builder-container">
      <div className="builder-left-panel">
        <AssessmentBuilder
          assessmentId={assessmentId}
          onAssessmentUpdate={handleAssessmentUpdate}
        />
      </div>
      <div className="builder-right-panel">
        <LivePreview
          assessment={assessment}
          tasks={tasks}
          checklists={checklists}
        />
      </div>
    </div>
  );
}
`,
  },
  {
    path: 'tvet-eassess/app/assessments/[id]/page.js',
    language: 'javascript',
    category: 'App Routes',
    content: `'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AssessmentPaper from '@/components/AssessmentPaper';
import { supabase } from '@/lib/supabase';

export default function AssessmentDetailPage() {
  const params = useParams();
  const [assessment, setAssessment] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [checklists, setChecklists] = useState([]);

  useEffect(() => {
    loadAssessment();
  }, [params.id]);

  const loadAssessment = async () => {
    const { data } = await supabase
      .from('assessments')
      .select('*, assessment_tasks(*, assessment_items(*)), observation_checklists(*, checklist_criteria(*))')
      .eq('id', params.id)
      .single();

    if (data) {
      setAssessment(data);
      setTasks((data.assessment_tasks || []).map(t => ({ ...t, items: t.assessment_items || [] })));
      setChecklists((data.observation_checklists || []).map(c => ({ ...c, criteria: c.checklist_criteria || [] })));
    }
  };

  if (!assessment) return <div className="container mt-4">Loading...</div>;

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-3 no-print">
        <h3>{assessment.title}</h3>
        <div className="d-flex gap-2">
          <a href={\`/assessments/\${params.id}/execute\`} className="btn btn-success">Start Session</a>
          <button className="btn btn-outline-secondary" onClick={() => window.print()}>Print Paper</button>
        </div>
      </div>
      <AssessmentPaper assessment={assessment} tasks={tasks} checklists={checklists} results={[]} checklistResults={[]} pageNumber={1} totalPages={3} />
      <AssessmentPaper assessment={assessment} tasks={tasks} checklists={checklists} results={[]} checklistResults={[]} pageNumber={2} totalPages={3} />
      <AssessmentPaper assessment={assessment} tasks={tasks} checklists={checklists} results={[]} checklistResults={[]} pageNumber={3} totalPages={3} />
    </div>
  );
}
`,
  },
  {
    path: 'tvet-eassess/app/assessments/[id]/execute/page.js',
    language: 'javascript',
    category: 'App Routes',
    content: `'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DigitalAssessment from '@/components/DigitalAssessment';
import { supabase } from '@/lib/supabase';

export default function ExecuteAssessmentPage() {
  const params = useParams();
  const [sessionId, setSessionId] = useState(null);
  const [trainees, setTrainees] = useState([]);
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrainees();
  }, []);

  const loadTrainees = async () => {
    const { data } = await supabase
      .from('trainees')
      .select('*')
      .order('full_name');

    if (data) setTrainees(data);
    setLoading(false);
  };

  const createSession = async () => {
    if (!selectedTrainee) return;

    const { data, error } = await supabase
      .from('assessment_sessions')
      .insert([{
        assessment_id: params.id,
        trainee_id: selectedTrainee,
        assessment_date: new Date().toISOString().split('T')[0],
        status: 'in_progress',
        competency_outcome: 'Pending'
      }])
      .select()
      .single();

    if (!error && data) setSessionId(data.id);
  };

  if (loading) return <div className="text-center p-5">Loading...</div>;

  if (!sessionId) {
    return (
      <div className="container mt-4">
        <h2><i className="bi bi-play-circle"></i> Start Assessment</h2>
        <div className="card mt-3">
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">Select Trainee</label>
              <select className="form-select"
                value={selectedTrainee || ''}
                onChange={(e) => setSelectedTrainee(e.target.value)}>
                <option value="">-- Select Trainee --</option>
                {trainees.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.full_name} ({t.admission_number})
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" onClick={createSession} disabled={!selectedTrainee}>
              <i className="bi bi-play"></i> Start Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DigitalAssessment
      sessionId={sessionId}
      assessmentId={params.id}
    />
  );
}
`,
  },
  {
    path: 'tvet-eassess/app/assessments/sessions/page.js',
    language: 'javascript',
    category: 'App Routes',
    content: `'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SessionsListPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const { data } = await supabase
      .from('assessment_sessions')
      .select('*, trainees(*), assessments(*)')
      .order('updated_at', { ascending: false });
    if (data) setSessions(data);
    setLoading(false);
  };

  if (loading) return <div className="container mt-4">Loading sessions...</div>;

  return (
    <div className="container mt-4">
      <h2>Assessment Sessions</h2>
      <table className="table table-bordered mt-3">
        <thead className="table-light">
          <tr>
            <th>Trainee</th>
            <th>Adm. No.</th>
            <th>Assessment</th>
            <th>Score</th>
            <th>Outcome</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id}>
              <td>{s.trainees?.full_name}</td>
              <td>{s.trainees?.admission_number}</td>
              <td>{s.assessments?.title}</td>
              <td>{s.grand_total_obtained} / {s.grand_total_available} ({Number(s.percentage || 0).toFixed(1)}%)</td>
              <td>{s.competency_outcome}</td>
              <td>{s.status}</td>
              <td>
                <a href={\`/assessments/sessions/\${s.id}\`} className="btn btn-sm btn-outline-primary">View Report</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
`,
  },
  {
    path: 'tvet-eassess/app/assessments/sessions/[id]/page.js',
    language: 'javascript',
    category: 'App Routes',
    content: `'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AssessmentPaper from '@/components/AssessmentPaper';
import { supabase } from '@/lib/supabase';

export default function SessionReportPage() {
  const params = useParams();
  const [session, setSession] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [results, setResults] = useState([]);
  const [checklistResults, setChecklistResults] = useState([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadSession();
  }, [params.id]);

  const loadSession = async () => {
    const { data: s } = await supabase
      .from('assessment_sessions')
      .select('*, trainees(*), assessments(*), assessment_feedback(*)')
      .eq('id', params.id)
      .single();
    if (!s) return;
    setSession(s);

    const [{ data: t }, { data: cl }, { data: r }, { data: cr }] = await Promise.all([
      supabase.from('assessment_tasks').select('*, assessment_items(*)').eq('assessment_id', s.assessment_id).order('sort_order'),
      supabase.from('observation_checklists').select('*, checklist_criteria(*)').eq('assessment_id', s.assessment_id).order('sort_order'),
      supabase.from('criterion_results').select('*').eq('session_id', params.id),
      supabase.from('checklist_results').select('*').eq('session_id', params.id),
    ]);

    setTasks((t || []).map(task => ({ ...task, items: task.assessment_items || [] })));
    setChecklists((cl || []).map(list => ({ ...list, criteria: list.checklist_criteria || [] })));
    setResults(r || []);
    setChecklistResults(cr || []);
  };

  const handleGeneratePdf = async () => {
    setGenerating(true);
    const res = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: params.id })
    });
    const json = await res.json();
    setGenerating(false);
    if (json.url) window.open(json.url, '_blank');
  };

  if (!session) return <div className="container mt-4">Loading session report...</div>;

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-3 no-print">
        <h3>Session Report — {session.trainees?.full_name}</h3>
        <div className="d-flex gap-2">
          <button className="btn btn-danger" onClick={handleGeneratePdf} disabled={generating}>
            {generating ? 'Generating PDF...' : 'Generate Official PDF'}
          </button>
          <button className="btn btn-outline-secondary" onClick={() => window.print()}>Print</button>
        </div>
      </div>
      <AssessmentPaper assessment={session.assessments} session={session} tasks={tasks} checklists={checklists} results={results} checklistResults={checklistResults} pageNumber={1} totalPages={3} />
      <AssessmentPaper assessment={session.assessments} session={session} tasks={tasks} checklists={checklists} results={results} checklistResults={checklistResults} pageNumber={2} totalPages={3} />
      <AssessmentPaper assessment={session.assessments} session={session} tasks={tasks} checklists={checklists} results={results} checklistResults={checklistResults} pageNumber={3} totalPages={3} />
    </div>
  );
}
`,
  },
  {
    path: 'tvet-eassess/app/api/assessments/route.js',
    language: 'javascript',
    category: 'API Routes',
    content: `import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('assessments')
    .select('*, assessment_tasks(*, assessment_items(*)), observation_checklists(*, checklist_criteria(*))')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { data, error } = await supabase
      .from('assessments')
      .insert([body])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
`,
  },
  {
    path: 'tvet-eassess/app/api/sessions/route.js',
    language: 'javascript',
    category: 'API Routes',
    content: `import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const assessmentId = searchParams.get('assessmentId');

  let query = supabase
    .from('assessment_sessions')
    .select('*, trainees(*), assessments(*)')
    .order('updated_at', { ascending: false });

  if (assessmentId) {
    query = query.eq('assessment_id', assessmentId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { data, error } = await supabase
      .from('assessment_sessions')
      .insert([body])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
`,
  },
  {
    path: 'tvet-eassess/app/api/generate-pdf/route.js',
    language: 'javascript',
    category: 'API Routes',
    content: `import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { renderToBuffer } from '@react-pdf/renderer';
import { generateAssessmentPDF } from '@/lib/pdf-generator';

export async function POST(request) {
  try {
    const { sessionId } = await request.json();

    const { data: session, error: sessionError } = await supabase
      .from('assessment_sessions')
      .select(\`
        *,
        trainees(*),
        assessments(*),
        assessment_feedback(*)
      \`)
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;

    const { data: tasks } = await supabase
      .from('assessment_tasks')
      .select('*, assessment_items(*)')
      .eq('assessment_id', session.assessment_id)
      .order('sort_order');

    const { data: checklists } = await supabase
      .from('observation_checklists')
      .select('*, checklist_criteria(*)')
      .eq('assessment_id', session.assessment_id)
      .order('sort_order');

    const { data: results } = await supabase
      .from('criterion_results')
      .select('*')
      .eq('session_id', sessionId);

    const { data: checklistResults } = await supabase
      .from('checklist_results')
      .select('*')
      .eq('session_id', sessionId);

    const { data: institution } = await supabase
      .from('institutions')
      .select('*')
      .eq('id', session.assessments.institution_id)
      .single();

    const pdfDocument = generateAssessmentPDF({
      assessment: session.assessments,
      session,
      tasks: tasks || [],
      checklists: checklists || [],
      results: results || [],
      checklistResults: checklistResults || [],
      institution
    });

    const pdfBuffer = await renderToBuffer(pdfDocument);

    const fileName = \`assessments/\${sessionId}/assessment_\${session.trainees?.admission_number || 'unknown'}.pdf\`;
    const { error: uploadError } = await supabase.storage
      .from('generated-documents')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('generated-documents')
      .getPublicUrl(fileName);

    await supabase.from('generated_documents').insert({
      session_id: sessionId,
      document_type: 'assessment_pdf',
      storage_path: fileName,
      public_url: urlData.publicUrl
    });

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: fileName
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
`,
  },
];
