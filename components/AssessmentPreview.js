'use client';

export default function AssessmentPreview({ assessmentData }) {
  // Calculate totals
  const calculateChecklistTotal = () => {
    return assessmentData.checklistCriteria.reduce((total, criterion) => {
      let criterionTotal = criterion.max_marks;
      if (criterion.children) {
        criterionTotal = criterion.children.reduce((sum, child) => sum + child.max_marks, 0);
      }
      return total + criterionTotal;
    }, 0);
  };

  const calculateTaskTotal = (task) => {
    return task.items.reduce((total, item) => {
      let itemTotal = item.max_marks;
      if (item.children) {
        itemTotal = item.children.reduce((sum, child) => sum + child.max_marks, 0);
      }
      return total + itemTotal;
    }, 0);
  };

  const calculateGrandTotal = () => {
    const checklistTotal = calculateChecklistTotal();
    const tasksTotal = assessmentData.tasks.reduce((total, task) => total + calculateTaskTotal(task), 0);
    return checklistTotal + tasksTotal;
  };

  const checklistTotal = calculateChecklistTotal();
  const grandTotal = calculateGrandTotal();

  return (
    <div className="assessment-preview">
      {/* Institutional Header */}
      <div className="assessment-preview-header">
        {assessmentData.institution.logo_url && (
          <div className="text-center mb-3">
            <img src={assessmentData.institution.logo_url} alt="Institution Logo" style={{ maxHeight: '60px' }} />
          </div>
        )}
        
        <h1>{assessmentData.institution.name}</h1>
        <h2>{assessmentData.department.name}</h2>
        <h3>{assessmentData.course.name} {assessmentData.course.level}</h3>
        
        <p className="mb-1"><strong>Unit Code:</strong> {assessmentData.unit.code}</p>
        <p className="mb-1"><strong>{assessmentData.unit.name}</strong></p>
        
        <p className="mt-3 mb-0">
          <strong>{assessmentData.assessment.assessment_type} {assessmentData.assessment.assessment_number}</strong>
        </p>
      </div>

      {/* Candidate Information */}
      <div className="candidate-info">
        <div className="row mb-2">
          <div className="col-6">
            <strong>Candidate's Name:</strong> _________________________________
          </div>
        </div>
        <div className="row mb-2">
          <div className="col-6">
            <strong>Candidate's Adm No:</strong> _________________________________
          </div>
        </div>
        <div className="row mb-2">
          <div className="col-6">
            <strong>Date of Assessment:</strong> _________________________________
          </div>
        </div>
      </div>

      {/* Observation Checklist Header */}
      <div className="observation-checklist-title">
        OBSERVATION CHECKLIST
      </div>

      <div className="checklist-instruction">
        {assessmentData.assessment.instructions}
      </div>

      {/* Observation Checklist Table */}
      <table className="assessment-table">
        <thead>
          <tr>
            <th className="item-column">Item to be Evaluated</th>
            <th className="marks-available-column">Marks Available</th>
            <th className="marks-obtained-column">Marks Obtained</th>
            <th className="comments-column">Comments</th>
          </tr>
        </thead>
        <tbody>
          {assessmentData.checklistCriteria.map((criterion, index) => (
            <>
              <tr key={criterion.id}>
                <td>
                  <strong>{criterion.item_number}. {criterion.description}</strong>
                </td>
                <td className="text-center">
                  {criterion.children && criterion.children.length > 0 ? '' : criterion.max_marks}
                </td>
                <td className="text-center"></td>
                <td></td>
              </tr>
              
              {/* Sub-criteria */}
              {criterion.children && criterion.children.map((subCriterion) => (
                <tr key={subCriterion.id}>
                  <td className="sub-item">
                    {subCriterion.item_number} {subCriterion.description}
                  </td>
                  <td className="text-center">{subCriterion.max_marks}</td>
                  <td className="text-center"></td>
                  <td></td>
                </tr>
              ))}
            </>
          ))}
          
          {/* Checklist Subtotal */}
          <tr className="subtotal-row">
            <td><strong>Sub-Total 1</strong></td>
            <td className="text-center"><strong>{checklistTotal}</strong></td>
            <td className="text-center"></td>
            <td></td>
          </tr>
        </tbody>
      </table>

      {/* Assessment Tasks */}
      {assessmentData.tasks.map((task, taskIndex) => (
        <div key={task.id} style={{ pageBreakInside: 'avoid' }}>
          <table className="assessment-table">
            <tbody>
              {/* Task Header */}
              <tr className="task-header">
                <td colSpan="4"><strong>TASK {task.task_number}</strong></td>
              </tr>
              
              {/* Task Items */}
              {task.items.map((item) => (
                <>
                  <tr key={item.id}>
                    <td>
                      <strong>{item.item_number}. {item.description}</strong>
                    </td>
                    <td className="text-center">
                      {item.children && item.children.length > 0 ? '' : item.max_marks}
                    </td>
                    <td className="text-center"></td>
                    <td></td>
                  </tr>
                  
                  {/* Sub-items */}
                  {item.children && item.children.map((subItem) => (
                    <tr key={subItem.id}>
                      <td className="sub-item">
                        {subItem.item_number} {subItem.description}
                      </td>
                      <td className="text-center">{subItem.max_marks}</td>
                      <td className="text-center"></td>
                      <td></td>
                    </tr>
                  ))}
                </>
              ))}
              
              {/* Task Subtotal */}
              <tr className="subtotal-row">
                <td><strong>Sub-Total {taskIndex + 2}</strong></td>
                <td className="text-center"><strong>{calculateTaskTotal(task)}</strong></td>
                <td className="text-center"></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}

      {/* Grand Total */}
      <table className="assessment-table">
        <tbody>
          <tr className="subtotal-row">
            <td><strong>GRAND TOTAL</strong></td>
            <td className="text-center"><strong>{grandTotal}</strong></td>
            <td className="text-center"></td>
            <td></td>
          </tr>
          <tr className="subtotal-row">
            <td colSpan="2"><strong>% = _____ / {grandTotal} x 100</strong></td>
            <td colSpan="2" className="text-center"><strong>_______</strong></td>
          </tr>
        </tbody>
      </table>

      {/* Assessment Outcome */}
      <div className="assessment-outcome">
        <h4>ASSESSMENT OUTCOME</h4>
        <p style={{ fontSize: '11px', marginBottom: '10px' }}>The candidate was found to be:</p>
        
        <div className="outcome-options">
          <div className="outcome-checkbox">
            <input type="checkbox" id="competent" />
            <label htmlFor="competent">Competent</label>
          </div>
          <div className="outcome-checkbox">
            <input type="checkbox" id="not-competent" />
            <label htmlFor="not-competent">Not Yet Competent</label>
          </div>
        </div>
        
        <p style={{ fontSize: '9px', fontStyle: 'italic', marginTop: '10px', marginLeft: '30px' }}>
          Please tick as appropriate.
        </p>
        <p style={{ fontSize: '9px', fontStyle: 'italic', marginLeft: '30px' }}>
          The candidate is competent if the candidate obtains at least {assessmentData.config.competency_threshold}%.
        </p>
      </div>

      {/* Feedback Section */}
      <div className="feedback-section">
        <h5>FEEDBACK FROM THE CANDIDATE</h5>
        <div className="feedback-box"></div>

        <h5>FEEDBACK TO THE CANDIDATE</h5>
        <div className="feedback-box"></div>
      </div>

      {/* Signatures */}
      <div className="signature-section">
        <div className="signature-row">
          <div className="signature-field">
            <span>CANDIDATE SIGNATURE:</span>
            <span className="signature-line"></span>
          </div>
          <div className="signature-field">
            <span>DATE:</span>
            <span className="signature-line" style={{ minWidth: '100px' }}></span>
          </div>
        </div>
        
        <div className="signature-row">
          <div className="signature-field">
            <span>ASSESSOR'S SIGNATURE:</span>
            <span className="signature-line"></span>
          </div>
          <div className="signature-field">
            <span>DATE:</span>
            <span className="signature-line" style={{ minWidth: '100px' }}></span>
          </div>
        </div>
      </div>

      {/* Page number */}
      <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '9px', color: '#666' }}>
        Page 1 of 1
      </div>
    </div>
  );
}
