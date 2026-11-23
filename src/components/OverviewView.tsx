import React from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileArchive,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Play,
  Plus,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { calculateTotalAvailable } from '../lib/calculations';
import { ROLE_LABELS, useAssessmentStore } from '../store/useAssessmentStore';
import type { AppRoute, UserRole } from '../types/tvet';

interface OverviewViewProps {
  onNavigate: (
    route: AppRoute,
    params?: { assessmentId?: string; sessionId?: string },
  ) => void;
  onDownloadZip: () => void;
}

const ROLE_DASHBOARD_META: Record<
  UserRole,
  { title: string; subtitle: string }
> = {
  super_admin: {
    title: 'Institutional Control & Assessment Console',
    subtitle:
      'Configure academic structures, departments, courses, RBAC user accounts, assessment policies, and institutional verification compliance.',
  },
  hod: {
    title: 'Head of Department Operations Dashboard',
    subtitle:
      'Manage departmental structures, allocate trainers to classes and competency units, monitor assessment progress, and oversee verification.',
  },
  trainer: {
    title: 'Trainer & Assessor Practical Workbench',
    subtitle:
      'Review your allocated classes and units, author and publish CBET practical & oral instruments, conduct digital grading, and upload evidence.',
  },
  internal_verifier: {
    title: 'Internal Verification & Quality Assurance Dashboard',
    subtitle:
      'Review submitted candidate sessions, audit awarded marks and multimedia evidence, approve or return assessments, and authorize result release.',
  },
  external_verifier: {
    title: 'External Verification & Audit Dashboard',
    subtitle:
      'Inspect verified assessment instruments, candidate observation checklists, evidence portfolios, and record external moderation findings.',
  },
  management: {
    title: 'Executive Institutional Assessment Dashboard',
    subtitle:
      'Monitor institution-wide competency pass rates, assessment completion trends, course performance summaries, and released marksheets.',
  },
  trainee: {
    title: 'Trainee Assessment Portfolio',
    subtitle:
      'Access assigned assessment briefs, released results, and assessor feedback.',
  },
};

