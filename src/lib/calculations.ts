import type {
  Assessment,
  AssessmentItem,
  AssessmentSession,
  AssessmentTask,
  ChecklistCriterion,
  ChecklistResult,
  CompetencyOutcome,
  CriterionResult,
  Institution,
  ObservationChecklist,
  Trainee,
} from '../types/tvet';

export function calculateTaskMaxSubtotal(items: AssessmentItem[]): number {
  return items.reduce((sum, item) => {
    if (!item.is_subcriterion) {
      return sum + (Number(item.max_marks) || 0);
    }
    return sum;
  }, 0);
}

export function calculateTaskSubtotal(
  items: AssessmentItem[],
  results: CriterionResult[],
): number {
  return items.reduce((sum, item) => {
    if (!item.is_subcriterion) {
      const r = results.find((res) => res.item_id === item.id);
      return sum + (r ? Number(r.marks_obtained) || 0 : 0);
    }
    return sum;
  }, 0);
}

export function calculateChecklistMaxSubtotal(criteria: ChecklistCriterion[]): number {
  return criteria.reduce((sum, c) => {
    if (!c.is_subitem) {
      return sum + (Number(c.max_marks) || 0);
    }
    return sum;
  }, 0);
}

export function calculateChecklistSubtotal(
  criteria: ChecklistCriterion[],
  results: ChecklistResult[],
): number {
  return criteria.reduce((sum, c) => {
    if (!c.is_subitem) {
      const r = results.find((res) => res.criteria_id === c.id);
      return sum + (r ? Number(r.marks_obtained) || 0 : 0);
    }
    return sum;
  }, 0);
}

export function calculateTotalAvailable(
  tasks: AssessmentTask[],
  checklists: ObservationChecklist[],
): number {
  const taskTotal = tasks.reduce(
    (sum, task) => sum + calculateTaskMaxSubtotal(task.items),
    0,
  );
  const checklistTotal = checklists.reduce(
    (sum, cl) => sum + calculateChecklistMaxSubtotal(cl.criteria),
    0,
  );
  return taskTotal + checklistTotal;
}

export function calculateTotalObtained(
  tasks: AssessmentTask[],
  checklists: ObservationChecklist[],
  results: CriterionResult[],
  checklistResults: ChecklistResult[],
): number {
  const taskTotal = tasks.reduce(
    (sum, task) => sum + calculateTaskSubtotal(task.items, results),
    0,
  );
  const checklistTotal = checklists.reduce(
    (sum, cl) => sum + calculateChecklistSubtotal(cl.criteria, checklistResults),
    0,
  );
  return taskTotal + checklistTotal;
}

export function calculatePercentage(obtained: number, available: number): number {
  if (available <= 0) return 0;
  return (obtained / available) * 100;
}

export function determineCompetency(
  percentage: number,
  threshold = 50,
): CompetencyOutcome {
  if (percentage < threshold) return 'Not Yet Competent';
  if (percentage >= 85) return 'Mastery';
  if (percentage >= 70) return 'Proficient';
  return 'Competent';
}

export function validateMarks(
  marksObtained: string | number,
  maxMarks: number,
): { valid: boolean; value?: number; error?: string } {
  const obtained =
    typeof marksObtained === 'string' ? parseFloat(marksObtained) : marksObtained;
  const safeObtained = Number.isNaN(obtained) ? 0 : obtained;
  const max = Number(maxMarks) || 0;

  if (safeObtained < 0) {
    return { valid: false, error: 'Negative marks are not allowed.' };
  }
  if (safeObtained > max) {
    return { valid: false, error: `Cannot exceed maximum marks (${max}).` };
  }
  return { valid: true, value: Math.round(safeObtained * 100) / 100 };
}

export interface MarksheetCellScore {
  assessmentNumber: number;
  obtained: number | null;
  available: number | null;
  percentage: number | null;
  sessionId?: string;
}

export interface MarksheetTraineeRow {
  trainee: Trainee;
  oralScores: Record<number, MarksheetCellScore>;
  practicalScores: Record<number, MarksheetCellScore>;
  oralTotalObtained: number;
  oralTotalAvailable: number;
  oralAvgRaw: number | null;
  oralAvgPercent: number | null;
  oralCompletedCount: number;
  practicalTotalObtained: number;
  practicalTotalAvailable: number;
  practicalAvgRaw: number | null;
  practicalAvgPercent: number | null;
  practicalCompletedCount: number;
  weightedOverallPercent: number | null;
  completionStatus: string;
  competencyOutcome: CompetencyOutcome;
  assessors: string[];
}

