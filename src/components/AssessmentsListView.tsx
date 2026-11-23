import React, { useState } from 'react';
import {
  Copy,
  Edit3,
  Eye,
  FileUp,
  GitBranch,
  Play,
  Plus,
  Printer,
  Search,
  Send,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { calculateTotalAvailable } from '../lib/calculations';
import { useAssessmentStore } from '../store/useAssessmentStore';
import type {
  AppRoute,
  Assessment,
  AssessmentStatus,
  AssessmentType,
} from '../types/tvet';
import { AssessmentPaper } from './AssessmentPaper';

interface AssessmentsListViewProps {
  onNavigate: (
    route: AppRoute,
    params?: { assessmentId?: string; sessionId?: string },
  ) => void;
}

export function AssessmentsListView({ onNavigate }: AssessmentsListViewProps) {
  const {
    assessments,
    institution,
    permissions,
    deleteAssessment,
    publishAssessment,
    withdrawAssessment,
    createNewAssessmentVersion,
    cloneAssessment,
    importAssessmentDocument,
  } = useAssessmentStore();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | AssessmentType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AssessmentStatus>('ALL');
  const [previewAssessment, setPreviewAssessment] = useState<Assessment | null>(
    null,
  );

  // Import Document Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTitle, setImportTitle] = useState('');
  const [importType, setImportType] = useState<AssessmentType>('PRACTICAL');
  const [importText, setImportText] = useState(
    '1. Interpret schematic diagram and verify tool calibration (5 marks)\n2. Assemble and wire components to safety standards (10 marks)\n3. Perform functional testing and record measurements (10 marks)',
  );
  const [importError, setImportError] = useState('');

  const filtered = assessments.filter((a) => {
    const matchesType = typeFilter === 'ALL' || a.assessment_type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const q = search.trim().toLowerCase();
    const matchesQuery =
      !q ||
      a.title.toLowerCase().includes(q) ||
      a.unit_code.toLowerCase().includes(q) ||
      a.unit_name.toLowerCase().includes(q) ||
      a.course_title.toLowerCase().includes(q);
    return matchesType && matchesStatus && matchesQuery;
  });

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['txt', 'md', 'csv', 'json'].includes(ext)) {
      setImportError('Supported import formats: .txt, .md, .csv, or .json');
      return;
    }
    if (file.size > 1_000_000) {
      setImportError('File exceeds 1 MB limit for rubric import.');
      return;
    }
    const text = await file.text();
    setImportText(text);
    if (!importTitle.trim()) {
      setImportTitle(file.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleConfirmImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importTitle.trim() || !importText.trim()) {
      setImportError('Provide both an assessment title and rubric content.');
      return;
    }
    const imported = importAssessmentDocument(importTitle, importText, importType);
    setShowImportModal(false);
    setImportTitle('');
    onNavigate('builder', { assessmentId: imported.id });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/90">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2744]">
            Assessment Instruments &amp; Templates
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Author, import, version, preview, and publish CBET practical and oral assessment instruments.
          </p>
        </div>

        {permissions.canAuthorAssessments && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0F2744] bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileUp className="w-3.5 h-3.5 text-blue-700" />
              Import Document
            </button>
            <button
              type="button"
              onClick={() => onNavigate('builder')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Assessment
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by unit code, unit name, title, or course..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['ALL', 'published', 'draft', 'withdrawn'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-[#0F2744] shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL'
                  ? 'All Status'
                  : st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['ALL', 'PRACTICAL', 'ORAL', 'THEORY', 'PROJECT'] as const).map(
              (type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTypeFilter(type)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    typeFilter === type
                      ? 'bg-white text-[#0F2744] shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {type === 'ALL' ? 'All Types' : type}
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-slate-900">
              No matching assessment instruments found
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Adjust your search filter or create/import a TVET assessment paper.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-xs font-semibold text-[#0F2744]">
                  <th className="py-3 px-4">Unit &amp; Assessment Title</th>
                  <th className="py-3 px-4">Course · Class · Cycle</th>
                  <th className="py-3 px-4">Type &amp; Status</th>
                  <th className="py-3 px-4 text-right">Max Marks</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filtered.map((item) => {
                  const maxMarks = calculateTotalAvailable(
                    item.tasks,
                    item.checklists,
                  );
                  const isPublished = item.status === 'published';
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {item.title || item.unit_name}
                        </div>
                        <div className="text-xs font-mono text-slate-500 mt-0.5">
                          {item.unit_code} · No. {item.assessment_number} · v
                          {item.version ?? 1}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <div className="font-medium text-slate-800">
                          {item.course_title}
                        </div>
                        <div className="text-slate-500">
                          {item.class_name || 'All Classes'} · {item.level} ·{' '}
                          {item.cycle || 'Cycle 3'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-semibold text-[#0F2744]">
                          {item.assessment_type}
                        </div>
                        <div
                          className={`mt-0.5 font-semibold uppercase ${
                            item.status === 'published'
                              ? 'text-emerald-700'
                              : item.status === 'withdrawn'
                                ? 'text-amber-700'
                                : 'text-slate-500'
                          }`}
                        >
                          {item.status}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold tabular-nums text-slate-900">
                        {maxMarks}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewAssessment(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Paper
                          </button>

                          {permissions.canAuthorAssessments && (
                            <>
                              {isPublished ? (
                                <button
                                  type="button"
                                  title="Published instruments are protected; fork a new draft version"
                                  onClick={() => {
                                    const nextVer = createNewAssessmentVersion(item.id);
                                    if (nextVer) {
                                      onNavigate('builder', {
                                        assessmentId: nextVer.id,
                                      });
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#0F2744] bg-white border border-slate-200 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
                                >
                                  <GitBranch className="w-3.5 h-3.5" />
                                  New v{(item.version ?? 1) + 1}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onNavigate('builder', { assessmentId: item.id })
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  Edit Draft
                                </button>
                              )}

                              <button
                                type="button"
                                title="Clone as reusable template"
                                onClick={() => {
                                  const cloned = cloneAssessment(item.id);
                                  if (cloned) {
                                    onNavigate('builder', {
                                      assessmentId: cloned.id,
                                    });
                                  }
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                Clone
                              </button>
                            </>
                          )}

                          {permissions.canPublishAssessments && (
                            <>
                              {item.status !== 'published' ? (
                                <button
                                  type="button"
                                  onClick={() => publishAssessment(item.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 rounded-md hover:bg-emerald-800 whitespace-nowrap shrink-0 cursor-pointer"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  Publish
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => withdrawAssessment(item.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 whitespace-nowrap shrink-0 cursor-pointer"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Withdraw
                                </button>
                              )}
                            </>
                          )}

                          {permissions.canConductAssessments && isPublished && (
                            <button
                              type="button"
                              onClick={() =>
                                onNavigate('execute', { assessmentId: item.id })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-blue-700 rounded-md hover:bg-blue-800 whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" />
                              Assess
                            </button>
                          )}

                          {permissions.canAuthorAssessments &&
                            !isPublished &&
                            assessments.length > 1 && (
                              <button
                                type="button"
                                aria-label={`Delete ${item.title}`}
                                onClick={() => deleteAssessment(item.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
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

      {/* Import Document Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 no-print">
          <form
            onSubmit={handleConfirmImport}
            className="bg-white border border-slate-200 rounded-lg max-w-xl w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-base font-bold text-[#0F2744]">
                  Import Practical Assessment Instrument
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload a rubric file (.txt, .md, .csv, .json) or paste criteria. Imported papers open as Drafts for review before publishing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {importError && (
              <div className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md">
                {importError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Assessment Title
                </label>
                <input
                  type="text"
                  required
                  value={importTitle}
                  onChange={(e) => setImportTitle(e.target.value)}
                  placeholder="e.g. Motor Star-Delta Starter Practical"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Type
                </label>
                <select
                  value={importType}
                  onChange={(e) => setImportType(e.target.value as AssessmentType)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md"
                >
                  <option value="PRACTICAL">PRACTICAL</option>
                  <option value="ORAL">ORAL</option>
                  <option value="THEORY">THEORY</option>
                  <option value="PROJECT">PROJECT</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Upload Document (.txt, .md, .csv, .json)
              </label>
              <input
                type="file"
                accept=".txt,.md,.csv,.json"
                onChange={handleImportFile}
                className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-slate-300 file:text-xs file:font-medium file:bg-slate-50 file:text-[#0F2744] hover:file:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Criteria / Rubric Content (one item per line, marks in parentheses)
              </label>
              <textarea
                rows={6}
                required
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-md"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-md hover:bg-blue-800 cursor-pointer"
              >
                Import &amp; Review Draft
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3-Page Official A4 Paper Preview Modal */}
      {previewAssessment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 overflow-y-auto">
          <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between no-print">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                {previewAssessment.title || previewAssessment.unit_name}
              </h2>
              <p className="text-xs text-slate-500">
                Official 3-page A4 Practical Assessment Paper · Status:{' '}
                <span className="uppercase font-semibold">{previewAssessment.status}</span>
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
                onClick={() => setPreviewAssessment(null)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Close
              </button>
            </div>
          </div>

          <div className="py-8 px-4 bg-slate-200/80 min-h-screen print-only-container">
            <AssessmentPaper
              assessment={previewAssessment}
              institution={institution}
            />
          </div>
        </div>
      )}
    </div>
  );
}
