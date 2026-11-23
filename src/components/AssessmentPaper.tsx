import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import {
  calculateChecklistMaxSubtotal,
  calculateChecklistSubtotal,
  calculatePercentage,
  calculateTaskMaxSubtotal,
  calculateTaskSubtotal,
  calculateTotalAvailable,
  calculateTotalObtained,
  determineCompetency,
} from '../lib/calculations';
import type {
  Assessment,
  AssessmentItem,
  AssessmentSession,
  ChecklistCriterion,
  ChecklistResult,
  CriterionResult,
  Institution,
  Trainee,
} from '../types/tvet';

interface AssessmentPaperProps {
  assessment: Assessment;
  institution: Institution;
  session?: AssessmentSession | null;
  trainee?: Trainee | null;
  results?: CriterionResult[];
  checklistResults?: ChecklistResult[];
}

export function AssessmentPaper({
  assessment,
  institution,
  session,
  trainee,
  results = [],
  checklistResults = [],
}: AssessmentPaperProps) {
  const [logoFailed, setLogoFailed] = useState(false);

  const effectiveResults = session ? session.results : results;
  const effectiveChecklistResults = session
    ? session.checklist_results
    : checklistResults;

  const totalAvailable = calculateTotalAvailable(
    assessment.tasks,
    assessment.checklists,
  );
  const totalObtained = calculateTotalObtained(
    assessment.tasks,
    assessment.checklists,
    effectiveResults,
    effectiveChecklistResults,
  );
  const percentage = calculatePercentage(totalObtained, totalAvailable);
  const threshold =
    assessment.competency_threshold || institution.competency_threshold || 50;
  const hasMarks =
    effectiveResults.length > 0 || effectiveChecklistResults.length > 0;
  const outcome = session?.competency_outcome && session.competency_outcome !== 'Pending'
    ? session.competency_outcome
    : hasMarks
      ? determineCompetency(percentage, threshold)
      : 'Pending';

  const isCompetentOutcome =
    outcome === 'Competent' || outcome === 'Proficient' || outcome === 'Mastery';

  const page2Tasks = assessment.tasks.slice(0, 2);
  const page3Tasks = assessment.tasks.slice(2);
  const totalPages = 3;

  return (
    <div className="print-only-container space-y-6">
      {/* PAGE 1: Institutional Header, Candidate Details, Instructions/PPE, Observation Checklist */}
      <div className="a4-sheet">
        <div className="a4-sheet-header">
          <div className="flex justify-center mb-2">
            {!logoFailed && institution.logo_url ? (
              <img
                src={institution.logo_url}
                alt={`${institution.name} crest`}
                referrerPolicy="no-referrer"
                onError={() => setLogoFailed(true)}
                className="w-16 h-16 object-contain"
              />
            ) : (
              <div className="w-16 h-16 rounded-full border-2 border-slate-900 flex items-center justify-center bg-slate-50">
                <ShieldCheck className="w-8 h-8 text-slate-900" />
              </div>
            )}
          </div>
          <div className="text-[16pt] font-bold uppercase tracking-wide leading-tight">
            {institution.name || 'THIKA TECHNICAL TRAINING INSTITUTE'}
          </div>
          <div className="text-[12pt] font-bold uppercase mt-1">
            {assessment.department_name || 'ELECTRICAL & ELECTRONICS ENGINEERING'}
          </div>
          <div className="text-[11pt] font-bold uppercase mt-0.5">
            {assessment.course_title || 'ELECTRICAL INSTALLATION'}
            {assessment.class_name ? ` · CLASS: ${assessment.class_name}` : ''}
          </div>
          <div className="text-[10.5pt] font-bold uppercase mt-0.5">
            {assessment.level || 'LEVEL 4, 5 & 6'}
            {assessment.cycle ? ` · ${assessment.cycle}` : ''}
            {` · ${assessment.academic_year} ${assessment.term}`}
          </div>
          <div className="text-[9.5pt] mt-1">
            Unit Code: {assessment.unit_code || 'ENG/CU/EI/CR/03/5/MA'}
          </div>
          <div className="text-[10.5pt] font-bold mt-0.5">
            {assessment.unit_name || 'Install Security System'}
          </div>
          <div className="text-[11pt] font-bold uppercase mt-2">
            {assessment.assessment_type} ASSESSMENT {assessment.assessment_number}
            {assessment.version ? ` (v${assessment.version})` : ''}
            {session?.attempt_number && session.attempt_number > 1
              ? ` — REASSESSMENT ATTEMPT #${session.attempt_number}`
              : ''}
          </div>
          <div className="text-[10pt] font-bold uppercase mt-1.5 tracking-wider">
            OBSERVATION CHECKLIST
          </div>
        </div>

        {/* Candidate Information Table */}
        <table className="a4-candidate-table">
          <tbody>
            <tr>
              <td className="a4-label-cell">Candidate&apos;s Name</td>
              <td>{trainee?.full_name || ''}</td>
              <td className="a4-label-cell">Venue / Workshop</td>
              <td>{session?.venue || ''}</td>
            </tr>
            <tr>
              <td className="a4-label-cell">Candidate&apos;s Adm. No.</td>
              <td className="tabular-nums">{trainee?.admission_number || ''}</td>
              <td className="a4-label-cell">Duration</td>
              <td className="tabular-nums">{assessment.duration_minutes} mins</td>
            </tr>
            <tr>
              <td className="a4-label-cell">Date of Assessment</td>
              <td className="tabular-nums">
                {session?.assessment_date || assessment.assessment_date || ''}
              </td>
              <td className="a4-label-cell">Assessor Name</td>
              <td>{session?.assessor_name || assessment.created_by || ''}</td>
            </tr>
          </tbody>
        </table>

        {/* Concise Assessment Instructions, Tools & Safety PPE Block (Section 7.7) */}
        {(assessment.instructions ||
          assessment.required_tools_materials ||
          assessment.safety_ppe) && (
          <div className="border border-black p-2 my-2 text-[8.5pt] space-y-0.5 bg-slate-50/40">
            {assessment.instructions && (
              <div>
                <strong>Instructions:</strong> {assessment.instructions}
              </div>
            )}
            {assessment.required_tools_materials && (
              <div>
                <strong>Tools &amp; Materials:</strong>{' '}
                {assessment.required_tools_materials}
              </div>
            )}
            {assessment.safety_ppe && (
              <div>
                <strong>Safety &amp; PPE:</strong> {assessment.safety_ppe}
              </div>
            )}
          </div>
        )}

        <p className="text-[9pt] italic text-slate-800 my-1.5">
          Items to be Evaluated: Please award marks as appropriate. Give a brief
          comment on your observation.
        </p>

        {/* Observation Checklist 4-Column Table */}
        <table className="a4-table">
          <thead>
            <tr>
              <th className="w-[54%]">Item to be Evaluated</th>
              <th className="w-[12%]">Marks Available</th>
              <th className="w-[12%]">Marks Obtained</th>
              <th className="w-[22%]">Comment</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={4}
                className="text-center font-bold bg-slate-100 uppercase"
              >
                OBSERVATION CHECKLIST
              </td>
            </tr>
            {assessment.checklists.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center italic text-slate-500 py-4">
                  No observation checklist items configured.
                </td>
              </tr>
            ) : (
              assessment.checklists.map((cl, idx) => (
                <React.Fragment key={cl.id}>
                  <ChecklistRows
                    criteria={cl.criteria}
                    results={effectiveChecklistResults}
                    hasMarks={hasMarks}
                  />
                  <tr className="font-bold bg-slate-50">
                    <td className="text-right">
                      Sub-total {assessment.checklists.length > 1 ? idx + 1 : ''}
                    </td>
                    <td className="text-center tabular-nums">
                      {calculateChecklistMaxSubtotal(cl.criteria)}
                    </td>
                    <td className="text-center tabular-nums">
                      {hasMarks
                        ? calculateChecklistSubtotal(
                            cl.criteria,
                            effectiveChecklistResults,
                          )
                        : ''}
                    </td>
                    <td />
                  </tr>
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>

        <div className="absolute bottom-[10mm] right-[15mm] text-[9pt] text-slate-600 tabular-nums">
          Page 1 of {totalPages}
        </div>
      </div>

      {/* PAGE 2: Practical Tasks 1 & 2 */}
      <div className="a4-sheet">
        {page2Tasks.length === 0 ? (
          <div className="border border-black p-6 text-center italic text-[10pt] text-slate-600">
            No assessment tasks configured yet. Add tasks in the Assessment Builder.
          </div>
        ) : (
          page2Tasks.map((task) => (
            <div key={task.id} className="mb-4">
              <table className="a4-table">
                <thead>
                  <tr>
                    <th className="w-[54%] text-center uppercase">
                      TASK {task.task_number}
                      {task.task_title ? ` — ${task.task_title}` : ''}
                    </th>
                    <th className="w-[12%]">Marks</th>
                    <th className="w-[12%]">Obtained</th>
                    <th className="w-[22%]">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  <TaskItemRows
                    items={task.items}
                    results={effectiveResults}
                    hasMarks={hasMarks}
                  />
                  <tr className="font-bold bg-slate-50">
                    <td className="text-right">Sub-Total {task.task_number}</td>
                    <td className="text-center tabular-nums">
                      {calculateTaskMaxSubtotal(task.items)}
                    </td>
                    <td className="text-center tabular-nums">
                      {hasMarks
                        ? calculateTaskSubtotal(task.items, effectiveResults)
                        : ''}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          ))
        )}

        <div className="absolute bottom-[10mm] right-[15mm] text-[9pt] text-slate-600 tabular-nums">
          Page 2 of {totalPages}
        </div>
      </div>

      {/* PAGE 3: Remaining Tasks, Grand Total, Percentage Formula, Outcome, Feedback & Verification */}
      <div className="a4-sheet">
        {page3Tasks.map((task) => (
          <div key={task.id} className="mb-4">
            <table className="a4-table">
              <thead>
                <tr>
                  <th className="w-[54%] text-center uppercase">
                    TASK {task.task_number}
                    {task.task_title ? ` — ${task.task_title}` : ''}
                  </th>
                  <th className="w-[12%]">Marks</th>
                  <th className="w-[12%]">Obtained</th>
                  <th className="w-[22%]">Comment</th>
                </tr>
              </thead>
              <tbody>
                <TaskItemRows
                  items={task.items}
                  results={effectiveResults}
                  hasMarks={hasMarks}
                />
                <tr className="font-bold bg-slate-50">
                  <td className="text-right">Sub-Total {task.task_number}</td>
                  <td className="text-center tabular-nums">
                    {calculateTaskMaxSubtotal(task.items)}
                  </td>
                  <td className="text-center tabular-nums">
                    {hasMarks
                      ? calculateTaskSubtotal(task.items, effectiveResults)
                      : ''}
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        ))}

        {/* Grand Total Table */}
        <table className="a4-table mt-3">
          <tbody>
            <tr className="font-bold bg-slate-200 text-[10pt]">
              <td className="w-[54%] text-right">GRAND TOTAL</td>
              <td className="w-[12%] text-center tabular-nums">{totalAvailable}</td>
              <td className="w-[12%] text-center tabular-nums">
                {hasMarks ? totalObtained : ''}
              </td>
              <td className="w-[22%]" />
            </tr>
          </tbody>
        </table>

        {/* Percentage Calculation Formula */}
        <div className="text-center text-[10pt] my-4">
          <span className="a4-fraction">
            <span className="a4-fraction-num tabular-nums">
              {hasMarks ? totalObtained : '\u00A0\u00A0\u00A0\u00A0'}
            </span>
            <span className="a4-fraction-den tabular-nums">{totalAvailable}</span>
          </span>
          <span>
            {' '}
            × 100 ={' '}
            <strong className="tabular-nums">
              {hasMarks ? `${percentage.toFixed(2)}%` : '_______%'}
            </strong>
          </span>
        </div>

        {/* Assessment Outcome Box */}
        <div className="border border-black p-3 my-4">
          <div className="font-bold text-center uppercase text-[10pt] mb-2">
            ASSESSMENT OUTCOME
          </div>
          <div className="text-[10pt] mb-2">
            The candidate was found to be:{' '}
            {hasMarks && (
              <strong className="uppercase ml-1">({outcome})</strong>
            )}
          </div>
          <div className="flex items-center gap-8 mb-2 text-[10pt]">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center justify-center w-4 h-4 border border-black text-[10px] font-bold ${
                  isCompetentOutcome ? 'bg-black text-white' : 'bg-white'
                }`}
              >
                {isCompetentOutcome ? '✓' : ''}
              </span>
              <span>Competent{outcome === 'Mastery' || outcome === 'Proficient' ? ` (${outcome})` : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center justify-center w-4 h-4 border border-black text-[10px] font-bold ${
                  outcome === 'Not Yet Competent'
                    ? 'bg-black text-white'
                    : 'bg-white'
                }`}
              >
                {outcome === 'Not Yet Competent' ? '✓' : ''}
              </span>
              <span>Not yet Competent</span>
            </div>
          </div>
          <div className="text-[8.5pt] italic text-slate-800">
            (The candidate is competent if the candidate obtains at least{' '}
            {threshold}% · Evidence Attached: {session?.evidence?.length ?? 0} file(s))
          </div>
        </div>

        {/* Feedback Boxes */}
        <div className="text-[10pt] my-4 space-y-3">
          <div>
            <div className="font-bold italic mb-1">
              Feedback from the Candidate:
            </div>
            <div className="border border-black min-h-[48px] p-2 text-[9.5pt]">
              {session?.feedback_from_candidate || ''}
            </div>
          </div>
          <div>
            <div className="font-bold italic mb-1">
              Feedback to the Candidate:
            </div>
            <div className="border border-black min-h-[48px] p-2 text-[9.5pt]">
              {session?.feedback_to_candidate || ''}
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="text-[10pt] mt-4 space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <strong>Candidate Signature:</strong>{' '}
              <span className="inline-block border-b border-black min-w-[180px] ml-2">
                {session?.candidate_signed_at ? trainee?.full_name : '\u00A0'}
              </span>
            </div>
            <div>
              <strong>Date:</strong>{' '}
              <span className="inline-block border-b border-black min-w-[110px] ml-2 tabular-nums">
                {session?.candidate_signed_at
                  ? session.candidate_signed_at.split('T')[0]
                  : '\u00A0'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <strong>Assessor&apos;s Signature:</strong>{' '}
              <span className="inline-block border-b border-black min-w-[180px] ml-2">
                {session?.assessor_signed_at ? session.assessor_name : '\u00A0'}
              </span>
            </div>
            <div>
              <strong>Date:</strong>{' '}
              <span className="inline-block border-b border-black min-w-[110px] ml-2 tabular-nums">
                {session?.assessor_signed_at
                  ? session.assessor_signed_at.split('T')[0]
                  : '\u00A0'}
              </span>
            </div>
          </div>
        </div>

        {/* Verification & Release Footer (Section 7.7 & 7.10) */}
        {(session?.verification_status || session?.external_verifier_name || session?.results_released) && (
          <div className="mt-4 pt-2 border-t border-black text-[8.5pt] space-y-1">
            {session?.verification_status && session.verification_status !== 'pending' && (
              <div>
                <strong>Internal Verification:</strong>{' '}
                <span className="uppercase">{session.verification_status}</span>
                {session.verifier_name ? ` · Verifier: ${session.verifier_name}` : ''}
                {session.verified_at ? ` · Date: ${session.verified_at.split('T')[0]}` : ''}
                {session.verification_notes ? ` · Notes: ${session.verification_notes}` : ''}
              </div>
            )}
            {session?.external_verifier_name && (
              <div>
                <strong>External Verification:</strong> {session.external_verifier_name}
                {session.external_verified_at
                  ? ` · Date: ${session.external_verified_at.split('T')[0]}`
                  : ''}
                {session.external_verification_notes
                  ? ` · Findings: ${session.external_verification_notes}`
                  : ''}
              </div>
            )}
            <div>
              <strong>Result Release Policy Status:</strong>{' '}
              {session?.results_released
                ? `RELEASED (${session.released_at?.split('T')[0] || ''} by ${session.released_by || 'Authorized Officer'})`
                : 'Held Pending Verification / Release'}
            </div>
          </div>
        )}

        <div className="absolute bottom-[10mm] right-[15mm] text-[9pt] text-slate-600 tabular-nums">
          Page 3 of {totalPages}
        </div>
      </div>
    </div>
  );
}

function ChecklistRows({
  criteria,
  results,
  hasMarks,
}: {
  criteria: ChecklistCriterion[];
  results: ChecklistResult[];
  hasMarks: boolean;
}) {
  const topLevel = criteria.filter((c) => !c.is_subitem);

  return (
    <>
      {topLevel.map((c) => {
        const res = results.find((r) => r.criteria_id === c.id);
        const subitems = criteria.filter(
          (sub) => sub.is_subitem && sub.parent_criteria_id === c.id,
        );
        return (
          <React.Fragment key={c.id}>
            <tr>
              <td>
                {c.item_number}. {c.description}
                {c.performance_indicator && (
                  <div className="text-[8pt] italic text-slate-700">
                    ({c.performance_indicator})
                  </div>
                )}
                {c.competency_standard && (
                  <div className="text-[7.5pt] text-slate-600">
                    Std: {c.competency_standard}
                  </div>
                )}
              </td>
              <td className="text-center tabular-nums">{c.max_marks}</td>
              <td className="text-center tabular-nums">
                {hasMarks ? (res ? res.marks_obtained : 0) : ''}
              </td>
              <td>{res?.comments || ''}</td>
            </tr>
            {subitems.map((sub) => {
              const subRes = results.find((r) => r.criteria_id === sub.id);
              return (
                <tr key={sub.id}>
                  <td className="pl-6 text-[9pt]">
                    • {sub.item_number}. {sub.description}
                  </td>
                  <td className="text-center tabular-nums">
                    {sub.max_marks > 0 ? sub.max_marks : '—'}
                  </td>
                  <td className="text-center tabular-nums">
                    {hasMarks && sub.max_marks > 0
                      ? subRes
                        ? subRes.marks_obtained
                        : 0
                      : ''}
                  </td>
                  <td>{subRes?.comments || ''}</td>
                </tr>
              );
            })}
          </React.Fragment>
        );
      })}
    </>
  );
}

function TaskItemRows({
  items,
  results,
  hasMarks,
}: {
  items: AssessmentItem[];
  results: CriterionResult[];
  hasMarks: boolean;
}) {
  const topLevel = items.filter((item) => !item.is_subcriterion);

  return (
    <>
      {topLevel.map((item) => {
        const res = results.find((r) => r.item_id === item.id);
        const subs = items.filter(
          (sub) => sub.is_subcriterion && sub.parent_item_id === item.id,
        );
        return (
          <React.Fragment key={item.id}>
            <tr>
              <td>
                {item.item_number}. {item.description}
                {item.instruction && (
                  <div className="text-[8pt] italic text-slate-700">
                    ({item.instruction})
                  </div>
                )}
              </td>
              <td className="text-center tabular-nums">{item.max_marks}</td>
              <td className="text-center tabular-nums">
                {hasMarks ? (res ? res.marks_obtained : 0) : ''}
              </td>
              <td>{res?.comments || ''}</td>
            </tr>
            {subs.map((sub) => {
              const subRes = results.find((r) => r.item_id === sub.id);
              return (
                <tr key={sub.id}>
                  <td className="pl-6 text-[9pt]">
                    • {sub.item_number}. {sub.description}
                    {sub.instruction && (
                      <div className="text-[8pt] italic text-slate-700">
                        ({sub.instruction})
                      </div>
                    )}
                  </td>
                  <td className="text-center tabular-nums">
                    {sub.max_marks > 0 ? sub.max_marks : '—'}
                  </td>
                  <td className="text-center tabular-nums">
                    {hasMarks && sub.max_marks > 0
                      ? subRes
                        ? subRes.marks_obtained
                        : 0
                      : ''}
                  </td>
                  <td>{subRes?.comments || ''}</td>
                </tr>
              );
            })}
          </React.Fragment>
        );
      })}
    </>
  );
}
