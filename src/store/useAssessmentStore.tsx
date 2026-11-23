import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  DEFAULT_INSTITUTION,
  INITIAL_ALLOCATIONS,
  INITIAL_ASSESSMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_CLASSES,
  INITIAL_COURSES,
  INITIAL_DEPARTMENTS,
  INITIAL_SESSIONS,
  INITIAL_SYSTEM_USERS,
  INITIAL_TRAINEES,
  INITIAL_UNITS,
} from '../data/seedData';
import {
  calculatePercentage,
  calculateTotalAvailable,
  calculateTotalObtained,
  determineCompetency,
} from '../lib/calculations';
import { newUuid } from '../lib/uuid';
import type {
  Assessment,
  AssessmentEvidence,
  AssessmentSession,
  AssessmentType,
  AuditLogEntry,
  AuthDirectoryUser,
  AuthStateInfo,
  CohortClass,
  CorrectionRequest,
  Course,
  Department,
  Institution,
  SystemUser,
  Trainee,
  TrainerAllocation,
  Unit,
  UserRole,
  VerificationStatus,
} from '../types/tvet';

export interface SupabaseConnectionStatus {
  checked: boolean;
  configured: boolean;
  dbPoolConfigured: boolean;
  schemaReady: boolean;
  projectHost: string | null;
  errorDetail: string | null;
}

export interface RolePermissions {
  canManageInstitution: boolean;
  canManageUsers: boolean;
  canAllocateTrainers: boolean;
  canAuthorAssessments: boolean;
  canPublishAssessments: boolean;
  canConductAssessments: boolean;
  canInternalVerify: boolean;
  canExternalVerify: boolean;
  canReleaseResults: boolean;
  canApproveCorrections: boolean;
  canViewAllReports: boolean;
  isTraineeOnly: boolean;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Administrator',
  hod: 'Head of Department',
  trainer: 'Trainer / Assessor',
  internal_verifier: 'Internal Verifier',
  external_verifier: 'External Verifier',
  trainee: 'Trainee',
  management: 'Management',
};

export function getPermissionsForRole(role: UserRole): RolePermissions {
  return {
    canManageInstitution: role === 'super_admin' || role === 'hod',
    canManageUsers: role === 'super_admin' || role === 'hod',
    canAllocateTrainers: role === 'super_admin' || role === 'hod',
    canAuthorAssessments:
      role === 'super_admin' || role === 'hod' || role === 'trainer',
    canPublishAssessments:
      role === 'super_admin' || role === 'hod' || role === 'trainer',
    canConductAssessments:
      role === 'super_admin' || role === 'hod' || role === 'trainer',
    canInternalVerify:
      role === 'super_admin' || role === 'hod' || role === 'internal_verifier',
    canExternalVerify: role === 'external_verifier',
    canReleaseResults:
      role === 'super_admin' || role === 'hod' || role === 'internal_verifier',
    canApproveCorrections:
      role === 'super_admin' || role === 'hod' || role === 'internal_verifier',
    canViewAllReports: role !== 'trainee',
    isTraineeOnly: role === 'trainee',
  };
}

interface StoreState {
  institution: Institution;
  departments: Department[];
  courses: Course[];
  classes: CohortClass[];
  units: Unit[];
  systemUsers: SystemUser[];
  allocations: TrainerAllocation[];
  assessments: Assessment[];
  trainees: Trainee[];
  sessions: AssessmentSession[];
  auditLogs: AuditLogEntry[];
  activeUserId: string;
}

