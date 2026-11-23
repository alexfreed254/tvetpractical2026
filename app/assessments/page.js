'use client';

import Link from 'next/link';

export default function Assessments() {
  // Sample data - In production, fetch from Supabase
  const assessments = [
    {
      id: '1',
      title: 'Install Security System',
      unit_code: 'ENG/CU/EI/CR/03/5/MA',
      assessment_number: '1',
      status: 'published',
      created_at: '2024-01-15'
    }
  ];

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">Assessment Papers</h1>
        <Link href="/assessments/create" className="btn btn-primary">
          <i className="bi bi-plus-circle me-2"></i>
          Create New Assessment
        </Link>
      </div>

      <div className="row">
        {assessments.map((assessment) => (
          <div key={assessment.id} className="col-md-6 col-lg-4 mb-4">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">{assessment.title}</h5>
                <p className="card-text">
                  <small className="text-muted">
                    Unit Code: {assessment.unit_code}<br />
                    Assessment #{assessment.assessment_number}<br />
                    Status: <span className="badge bg-success">{assessment.status}</span>
                  </small>
                </p>
              </div>
              <div className="card-footer bg-white">
                <div className="d-flex justify-content-between">
                  <button className="btn btn-sm btn-outline-primary">
                    <i className="bi bi-eye me-1"></i>
                    View
                  </button>
                  <button className="btn btn-sm btn-outline-secondary">
                    <i className="bi bi-pencil me-1"></i>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-outline-danger">
                    <i className="bi bi-trash me-1"></i>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
