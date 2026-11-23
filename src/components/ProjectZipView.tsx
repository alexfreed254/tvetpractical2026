import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Database,
  Download,
  FileCode2,
  Folder,
  FolderOpen,
} from 'lucide-react';
import { ALL_PROJECT_FILES, type ExportProjectFile } from '../data/projectFiles';
import { downloadProjectZip } from '../lib/zipExporter';
import { useAssessmentStore } from '../store/useAssessmentStore';

export function ProjectZipView() {
  const { supabaseStatus, applySchemaToSupabase, seedSupabase } =
    useAssessmentStore();
  const [dbActionNotice, setDbActionNotice] = useState<string>('');
  const [dbBusy, setDbBusy] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string>(
    ALL_PROJECT_FILES[0].path,
  );
  const [categoryFilter, setCategoryFilter] = useState<
    'ALL' | ExportProjectFile['category']
  >('ALL');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [lastExportInfo, setLastExportInfo] = useState<string>('');

  const filteredFiles = useMemo(() => {
    if (categoryFilter === 'ALL') return ALL_PROJECT_FILES;
    return ALL_PROJECT_FILES.filter((f) => f.category === categoryFilter);
  }, [categoryFilter]);

  const groupedByFolder = useMemo(() => {
    const map = new Map<string, ExportProjectFile[]>();
    for (const file of filteredFiles) {
      const parts = file.path.split('/');
      parts.pop();
      const folder = parts.join('/');
      const list = map.get(folder) || [];
      list.push(file);
      map.set(folder, list);
    }
    return Array.from(map.entries());
  }, [filteredFiles]);

  const selectedFile =
    ALL_PROJECT_FILES.find((f) => f.path === selectedPath) ||
    ALL_PROJECT_FILES[0];

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const result = await downloadProjectZip(
        ALL_PROJECT_FILES,
        'tvet-eassess-project.zip',
      );
      const kb = (result.byteSize / 1024).toFixed(1);
      setLastExportInfo(
        `Downloaded tvet-eassess-project.zip (${result.fileCount} files · ${kb} KB)`,
      );
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const totalLines = useMemo(
    () =>
      ALL_PROJECT_FILES.reduce(
        (sum, f) => sum + f.content.split('\n').length,
        0,
      ),
    [],
  );

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200/90">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2744]">
            TVET e-ASSESS Project Folder &amp; ZIP Archive
          </h1>
          <p className="text-sm text-slate-500 mt-1 tabular-nums">
            Complete Next.js App Router + Supabase codebase arranged into{' '}
            {groupedByFolder.length} folders ({ALL_PROJECT_FILES.length} files ·{' '}
            {totalLines.toLocaleString()} lines).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {lastExportInfo && (
            <span className="text-xs font-medium text-emerald-700 tabular-nums">
              {lastExportInfo}
            </span>
          )}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0F2744] rounded-lg hover:bg-[#17365D] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Packaging ZIP...' : 'Download tvet-eassess.zip'}
          </button>
        </div>
      </div>

      {/* Supabase Schema & Seed Helper */}
      <div className="bg-white border border-slate-200/90 rounded-lg p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Database className="w-5 h-5 text-blue-700 mt-0.5 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-[#0F2744]">
              Supabase PostgreSQL Database Setup
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              {supabaseStatus.configured && supabaseStatus.schemaReady
                ? `Connected to ${supabaseStatus.projectHost || 'Supabase'} with TVET tables active.`
                : supabaseStatus.configured
                  ? `Connected to ${supabaseStatus.projectHost || 'Supabase'}, awaiting schema tables. Run supabase/schema.sql or apply directly via DATABASE_URL.`
                  : 'Configure SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY (or SUPABASE_ANON_KEY), SUPABASE_SERVICE_ROLE_KEY, and DATABASE_URL in Settings -> Secrets to connect to your existing Supabase project.'}
            </p>
            {dbActionNotice && (
              <p className="text-xs font-medium text-blue-700 mt-1.5">
                {dbActionNotice}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={!supabaseStatus.dbPoolConfigured || dbBusy}
            onClick={async () => {
              setDbBusy(true);
              const res = await applySchemaToSupabase();
              setDbActionNotice(res.message);
              setDbBusy(false);
            }}
            className="px-3 py-1.5 text-xs font-medium text-[#0F2744] bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Apply Schema SQL
          </button>
          <button
            type="button"
            disabled={!supabaseStatus.configured || dbBusy}
            onClick={async () => {
              setDbBusy(true);
              const res = await seedSupabase();
              setDbActionNotice(res.message);
              setDbBusy(false);
            }}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 rounded-md hover:bg-blue-800 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Seed Sample Data
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg self-start w-fit">
        {(
          [
            'ALL',
            'Database',
            'Config',
            'Lib',
            'App Routes',
            'API Routes',
            'Components',
            'Public',
          ] as const
        ).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              categoryFilter === cat
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {cat === 'ALL' ? `All Files (${ALL_PROJECT_FILES.length})` : cat}
          </button>
        ))}
      </div>

      {/* Split Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Folder Tree */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-slate-500" />
            <span>tvet-eassess/</span>
          </div>
          <div className="p-3 space-y-4 max-h-[680px] overflow-y-auto">
            {groupedByFolder.map(([folder, files]) => (
              <div key={folder} className="space-y-1">
                <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-slate-600 font-mono">
                  <Folder className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{folder}/</span>
                </div>
                <div className="pl-4 space-y-0.5">
                  {files.map((file) => {
                    const fileName = file.path.split('/').pop();
                    const isActive = file.path === selectedFile.path;
                    return (
                      <button
                        key={file.path}
                        type="button"
                        onClick={() => setSelectedPath(file.path)}
                        className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-left text-xs rounded-md transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[#0F2744] text-white font-medium'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="inline-flex items-center gap-2 min-w-0">
                          <FileCode2 className="w-3.5 h-3.5 shrink-0 opacity-75" />
                          <span className="font-mono truncate">{fileName}</span>
                        </span>
                        <span
                          className={`text-[10px] tabular-nums shrink-0 ${
                            isActive ? 'text-slate-300' : 'text-slate-400'
                          }`}
                        >
                          {file.content.split('\n').length}L
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Code Viewer */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-mono font-semibold text-slate-900 truncate">
                {selectedFile.path}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                {selectedFile.category} · {selectedFile.language.toUpperCase()} ·{' '}
                {selectedFile.content.split('\n').length} lines
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy File
                </>
              )}
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-slate-800 bg-slate-50/40 overflow-x-auto max-h-[680px] leading-relaxed">
            <code>{selectedFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
