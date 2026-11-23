'use client';

import { useState } from 'react';
import AssessmentBuilder from '@/components/AssessmentBuilder';
import AssessmentPreview from '@/components/AssessmentPreview';

export default function CreateAssessment() {
  const [assessmentData, setAssessmentData] = useState({
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
      academic_year: '2024',
      term: 'Term 1',
      instructions: 'Items to be Evaluated: Please award marks as appropriate. Give a brief comment on your observation.'
    },
    checklistCriteria: [
      {
        id: 'temp-checklist-1',
        item_number: '1',
        description: 'Observed safety awareness',
        max_marks: 5,
        children: [
          { id: 'temp-checklist-1a', item_number: '(a)', description: 'Housekeeping and waste disposal', max_marks: 1 },
          { id: 'temp-checklist-1b', item_number: '(b)', description: 'Safety boots', max_marks: 1 },
          { id: 'temp-checklist-1c', item_number: '(c)', description: 'Apron', max_marks: 1 },
          { id: 'temp-checklist-1d', item_number: '(d)', description: 'Handling of tools', max_marks: 1 },
          { id: 'temp-checklist-1e', item_number: '(e)', description: 'Handling of equipment', max_marks: 1 }
        ]
      }
    ],
    tasks: [
      {
        id: 'temp-task-1',
        task_number: 1,
        title: 'TASK 1',
        items: [
          { id: 'temp-item-1', item_number: '1', description: 'Fixed components firmly and level', max_marks: 3 },
          { id: 'temp-item-2', item_number: '2', description: 'Terminated cables at the specified components', max_marks: 8, 
            children: [
              { id: 'temp-item-2a', item_number: '(a)', description: 'Proper termination of BNC connectors', max_marks: 2 },
              { id: 'temp-item-2b', item_number: '(b)', description: 'Power supply', max_marks: 2 },
              { id: 'temp-item-2c', item_number: '(c)', description: 'DVR/Award maximum marks', max_marks: 2 },
              { id: 'temp-item-2d', item_number: '(d)', description: 'Dome cameras', max_marks: 1 },
              { id: 'temp-item-2e', item_number: '(e)', description: 'Bullet Camera', max_marks: 1 }
            ]
          },
          { id: 'temp-item-3', item_number: '3', description: 'Clipped cables uniformly', max_marks: 2 },
          { id: 'temp-item-4', item_number: '4', description: 'Aligned conduits', max_marks: 1 },
          { id: 'temp-item-5', item_number: '5', description: 'Dimensions accurate', max_marks: 2 },
          { id: 'temp-item-6', item_number: '6', description: 'Observed correct color coding', max_marks: 2 }
        ]
      }
    ],
    config: {
      competency_threshold: 50
    }
  });

  const [activeTab, setActiveTab] = useState('details');

  const updateAssessmentData = (updates) => {
    setAssessmentData(prev => ({
      ...prev,
      ...updates
    }));
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12 bg-primary text-white py-3 mb-3">
          <div className="container">
            <h1 className="h3 mb-0">
              <i className="bi bi-file-earmark-plus me-2"></i>
              Create Practical Assessment Paper
            </h1>
          </div>
        </div>
      </div>

      <div className="container-fluid">
        <div className="row g-3">
          {/* Left Panel - Builder */}
          <div className="col-lg-6">
            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <ul className="nav nav-tabs card-header-tabs">
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'details' ? 'active' : ''}`}
                      onClick={() => setActiveTab('details')}
                    >
                      Assessment Details
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'checklist' ? 'active' : ''}`}
                      onClick={() => setActiveTab('checklist')}
                    >
                      Observation Checklist
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'tasks' ? 'active' : ''}`}
                      onClick={() => setActiveTab('tasks')}
                    >
                      Assessment Tasks
                    </button>
                  </li>
                </ul>
              </div>
              <div className="card-body" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                <AssessmentBuilder 
                  assessmentData={assessmentData}
                  updateAssessmentData={updateAssessmentData}
                  activeTab={activeTab}
                />
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="col-lg-6">
            <div className="card shadow-sm">
              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-eye me-2"></i>
                  Live Preview
                </h5>
                <div>
                  <button className="btn btn-sm btn-outline-primary me-2">
                    <i className="bi bi-printer me-1"></i>
                    Print
                  </button>
                  <button className="btn btn-sm btn-primary">
                    <i className="bi bi-save me-1"></i>
                    Save Assessment
                  </button>
                </div>
              </div>
              <div className="card-body bg-light" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                <AssessmentPreview assessmentData={assessmentData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
