'use client';

import { useState, useEffect } from 'react';
import { generateAssessmentPDF } from '@/lib/pdfGenerator';

export default function ExecuteAssessment() {
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [checklistResults, setChecklistResults] = useState({});
  const [criterionResults, setCriterionResults] = useState({});
  const [candidateFeedback, setCandidateFeedback] = useState('');
  const [assessorFeedback, setAssessorFeedback] = useState('');
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);

  // Sample assessment data - In production, this would come from the database
  const [assessmentData] = useState({
    institution: {
      name: 'THIKA TECHNICAL TRAINING INSTITUTE',
      logo_url: null
    },
    department: {
      name: 'ELECTRICAL & ELECTRONICS ENGINEERING'
    },
    course: {
      name: 'ELECTRICAL INSTALLATION',
      level: 'LEVEL 4, 5 & 6'
    },
    unit: {
      code: 'ENG/CU/EI/CR/03/5/MA',
      name: 'Install Security System'
    },
    assessment: {
      assessment_type: 'PRACTICAL ASSESSMENT',
      assessment_number: '1',
      title: 'Install Security System',
      instructions: 'Items to be Evaluated: Please award marks as appropriate. Give a brief comment on your observation.'
    },
    checklistCriteria: [
      {
        id: 'checklist-1',
        item_number: '1',
        description: 'Observed safety awareness',
        max_marks: 5,
        children: [
          { id: 'checklist-1a', item_number: '(a)', description: 'Housekeeping and waste disposal', max_marks: 1 },
          { id: 'checklist-1b', item_number: '(b)', description: 'Safety boots', max_marks: 1 },
          { id: 'checklist-1c', item_number: '(c)', description: 'Apron', max_marks: 1 },
          { id: 'checklist-1d', item_number: '(d)', description: 'Handling of tools', max_marks: 1 },
          { id: 'checklist-1e', item_number: '(e)', description: 'Handling of equipment', max_marks: 1 }
        ]
      }
    ],
    tasks: [
      {
        id: 'task-1',
        task_number: 1,
        title: 'TASK 1',
        items: [
          { id: 'item-1', item_number: '1', description: 'Fixed components firmly and level', max_marks: 3 },
          {
            id: 'item-2',
            item_number: '2',
            description: 'Terminated cables at the specified components',
            max_marks: 8,
            children: [
              { id: 'item-2a', item_number: '(a)', description: 'Proper termination of BNC connectors', max_marks: 2 },
              { id: 'item-2b', item_number: '(b)', description: 'Power supply', max_marks: 2 },
              { id: 'item-2c', item_number: '(c)', description: 'DVR/Award maximum marks', max_marks: 2 },
              { id: 'item-2d', item_number: '(d)', description: 'Dome cameras', max_marks: 1 },
              { id: 'item-2e', item_number: '(e)', description: 'Bullet Camera', max_marks: 1 }
            ]
          },
          { id: 'item-3', item_number: '3', description: 'Clipped cables uniformly', max_marks: 2 }
        ]
      }
    ],
    trainee: {
      first_name: 'John',
      last_name: 'Doe',
      admission_number: 'T2024/001'
    },
    config: {
      competency_threshold: 50
    }
  });

  // Calculate checklist total
  const calculateChecklistTotal = () => {
    let obtained = 0;
    let available = 0;

    assessmentData.checklistCriteria.forEach(criterion => {
      if (criterion.children) {
        criterion.children.forEach(child => {
          available += child.max_marks;
          obtained += checklistResults[child.id]?.marks_obtained || 0;
        });
      } else {
        available += criterion.max_marks;
        obtained += checklistResults[criterion.id]?.marks_obtained || 0;
      }
    });

    return { obtained, available };
  };

  // Calculate task total
  const calculateTaskTotal = (task) => {
    let obtained = 0;
    let available = 0;

    task.items.forEach(item => {
      if (item.children) {
        item.children.forEach(child => {
          available += child.max_marks;
          obtained += criterionResults[child.id]?.marks_obtained || 0;
        });
      } else {
        available += item.max_marks;
        obtained += criterionResults[item.id]?.marks_obtained || 0;
      }
    });

    return { obtained, available };
  };

  // Calculate grand total
  const calculateGrandTotal = () => {
    const checklistTotal = calculateChecklistTotal();
    let tasksObtained = checklistTotal.obtained;
    let tasksAvailable = checklistTotal.available;

    assessmentData.tasks.forEach(task => {
      const taskTotal = calculateTaskTotal(task);
      tasksObtained += taskTotal.obtained;
      tasksAvailable += taskTotal.available;
    });

    const percentage = tasksAvailable > 0 ? (tasksObtained / tasksAvailable) * 100 : 0;
    const outcome = percentage >= assessmentData.config.competency_threshold ? 'Competent' : 'Not Yet Competent';

    return {
      obtained: tasksObtained,
      available: tasksAvailable,
      percentage: percentage.toFixed(1),
      outcome
    };
  };

  // Update checklist result
  const updateChecklistResult = (criterionId, field, value) => {
    setChecklistResults(prev => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        [field]: field === 'marks_obtained' ? parseFloat(value) || 0 : value
      }
    }));
  };

  // Update criterion result
  const updateCriterionResult = (itemId, field, value) => {
    setCriterionResults(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: field === 'marks_obtained' ? parseFloat(value) || 0 : value
      }
    }));
  };

  // Generate PDF
  const handleGeneratePDF = async () => {
    const totals = calculateGrandTotal();
    
    const pdfData = {
      ...assessmentData,
      session: {
        assessment_date: assessmentDate,
        total_marks_obtained: totals.obtained,
        total_marks_available: totals.available,
        percentage: parseFloat(totals.percentage),
        outcome: totals.outcome,
        candidate_feedback: candidateFeedback,
        assessor_feedback: assessorFeedback,
        candidate_signature_date: assessmentDate,
        assessor_signature_date: assessmentDate
      },
      checklistResults: Object.entries(checklistResults).map(([criterion_id, result]) => ({
        criterion_id,
        ...result
      })),
      criterionResults: Object.entries(criterionResults).map(([item_id, result]) => ({
        item_id,
        ...result
      }))
    };

    try {
      const pdfGenerator = await generateAssessmentPDF(pdfData);
      pdfGenerator.save(`Assessment_${assessmentData.trainee.admission_number}_${Date.now()}.pdf`);
      alert('PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please check console for details.');
    }
  };

  const totals = calculateGrandTotal();

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">
                <i className="bi bi-clipboard-check me-2"></i>
                Conduct Practical Assessment
              </h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h5>{assessmentData.assessment.assessment_type} {assessmentData.assessment.assessment_number}</h5>
                  <p className="mb-1"><strong>Unit:</strong> {assessmentData.unit.name}</p>
                  <p className="mb-1"><strong>Unit Code:</strong> {assessmentData.unit.code}</p>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label"><strong>Assessment Date</strong></label>
                    <input
                      type="date"
                      className="form-control"
                      value={assessmentDate}
                      onChange={(e) => setAssessmentDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trainee Information */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">Trainee Information</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4">
                  <p className="mb-1"><strong>Name:</strong> {assessmentData.trainee.first_name} {assessmentData.trainee.last_name}</p>
                </div>
                <div className="col-md-4">
                  <p className="mb-1"><strong>Admission Number:</strong> {assessmentData.trainee.admission_number}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Observation Checklist */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">Observation Checklist</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '50%' }}>Item to be Evaluated</th>
                      <th style={{ width: '12%' }} className="text-center">Marks Available</th>
                      <th style={{ width: '12%' }} className="text-center">Marks Obtained</th>
                      <th style={{ width: '26%' }}>Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessmentData.checklistCriteria.map((criterion) => (
                      <>
                        <tr key={criterion.id}>
                          <td><strong>{criterion.item_number}. {criterion.description}</strong></td>
                          <td className="text-center">{criterion.children ? '' : criterion.max_marks}</td>
                          <td className="text-center">
                            {!criterion.children && (
                              <input
                                type="number"
                                className="form-control form-control-sm marks-input"
                                min="0"
                                max={criterion.max_marks}
                                value={checklistResults[criterion.id]?.marks_obtained || ''}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value);
                                  if (value <= criterion.max_marks) {
                                    updateChecklistResult(criterion.id, 'marks_obtained', e.target.value);
                                  }
                                }}
                              />
                            )}
                          </td>
                          <td>
                            {!criterion.children && (
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={checklistResults[criterion.id]?.comments || ''}
                                onChange={(e) => updateChecklistResult(criterion.id, 'comments', e.target.value)}
                              />
                            )}
                          </td>
                        </tr>
                        {criterion.children && criterion.children.map((child) => (
                          <tr key={child.id}>
                            <td className="ps-5">{child.item_number} {child.description}</td>
                            <td className="text-center">{child.max_marks}</td>
                            <td className="text-center">
                              <input
                                type="number"
                                className="form-control form-control-sm marks-input"
                                min="0"
                                max={child.max_marks}
                                value={checklistResults[child.id]?.marks_obtained || ''}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value);
                                  if (value <= child.max_marks) {
                                    updateChecklistResult(child.id, 'marks_obtained', e.target.value);
                                  }
                                }}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={checklistResults[child.id]?.comments || ''}
                                onChange={(e) => updateChecklistResult(child.id, 'comments', e.target.value)}
                              />
                            </td>
                          </tr>
                        ))}
                      </>
                    ))}
                    <tr className="table-secondary">
                      <td><strong>Sub-Total 1</strong></td>
                      <td className="text-center"><strong>{calculateChecklistTotal().available}</strong></td>
                      <td className="text-center"><strong>{calculateChecklistTotal().obtained}</strong></td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Tasks */}
      {assessmentData.tasks.map((task, taskIndex) => {
        const taskTotal = calculateTaskTotal(task);
        return (
          <div key={task.id} className="row mb-4">
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-header bg-warning">
                  <h5 className="mb-0">Task {task.task_number}</h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: '50%' }}>Assessment Criterion</th>
                          <th style={{ width: '12%' }} className="text-center">Marks Available</th>
                          <th style={{ width: '12%' }} className="text-center">Marks Obtained</th>
                          <th style={{ width: '26%' }}>Comments</th>
                        </tr>
                      </thead>
                      <tbody>
                        {task.items.map((item) => (
                          <>
                            <tr key={item.id}>
                              <td><strong>{item.item_number}. {item.description}</strong></td>
                              <td className="text-center">{item.children ? '' : item.max_marks}</td>
                              <td className="text-center">
                                {!item.children && (
                                  <input
                                    type="number"
                                    className="form-control form-control-sm marks-input"
                                    min="0"
                                    max={item.max_marks}
                                    value={criterionResults[item.id]?.marks_obtained || ''}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value);
                                      if (value <= item.max_marks) {
                                        updateCriterionResult(item.id, 'marks_obtained', e.target.value);
                                      }
                                    }}
                                  />
                                )}
                              </td>
                              <td>
                                {!item.children && (
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={criterionResults[item.id]?.comments || ''}
                                    onChange={(e) => updateCriterionResult(item.id, 'comments', e.target.value)}
                                  />
                                )}
                              </td>
                            </tr>
                            {item.children && item.children.map((child) => (
                              <tr key={child.id}>
                                <td className="ps-5">{child.item_number} {child.description}</td>
                                <td className="text-center">{child.max_marks}</td>
                                <td className="text-center">
                                  <input
                                    type="number"
                                    className="form-control form-control-sm marks-input"
                                    min="0"
                                    max={child.max_marks}
                                    value={criterionResults[child.id]?.marks_obtained || ''}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value);
                                      if (value <= child.max_marks) {
                                        updateCriterionResult(child.id, 'marks_obtained', e.target.value);
                                      }
                                    }}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={criterionResults[child.id]?.comments || ''}
                                    onChange={(e) => updateCriterionResult(child.id, 'comments', e.target.value)}
                                  />
                                </td>
                              </tr>
                            ))}
                          </>
                        ))}
                        <tr className="table-secondary">
                          <td><strong>Sub-Total {taskIndex + 2}</strong></td>
                          <td className="text-center"><strong>{taskTotal.available}</strong></td>
                          <td className="text-center"><strong>{taskTotal.obtained}</strong></td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Grand Total and Outcome */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm border-primary">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Assessment Summary</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <h4>Grand Total: {totals.obtained} / {totals.available}</h4>
                  <h4>Percentage: {totals.percentage}%</h4>
                </div>
                <div className="col-md-6">
                  <div className={`alert ${totals.outcome === 'Competent' ? 'alert-success' : 'alert-warning'} mb-0`}>
                    <h5 className="mb-0">
                      <i className={`bi ${totals.outcome === 'Competent' ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-2`}></i>
                      {totals.outcome}
                    </h5>
                    <small>Threshold: {assessmentData.config.competency_threshold}%</small>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label"><strong>Feedback from Candidate</strong></label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={candidateFeedback}
                    onChange={(e) => setCandidateFeedback(e.target.value)}
                    placeholder="Enter candidate's feedback..."
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label"><strong>Feedback to Candidate</strong></label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={assessorFeedback}
                    onChange={(e) => setAssessorFeedback(e.target.value)}
                    placeholder="Enter assessor's feedback..."
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button className="btn btn-secondary">
                  <i className="bi bi-save me-2"></i>
                  Save Draft
                </button>
                <button className="btn btn-primary" onClick={handleGeneratePDF}>
                  <i className="bi bi-file-pdf me-2"></i>
                  Generate PDF
                </button>
                <button className="btn btn-success">
                  <i className="bi bi-check-circle me-2"></i>
                  Submit for Verification
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
