import React from 'react';
import { Eye, LogOut, Shield, UserCheck } from 'lucide-react';
import { ROLE_LABELS, useAssessmentStore } from '../store/useAssessmentStore';

export function RoleContextBar() {
  const { institution, activeUser, permissions, logout } = useAssessmentStore();

  const scopeNotice = permissions.isTraineeOnly
    ? 'Trainee Scope: Released assessment results, assessor feedback & personal portfolio only'
    : activeUser.role === 'external_verifier'
      ? 'External Verifier Scope: Read-only audit of assessments, evidence & external findings'
      : activeUser.role === 'management'
        ? 'Management Scope: Institutional dashboards, marksheets & approved assessment reports'
        : activeUser.role === 'internal_verifier'
          ? 'Internal Verifier Scope: Review submitted records, verify marks & authorize release'
          : activeUser.role === 'hod'
            ? 'HOD Scope: Departmental structures, trainer allocations, authoring & verification'
            : activeUser.role === 'trainer'
              ? 'Trainer / Assessor Scope: Author instruments, conduct digital grading & upload evidence'
              : 'Super Administrator Scope: Full institutional configuration, RBAC & audit access';

  const isReadOnlyRole =
    activeUser.role === 'external_verifier' ||
    activeUser.role === 'management' ||
    activeUser.role === 'trainee';

  return (
    <div className="bg-[#EEF2F7] border-b border-slate-200/90 no-print">
      <div className="max-w-[1440px] mx-auto px-6 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-3 text-slate-700">
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#0F2744]">
            {isReadOnlyRole ? (
              <Eye className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            ) : (
              <Shield className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            )}
            <span>{ROLE_LABELS[activeUser.role]}</span>
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-600">{scopeNotice}</span>
          <span className="hidden lg:inline text-slate-400">·</span>
          <span className="hidden lg:inline text-slate-600 font-mono tabular-nums">
            {institution.active_academic_year || '2026'} ·{' '}
            {institution.active_term || 'Term 3'}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="inline-flex items-center gap-1.5 text-slate-700">
            <UserCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="font-semibold text-[#0F2744]">
              {activeUser.full_name}
            </span>
            <span className="text-slate-400">·</span>
            <span className="font-mono text-slate-600">
              {activeUser.staff_or_adm_no}
            </span>
          </div>

          <button
            type="button"
            onClick={() => logout()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#0F2744] bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-600" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