export interface MarksheetResultSet {
  oralNumbers: number[];
  practicalNumbers: number[];
  rows: MarksheetTraineeRow[];
  oralWeight: number;
  practicalWeight: number;
}

/**
 * Consolidates submitted/verified Oral & Practical results for a trainee cohort.
 * Rules per Section 7.8:
 * - Only valid submitted or verified sessions are included in averages.
 * - Uncompleted assessments remain null (never treated as 0).
 * - When instruments have varying max marks, category % averages normalize each score to 100%.
 * - Institutional weighting policy (e.g. 30% Oral / 70% Practical) governs weighted overall %.
 */
export function computeMarksheetData(
  trainees: Trainee[],
  assessments: Assessment[],
  sessions: AssessmentSession[],
  oralWeight = 30,
  practicalWeight = 70,
): MarksheetResultSet {
  const oralAssessments = assessments.filter((a) => a.assessment_type === 'ORAL');
  const practicalAssessments = assessments.filter(
    (a) => a.assessment_type === 'PRACTICAL',
  );

  const oralNumbersSet = new Set<number>(
    oralAssessments.map((a) => a.assessment_number),
  );
  const practicalNumbersSet = new Set<number>(
    practicalAssessments.map((a) => a.assessment_number),
  );

  const validSessions = sessions.filter(
    (s) => s.status === 'submitted' || s.status === 'verified',
  );

  for (const s of validSessions) {
    const assess = assessments.find((a) => a.id === s.assessment_id);
    if (!assess) continue;
    if (assess.assessment_type === 'ORAL') oralNumbersSet.add(assess.assessment_number);
    if (assess.assessment_type === 'PRACTICAL') {
      practicalNumbersSet.add(assess.assessment_number);
    }
  }

  const oralNumbers = Array.from(oralNumbersSet).sort((a, b) => a - b);
  const practicalNumbers = Array.from(practicalNumbersSet).sort((a, b) => a - b);

  // Ensure at least columns 1..3 show cleanly if empty so marksheet structure is always legible
  if (oralNumbers.length === 0) oralNumbers.push(1, 2, 3);
  if (practicalNumbers.length === 0) practicalNumbers.push(1, 2, 3);

  const rows: MarksheetTraineeRow[] = trainees.map((trainee) => {
    const traineeSessions = validSessions.filter((s) => s.trainee_id === trainee.id);
    const oralScores: Record<number, MarksheetCellScore> = {};
    const practicalScores: Record<number, MarksheetCellScore> = {};
    const assessorSet = new Set<string>();

    // Prefer latest attempt if multiple attempts exist for the same assessment number
    const sortedSessions = [...traineeSessions].sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );

    for (const s of sortedSessions) {
      const assess = assessments.find((a) => a.id === s.assessment_id);
      if (!assess) continue;
      if (s.assessor_name) assessorSet.add(s.assessor_name);

      if (assess.assessment_type === 'ORAL' && !oralScores[assess.assessment_number]) {
        oralScores[assess.assessment_number] = {
          assessmentNumber: assess.assessment_number,
          obtained: s.grand_total_obtained,
          available: s.grand_total_available,
          percentage: s.percentage,
          sessionId: s.id,
        };
      }
      if (
        assess.assessment_type === 'PRACTICAL' &&
        !practicalScores[assess.assessment_number]
      ) {
        practicalScores[assess.assessment_number] = {
          assessmentNumber: assess.assessment_number,
          obtained: s.grand_total_obtained,
          available: s.grand_total_available,
          percentage: s.percentage,
          sessionId: s.id,
        };
      }
    }

    const oralList = Object.values(oralScores).filter((c) => c.obtained !== null);
    const practicalList = Object.values(practicalScores).filter(
      (c) => c.obtained !== null,
    );

    const oralTotalObtained = oralList.reduce((acc, c) => acc + (c.obtained ?? 0), 0);
    const oralTotalAvailable = oralList.reduce((acc, c) => acc + (c.available ?? 0), 0);
    const oralAvgRaw =
      oralList.length > 0 ? oralTotalObtained / oralList.length : null;
    const oralAvgPercent =
      oralList.length > 0
        ? oralList.reduce((acc, c) => acc + (c.percentage ?? 0), 0) / oralList.length
        : null;

    const practicalTotalObtained = practicalList.reduce(
      (acc, c) => acc + (c.obtained ?? 0),
      0,
    );
    const practicalTotalAvailable = practicalList.reduce(
      (acc, c) => acc + (c.available ?? 0),
      0,
    );
    const practicalAvgRaw =
      practicalList.length > 0 ? practicalTotalObtained / practicalList.length : null;
    const practicalAvgPercent =
      practicalList.length > 0
        ? practicalList.reduce((acc, c) => acc + (c.percentage ?? 0), 0) /
          practicalList.length
        : null;

    let weightedOverallPercent: number | null = null;
    const weightSum = oralWeight + practicalWeight;
    if (oralAvgPercent !== null && practicalAvgPercent !== null && weightSum > 0) {
      weightedOverallPercent =
        (oralAvgPercent * oralWeight + practicalAvgPercent * practicalWeight) /
        weightSum;
    } else if (practicalAvgPercent !== null) {
      weightedOverallPercent = practicalAvgPercent;
    } else if (oralAvgPercent !== null) {
      weightedOverallPercent = oralAvgPercent;
    }

    const totalExpected = oralNumbers.length + practicalNumbers.length;
    const totalDone = oralList.length + practicalList.length;
    const completionStatus =
      totalDone === 0
        ? 'Not Started'
        : totalDone >= totalExpected
          ? 'Complete'
          : `${totalDone}/${totalExpected} Completed`;

    const latestOutcome =
      sortedSessions[0]?.competency_outcome ||
      (weightedOverallPercent !== null
        ? determineCompetency(weightedOverallPercent)
        : 'Pending');

    return {
      trainee,
      oralScores,
      practicalScores,
      oralTotalObtained,
      oralTotalAvailable,
      oralAvgRaw,
      oralAvgPercent,
      oralCompletedCount: oralList.length,
      practicalTotalObtained,
      practicalTotalAvailable,
      practicalAvgRaw,
      practicalAvgPercent,
      practicalCompletedCount: practicalList.length,
      weightedOverallPercent,
      completionStatus,
      competencyOutcome: latestOutcome,
      assessors: Array.from(assessorSet),
    };
  });

  return {
    oralNumbers,
    practicalNumbers,
    rows,
    oralWeight,
    practicalWeight,
  };
}

