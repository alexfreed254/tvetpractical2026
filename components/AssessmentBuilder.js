'use client';

import { useState } from 'react';

export default function AssessmentBuilder({ assessmentData, updateAssessmentData, activeTab }) {
  const [newChecklistItem, setNewChecklistItem] = useState({ description: '', max_marks: 0 });
  const [newTask, setNewTask] = useState({ title: '', items: [] });

  // Update institution details
  const updateInstitution = (field, value) => {
    updateAssessmentData({
      institution: { ...assessmentData.institution, [field]: value }
    });
  };

  // Update department details
  const updateDepartment = (field, value) => {
    updateAssessmentData({
      department: { ...assessmentData.department, [field]: value }
    });
  };

  // Update course details
  const updateCourse = (field, value) => {
    updateAssessmentData({
      course: { ...assessmentData.course, [field]: value }
    });
  };

  // Update unit details
  const updateUnit = (field, value) => {
    updateAssessmentData({
      unit: { ...assessmentData.unit, [field]: value }
    });
  };

  // Update assessment details
  const updateAssessment = (field, value) => {
    updateAssessmentData({
      assessment: { ...assessmentData.assessment, [field]: value }
    });
  };

  // Add checklist criterion
  const addChecklistCriterion = () => {
    const newId = `temp-checklist-${Date.now()}`;
    const newCriterion = {
      id: newId,
      item_number: (assessmentData.checklistCriteria.length + 1).toString(),
      description: 'New criterion',
      max_marks: 1,
      children: []
    };
    
    updateAssessmentData({
      checklistCriteria: [...assessmentData.checklistCriteria, newCriterion]
    });
  };

  // Add sub-criterion to checklist
  const addSubCriterion = (parentId) => {
    const updatedCriteria = assessmentData.checklistCriteria.map(criterion => {
      if (criterion.id === parentId) {
        const newSubId = `temp-subcriteria-${Date.now()}`;
        const subItemLetter = String.fromCharCode(97 + (criterion.children?.length || 0)); // a, b, c, etc.
        return {
          ...criterion,
          children: [
            ...(criterion.children || []),
            {
              id: newSubId,
              item_number: `(${subItemLetter})`,
              description: 'New sub-criterion',
              max_marks: 1
            }
          ]
        };
      }
      return criterion;
    });
    
    updateAssessmentData({ checklistCriteria: updatedCriteria });
  };

  // Update checklist criterion
  const updateChecklistCriterion = (criterionId, field, value) => {
    const updatedCriteria = assessmentData.checklistCriteria.map(criterion => {
      if (criterion.id === criterionId) {
        return { ...criterion, [field]: value };
      }
      return criterion;
    });
    
    updateAssessmentData({ checklistCriteria: updatedCriteria });
  };

  // Update sub-criterion
  const updateSubCriterion = (parentId, subId, field, value) => {
    const updatedCriteria = assessmentData.checklistCriteria.map(criterion => {
      if (criterion.id === parentId) {
        return {
          ...criterion,
          children: criterion.children.map(child => 
            child.id === subId ? { ...child, [field]: value } : child
          )
        };
      }
      return criterion;
    });
    
    updateAssessmentData({ checklistCriteria: updatedCriteria });
  };

  // Delete checklist criterion
  const deleteChecklistCriterion = (criterionId) => {
    if (confirm('Are you sure you want to delete this criterion?')) {
      const updatedCriteria = assessmentData.checklistCriteria.filter(c => c.id !== criterionId);
      updateAssessmentData({ checklistCriteria: updatedCriteria });
    }
  };

  // Delete sub-criterion
  const deleteSubCriterion = (parentId, subId) => {
    if (confirm('Are you sure you want to delete this sub-criterion?')) {
      const updatedCriteria = assessmentData.checklistCriteria.map(criterion => {
        if (criterion.id === parentId) {
          return {
            ...criterion,
            children: criterion.children.filter(child => child.id !== subId)
          };
        }
        return criterion;
      });
      
      updateAssessmentData({ checklistCriteria: updatedCriteria });
    }
  };

  // Add task
  const addTask = () => {
    const newId = `temp-task-${Date.now()}`;
    const newTask = {
      id: newId,
      task_number: assessmentData.tasks.length + 1,
      title: `TASK ${assessmentData.tasks.length + 1}`,
      items: []
    };
    
    updateAssessmentData({
      tasks: [...assessmentData.tasks, newTask]
    });
  };

  // Add task item
  const addTaskItem = (taskId) => {
    const updatedTasks = assessmentData.tasks.map(task => {
      if (task.id === taskId) {
        const newItemId = `temp-item-${Date.now()}`;
        return {
          ...task,
          items: [
            ...task.items,
            {
              id: newItemId,
              item_number: (task.items.length + 1).toString(),
              description: 'New assessment item',
              max_marks: 1,
              children: []
            }
          ]
        };
      }
      return task;
    });
    
    updateAssessmentData({ tasks: updatedTasks });
  };

  // Add sub-item to task item
  const addSubItem = (taskId, itemId) => {
    const updatedTasks = assessmentData.tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          items: task.items.map(item => {
            if (item.id === itemId) {
              const newSubId = `temp-subitem-${Date.now()}`;
              const subItemLetter = String.fromCharCode(97 + (item.children?.length || 0));
              return {
                ...item,
                children: [
                  ...(item.children || []),
                  {
                    id: newSubId,
                    item_number: `(${subItemLetter})`,
                    description: 'New sub-item',
                    max_marks: 1
                  }
                ]
              };
            }
            return item;
          })
        };
      }
      return task;
    });
    
    updateAssessmentData({ tasks: updatedTasks });
  };

  // Update task item
  const updateTaskItem = (taskId, itemId, field, value) => {
    const updatedTasks = assessmentData.tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          items: task.items.map(item =>
            item.id === itemId ? { ...item, [field]: value } : item
          )
        };
      }
      return task;
    });
    
    updateAssessmentData({ tasks: updatedTasks });
  };

  // Update sub-item
  const updateSubItem = (taskId, itemId, subId, field, value) => {
    const updatedTasks = assessmentData.tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          items: task.items.map(item => {
            if (item.id === itemId) {
              return {
                ...item,
                children: item.children.map(child =>
                  child.id === subId ? { ...child, [field]: value } : child
                )
              };
            }
            return item;
          })
        };
      }
      return task;
    });
    
    updateAssessmentData({ tasks: updatedTasks });
  };

  // Delete task
  const deleteTask = (taskId) => {
    if (confirm('Are you sure you want to delete this task?')) {
      const updatedTasks = assessmentData.tasks.filter(t => t.id !== taskId);
      updateAssessmentData({ tasks: updatedTasks });
    }
  };

  // Delete task item
  const deleteTaskItem = (taskId, itemId) => {
    if (confirm('Are you sure you want to delete this item?')) {
      const updatedTasks = assessmentData.tasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            items: task.items.filter(item => item.id !== itemId)
          };
        }
        return task;
      });
      
      updateAssessmentData({ tasks: updatedTasks });
    }
  };

  // Delete sub-item
  const deleteSubItem = (taskId, itemId, subId) => {
    if (confirm('Are you sure you want to delete this sub-item?')) {
      const updatedTasks = assessmentData.tasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            items: task.items.map(item => {
              if (item.id === itemId) {
                return {
                  ...item,
                  children: item.children.filter(child => child.id !== subId)
                };
              }
              return item;
            })
          };
        }
        return task;
      });
      
      updateAssessmentData({ tasks: updatedTasks });
    }
  };

  return (
    <div>
      {activeTab === 'details' && (
        <div>
          <h5 className="mb-4">Assessment Details</h5>
          
          {/* Institution Details */}
          <div className="mb-4">
            <h6 className="text-primary mb-3">Institution Information</h6>
            <div className="mb-3">
              <label className="form-label">Institution Name</label>
              <input
                type="text"
                className="form-control"
                value={assessmentData.institution.name}
                onChange={(e) => updateInstitution('name', e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Institution Logo URL</label>
              <input
                type="text"
                className="form-control"
                value={assessmentData.institution.logo_url || ''}
                onChange={(e) => updateInstitution('logo_url', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>

          {/* Department Details */}
          <div className="mb-4">
            <h6 className="text-primary mb-3">Department Information</h6>
            <div className="mb-3">
              <label className="form-label">Department Name</label>
              <input
                type="text"
                className="form-control"
                value={assessmentData.department.name}
                onChange={(e) => updateDepartment('name', e.target.value)}
              />
            </div>
          </div>

          {/* Course Details */}
          <div className="mb-4">
            <h6 className="text-primary mb-3">Course Information</h6>
            <div className="mb-3">
              <label className="form-label">Course Name</label>
              <input
                type="text"
                className="form-control"
                value={assessmentData.course.name}
                onChange={(e) => updateCourse('name', e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Level</label>
              <input
                type="text"
                className="form-control"
                value={assessmentData.course.level}
                onChange={(e) => updateCourse('level', e.target.value)}
              />
            </div>
          </div>

          {/* Unit Details */}
          <div className="mb-4">
            <h6 className="text-primary mb-3">Unit Information</h6>
            <div className="mb-3">
              <label className="form-label">Unit Code</label>
              <input
                type="text"
                className="form-control"
                value={assessmentData.unit.code}
                onChange={(e) => updateUnit('code', e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Unit Name</label>
              <input
                type="text"
                className="form-control"
                value={assessmentData.unit.name}
                onChange={(e) => updateUnit('name', e.target.value)}
              />
            </div>
          </div>

          {/* Assessment Details */}
          <div className="mb-4">
            <h6 className="text-primary mb-3">Assessment Information</h6>
            <div className="mb-3">
              <label className="form-label">Assessment Type</label>
              <input
                type="text"
                className="form-control"
                value={assessmentData.assessment.assessment_type}
                onChange={(e) => updateAssessment('assessment_type', e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Assessment Number</label>
              <input
                type="text"
                className="form-control"
                value={assessmentData.assessment.assessment_number}
                onChange={(e) => updateAssessment('assessment_number', e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Academic Year</label>
              <input
                type="text"
                className="form-control"
                value={assessmentData.assessment.academic_year}
                onChange={(e) => updateAssessment('academic_year', e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Term</label>
              <input
                type="text"
                className="form-control"
                value={assessmentData.assessment.term}
                onChange={(e) => updateAssessment('term', e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Instructions</label>
              <textarea
                className="form-control"
                rows="3"
                value={assessmentData.assessment.instructions}
                onChange={(e) => updateAssessment('instructions', e.target.value)}
              />
            </div>
          </div>

          {/* Competency Configuration */}
          <div className="mb-4">
            <h6 className="text-primary mb-3">Competency Configuration</h6>
            <div className="mb-3">
              <label className="form-label">Competency Threshold (%)</label>
              <input
                type="number"
                className="form-control"
                value={assessmentData.config.competency_threshold}
                onChange={(e) => updateAssessmentData({
                  config: { ...assessmentData.config, competency_threshold: parseFloat(e.target.value) }
                })}
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'checklist' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="mb-0">Observation Checklist</h5>
            <button className="btn btn-primary btn-sm" onClick={addChecklistCriterion}>
              <i className="bi bi-plus-circle me-1"></i>
              Add Criterion
            </button>
          </div>

          {assessmentData.checklistCriteria.map((criterion, index) => (
            <div key={criterion.id} className="card mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h6 className="mb-0">Criterion {criterion.item_number}</h6>
                  <div className="btn-group btn-group-sm">
                    <button 
                      className="btn btn-outline-primary"
                      onClick={() => addSubCriterion(criterion.id)}
                    >
                      <i className="bi bi-plus"></i> Sub
                    </button>
                    <button 
                      className="btn btn-outline-danger"
                      onClick={() => deleteChecklistCriterion(criterion.id)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>

                <div className="mb-2">
                  <label className="form-label small">Description</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={criterion.description}
                    onChange={(e) => updateChecklistCriterion(criterion.id, 'description', e.target.value)}
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label small">Maximum Marks</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    style={{ maxWidth: '100px' }}
                    value={criterion.max_marks}
                    onChange={(e) => updateChecklistCriterion(criterion.id, 'max_marks', parseFloat(e.target.value))}
                    min="0"
                  />
                </div>

                {/* Sub-criteria */}
                {criterion.children && criterion.children.length > 0 && (
                  <div className="mt-3 ps-4 border-start border-primary border-3">
                    {criterion.children.map((subCriterion) => (
                      <div key={subCriterion.id} className="card card-body mb-2 bg-light">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <small className="fw-bold">{subCriterion.item_number}</small>
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => deleteSubCriterion(criterion.id, subCriterion.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                        <div className="mb-2">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={subCriterion.description}
                            onChange={(e) => updateSubCriterion(criterion.id, subCriterion.id, 'description', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="form-label small">Max Marks</label>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            style={{ maxWidth: '80px' }}
                            value={subCriterion.max_marks}
                            onChange={(e) => updateSubCriterion(criterion.id, subCriterion.id, 'max_marks', parseFloat(e.target.value))}
                            min="0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'tasks' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="mb-0">Assessment Tasks</h5>
            <button className="btn btn-primary btn-sm" onClick={addTask}>
              <i className="bi bi-plus-circle me-1"></i>
              Add Task
            </button>
          </div>

          {assessmentData.tasks.map((task, taskIndex) => (
            <div key={task.id} className="card mb-4">
              <div className="card-header bg-primary text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Task {task.task_number}</h6>
                  <div className="btn-group btn-group-sm">
                    <button 
                      className="btn btn-sm btn-light"
                      onClick={() => addTaskItem(task.id)}
                    >
                      <i className="bi bi-plus-circle me-1"></i>
                      Add Item
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteTask(task.id)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="card-body">
                {task.items.map((item, itemIndex) => (
                  <div key={item.id} className="card mb-3">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <strong>{item.item_number}.</strong>
                        <div className="btn-group btn-group-sm">
                          <button 
                            className="btn btn-outline-primary"
                            onClick={() => addSubItem(task.id, item.id)}
                          >
                            <i className="bi bi-plus"></i> Sub
                          </button>
                          <button 
                            className="btn btn-outline-danger"
                            onClick={() => deleteTaskItem(task.id, item.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>

                      <div className="mb-2">
                        <label className="form-label small">Description</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={item.description}
                          onChange={(e) => updateTaskItem(task.id, item.id, 'description', e.target.value)}
                        />
                      </div>

                      <div className="mb-2">
                        <label className="form-label small">Maximum Marks</label>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          style={{ maxWidth: '100px' }}
                          value={item.max_marks}
                          onChange={(e) => updateTaskItem(task.id, item.id, 'max_marks', parseFloat(e.target.value))}
                          min="0"
                        />
                      </div>

                      {/* Sub-items */}
                      {item.children && item.children.length > 0 && (
                        <div className="mt-3 ps-4 border-start border-primary border-3">
                          {item.children.map((subItem) => (
                            <div key={subItem.id} className="card card-body mb-2 bg-light">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <small className="fw-bold">{subItem.item_number}</small>
                                <button 
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => deleteSubItem(task.id, item.id, subItem.id)}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                              <div className="mb-2">
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={subItem.description}
                                  onChange={(e) => updateSubItem(task.id, item.id, subItem.id, 'description', e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="form-label small">Max Marks</label>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  style={{ maxWidth: '80px' }}
                                  value={subItem.max_marks}
                                  onChange={(e) => updateSubItem(task.id, item.id, subItem.id, 'max_marks', parseFloat(e.target.value))}
                                  min="0"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
