'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-10 col-lg-8">
            <div className="text-center mb-5">
              <h1 className="display-4 fw-bold text-primary mb-3">TVET e-ASSESS</h1>
              <p className="lead text-muted">
                Digital Practical Assessment Management System
              </p>
            </div>

            <div className="row g-4">
              <div className="col-md-6">
                <div className="card h-100 shadow-sm hover-shadow">
                  <div className="card-body text-center p-4">
                    <i className="bi bi-file-earmark-text display-1 text-primary mb-3"></i>
                    <h3 className="h5 mb-3">Create Assessment</h3>
                    <p className="text-muted mb-4">
                      Build practical assessment papers with observation checklists
                    </p>
                    <Link href="/assessments/create" className="btn btn-primary">
                      <i className="bi bi-plus-circle me-2"></i>
                      Create New Assessment
                    </Link>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card h-100 shadow-sm hover-shadow">
                  <div className="card-body text-center p-4">
                    <i className="bi bi-list-check display-1 text-success mb-3"></i>
                    <h3 className="h5 mb-3">View Assessments</h3>
                    <p className="text-muted mb-4">
                      Browse and manage existing assessment papers
                    </p>
                    <Link href="/assessments" className="btn btn-success">
                      <i className="bi bi-folder-open me-2"></i>
                      View Assessments
                    </Link>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card h-100 shadow-sm hover-shadow">
                  <div className="card-body text-center p-4">
                    <i className="bi bi-clipboard-check display-1 text-info mb-3"></i>
                    <h3 className="h5 mb-3">Conduct Assessment</h3>
                    <p className="text-muted mb-4">
                      Execute practical assessments and award marks
                    </p>
                    <Link href="/assessments/execute" className="btn btn-info text-white">
                      <i className="bi bi-pencil-square me-2"></i>
                      Conduct Assessment
                    </Link>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card h-100 shadow-sm hover-shadow">
                  <div className="card-body text-center p-4">
                    <i className="bi bi-file-pdf display-1 text-danger mb-3"></i>
                    <h3 className="h5 mb-3">Assessment Reports</h3>
                    <p className="text-muted mb-4">
                      View and download completed assessment PDFs
                    </p>
                    <Link href="/assessments/reports" className="btn btn-danger">
                      <i className="bi bi-file-earmark-pdf me-2"></i>
                      View Reports
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-5">
              <p className="text-muted small">
                TVET Competency-Based Education and Training Assessment System
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hover-shadow {
          transition: all 0.3s ease;
        }
        .hover-shadow:hover {
          transform: translateY(-5px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
        }
      `}</style>
    </div>
  );
}