/**
 * Neutralizes spreadsheet formula injection (=, +, -, @, tab, CR) and quotes CSV fields.
 */
export function sanitizeSpreadsheetCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return str;
}

function escapeCsvField(value: string | number | null | undefined): string {
  const safe = sanitizeSpreadsheetCell(value);
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

function escapeXml(value: string | number | null | undefined): string {
  const safe = sanitizeSpreadsheetCell(value);
  return safe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function downloadCsvMarksheet(
  resultSet: MarksheetResultSet,
  institution: Institution,
  meta: {
    department: string;
    course: string;
    className: string;
    unit: string;
    academicYear: string;
    term: string;
  },
) {
  const headerMeta = [
    [institution.name, `Department: ${meta.department}`],
    [`Course: ${meta.course}`, `Class: ${meta.className}`, `Unit: ${meta.unit}`],
    [
      `Academic Year: ${meta.academicYear}`,
      `Term: ${meta.term}`,
      `Weighting: ${resultSet.oralWeight}% Oral / ${resultSet.practicalWeight}% Practical`,
    ],
    [],
  ];

  const columns = [
    'ADM NO.',
    'TRAINEE NAME',
    ...resultSet.oralNumbers.map((n) => `ORAL ${n}`),
    'ORAL AVG.',
    'ORAL AVG %',
    ...resultSet.practicalNumbers.map((n) => `PRAC. ${n}`),
    'PRAC. AVG.',
    'PRAC. AVG %',
    'WEIGHTED %',
    'COMPLETION',
    'COMPETENCY OUTCOME',
  ];

  const dataRows = resultSet.rows.map((r) => [
    r.trainee.admission_number,
    r.trainee.full_name,
    ...resultSet.oralNumbers.map((n) =>
      r.oralScores[n]?.obtained !== null && r.oralScores[n]?.obtained !== undefined
        ? `${r.oralScores[n].obtained}/${r.oralScores[n].available}`
        : '—',
    ),
    r.oralAvgRaw !== null ? r.oralAvgRaw.toFixed(2) : '—',
    r.oralAvgPercent !== null ? `${r.oralAvgPercent.toFixed(1)}%` : '—',
    ...resultSet.practicalNumbers.map((n) =>
      r.practicalScores[n]?.obtained !== null &&
      r.practicalScores[n]?.obtained !== undefined
        ? `${r.practicalScores[n].obtained}/${r.practicalScores[n].available}`
        : '—',
    ),
    r.practicalAvgRaw !== null ? r.practicalAvgRaw.toFixed(2) : '—',
    r.practicalAvgPercent !== null ? `${r.practicalAvgPercent.toFixed(1)}%` : '—',
    r.weightedOverallPercent !== null ? `${r.weightedOverallPercent.toFixed(1)}%` : '—',
    r.completionStatus,
    r.competencyOutcome,
  ]);

  const lines = [
    ...headerMeta.map((row) => row.map(escapeCsvField).join(',')),
    columns.map(escapeCsvField).join(','),
    ...dataRows.map((row) => row.map(escapeCsvField).join(',')),
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TVET_Marksheet_${meta.academicYear}_${meta.term.replace(/\s+/g, '_')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadExcelMarksheet(
  resultSet: MarksheetResultSet,
  institution: Institution,
  meta: {
    department: string;
    course: string;
    className: string;
    unit: string;
    academicYear: string;
    term: string;
  },
) {
  const columns = [
    'ADM NO.',
    'TRAINEE NAME',
    ...resultSet.oralNumbers.map((n) => `ORAL ${n}`),
    'ORAL AVG.',
    'ORAL AVG %',
    ...resultSet.practicalNumbers.map((n) => `PRAC. ${n}`),
    'PRAC. AVG.',
    'PRAC. AVG %',
    'WEIGHTED %',
    'COMPLETION',
    'COMPETENCY OUTCOME',
  ];

  const makeRowXml = (cells: (string | number)[], styleId = 'Default') =>
    `<Row>${cells
      .map((c) => {
        const isNum = typeof c === 'number' && Number.isFinite(c);
        return `<Cell ss:StyleID="${styleId}"><Data ss:Type="${isNum ? 'Number' : 'String'}">${escapeXml(c)}</Data></Cell>`;
      })
      .join('')}</Row>`;

  const xmlRows = [
    makeRowXml([institution.name], 'Title'),
    makeRowXml(
      [`Department: ${meta.department}`, `Course: ${meta.course}`, `Class: ${meta.className}`],
      'Meta',
    ),
    makeRowXml(
      [
        `Unit: ${meta.unit}`,
        `Academic Year: ${meta.academicYear} · ${meta.term}`,
        `Policy Weighting: ${resultSet.oralWeight}% Oral / ${resultSet.practicalWeight}% Practical`,
      ],
      'Meta',
    ),
    makeRowXml([]),
    makeRowXml(columns, 'Header'),
    ...resultSet.rows.map((r) =>
      makeRowXml([
        r.trainee.admission_number,
        r.trainee.full_name,
        ...resultSet.oralNumbers.map((n) =>
          r.oralScores[n]?.obtained !== null && r.oralScores[n]?.obtained !== undefined
            ? `${r.oralScores[n].obtained}/${r.oralScores[n].available}`
            : '—',
        ),
        r.oralAvgRaw !== null ? Number(r.oralAvgRaw.toFixed(2)) : '—',
        r.oralAvgPercent !== null ? `${r.oralAvgPercent.toFixed(1)}%` : '—',
        ...resultSet.practicalNumbers.map((n) =>
          r.practicalScores[n]?.obtained !== null &&
          r.practicalScores[n]?.obtained !== undefined
            ? `${r.practicalScores[n].obtained}/${r.practicalScores[n].available}`
            : '—',
        ),
        r.practicalAvgRaw !== null ? Number(r.practicalAvgRaw.toFixed(2)) : '—',
        r.practicalAvgPercent !== null ? `${r.practicalAvgPercent.toFixed(1)}%` : '—',
        r.weightedOverallPercent !== null
          ? `${r.weightedOverallPercent.toFixed(1)}%`
          : '—',
        r.completionStatus,
        r.competencyOutcome,
      ]),
    ),
  ].join('\n');

  const workbookXml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default"><Alignment ss:Vertical="Center"/></Style>
  <Style ss:ID="Title"><Font ss:Bold="1" ss:Size="13" ss:Color="#0F2744"/></Style>
  <Style ss:ID="Meta"><Font ss:Size="10" ss:Color="#475569"/></Style>
  <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0F2744" ss:Pattern="Solid"/></Style>
 </Styles>
 <Worksheet ss:Name="TVET Marksheet">
  <Table>
   ${xmlRows}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([workbookXml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TVET_Marksheet_${meta.academicYear}_${meta.term.replace(/\s+/g, '_')}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
