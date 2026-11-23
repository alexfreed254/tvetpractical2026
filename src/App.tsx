import React, { useEffect, useMemo, useState } from 'react';
import { Check, Download, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { AdminModuleView } from './components/AdminModuleView';
import { AssessmentBuilderView } from './components/AssessmentBuilderView';
import { AssessmentsListView } from './components/AssessmentsListView';
import { DigitalAssessmentView } from './components/DigitalAssessmentView';
import { LoginView } from './components/LoginView';
import { OverviewView } from './components/OverviewView';
import { ProfileAvatarMenu } from './components/ProfileAvatarMenu';
import { ProjectZipView } from './components/ProjectZipView';
import { RoleContextBar } from './components/RoleContextBar';
import { SessionsView } from './components/SessionsView';
import { ALL_PROJECT_FILES } from './data/projectFiles';
import { downloadProjectZip } from './lib/zipExporter';
import {
  AssessmentStoreProvider,
  useAssessmentStore,
} from './store/useAssessmentStore';
import type { AppRoute, UserRole } from './types/tvet';

const ALL_NAV_ITEMS: {
  key: AppRoute;
  label: string;
  roles: UserRole[];
}[] = [
  {
    key: 'overview',
    label: 'Dashboard',
    roles: [
      'super_admin',
      'hod',
      'trainer',
      'internal_verifier',
      'external_verifier',
      'trainee',
      'management',
    ],
  },
  {
    key: 'admin',
    label: 'Institution',
    roles: ['super_admin', 'hod'],
  },
  {
    key: 'assessments',
    label: 'Assessments',
    roles: [
      'super_admin',
      'hod',
      'trainer',
      'internal_verifier',
      'external_verifier',
      'management',
    ],
  },
  {
    key: 'execute',
    label: 'Assess',
    roles: ['super_admin', 'hod', 'trainer'],
  },
  {
    key: 'sessions',
    label: 'Marksheets',
    roles: [
      'super_admin',
      'hod',
      'trainer',
      'internal_verifier',
      'external_verifier',
      'trainee',
      'management',
    ],
  },
];

function AppShell() {
  const {
    institution,
    authUser,
    authStatus,
    permissions,
    resetDemoData,
  } = useAssessmentStore();
  const [route, setRoute] = useState<AppRoute>('overview');
  const [routeParams, setRouteParams] = useState<{
    assessmentId?: string;
    sessionId?: string;
  }>({});
  const [zipToast, setZipToast] = useState('');

  // Reset landing view whenever an account logs in or logs out
  useEffect(() => {
    setRoute('overview');
    setRouteParams({});
  }, [authUser?.id]);

  const visibleNavItems = useMemo(() => {
    if (!authUser) return [];
    return ALL_NAV_ITEMS.filter((item) => item.roles.includes(authUser.role));
  }, [authUser]);

  const handleNavigate = (
    nextRoute: AppRoute,
    params?: { assessmentId?: string; sessionId?: string },
  ) => {
    setRoute(nextRoute);
    setRouteParams(params || {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickDownloadZip = async () => {
    const res = await downloadProjectZip(
      ALL_PROJECT_FILES,
      'tvet-eassess-project.zip',
    );
    setZipToast(
      `Downloaded tvet-eassess-project.zip (${res.fileCount} files)`,
    );
    setTimeout(() => setZipToast(''), 4000);
  };

  if (!authStatus.checked) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-lg px-7 py-6 flex flex-col items-center gap-3 text-sm font-medium text-[#0F2744] shadow-sm">
          <img
            src="/assets/aistudio/image_69d8743e.png"
            alt="TVET e-ASSESS Digital Practical Assessment Platform"
            className="h-12 w-auto object-contain mix-blend-multiply"
          />
          <span>Initializing TVET e-ASSESS Portal...</span>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return <LoginView />;
  }

  const canExportZip =
    authUser.role === 'super_admin' ||
    authUser.role === 'hod' ||
    authUser.role === 'trainer';

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FB] text-slate-900">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 no-print">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand logo wordmark */}
          <button
            type="button"
            onClick={() => handleNavigate('overview')}
            aria-label="TVET e-ASSESS Home"
            className="inline-flex items-center py-1 rounded-md hover:opacity-90 transition-opacity shrink-0 cursor-pointer"
          >
            <img
              src="/assets/aistudio/image_69d8743e.png"
              alt="TVET e-ASSESS Digital Practical Assessment Platform"
              className="h-9 sm:h-10 w-auto object-contain mix-blend-multiply"
            />
          </button>

          {/* Zone 2: Clean single-line role-scoped navigation links */}
          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            {visibleNavItems.map((item) => {
              const isActive =
                route === item.key ||
                (item.key === 'assessments' && route === 'builder');
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleNavigate(item.key)}
                  className={`py-5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'border-blue-700 text-[#0F2744] font-semibold'
                      : 'border-transparent text-slate-600 hover:text-[#0F2744] hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action + account avatar identifier */}
          <div className="flex items-center gap-3 shrink-0">
            {canExportZip ? (
              <button
                type="button"
                onClick={() => handleNavigate('export-zip')}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F2744] rounded-lg hover:bg-[#17365D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Project ZIP
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleNavigate('sessions')}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F2744] rounded-lg hover:bg-[#17365D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {permissions.isTraineeOnly ? 'My Results' : 'Marksheets'}
              </button>
            )}

            <div className="h-6 w-px bg-slate-200" aria-hidden="true" />
            <ProfileAvatarMenu />
          </div>
        </div>

        {/* Mobile Nav Row */}
        <div className="md:hidden border-t border-slate-200 px-4 py-2 flex items-center gap-4 overflow-x-auto">
          {visibleNavItems.map((item) => {
            const isActive =
              route === item.key ||
              (item.key === 'assessments' && route === 'builder');
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleNavigate(item.key)}
                className={`text-xs py-1 whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'text-blue-700 font-semibold underline underline-offset-4'
                    : 'text-slate-600'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Quiet ZIP Download Toast */}
      {zipToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0F2744] text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 text-xs font-medium no-print">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{zipToast}</span>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <RoleContextBar />

        {route === 'overview' && (
          <OverviewView
            onNavigate={handleNavigate}
            onDownloadZip={handleQuickDownloadZip}
          />
        )}
        {route === 'admin' && permissions.canManageInstitution && (
          <AdminModuleView />
        )}
        {route === 'assessments' && !permissions.isTraineeOnly && (
          <AssessmentsListView onNavigate={handleNavigate} />
        )}
        {route === 'builder' && permissions.canAuthorAssessments && (
          <AssessmentBuilderView
            initialAssessmentId={routeParams.assessmentId}
            onNavigate={handleNavigate}
          />
        )}
        {route === 'execute' && permissions.canConductAssessments && (
          <DigitalAssessmentView
            initialAssessmentId={routeParams.assessmentId}
            initialSessionId={routeParams.sessionId}
            onNavigate={handleNavigate}
          />
        )}
        {route === 'sessions' && <SessionsView onNavigate={handleNavigate} />}
        {route === 'export-zip' && canExportZip && <ProjectZipView />}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12 no-print">
        <div className="max-w-[1440px] mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            {institution.name} · TVET Competency-Based Assessment Workbench
          </div>
          {permissions.canManageInstitution && (
            <button
              type="button"
              onClick={() => {
                resetDemoData();
                handleNavigate('overview');
              }}
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Sample Data
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AssessmentStoreProvider>
      <AppShell />
    </AssessmentStoreProvider>
  );
}
