'use client';

export default function AssessmentReports() {
  // Sample data - In production, fetch from Supabase
  const reports = [
    {
      id: '1',
      trainee_name: 'John Doe',
      admission_number: 'T2024/001',
      assessment_title: 'Install Security System',
      assessment_date: '2024-01-20',
      percentage: 85,
      outcome: 'Competent',
      status: 'verified'
    }
  ];

  return (
    <div className="container py-5">
      <h1 className="h3 mb-4">Assessment Reports</h1>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Trainee</th>
                  <th>Admission No</th>
                  <th>Assessment</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Outcome</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>{report.trainee_name}</td>
                    <td>{report.admission_number}</td>
                    <td>{report.assessment_title}</td>
                    <td>{new Date(report.assessment_date).toLocaleDateString()}</td>
                    <td>{report.percentage}%</td>
                    <td>
                      <span className={`badge ${report.outcome === 'Competent' ? 'bg-success' : 'bg-warning'}`}>
                        {report.outcome}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-info">{report.status}</span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary me-2">
                        <i className="bi bi-eye me-1"></i>
                        View
                      </button>
                      <button className="btn btn-sm btn-outline-danger">
                        <i className="bi bi-file-pdf me-1"></i>
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
