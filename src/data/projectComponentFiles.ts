import type { ExportProjectFile } from './projectCoreFiles';

export const PROJECT_COMPONENT_FILES: ExportProjectFile[] = [
  {
    path: 'tvet-eassess/components/AssessmentPaper.js',
    language: 'javascript',
    category: 'Components',
    content: `import React from 'react';

/**
 * AssessmentPaper - Renders the official TVET practical assessment document
 * Closely reproduces the Thika Technical Training Institute reference layout
 */
export default function AssessmentPaper({ assessment, session, tasks = [], checklists = [], results = [], checklistResults = [], institution, pageNumber = 1, totalPages = 3 }) {
  const candidate = session?.trainees || session?.trainee || {};

  const calculateSubtotal = (items, itemResults) => {
    return items.reduce((sum, item) => {
      if (!item.is_subcriterion) {
        const r = itemResults?.find(res => res.item_id === item.id);
        return sum + (r ? parseFloat(r.marks_obtained) || 0 : 0);
      }
      return sum;
    }, 0);
  };

  const calculateChecklistSubtotal = (criteria, criteriaResults) => {
    return criteria.reduce((sum, c) => {
      if (!c.is_subitem) {
        const r = criteriaResults?.find(res => res.criteria_id === c.id);
        return sum + (r ? parseFloat(r.marks_obtained) || 0 : 0);
      }
      return sum;
    }, 0);
  };

  const calculateMaxSubtotal = (items) => {
    return items.reduce((sum, item) => {
      if (!item.is_subcriterion) {
        return sum + (parseFloat(item.max_marks) || 0);
      }
      return sum;
    }, 0);
  };

  const calculateChecklistMax = (criteria) => {
    return criteria.reduce((sum, c) => {
      if (!c.is_subitem) {
        return sum + (parseFloat(c.max_marks) || 0);
      }
      return sum;
    }, 0);
  };

  const totalAvailable = tasks.reduce((sum, t) => sum + calculateMaxSubtotal(t.items || []), 0) +
    checklists.reduce((sum, cl) => sum + calculateChecklistMax(cl.criteria || []), 0);
  const totalObtained = tasks.reduce((sum, t) => sum + calculateSubtotal(t.items || [], results), 0) +
    checklists.reduce((sum, cl) => sum + calculateChecklistSubtotal(cl.criteria || [], checklistResults), 0);
  const percentage = totalAvailable > 0 ? (totalObtained / totalAvailable) * 100 : 0;
  const threshold = institution?.competency_threshold || 50;
  const outcome = percentage >= threshold ? 'Competent' : 'Not Yet Competent';

  return (
    <div className="a4-page" style={{ padding: '15mm' }}>
      {pageNumber === 1 && (
        <>
          <div className="institution-header">
            {institution?.logo_url && (
              <img src={institution.logo_url} alt="Logo" className="institution-logo" />
            )}
            <div className="institution-name">{institution?.name || 'THIKA TECHNICAL TRAINING INSTITUTE'}</div>
            <div className="department-name">{assessment?.department_name || 'ELECTRICAL & ELECTRONICS ENGINEERING'}</div>
            <div className="course-title">{assessment?.course_title || 'ELECTRICAL INSTALLATION'}</div>
            <div className="qualification-level">{assessment?.level || 'LEVEL 4, 5 & 6'}</div>
            <div className="unit-code">Unit Code: {assessment?.unit_code || 'ENG/CU/EI/CR/03/5/MA'}</div>
            <div className="unit-name">{assessment?.unit_name || 'Install Security System'}</div>
            <div className="assessment-type">
              {assessment?.assessment_type || 'PRACTICAL'} ASSESSMENT {assessment?.assessment_number || '1'}
            </div>
            <div className="section-heading" style={{ marginTop: '15px' }}>OBSERVATION CHECKLIST</div>
          </div>

          <table className="candidate-info-table">
            <tbody>
              <tr>
                <td className="label-cell">Candidate's Name</td>
                <td>{candidate?.full_name || session?.candidate_name || ''}</td>
              </tr>
              <tr>
                <td className="label-cell">Candidate's Adm. No.</td>
                <td>{candidate?.admission_number || session?.admission_number || ''}</td>
              </tr>
              <tr>
                <td className="label-cell">Date of Assessment</td>
                <td>{session?.assessment_date ? new Date(session.assessment_date).toLocaleDateString() : ''}</td>
              </tr>
            </tbody>
          </table>

          <div className="instruction-text">
            Items to be Evaluated: Please award marks as appropriate. Give a brief comment on your observation.
          </div>

          <table className="assessment-table">
            <thead>
              <tr>
                <th className="item-column">Item to be Evaluated</th>
                <th className="marks-column">Marks Available</th>
                <th className="obtained-column">Marks Obtained</th>
                <th className="comments-column">Comment</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', fontWeight: 'bold', background: '#f0f0f0' }}>
                  OBSERVATION CHECKLIST
                </td>
              </tr>
              {checklists.map((checklist, idx) => (
                <React.Fragment key={checklist.id}>
                  {(checklist.criteria || []).map((criteria) => (
                    <CriteriaRow
                      key={criteria.id}
                      criteria={criteria}
                      allCriteria={checklist.criteria || []}
                      results={checklistResults}
                      isChecklist={true}
                    />
                  ))}
                  <tr className="subtotal-row">
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>Sub-total {idx + 1}</td>
                    <td>{calculateChecklistMax(checklist.criteria || [])}</td>
                    <td>{calculateChecklistSubtotal(checklist.criteria || [], checklistResults)}</td>
                    <td></td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </>
      )}

      {pageNumber === 2 && (
        <>
          {tasks.slice(0, 2).map((task) => (
            <div key={task.id} style={{ marginBottom: '15px' }}>
              <table className="assessment-table">
                <thead>
                  <tr>
                    <th className="item-column" style={{ textAlign: 'center' }}>
                      TASK {task.task_number} {task.task_title && \`- \${task.task_title}\`}
                    </th>
                    <th className="marks-column">Marks</th>
                    <th className="obtained-column">Obtained</th>
                    <th className="comments-column">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {(task.items || []).map((item) => (
                    <CriteriaRow
                      key={item.id}
                      criteria={item}
                      allCriteria={task.items || []}
                      results={results}
                      isChecklist={false}
                    />
                  ))}
                  <tr className="subtotal-row">
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>Sub-Total {task.task_number}</td>
                    <td>{calculateMaxSubtotal(task.items || [])}</td>
                    <td>{calculateSubtotal(task.items || [], results)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </>
      )}

      {pageNumber === 3 && (
        <>
          {tasks.length > 2 && tasks.slice(2).map((task) => (
            <div key={task.id} style={{ marginBottom: '15px' }}>
              <table className="assessment-table">
                <thead>
                  <tr>
                    <th className="item-column" style={{ textAlign: 'center' }}>
                      TASK {task.task_number} {task.task_title && \`- \${task.task_title}\`}
                    </th>
                    <th className="marks-column">Marks</th>
                    <th className="obtained-column">Obtained</th>
                    <th className="comments-column">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {(task.items || []).map((item) => (
                    <CriteriaRow
                      key={item.id}
                      criteria={item}
                      allCriteria={task.items || []}
                      results={results}
                      isChecklist={false}
                    />
                  ))}
                  <tr className="subtotal-row">
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>Sub-Total {task.task_number}</td>
                    <td>{calculateMaxSubtotal(task.items || [])}</td>
                    <td>{calculateSubtotal(task.items || [], results)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}

          <table className="assessment-table" style={{ marginTop: '10px' }}>
            <tbody>
              <tr className="grand-total-row">
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>GRAND TOTAL</td>
                <td>{totalAvailable}</td>
                <td>{totalObtained}</td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <div className="percentage-formula" style={{ marginTop: '15px' }}>
            <span className="fraction">
              <span className="numerator">{totalObtained}</span>
              <span className="denominator">{totalAvailable}</span>
            </span>
            <span> × 100 = <strong>{percentage.toFixed(2)}%</strong></span>
          </div>

          <div className="outcome-section">
            <div className="outcome-title">ASSESSMENT OUTCOME</div>
            <div style={{ fontSize: '10pt', marginBottom: '8px' }}>
              The candidate was found to be:
            </div>
            <div style={{ marginBottom: '8px' }}>
              <span className="checkbox-option">
                <span className={\`checkbox-box \${outcome === 'Competent' ? 'checked' : ''}\`}
                  style={{ backgroundColor: outcome === 'Competent' ? '#000' : 'transparent', position: 'relative' }}>
                  {outcome === 'Competent' && <span style={{ color: 'white', fontSize: '12px', position: 'absolute', top: '-2px', left: '2px' }}>✓</span>}
                </span>
                Competent
              </span>
              <span className="checkbox-option">
                <span className={\`checkbox-box \${outcome === 'Not Yet Competent' ? 'checked' : ''}\`}
                  style={{ backgroundColor: outcome === 'Not Yet Competent' ? '#000' : 'transparent', position: 'relative' }}>
                  {outcome === 'Not Yet Competent' && <span style={{ color: 'white', fontSize: '12px', position: 'absolute', top: '-2px', left: '2px' }}>✓</span>}
                </span>
                Not yet Competent
              </span>
            </div>
            <div className="instruction-text">(Please tick as appropriate)</div>
            <div className="instruction-text">
              (The candidate is competent if the candidate obtains at least {threshold}%)
            </div>
          </div>

          <div className="feedback-section">
            <div className="feedback-title">Feedback from the Candidate:</div>
            <div className="feedback-box">{session?.feedback_from_candidate || ''}</div>

            <div className="feedback-title">Feedback to the Candidate:</div>
            <div className="feedback-box">{session?.feedback_to_candidate || ''}</div>
          </div>

          <div className="signature-row">
            <div><strong>Candidate Signature:</strong> <span className="signature-line"></span></div>
            <div style={{ marginTop: '10px' }}><strong>Date:</strong> <span className="signature-line"></span></div>
          </div>

          <div className="signature-row" style={{ marginTop: '20px' }}>
            <div><strong>Assessor's Signature:</strong> <span className="signature-line"></span></div>
            <div style={{ marginTop: '10px' }}><strong>Date:</strong> <span className="signature-line"></span></div>
          </div>
        </>
      )}

      <div className="page-number">Page {pageNumber} of {totalPages}</div>
    </div>
  );
}

function CriteriaRow({ criteria, allCriteria, results, isChecklist }) {
  const result = isChecklist
    ? results?.find(r => r.criteria_id === criteria.id)
    : results?.find(r => r.item_id === criteria.id);

  const marksObtained = result ? (parseFloat(result.marks_obtained) || 0) : 0;
  const comments = result?.comments || '';
  const isSub = criteria.is_subcriterion || criteria.is_subitem;
  if (isSub && (criteria.parent_item_id || criteria.parent_criteria_id)) {
    return null;
  }

  const subcriteria = allCriteria.filter(c => (c.parent_item_id || c.parent_criteria_id) === criteria.id);

  return (
    <React.Fragment>
      <tr>
        <td>
          {criteria.item_number}. {criteria.description}
          {criteria.instruction && <div style={{ fontSize: '8pt', fontStyle: 'italic' }}>({criteria.instruction})</div>}
        </td>
        <td className="marks-column">{criteria.max_marks}</td>
        <td className="obtained-column">{marksObtained}</td>
        <td className="comments-column">{comments}</td>
      </tr>
      {subcriteria.map(sub => {
        const subResult = isChecklist
          ? results?.find(r => r.criteria_id === sub.id)
          : results?.find(r => r.item_id === sub.id);
        return (
          <tr key={sub.id}>
            <td className="subcriterion">
              {sub.item_number}. {sub.description}
              {sub.instruction && <div style={{ fontSize: '8pt', fontStyle: 'italic' }}>({sub.instruction})</div>}
            </td>
            <td className="marks-column">{sub.max_marks}</td>
            <td className="obtained-column">{subResult ? (parseFloat(subResult.marks_obtained) || 0) : 0}</td>
            <td className="comments-column">{subResult?.comments || ''}</td>
          </tr>
        );
      })}
    </React.Fragment>
  );
}
`,
  },
  {
    path: 'tvet-eassess/components/AssessmentBuilder.js',
    language: 'javascript',
    category: 'Components',
    content: `import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import TaskEditor from './TaskEditor';
import ChecklistEditor from './ChecklistEditor';

export default function AssessmentBuilder({ assessmentId, onAssessmentUpdate }) {
  const [assessment, setAssessment] = useState({
    title: '',
    assessment_number: 1,
    assessment_type: 'PRACTICAL',
    department_name: 'ELECTRICAL & ELECTRONICS ENGINEERING',
    course_title: 'ELECTRICAL INSTALLATION',
    level: 'LEVEL 4, 5 & 6',
    unit_code: 'ENG/CU/EI/CR/03/5/MA',
    unit_name: 'Install Security System',
    assessment_date: new Date().toISOString().split('T')[0],
    duration_minutes: 180,
    academic_year: '2026',
    term: 'Term 1'
  });

  const [tasks, setTasks] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [activeTab, setActiveTab] = useState('details');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (assessmentId) {
      loadAssessment();
    }
  }, [assessmentId]);

  const loadAssessment = async () => {
    const { data, error } = await supabase
      .from('assessments')
      .select('*, assessment_tasks(*, assessment_items(*)), observation_checklists(*, checklist_criteria(*))')
      .eq('id', assessmentId)
      .single();

    if (error || !data) return;

    setAssessment({
      title: data.title,
      assessment_number: data.assessment_number,
      assessment_type: data.assessment_type,
      department_name: data.department_name || '',
      course_title: data.course_title || '',
      level: data.level || '',
      unit_code: data.unit_code || '',
      unit_name: data.unit_name || '',
      assessment_date: data.assessment_date,
      duration_minutes: data.duration_minutes,
      academic_year: data.academic_year,
      term: data.term
    });

    setTasks((data.assessment_tasks || []).sort((a, b) => a.sort_order - b.sort_order).map(t => ({ ...t, items: t.assessment_items || [] })));
    setChecklists((data.observation_checklists || []).sort((a, b) => a.sort_order - b.sort_order).map(c => ({ ...c, criteria: c.checklist_criteria || [] })));
  };

  const saveAssessment = async () => {
    setSaving(true);
    setMessage('');
    try {
      let targetId = assessmentId;
      const assessmentData = { ...assessment, updated_at: new Date().toISOString() };

      if (targetId) {
        const { error } = await supabase.from('assessments').update(assessmentData).eq('id', targetId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('assessments').insert([assessmentData]).select().single();
        if (error) throw error;
        targetId = data.id;
        onAssessmentUpdate?.(targetId);
      }

      await saveTasks(targetId);
      await saveChecklists(targetId);
      setMessage('Assessment saved successfully!');
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const saveTasks = async (targetId) => {
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const { data: savedTask, error } = await supabase
        .from('assessment_tasks')
        .upsert({
          id: task.id,
          assessment_id: targetId,
          task_number: task.task_number || i + 1,
          task_title: task.task_title || '',
          sort_order: i
        })
        .select()
        .single();
      if (error) throw error;

      for (let j = 0; j < (task.items || []).length; j++) {
        const item = task.items[j];
        await supabase.from('assessment_items').upsert({
          id: item.id,
          task_id: savedTask.id,
          item_number: item.item_number || \`\${j + 1}\`,
          description: item.description,
          max_marks: item.max_marks,
          is_subcriterion: item.is_subcriterion || false,
          parent_item_id: item.parent_item_id || null,
          sort_order: j,
          instruction: item.instruction || null
        });
      }
    }
  };

  const saveChecklists = async (targetId) => {
    for (let i = 0; i < checklists.length; i++) {
      const cl = checklists[i];
      const { data: savedCl, error } = await supabase
        .from('observation_checklists')
        .upsert({
          id: cl.id,
          assessment_id: targetId,
          title: cl.title || 'OBSERVATION CHECKLIST',
          instruction: cl.instruction || null,
          sort_order: i
        })
        .select()
        .single();
      if (error) throw error;

      for (let j = 0; j < (cl.criteria || []).length; j++) {
        const c = cl.criteria[j];
        await supabase.from('checklist_criteria').upsert({
          id: c.id,
          checklist_id: savedCl.id,
          item_number: c.item_number || \`\${j + 1}\`,
          description: c.description,
          max_marks: c.max_marks,
          is_subitem: c.is_subitem || false,
          parent_criteria_id: c.parent_criteria_id || null,
          sort_order: j,
          performance_indicator: c.performance_indicator || null,
          competency_standard: c.competency_standard || null
        });
      }
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3><i className="bi bi-file-earmark-text"></i> Assessment Builder</h3>
        <div>
          <button className="btn btn-success me-2" onClick={saveAssessment} disabled={saving}>
            <i className="bi bi-save"></i> {saving ? 'Saving...' : 'Save Assessment'}
          </button>
          <button className="btn btn-outline-secondary" onClick={() => window.print()}>
            <i className="bi bi-printer"></i> Print Preview
          </button>
        </div>
      </div>

      {message && (
        <div className={\`alert \${message.includes('Error') ? 'alert-danger' : 'alert-success'}\`}>{message}</div>
      )}

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={\`nav-link \${activeTab === 'details' ? 'active' : ''}\`} onClick={() => setActiveTab('details')}>
            Assessment Details
          </button>
        </li>
        <li className="nav-item">
          <button className={\`nav-link \${activeTab === 'tasks' ? 'active' : ''}\`} onClick={() => setActiveTab('tasks')}>
            Tasks & Criteria
          </button>
        </li>
        <li className="nav-item">
          <button className={\`nav-link \${activeTab === 'checklist' ? 'active' : ''}\`} onClick={() => setActiveTab('checklist')}>
            Observation Checklist
          </button>
        </li>
      </ul>

      {activeTab === 'details' && (
        <div className="card">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Department Name</label>
                <input type="text" className="form-control" value={assessment.department_name}
                  onChange={(e) => setAssessment({ ...assessment, department_name: e.target.value })} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Course Title</label>
                <input type="text" className="form-control" value={assessment.course_title}
                  onChange={(e) => setAssessment({ ...assessment, course_title: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Level</label>
                <input type="text" className="form-control" value={assessment.level}
                  onChange={(e) => setAssessment({ ...assessment, level: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Unit Code</label>
                <input type="text" className="form-control" value={assessment.unit_code}
                  onChange={(e) => setAssessment({ ...assessment, unit_code: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Unit Name</label>
                <input type="text" className="form-control" value={assessment.unit_name}
                  onChange={(e) => setAssessment({ ...assessment, unit_name: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Assessment Title</label>
                <input type="text" className="form-control" value={assessment.title}
                  onChange={(e) => setAssessment({ ...assessment, title: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Assessment Number</label>
                <input type="number" className="form-control" value={assessment.assessment_number}
                  onChange={(e) => setAssessment({ ...assessment, assessment_number: parseInt(e.target.value, 10) || 1 })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Assessment Type</label>
                <select className="form-select" value={assessment.assessment_type}
                  onChange={(e) => setAssessment({ ...assessment, assessment_type: e.target.value })}>
                  <option value="PRACTICAL">PRACTICAL</option>
                  <option value="THEORY">THEORY</option>
                  <option value="ORAL">ORAL</option>
                  <option value="PROJECT">PROJECT</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <TaskEditor tasks={tasks} setTasks={setTasks} createId={uuidv4} />
      )}

      {activeTab === 'checklist' && (
        <ChecklistEditor checklists={checklists} setChecklists={setChecklists} createId={uuidv4} />
      )}
    </div>
  );
}
`,
  },
  {
    path: 'tvet-eassess/components/DigitalAssessment.js',
    language: 'javascript',
    category: 'Components',
    content: `import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { validateMarks, calculatePercentage, determineCompetency } from '../lib/calculations';

export default function DigitalAssessment({ sessionId, assessmentId, onComplete }) {
  const [session, setSession] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [results, setResults] = useState({});
  const [checklistResults, setChecklistResults] = useState({});
  const [feedback, setFeedback] = useState({ from_candidate: '', to_candidate: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (sessionId) loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    const { data: sessionData, error } = await supabase
      .from('assessment_sessions')
      .select('*, trainees(*), assessments(*)')
      .eq('id', sessionId)
      .single();

    if (error) {
      setMessage('Error loading session: ' + error.message);
      return;
    }
    setSession(sessionData);

    const [{ data: tasksData }, { data: checklistsData }, { data: resultsData }, { data: clResultsData }, { data: fbData }] =
      await Promise.all([
        supabase.from('assessment_tasks').select('*, assessment_items(*)').eq('assessment_id', assessmentId).order('sort_order'),
        supabase.from('observation_checklists').select('*, checklist_criteria(*)').eq('assessment_id', assessmentId).order('sort_order'),
        supabase.from('criterion_results').select('*').eq('session_id', sessionId),
        supabase.from('checklist_results').select('*').eq('session_id', sessionId),
        supabase.from('assessment_feedback').select('*').eq('session_id', sessionId).single(),
      ]);

    if (tasksData) setTasks(tasksData);
    if (checklistsData) setChecklists(checklistsData);
    if (resultsData) {
      const map = {};
      resultsData.forEach(r => { map[r.item_id] = r; });
      setResults(map);
    }
    if (clResultsData) {
      const map = {};
      clResultsData.forEach(r => { map[r.criteria_id] = r; });
      setChecklistResults(map);
    }
    if (fbData) {
      setFeedback({
        from_candidate: fbData.feedback_from_candidate || '',
        to_candidate: fbData.feedback_to_candidate || ''
      });
    }
  };

  const handleMarkChange = async (itemId, value, maxMarks) => {
    const validation = validateMarks(value, maxMarks);
    if (!validation.valid) {
      setMessage(validation.error);
      return;
    }
    setResults(prev => ({ ...prev, [itemId]: { ...(prev[itemId] || {}), item_id: itemId, marks_obtained: validation.value } }));
    await supabase.from('criterion_results').upsert({
      session_id: sessionId,
      item_id: itemId,
      marks_obtained: validation.value,
      updated_at: new Date().toISOString()
    }, { onConflict: 'session_id,item_id' });
  };

  const calculateTotals = () => {
    const taskSubtotals = tasks.map(task => {
      let subtotal = 0;
      let maxSubtotal = 0;
      (task.assessment_items || []).forEach(item => {
        if (!item.is_subcriterion) {
          maxSubtotal += parseFloat(item.max_marks) || 0;
          subtotal += parseFloat(results[item.id]?.marks_obtained) || 0;
        }
      });
      return { taskNumber: task.task_number, subtotal, maxSubtotal };
    });

    let checklistSubtotal = 0;
    let checklistMax = 0;
    checklists.forEach(cl => {
      (cl.checklist_criteria || []).forEach(c => {
        if (!c.is_subitem) {
          checklistMax += parseFloat(c.max_marks) || 0;
          checklistSubtotal += parseFloat(checklistResults[c.id]?.marks_obtained) || 0;
        }
      });
    });

    const grandTotalAvailable = taskSubtotals.reduce((s, t) => s + t.maxSubtotal, 0) + checklistMax;
    const grandTotalObtained = taskSubtotals.reduce((s, t) => s + t.subtotal, 0) + checklistSubtotal;
    const percentage = calculatePercentage(grandTotalObtained, grandTotalAvailable);
    const outcome = determineCompetency(percentage);

    return { taskSubtotals, grandTotalAvailable, grandTotalObtained, percentage, outcome };
  };

  const saveProgress = async () => {
    setSaving(true);
    const totals = calculateTotals();
    await supabase.from('assessment_sessions').update({
      grand_total_available: totals.grandTotalAvailable,
      grand_total_obtained: totals.grandTotalObtained,
      percentage: totals.percentage,
      competency_outcome: totals.outcome,
      updated_at: new Date().toISOString()
    }).eq('id', sessionId);

    await supabase.from('assessment_feedback').upsert({
      session_id: sessionId,
      feedback_from_candidate: feedback.from_candidate,
      feedback_to_candidate: feedback.to_candidate,
      updated_at: new Date().toISOString()
    }, { onConflict: 'session_id' });

    setSaving(false);
    setMessage('Progress saved successfully!');
  };

  const submitAssessment = async () => {
    await saveProgress();
    await supabase.from('assessment_sessions').update({ status: 'submitted', updated_at: new Date().toISOString() }).eq('id', sessionId);
    onComplete?.();
  };

  const totals = calculateTotals();
  if (!session) return <div className="p-5 text-center">Loading assessment...</div>;

  return (
    <div className="digital-assessment">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3>Digital Assessment</h3>
          <p className="text-muted mb-0">
            {session.assessments?.title} — {session.trainees?.full_name} ({session.trainees?.admission_number})
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary" onClick={saveProgress} disabled={saving}>Save Progress</button>
          <button className="btn btn-success" onClick={submitAssessment} disabled={session.status !== 'in_progress'}>Submit</button>
        </div>
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      {tasks.map(task => (
        <div key={task.id} className="card mb-4">
          <div className="card-header bg-dark text-white">
            TASK {task.task_number} {task.task_title ? \`- \${task.task_title}\` : ''}
          </div>
          <div className="card-body p-0">
            <table className="table table-bordered mb-0">
              <thead>
                <tr>
                  <th>Criterion</th>
                  <th>Max</th>
                  <th>Obtained</th>
                </tr>
              </thead>
              <tbody>
                {(task.assessment_items || []).map(item => (
                  <tr key={item.id}>
                    <td>{item.item_number}. {item.description}</td>
                    <td>{item.max_marks}</td>
                    <td>
                      <input type="number" className="form-control form-control-sm marks-input"
                        value={results[item.id]?.marks_obtained || 0}
                        onChange={(e) => handleMarkChange(item.id, e.target.value, item.max_marks)}
                        min="0" max={item.max_marks} step="0.5" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="alert alert-secondary">
        Total: {totals.grandTotalObtained} / {totals.grandTotalAvailable} ({totals.percentage.toFixed(2)}%) — {totals.outcome}
      </div>
    </div>
  );
}
`,
  },
  {
    path: 'tvet-eassess/components/LivePreview.js',
    language: 'javascript',
    category: 'Components',
    content: `import React from 'react';
import AssessmentPaper from './AssessmentPaper';

export default function LivePreview({ assessment, tasks, checklists, institution }) {
  if (!assessment) {
    return (
      <div className="text-center text-muted p-5">
        <i className="bi bi-file-earmark" style={{ fontSize: '48px' }}></i>
        <p className="mt-2">Start building your assessment to see the live 3-page A4 preview.</p>
      </div>
    );
  }

  const inst = institution || { name: 'THIKA TECHNICAL TRAINING INSTITUTE', competency_threshold: 50 };

  return (
    <div>
      <h5 className="mb-3"><i className="bi bi-eye"></i> Live Preview</h5>
      <AssessmentPaper assessment={assessment} tasks={tasks} checklists={checklists} results={[]} checklistResults={[]} institution={inst} pageNumber={1} totalPages={3} />
      <AssessmentPaper assessment={assessment} tasks={tasks} checklists={checklists} results={[]} checklistResults={[]} institution={inst} pageNumber={2} totalPages={3} />
      <AssessmentPaper assessment={assessment} tasks={tasks} checklists={checklists} results={[]} checklistResults={[]} institution={inst} pageNumber={3} totalPages={3} />
    </div>
  );
}
`,
  },
  {
    path: 'tvet-eassess/components/TaskEditor.js',
    language: 'javascript',
    category: 'Components',
    content: `import React from 'react';
import CriteriaEditor from './CriteriaEditor';

export default function TaskEditor({ tasks, setTasks, createId }) {
  const addTask = () => {
    setTasks([
      ...tasks,
      {
        id: createId(),
        task_number: tasks.length + 1,
        task_title: \`TASK \${tasks.length + 1}\`,
        items: []
      }
    ]);
  };

  const removeTask = (idx) => {
    setTasks(tasks.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="d-flex justify-content-between mb-3">
        <h5>Assessment Tasks</h5>
        <button className="btn btn-primary btn-sm" onClick={addTask}>
          <i className="bi bi-plus-circle"></i> Add Task
        </button>
      </div>

      {tasks.map((task, taskIdx) => (
        <div key={task.id} className="card mb-3">
          <div className="card-header d-flex justify-content-between align-items-center bg-light">
            <div className="d-flex align-items-center gap-2">
              <strong>TASK {task.task_number}</strong>
              <input
                type="text"
                className="form-control form-control-sm"
                style={{ width: '300px' }}
                value={task.task_title || ''}
                onChange={(e) => {
                  const next = [...tasks];
                  next[taskIdx] = { ...task, task_title: e.target.value };
                  setTasks(next);
                }}
                placeholder="Task title"
              />
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => removeTask(taskIdx)}>
              <i className="bi bi-trash"></i>
            </button>
          </div>
          <div className="card-body">
            <CriteriaEditor
              items={task.items || []}
              onChange={(items) => {
                const next = [...tasks];
                next[taskIdx] = { ...task, items };
                setTasks(next);
              }}
              createId={createId}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
`,
  },
  {
    path: 'tvet-eassess/components/CriteriaEditor.js',
    language: 'javascript',
    category: 'Components',
    content: `import React from 'react';

export default function CriteriaEditor({ items, onChange, createId }) {
  const addItem = (isSub = false, parentId = null) => {
    onChange([
      ...items,
      {
        id: createId(),
        item_number: \`\${items.length + 1}\`,
        description: '',
        max_marks: isSub ? 0 : 1,
        is_subcriterion: isSub,
        parent_item_id: parentId,
        instruction: ''
      }
    ]);
  };

  const updateItem = (idx, field, value) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };

  const removeItem = (idx) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <table className="table table-sm table-bordered">
        <thead>
          <tr>
            <th style={{ width: '8%' }}>#</th>
            <th style={{ width: '47%' }}>Description</th>
            <th style={{ width: '12%' }}>Max Marks</th>
            <th style={{ width: '20%' }}>Instruction</th>
            <th style={{ width: '8%' }}>Sub?</th>
            <th style={{ width: '5%' }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id} className={item.is_subcriterion ? 'table-secondary' : ''}>
              <td>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={item.item_number}
                  onChange={(e) => updateItem(idx, 'item_number', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={item.description}
                  onChange={(e) => updateItem(idx, 'description', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={item.max_marks}
                  onChange={(e) => updateItem(idx, 'max_marks', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.5"
                />
              </td>
              <td>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={item.instruction || ''}
                  onChange={(e) => updateItem(idx, 'instruction', e.target.value)}
                />
              </td>
              <td className="text-center">
                <input
                  type="checkbox"
                  checked={item.is_subcriterion || false}
                  onChange={(e) => updateItem(idx, 'is_subcriterion', e.target.checked)}
                />
              </td>
              <td>
                <button className="btn btn-outline-danger btn-sm" onClick={() => removeItem(idx)}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="d-flex gap-2">
        <button className="btn btn-outline-primary btn-sm" onClick={() => addItem(false, null)}>Add Criterion</button>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => addItem(true, items[items.length - 1]?.id || null)}
        >
          Add Sub-criterion
        </button>
      </div>
    </div>
  );
}
`,
  },
  {
    path: 'tvet-eassess/components/ChecklistEditor.js',
    language: 'javascript',
    category: 'Components',
    content: `import React from 'react';

export default function ChecklistEditor({ checklists, setChecklists, createId }) {
  const addChecklist = () => {
    setChecklists([
      ...checklists,
      {
        id: createId(),
        title: 'OBSERVATION CHECKLIST',
        instruction: 'Items to be Evaluated: Please award marks as appropriate.',
        criteria: []
      }
    ]);
  };

  const addCriterion = (clIdx, isSub = false) => {
    const next = [...checklists];
    const cl = next[clIdx];
    const criteria = cl.criteria || [];
    const parentId = isSub ? criteria[criteria.length - 1]?.id || null : null;
    next[clIdx] = {
      ...cl,
      criteria: [
        ...criteria,
        {
          id: createId(),
          item_number: \`\${criteria.length + 1}\`,
          description: '',
          max_marks: isSub ? 0 : 1,
          is_subitem: isSub,
          parent_criteria_id: parentId,
          performance_indicator: ''
        }
      ]
    };
    setChecklists(next);
  };

  const updateCriterion = (clIdx, cIdx, field, value) => {
    const next = [...checklists];
    const criteria = [...(next[clIdx].criteria || [])];
    criteria[cIdx] = { ...criteria[cIdx], [field]: value };
    next[clIdx] = { ...next[clIdx], criteria };
    setChecklists(next);
  };

  const removeCriterion = (clIdx, cIdx) => {
    const next = [...checklists];
    next[clIdx] = {
      ...next[clIdx],
      criteria: (next[clIdx].criteria || []).filter((_, i) => i !== cIdx)
    };
    setChecklists(next);
  };

  return (
    <div>
      <div className="d-flex justify-content-between mb-3">
        <h5>Observation Checklists</h5>
        <button className="btn btn-primary btn-sm" onClick={addChecklist}>Add Checklist</button>
      </div>

      {checklists.map((cl, clIdx) => (
        <div key={cl.id} className="card mb-3">
          <div className="card-header bg-light">
            <input
              type="text"
              className="form-control form-control-sm fw-bold"
              value={cl.title}
              onChange={(e) => {
                const next = [...checklists];
                next[clIdx] = { ...cl, title: e.target.value };
                setChecklists(next);
              }}
            />
          </div>
          <div className="card-body">
            <table className="table table-sm table-bordered">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Description</th>
                  <th>Max Marks</th>
                  <th>Performance Indicator</th>
                  <th>Sub?</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(cl.criteria || []).map((c, cIdx) => (
                  <tr key={c.id} className={c.is_subitem ? 'table-secondary' : ''}>
                    <td>{c.item_number}</td>
                    <td>
                      <input type="text" className="form-control form-control-sm" value={c.description}
                        onChange={(e) => updateCriterion(clIdx, cIdx, 'description', e.target.value)} />
                    </td>
                    <td>
                      <input type="number" className="form-control form-control-sm" value={c.max_marks}
                        onChange={(e) => updateCriterion(clIdx, cIdx, 'max_marks', parseFloat(e.target.value) || 0)} min="0" step="0.5" />
                    </td>
                    <td>
                      <input type="text" className="form-control form-control-sm" value={c.performance_indicator || ''}
                        onChange={(e) => updateCriterion(clIdx, cIdx, 'performance_indicator', e.target.value)} />
                    </td>
                    <td>
                      <input type="checkbox" checked={c.is_subitem || false}
                        onChange={(e) => updateCriterion(clIdx, cIdx, 'is_subitem', e.target.checked)} />
                    </td>
                    <td>
                      <button className="btn btn-outline-danger btn-sm" onClick={() => removeCriterion(clIdx, cIdx)}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-primary btn-sm" onClick={() => addCriterion(clIdx, false)}>Add Item</button>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => addCriterion(clIdx, true)}>Add Sub-item</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
`,
  },
  {
    path: 'tvet-eassess/components/ui/Button.js',
    language: 'javascript',
    category: 'Components',
    content: `import React from 'react';

export default function Button({ variant = 'primary', size = 'md', children, className = '', ...props }) {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  return (
    <button className={\`btn btn-\${variant} \${sizeClass} \${className}\`} {...props}>
      {children}
    </button>
  );
}
`,
  },
  {
    path: 'tvet-eassess/components/ui/Modal.js',
    language: 'javascript',
    category: 'Components',
    content: `import React from 'react';

export default function Modal({ isOpen, title, onClose, children, footer }) {
  if (!isOpen) return null;
  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">{children}</div>
          {footer && <div className="modal-footer">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
`,
  },
  {
    path: 'tvet-eassess/components/ui/Toast.js',
    language: 'javascript',
    category: 'Components',
    content: `import React from 'react';

export default function Toast({ message, type = 'success', onDismiss }) {
  if (!message) return null;
  return (
    <div className={\`alert alert-\${type} alert-dismissible fade show\`} role="alert">
      {message}
      {onDismiss && <button type="button" className="btn-close" onClick={onDismiss}></button>}
    </div>
  );
}
`,
  },
];
