import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  FileAudio,
  FileText,
  FileVideo,
  Image as ImageIcon,
  Lock,
  Play,
  Printer,
  Save,
  Send,
  Upload,
  UserPlus,
  X,
} from 'lucide-react';
import {
  calculateChecklistMaxSubtotal,
  calculateChecklistSubtotal,
  calculatePercentage,
  calculateTaskMaxSubtotal,
  calculateTaskSubtotal,
  calculateTotalAvailable,
  calculateTotalObtained,
  determineCompetency,
  validateMarks,
} from '../lib/calculations';
import { useAssessmentStore } from '../store/useAssessmentStore';
import type {
  AppRoute,
  AssessmentSession,
  ChecklistResult,
  CompetencyOutcome,
  CriterionResult,
  EvidenceCategory,
} from '../types/tvet';
import { AssessmentPaper } from './AssessmentPaper';

interface DigitalAssessmentViewProps {
  initialAssessmentId?: string;
  initialSessionId?: string;
  onNavigate: (
    route: AppRoute,
    params?: { assessmentId?: string; sessionId?: string },
  ) => void;
}

const ALLOWED_EVIDENCE_EXT = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'mp4',
  'mov',
  'webm',
  'mp3',
  'wav',
  'm4a',
  'pdf',
  'docx',
  'xlsx',
]);

function inferEvidenceCategory(
  fileName: string,
  preferredCategory?: EvidenceCategory,
): EvidenceCategory {
  if (preferredCategory) return preferredCategory;
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return 'Photograph';
  if (['mp4', 'mov', 'webm'].includes(ext)) return 'Video';
  if (['mp3', 'wav', 'm4a'].includes(ext)) return 'Audio';
  if (ext === 'pdf') return 'Scanned Document';
  return 'Document';
}

