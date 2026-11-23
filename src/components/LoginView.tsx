import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import instituteCrest from '../assets/images/institute_crest_1795429275052.jpg';
import { ROLE_LABELS, useAssessmentStore } from '../store/useAssessmentStore';
import type { UserRole } from '../types/tvet';

type LoginTab = 'signin' | 'setup';

const RBAC_ROLES_OVERVIEW: { role: UserRole; summary: string }[] = [
  {
    role: 'super_admin',
    summary: 'Institution setup, Supabase Auth user provisioning & system policy',
  },
  {
    role: 'hod',
    summary: 'Departmental structures, trainer allocations & staff login provisioning',
  },
  {
    role: 'trainer',
    summary: 'Practical authoring, digital checklists, grading & evidence upload',
  },
  {
    role: 'internal_verifier',
    summary: 'Verification queue, mark checks, corrections & result release',
  },
  {
    role: 'external_verifier',
    summary: 'Read-only audit of instruments, evidence & external findings',
  },
  {
    role: 'trainee',
    summary: 'Personal portfolio, assigned briefs & released assessment results',
  },
  {
    role: 'management',
    summary: 'Institutional pass rates, cohort trends & approved reports',
  },
];

export function LoginView() {
  const {
    institution,
    authStatus,
    setupFirstAdmin,
    loginWithCredentials,
  } = useAssessmentStore();

  const [activeTab, setActiveTab] = useState<LoginTab>('signin');

  // Sign In form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  // First-Run Super Admin Setup state (only available when 0 users exist in Supabase Auth)
  const [setupEmail, setSetupEmail] = useState('');
  const [setupFullName, setSetupFullName] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');
  const [showSetupPwd, setShowSetupPwd] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (authStatus.adminClaimed && activeTab === 'setup') {
      setActiveTab('signin');
    }
  }, [authStatus.adminClaimed, activeTab]);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!loginIdentifier.trim() || !loginPassword) {
      setErrorMsg(
        'Enter the email or Staff / Admission No. and password provided by your administrator.',
      );
      return;
    }
    setSubmitting(true);
    const res = await loginWithCredentials(loginIdentifier.trim(), loginPassword);
    setSubmitting(false);
    if (!res.ok) {
      setErrorMsg(res.error || 'Authentication failed.');
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!setupEmail.trim() || !setupFullName.trim()) {
      setErrorMsg('Provide administrator name and email address.');
      return;
    }
    if (setupPassword.length < 8) {
      setErrorMsg('Administrator password must be at least 8 characters.');
      return;
    }
    if (setupPassword !== setupConfirm) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    const res = await setupFirstAdmin(
      setupEmail.trim(),
      setupFullName.trim(),
      setupPassword,
    );
    setSubmitting(false);
    if (!res.ok) {
      setErrorMsg(res.error || 'Administrator setup failed.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        {/* Logo and Title Section */}
        <div className="text-center mb-8 space-y-4">
          <div className="inline-flex flex-col items-center">
            <div className="mb-3">
              <div className="text-[#003366] font-bold text-5xl leading-none mb-1">
                TVET
              </div>
              <div className="text-[#00A3E0] font-bold text-4xl leading-none tracking-wide">
                e-ASSESS
              </div>
            </div>
            <div className="text-right text-[#003366] font-bold text-lg leading-tight max-w-xs">
              <div>DIGITAL</div>
              <div>PRACTICAL</div>
              <div>ASSESSMENT</div>
              <div>PLATFORM</div>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 p-8">
          <div className="mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full border-2 border-slate-300 flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-3xl font-normal text-slate-600 uppercase tracking-wider">
                LOGIN
              </h2>
            </div>



            {errorMsg && (
              <div
                role="alert"
                className="flex items-start gap-2.5 px-3.5 py-3 text-xs font-medium text-red-900 bg-red-50 border border-red-200 rounded-lg"
              >
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* SIGN IN FORM */}
            {activeTab === 'signin' && (
              <form onSubmit={handleSignInSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="login-identifier"
                    className="sr-only"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      id="login-identifier"
                      type="text"
                      autoComplete="username"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="Email address"
                      className="w-full pl-14 pr-4 py-4 text-base text-slate-700 placeholder:text-slate-400 bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="sr-only"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="login-password"
                      type={showLoginPwd ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full pl-14 pr-12 py-4 text-base text-slate-700 placeholder:text-slate-400 bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPwd((v) => !v)}
                      aria-label={showLoginPwd ? 'Hide password' : 'Show password'}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      {showLoginPwd ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 px-4 text-lg font-semibold text-white uppercase tracking-wider bg-[#00A3E0] rounded-xl hover:bg-[#0088c0] disabled:opacity-60 transition-colors cursor-pointer shadow-lg"
                >
                  {submitting ? 'Signing In...' : 'LOGIN'}
                </button>
              </form>
            )}
          </div>

          {/* Institution Info Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <img
                src={instituteCrest}
                alt={institution.name}
                className="w-8 h-8 rounded object-cover"
              />
              <div className="text-xs font-medium text-slate-600">
                {institution.name}
              </div>
            </div>
            <p className="text-xs text-slate-500">
              {institution.department}
            </p>
          </div>
        </div>

        {/* Admin Setup Toggle (if applicable) */}
        {!authStatus.adminClaimed && (
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setActiveTab(activeTab === 'signin' ? 'setup' : 'signin');
              }}
              className="text-sm text-slate-600 hover:text-blue-700 underline cursor-pointer"
            >
              {activeTab === 'signin' 
                ? 'First-time setup? Create Super Admin account' 
                : 'Already have an account? Sign in'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
