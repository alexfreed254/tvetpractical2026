import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  GitBranch,
  Paperclip,
  Plus,
  Printer,
  Save,
  Send,
  Trash2,
} from 'lucide-react';
import { calculateTotalAvailable } from '../lib/calculations';
import { newUuid } from '../lib/uuid';
import { useAssessmentStore } from '../store/useAssessmentStore';
import type {
  AppRoute,
  Assessment,
  AssessmentItem,
  AssessmentTask,
  AssessmentType,
  ChecklistCriterion,
  ChecklistScoringMode,
} from '../types/tvet';
import { AssessmentPaper } from './AssessmentPaper';

interface AssessmentBuilderViewProps {
  initialAssessmentId?: string;
  onNavigate: (
    route: AppRoute,
    params?: { assessmentId?: string; sessionId?: string },
  ) => void;
}

function createEmptyAssessment(
  instId: string,
  deptName: string,
  courseTitle: string,
  className: string,
  unitCode: string,
  unitName: string,
  creatorName: string,
  academicYear: string,
  term: string,
): Assessment {
  const id = newUuid();
  const taskId = newUuid();
  const clId = newUuid();
  return {
    id,
    institution_id: instId,
    title: 'New Practical Assessment',
    assessment_number: 1,
    assessment_type: 'PRACTICAL',
    department_name: deptName,
    course_title: courseTitle,
    class_name: className,
    level: 'LEVEL 5',
    cycle: 'Cycle 3',
    unit_code: unitCode,
    unit_name: unitName,
    assessment_date: new Date().toISOString().split('T')[0],
    deadline_date: new Date(Date.now() + 7 * 86400_000).toISOString().split('T')[0],
    duration_minutes: 180,
    academic_year: academicYear,
    term,
    status: 'draft',
    version: 1,
    created_by: creatorName,
    instructions:
      'Read all schematics carefully before assembly. Observe lock-out/tag-out isolation rules.',
    required_tools_materials: 'Insulated toolset, digital multimeter, PPE kit.',
    safety_ppe: 'Safety boots, insulated gloves, and safety goggles mandatory.',
    marking_guidelines:
      'Award partial marks proportionally for tidy assembly and verified safety compliance.',
    reference_attachments: [],
    competency_threshold: 50,
    updated_at: new Date().toISOString(),
    checklists: [
      {
        id: clId,
        assessment_id: id,
        title: 'OBSERVATION CHECKLIST',
        instruction:
          'Items to be Evaluated: Please award marks as appropriate. Give a brief comment on your observation.',
        scoring_mode: 'numerical',
        sort_order: 0,
        criteria: [
          {
            id: newUuid(),
            checklist_id: clId,
            item_number: '1',
            description:
              'Wore appropriate Personal Protective Equipment (PPE) throughout the practical',
            max_marks: 4,
            is_subitem: false,
            parent_criteria_id: null,
            sort_order: 0,
            performance_indicator: 'Safety boots, gloves, and eye protection',
            competency_standard: 'OSH-PPE-01',
          },
        ],
      },
    ],
    tasks: [
      {
        id: taskId,
        assessment_id: id,
        task_number: 1,
        task_title: 'Equipment Mounting & Circuit Assembly',
        sort_order: 0,
        items: [
          {
            id: newUuid(),
            task_id: taskId,
            item_number: '1',
            description:
              'Interpreted wiring schematic and marked component mounting centres accurately',
            max_marks: 6,
            is_subcriterion: false,
            parent_item_id: null,
            sort_order: 0,
            instruction: 'Award max 6 marks for dimensional accuracy',
          },
        ],
      },
    ],
  };
}

