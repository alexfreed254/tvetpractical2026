import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardEdit,
  Download,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  FileWarning,
  Printer,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  computeMarksheetData,
  downloadCsvMarksheet,
  downloadExcelMarksheet,
} from '../lib/calculations';
import { useAssessmentStore } from '../store/useAssessmentStore';
import type {
  AppRoute,
  AssessmentSession,
  SessionStatus,
  VerificationStatus,
} from '../types/tvet';
import { AssessmentPaper } from './AssessmentPaper';

interface SessionsViewProps {
  onNavigate: (
    route: AppRoute,
    params?: { assessmentId?: string; sessionId?: string },
  ) => void;
}

type HubTab = 'sessions' | 'marksheet' | 'reports' | 'corrections';
type ReportType = 'summary' | 'gaps' | 'evidence' | 'audit';

export function SessionsView({ onNavigate }: SessionsViewProps) {
  const {
    institution,
    departments,
    courses,
    classes,
    units,
    assessments,
    trainees,
    sessions,
    auditLogs,
    activeUser,
    permissions,
    verifySession,
    releaseSessionResults,
    recordExternalFinding,
    createReassessmentSession,
    submitCorrectionRequest,
    reviewCorrectionRequest,
  } = useAssessmentStore();

  const [hubTab, setHubTab] = useState<HubTab>('sessions');

  // 13-dimension repository filters (Module 7.9)
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | SessionStatus>('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [cycleFilter, setCycleFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [termFilter, setTermFilter] = useState('ALL');
  const [assessorFilter, setAssessorFilter] = useState('ALL');

  // Marksheet specific filters (Module 7.8)
  const [msCourse, setMsCourse] = useState(courses[0]?.title || 'ALL');
  const [msClass, setMsClass] = useState('ALL');
  const [msUnit, setMsUnit] = useState('ALL');
  const [msYear, setMsYear] = useState(institution.active_academic_year || '2026');
  const [msTerm, setMsTerm] = useState(institution.active_term || 'Term 3');

  // Report sub-view
  const [reportType, setReportType] = useState<ReportType>('summary');

  // Modals
  const [inspectingSession, setInspectingSession] =
    useState<AssessmentSession | null>(null);
  const [verifyingSession, setVerifyingSession] =
    useState<AssessmentSession | null>(null);
  const [verifierName, setVerifierName] = useState(activeUser.full_name);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verifyError, setVerifyError] = useState('');

  // External verifier finding modal
  const [externalSession, setExternalSession] =
    useState<AssessmentSession | null>(null);
  const [externalNotes, setExternalNotes] = useState('');

  // Correction request modal
  const [correctionSession, setCorrectionSession] =
    useState<AssessmentSession | null>(null);
  const [correctionTargetKey, setCorrectionTargetKey] = useState('');
  const [correctionMarks, setCorrectionMarks] = useState('0');
  const [correctionReason, setCorrectionReason] = useState('');

  const [actionFeedback, setActionFeedback] = useState('');

  const uniqueAssessors = useMemo(
    () =>
      Array.from(
        new Set(sessions.map((s) => s.assessor_name).filter(Boolean)),
      ),
    [sessions],
  );

  // Scoped sessions for Trainee role vs Staff/Verifiers/Management
  const roleScopedSessions = useMemo(() => {
    if (!permissions.isTraineeOnly) return sessions;
    const matchedTrainee =
      trainees.find(
        (t) =>
          t.admission_number.toLowerCase() ===
            activeUser.staff_or_adm_no.toLowerCase() ||
          t.full_name.toLowerCase() === activeUser.full_name.toLowerCase(),
      ) || trainees[0];
    return sessions.filter(
      (s) => s.trainee_id === matchedTrainee?.id && Boolean(s.results_released),
    );
  }, [permissions.isTraineeOnly, sessions, trainees, activeUser]);

  const filtered = roleScopedSessions.filter((s) => {
    const trainee = trainees.find((t) => t.id === s.trainee_id);
    const assessment = assessments.find((a) => a.id === s.assessment_id);
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (deptFilter !== 'ALL' && assessment?.department_name !== deptFilter)
      return false;
    if (courseFilter !== 'ALL' && assessment?.course_title !== courseFilter)
      return false;
    if (
      classFilter !== 'ALL' &&
      (assessment?.class_name || trainee?.class_name) !== classFilter
    )
      return false;
    if (unitFilter !== 'ALL' && assessment?.unit_code !== unitFilter)
      return false;
    if (typeFilter !== 'ALL' && assessment?.assessment_type !== typeFilter)
      return false;
    if (levelFilter !== 'ALL' && assessment?.level !== levelFilter) return false;
    if (cycleFilter !== 'ALL' && assessment?.cycle !== cycleFilter) return false;
    if (yearFilter !== 'ALL' && assessment?.academic_year !== yearFilter)
      return false;
    if (termFilter !== 'ALL' && assessment?.term !== termFilter) return false;
    if (assessorFilter !== 'ALL' && s.assessor_name !== assessorFilter)
      return false;

    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (trainee?.full_name || '').toLowerCase().includes(q) ||
      (trainee?.admission_number || '').toLowerCase().includes(q) ||
      (assessment?.unit_code || '').toLowerCase().includes(q) ||
      (assessment?.title || '').toLowerCase().includes(q) ||
      String(assessment?.assessment_number || '').includes(q)
    );
  });

  // Marksheet dataset
  const marksheetTrainees = useMemo(
    () =>
      trainees.filter((t) => {
        if (msCourse !== 'ALL' && t.course_title !== msCourse) return false;
        if (msClass !== 'ALL' && t.class_name !== msClass) return false;
        return true;
      }),
    [trainees, msCourse, msClass],
  );

  const marksheetAssessments = useMemo(
    () =>
      assessments.filter((a) => {
        if (msCourse !== 'ALL' && a.course_title !== msCourse) return false;
        if (msUnit !== 'ALL' && a.unit_code !== msUnit) return false;
        if (msYear !== 'ALL' && a.academic_year !== msYear) return false;
        if (msTerm !== 'ALL' && a.term !== msTerm) return false;
        return true;
      }),
    [assessments, msCourse, msUnit, msYear, msTerm],
  );

  const marksheetResultSet = useMemo(
    () =>
      computeMarksheetData(
        marksheetTrainees,
        marksheetAssessments,
        sessions,
        institution.oral_weight_percent ?? 30,
        institution.practical_weight_percent ?? 70,
      ),
    [
      marksheetTrainees,
      marksheetAssessments,
      sessions,
      institution.oral_weight_percent,
      institution.practical_weight_percent,
    ],
  );

  const marksheetMeta = {
    department:
      assessments.find((a) => a.course_title === msCourse)?.department_name ||
      institution.department,
    course: msCourse === 'ALL' ? 'All Courses' : msCourse,
    className: msClass === 'ALL' ? 'All Classes' : msClass,
    unit:
      msUnit === 'ALL'
        ? 'All Units Consolidated'
        : units.find((u) => u.code === msUnit)?.name || msUnit,
    academicYear: msYear === 'ALL' ? 'All Years' : msYear,
    term: msTerm === 'ALL' ? 'All Terms' : msTerm,
  };

  // All evidence across sessions
  const allEvidence = useMemo(
    () => sessions.flatMap((s) => s.evidence || []),
    [sessions],
  );

  // All correction requests across sessions
  const allCorrections = useMemo(
    () =>
      sessions.flatMap((s) =>
        (s.correction_requests || []).map((req) => ({
          req,
          session: s,
          trainee: trainees.find((t) => t.id === s.trainee_id),
          assessment: assessments.find((a) => a.id === s.assessment_id),
        })),
      ),
    [sessions, trainees, assessments],
  );

  const showToast = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(''), 3000);
  };

  const handleVerifyDecision = (decision: VerificationStatus) => {
    if (!verifyingSession) return;
    setVerifyError('');
    const result = verifySession(
      verifyingSession.id,
      decision,
      verificationNotes,
      verifierName || activeUser.full_name,
    );
    if (!result.ok) {
      setVerifyError(result.error || 'Verification failed');
      return;
    }
    setVerifyingSession(null);
    setVerificationNotes('');
    showToast(`Session marked ${decision}`);
  };

  const handleSaveExternalFinding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!externalSession || !externalNotes.trim()) return;
    recordExternalFinding(externalSession.id, externalNotes.trim());
    setExternalSession(null);
    setExternalNotes('');
    showToast('External verification finding recorded');
  };

  const handleSubmitCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionSession || !correctionTargetKey || !correctionReason.trim())
      return;
    const [targetType, targetId] = correctionTargetKey.split('::') as [
      'task_item' | 'checklist_criterion',
      string,
    ];
    const assess = assessments.find((a) => a.id === correctionSession.assessment_id);
    if (!assess) return;

    let label = targetId;
    let prevMarks = 0;
    if (targetType === 'task_item') {
      const item = assess.tasks
        .flatMap((t) => t.items)
        .find((i) => i.id === targetId);
      label = item ? `${item.item_number}. ${item.description}` : targetId;
      prevMarks =
        correctionSession.results.find((r) => r.item_id === targetId)
          ?.marks_obtained ?? 0;
    } else {
      const crit = assess.checklists
        .flatMap((c) => c.criteria)
        .find((c) => c.id === targetId);
      label = crit ? `Checklist ${crit.item_number}. ${crit.description}` : targetId;
      prevMarks =
        correctionSession.checklist_results.find((r) => r.criteria_id === targetId)
          ?.marks_obtained ?? 0;
    }

    submitCorrectionRequest(correctionSession.id, {
      target_type: targetType,
      target_id: targetId,
      target_label: label,
      previous_marks: prevMarks,
      requested_marks: Math.max(0, parseFloat(correctionMarks) || 0),
      reason: correctionReason.trim(),
    });
    setCorrectionSession(null);
    setCorrectionReason('');
    showToast('Mark correction request submitted for approval');
  };

  const inspectedAssessment = inspectingSession
    ? assessments.find((a) => a.id === inspectingSession.assessment_id)
    : null;
  const inspectedTrainee = inspectingSession
    ? trainees.find((t) => t.id === inspectingSession.trainee_id)
    : null;

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/90 no-print">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2744]">
            Marksheets, Verification &amp; Institutional Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Audit assessment sessions, perform internal &amp; external verification, generate automated Oral/Practical marksheets, and manage reassessments or mark corrections.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {actionFeedback && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {actionFeedback}
            </span>
          )}
          {permissions.canConductAssessments && (
            <button
              type="button"
              onClick={() => onNavigate('execute')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              New Evaluation Session
            </button>
          )}
        </div>
      </div>

      {/* Hub Segmented Tabs */}
      {!permissions.isTraineeOnly && (
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg self-start no-print">
          {(
            [
              {
                key: 'sessions',
                label: `Sessions & Verification (${filtered.length})`,
              },
              {
                key: 'marksheet',
                label: 'Automated Marksheet (Oral + Practical)',
              },
              {
                key: 'reports',
                label: `Reports, Evidence (${allEvidence.length}) & Audit`,
              },
              {
                key: 'corrections',
                label: `Corrections Queue (${allCorrections.filter((c) => c.req.status === 'pending').length} pending)`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setHubTab(tab.key)}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                hubTab === tab.key
                  ? 'bg-white text-[#0F2744] shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* TAB 1: SESSIONS & VERIFICATION */}
      {(hubTab === 'sessions' || permissions.isTraineeOnly) && (
        <div className="space-y-4 no-print">
          {/* Multi-filter Bar (Module 7.9) */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search trainee name, admission no., unit code, or assessment no..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-md">
                {(
                  [
                    { key: 'ALL', label: 'All' },
                    { key: 'in_progress', label: 'In Progress' },
                    { key: 'submitted', label: 'Submitted' },
                    { key: 'verified', label: 'Verified' },
                    { key: 'returned', label: 'Returned' },
                    { key: 'rejected', label: 'Rejected' },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setStatusFilter(st.key)}
                    className={`px-2.5 py-1 text-xs font-medium rounded cursor-pointer ${
                      statusFilter === st.key
                        ? 'bg-white text-[#0F2744] shadow-sm font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {!permissions.isTraineeOnly && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-100">
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded"
                >
                  <option value="ALL">All Courses</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.title}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded"
                >
                  <option value="ALL">All Classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  value={unitFilter}
                  onChange={(e) => setUnitFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded"
                >
                  <option value="ALL">All Units</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.code}>
                      {u.code}
                    </option>
                  ))}
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded"
                >
                  <option value="ALL">All Types</option>
                  <option value="PRACTICAL">PRACTICAL</option>
                  <option value="ORAL">ORAL</option>
                  <option value="THEORY">THEORY</option>
                  <option value="PROJECT">PROJECT</option>
                </select>
                <select
                  value={assessorFilter}
                  onChange={(e) => setAssessorFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded"
                >
                  <option value="ALL">All Assessors</option>
                  {uniqueAssessors.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded"
                >
                  <option value="ALL">All Levels</option>
                  <option value="LEVEL 4">LEVEL 4</option>
                  <option value="LEVEL 5">LEVEL 5</option>
                  <option value="LEVEL 6">LEVEL 6</option>
                  <option value="LEVEL 4, 5 & 6">LEVEL 4, 5 &amp; 6</option>
                </select>
                <select
                  value={cycleFilter}
                  onChange={(e) => setCycleFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded"
                >
                  <option value="ALL">All Cycles</option>
                  {['Cycle 1', 'Cycle 2', 'Cycle 3', 'Cycle 4', 'Cycle 5'].map(
                    (cy) => (
                      <option key={cy} value={cy}>
                        {cy}
                      </option>
                    ),
                  )}
                </select>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded"
                >
                  <option value="ALL">All Academic Years</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
                <select
                  value={termFilter}
                  onChange={(e) => setTermFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded"
                >
                  <option value="ALL">All Terms</option>
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              </div>
            )}
          </div>

          {/* Sessions Table */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500">
                {permissions.isTraineeOnly
                  ? 'No released assessment results are available for your account yet.'
                  : 'No assessment sessions match the selected filters.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/70 text-xs font-semibold text-[#0F2744]">
                      <th className="py-3 px-4">Candidate &amp; Class</th>
                      <th className="py-3 px-4">Assessment &amp; Assessor</th>
                      <th className="py-3 px-4 text-right">Score</th>
                      <th className="py-3 px-4">Outcome</th>
                      <th className="py-3 px-4">Verification &amp; Release</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {filtered.map((session) => {
                      const trainee = trainees.find(
                        (t) => t.id === session.trainee_id,
                      );
                      const assessment = assessments.find(
                        (a) => a.id === session.assessment_id,
                      );
                      const isCompetent =
                        session.competency_outcome === 'Competent' ||
                        session.competency_outcome === 'Proficient' ||
                        session.competency_outcome === 'Mastery';

                      return (
                        <tr
                          key={session.id}
                          className="hover:bg-slate-50/60 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">
                              {trainee?.full_name || 'Candidate'}
                            </div>
                            <div className="text-xs font-mono text-slate-500">
                              {trainee?.admission_number} · {trainee?.class_name}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs">
                            <div className="font-medium text-slate-800">
                              [{assessment?.assessment_type}{' '}
                              {assessment?.assessment_number}] {assessment?.unit_name}
                            </div>
                            <div className="text-slate-500 mt-0.5">
                              <span className="font-mono">{assessment?.unit_code}</span>{' '}
                              · {session.assessment_date} · Assessor:{' '}
                              {session.assessor_name}
                              {session.attempt_number && session.attempt_number > 1
                                ? ` · Attempt #${session.attempt_number}`
                                : ''}
                            </div>
                            {(session.evidence?.length || 0) > 0 && (
                              <div className="text-blue-700 font-medium mt-0.5">
                                {session.evidence?.length} evidence attachment(s)
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right tabular-nums">
                            <div className="font-semibold text-slate-900">
                              {session.percentage.toFixed(1)}%
                            </div>
                            <div className="text-xs text-slate-500">
                              {session.grand_total_obtained} /{' '}
                              {session.grand_total_available}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-semibold">
                            {isCompetent ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {session.competency_outcome}
                              </span>
                            ) : session.competency_outcome === 'Not Yet Competent' ? (
                              <span className="inline-flex items-center gap-1 text-red-700">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Not Yet Competent
                              </span>
                            ) : (
                              <span className="text-slate-500">Pending</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-xs">
                            <div
                              className={`font-semibold uppercase ${
                                session.status === 'verified'
                                  ? 'text-emerald-700'
                                  : session.status === 'submitted'
                                    ? 'text-blue-700'
                                    : session.status === 'returned'
                                      ? 'text-amber-700'
                                      : session.status === 'rejected'
                                        ? 'text-red-700'
                                        : 'text-slate-700'
                              }`}
                            >
                              {session.status.replace('_', ' ')}
                            </div>
                            {session.verifier_name && (
                              <div className="text-slate-500 mt-0.5">
                                IV: {session.verifier_name}
                              </div>
                            )}
                            {session.external_verifier_name && (
                              <div className="text-indigo-700 mt-0.5">
                                EV: {session.external_verifier_name}
                              </div>
                            )}
                            <div className="text-slate-500 mt-0.5">
                              {session.results_released ? 'Released' : 'Not Released'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              {permissions.canConductAssessments &&
                                (session.status === 'in_progress' ||
                                  session.status === 'returned') && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onNavigate('execute', {
                                        sessionId: session.id,
                                        assessmentId: session.assessment_id,
                                      })
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
                                  >
                                    <ClipboardEdit className="w-3.5 h-3.5" />
                                    Grade
                                  </button>
                                )}

                              {permissions.canInternalVerify &&
                                session.status === 'submitted' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setVerifyError('');
                                      setVerifyingSession(session);
                                      setVerifierName(activeUser.full_name);
                                      setVerificationNotes(
                                        session.verification_notes || '',
                                      );
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 rounded-md hover:bg-emerald-800 whitespace-nowrap shrink-0 cursor-pointer"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Verify
                                  </button>
                                )}

                              {permissions.canReleaseResults &&
                                session.status === 'verified' &&
                                !session.results_released && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      releaseSessionResults(session.id);
                                      showToast('Assessment results released');
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-blue-700 rounded-md hover:bg-blue-800 whitespace-nowrap shrink-0 cursor-pointer"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    Release
                                  </button>
                                )}

                              {permissions.canExternalVerify &&
                                (session.status === 'verified' ||
                                  session.status === 'submitted') && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setExternalSession(session);
                                      setExternalNotes(
                                        session.external_verification_notes || '',
                                      );
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-[#0F2744] rounded-md hover:bg-[#17365D] whitespace-nowrap shrink-0 cursor-pointer"
                                  >
                                    <FileCheck2 className="w-3.5 h-3.5" />
                                    EV Finding
                                  </button>
                                )}

                              {permissions.canConductAssessments &&
                                (session.status === 'submitted' ||
                                  session.status === 'verified') && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const assess = assessments.find(
                                          (a) => a.id === session.assessment_id,
                                        );
                                        const firstItem =
                                          assess?.tasks[0]?.items[0];
                                        setCorrectionSession(session);
                                        setCorrectionTargetKey(
                                          firstItem
                                            ? `task_item::${firstItem.id}`
                                            : '',
                                        );
                                        setCorrectionMarks('0');
                                        setCorrectionReason('');
                                      }}
                                      className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 whitespace-nowrap shrink-0 cursor-pointer"
                                    >
                                      <FileWarning className="w-3.5 h-3.5" />
                                      Correction
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const reass = createReassessmentSession(
                                          session.id,
                                        );
                                        if (reass) {
                                          onNavigate('execute', {
                                            sessionId: reass.id,
                                            assessmentId: reass.assessment_id,
                                          });
                                        }
                                      }}
                                      className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-[#0F2744] bg-white border border-slate-200 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
                                    >
                                      <RefreshCw className="w-3.5 h-3.5" />
                                      Reassess
                                    </button>
                                  </>
                                )}

                              <button
                                type="button"
                                onClick={() => setInspectingSession(session)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                PDF Paper
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AUTOMATED MARKSHEET (MODULE 7.8) */}
      {hubTab === 'marksheet' && !permissions.isTraineeOnly && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 no-print">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-[#0F2744]">
                  Consolidated Oral &amp; Practical Marksheet
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                  Policy Weighting: {institution.oral_weight_percent ?? 30}% Oral /{' '}
                  {institution.practical_weight_percent ?? 70}% Practical · Uncompleted assessments excluded from averages
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    downloadExcelMarksheet(
                      marksheetResultSet,
                      institution,
                      marksheetMeta,
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-md hover:bg-emerald-800 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Export Excel (.xls)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadCsvMarksheet(
                      marksheetResultSet,
                      institution,
                      marksheetMeta,
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0F2744] bg-white border border-slate-300 rounded-md hover:bg-slate-50 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#0F2744] rounded-md hover:bg-[#17365D] cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
              <select
                value={msCourse}
                onChange={(e) => setMsCourse(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded"
              >
                <option value="ALL">All Courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.title}>
                    {c.title}
                  </option>
                ))}
              </select>
              <select
                value={msClass}
                onChange={(e) => setMsClass(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded"
              >
                <option value="ALL">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={msUnit}
                onChange={(e) => setMsUnit(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded"
              >
                <option value="ALL">All Units Consolidated</option>
                {units.map((u) => (
                  <option key={u.id} value={u.code}>
                    {u.code} — {u.name}
                  </option>
                ))}
              </select>
              <select
                value={msYear}
                onChange={(e) => setMsYear(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded"
              >
                <option value="ALL">All Years</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
              <select
                value={msTerm}
                onChange={(e) => setMsTerm(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded"
              >
                <option value="ALL">All Terms</option>
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
            </div>
          </div>

          {/* Printable Marksheet Sheet */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 overflow-x-auto">
            <div className="mb-4 pb-3 border-b border-slate-300 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <div className="text-sm font-bold uppercase text-[#0F2744]">
                  {institution.name}
                </div>
                <div className="text-xs text-slate-700 mt-0.5">
                  {marksheetMeta.department} · {marksheetMeta.course} · Class:{' '}
                  {marksheetMeta.className}
                </div>
                <div className="text-xs text-slate-600">
                  Unit: {marksheetMeta.unit} · {marksheetMeta.academicYear} ·{' '}
                  {marksheetMeta.term}
                </div>
              </div>
              <div className="text-xs text-slate-600 tabular-nums">
                Oral Weight: {marksheetResultSet.oralWeight}% · Practical Weight:{' '}
                {marksheetResultSet.practicalWeight}%
              </div>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0F2744] text-white">
                  <th className="py-2.5 px-3 border border-slate-300">ADM NO.</th>
                  <th className="py-2.5 px-3 border border-slate-300">TRAINEE NAME</th>
                  {marksheetResultSet.oralNumbers.map((n) => (
                    <th
                      key={`oral-${n}`}
                      className="py-2.5 px-2.5 border border-slate-300 text-center whitespace-nowrap"
                    >
                      ORAL {n}
                    </th>
                  ))}
                  <th className="py-2.5 px-2.5 border border-slate-300 text-center bg-[#1B3A63] whitespace-nowrap">
                    ORAL AVG.
                  </th>
                  {marksheetResultSet.practicalNumbers.map((n) => (
                    <th
                      key={`prac-${n}`}
                      className="py-2.5 px-2.5 border border-slate-300 text-center whitespace-nowrap"
                    >
                      PRAC. {n}
                    </th>
                  ))}
                  <th className="py-2.5 px-2.5 border border-slate-300 text-center bg-[#1B3A63] whitespace-nowrap">
                    PRAC. AVG.
                  </th>
                  <th className="py-2.5 px-2.5 border border-slate-300 text-center whitespace-nowrap">
                    WEIGHTED %
                  </th>
                  <th className="py-2.5 px-2.5 border border-slate-300 text-center">
                    COMPLETION
                  </th>
                  <th className="py-2.5 px-3 border border-slate-300">
                    COMPETENCY OUTCOME
                  </th>
                </tr>
              </thead>
              <tbody>
                {marksheetResultSet.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={
                        6 +
                        marksheetResultSet.oralNumbers.length +
                        marksheetResultSet.practicalNumbers.length
                      }
                      className="py-8 text-center text-slate-500 border border-slate-200"
                    >
                      No trainees match the selected course/class filter.
                    </td>
                  </tr>
                ) : (
                  marksheetResultSet.rows.map((row) => (
                    <tr key={row.trainee.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 border border-slate-200 font-mono text-slate-800 whitespace-nowrap">
                        {row.trainee.admission_number}
                      </td>
                      <td className="py-2.5 px-3 border border-slate-200 font-semibold text-slate-900 whitespace-nowrap">
                        {row.trainee.full_name}
                      </td>
                      {marksheetResultSet.oralNumbers.map((n) => {
                        const cell = row.oralScores[n];
                        return (
                          <td
                            key={`o-${row.trainee.id}-${n}`}
                            className="py-2.5 px-2.5 border border-slate-200 text-center tabular-nums"
                          >
                            {cell && cell.obtained !== null
                              ? `${cell.obtained}/${cell.available}`
                              : '—'}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-2.5 border border-slate-200 text-center font-semibold tabular-nums bg-slate-50">
                        {row.oralAvgPercent !== null
                          ? `${row.oralAvgPercent.toFixed(1)}%`
                          : '—'}
                      </td>
                      {marksheetResultSet.practicalNumbers.map((n) => {
                        const cell = row.practicalScores[n];
                        return (
                          <td
                            key={`p-${row.trainee.id}-${n}`}
                            className="py-2.5 px-2.5 border border-slate-200 text-center tabular-nums"
                          >
                            {cell && cell.obtained !== null
                              ? `${cell.obtained}/${cell.available}`
                              : '—'}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-2.5 border border-slate-200 text-center font-semibold tabular-nums bg-slate-50">
                        {row.practicalAvgPercent !== null
                          ? `${row.practicalAvgPercent.toFixed(1)}%`
                          : '—'}
                      </td>
                      <td className="py-2.5 px-2.5 border border-slate-200 text-center font-bold tabular-nums text-[#0F2744]">
                        {row.weightedOverallPercent !== null
                          ? `${row.weightedOverallPercent.toFixed(1)}%`
                          : '—'}
                      </td>
                      <td className="py-2.5 px-2.5 border border-slate-200 text-center text-slate-600 tabular-nums whitespace-nowrap">
                        {row.completionStatus}
                      </td>
                      <td
                        className={`py-2.5 px-3 border border-slate-200 font-semibold whitespace-nowrap ${
                          row.competencyOutcome === 'Not Yet Competent'
                            ? 'text-red-700'
                            : row.competencyOutcome === 'Pending'
                              ? 'text-slate-500'
                              : 'text-emerald-700'
                        }`}
                      >
                        {row.competencyOutcome}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REPORTS, EVIDENCE REGISTER & AUDIT TRAIL */}
      {hubTab === 'reports' && !permissions.isTraineeOnly && (
        <div className="space-y-4 no-print">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { key: 'summary', label: 'Institutional & Dept Performance' },
                { key: 'gaps', label: 'Competency Gap Report' },
                {
                  key: 'evidence',
                  label: `Evidence Register (${allEvidence.length})`,
                },
                { key: 'audit', label: `Audit Trail (${auditLogs.length})` },
              ] as const
            ).map((rt) => (
              <button
                key={rt.key}
                type="button"
                onClick={() => setReportType(rt.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border cursor-pointer ${
                  reportType === rt.key
                    ? 'bg-[#0F2744] text-white border-[#0F2744]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {rt.label}
              </button>
            ))}
          </div>

          {reportType === 'summary' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
                <h3 className="text-sm font-semibold text-[#0F2744]">
                  Performance by Course &amp; Level
                </h3>
                <div className="divide-y divide-slate-200 text-xs">
                  {courses.map((c) => {
                    const courseAssessIds = new Set(
                      assessments
                        .filter((a) => a.course_title === c.title)
                        .map((a) => a.id),
                    );
                    const cSessions = sessions.filter(
                      (s) =>
                        courseAssessIds.has(s.assessment_id) &&
                        (s.status === 'submitted' || s.status === 'verified'),
                    );
                    const passCount = cSessions.filter(
                      (s) => s.competency_outcome !== 'Not Yet Competent',
                    ).length;
                    const avg =
                      cSessions.length > 0
                        ? cSessions.reduce((a, b) => a + b.percentage, 0) /
                          cSessions.length
                        : 0;
                    return (
                      <div
                        key={c.id}
                        className="py-2.5 flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">
                            {c.title} ({c.level})
                          </div>
                          <div className="text-slate-500 tabular-nums">
                            {cSessions.length} completed session(s) · {passCount}{' '}
                            competent
                          </div>
                        </div>
                        <div className="font-bold text-[#0F2744] tabular-nums">
                          {cSessions.length > 0 ? `${avg.toFixed(1)}% avg` : '—'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
                <h3 className="text-sm font-semibold text-[#0F2744]">
                  Verification &amp; Release Pipeline
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                    <div className="text-slate-500">Verified Sessions</div>
                    <div className="text-xl font-bold text-emerald-700 tabular-nums mt-1">
                      {sessions.filter((s) => s.status === 'verified').length}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                    <div className="text-slate-500">Awaiting Verification</div>
                    <div className="text-xl font-bold text-blue-700 tabular-nums mt-1">
                      {sessions.filter((s) => s.status === 'submitted').length}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                    <div className="text-slate-500">Results Released</div>
                    <div className="text-xl font-bold text-[#0F2744] tabular-nums mt-1">
                      {sessions.filter((s) => s.results_released).length}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                    <div className="text-slate-500">Returned / Rejected</div>
                    <div className="text-xl font-bold text-amber-700 tabular-nums mt-1">
                      {
                        sessions.filter(
                          (s) =>
                            s.status === 'returned' || s.status === 'rejected',
                        ).length
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {reportType === 'gaps' && (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-[#0F2744]">
                  Competency Gap Report (Not Yet Competent Trainees &amp; Weak Criteria)
                </h3>
              </div>
              <div className="divide-y divide-slate-200 text-xs">
                {sessions
                  .filter((s) => s.competency_outcome === 'Not Yet Competent')
                  .map((s) => {
                    const tr = trainees.find((t) => t.id === s.trainee_id);
                    const as = assessments.find((a) => a.id === s.assessment_id);
                    const weakItems = (as?.tasks.flatMap((t) => t.items) || [])
                      .filter((item) => {
                        if (item.max_marks <= 0) return false;
                        const r = s.results.find((x) => x.item_id === item.id);
                        return ((r?.marks_obtained ?? 0) / item.max_marks) * 100 < 50;
                      })
                      .map((i) => `${i.item_number}. ${i.description}`);
                    return (
                      <div key={s.id} className="p-4 space-y-1">
                        <div className="font-semibold text-red-700">
                          {tr?.full_name} ({tr?.admission_number}) —{' '}
                          <span className="tabular-nums">
                            {s.percentage.toFixed(1)}%
                          </span>{' '}
                          on {as?.unit_code}
                        </div>
                        <div className="text-slate-600">
                          Assessor Guidance: {s.feedback_to_candidate || 'Scheduled for reassessment.'}
                        </div>
                        {weakItems.length > 0 && (
                          <div className="text-slate-700">
                            <strong>Criteria below threshold:</strong>{' '}
                            {weakItems.join(' | ')}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {reportType === 'evidence' && (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[#0F2744] font-semibold">
                    <th className="py-2.5 px-4">Trainee</th>
                    <th className="py-2.5 px-4">Unit &amp; Assessment</th>
                    <th className="py-2.5 px-4">Linked Item</th>
                    <th className="py-2.5 px-4">File &amp; Category</th>
                    <th className="py-2.5 px-4">Version &amp; Assessor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {allEvidence.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No multimedia evidence files recorded yet.
                      </td>
                    </tr>
                  ) : (
                    allEvidence.map((ev) => (
                      <tr key={ev.id}>
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-slate-900">
                            {ev.trainee_name}
                          </div>
                          <div className="font-mono text-slate-500">
                            {ev.trainee_adm_no}
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          <div>{ev.unit_name}</div>
                          <div className="text-slate-500">
                            {ev.assessment_type} {ev.assessment_number}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-slate-700">
                          {ev.target_label}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-medium text-blue-700">
                            {ev.file_name}
                          </div>
                          <div className="text-slate-500">{ev.category}</div>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">
                          v{ev.version} · {ev.assessor_name}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'audit' && (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[#0F2744] font-semibold">
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Actor</th>
                    <th className="py-2.5 px-4">Action</th>
                    <th className="py-2.5 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap tabular-nums">
                        {log.timestamp.replace('T', ' ').slice(0, 19)}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-900">
                        {log.actor_name}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[#0F2744]">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CORRECTIONS QUEUE (MODULE 7.11) */}
      {hubTab === 'corrections' && !permissions.isTraineeOnly && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden no-print">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-[#0F2744]">
              Documented Mark Correction Requests (Module 7.11)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Submitted and verified scores are locked; authorized approval updates marks while retaining original values in the audit trail.
            </p>
          </div>
          {allCorrections.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No mark correction requests submitted yet.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-[#0F2744] font-semibold">
                  <th className="py-2.5 px-4">Trainee &amp; Unit</th>
                  <th className="py-2.5 px-4">Criterion</th>
                  <th className="py-2.5 px-4 text-center">Previous → Requested</th>
                  <th className="py-2.5 px-4">Reason</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {allCorrections.map(({ req, session, trainee, assessment }) => (
                  <tr key={req.id}>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {trainee?.full_name}
                      </div>
                      <div className="text-slate-500 font-mono">
                        {assessment?.unit_code}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{req.target_label}</td>
                    <td className="py-3 px-4 text-center font-bold tabular-nums">
                      {req.previous_marks} → {req.requested_marks}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{req.reason}</td>
                    <td className="py-3 px-4 uppercase font-semibold">
                      <span
                        className={
                          req.status === 'approved'
                            ? 'text-emerald-700'
                            : req.status === 'rejected'
                              ? 'text-red-700'
                              : 'text-amber-700'
                        }
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {req.status === 'pending' &&
                      permissions.canApproveCorrections ? (
                        <div className="inline-flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              reviewCorrectionRequest(
                                session.id,
                                req.id,
                                'approved',
                                'Approved after evidence check',
                              );
                              showToast('Correction approved and score recalculated');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-700 rounded hover:bg-emerald-800 cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              reviewCorrectionRequest(
                                session.id,
                                req.id,
                                'rejected',
                                'Insufficient justification',
                              );
                              showToast('Correction request rejected');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500">
                          {req.reviewed_by || 'Pending'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Internal Verification Modal */}
      {verifyingSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 no-print">
          <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-[#0F2744]">
                Internal Verification Sign-Off
              </h3>
              <button
                type="button"
                onClick={() => setVerifyingSession(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {verifyError && (
              <div className="p-2.5 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-md">
                {verifyError}
              </div>
            )}

            <div className="text-sm text-slate-700 space-y-1">
              <p>
                <strong>Assessor:</strong> {verifyingSession.assessor_name}
              </p>
              <p>
                <strong>Score:</strong>{' '}
                <span className="tabular-nums">
                  {verifyingSession.grand_total_obtained} /{' '}
                  {verifyingSession.grand_total_available} (
                  {verifyingSession.percentage.toFixed(2)}%)
                </span>
              </p>
              <p>
                <strong>Proposed Outcome:</strong>{' '}
                {verifyingSession.competency_outcome}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Internal Verifier Name
              </label>
              <input
                type="text"
                value={verifierName}
                onChange={(e) => setVerifierName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Verification Notes
              </label>
              <textarea
                rows={3}
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Confirm rubric alignment, evidence completeness, or state reasons if returning/rejecting..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleVerifyDecision('returned')}
                className="px-3 py-2 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 cursor-pointer"
              >
                Return to Assessor
              </button>
              <button
                type="button"
                onClick={() => handleVerifyDecision('rejected')}
                className="px-3 py-2 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 cursor-pointer"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => handleVerifyDecision('approved')}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-md hover:bg-emerald-800 cursor-pointer"
              >
                Approve &amp; Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* External Verifier Finding Modal */}
      {externalSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 no-print">
          <form
            onSubmit={handleSaveExternalFinding}
            className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-[#0F2744]">
                Record External Verification Finding
              </h3>
              <button
                type="button"
                onClick={() => setExternalSession(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              rows={4}
              required
              value={externalNotes}
              onChange={(e) => setExternalNotes(e.target.value)}
              placeholder="Enter external moderation findings, sample check results, and standards compliance notes..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setExternalSession(null)}
                className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0F2744] rounded-md hover:bg-[#17365D] cursor-pointer"
              >
                Save External Finding
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mark Correction Request Modal */}
      {correctionSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 no-print">
          <form
            onSubmit={handleSubmitCorrection}
            className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-[#0F2744]">
                Request Documented Mark Correction
              </h3>
              <button
                type="button"
                onClick={() => setCorrectionSession(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Assessment Criterion
              </label>
              <select
                value={correctionTargetKey}
                onChange={(e) => setCorrectionTargetKey(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md"
              >
                {assessments
                  .find((a) => a.id === correctionSession.assessment_id)
                  ?.tasks.flatMap((t) => t.items)
                  .filter((i) => i.max_marks > 0)
                  .map((i) => (
                    <option key={i.id} value={`task_item::${i.id}`}>
                      Task Item {i.item_number}. {i.description} (Max {i.max_marks})
                    </option>
                  ))}
                {assessments
                  .find((a) => a.id === correctionSession.assessment_id)
                  ?.checklists.flatMap((c) => c.criteria)
                  .filter((c) => c.max_marks > 0)
                  .map((c) => (
                    <option key={c.id} value={`checklist_criterion::${c.id}`}>
                      Checklist {c.item_number}. {c.description} (Max {c.max_marks})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Requested New Marks
              </label>
              <input
                type="number"
                min={0}
                step={0.5}
                required
                value={correctionMarks}
                onChange={(e) => setCorrectionMarks(e.target.value)}
                className="w-full px-3 py-2 text-sm tabular-nums border border-slate-200 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Reason for Correction
              </label>
              <textarea
                rows={3}
                required
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="State evidence-backed reason for requesting score adjustment..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCorrectionSession(null)}
                className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-700 rounded-md hover:bg-amber-800 cursor-pointer"
              >
                Submit Correction Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Official 3-Page Paper Modal */}
      {inspectingSession && inspectedAssessment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 overflow-y-auto">
          <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between no-print">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Official Assessment Report — {inspectedTrainee?.full_name}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {inspectedTrainee?.admission_number} ·{' '}
                {inspectingSession.percentage.toFixed(2)}% ·{' '}
                {inspectingSession.competency_outcome}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0F2744] rounded-md hover:bg-[#17365D] cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF
              </button>
              <button
                type="button"
                onClick={() => setInspectingSession(null)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Close
              </button>
            </div>
          </div>

          <div className="py-8 px-4 bg-slate-200/80 min-h-screen print-only-container">
            <AssessmentPaper
              assessment={inspectedAssessment}
              institution={institution}
              session={inspectingSession}
              trainee={inspectedTrainee}
            />
          </div>
        </div>
      )}
    </div>
  );
}