export function DigitalAssessmentView({
  initialAssessmentId,
  initialSessionId,
  onNavigate,
}: DigitalAssessmentViewProps) {
  const {
    institution,
    courses,
    classes,
    units,
    assessments,
    trainees,
    sessions,
    activeUser,
    permissions,
    addTrainee,
    createSession,
    updateSession,
    addEvidenceToSession,
  } = useAssessmentStore();

  const publishedAssessments = assessments.filter((a) => a.status === 'published');

  // Launcher metadata filters (Module 7.5)
  const [filterCourse, setFilterCourse] = useState('ALL');
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(
    initialAssessmentId || publishedAssessments[0]?.id || '',
  );
  const [selectedTraineeId, setSelectedTraineeId] = useState<string>(
    trainees[0]?.id || '',
  );
  const [assessorName, setAssessorName] = useState(activeUser.full_name);
  const [assessmentDate, setAssessmentDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [venue, setVenue] = useState('Electrical Workshop B2');

  // Quick trainee registration toggle
  const [showAddTrainee, setShowAddTrainee] = useState(false);
  const [newTraineeName, setNewTraineeName] = useState('');
  const [newTraineeAdm, setNewTraineeAdm] = useState('');

  // Active grading state
  const [activeSession, setActiveSession] = useState<AssessmentSession | null>(
    () =>
      initialSessionId
        ? sessions.find((s) => s.id === initialSessionId) || null
        : null,
  );
  const [showInstructions, setShowInstructions] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [savedMsg, setSavedMsg] = useState('');
  const [showPaperPreview, setShowPaperPreview] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Evidence uploader modal state
  const [evidenceTarget, setEvidenceTarget] = useState<{
    targetType: 'task_item' | 'checklist_criterion' | 'general';
    targetId: string;
    targetLabel: string;
  } | null>(null);
  const [evidenceCategory, setEvidenceCategory] =
    useState<EvidenceCategory>('Photograph');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setAssessorName(activeUser.full_name);
  }, [activeUser.full_name]);

  useEffect(() => {
    if (initialSessionId) {
      const found = sessions.find((s) => s.id === initialSessionId);
      if (found) {
        setActiveSession(structuredClone(found));
      }
    }
  }, [initialSessionId, sessions]);

  // Keep activeSession synchronized when evidence is added via store
  useEffect(() => {
    if (!activeSession) return;
    const latest = sessions.find((s) => s.id === activeSession.id);
    if (latest && (latest.evidence?.length || 0) !== (activeSession.evidence?.length || 0)) {
      setActiveSession((prev) =>
        prev ? { ...prev, evidence: latest.evidence } : prev,
      );
    }
  }, [sessions, activeSession]);

  const filteredInstruments = publishedAssessments.filter((a) => {
    if (filterCourse !== 'ALL' && a.course_title !== filterCourse) return false;
    if (filterClass !== 'ALL' && a.class_name !== filterClass) return false;
    if (filterType !== 'ALL' && a.assessment_type !== filterType) return false;
    return true;
  });

  const handleStartNewSession = () => {
    if (!permissions.canConductAssessments) return;
    if (!selectedAssessmentId || !selectedTraineeId) return;
    const created = createSession(
      selectedAssessmentId,
      selectedTraineeId,
      assessorName || activeUser.full_name,
      venue,
      assessmentDate,
    );
    setActiveSession(created);
  };

  const handleRegisterTrainee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTraineeName.trim() || !newTraineeAdm.trim()) return;
    const created = addTrainee({
      full_name: newTraineeName.trim(),
      admission_number: newTraineeAdm.trim().toUpperCase(),
      class_name: classes[0]?.name || 'EE-L5-JAN25',
      course_title: courses[0]?.title || 'ELECTRICAL INSTALLATION',
      level: 'LEVEL 5',
      cycle: 'Cycle 3',
    });
    setSelectedTraineeId(created.id);
    setNewTraineeName('');
    setNewTraineeAdm('');
    setShowAddTrainee(false);
  };

  // Session Launcher
  if (!activeSession) {
    const inProgressSessions = sessions.filter(
      (s) => s.status === 'in_progress' || s.status === 'returned',
    );
    return (
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="pb-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-[#0F2744]">
            Digital Practical &amp; Oral Assessment Execution
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Select a published instrument by Course, Class, Unit, and Type, select a trainee, conduct digital observation &amp; marking, and attach multimedia evidence.
          </p>
        </div>

        {!permissions.canConductAssessments && (
          <div className="flex items-center gap-2 px-4 py-3 text-xs font-medium text-amber-900 bg-amber-50 border border-amber-200 rounded-lg">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Your active role cannot conduct new grading sessions. Switch to Trainer/Assessor, HOD, or Super Administrator to assess trainees.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Start New Session */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6 space-y-5">
            <h2 className="text-base font-semibold text-[#0F2744]">
              Start New Assessment Session
            </h2>

            {/* Structured Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-md">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Filter Course
                </label>
                <select
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded"
                >
                  <option value="ALL">All Courses</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.title}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Filter Class
                </label>
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded"
                >
                  <option value="ALL">All Classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.cycle})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Assessment Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded"
                >
                  <option value="ALL">All Types</option>
                  <option value="PRACTICAL">PRACTICAL</option>
                  <option value="ORAL">ORAL</option>
                  <option value="THEORY">THEORY</option>
                  <option value="PROJECT">PROJECT</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Published Assessment Instrument ({filteredInstruments.length} available)
              </label>
              <select
                value={selectedAssessmentId}
                onChange={(e) => setSelectedAssessmentId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md"
              >
                {filteredInstruments.length === 0 ? (
                  <option value="">No published instruments match filter</option>
                ) : (
                  filteredInstruments.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.assessment_type} #{a.assessment_number}] {a.unit_code} —{' '}
                      {a.title || a.unit_name} ({a.academic_year} {a.term})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700">
                  Candidate / Trainee
                </label>
                {permissions.canConductAssessments && (
                  <button
                    type="button"
                    onClick={() => setShowAddTrainee(!showAddTrainee)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {showAddTrainee ? 'Cancel' : 'Register Trainee'}
                  </button>
                )}
              </div>
              <select
                value={selectedTraineeId}
                onChange={(e) => setSelectedTraineeId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md"
              >
                {trainees.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name} ({t.admission_number}) — {t.class_name}
                  </option>
                ))}
              </select>
            </div>

            {showAddTrainee && (
              <form
                onSubmit={handleRegisterTrainee}
                className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3"
              >
                <div className="text-xs font-semibold text-slate-800">
                  Quick Trainee Registration
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={newTraineeName}
                    onChange={(e) => setNewTraineeName(e.target.value)}
                    placeholder="Full Name (e.g. Samuel Njoroge)"
                    className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                  />
                  <input
                    type="text"
                    required
                    value={newTraineeAdm}
                    onChange={(e) => setNewTraineeAdm(e.target.value)}
                    placeholder="Adm No. (e.g. TTTI/EI/2025/060)"
                    className="px-3 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-md"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0F2744] rounded-md hover:bg-[#17365D] cursor-pointer"
                >
                  Save &amp; Select Trainee
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Assessor Name
                </label>
                <input
                  type="text"
                  value={assessorName}
                  onChange={(e) => setAssessorName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Assessment Date
                </label>
                <input
                  type="date"
                  value={assessmentDate}
                  onChange={(e) => setAssessmentDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm tabular-nums border border-slate-200 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Workshop / Venue
                </label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={!permissions.canConductAssessments || !selectedAssessmentId}
              onClick={handleStartNewSession}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4" />
              Begin Evaluation Session
            </button>
          </div>

          {/* Resume In-Progress + Unit Reference */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white border border-slate-200 rounded-lg">
              <div className="px-5 py-4 border-b border-slate-200">
                <h2 className="text-sm font-semibold text-[#0F2744]">
                  Resume In-Progress / Returned Sessions
                </h2>
              </div>
              {inProgressSessions.length === 0 ? (
                <div className="p-6 text-xs text-slate-500">
                  No in-progress sessions waiting.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {inProgressSessions.map((s) => {
                    const tr = trainees.find((t) => t.id === s.trainee_id);
                    const as = assessments.find((a) => a.id === s.assessment_id);
                    return (
                      <div
                        key={s.id}
                        className="px-5 py-3.5 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate">
                            {tr?.full_name}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            <span className="font-mono">
                              {tr?.admission_number}
                            </span>{' '}
                            · {as?.unit_code} ·{' '}
                            <span className="uppercase font-medium text-amber-700">
                              {s.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveSession(structuredClone(s))}
                          className="px-3 py-1.5 text-xs font-medium text-[#0F2744] bg-white border border-slate-200 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Open
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5 text-xs space-y-2">
              <div className="font-semibold text-[#0F2744]">
                Active Competency Units ({units.length})
              </div>
              {units.map((u) => (
                <div key={u.id} className="text-slate-600">
                  <span className="font-mono text-slate-800">{u.code}</span> ·{' '}
                  {u.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const assessment = assessments.find(
    (a) => a.id === activeSession.assessment_id,
  );
  const trainee = trainees.find((t) => t.id === activeSession.trainee_id);

  if (!assessment) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center">
        <p className="text-sm text-slate-700">
          Assessment instrument not found for this session.
        </p>
        <button
          type="button"
          onClick={() => setActiveSession(null)}
          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md cursor-pointer"
        >
          Back to Launcher
        </button>
      </div>
    );
  }

  const isLocked =
    !permissions.canConductAssessments ||
    (activeSession.status !== 'in_progress' &&
      activeSession.status !== 'returned');

  const threshold =
    assessment.competency_threshold || institution.competency_threshold || 50;
  const grandAvailable = calculateTotalAvailable(
    assessment.tasks,
    assessment.checklists,
  );
  const grandObtained = calculateTotalObtained(
    assessment.tasks,
    assessment.checklists,
    activeSession.results,
    activeSession.checklist_results,
  );
  const percentage = calculatePercentage(grandObtained, grandAvailable);
  const calculatedOutcome = determineCompetency(percentage, threshold);
  const outcome =
    activeSession.competency_outcome &&
    activeSession.competency_outcome !== 'Pending'
      ? activeSession.competency_outcome
      : calculatedOutcome;

  const syncTotals = (
    nextResults: CriterionResult[],
    nextChecklistResults: ChecklistResult[],
    explicitOutcome?: CompetencyOutcome,
  ): AssessmentSession => {
    const obtained = calculateTotalObtained(
      assessment.tasks,
      assessment.checklists,
      nextResults,
      nextChecklistResults,
    );
    const pct = calculatePercentage(obtained, grandAvailable);
    const comp = explicitOutcome || determineCompetency(pct, threshold);
    return {
      ...activeSession,
      results: nextResults,
      checklist_results: nextChecklistResults,
      grand_total_available: grandAvailable,
      grand_total_obtained: obtained,
      percentage: Number(pct.toFixed(2)),
      competency_outcome: comp,
      updated_at: new Date().toISOString(),
    };
  };

  const handleTaskMarkChange = (
    itemId: string,
    rawVal: string,
    maxMarks: number,
  ) => {
    const check = validateMarks(rawVal, maxMarks);
    if (!check.valid) {
      setErrorMsg(check.error || 'Invalid marks');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    const existing = activeSession.results.find((r) => r.item_id === itemId);
    const nextResults = existing
      ? activeSession.results.map((r) =>
          r.item_id === itemId ? { ...r, marks_obtained: check.value! } : r,
        )
      : [
          ...activeSession.results,
          { item_id: itemId, marks_obtained: check.value!, comments: '' },
        ];
    const updated = syncTotals(nextResults, activeSession.checklist_results);
    setActiveSession(updated);
    updateSession(updated);
  };

  const handleTaskCommentChange = (itemId: string, comments: string) => {
    const existing = activeSession.results.find((r) => r.item_id === itemId);
    const nextResults = existing
      ? activeSession.results.map((r) =>
          r.item_id === itemId ? { ...r, comments } : r,
        )
      : [
          ...activeSession.results,
          { item_id: itemId, marks_obtained: 0, comments },
        ];
    const updated = syncTotals(nextResults, activeSession.checklist_results);
    setActiveSession(updated);
    updateSession(updated);
  };

  const handleChecklistMarkChange = (
    criteriaId: string,
    rawVal: string,
    maxMarks: number,
  ) => {
    const check = validateMarks(rawVal, maxMarks);
    if (!check.valid) {
      setErrorMsg(check.error || 'Invalid marks');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    const existing = activeSession.checklist_results.find(
      (r) => r.criteria_id === criteriaId,
    );
    const nextCl = existing
      ? activeSession.checklist_results.map((r) =>
          r.criteria_id === criteriaId
            ? {
                ...r,
                marks_obtained: check.value!,
                competency_status:
                  check.value! >= maxMarks * 0.5
                    ? ('Achieved' as const)
                    : ('Not Yet Achieved' as const),
              }
            : r,
        )
      : [
          ...activeSession.checklist_results,
          {
            criteria_id: criteriaId,
            marks_obtained: check.value!,
            comments: '',
            competency_status:
              check.value! >= maxMarks * 0.5
                ? ('Achieved' as const)
                : ('Not Yet Achieved' as const),
          },
        ];
    const updated = syncTotals(activeSession.results, nextCl);
    setActiveSession(updated);
    updateSession(updated);
  };

  const handleChecklistCommentChange = (
    criteriaId: string,
    comments: string,
  ) => {
    const existing = activeSession.checklist_results.find(
      (r) => r.criteria_id === criteriaId,
    );
    const nextCl = existing
      ? activeSession.checklist_results.map((r) =>
          r.criteria_id === criteriaId ? { ...r, comments } : r,
        )
      : [
          ...activeSession.checklist_results,
          { criteria_id: criteriaId, marks_obtained: 0, comments },
        ];
    const updated = syncTotals(activeSession.results, nextCl);
    setActiveSession(updated);
    updateSession(updated);
  };

  const handleEvidenceFileSelected = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !evidenceTarget || !trainee) return;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EVIDENCE_EXT.has(ext)) {
      setErrorMsg(
        `Unsupported file format (.${ext}). Allowed: JPG, PNG, WEBP, MP4, MOV, WEBM, MP3, WAV, M4A, PDF, DOCX, XLSX.`,
      );
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('Evidence file exceeds maximum 25 MB limit.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const resolvedCategory = inferEvidenceCategory(file.name, evidenceCategory);

    addEvidenceToSession(activeSession.id, {
      session_id: activeSession.id,
      assessment_id: assessment.id,
      trainee_id: trainee.id,
      trainee_adm_no: trainee.admission_number,
      trainee_name: trainee.full_name,
      course_title: assessment.course_title,
      class_name: assessment.class_name || trainee.class_name,
      unit_name: assessment.unit_name,
      assessment_type: assessment.assessment_type,
      assessment_number: assessment.assessment_number,
      target_type: evidenceTarget.targetType,
      target_id: evidenceTarget.targetId,
      target_label: evidenceTarget.targetLabel,
      category: resolvedCategory,
      file_name: file.name,
      mime_type: file.type || 'application/octet-stream',
      file_size: file.size,
      preview_url: previewUrl,
    });

    setSavedMsg(`Evidence attached: ${file.name}`);
    setTimeout(() => setSavedMsg(''), 2500);
    setEvidenceTarget(null);
  };

  const handleSaveProgress = () => {
    const updated = syncTotals(
      activeSession.results,
      activeSession.checklist_results,
      outcome,
    );
    setActiveSession(updated);
    updateSession(updated);
    setSavedMsg('Progress saved');
    setTimeout(() => setSavedMsg(''), 2500);
  };

  const handleSubmitSession = () => {
    const now = new Date().toISOString();
    const submitted: AssessmentSession = {
      ...syncTotals(
        activeSession.results,
        activeSession.checklist_results,
        outcome,
      ),
      status: 'submitted',
      verification_status: 'pending',
      candidate_signed_at: now,
      assessor_signed_at: now,
      updated_at: now,
    };
    setActiveSession(submitted);
    updateSession(submitted);
    setShowReviewModal(false);
    setSavedMsg('Assessment submitted & locked for verification');
  };

  const sessionEvidence = activeSession.evidence || [];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 no-print">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => setActiveSession(null)}
              className="hover:text-slate-900 underline cursor-pointer"
            >
              Switch Session
            </button>
            <span>·</span>
            <span className="font-mono">{assessment.unit_code}</span>
            <span>·</span>
            <span className="uppercase font-medium text-slate-700">
              {activeSession.status.replace('_', ' ')}
              {activeSession.attempt_number && activeSession.attempt_number > 1
                ? ` · Attempt #${activeSession.attempt_number}`
                : ''}
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#0F2744] mt-1">
            {trainee?.full_name || 'Candidate'} ·{' '}
            <span className="font-mono text-base font-medium text-slate-600">
              {trainee?.admission_number}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {assessment.title || assessment.unit_name} · {activeSession.venue} ·{' '}
            {activeSession.assessment_date}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {savedMsg && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 mr-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {savedMsg}
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowPaperPreview(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            Official Paper
          </button>
          {!isLocked && (
            <>
              <button
                type="button"
                onClick={handleSaveProgress}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Save Progress
              </button>
              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Review &amp; Submit
              </button>
            </>
          )}
          {isLocked && (
            <button
              type="button"
              onClick={() => onNavigate('sessions')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F2744] rounded-lg hover:bg-[#17365D] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              View in Marksheets &amp; Verification
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 px-4 py-3 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-lg no-print">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Collapsible Instructions, Tools & PPE Panel (Module 7.5) */}
      {(assessment.instructions ||
        assessment.required_tools_materials ||
        assessment.safety_ppe ||
        assessment.marking_guidelines) && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden no-print">
          <button
            type="button"
            onClick={() => setShowInstructions(!showInstructions)}
            className="w-full px-5 py-3 flex items-center justify-between text-xs font-semibold text-[#0F2744] bg-slate-50/80 hover:bg-slate-100/70 cursor-pointer"
          >
            <span>
              Assessment Instructions, Required Tools, Safety &amp; Marking Guidelines
            </span>
            {showInstructions ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {showInstructions && (
            <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 border-t border-slate-200">
              {assessment.instructions && (
                <div>
                  <div className="font-semibold text-[#0F2744] mb-0.5">
                    Candidate Instructions
                  </div>
                  <p>{assessment.instructions}</p>
                </div>
              )}
              {assessment.required_tools_materials && (
                <div>
                  <div className="font-semibold text-[#0F2744] mb-0.5">
                    Required Tools &amp; Materials
                  </div>
                  <p>{assessment.required_tools_materials}</p>
                </div>
              )}
              {assessment.safety_ppe && (
                <div>
                  <div className="font-semibold text-[#0F2744] mb-0.5">
                    Safety Precautions &amp; PPE
                  </div>
                  <p>{assessment.safety_ppe}</p>
                </div>
              )}
              {assessment.marking_guidelines && (
                <div>
                  <div className="font-semibold text-[#0F2744] mb-0.5">
                    Marking Guidelines
                  </div>
                  <p>{assessment.marking_guidelines}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Live Summary Strip with Independent Competency Outcome Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="bg-white border border-slate-200/90 rounded-lg p-4">
          <div className="text-xs text-slate-500">Marks Available</div>
          <div className="mt-1 text-2xl font-bold text-[#0F2744] tabular-nums">
            {grandAvailable}
          </div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-lg p-4">
          <div className="text-xs text-slate-500">Marks Obtained</div>
          <div className="mt-1 text-2xl font-bold text-blue-700 tabular-nums">
            {grandObtained}
          </div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-lg p-4">
          <div className="text-xs text-slate-500">Percentage Score</div>
          <div className="mt-1 text-2xl font-bold text-[#0F2744] tabular-nums">
            {percentage.toFixed(2)}%
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <label className="block text-xs text-slate-500 mb-1">
            Competency Outcome (≥ {threshold}%)
          </label>
          <select
            disabled={isLocked}
            value={outcome}
            onChange={(e) => {
              const updated = syncTotals(
                activeSession.results,
                activeSession.checklist_results,
                e.target.value as CompetencyOutcome,
              );
              setActiveSession(updated);
              updateSession(updated);
            }}
            className={`w-full px-2.5 py-1.5 text-xs font-bold border border-slate-200 rounded-md bg-white ${
              outcome === 'Not Yet Competent'
                ? 'text-red-700'
                : 'text-emerald-700'
            }`}
          >
            <option value="Not Yet Competent">Not Yet Competent</option>
            <option value="Competent">Competent</option>
            <option value="Proficient">Proficient</option>
            <option value="Mastery">Mastery</option>
          </select>
        </div>
      </div>

      {/* Observation Checklist Grading */}
      {assessment.checklists.map((cl) => (
        <div
          key={cl.id}
          className="bg-white border border-slate-200 rounded-lg overflow-hidden no-print"
        >
          <div className="px-5 py-3.5 bg-[#0F2744] text-white flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">
                {cl.title}{' '}
                <span className="text-xs font-normal text-slate-300">
                  ({cl.scoring_mode === 'binary' ? 'Binary 1/0' : 'Numerical'})
                </span>
              </h2>
              {cl.instruction && (
                <p className="text-xs text-slate-300 mt-0.5">{cl.instruction}</p>
              )}
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-200">
              Sub-total:{' '}
              {calculateChecklistSubtotal(
                cl.criteria,
                activeSession.checklist_results,
              )}{' '}
              / {calculateChecklistMaxSubtotal(cl.criteria)}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-2.5 px-4 w-[44%]">Item to be Evaluated</th>
                  <th className="py-2.5 px-4 w-[10%] text-center">Max</th>
                  <th className="py-2.5 px-4 w-[16%] text-center">Obtained</th>
                  <th className="py-2.5 px-4 w-[20%]">Observation</th>
                  <th className="py-2.5 px-4 w-[10%] text-right">Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cl.criteria.map((c) => {
                  const res = activeSession.checklist_results.find(
                    (r) => r.criteria_id === c.id,
                  );
                  const itemEvidence = sessionEvidence.filter(
                    (ev) => ev.target_id === c.id,
                  );
                  return (
                    <tr
                      key={c.id}
                      className={c.is_subitem ? 'bg-slate-50/70' : ''}
                    >
                      <td
                        className={`py-3 px-4 ${c.is_subitem ? 'pl-8 text-xs text-slate-700' : 'text-slate-900'}`}
                      >
                        {c.is_subitem ? '• ' : ''}
                        {c.item_number}. {c.description}
                        {c.performance_indicator && (
                          <div className="text-xs text-slate-500 italic mt-0.5">
                            {c.performance_indicator}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center tabular-nums text-slate-700">
                        {c.is_subitem && c.max_marks === 0 ? '—' : c.max_marks}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {c.is_subitem && c.max_marks === 0 ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : cl.scoring_mode === 'binary' ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              disabled={isLocked}
                              onClick={() =>
                                handleChecklistMarkChange(
                                  c.id,
                                  String(c.max_marks),
                                  c.max_marks,
                                )
                              }
                              className={`px-2 py-1 text-xs font-semibold rounded border cursor-pointer ${
                                (res?.marks_obtained ?? 0) > 0
                                  ? 'bg-emerald-700 text-white border-emerald-700'
                                  : 'bg-white text-slate-600 border-slate-200'
                              }`}
                            >
                              1
                            </button>
                            <button
                              type="button"
                              disabled={isLocked}
                              onClick={() =>
                                handleChecklistMarkChange(c.id, '0', c.max_marks)
                              }
                              className={`px-2 py-1 text-xs font-semibold rounded border cursor-pointer ${
                                (res?.marks_obtained ?? 0) === 0
                                  ? 'bg-slate-800 text-white border-slate-800'
                                  : 'bg-white text-slate-600 border-slate-200'
                              }`}
                            >
                              0
                            </button>
                          </div>
                        ) : (
                          <input
                            type="number"
                            disabled={isLocked}
                            min={0}
                            max={c.max_marks}
                            step={0.5}
                            value={res?.marks_obtained ?? 0}
                            onChange={(e) =>
                              handleChecklistMarkChange(
                                c.id,
                                e.target.value,
                                c.max_marks,
                              )
                            }
                            className="w-20 px-2 py-1 text-center text-sm tabular-nums border border-slate-200 rounded-md disabled:bg-slate-100"
                          />
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          disabled={isLocked}
                          value={res?.comments ?? ''}
                          onChange={(e) =>
                            handleChecklistCommentChange(c.id, e.target.value)
                          }
                          placeholder="Observation..."
                          className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-md disabled:bg-slate-100"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isLocked && (
                          <button
                            type="button"
                            onClick={() =>
                              setEvidenceTarget({
                                targetType: 'checklist_criterion',
                                targetId: c.id,
                                targetLabel: `Checklist ${c.item_number}: ${c.description.slice(0, 40)}`,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#0F2744] bg-slate-100 rounded hover:bg-slate-200 whitespace-nowrap cursor-pointer"
                          >
                            <Upload className="w-3 h-3" />
                            {itemEvidence.length > 0
                              ? `${itemEvidence.length} file`
                              : 'Add'}
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
      ))}

      {/* Tasks Grading */}
      {assessment.tasks.map((task) => {
        const subObtained = calculateTaskSubtotal(
          task.items,
          activeSession.results,
        );
        const subMax = calculateTaskMaxSubtotal(task.items);
        return (
          <div
            key={task.id}
            className="bg-white border border-slate-200 rounded-lg overflow-hidden no-print"
          >
            <div className="px-5 py-3.5 bg-[#1B3A63] text-white flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                TASK {task.task_number}
                {task.task_title ? ` — ${task.task_title}` : ''}
              </h2>
              <span className="text-xs font-mono tabular-nums text-slate-200">
                Sub-Total: {subObtained} / {subMax}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-2.5 px-4 w-[44%]">Criterion</th>
                    <th className="py-2.5 px-4 w-[10%] text-center">Max</th>
                    <th className="py-2.5 px-4 w-[16%] text-center">Obtained</th>
                    <th className="py-2.5 px-4 w-[20%]">Observation</th>
                    <th className="py-2.5 px-4 w-[10%] text-right">Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {task.items.map((item) => {
                    const res = activeSession.results.find(
                      (r) => r.item_id === item.id,
                    );
                    const itemEvidence = sessionEvidence.filter(
                      (ev) => ev.target_id === item.id,
                    );
                    return (
                      <tr
                        key={item.id}
                        className={item.is_subcriterion ? 'bg-slate-50/70' : ''}
                      >
                        <td
                          className={`py-3 px-4 ${item.is_subcriterion ? 'pl-8 text-xs text-slate-700' : 'text-slate-900'}`}
                        >
                          {item.is_subcriterion ? '• ' : ''}
                          {item.item_number}. {item.description}
                          {item.instruction && (
                            <div className="text-xs text-slate-500 italic mt-0.5">
                              ({item.instruction})
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center tabular-nums text-slate-700">
                          {item.is_subcriterion && item.max_marks === 0
                            ? '—'
                            : item.max_marks}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.is_subcriterion && item.max_marks === 0 ? (
                            <span className="text-xs text-slate-400">—</span>
                          ) : (
                            <input
                              type="number"
                              disabled={isLocked}
                              min={0}
                              max={item.max_marks}
                              step={0.5}
                              value={res?.marks_obtained ?? 0}
                              onChange={(e) =>
                                handleTaskMarkChange(
                                  item.id,
                                  e.target.value,
                                  item.max_marks,
                                )
                              }
                              className="w-20 px-2 py-1 text-center text-sm tabular-nums border border-slate-200 rounded-md disabled:bg-slate-100"
                            />
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            disabled={isLocked}
                            value={res?.comments ?? ''}
                            onChange={(e) =>
                              handleTaskCommentChange(item.id, e.target.value)
                            }
                            placeholder="Assessor note..."
                            className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-md disabled:bg-slate-100"
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          {!isLocked && (
                            <button
                              type="button"
                              onClick={() =>
                                setEvidenceTarget({
                                  targetType: 'task_item',
                                  targetId: item.id,
                                  targetLabel: `Task ${task.task_number}.${item.item_number}: ${item.description.slice(0, 40)}`,
                                })
                              }
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#0F2744] bg-slate-100 rounded hover:bg-slate-200 whitespace-nowrap cursor-pointer"
                            >
                              <Upload className="w-3 h-3" />
                              {itemEvidence.length > 0
                                ? `${itemEvidence.length} file`
                                : 'Add'}
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
        );
      })}

      {/* Multimedia Evidence Vault (Module 7.6) */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#0F2744]">
              Multimedia Evidence Portfolio ({sessionEvidence.length} items)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Photographs, videos, audio recordings, and scanned PDFs linked to assessment items with replacement version history.
            </p>
          </div>
          {!isLocked && (
            <button
              type="button"
              onClick={() =>
                setEvidenceTarget({
                  targetType: 'general',
                  targetId: activeSession.id,
                  targetLabel: 'General Assessment Evidence',
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0F2744] rounded-md hover:bg-[#17365D] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload General Evidence
            </button>
          )}
        </div>

        {sessionEvidence.length === 0 ? (
          <div className="p-4 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-md">
            No evidence files uploaded yet for this session. Use &quot;Add&quot; next to any checklist/task item or upload general evidence above.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sessionEvidence.map((ev) => {
              const Icon =
                ev.category === 'Photograph'
                  ? ImageIcon
                  : ev.category === 'Video'
                    ? FileVideo
                    : ev.category === 'Audio'
                      ? FileAudio
                      : FileText;
              return (
                <div
                  key={ev.id}
                  className="p-3.5 border border-slate-200 rounded-md flex items-start justify-between gap-3 bg-slate-50/50"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <Icon className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {ev.file_name}
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        {ev.category} · v{ev.version} ·{' '}
                        <span className="tabular-nums">
                          {Math.max(1, Math.round(ev.file_size / 1024))} KB
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        Linked: {ev.target_label}
                      </div>
                      {(ev.previous_versions?.length || 0) > 0 && (
                        <div className="text-[11px] text-amber-700 mt-0.5">
                          Replaced {ev.previous_versions?.length} earlier version(s)
                        </div>
                      )}
                    </div>
                  </div>
                  {ev.preview_url && (
                    <a
                      href={ev.preview_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-blue-700 hover:underline shrink-0"
                    >
                      Inspect
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Candidate & Assessor Feedback */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Feedback from the Candidate
          </label>
          <textarea
            rows={3}
            disabled={isLocked}
            value={activeSession.feedback_from_candidate}
            onChange={(e) => {
              const updated = {
                ...activeSession,
                feedback_from_candidate: e.target.value,
              };
              setActiveSession(updated);
              updateSession(updated);
            }}
            placeholder="Candidate remarks on assessment fairness, tools, and clarity..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md disabled:bg-slate-100"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Feedback to the Candidate
          </label>
          <textarea
            rows={3}
            disabled={isLocked}
            value={activeSession.feedback_to_candidate}
            onChange={(e) => {
              const updated = {
                ...activeSession,
                feedback_to_candidate: e.target.value,
              };
              setActiveSession(updated);
              updateSession(updated);
            }}
            placeholder="Assessor strengths observed and areas for improvement..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md disabled:bg-slate-100"
          />
        </div>
      </div>

      {/* Evidence Upload Modal */}
      {evidenceTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 no-print">
          <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-[#0F2744]">
                Upload Assessment Evidence
              </h3>
              <button
                type="button"
                onClick={() => setEvidenceTarget(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600">
              <strong>Item:</strong> {evidenceTarget.targetLabel}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Evidence Type
              </label>
              <select
                value={evidenceCategory}
                onChange={(e) =>
                  setEvidenceCategory(e.target.value as EvidenceCategory)
                }
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md"
              >
                <option value="Photograph">Photograph (JPG, JPEG, PNG, WEBP)</option>
                <option value="Video">Video (MP4, MOV, WEBM)</option>
                <option value="Audio">Audio Recording (MP3, WAV, M4A)</option>
                <option value="Document">Document (PDF, DOCX, XLSX)</option>
                <option value="Scanned Document">
                  Scanned Document (PDF, JPG, PNG)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Select File (replacing same category increments version)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,.mp3,.wav,.m4a,.pdf,.docx,.xlsx"
                onChange={handleEvidenceFileSelected}
                className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-slate-300 file:text-xs file:font-medium file:bg-slate-50 file:text-[#0F2744] hover:file:bg-slate-100"
              />
            </div>
          </div>
        </div>
      )}

      {/* Review & Submit Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 no-print">
          <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-[#0F2744]">
                Confirm Assessment Submission
              </h3>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-sm text-slate-700">
              <p>
                <strong>Candidate:</strong> {trainee?.full_name} (
                <span className="font-mono">{trainee?.admission_number}</span>)
              </p>
              <p>
                <strong>Grand Total:</strong>{' '}
                <span className="tabular-nums font-semibold">
                  {grandObtained} / {grandAvailable}
                </span>
              </p>
              <p>
                <strong>Percentage:</strong>{' '}
                <span className="tabular-nums font-semibold">
                  {percentage.toFixed(2)}%
                </span>
              </p>
              <p>
                <strong>Competency Outcome:</strong>{' '}
                <span
                  className={`font-semibold ${
                    outcome === 'Not Yet Competent'
                      ? 'text-red-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {outcome}
                </span>
              </p>
              <p>
                <strong>Evidence Attached:</strong>{' '}
                <span className="tabular-nums">
                  {sessionEvidence.length} file(s)
                </span>
              </p>
            </div>
            <p className="text-xs text-slate-500">
              Submitting locks mark editing (requiring a documented correction request to alter later) and sends the record to Internal Verification.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitSession}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-md hover:bg-emerald-800 cursor-pointer"
              >
                Confirm &amp; Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official 3-Page Paper Overlay */}
      {showPaperPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 overflow-y-auto">
          <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between no-print">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Candidate Assessment Document — {trainee?.full_name}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {trainee?.admission_number} · {percentage.toFixed(2)}% · {outcome}
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
                onClick={() => setShowPaperPreview(false)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Close
              </button>
            </div>
          </div>
          <div className="py-8 px-4 bg-slate-200/80 min-h-screen print-only-container">
            <AssessmentPaper
              assessment={assessment}
              institution={institution}
              session={activeSession}
              trainee={trainee}
            />
          </div>
        </div>
      )}
    </div>
  );
}