interface StoreContextValue extends StoreState {
  activeUser: SystemUser;
  authUser: SystemUser | null;
  authStatus: AuthStateInfo;
  authDirectory: AuthDirectoryUser[];
  permissions: RolePermissions;
  supabaseStatus: SupabaseConnectionStatus;
  refreshAuthStatus: () => Promise<void>;
  refreshAuthUsers: () => Promise<void>;
  setupFirstAdmin: (
    email: string,
    fullName: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  loginWithCredentials: (
    identifier: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  createAuthUser: (
    user: Omit<SystemUser, 'id'> & { password: string },
  ) => Promise<{ ok: boolean; error?: string }>;
  updateAuthUser: (
    userId: string,
    patch: {
      role?: UserRole;
      full_name?: string;
      staff_or_adm_no?: string;
      department_id?: string | null;
      password?: string;
    },
  ) => Promise<{ ok: boolean; error?: string }>;
  updateProfileAvatar: (
    avatarUrl: string | null,
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSupabaseStatus: () => Promise<void>;
  applySchemaToSupabase: () => Promise<{ success: boolean; message: string }>;
  seedSupabase: () => Promise<{ success: boolean; message: string }>;
  switchActiveUser: (userId: string) => void;
  updateInstitution: (inst: Institution) => void;
  addDepartment: (dept: Omit<Department, 'id'>) => Department;
  addCourse: (course: Omit<Course, 'id'>) => Course;
  addClass: (cls: Omit<CohortClass, 'id'>) => CohortClass;
  addUnit: (unit: Omit<Unit, 'id'>) => Unit;
  addSystemUser: (
    user: Omit<SystemUser, 'id'> & { initial_password?: string },
  ) => SystemUser;
  allocateTrainer: (
    alloc: Omit<TrainerAllocation, 'id' | 'allocated_by' | 'allocated_at'>,
  ) => TrainerAllocation;
  removeAllocation: (id: string) => void;
  saveAssessment: (assessment: Assessment) => void;
  deleteAssessment: (id: string) => void;
  publishAssessment: (id: string) => void;
  withdrawAssessment: (id: string) => void;
  createNewAssessmentVersion: (id: string) => Assessment | null;
  cloneAssessment: (id: string) => Assessment | null;
  importAssessmentDocument: (
    title: string,
    rawText: string,
    assessmentType: AssessmentType,
  ) => Assessment;
  addTrainee: (trainee: Omit<Trainee, 'id'>) => Trainee;
  createSession: (
    assessmentId: string,
    traineeId: string,
    assessorName: string,
    venue: string,
    assessmentDate?: string,
  ) => AssessmentSession;
  createReassessmentSession: (
    originalSessionId: string,
    venue?: string,
  ) => AssessmentSession | null;
  updateSession: (session: AssessmentSession) => void;
  addEvidenceToSession: (
    sessionId: string,
    evidence: Omit<
      AssessmentEvidence,
      'id' | 'uploaded_at' | 'assessor_name' | 'version' | 'previous_versions'
    >,
  ) => void;
  verifySession: (
    sessionId: string,
    decision: VerificationStatus,
    notes: string,
    verifierName: string,
  ) => { ok: boolean; error?: string };
  releaseSessionResults: (sessionId: string) => void;
  recordExternalFinding: (sessionId: string, notes: string) => void;
  submitCorrectionRequest: (
    sessionId: string,
    req: Omit<
      CorrectionRequest,
      'id' | 'session_id' | 'requested_by' | 'requested_at' | 'status'
    >,
  ) => void;
  reviewCorrectionRequest: (
    sessionId: string,
    requestId: string,
    decision: 'approved' | 'rejected',
    reviewNotes: string,
  ) => void;
  resetDemoData: () => void;
}

const STORAGE_KEY = 'tvet_eassess_workspace_v2';

const defaultState: StoreState = {
  institution: DEFAULT_INSTITUTION,
  departments: INITIAL_DEPARTMENTS,
  courses: INITIAL_COURSES,
  classes: INITIAL_CLASSES,
  units: INITIAL_UNITS,
  systemUsers: INITIAL_SYSTEM_USERS,
  allocations: INITIAL_ALLOCATIONS,
  assessments: INITIAL_ASSESSMENTS,
  trainees: INITIAL_TRAINEES,
  sessions: INITIAL_SESSIONS,
  auditLogs: INITIAL_AUDIT_LOGS,
  activeUserId: INITIAL_SYSTEM_USERS[2].id, // Default: Trainer / Assessor (Eng. Peter K. Wainaina)
};

const AssessmentStoreContext = createContext<StoreContextValue | null>(null);

export function AssessmentStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<StoreState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<StoreState>;
        if (
          parsed &&
          Array.isArray(parsed.assessments) &&
          Array.isArray(parsed.sessions)
        ) {
          return {
            ...defaultState,
            ...parsed,
            departments:
              Array.isArray(parsed.departments) && parsed.departments.length > 0
                ? parsed.departments
                : defaultState.departments,
            courses:
              Array.isArray(parsed.courses) && parsed.courses.length > 0
                ? parsed.courses
                : defaultState.courses,
            classes:
              Array.isArray(parsed.classes) && parsed.classes.length > 0
                ? parsed.classes
                : defaultState.classes,
            units:
              Array.isArray(parsed.units) && parsed.units.length > 0
                ? parsed.units
                : defaultState.units,
            systemUsers:
              Array.isArray(parsed.systemUsers) && parsed.systemUsers.length > 0
                ? parsed.systemUsers
                : defaultState.systemUsers,
            allocations: Array.isArray(parsed.allocations)
              ? parsed.allocations
              : defaultState.allocations,
            auditLogs: Array.isArray(parsed.auditLogs)
              ? parsed.auditLogs
              : defaultState.auditLogs,
          };
        }
      }
    } catch {
      // ignore storage read error
    }
    return defaultState;
  });

  // Keep Bearer session token and authenticated user strictly in React memory (never localStorage/sessionStorage)
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<SystemUser | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStateInfo>({
    checked: false,
    supabaseAuthConfigured: false,
    supabaseUserCount: 0,
    adminClaimed: false,
    envAdminPasscodeActive: false,
  });
  const [authDirectory, setAuthDirectory] = useState<AuthDirectoryUser[]>([]);

  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseConnectionStatus>(
    {
      checked: false,
      configured: false,
      dbPoolConfigured: false,
      schemaReady: false,
      projectHost: null,
      errorDetail: null,
    },
  );
  const sessionSyncTimers = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

  const activeUser = useMemo(
    () =>
      authUser ||
      state.systemUsers.find((u) => u.id === state.activeUserId) ||
      state.systemUsers[0] ||
      INITIAL_SYSTEM_USERS[2],
    [authUser, state.systemUsers, state.activeUserId],
  );

  const permissions = useMemo(
    () => getPermissionsForRole(activeUser.role),
    [activeUser.role],
  );

  const appendAuditLog = useCallback(
    (
      entity_type: AuditLogEntry['entity_type'],
      entity_id: string,
      action: string,
      details: string,
    ) => {
      const entry: AuditLogEntry = {
        id: newUuid(),
        entity_type,
        entity_id,
        action,
        actor_name: activeUser.full_name,
        actor_role: activeUser.role,
        details,
        timestamp: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        auditLogs: [entry, ...prev.auditLogs].slice(0, 250),
      }));
    },
    [activeUser.full_name, activeUser.role],
  );

  const mergeDirectoryIntoSystemUsers = useCallback(
    (directory: AuthDirectoryUser[]) => {
      if (!Array.isArray(directory) || directory.length === 0) return;
      setState((prev) => {
        const byEmail = new Map(
          prev.systemUsers.map((u) => [u.email.toLowerCase(), u]),
        );
        for (const d of directory) {
          const existing = byEmail.get(d.email.toLowerCase());
          if (!existing) {
            byEmail.set(d.email.toLowerCase(), {
              id: d.id,
              full_name: d.full_name,
              email: d.email,
              role: d.role,
              department_id: d.department_id || undefined,
              staff_or_adm_no: d.staff_or_adm_no,
              avatar_url: d.avatar_url ?? null,
              active: true,
            });
          } else {
            byEmail.set(d.email.toLowerCase(), {
              ...existing,
              id: d.id,
              full_name: d.full_name,
              role: d.role,
              staff_or_adm_no: d.staff_or_adm_no,
              avatar_url: d.avatar_url ?? existing.avatar_url ?? null,
            });
          }
        }
        return {
          ...prev,
          systemUsers: Array.from(byEmail.values()),
        };
      });
    },
    [],
  );

  const refreshAuthUsers = useCallback(
    async (tokenOverride?: string | null) => {
      const effectiveToken =
        tokenOverride !== undefined ? tokenOverride : authToken;
      if (!effectiveToken) return;
      try {
        const res = await fetch('/api/auth/users', {
          headers: { Authorization: `Bearer ${effectiveToken}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.users)) {
          setAuthDirectory(data.users);
          mergeDirectoryIntoSystemUsers(data.users);
        }
      } catch {
        // ignore transient errors
      }
    },
    [authToken, mergeDirectoryIntoSystemUsers],
  );

  const refreshAuthStatus = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }
      const res = await fetch('/api/auth/status', { headers });
      if (!res.ok) {
        setAuthStatus((prev) => ({ ...prev, checked: true }));
        return;
      }
      const data = await res.json();
      setAuthStatus({
        checked: true,
        supabaseAuthConfigured: Boolean(data.supabaseAuthConfigured),
        supabaseUserCount: Number(data.supabaseUserCount || 0),
        adminClaimed: Boolean(data.adminClaimed),
        envAdminPasscodeActive: Boolean(data.envAdminPasscodeActive),
      });
    } catch {
      setAuthStatus((prev) => ({ ...prev, checked: true }));
    }
  }, [authToken]);

  const refreshSupabaseStatus = useCallback(
    async (tokenOverride?: string | null) => {
      const effectiveToken =
        tokenOverride !== undefined ? tokenOverride : authToken;
      try {
        const res = await fetch('/api/supabase/status');
        if (!res.ok) return;
        const data = await res.json();
        const nextStatus: SupabaseConnectionStatus = {
          checked: true,
          configured: Boolean(data.configured),
          dbPoolConfigured: Boolean(data.dbPoolConfigured),
          schemaReady: Boolean(data.schemaReady),
          projectHost: data.projectHost || null,
          errorDetail: data.errorDetail || null,
        };
        setSupabaseStatus(nextStatus);

        if (
          effectiveToken &&
          nextStatus.configured &&
          nextStatus.schemaReady
        ) {
          const wsRes = await fetch('/api/workspace', {
            headers: { Authorization: `Bearer ${effectiveToken}` },
          });
          if (wsRes.ok) {
            const ws = await wsRes.json();
            if (
              ws.connected &&
              Array.isArray(ws.assessments) &&
              ws.assessments.length > 0
            ) {
            setState((prev) => ({
              ...prev,
              institution: ws.institution
                ? {
                    ...prev.institution,
                    id: ws.institution.id,
                    name: ws.institution.name,
                    department: ws.institution.department,
                    logo_url: ws.institution.logo_url || prev.institution.logo_url,
                    competency_threshold:
                      Number(ws.institution.competency_threshold) || 50,
                  }
                : prev.institution,
              assessments: ws.assessments.map((a: Record<string, unknown>) => ({
                ...(a as unknown as Assessment),
                tasks: Array.isArray(a.assessment_tasks)
                  ? (a.assessment_tasks as Record<string, unknown>[])
                      .sort(
                        (x, y) =>
                          Number(x.sort_order ?? 0) - Number(y.sort_order ?? 0),
                      )
                      .map((t) => ({
                        ...(t as unknown as Assessment['tasks'][number]),
                        items: Array.isArray(t.assessment_items)
                          ? (
                              t.assessment_items as Assessment['tasks'][number]['items']
                            ).sort(
                              (x, y) => (x.sort_order ?? 0) - (y.sort_order ?? 0),
                            )
                          : [],
                      }))
                  : [],
                checklists: Array.isArray(a.observation_checklists)
                  ? (a.observation_checklists as Record<string, unknown>[])
                      .sort(
                        (x, y) =>
                          Number(x.sort_order ?? 0) - Number(y.sort_order ?? 0),
                      )
                      .map((cl) => ({
                        ...(cl as unknown as Assessment['checklists'][number]),
                        criteria: Array.isArray(cl.checklist_criteria)
                          ? (
                              cl.checklist_criteria as Assessment['checklists'][number]['criteria']
                            ).sort(
                              (x, y) => (x.sort_order ?? 0) - (y.sort_order ?? 0),
                            )
                          : [],
                      }))
                  : [],
              })),
              trainees:
                Array.isArray(ws.trainees) && ws.trainees.length > 0
                  ? ws.trainees
                  : prev.trainees,
              sessions: Array.isArray(ws.sessions)
                ? ws.sessions.map((s: Record<string, unknown>) => {
                    const fbList = Array.isArray(s.assessment_feedback)
                      ? (s.assessment_feedback as Record<string, string>[])
                      : [];
                    return {
                      ...(s as unknown as AssessmentSession),
                      results: Array.isArray(s.criterion_results)
                        ? (s.criterion_results as AssessmentSession['results'])
                        : [],
                      checklist_results: Array.isArray(s.checklist_results)
                        ? (
                            s.checklist_results as AssessmentSession['checklist_results']
                          )
                        : [],
                      feedback_from_candidate:
                        fbList[0]?.feedback_from_candidate || '',
                      feedback_to_candidate:
                        fbList[0]?.feedback_to_candidate || '',
                    };
                  })
                : prev.sessions,
            }));
          }
        }
      }
      } catch {
        setSupabaseStatus((prev) => ({ ...prev, checked: true }));
      }
    },
    [authToken],
  );

  useEffect(() => {
    refreshAuthStatus();
  }, [refreshAuthStatus]);

  useEffect(() => {
    refreshSupabaseStatus();
  }, [refreshSupabaseStatus]);

  const applyAuthenticatedSession = useCallback(
    (data: {
      token: string;
      user: SystemUser;
    }) => {
      const authenticatedUser: SystemUser = {
        ...data.user,
        active: true,
      };
      setAuthToken(data.token);
      setAuthUser(authenticatedUser);
      setAuthStatus((prev) => ({
        ...prev,
        checked: true,
        adminClaimed: true,
      }));
      setState((prev) => ({
        ...prev,
        activeUserId: authenticatedUser.id,
      }));
      refreshSupabaseStatus(data.token);
      if (
        authenticatedUser.role === 'super_admin' ||
        authenticatedUser.role === 'hod'
      ) {
        refreshAuthUsers(data.token);
      }
    },
    [refreshAuthUsers, refreshSupabaseStatus],
  );

  const setupFirstAdmin = async (
    email: string,
    fullName: string,
    password: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: fullName, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || 'Setup failed.' };
      }
      applyAuthenticatedSession(data);
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Network error.',
      };
    }
  };

  const loginWithCredentials = async (
    identifier: string,
    password: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || 'Sign in failed.' };
      }
      applyAuthenticatedSession(data);
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Network error.',
      };
    }
  };

  const createAuthUser = async (
    userInput: Omit<SystemUser, 'id'> & { password: string },
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!authToken) {
      return { ok: false, error: 'Authentication required.' };
    }
    try {
      const res = await fetch('/api/auth/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(userInput),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || 'Failed to create user in Supabase Auth.' };
      }
      if (Array.isArray(data.users)) {
        setAuthDirectory(data.users);
        mergeDirectoryIntoSystemUsers(data.users);
      }
      if (data.user) {
        appendAuditLog(
          'institution',
          data.user.id,
          'SUPABASE_AUTH_USER_CREATED',
          `Created login details in Supabase Auth for ${data.user.full_name} (${ROLE_LABELS[data.user.role as UserRole]})`,
        );
      }
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Network error.',
      };
    }
  };

  const updateAuthUser = async (
    userId: string,
    patch: {
      role?: UserRole;
      full_name?: string;
      staff_or_adm_no?: string;
      department_id?: string | null;
      password?: string;
    },
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!authToken) {
      return { ok: false, error: 'Authentication required.' };
    }
    try {
      const res = await fetch(`/api/auth/users/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || 'Failed to update Supabase Auth user.' };
      }
      if (Array.isArray(data.users)) {
        setAuthDirectory(data.users);
        mergeDirectoryIntoSystemUsers(data.users);
      }
      appendAuditLog(
        'institution',
        userId,
        'SUPABASE_AUTH_USER_UPDATED',
        `Updated Supabase Auth credentials/role for user ${userId}`,
      );
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Network error.',
      };
    }
  };

  const updateProfileAvatar = async (
    avatarUrl: string | null,
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!authToken || !authUser) {
      return { ok: false, error: 'Authentication required.' };
    }
    try {
      const res = await fetch('/api/auth/profile-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ avatar_url: avatarUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          ok: false,
          error: data.error || 'Failed to update profile picture.',
        };
      }
      const nextAvatar: string | null = data.avatar_url ?? null;
      const targetEmail = authUser.email.toLowerCase();

      setAuthUser((prev) =>
        prev ? { ...prev, avatar_url: nextAvatar } : prev,
      );
      setState((prev) => ({
        ...prev,
        systemUsers: prev.systemUsers.map((u) =>
          u.email.toLowerCase() === targetEmail
            ? { ...u, avatar_url: nextAvatar }
            : u,
        ),
      }));
      setAuthDirectory((prev) =>
        prev.map((d) =>
          d.email.toLowerCase() === targetEmail
            ? { ...d, avatar_url: nextAvatar }
            : d,
        ),
      );
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Network error.',
      };
    }
  };

  const logout = async (): Promise<void> => {
    setAuthToken(null);
    setAuthUser(null);
    setAuthDirectory([]);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    refreshAuthStatus();
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage write error
    }
  }, [state]);

  const applySchemaToSupabase = async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      const headers: Record<string, string> = {};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
      const res = await fetch('/api/supabase/apply-schema', {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      await refreshSupabaseStatus();
      return {
        success: Boolean(data.success),
        message: data.message || data.error || 'Done',
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Request failed',
      };
    }
  };

  const seedSupabase = async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      const headers: Record<string, string> = {};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
      const res = await fetch('/api/supabase/seed', {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      await refreshSupabaseStatus();
      return {
        success: Boolean(data.success),
        message: data.message || data.error || 'Done',
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Request failed',
      };
    }
  };

  const switchActiveUser = (userId: string) => {
    setState((prev) => ({ ...prev, activeUserId: userId }));
  };

  const updateInstitution = (institution: Institution) => {
    setState((prev) => ({ ...prev, institution }));
    appendAuditLog(
      'institution',
      institution.id,
      'INSTITUTION_UPDATED',
      `Updated institutional policy (${institution.oral_weight_percent ?? 30}% Oral / ${institution.practical_weight_percent ?? 70}% Practical, Threshold ${institution.competency_threshold}%)`,
    );
    if (authToken && supabaseStatus.configured && supabaseStatus.schemaReady) {
      fetch('/api/institution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(institution),
      }).catch(() => {});
    }
  };

  const addDepartment = (dept: Omit<Department, 'id'>): Department => {
    const created: Department = { ...dept, id: newUuid() };
    setState((prev) => ({
      ...prev,
      departments: [...prev.departments, created],
    }));
    appendAuditLog('institution', created.id, 'DEPARTMENT_CREATED', `Created department ${created.name}`);
    return created;
  };

  const addCourse = (course: Omit<Course, 'id'>): Course => {
    const created: Course = { ...course, id: newUuid() };
    setState((prev) => ({ ...prev, courses: [...prev.courses, created] }));
    appendAuditLog('institution', created.id, 'COURSE_CREATED', `Created course ${created.title} (${created.level})`);
    return created;
  };

  const addClass = (cls: Omit<CohortClass, 'id'>): CohortClass => {
    const created: CohortClass = { ...cls, id: newUuid() };
    setState((prev) => ({ ...prev, classes: [...prev.classes, created] }));
    appendAuditLog('institution', created.id, 'CLASS_CREATED', `Created class ${created.name} (${created.cycle})`);
    return created;
  };

  const addUnit = (unit: Omit<Unit, 'id'>): Unit => {
    const created: Unit = { ...unit, id: newUuid() };
    setState((prev) => ({ ...prev, units: [...prev.units, created] }));
    appendAuditLog('institution', created.id, 'UNIT_CREATED', `Added unit ${created.code} — ${created.name}`);
    return created;
  };

  const addSystemUser = (
    userInput: Omit<SystemUser, 'id'> & { initial_password?: string },
  ): SystemUser => {
    const { initial_password, ...userFields } = userInput;
    const created: SystemUser = { ...userFields, id: newUuid() };
    setState((prev) => ({
      ...prev,
      systemUsers: [...prev.systemUsers, created],
    }));
    appendAuditLog(
      'institution',
      created.id,
      'USER_REGISTERED',
      `Registered ${created.full_name} as ${ROLE_LABELS[created.role]}`,
    );
    if (authToken) {
      fetch('/api/auth/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          ...userFields,
          password: initial_password || undefined,
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((res) => {
          if (res?.users) {
            setAuthDirectory(res.users);
            mergeDirectoryIntoSystemUsers(res.users);
          }
        })
        .catch(() => {});
    }
    return created;
  };

  const allocateTrainer = (
    alloc: Omit<TrainerAllocation, 'id' | 'allocated_by' | 'allocated_at'>,
  ): TrainerAllocation => {
    const created: TrainerAllocation = {
      ...alloc,
      id: newUuid(),
      allocated_by: activeUser.full_name,
      allocated_at: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      allocations: [created, ...prev.allocations],
    }));
    appendAuditLog(
      'allocation',
      created.id,
      'TRAINER_ALLOCATED',
      `Allocated trainer to class/unit for ${created.academic_year} ${created.term}`,
    );
    return created;
  };

  const removeAllocation = (id: string) => {
    setState((prev) => ({
      ...prev,
      allocations: prev.allocations.filter((a) => a.id !== id),
    }));
  };

  const saveAssessment = (assessment: Assessment) => {
    setState((prev) => {
      const exists = prev.assessments.some((a) => a.id === assessment.id);
      const next = exists
        ? prev.assessments.map((a) => (a.id === assessment.id ? assessment : a))
        : [assessment, ...prev.assessments];
      return { ...prev, assessments: next };
    });
    appendAuditLog(
      'assessment',
      assessment.id,
      'ASSESSMENT_SAVED',
      `Saved ${assessment.title} (v${assessment.version ?? 1}, ${assessment.status})`,
    );

    if (authToken && supabaseStatus.configured && supabaseStatus.schemaReady) {
      fetch('/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(assessment),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((res) => {
          if (res?.synced) {
            refreshSupabaseStatus();
          }
        })
        .catch(() => {});
    }
  };

  const deleteAssessment = (id: string) => {
    setState((prev) => ({
      ...prev,
      assessments: prev.assessments.filter((a) => a.id !== id),
    }));
    if (authToken && supabaseStatus.configured && supabaseStatus.schemaReady) {
      fetch(`/api/assessments/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      }).catch(() => {});
    }
  };

  const publishAssessment = (id: string) => {
    const now = new Date().toISOString();
    let publishedTarget: Assessment | null = null;
    setState((prev) => ({
      ...prev,
      assessments: prev.assessments.map((a) => {
        if (a.id !== id) return a;
        publishedTarget = {
          ...a,
          status: 'published',
          published_at: now,
          updated_at: now,
        };
        return publishedTarget;
      }),
    }));
    appendAuditLog('assessment', id, 'ASSESSMENT_PUBLISHED', 'Published assessment instrument');
    if (
      publishedTarget &&
      authToken &&
      supabaseStatus.configured &&
      supabaseStatus.schemaReady
    ) {
      fetch('/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(publishedTarget),
      }).catch(() => {});
    }
  };

  const withdrawAssessment = (id: string) => {
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      assessments: prev.assessments.map((a) =>
        a.id === id ? { ...a, status: 'withdrawn', updated_at: now } : a,
      ),
    }));
    appendAuditLog('assessment', id, 'ASSESSMENT_WITHDRAWN', 'Withdrew published assessment from active circulation');
  };

  const createNewAssessmentVersion = (id: string): Assessment | null => {
    const source = state.assessments.find((a) => a.id === id);
    if (!source) return null;
    const newId = newUuid();
    const nextVersion = (source.version ?? 1) + 1;

    const clonedTasks = source.tasks.map((t) => {
      const nextTaskId = newUuid();
      const idMap = new Map<string, string>();
      t.items.forEach((it) => idMap.set(it.id, newUuid()));
      return {
        ...t,
        id: nextTaskId,
        assessment_id: newId,
        items: t.items.map((it) => ({
          ...it,
          id: idMap.get(it.id) || newUuid(),
          task_id: nextTaskId,
          parent_item_id: it.parent_item_id
            ? idMap.get(it.parent_item_id) || null
            : null,
        })),
      };
    });

    const clonedChecklists = source.checklists.map((cl) => {
      const nextClId = newUuid();
      const idMap = new Map<string, string>();
      cl.criteria.forEach((c) => idMap.set(c.id, newUuid()));
      return {
        ...cl,
        id: nextClId,
        assessment_id: newId,
        criteria: cl.criteria.map((c) => ({
          ...c,
          id: idMap.get(c.id) || newUuid(),
          checklist_id: nextClId,
          parent_criteria_id: c.parent_criteria_id
            ? idMap.get(c.parent_criteria_id) || null
            : null,
        })),
      };
    });

    const newVersionAssess: Assessment = {
      ...source,
      id: newId,
      version: nextVersion,
      parent_assessment_id: source.id,
      status: 'draft',
      published_at: undefined,
      updated_at: new Date().toISOString(),
      tasks: clonedTasks,
      checklists: clonedChecklists,
    };

    setState((prev) => ({
      ...prev,
      assessments: [newVersionAssess, ...prev.assessments],
    }));
    appendAuditLog(
      'assessment',
      newId,
      'ASSESSMENT_VERSION_CREATED',
      `Created draft v${nextVersion} from ${source.title} (v${source.version ?? 1})`,
    );
    return newVersionAssess;
  };

  const cloneAssessment = (id: string): Assessment | null => {
    const source = state.assessments.find((a) => a.id === id);
    if (!source) return null;
    const created = createNewAssessmentVersion(id);
    if (!created) return null;
    const renamed: Assessment = {
      ...created,
      title: `${source.title} (Template Copy)`,
      version: 1,
      parent_assessment_id: null,
      assessment_number: source.assessment_number + 1,
    };
    setState((prev) => ({
      ...prev,
      assessments: prev.assessments.map((a) => (a.id === created.id ? renamed : a)),
    }));
    return renamed;
  };

  const importAssessmentDocument = (
    title: string,
    rawText: string,
    assessmentType: AssessmentType,
  ): Assessment => {
    const assessId = newUuid();
    const clId = newUuid();
    const taskId = newUuid();

    // Parse lines cleanly: supports JSON rubric OR plain-text numbered items with marks like "(5 marks)" or "[5]"
    let parsedTasks = null;
    try {
      const maybeJson = JSON.parse(rawText);
      if (maybeJson && Array.isArray(maybeJson.tasks)) {
        parsedTasks = maybeJson.tasks;
      }
    } catch {
      // plain text mode
    }

    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 3);

    const items = parsedTasks
      ? parsedTasks[0]?.items?.map((it: Record<string, unknown>, idx: number) => ({
          id: newUuid(),
          task_id: taskId,
          item_number: String(it.item_number || idx + 1),
          description: String(it.description || `Imported criterion ${idx + 1}`),
          max_marks: Number(it.max_marks) || 5,
          is_subcriterion: Boolean(it.is_subcriterion),
          parent_item_id: null,
          sort_order: idx,
        })) || []
      : lines.slice(0, 15).map((line, idx) => {
          const markMatch = line.match(/(?:\(|\[)(\d+(?:\.\d+)?)\s*(?:marks?|pts?)?(?:\)|\])/i);
          const marks = markMatch ? parseFloat(markMatch[1]) : 5;
          const cleanDesc = line
            .replace(/^\d+[.)]\s*/, '')
            .replace(/(?:\(|\[)\d+(?:\.\d+)?\s*(?:marks?|pts?)?(?:\)|\])/gi, '')
            .trim();
          return {
            id: newUuid(),
            task_id: taskId,
            item_number: String(idx + 1),
            description: cleanDesc || line,
            max_marks: Number.isFinite(marks) ? marks : 5,
            is_subcriterion: false,
            parent_item_id: null,
            sort_order: idx,
          };
        });

    const imported: Assessment = {
      id: assessId,
      institution_id: state.institution.id,
      title: title.trim() || 'Imported Assessment Instrument',
      assessment_number: 1,
      assessment_type: assessmentType,
      department_name: state.institution.department,
      course_title: state.courses[0]?.title || 'ELECTRICAL INSTALLATION',
      class_name: state.classes[0]?.name || 'EE-L5-JAN25',
      level: 'LEVEL 5',
      cycle: 'Cycle 3',
      unit_code: state.units[0]?.code || 'ENG/CU/EI/CR/03/5/MA',
      unit_name: state.units[0]?.name || 'Imported Unit',
      assessment_date: new Date().toISOString().split('T')[0],
      duration_minutes: 180,
      academic_year: state.institution.active_academic_year || '2026',
      term: state.institution.active_term || 'Term 3',
      status: 'draft',
      version: 1,
      created_by: activeUser.full_name,
      instructions: 'Review imported criteria and marking guidelines before publishing.',
      competency_threshold: state.institution.competency_threshold || 50,
      updated_at: new Date().toISOString(),
      checklists: [
        {
          id: clId,
          assessment_id: assessId,
          title: 'OBSERVATION CHECKLIST',
          instruction: 'Items to be Evaluated: Award marks and enter observations.',
          scoring_mode: 'numerical',
          sort_order: 0,
          criteria: [
            {
              id: newUuid(),
              checklist_id: clId,
              item_number: '1',
              description: 'Observed workshop safety and PPE compliance',
              max_marks: 4,
              is_subitem: false,
              parent_criteria_id: null,
              sort_order: 0,
            },
          ],
        },
      ],
      tasks: [
        {
          id: taskId,
          assessment_id: assessId,
          task_number: 1,
          task_title: 'Imported Practical Task',
          sort_order: 0,
          items:
            items.length > 0
              ? items
              : [
                  {
                    id: newUuid(),
                    task_id: taskId,
                    item_number: '1',
                    description: 'Imported assessment criterion',
                    max_marks: 10,
                    is_subcriterion: false,
                    parent_item_id: null,
                    sort_order: 0,
                  },
                ],
        },
      ],
    };

    setState((prev) => ({
      ...prev,
      assessments: [imported, ...prev.assessments],
    }));
    appendAuditLog(
      'assessment',
      assessId,
      'ASSESSMENT_IMPORTED',
      `Imported draft assessment "${imported.title}" (${imported.tasks[0].items.length} criteria)`,
    );
    return imported;
  };

  const addTrainee = (traineeInput: Omit<Trainee, 'id'>): Trainee => {
    const created: Trainee = {
      ...traineeInput,
      id: newUuid(),
    };
    setState((prev) => ({
      ...prev,
      trainees: [...prev.trainees, created],
    }));
    appendAuditLog(
      'institution',
      created.id,
      'TRAINEE_REGISTERED',
      `Registered trainee ${created.full_name} (${created.admission_number})`,
    );

    if (authToken && supabaseStatus.configured && supabaseStatus.schemaReady) {
      fetch('/api/trainees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(created),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((res) => {
          if (res?.synced && res.trainee?.id && res.trainee.id !== created.id) {
            setState((prev) => ({
              ...prev,
              trainees: prev.trainees.map((t) =>
                t.id === created.id ? { ...t, id: res.trainee.id } : t,
              ),
            }));
          }
        })
        .catch(() => {});
    }
    return created;
  };

  const syncSessionToSupabase = useCallback(
    (session: AssessmentSession, immediate = false) => {
      if (!authToken || !supabaseStatus.configured || !supabaseStatus.schemaReady)
        return;
      const prevTimer = sessionSyncTimers.current[session.id];
      if (prevTimer) clearTimeout(prevTimer);

      const doSync = () => {
        fetch('/api/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(session),
        }).catch(() => {});
      };

      if (immediate) {
        doSync();
      } else {
        sessionSyncTimers.current[session.id] = setTimeout(doSync, 500);
      }
    },
    [authToken, supabaseStatus.configured, supabaseStatus.schemaReady],
  );

  const createSession = (
    assessmentId: string,
    traineeId: string,
    assessorName: string,
    venue: string,
    assessmentDate?: string,
  ): AssessmentSession => {
    const newSession: AssessmentSession = {
      id: newUuid(),
      assessment_id: assessmentId,
      trainee_id: traineeId,
      assessor_user_id: activeUser.id,
      assessor_name: assessorName || activeUser.full_name,
      assessment_date: assessmentDate || new Date().toISOString().split('T')[0],
      venue: venue || 'Workshop A1',
      status: 'in_progress',
      attempt_number: 1,
      grand_total_available: 0,
      grand_total_obtained: 0,
      percentage: 0,
      competency_outcome: 'Pending',
      results: [],
      checklist_results: [],
      evidence: [],
      correction_requests: [],
      feedback_from_candidate: '',
      feedback_to_candidate: '',
      updated_at: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      sessions: [newSession, ...prev.sessions],
    }));
    syncSessionToSupabase(newSession, true);
    return newSession;
  };

  const createReassessmentSession = (
    originalSessionId: string,
    venue?: string,
  ): AssessmentSession | null => {
    const orig = state.sessions.find((s) => s.id === originalSessionId);
    if (!orig) return null;
    const existingAttempts = state.sessions.filter(
      (s) =>
        s.assessment_id === orig.assessment_id &&
        s.trainee_id === orig.trainee_id,
    );
    const nextAttempt = existingAttempts.length + 1;
    const reassessment: AssessmentSession = {
      id: newUuid(),
      assessment_id: orig.assessment_id,
      trainee_id: orig.trainee_id,
      assessor_user_id: activeUser.id,
      assessor_name: activeUser.full_name,
      assessment_date: new Date().toISOString().split('T')[0],
      venue: venue || orig.venue,
      status: 'in_progress',
      attempt_number: nextAttempt,
      parent_session_id: orig.id,
      is_reassessment: true,
      grand_total_available: orig.grand_total_available,
      grand_total_obtained: 0,
      percentage: 0,
      competency_outcome: 'Pending',
      results: [],
      checklist_results: [],
      evidence: [],
      correction_requests: [],
      feedback_from_candidate: '',
      feedback_to_candidate: '',
      updated_at: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      sessions: [reassessment, ...prev.sessions],
    }));
    appendAuditLog(
      'session',
      reassessment.id,
      'REASSESSMENT_CREATED',
      `Created Reassessment Attempt #${nextAttempt} linked to original session`,
    );
    syncSessionToSupabase(reassessment, true);
    return reassessment;
  };

  const updateSession = (session: AssessmentSession) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) => (s.id === session.id ? session : s)),
    }));
    syncSessionToSupabase(session, session.status === 'submitted');
  };

  const addEvidenceToSession = (
    sessionId: string,
    evidenceInput: Omit<
      AssessmentEvidence,
      'id' | 'uploaded_at' | 'assessor_name' | 'version' | 'previous_versions'
    >,
  ) => {
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) => {
        if (s.id !== sessionId) return s;
        const currentList = s.evidence || [];
        const existingIdx = currentList.findIndex(
          (e) =>
            e.target_id === evidenceInput.target_id &&
            e.category === evidenceInput.category,
        );
        if (existingIdx >= 0) {
          const old = currentList[existingIdx];
          const prevVersions = [
            ...(old.previous_versions || []),
            {
              version: old.version,
              file_name: old.file_name,
              mime_type: old.mime_type,
              file_size: old.file_size,
              uploaded_at: old.uploaded_at,
              uploaded_by: old.assessor_name,
              preview_url: old.preview_url,
            },
          ];
          const replaced: AssessmentEvidence = {
            ...evidenceInput,
            id: old.id,
            uploaded_at: now,
            assessor_name: activeUser.full_name,
            version: old.version + 1,
            previous_versions: prevVersions,
          };
          const nextList = [...currentList];
          nextList[existingIdx] = replaced;
          return { ...s, evidence: nextList, updated_at: now };
        }
        const created: AssessmentEvidence = {
          ...evidenceInput,
          id: newUuid(),
          uploaded_at: now,
          assessor_name: activeUser.full_name,
          version: 1,
          previous_versions: [],
        };
        return { ...s, evidence: [...currentList, created], updated_at: now };
      }),
    }));
    appendAuditLog(
      'evidence',
      sessionId,
      'EVIDENCE_UPLOADED',
      `Uploaded ${evidenceInput.category} "${evidenceInput.file_name}" for ${evidenceInput.target_label}`,
    );
  };

  const verifySession = (
    sessionId: string,
    decision: VerificationStatus,
    notes: string,
    verifierName: string,
  ): { ok: boolean; error?: string } => {
    const target = state.sessions.find((s) => s.id === sessionId);
    if (!target) return { ok: false, error: 'Session not found.' };

    // Section 7.10 rule: Prevent assessors from verifying their own assessments
    const actorName = (verifierName || activeUser.full_name).trim().toLowerCase();
    if (
      target.assessor_name.trim().toLowerCase() === actorName ||
      (target.assessor_user_id && target.assessor_user_id === activeUser.id && activeUser.role !== 'super_admin')
    ) {
      return {
        ok: false,
        error:
          'Conflict of interest: An assessor cannot verify an assessment they conducted.',
      };
    }

    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) => {
        if (s.id !== sessionId) return s;
        const nextStatus =
          decision === 'approved'
            ? 'verified'
            : decision === 'returned'
              ? 'returned'
              : decision === 'rejected'
                ? 'rejected'
                : s.status;
        return {
          ...s,
          status: nextStatus,
          verification_status: decision,
          verification_notes: notes,
          verifier_name: verifierName || activeUser.full_name,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }),
    }));
    appendAuditLog(
      'session',
      sessionId,
      `VERIFICATION_${decision.toUpperCase()}`,
      `Internal verification decision: ${decision}. ${notes || ''}`,
    );

    if (authToken && supabaseStatus.configured && supabaseStatus.schemaReady) {
      fetch(`/api/sessions/${encodeURIComponent(sessionId)}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          decision,
          notes,
          verifierName: verifierName || activeUser.full_name,
        }),
      }).catch(() => {});
    }
    return { ok: true };
  };

  const releaseSessionResults = (sessionId: string) => {
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              results_released: true,
              released_at: now,
              released_by: activeUser.full_name,
              updated_at: now,
            }
          : s,
      ),
    }));
    appendAuditLog(
      'session',
      sessionId,
      'RESULTS_RELEASED',
      `Released verified assessment results to candidate`,
    );
  };

  const recordExternalFinding = (sessionId: string, notes: string) => {
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              external_verifier_name: activeUser.full_name,
              external_verification_notes: notes,
              external_verified_at: now,
              updated_at: now,
            }
          : s,
      ),
    }));
    appendAuditLog(
      'session',
      sessionId,
      'EXTERNAL_VERIFICATION_FINDING',
      notes,
    );
  };

  const submitCorrectionRequest = (
    sessionId: string,
    req: Omit<
      CorrectionRequest,
      'id' | 'session_id' | 'requested_by' | 'requested_at' | 'status'
    >,
  ) => {
    const now = new Date().toISOString();
    const created: CorrectionRequest = {
      ...req,
      id: newUuid(),
      session_id: sessionId,
      requested_by: activeUser.full_name,
      requested_at: now,
      status: 'pending',
    };
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              correction_requests: [created, ...(s.correction_requests || [])],
              updated_at: now,
            }
          : s,
      ),
    }));
    appendAuditLog(
      'correction',
      created.id,
      'CORRECTION_REQUESTED',
      `Requested correction on ${req.target_label}: ${req.previous_marks} → ${req.requested_marks} (${req.reason})`,
    );
  };

  const reviewCorrectionRequest = (
    sessionId: string,
    requestId: string,
    decision: 'approved' | 'rejected',
    reviewNotes: string,
  ) => {
    const now = new Date().toISOString();
    let updatedSessionForSync: AssessmentSession | null = null;
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) => {
        if (s.id !== sessionId) return s;
        const targetReq = (s.correction_requests || []).find(
          (r) => r.id === requestId,
        );
        if (!targetReq) return s;

        let nextResults = s.results;
        let nextChecklist = s.checklist_results;
        if (decision === 'approved') {
          if (targetReq.target_type === 'task_item') {
            const exists = s.results.some((r) => r.item_id === targetReq.target_id);
            nextResults = exists
              ? s.results.map((r) =>
                  r.item_id === targetReq.target_id
                    ? { ...r, marks_obtained: targetReq.requested_marks }
                    : r,
                )
              : [
                  ...s.results,
                  {
                    item_id: targetReq.target_id,
                    marks_obtained: targetReq.requested_marks,
                    comments: 'Corrected per approval',
                  },
                ];
          } else {
            const exists = s.checklist_results.some(
              (r) => r.criteria_id === targetReq.target_id,
            );
            nextChecklist = exists
              ? s.checklist_results.map((r) =>
                  r.criteria_id === targetReq.target_id
                    ? { ...r, marks_obtained: targetReq.requested_marks }
                    : r,
                )
              : [
                  ...s.checklist_results,
                  {
                    criteria_id: targetReq.target_id,
                    marks_obtained: targetReq.requested_marks,
                    comments: 'Corrected per approval',
                  },
                ];
          }
        }

        const assess = prev.assessments.find((a) => a.id === s.assessment_id);
        const avail = assess
          ? calculateTotalAvailable(assess.tasks, assess.checklists)
          : s.grand_total_available;
        const obtained = assess
          ? calculateTotalObtained(
              assess.tasks,
              assess.checklists,
              nextResults,
              nextChecklist,
            )
          : s.grand_total_obtained;
        const pct = calculatePercentage(obtained, avail);
        const threshold =
          assess?.competency_threshold || prev.institution.competency_threshold || 50;
        const outcome = determineCompetency(pct, threshold);

        const nextSession: AssessmentSession = {
          ...s,
          results: nextResults,
          checklist_results: nextChecklist,
          grand_total_available: avail,
          grand_total_obtained: obtained,
          percentage: Number(pct.toFixed(2)),
          competency_outcome: outcome,
          correction_requests: (s.correction_requests || []).map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: decision,
                  reviewed_by: activeUser.full_name,
                  reviewed_at: now,
                  review_notes: reviewNotes,
                }
              : r,
          ),
          updated_at: now,
        };
        updatedSessionForSync = nextSession;
        return nextSession;
      }),
    }));

    appendAuditLog(
      'correction',
      requestId,
      `CORRECTION_${decision.toUpperCase()}`,
      reviewNotes || `Correction ${decision}`,
    );

    if (updatedSessionForSync) {
      syncSessionToSupabase(updatedSessionForSync, true);
    }
  };

  const resetDemoData = () => {
    setState(defaultState);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <AssessmentStoreContext.Provider
      value={{
        ...state,
        activeUser,
        authUser,
        authStatus,
        authDirectory,
        permissions,
        supabaseStatus,
        refreshAuthStatus,
        refreshAuthUsers,
        setupFirstAdmin,
        loginWithCredentials,
        createAuthUser,
        updateAuthUser,
        updateProfileAvatar,
        logout,
        refreshSupabaseStatus,
        applySchemaToSupabase,
        seedSupabase,
        switchActiveUser,
        updateInstitution,
        addDepartment,
        addCourse,
        addClass,
        addUnit,
        addSystemUser,
        allocateTrainer,
        removeAllocation,
        saveAssessment,
        deleteAssessment,
        publishAssessment,
        withdrawAssessment,
        createNewAssessmentVersion,
        cloneAssessment,
        importAssessmentDocument,
        addTrainee,
        createSession,
        createReassessmentSession,
        updateSession,
        addEvidenceToSession,
        verifySession,
        releaseSessionResults,
        recordExternalFinding,
        submitCorrectionRequest,
        reviewCorrectionRequest,
        resetDemoData,
      }}
    >
      {children}
    </AssessmentStoreContext.Provider>
  );
}

export function useAssessmentStore(): StoreContextValue {
  const ctx = useContext(AssessmentStoreContext);
  if (!ctx) {
    throw new Error(
      'useAssessmentStore must be used inside AssessmentStoreProvider',
    );
  }
  return ctx;
}