export function AssessmentBuilderView({
  initialAssessmentId,
  onNavigate,
}: AssessmentBuilderViewProps) {
  const {
    institution,
    departments,
    courses,
    classes,
    units,
    assessments,
    activeUser,
    permissions,
    saveAssessment,
    publishAssessment,
    createNewAssessmentVersion,
  } = useAssessmentStore();

  const makeBlank = () =>
    createEmptyAssessment(
      institution.id,
      departments[0]?.name || institution.department,
      courses[0]?.title || 'ELECTRICAL INSTALLATION',
      classes[0]?.name || 'EE-L5-JAN25',
      units[0]?.code || 'ENG/CU/EI/CR/04/5/A',
      units[0]?.name || 'Install & Test Industrial Controls',
      activeUser.full_name,
      institution.active_academic_year || '2026',
      institution.active_term || 'Term 3',
    );

  const [draft, setDraft] = useState<Assessment>(() => {
    if (initialAssessmentId) {
      const found = assessments.find((a) => a.id === initialAssessmentId);
      if (found) return structuredClone(found);
    }
    return makeBlank();
  });

  const [activeTab, setActiveTab] = useState<'details' | 'tasks' | 'checklist'>(
    'details',
  );
  const [previewScale, setPreviewScale] = useState<'fit' | 'full'>('fit');
  const [savedNotice, setSavedNotice] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  useEffect(() => {
    if (initialAssessmentId) {
      const found = assessments.find((a) => a.id === initialAssessmentId);
      if (found) {
        setDraft(structuredClone(found));
      }
    }
  }, [initialAssessmentId, assessments]);

  const isPublishedLocked =
    draft.status === 'published' &&
    assessments.some((a) => a.id === draft.id && a.status === 'published');

  const handleSaveDraft = () => {
    if (isPublishedLocked || !permissions.canAuthorAssessments) return;
    const next: Assessment = {
      ...draft,
      updated_at: new Date().toISOString(),
    };
    saveAssessment(next);
    setDraft(next);
    setSavedNotice('Draft saved');
    setTimeout(() => setSavedNotice(''), 2600);
  };

  const handlePublish = () => {
    if (!permissions.canPublishAssessments) return;
    const saved: Assessment = {
      ...draft,
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveAssessment(saved);
    publishAssessment(saved.id);
    setDraft(saved);
    setSavedNotice('Published for assessment');
    setTimeout(() => setSavedNotice(''), 2800);
  };

  const handleForkVersion = () => {
    const nextVer = createNewAssessmentVersion(draft.id);
    if (nextVer) {
      setDraft(structuredClone(nextVer));
      setSavedNotice(`Created editable Draft v${nextVer.version}`);
      setTimeout(() => setSavedNotice(''), 2800);
    }
  };

  const handleNewTemplate = () => {
    setDraft(makeBlank());
    setActiveTab('details');
  };

  const handleSelectExisting = (id: string) => {
    const found = assessments.find((a) => a.id === id);
    if (found) setDraft(structuredClone(found));
  };

  const handleAddReferenceAttachment = () => {
    if (!attachmentName.trim() || isPublishedLocked) return;
    const nextAttach = {
      id: newUuid(),
      file_name: attachmentName.trim(),
      file_type: attachmentName.split('.').pop()?.toUpperCase() || 'PDF',
      uploaded_at: new Date().toISOString(),
    };
    setDraft((prev) => ({
      ...prev,
      reference_attachments: [...(prev.reference_attachments || []), nextAttach],
    }));
    setAttachmentName('');
  };

  // Task operations
  const addTask = () => {
    if (isPublishedLocked) return;
    const nextNum = draft.tasks.length + 1;
    const newTask: AssessmentTask = {
      id: newUuid(),
      assessment_id: draft.id,
      task_number: nextNum,
      task_title: `Practical Task ${nextNum}`,
      sort_order: draft.tasks.length,
      items: [],
    };
    setDraft((prev) => ({ ...prev, tasks: [...prev.tasks, newTask] }));
  };

  const removeTask = (taskId: string) => {
    if (isPublishedLocked) return;
    setDraft((prev) => ({
      ...prev,
      tasks: prev.tasks
        .filter((t) => t.id !== taskId)
        .map((t, i) => ({ ...t, task_number: i + 1, sort_order: i })),
    }));
  };

  const updateTaskTitle = (taskId: string, title: string) => {
    if (isPublishedLocked) return;
    setDraft((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, task_title: title } : t,
      ),
    }));
  };

  const addTaskItem = (taskId: string, isSub: boolean) => {
    if (isPublishedLocked) return;
    setDraft((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const topCount = t.items.filter((i) => !i.is_subcriterion).length;
        const lastParent = [...t.items]
          .reverse()
          .find((i) => !i.is_subcriterion);
        const newItem: AssessmentItem = {
          id: newUuid(),
          task_id: taskId,
          item_number: isSub
            ? `${lastParent?.item_number || topCount}a`
            : `${topCount + 1}`,
          description: '',
          max_marks: isSub ? 0 : 4,
          is_subcriterion: isSub,
          parent_item_id: isSub ? lastParent?.id || null : null,
          sort_order: t.items.length,
          instruction: '',
        };
        return { ...t, items: [...t.items, newItem] };
      }),
    }));
  };

  const updateTaskItem = (
    taskId: string,
    itemId: string,
    field: keyof AssessmentItem,
    value: string | number | boolean,
  ) => {
    if (isPublishedLocked) return;
    setDraft((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          items: t.items.map((item) =>
            item.id === itemId ? { ...item, [field]: value } : item,
          ),
        };
      }),
    }));
  };

  const removeTaskItem = (taskId: string, itemId: string) => {
    if (isPublishedLocked) return;
    setDraft((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              items: t.items.filter(
                (i) => i.id !== itemId && i.parent_item_id !== itemId,
              ),
            }
          : t,
      ),
    }));
  };

  // Checklist operations
  const addChecklistCriterion = (clId: string, isSub: boolean) => {
    if (isPublishedLocked) return;
    setDraft((prev) => ({
      ...prev,
      checklists: prev.checklists.map((cl) => {
        if (cl.id !== clId) return cl;
        const topCount = cl.criteria.filter((c) => !c.is_subitem).length;
        const lastParent = [...cl.criteria]
          .reverse()
          .find((c) => !c.is_subitem);
        const isBinary = cl.scoring_mode === 'binary';
        const newCriterion: ChecklistCriterion = {
          id: newUuid(),
          checklist_id: clId,
          item_number: isSub
            ? `${lastParent?.item_number || topCount}a`
            : `${topCount + 1}`,
          description: '',
          max_marks: isSub ? 0 : isBinary ? 1 : 4,
          is_subitem: isSub,
          parent_criteria_id: isSub ? lastParent?.id || null : null,
          sort_order: cl.criteria.length,
          performance_indicator: '',
          competency_standard: '',
        };
        return { ...cl, criteria: [...cl.criteria, newCriterion] };
      }),
    }));
  };

  const updateChecklistCriterion = (
    clId: string,
    criterionId: string,
    field: keyof ChecklistCriterion,
    value: string | number | boolean,
  ) => {
    if (isPublishedLocked) return;
    setDraft((prev) => ({
      ...prev,
      checklists: prev.checklists.map((cl) => {
        if (cl.id !== clId) return cl;
        return {
          ...cl,
          criteria: cl.criteria.map((c) =>
            c.id === criterionId ? { ...c, [field]: value } : c,
          ),
        };
      }),
    }));
  };

  const removeChecklistCriterion = (clId: string, criterionId: string) => {
    if (isPublishedLocked) return;
    setDraft((prev) => ({
      ...prev,
      checklists: prev.checklists.map((cl) =>
        cl.id === clId
          ? {
              ...cl,
              criteria: cl.criteria.filter(
                (c) =>
                  c.id !== criterionId && c.parent_criteria_id !== criterionId,
              ),
            }
          : cl,
      ),
    }));
  };

  const totalMaxMarks = calculateTotalAvailable(draft.tasks, draft.checklists);

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-6 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200/90 no-print">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#0F2744]">
              Assessment Builder &amp; Live A4 Preview
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              {draft.unit_code} · v{draft.version ?? 1} ·{' '}
              <span className="uppercase font-semibold">{draft.status}</span> ·
              Total Marks: {totalMaxMarks} · Threshold: {draft.competency_threshold}%
            </p>
          </div>
          <select
            aria-label="Load existing assessment"
            value={assessments.some((a) => a.id === draft.id) ? draft.id : ''}
            onChange={(e) => {
              if (e.target.value) handleSelectExisting(e.target.value);
            }}
            className="text-xs bg-white border border-slate-200 rounded-md px-3 py-1.5 text-slate-700"
          >
            <option value="">Unsaved Draft Template</option>
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>
                [{a.status.toUpperCase()} v{a.version ?? 1}] {a.unit_code} —{' '}
                {a.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {savedNotice && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 mr-2">
              <Check className="w-3.5 h-3.5" />
              {savedNotice}
            </span>
          )}
          <button
            type="button"
            onClick={handleNewTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Blank
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </button>

          {isPublishedLocked ? (
            permissions.canAuthorAssessments && (
              <button
                type="button"
                onClick={handleForkVersion}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-700 rounded-lg hover:bg-amber-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <GitBranch className="w-3.5 h-3.5" />
                Create Editable Draft v{(draft.version ?? 1) + 1}
              </button>
            )
          ) : (
            <>
              {permissions.canAuthorAssessments && (
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0F2744] rounded-lg hover:bg-[#17365D] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Draft
                </button>
              )}
              {permissions.canPublishAssessments && (
                <button
                  type="button"
                  onClick={handlePublish}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Publish Assessment
                </button>
              )}
            </>
          )}

          {draft.status === 'published' && permissions.canConductAssessments && (
            <button
              type="button"
              onClick={() => onNavigate('execute', { assessmentId: draft.id })}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Assess Trainee
            </button>
          )}
        </div>
      </div>

      {/* Silent Mutation Protection Banner (Module 7.4) */}
      {isPublishedLocked && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg no-print">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Published Instrument (v{draft.version ?? 1}):</strong> Direct modification is locked to preserve submitted trainee records. Fork a new draft version to update criteria or marks.
            </span>
          </div>
          {permissions.canAuthorAssessments && (
            <button
              type="button"
              onClick={handleForkVersion}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 rounded-md hover:bg-amber-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Create v{(draft.version ?? 1) + 1} Draft
            </button>
          )}
        </div>
      )}

      {/* Split Screen */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Editor Panel */}
        <div className="xl:col-span-6 bg-white border border-slate-200 rounded-lg p-6 no-print">
          {/* Segmented Tab Controls */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg mb-6">
            {(
              [
                { key: 'details', label: 'Metadata & Guidelines' },
                { key: 'tasks', label: `Tasks & Criteria (${draft.tasks.length})` },
                {
                  key: 'checklist',
                  label: `Observation Checklist (${draft.checklists[0]?.criteria.length || 0})`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-white text-[#0F2744] shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'details' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Assessment Title
                </label>
                <input
                  type="text"
                  disabled={isPublishedLocked}
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Department
                </label>
                <select
                  disabled={isPublishedLocked}
                  value={draft.department_name}
                  onChange={(e) =>
                    setDraft({ ...draft, department_name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md disabled:bg-slate-50"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                  {!departments.some((d) => d.name === draft.department_name) && (
                    <option value={draft.department_name}>
                      {draft.department_name}
                    </option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Course Title
                </label>
                <select
                  disabled={isPublishedLocked}
                  value={draft.course_title}
                  onChange={(e) =>
                    setDraft({ ...draft, course_title: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md disabled:bg-slate-50"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.title}>
                      {c.title} ({c.level})
                    </option>
                  ))}
                  {!courses.some((c) => c.title === draft.course_title) && (
                    <option value={draft.course_title}>{draft.course_title}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Cohort Class
                </label>
                <select
                  disabled={isPublishedLocked}
                  value={draft.class_name || ''}
                  onChange={(e) => {
                    const cls = classes.find((c) => c.name === e.target.value);
                    setDraft({
                      ...draft,
                      class_name: e.target.value,
                      cycle: cls?.cycle || draft.cycle,
                      level: cls?.level || draft.level,
                    });
                  }}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md disabled:bg-slate-50"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.cycle})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Level &amp; Cycle
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    disabled={isPublishedLocked}
                    value={draft.level}
                    onChange={(e) =>
                      setDraft({ ...draft, level: e.target.value })
                    }
                    className="px-2 py-2 text-xs bg-white border border-slate-200 rounded-md disabled:bg-slate-50"
                  >
                    <option value="LEVEL 4">LEVEL 4</option>
                    <option value="LEVEL 5">LEVEL 5</option>
                    <option value="LEVEL 6">LEVEL 6</option>
                    <option value="LEVEL 4, 5 & 6">LEVEL 4, 5 &amp; 6</option>
                  </select>
                  <select
                    disabled={isPublishedLocked}
                    value={draft.cycle || 'Cycle 3'}
                    onChange={(e) =>
                      setDraft({ ...draft, cycle: e.target.value })
                    }
                    className="px-2 py-2 text-xs bg-white border border-slate-200 rounded-md disabled:bg-slate-50"
                  >
                    {['Cycle 1', 'Cycle 2', 'Cycle 3', 'Cycle 4', 'Cycle 5'].map(
                      (cy) => (
                        <option key={cy} value={cy}>
                          {cy}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Unit Code
                </label>
                <input
                  type="text"
                  disabled={isPublishedLocked}
                  value={draft.unit_code}
                  onChange={(e) =>
                    setDraft({ ...draft, unit_code: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-md disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Unit Name
                </label>
                <input
                  type="text"
                  disabled={isPublishedLocked}
                  value={draft.unit_name}
                  onChange={(e) =>
                    setDraft({ ...draft, unit_name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Assessment Type
                </label>
                <select
                  disabled={isPublishedLocked}
                  value={draft.assessment_type}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      assessment_type: e.target.value as AssessmentType,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-white disabled:bg-slate-50"
                >
                  <option value="PRACTICAL">PRACTICAL</option>
                  <option value="ORAL">ORAL</option>
                  <option value="THEORY">THEORY</option>
                  <option value="PROJECT">PROJECT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Assessment Number &amp; Duration (mins)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={1}
                    disabled={isPublishedLocked}
                    value={draft.assessment_number}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        assessment_number: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="px-2.5 py-2 text-sm tabular-nums border border-slate-200 rounded-md disabled:bg-slate-50"
                  />
                  <input
                    type="number"
                    min={10}
                    disabled={isPublishedLocked}
                    value={draft.duration_minutes}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        duration_minutes: parseInt(e.target.value, 10) || 120,
                      })
                    }
                    className="px-2.5 py-2 text-sm tabular-nums border border-slate-200 rounded-md disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Academic Year &amp; Term
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    disabled={isPublishedLocked}
                    value={draft.academic_year}
                    onChange={(e) =>
                      setDraft({ ...draft, academic_year: e.target.value })
                    }
                    className="px-2.5 py-2 text-xs tabular-nums border border-slate-200 rounded-md disabled:bg-slate-50"
                  />
                  <select
                    disabled={isPublishedLocked}
                    value={draft.term}
                    onChange={(e) =>
                      setDraft({ ...draft, term: e.target.value })
                    }
                    className="px-2 py-2 text-xs bg-white border border-slate-200 rounded-md disabled:bg-slate-50"
                  >
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Assessment Date &amp; Submission Deadline
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    disabled={isPublishedLocked}
                    value={draft.assessment_date}
                    onChange={(e) =>
                      setDraft({ ...draft, assessment_date: e.target.value })
                    }
                    className="px-2 py-2 text-xs tabular-nums border border-slate-200 rounded-md disabled:bg-slate-50"
                  />
                  <input
                    type="date"
                    disabled={isPublishedLocked}
                    value={draft.deadline_date || ''}
                    onChange={(e) =>
                      setDraft({ ...draft, deadline_date: e.target.value })
                    }
                    className="px-2 py-2 text-xs tabular-nums border border-slate-200 rounded-md disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Candidate Assessment Instructions
                </label>
                <textarea
                  rows={2}
                  disabled={isPublishedLocked}
                  value={draft.instructions || ''}
                  onChange={(e) =>
                    setDraft({ ...draft, instructions: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Required Tools &amp; Materials
                </label>
                <textarea
                  rows={2}
                  disabled={isPublishedLocked}
                  value={draft.required_tools_materials || ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      required_tools_materials: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Safety Precautions &amp; PPE
                </label>
                <textarea
                  rows={2}
                  disabled={isPublishedLocked}
                  value={draft.safety_ppe || ''}
                  onChange={(e) =>
                    setDraft({ ...draft, safety_ppe: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md disabled:bg-slate-50"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Marking Guidelines &amp; Reference Attachments
                </label>
                <textarea
                  rows={2}
                  disabled={isPublishedLocked}
                  value={draft.marking_guidelines || ''}
                  onChange={(e) =>
                    setDraft({ ...draft, marking_guidelines: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md disabled:bg-slate-50 mb-2"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled={isPublishedLocked}
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    placeholder="Reference schematic / CAD PDF filename..."
                    className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-md disabled:bg-slate-50"
                  />
                  <button
                    type="button"
                    disabled={isPublishedLocked}
                    onClick={handleAddReferenceAttachment}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#0F2744] bg-slate-100 border border-slate-200 rounded-md hover:bg-slate-200 disabled:opacity-50 cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    Attach Ref
                  </button>
                </div>
                {(draft.reference_attachments || []).length > 0 && (
                  <div className="mt-2 space-y-1">
                    {(draft.reference_attachments || []).map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded"
                      >
                        <span className="font-mono text-slate-700">
                          {att.file_name} ({att.file_type})
                        </span>
                        {!isPublishedLocked && (
                          <button
                            type="button"
                            onClick={() =>
                              setDraft((prev) => ({
                                ...prev,
                                reference_attachments: (
                                  prev.reference_attachments || []
                                ).filter((x) => x.id !== att.id),
                              }))
                            }
                            className="text-slate-400 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#0F2744]">
                  Practical Tasks &amp; Evaluation Criteria
                </h2>
                {!isPublishedLocked && (
                  <button
                    type="button"
                    onClick={addTask}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 rounded-md hover:bg-blue-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Task
                  </button>
                )}
              </div>

              {draft.tasks.map((task) => (
                <div
                  key={task.id}
                  className="border border-slate-200 rounded-lg overflow-hidden"
                >
                  <div className="bg-slate-100/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs font-bold text-[#0F2744] whitespace-nowrap">
                        TASK {task.task_number}
                      </span>
                      <input
                        type="text"
                        disabled={isPublishedLocked}
                        value={task.task_title}
                        onChange={(e) =>
                          updateTaskTitle(task.id, e.target.value)
                        }
                        placeholder="Task title"
                        className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md disabled:bg-slate-50"
                      />
                    </div>
                    {!isPublishedLocked && (
                      <button
                        type="button"
                        onClick={() => removeTask(task.id)}
                        className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                        aria-label={`Remove Task ${task.task_number}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    {task.items.map((item) => (
                      <div
                        key={item.id}
                        className={`grid grid-cols-12 gap-2 items-start ${
                          item.is_subcriterion ? 'pl-6' : ''
                        }`}
                      >
                        <input
                          type="text"
                          disabled={isPublishedLocked}
                          value={item.item_number}
                          onChange={(e) =>
                            updateTaskItem(
                              task.id,
                              item.id,
                              'item_number',
                              e.target.value,
                            )
                          }
                          className="col-span-2 px-2 py-1.5 text-xs font-mono border border-slate-200 rounded-md disabled:bg-slate-50"
                          placeholder="#"
                        />
                        <div className="col-span-7 space-y-1">
                          <input
                            type="text"
                            disabled={isPublishedLocked}
                            value={item.description}
                            onChange={(e) =>
                              updateTaskItem(
                                task.id,
                                item.id,
                                'description',
                                e.target.value,
                              )
                            }
                            placeholder={
                              item.is_subcriterion
                                ? 'Sub-criterion description...'
                                : 'Criterion description...'
                            }
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md disabled:bg-slate-50"
                          />
                          <input
                            type="text"
                            disabled={isPublishedLocked}
                            value={item.instruction || ''}
                            onChange={(e) =>
                              updateTaskItem(
                                task.id,
                                item.id,
                                'instruction',
                                e.target.value,
                              )
                            }
                            placeholder="Optional marking instruction..."
                            className="w-full px-2.5 py-1 text-[11px] text-slate-600 border border-slate-200/80 rounded-md disabled:bg-slate-50"
                          />
                        </div>
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          disabled={isPublishedLocked}
                          value={item.max_marks}
                          onChange={(e) =>
                            updateTaskItem(
                              task.id,
                              item.id,
                              'max_marks',
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="col-span-2 px-2 py-1.5 text-xs text-center tabular-nums border border-slate-200 rounded-md disabled:bg-slate-50"
                        />
                        {!isPublishedLocked && (
                          <button
                            type="button"
                            onClick={() => removeTaskItem(task.id, item.id)}
                            className="col-span-1 p-1.5 text-slate-400 hover:text-red-600 flex justify-center cursor-pointer"
                            aria-label="Remove criterion"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}

                    {!isPublishedLocked && (
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => addTaskItem(task.id, false)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          Add Criterion
                        </button>
                        <button
                          type="button"
                          onClick={() => addTaskItem(task.id, true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          Add Sub-criterion
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-5">
              {draft.checklists.map((cl) => (
                <div
                  key={cl.id}
                  className="border border-slate-200 rounded-lg overflow-hidden"
                >
                  <div className="bg-slate-100/80 px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <input
                      type="text"
                      disabled={isPublishedLocked}
                      value={cl.title}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          checklists: prev.checklists.map((item) =>
                            item.id === cl.id
                              ? { ...item, title: e.target.value }
                              : item,
                          ),
                        }))
                      }
                      className="flex-1 px-2.5 py-1 text-xs font-bold bg-white border border-slate-200 rounded-md disabled:bg-slate-50"
                    />
                    <select
                      disabled={isPublishedLocked}
                      value={cl.scoring_mode || 'numerical'}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          checklists: prev.checklists.map((item) =>
                            item.id === cl.id
                              ? {
                                  ...item,
                                  scoring_mode: e.target
                                    .value as ChecklistScoringMode,
                                }
                              : item,
                          ),
                        }))
                      }
                      className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md disabled:bg-slate-50"
                    >
                      <option value="numerical">Numerical Marks</option>
                      <option value="binary">Binary (1 = Achieved / 0)</option>
                    </select>
                  </div>

                  <div className="p-4 space-y-3">
                    {cl.criteria.map((c) => (
                      <div
                        key={c.id}
                        className={`grid grid-cols-12 gap-2 items-start ${
                          c.is_subitem ? 'pl-6' : ''
                        }`}
                      >
                        <input
                          type="text"
                          disabled={isPublishedLocked}
                          value={c.item_number}
                          onChange={(e) =>
                            updateChecklistCriterion(
                              cl.id,
                              c.id,
                              'item_number',
                              e.target.value,
                            )
                          }
                          className="col-span-2 px-2 py-1.5 text-xs font-mono border border-slate-200 rounded-md disabled:bg-slate-50"
                        />
                        <div className="col-span-7 space-y-1">
                          <input
                            type="text"
                            disabled={isPublishedLocked}
                            value={c.description}
                            onChange={(e) =>
                              updateChecklistCriterion(
                                cl.id,
                                c.id,
                                'description',
                                e.target.value,
                              )
                            }
                            placeholder="Observation item description..."
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md disabled:bg-slate-50"
                          />
                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              type="text"
                              disabled={isPublishedLocked}
                              value={c.performance_indicator || ''}
                              onChange={(e) =>
                                updateChecklistCriterion(
                                  cl.id,
                                  c.id,
                                  'performance_indicator',
                                  e.target.value,
                                )
                              }
                              placeholder="Performance indicator..."
                              className="px-2 py-1 text-[11px] text-slate-600 border border-slate-200/80 rounded-md disabled:bg-slate-50"
                            />
                            <input
                              type="text"
                              disabled={isPublishedLocked}
                              value={c.competency_standard || ''}
                              onChange={(e) =>
                                updateChecklistCriterion(
                                  cl.id,
                                  c.id,
                                  'competency_standard',
                                  e.target.value,
                                )
                              }
                              placeholder="Competency Std (e.g. OSH-01)"
                              className="px-2 py-1 text-[11px] font-mono text-slate-600 border border-slate-200/80 rounded-md disabled:bg-slate-50"
                            />
                          </div>
                        </div>
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          disabled={isPublishedLocked}
                          value={c.max_marks}
                          onChange={(e) =>
                            updateChecklistCriterion(
                              cl.id,
                              c.id,
                              'max_marks',
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="col-span-2 px-2 py-1.5 text-xs text-center tabular-nums border border-slate-200 rounded-md disabled:bg-slate-50"
                        />
                        {!isPublishedLocked && (
                          <button
                            type="button"
                            onClick={() => removeChecklistCriterion(cl.id, c.id)}
                            className="col-span-1 p-1.5 text-slate-400 hover:text-red-600 flex justify-center cursor-pointer"
                            aria-label="Remove checklist item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}

                    {!isPublishedLocked && (
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => addChecklistCriterion(cl.id, false)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          Add Item
                        </button>
                        <button
                          type="button"
                          onClick={() => addChecklistCriterion(cl.id, true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          Add Sub-item
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Live 3-Page A4 Paper Preview */}
        <div className="xl:col-span-6 bg-[#E6ECF4] border border-slate-200 rounded-lg p-4 overflow-x-auto">
          <div className="flex items-center justify-between mb-4 px-1 no-print">
            <span className="text-xs font-semibold text-[#0F2744]">
              Live 3-Page Official A4 Document Preview
            </span>
            <div className="flex items-center gap-1 p-0.5 bg-white border border-slate-200 rounded-md">
              <button
                type="button"
                onClick={() => setPreviewScale('fit')}
                className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                  previewScale === 'fit'
                    ? 'bg-[#0F2744] text-white font-medium'
                    : 'text-slate-600 hover:text-[#0F2744]'
                }`}
              >
                Fit Pane
              </button>
              <button
                type="button"
                onClick={() => setPreviewScale('full')}
                className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                  previewScale === 'full'
                    ? 'bg-[#0F2744] text-white font-medium'
                    : 'text-slate-600 hover:text-[#0F2744]'
                }`}
              >
                100% A4
              </button>
            </div>
          </div>

          <div
            className={
              previewScale === 'fit'
                ? 'origin-top-left scale-[0.68] w-[147%] print:scale-100 print:w-full'
                : 'w-full'
            }
          >
            <AssessmentPaper assessment={draft} institution={institution} />
          </div>
        </div>
      </div>
    </div>
  );
}
