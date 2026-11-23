import React, { useEffect, useState } from 'react';
import {
  Building2,
  Check,
  KeyRound,
  Layers,
  Lock,
  Plus,
  RefreshCw,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { ROLE_LABELS, useAssessmentStore } from '../store/useAssessmentStore';
import type { AuthDirectoryUser, UserRole } from '../types/tvet';

type AdminTab = 'policy' | 'structures' | 'users' | 'allocations';

export function AdminModuleView() {
  const {
    institution,
    departments,
    courses,
    classes,
    units,
    systemUsers,
    authDirectory,
    allocations,
    trainees,
    activeUser,
    permissions,
    updateInstitution,
    addDepartment,
    addCourse,
    addClass,
    addUnit,
    createAuthUser,
    updateAuthUser,
    refreshAuthUsers,
    allocateTrainer,
    removeAllocation,
    addTrainee,
  } = useAssessmentStore();

  const [tab, setTab] = useState<AdminTab>('policy');
  const [savedNotice, setSavedNotice] = useState('');

  useEffect(() => {
    if (tab === 'users' && permissions.canManageUsers) {
      refreshAuthUsers();
    }
  }, [tab, permissions.canManageUsers, refreshAuthUsers]);

  // Institution & Policy form
  const [instName, setInstName] = useState(institution.name);
  const [instDept, setInstDept] = useState(institution.department);
  const [threshold, setThreshold] = useState(institution.competency_threshold);
  const [oralWeight, setOralWeight] = useState(institution.oral_weight_percent ?? 30);
  const [practicalWeight, setPracticalWeight] = useState(
    institution.practical_weight_percent ?? 70,
  );
  const [activeYear, setActiveYear] = useState(
    institution.active_academic_year || '2026',
  );
  const [activeTerm, setActiveTerm] = useState(
    institution.active_term || 'Term 3',
  );

  // Department form
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptHod, setDeptHod] = useState('');

  // Course form
  const [courseDeptId, setCourseDeptId] = useState(departments[0]?.id || '');
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseLevel, setCourseLevel] = useState('LEVEL 5');

  // Class form
  const [classCourseId, setClassCourseId] = useState(courses[0]?.id || '');
  const [className, setClassName] = useState('');
  const [classCycle, setClassCycle] = useState('Cycle 3');
  const [classLevel, setClassLevel] = useState('LEVEL 5');

  // Unit form
  const [unitCourseId, setUnitCourseId] = useState(courses[0]?.id || '');
  const [unitCode, setUnitCode] = useState('');
  const [unitName, setUnitName] = useState('');
  const [unitLevel, setUnitLevel] = useState('LEVEL 5');

  // User form (Supabase Auth provisioning)
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('trainer');
  const [userStaffNo, setUserStaffNo] = useState('');
  const [userDeptId, setUserDeptId] = useState(departments[0]?.id || '');
  const [userInitialPassword, setUserInitialPassword] = useState('');
  const [userFormError, setUserFormError] = useState('');
  const [userSubmitting, setUserSubmitting] = useState(false);

  // Edit existing Supabase Auth user / assign login modal state
  const [editingUser, setEditingUser] = useState<AuthDirectoryUser | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('trainer');
  const [editStaffNo, setEditStaffNo] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Trainee form
  const [traineeName, setTraineeName] = useState('');
  const [traineeAdm, setTraineeAdm] = useState('');
  const [traineeClassId, setTraineeClassId] = useState(classes[0]?.id || '');

  // Allocation form
  const [allocTrainerId, setAllocTrainerId] = useState(
    systemUsers.find((u) => u.role === 'trainer')?.id || systemUsers[0]?.id || '',
  );
  const [allocClassId, setAllocClassId] = useState(classes[0]?.id || '');
  const [allocUnitId, setAllocUnitId] = useState(units[0]?.id || '');

  const showNotice = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(''), 2800);
  };

  const handleSaveInstitution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.canManageInstitution) return;
    updateInstitution({
      ...institution,
      name: instName.trim() || institution.name,
      department: instDept.trim() || institution.department,
      competency_threshold: Math.min(100, Math.max(1, Number(threshold) || 50)),
      oral_weight_percent: Math.min(100, Math.max(0, Number(oralWeight) || 0)),
      practical_weight_percent: Math.min(
        100,
        Math.max(0, Number(practicalWeight) || 0),
      ),
      active_academic_year: activeYear.trim() || '2026',
      active_term: activeTerm,
    });
    showNotice('Institutional configuration and assessment policy saved');
  };

  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptCode.trim() || !deptName.trim()) return;
    addDepartment({
      code: deptCode.trim().toUpperCase(),
      name: deptName.trim().toUpperCase(),
      hod_name: deptHod.trim() || 'Unassigned HOD',
    });
    setDeptCode('');
    setDeptName('');
    setDeptHod('');
    showNotice('Department created');
  };

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode.trim() || !courseTitle.trim()) return;
    addCourse({
      department_id: courseDeptId || departments[0]?.id || '',
      code: courseCode.trim().toUpperCase(),
      title: courseTitle.trim().toUpperCase(),
      level: courseLevel,
    });
    setCourseCode('');
    setCourseTitle('');
    showNotice('Course added');
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;
    addClass({
      course_id: classCourseId || courses[0]?.id || '',
      name: className.trim().toUpperCase(),
      level: classLevel,
      cycle: classCycle,
      academic_year: institution.active_academic_year || '2026',
      term: institution.active_term || 'Term 3',
    });
    setClassName('');
    showNotice('Cohort class created');
  };

  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitCode.trim() || !unitName.trim()) return;
    addUnit({
      course_id: unitCourseId || courses[0]?.id || '',
      code: unitCode.trim().toUpperCase(),
      name: unitName.trim(),
      level: unitLevel,
    });
    setUnitCode('');
    setUnitName('');
    showNotice('Competency unit added');
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError('');
    if (!userName.trim() || !userEmail.trim() || !userStaffNo.trim()) {
      setUserFormError('Full name, email, and Staff / Admission No. are required.');
      return;
    }
    if (userInitialPassword.length < 8) {
      setUserFormError(
        'Login password must be at least 8 characters to create the user in Supabase Authentication.',
      );
      return;
    }
    setUserSubmitting(true);
    const res = await createAuthUser({
      full_name: userName.trim(),
      email: userEmail.trim().toLowerCase(),
      role: userRole,
      department_id: userDeptId || departments[0]?.id,
      staff_or_adm_no: userStaffNo.trim().toUpperCase(),
      active: true,
      password: userInitialPassword,
    });
    setUserSubmitting(false);
    if (!res.ok) {
      setUserFormError(res.error || 'Failed to create user in Supabase Auth.');
      return;
    }
    setUserName('');
    setUserEmail('');
    setUserStaffNo('');
    setUserInitialPassword('');
    showNotice('User login created in Supabase Authentication');
  };

  const handleOpenEditUser = (u: AuthDirectoryUser) => {
    setUserFormError('');
    setEditingUser(u);
    setEditRole(u.role);
    setEditStaffNo(u.staff_or_adm_no);
    setEditPassword('');
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setUserFormError('');
    if (editPassword && editPassword.length < 8) {
      setUserFormError('Password must be at least 8 characters.');
      return;
    }
    if (!editingUser.in_supabase_auth && editPassword.length < 8) {
      setUserFormError(
        'This user does not have Supabase Authentication credentials yet. Enter a password (8+ chars) to provision their login.',
      );
      return;
    }
    setEditSaving(true);
    const res = await updateAuthUser(editingUser.id, {
      role: editRole,
      staff_or_adm_no: editStaffNo.trim().toUpperCase(),
      password: editPassword || undefined,
    });
    setEditSaving(false);
    if (!res.ok) {
      setUserFormError(res.error || 'Failed to update Supabase Auth user.');
      return;
    }
    setEditingUser(null);
    setEditPassword('');
    showNotice('Supabase Auth credentials & role updated');
  };

  const handleAddTrainee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!traineeName.trim() || !traineeAdm.trim()) return;
    const cls = classes.find((c) => c.id === traineeClassId) || classes[0];
    const crs = courses.find((c) => c.id === cls?.course_id) || courses[0];
    addTrainee({
      full_name: traineeName.trim(),
      admission_number: traineeAdm.trim().toUpperCase(),
      class_id: cls?.id,
      class_name: cls?.name || 'EE-L5-JAN25',
      course_id: crs?.id,
      course_title: crs?.title || 'ELECTRICAL INSTALLATION',
      department_id: crs?.department_id,
      level: cls?.level || 'LEVEL 5',
      cycle: cls?.cycle || 'Cycle 3',
    });
    setTraineeName('');
    setTraineeAdm('');
    showNotice('Trainee enrolled');
  };

  const handleAllocateTrainer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocTrainerId || !allocClassId || !allocUnitId) return;
    allocateTrainer({
      trainer_user_id: allocTrainerId,
      class_id: allocClassId,
      unit_id: allocUnitId,
      academic_year: institution.active_academic_year || '2026',
      term: institution.active_term || 'Term 3',
    });
    showNotice('Trainer allocated to class & unit');
  };

  const trainersList = systemUsers.filter(
    (u) => u.role === 'trainer' || u.role === 'hod',
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/90">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2744]">
            Institution Setup, Academic Structure &amp; RBAC
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure institution policy, departments, courses, levels, cycles, classes, units, user accounts, and HOD trainer allocations.
          </p>
        </div>

        {savedNotice && (
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md">
            <Check className="w-3.5 h-3.5" />
            <span>{savedNotice}</span>
          </div>
        )}
      </div>

      {!permissions.canManageInstitution && (
        <div className="flex items-center gap-2 px-4 py-3 text-xs font-medium text-amber-900 bg-amber-50 border border-amber-200 rounded-lg">
          <Lock className="w-4 h-4 shrink-0 text-amber-700" />
          <span>
            Read-only view for <strong>{ROLE_LABELS[activeUser.role]}</strong>. Sign in as a Super Administrator or Head of Department to modify institutional settings or allocations.
          </span>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
        {(
          [
            { key: 'policy', label: 'Institution & Policy', icon: Building2 },
            {
              key: 'structures',
              label: `Academic Structures (${departments.length} Depts · ${courses.length} Courses · ${classes.length} Classes)`,
              icon: Layers,
            },
            {
              key: 'users',
              label: `Users & Trainees (${systemUsers.length} Staff · ${trainees.length} Trainees)`,
              icon: Users,
            },
            {
              key: 'allocations',
              label: `HOD Trainer Allocations (${allocations.length})`,
              icon: UserPlus,
            },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                tab === item.key
                  ? 'bg-white text-[#0F2744] shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Institution & Policy */}
      {tab === 'policy' && (
        <form
          onSubmit={handleSaveInstitution}
          className="bg-white border border-slate-200 rounded-lg p-6 space-y-6 max-w-4xl"
        >
          <div>
            <h2 className="text-base font-semibold text-[#0F2744]">
              Institutional Profile &amp; Marksheet Policy
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Governs official A4 assessment headers, competency threshold, and Oral vs Practical weighting in automated marksheets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Institution Name
              </label>
              <input
                type="text"
                disabled={!permissions.canManageInstitution}
                value={instName}
                onChange={(e) => setInstName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Primary Academic Department
              </label>
              <input
                type="text"
                disabled={!permissions.canManageInstitution}
                value={instDept}
                onChange={(e) => setInstDept(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Competency Pass Threshold (%)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                disabled={!permissions.canManageInstitution}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm tabular-nums border border-slate-200 rounded-md disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Oral Weight in Marksheet (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                disabled={!permissions.canManageInstitution}
                value={oralWeight}
                onChange={(e) => setOralWeight(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm tabular-nums border border-slate-200 rounded-md disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Practical Weight in Marksheet (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                disabled={!permissions.canManageInstitution}
                value={practicalWeight}
                onChange={(e) => setPracticalWeight(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm tabular-nums border border-slate-200 rounded-md disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Active Academic Year
              </label>
              <input
                type="text"
                disabled={!permissions.canManageInstitution}
                value={activeYear}
                onChange={(e) => setActiveYear(e.target.value)}
                className="w-full px-3 py-2 text-sm tabular-nums border border-slate-200 rounded-md disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Active Term
              </label>
              <select
                disabled={!permissions.canManageInstitution}
                value={activeTerm}
                onChange={(e) => setActiveTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md disabled:bg-slate-50"
              >
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
            </div>
          </div>

          {permissions.canManageInstitution && (
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0F2744] rounded-lg hover:bg-[#17365D] cursor-pointer"
              >
                Save Institutional Policy
              </button>
            </div>
          )}
        </form>
      )}

      {/* TAB 2: Academic Structures */}
      {tab === 'structures' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Departments */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[#0F2744]">
              Departments ({departments.length})
            </h2>
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-md">
              {departments.map((d) => (
                <div key={d.id} className="px-3.5 py-2.5 text-xs flex justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-900">{d.name}</div>
                    <div className="text-slate-500">
                      <span className="font-mono">{d.code}</span> · HOD: {d.hod_name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {permissions.canManageInstitution && (
              <form onSubmit={handleAddDepartment} className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                <input
                  type="text"
                  required
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  placeholder="Code (MECH)"
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-md"
                />
                <input
                  type="text"
                  required
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="Department Name"
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-md"
                />
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={deptHod}
                    onChange={(e) => setDeptHod(e.target.value)}
                    placeholder="HOD Name"
                    className="flex-1 min-w-0 px-2.5 py-1.5 text-xs border border-slate-200 rounded-md"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 text-xs font-semibold text-white bg-blue-700 rounded-md hover:bg-blue-800 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Courses */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[#0F2744]">
              Courses &amp; Qualification Levels ({courses.length})
            </h2>
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-md max-h-56 overflow-y-auto">
              {courses.map((c) => (
                <div key={c.id} className="px-3.5 py-2.5 text-xs flex justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-900">{c.title}</div>
                    <div className="text-slate-500 font-mono">
                      {c.code} · {c.level}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {permissions.canManageInstitution && (
              <form onSubmit={handleAddCourse} className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <select
                  value={courseDeptId}
                  onChange={(e) => setCourseDeptId(e.target.value)}
                  className="px-2 py-1.5 text-xs border border-slate-200 rounded-md bg-white"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="Code (EI-L5)"
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-md"
                />
                <input
                  type="text"
                  required
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="Course Title"
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-md"
                />
                <div className="flex gap-1.5">
                  <select
                    value={courseLevel}
                    onChange={(e) => setCourseLevel(e.target.value)}
                    className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-slate-200 rounded-md bg-white"
                  >
                    <option value="LEVEL 4">LEVEL 4</option>
                    <option value="LEVEL 5">LEVEL 5</option>
                    <option value="LEVEL 6">LEVEL 6</option>
                  </select>
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 text-xs font-semibold text-white bg-blue-700 rounded-md hover:bg-blue-800 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Cohort Classes & Cycles */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[#0F2744]">
              Cohort Classes &amp; Cycles ({classes.length})
            </h2>
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-md max-h-56 overflow-y-auto">
              {classes.map((cl) => (
                <div key={cl.id} className="px-3.5 py-2.5 text-xs flex justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-900 font-mono">{cl.name}</div>
                    <div className="text-slate-500">
                      {cl.level} · {cl.cycle} · {cl.academic_year} {cl.term}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {permissions.canManageInstitution && (
              <form onSubmit={handleAddClass} className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <select
                  value={classCourseId}
                  onChange={(e) => setClassCourseId(e.target.value)}
                  className="px-2 py-1.5 text-xs border border-slate-200 rounded-md bg-white"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Class (EE-L5-SEP26)"
                  className="px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-md"
                />
                <select
                  value={classCycle}
                  onChange={(e) => setClassCycle(e.target.value)}
                  className="px-2 py-1.5 text-xs border border-slate-200 rounded-md bg-white"
                >
                  {['Cycle 1', 'Cycle 2', 'Cycle 3', 'Cycle 4', 'Cycle 5'].map((cy) => (
                    <option key={cy} value={cy}>
                      {cy}
                    </option>
                  ))}
                </select>
                <div className="flex gap-1.5">
                  <select
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                    className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-slate-200 rounded-md bg-white"
                  >
                    <option value="LEVEL 4">LEVEL 4</option>
                    <option value="LEVEL 5">LEVEL 5</option>
                    <option value="LEVEL 6">LEVEL 6</option>
                  </select>
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 text-xs font-semibold text-white bg-blue-700 rounded-md hover:bg-blue-800 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Units of Competency */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[#0F2744]">
              Units of Competency ({units.length})
            </h2>
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-md max-h-56 overflow-y-auto">
              {units.map((u) => (
                <div key={u.id} className="px-3.5 py-2.5 text-xs">
                  <div className="font-semibold text-slate-900">{u.name}</div>
                  <div className="text-slate-500 font-mono">
                    {u.code} · {u.level}
                  </div>
                </div>
              ))}
            </div>
            {permissions.canManageInstitution && (
              <form onSubmit={handleAddUnit} className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <select
                  value={unitCourseId}
                  onChange={(e) => setUnitCourseId(e.target.value)}
                  className="px-2 py-1.5 text-xs border border-slate-200 rounded-md bg-white"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  value={unitCode}
                  onChange={(e) => setUnitCode(e.target.value)}
                  placeholder="Unit Code"
                  className="px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-md"
                />
                <input
                  type="text"
                  required
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="Unit Title"
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-md"
                />
                <div className="flex gap-1.5">
                  <select
                    value={unitLevel}
                    onChange={(e) => setUnitLevel(e.target.value)}
                    className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-slate-200 rounded-md bg-white"
                  >
                    <option value="LEVEL 4">LEVEL 4</option>
                    <option value="LEVEL 5">LEVEL 5</option>
                    <option value="LEVEL 6">LEVEL 6</option>
                  </select>
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 text-xs font-semibold text-white bg-blue-700 rounded-md hover:bg-blue-800 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Users & Trainees */}
      {tab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[#0F2744]">
                  Supabase Auth &amp; RBAC Users ({authDirectory.length || systemUsers.length})
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Synced with Supabase Authentication → Users. Super Admin and HOD can provision or reset user login details.
                </p>
              </div>
              {permissions.canManageUsers && (
                <button
                  type="button"
                  onClick={() => refreshAuthUsers()}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#0F2744] bg-white border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Sync Auth
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-[#0F2744] font-semibold">
                    <th className="py-2.5 px-4">User &amp; Email</th>
                    <th className="py-2.5 px-4">Role &amp; ID</th>
                    <th className="py-2.5 px-4">Supabase Auth</th>
                    <th className="py-2.5 px-4 text-right">Login Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(authDirectory.length > 0
                    ? authDirectory
                    : systemUsers.map((u) => ({
                        id: u.id,
                        supabase_user_id: null,
                        full_name: u.full_name,
                        email: u.email,
                        role: u.role,
                        staff_or_adm_no: u.staff_or_adm_no,
                        department_id: u.department_id || null,
                        in_supabase_auth: false,
                      }))
                  ).map((u) => {
                    const hodBlocked =
                      activeUser.role === 'hod' && u.role === 'super_admin';
                    return (
                      <tr key={u.id}>
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-slate-900">
                            {u.full_name}
                          </div>
                          <div className="text-slate-500">{u.email}</div>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="text-blue-800 font-medium">
                            {ROLE_LABELS[u.role]}
                          </div>
                          <div className="font-mono text-slate-500">
                            {u.staff_or_adm_no}
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          {u.in_supabase_auth ? (
                            <span className="font-semibold text-emerald-700">
                              Provisioned
                            </span>
                          ) : (
                            <span className="font-semibold text-amber-700">
                              No Login Yet
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {permissions.canManageUsers && !hodBlocked && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditUser(u)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#0F2744] bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                            >
                              <KeyRound className="w-3 h-3 text-blue-700" />
                              {u.in_supabase_auth
                                ? 'Update / Reset'
                                : 'Provide Login'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {userFormError && (
              <div className="mx-4 mt-3 px-3 py-2 text-xs font-medium text-red-900 bg-red-50 border border-red-200 rounded-md">
                {userFormError}
              </div>
            )}

            {editingUser && permissions.canManageUsers && (
              <form
                onSubmit={handleSaveEditUser}
                className="p-4 border-t border-blue-200 bg-blue-50/60 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-[#0F2744]">
                    {editingUser.in_supabase_auth
                      ? `Update Role / Reset Password for ${editingUser.full_name}`
                      : `Provision Supabase Auth Login for ${editingUser.full_name}`}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                  >
                    {(Object.keys(ROLE_LABELS) as UserRole[])
                      .filter(
                        (r) =>
                          activeUser.role === 'super_admin' ||
                          r !== 'super_admin',
                      )
                      .map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                  </select>
                  <input
                    type="text"
                    required
                    value={editStaffNo}
                    onChange={(e) => setEditStaffNo(e.target.value)}
                    placeholder="Staff / Adm No."
                    className="px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md"
                  />
                  <input
                    type="password"
                    minLength={8}
                    required={!editingUser.in_supabase_auth}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder={
                      editingUser.in_supabase_auth
                        ? 'New Password (leave blank to keep)'
                        : 'Set Login Password (8+ chars)'
                    }
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={editSaving}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 rounded-md hover:bg-blue-800 disabled:opacity-60 cursor-pointer"
                  >
                    {editSaving ? 'Saving to Supabase Auth...' : 'Save to Supabase Auth'}
                  </button>
                </div>
              </form>
            )}

            {permissions.canManageUsers && (
              <form onSubmit={handleAddUser} className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-3">
                <div className="text-xs font-semibold text-[#0F2744]">
                  Provide New User Login Details (Creates User in Supabase Authentication)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Full Name"
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                  />
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="Email address"
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                  />
                  <input
                    type="text"
                    required
                    value={userStaffNo}
                    onChange={(e) => setUserStaffNo(e.target.value)}
                    placeholder="Staff / Adm ID (STF-024)"
                    className="px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-md"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as UserRole)}
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                  >
                    {(Object.keys(ROLE_LABELS) as UserRole[])
                      .filter(
                        (r) =>
                          activeUser.role === 'super_admin' ||
                          r !== 'super_admin',
                      )
                      .map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                  </select>
                  <select
                    value={userDeptId}
                    onChange={(e) => setUserDeptId(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={userInitialPassword}
                    onChange={(e) => setUserInitialPassword(e.target.value)}
                    placeholder="Login Password (required, 8+ chars)"
                    className="flex-1 min-w-[200px] px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                  />
                  <button
                    type="submit"
                    disabled={userSubmitting}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0F2744] rounded-md hover:bg-[#17365D] disabled:opacity-60 cursor-pointer"
                  >
                    {userSubmitting ? 'Creating...' : 'Create User in Supabase Auth'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-[#0F2744]">
                Enrolled Trainees ({trainees.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-200 max-h-72 overflow-y-auto">
              {trainees.map((t) => (
                <div key={t.id} className="px-4 py-2.5 text-xs">
                  <div className="font-semibold text-slate-900">{t.full_name}</div>
                  <div className="text-slate-500 font-mono">
                    {t.admission_number} · {t.class_name} · {t.cycle || 'Cycle 3'}
                  </div>
                </div>
              ))}
            </div>

            {permissions.canManageUsers && (
              <form onSubmit={handleAddTrainee} className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-2.5">
                <div className="text-xs font-semibold text-[#0F2744]">
                  Enroll Trainee
                </div>
                <input
                  type="text"
                  required
                  value={traineeName}
                  onChange={(e) => setTraineeName(e.target.value)}
                  placeholder="Trainee Full Name"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={traineeAdm}
                    onChange={(e) => setTraineeAdm(e.target.value)}
                    placeholder="Adm No."
                    className="px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-md"
                  />
                  <select
                    value={traineeClassId}
                    onChange={(e) => setTraineeClassId(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 rounded-md hover:bg-blue-800 cursor-pointer"
                >
                  Save Trainee
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: HOD Trainer Allocations */}
      {tab === 'allocations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-[#0F2744]">
                Active Trainer Class &amp; Unit Allocations
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-[#0F2744] font-semibold">
                    <th className="py-2.5 px-4">Trainer / Assessor</th>
                    <th className="py-2.5 px-4">Cohort Class</th>
                    <th className="py-2.5 px-4">Competency Unit</th>
                    <th className="py-2.5 px-4">Period</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {allocations.map((al) => {
                    const tr = systemUsers.find((u) => u.id === al.trainer_user_id);
                    const cls = classes.find((c) => c.id === al.class_id);
                    const un = units.find((u) => u.id === al.unit_id);
                    return (
                      <tr key={al.id}>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          {tr?.full_name || 'Trainer'}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-700">
                          {cls?.name || '—'}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-medium text-slate-900">
                            {un?.name || '—'}
                          </div>
                          <div className="font-mono text-slate-500">{un?.code}</div>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 tabular-nums">
                          {al.academic_year} · {al.term}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {permissions.canAllocateTrainers && (
                            <button
                              type="button"
                              onClick={() => removeAllocation(al.id)}
                              className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                              aria-label="Remove allocation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[#0F2744]">
              Allocate Trainer by Workload
            </h2>
            <p className="text-xs text-slate-500">
              Head of Department assigns qualified trainers to specific cohort classes and competency units.
            </p>
            <form onSubmit={handleAllocateTrainer} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Trainer / Assessor
                </label>
                <select
                  disabled={!permissions.canAllocateTrainers}
                  value={allocTrainerId}
                  onChange={(e) => setAllocTrainerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md"
                >
                  {trainersList.map((t) => {
                    const load = allocations.filter(
                      (a) => a.trainer_user_id === t.id,
                    ).length;
                    return (
                      <option key={t.id} value={t.id}>
                        {t.full_name} ({load} assigned units)
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Cohort Class
                </label>
                <select
                  disabled={!permissions.canAllocateTrainers}
                  value={allocClassId}
                  onChange={(e) => setAllocClassId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.cycle} · {c.level})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Unit of Competency
                </label>
                <select
                  disabled={!permissions.canAllocateTrainers}
                  value={allocUnitId}
                  onChange={(e) => setAllocUnitId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.code} — {u.name}
                    </option>
                  ))}
                </select>
              </div>
              {permissions.canAllocateTrainers && (
                <button
                  type="submit"
                  className="w-full px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-md hover:bg-blue-800 cursor-pointer"
                >
                  Assign Trainer to Unit
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