export function OverviewView({
  onNavigate,
  onDownloadZip,
}: OverviewViewProps) {
  const {
    institution,
    assessments,
    trainees,
    sessions,
    allocations,
    classes,
    units,
    activeUser,
    permissions,
  } = useAssessmentStore();

  // Role-scoped Trainee Personal Portfolio View (Module 7.1)
  if (activeUser.role === 'trainee' || permissions.isTraineeOnly) {
    const traineeProfile =
      trainees.find(
        (t) =>
          t.admission_number.toLowerCase() ===
            activeUser.staff_or_adm_no.toLowerCase() ||
          t.full_name.toLowerCase() === activeUser.full_name.toLowerCase(),
      ) || trainees[0];

    const releasedSessions = sessions.filter(
      (s) => s.trainee_id === traineeProfile?.id && Boolean(s.results_released),
    );
    const assignedAssessments = assessments.filter(
      (a) => a.status === 'published',
    );

    return (
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <section className="pb-6 border-b border-slate-200/90 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-blue-700 tracking-wide">
              {institution.name} · Trainee Assessment Portfolio
            </p>
            <h1 className="mt-2 text-2xl font-bold text-[#0F2744]">
              Welcome, {traineeProfile?.full_name || activeUser.full_name}
            </h1>
            <p className="mt-1 text-sm text-slate-600 font-mono">
              {traineeProfile?.admission_number} · {traineeProfile?.course_title} ·{' '}
              {traineeProfile?.class_name}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('sessions')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F2744] rounded-lg hover:bg-[#17365D] transition-colors cursor-pointer shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            View Released Marksheets
          </button>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#0F2744]">
                Released Assessment Results ({releasedSessions.length})
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('sessions')}
                className="text-xs font-medium text-blue-700 hover:underline cursor-pointer"
              >
                Open Full Portfolio
              </button>
            </div>
            {releasedSessions.length === 0 ? (
              <div className="p-6 text-xs text-slate-500">
                No verified assessment results have been released for your account yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {releasedSessions.map((s) => {
                  const as = assessments.find((a) => a.id === s.assessment_id);
                  return (
                    <div key={s.id} className="px-6 py-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="font-semibold text-sm text-slate-900">
                          {as?.title || as?.unit_name}
                        </div>
                        <div className="text-sm font-bold text-emerald-700 tabular-nums">
                          {s.percentage.toFixed(1)}% · {s.competency_outcome}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {as?.unit_code} · Date: {s.assessment_date} · Assessor:{' '}
                        {s.assessor_name}
                      </div>
                      {s.feedback_to_candidate && (
                        <div className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded p-2.5 mt-1">
                          <strong>Assessor Feedback:</strong>{' '}
                          {s.feedback_to_candidate}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold text-[#0F2744]">
                Assigned Assessment Briefs ({assignedAssessments.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-200">
              {assignedAssessments.map((a) => (
                <div key={a.id} className="px-6 py-3.5 text-xs space-y-1">
                  <div className="font-semibold text-slate-900">{a.title}</div>
                  <div className="text-slate-500 font-mono">
                    {a.unit_code} · {a.assessment_type} · Due:{' '}
                    {a.deadline_date || a.assessment_date}
                  </div>
                  {a.instructions && (
                    <p className="text-slate-600">{a.instructions}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const publishedAssessments = assessments.filter((a) => a.status === 'published');
  const completedSessions = sessions.filter(
    (s) => s.status === 'submitted' || s.status === 'verified',
  );
  const pendingVerificationSessions = sessions.filter(
    (s) => s.status === 'submitted' && s.verification_status !== 'approved',
  );
  const verifiedSessions = sessions.filter((s) => s.status === 'verified');
  const releasedSessions = sessions.filter((s) => Boolean(s.results_released));
  const competentCount = completedSessions.filter(
    (s) =>
      s.competency_outcome === 'Competent' ||
      s.competency_outcome === 'Proficient' ||
      s.competency_outcome === 'Mastery',
  ).length;
  const competencyRate =
    completedSessions.length > 0
      ? (competentCount / completedSessions.length) * 100
      : 0;
  const totalEvidenceCount = sessions.reduce(
    (acc, s) => acc + (s.evidence?.length || 0),
    0,
  );

  const trainerAllocations = allocations.filter(
    (al) => al.trainer_user_id === activeUser.id,
  );
  const roleMeta = ROLE_DASHBOARD_META[activeUser.role];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
      {/* Hero Header */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-slate-200/90">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold text-blue-700 tracking-wide">
            {institution.name} · {ROLE_LABELS[activeUser.role]} Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0F2744] [text-wrap:balance]">
            {roleMeta.title}
          </h1>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            {roleMeta.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {permissions.canManageInstitution && (
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#0F2744] bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-blue-700" />
              Institution &amp; Allocations
            </button>
          )}
          {permissions.canAuthorAssessments && (
            <button
              type="button"
              onClick={() => onNavigate('builder')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Assessment
            </button>
          )}
          {permissions.canConductAssessments && (
            <button
              type="button"
              onClick={() =>
                onNavigate('execute', {
                  assessmentId: publishedAssessments[0]?.id,
                })
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#0F2744] bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-4 h-4 text-blue-700" />
              Conduct Session
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate('sessions')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeUser.role === 'internal_verifier' ||
              activeUser.role === 'external_verifier' ||
              activeUser.role === 'management'
                ? 'text-white bg-blue-700 hover:bg-blue-800'
                : 'text-[#0F2744] bg-white border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {activeUser.role === 'internal_verifier' ? (
              <ShieldCheck className="w-4 h-4" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            )}
            {activeUser.role === 'internal_verifier'
              ? `Verification Queue (${pendingVerificationSessions.length})`
              : activeUser.role === 'external_verifier'
                ? 'External Audit Records'
                : 'Marksheets & Reports'}
          </button>
        </div>
      </section>

      {/* 4-Column Metric Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-lg p-5">
          <div className="flex items-center justify-between text-slate-600 text-xs font-medium">
            <span>Assessment Instruments</span>
            <FileText className="w-4 h-4 text-blue-700" />
          </div>
          <div className="mt-3 text-3xl font-bold text-[#0F2744] tabular-nums">
            {assessments.length}
          </div>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {publishedAssessments.length} published for assessment
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-lg p-5">
          <div className="flex items-center justify-between text-slate-600 text-xs font-medium">
            <span>
              {activeUser.role === 'internal_verifier'
                ? 'Pending Verification'
                : activeUser.role === 'external_verifier'
                  ? 'Verified Audit Sample'
                  : activeUser.role === 'trainer'
                    ? 'My Unit Allocations'
                    : 'Registered Trainees'}
            </span>
            {activeUser.role === 'internal_verifier' ||
            activeUser.role === 'external_verifier' ? (
              <FileCheck2 className="w-4 h-4 text-indigo-700" />
            ) : (
              <Users className="w-4 h-4 text-indigo-700" />
            )}
          </div>
          <div className="mt-3 text-3xl font-bold text-[#0F2744] tabular-nums">
            {activeUser.role === 'internal_verifier'
              ? pendingVerificationSessions.length
              : activeUser.role === 'external_verifier'
                ? verifiedSessions.length
                : activeUser.role === 'trainer'
                  ? trainerAllocations.length
                  : trainees.length}
          </div>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {activeUser.role === 'internal_verifier'
              ? `${verifiedSessions.length} verified · ${releasedSessions.length} released`
              : activeUser.role === 'external_verifier'
                ? `${releasedSessions.length} released results`
                : activeUser.role === 'trainer'
                  ? `${trainees.length} enrolled trainees`
                  : 'Candidates enrolled across cohorts'}
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-lg p-5">
          <div className="flex items-center justify-between text-slate-600 text-xs font-medium">
            <span>Sessions &amp; Evidence</span>
            <ClipboardCheck className="w-4 h-4 text-sky-700" />
          </div>
          <div className="mt-3 text-3xl font-bold text-[#0F2744] tabular-nums">
            {sessions.length}
          </div>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {completedSessions.length} submitted/verified · {totalEvidenceCount}{' '}
            evidence files
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-lg p-5">
          <div className="flex items-center justify-between text-slate-600 text-xs font-medium">
            <span>Competency Pass Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="mt-3 text-3xl font-bold text-emerald-700 tabular-nums">
            {competencyRate.toFixed(1)}%
          </div>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            Policy: {institution.oral_weight_percent ?? 30}% Oral /{' '}
            {institution.practical_weight_percent ?? 70}% Practical
          </p>
        </div>
      </section>

      {/* Role-Specific Operational Highlights */}
      {activeUser.role === 'trainer' && trainerAllocations.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-sm font-semibold text-[#0F2744]">
                My Allocated Classes &amp; Competency Units ({trainerAllocations.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Units assigned to {activeUser.full_name} by the Head of Department
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {trainerAllocations.map((al) => {
              const cls = classes.find((c) => c.id === al.class_id);
              const un = units.find((u) => u.id === al.unit_id);
              return (
                <div
                  key={al.id}
                  className="p-3.5 border border-slate-200 rounded-md bg-slate-50/70 text-xs space-y-1"
                >
                  <div className="font-semibold text-[#0F2744]">
                    {un?.name || 'Competency Unit'}
                  </div>
                  <div className="font-mono text-slate-600">
                    {un?.code} · Class: {cls?.name}
                  </div>
                  <div className="text-slate-500 tabular-nums">
                    {al.academic_year} · {al.term}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Two-Column Active Workflows */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Assessment Templates */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-semibold text-[#0F2744]">
                Assessment Instruments
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Published Practical &amp; Oral observation checklists and task rubrics
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('assessments')}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-200">
            {assessments.slice(0, 5).map((assessment) => {
              const totalMarks = calculateTotalAvailable(
                assessment.tasks,
                assessment.checklists,
              );
              return (
                <div
                  key={assessment.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500 font-mono truncate">
                      {assessment.unit_code} · {assessment.assessment_type} #
                      {assessment.assessment_number} ·{' '}
                      <span className="uppercase font-semibold">
                        {assessment.status}
                      </span>{' '}
                      · <span className="tabular-nums">{totalMarks} marks</span>
                    </div>
                    <h3 className="mt-1 text-sm font-semibold text-slate-900 truncate">
                      {assessment.title || assessment.unit_name}
                    </h3>
                    <div className="mt-1 text-xs text-slate-500">
                      {assessment.course_title} ·{' '}
                      {assessment.class_name || assessment.level} ·{' '}
                      {assessment.cycle || 'Cycle 3'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {permissions.canAuthorAssessments && (
                      <button
                        type="button"
                        onClick={() =>
                          onNavigate('builder', { assessmentId: assessment.id })
                        }
                        className="px-3 py-1.5 text-xs font-medium text-[#0F2744] bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Inspect Paper
                      </button>
                    )}
                    {permissions.canConductAssessments &&
                      assessment.status === 'published' && (
                        <button
                          type="button"
                          onClick={() =>
                            onNavigate('execute', {
                              assessmentId: assessment.id,
                            })
                          }
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Assess
                        </button>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Recent Sessions, Institution Setup & Project ZIP Callout */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold text-[#0F2744]">
                {activeUser.role === 'internal_verifier'
                  ? 'Sessions Awaiting Verification'
                  : 'Recent Candidate Sessions'}
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('sessions')}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Open Marksheets
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="divide-y divide-slate-200">
              {(activeUser.role === 'internal_verifier' &&
              pendingVerificationSessions.length > 0
                ? pendingVerificationSessions
                : sessions
              )
                .slice(0, 5)
                .map((session) => {
                  const trainee = trainees.find(
                    (t) => t.id === session.trainee_id,
                  );
                  const assessment = assessments.find(
                    (a) => a.id === session.assessment_id,
                  );
                  const isComp =
                    session.competency_outcome === 'Competent' ||
                    session.competency_outcome === 'Proficient' ||
                    session.competency_outcome === 'Mastery';
                  return (
                    <div
                      key={session.id}
                      className="px-6 py-3.5 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {trainee?.full_name || 'Candidate'}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          <span className="font-mono">
                            {trainee?.admission_number}
                          </span>{' '}
                          · {assessment?.assessment_type}{' '}
                          {assessment?.assessment_number} ·{' '}
                          <span className="uppercase">{session.status}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold text-slate-900 tabular-nums">
                          {session.percentage.toFixed(1)}%
                        </div>
                        <div
                          className={`text-xs font-medium ${
                            isComp
                              ? 'text-emerald-700'
                              : session.competency_outcome ===
                                  'Not Yet Competent'
                                ? 'text-red-700'
                                : 'text-slate-500'
                          }`}
                        >
                          {session.competency_outcome}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {permissions.canManageInstitution && (
            <div className="bg-white border border-slate-200/90 rounded-lg p-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-[#0F2744]">
                  Institutional Structure &amp; Allocations
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage departments, courses, cycles, classes, units &amp; RBAC users.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0F2744] bg-white border border-slate-300 rounded-md hover:bg-slate-50 shrink-0 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                Open Setup
              </button>
            </div>
          )}

          {(activeUser.role === 'super_admin' ||
            activeUser.role === 'hod' ||
            activeUser.role === 'trainer') && (
            <div className="bg-white border border-slate-200/90 rounded-lg p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-[#0F2744]">
                    Next.js &amp; Supabase Source Package
                  </h2>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    Download the complete, folder-organized{' '}
                    <span className="font-mono">tvet-eassess/</span> codebase including{' '}
                    <span className="font-mono">supabase/schema.sql</span>, API routes, React PDF generator, and UI components as a single ZIP archive.
                  </p>
                </div>
                <FileArchive className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onDownloadZip}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F2744] rounded-md hover:bg-[#17365D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <FileArchive className="w-3.5 h-3.5" />
                  Download Project ZIP
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('export-zip')}
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#0F2744] bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Browse Folder Tree
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
