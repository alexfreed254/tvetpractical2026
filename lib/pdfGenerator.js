import jsPDF from 'jspdf';
import 'jspdf-autotable';

export class AssessmentPDFGenerator {
  constructor(assessmentData) {
    this.data = assessmentData;
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = 210;
    this.pageHeight = 297;
    this.margin = 15;
    this.currentY = this.margin;
  }

  async generate() {
    this.addInstitutionalHeader();
    this.addCandidateInformation();
    this.addObservationChecklistHeader();
    this.addObservationChecklistTable();
    this.addAssessmentTasks();
    this.addFinalSummary();
    this.addAssessmentOutcome();
    this.addFeedbackSection();
    this.addSignatures();
    
    return this.doc;
  }

  addInstitutionalHeader() {
    const centerX = this.pageWidth / 2;
    
    // Institution logo (if available)
    if (this.data.institution.logo_url) {
      // Note: In production, you'd load and add the actual logo
      // this.doc.addImage(logoData, 'PNG', centerX - 15, this.currentY, 30, 30);
      this.currentY += 35;
    }
    
    // Institution name
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.data.institution.name.toUpperCase(), centerX, this.currentY, { align: 'center' });
    this.currentY += 6;
    
    // Department name
    this.doc.setFontSize(12);
    this.doc.text(this.data.department.name.toUpperCase(), centerX, this.currentY, { align: 'center' });
    this.currentY += 6;
    
    // Course/Qualification
    this.doc.setFontSize(11);
    const courseTitle = `${this.data.course.name} ${this.data.course.level || ''}`.trim().toUpperCase();
    this.doc.text(courseTitle, centerX, this.currentY, { align: 'center' });
    this.currentY += 8;
    
    // Unit code and name
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Unit Code: ${this.data.unit.code}`, centerX, this.currentY, { align: 'center' });
    this.currentY += 5;
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.data.unit.name, centerX, this.currentY, { align: 'center' });
    this.currentY += 8;
    
    // Assessment type and number
    this.doc.setFontSize(11);
    this.doc.text(
      `${this.data.assessment.assessment_type.toUpperCase()} ${this.data.assessment.assessment_number || ''}`,
      centerX,
      this.currentY,
      { align: 'center' }
    );
    this.currentY += 10;
  }

  addCandidateInformation() {
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    const startY = this.currentY;
    const lineHeight = 7;
    
    // Candidate name
    this.doc.text(`Candidate's Name:`, this.margin, this.currentY);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`${this.data.trainee.first_name} ${this.data.trainee.last_name}`, this.margin + 50, this.currentY);
    this.currentY += lineHeight;
    
    // Admission number
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Candidate's Adm No:`, this.margin, this.currentY);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.data.trainee.admission_number || 'N/A', this.margin + 50, this.currentY);
    this.currentY += lineHeight;
    
    // Date of assessment
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Date of Assessment:`, this.margin, this.currentY);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(
      this.data.session.assessment_date ? new Date(this.data.session.assessment_date).toLocaleDateString() : '___________',
      this.margin + 50,
      this.currentY
    );
    this.currentY += lineHeight + 3;
  }

  addObservationChecklistHeader() {
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    
    const centerX = this.pageWidth / 2;
    this.doc.text('OBSERVATION CHECKLIST', centerX, this.currentY, { align: 'center' });
    this.currentY += 8;
    
    // Instruction text
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'italic');
    const instructionText = 'Items to be Evaluated: Please award marks as appropriate. Give a brief comment on your observation.';
    const splitText = this.doc.splitTextToSize(instructionText, this.pageWidth - 2 * this.margin);
    this.doc.text(splitText, this.margin, this.currentY);
    this.currentY += splitText.length * 4 + 3;
  }

  addObservationChecklistTable() {
    if (!this.data.checklistCriteria || this.data.checklistCriteria.length === 0) {
      return;
    }

    const tableData = [];
    let checklistSubtotal = 0;
    
    this.data.checklistCriteria.forEach(criterion => {
      const result = this.data.checklistResults.find(r => r.criterion_id === criterion.id);
      const marksObtained = result ? result.marks_obtained : '';
      const comments = result ? result.comments : '';
      
      tableData.push([
        `${criterion.item_number}. ${criterion.description}`,
        criterion.max_marks.toString(),
        marksObtained.toString(),
        comments
      ]);
      
      checklistSubtotal += criterion.max_marks;
      
      // Add sub-items if any
      if (criterion.children && criterion.children.length > 0) {
        criterion.children.forEach(child => {
          const childResult = this.data.checklistResults.find(r => r.criterion_id === child.id);
          const childMarks = childResult ? childResult.marks_obtained : '';
          const childComments = childResult ? childResult.comments : '';
          
          tableData.push([
            `   ${child.item_number} ${child.description}`,
            child.max_marks.toString(),
            childMarks.toString(),
            childComments
          ]);
        });
      }
    });
    
    // Add subtotal row
    tableData.push([
      { content: 'Sub-Total 1', styles: { fontStyle: 'bold' } },
      { content: checklistSubtotal.toString(), styles: { fontStyle: 'bold' } },
      { content: '', styles: { fontStyle: 'bold' } },
      { content: '', styles: { fontStyle: 'bold' } }
    ]);

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Item to be Evaluated', 'Marks Available', 'Marks Obtained', 'Comments']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 35 },
      },
      didDrawPage: (data) => {
        this.currentY = data.cursor.y;
      },
    });
    
    this.currentY = this.doc.lastAutoTable.finalY + 5;
  }

  addAssessmentTasks() {
    if (!this.data.tasks || this.data.tasks.length === 0) {
      return;
    }

    this.data.tasks.forEach((task, taskIndex) => {
      // Check if we need a new page
      if (this.currentY > this.pageHeight - 40) {
        this.doc.addPage();
        this.currentY = this.margin;
      }

      const tableData = [];
      
      // Add task header row
      tableData.push([
        { content: `TASK ${task.task_number}`, colSpan: 4, styles: { fontStyle: 'bold', halign: 'center' } }
      ]);
      
      // Add task items
      task.items.forEach(item => {
        const result = this.data.criterionResults.find(r => r.item_id === item.id);
        const marksObtained = result ? result.marks_obtained : '';
        const comments = result ? result.comments : '';
        
        tableData.push([
          `${item.item_number}. ${item.description}`,
          item.max_marks.toString(),
          marksObtained.toString(),
          comments
        ]);
        
        // Add sub-items if any
        if (item.children && item.children.length > 0) {
          item.children.forEach(child => {
            const childResult = this.data.criterionResults.find(r => r.item_id === child.id);
            const childMarks = childResult ? childResult.marks_obtained : '';
            const childComments = childResult ? childResult.comments : '';
            
            tableData.push([
              `   ${child.item_number} ${child.description}`,
              child.max_marks.toString(),
              childMarks.toString(),
              childComments
            ]);
          });
        }
      });
      
      // Calculate task subtotal
      const taskSubtotal = task.items.reduce((sum, item) => {
        let total = item.max_marks;
        if (item.children) {
          total += item.children.reduce((childSum, child) => childSum + child.max_marks, 0);
        }
        return sum + total;
      }, 0);
      
      // Add subtotal row
      tableData.push([
        { content: `Sub-Total ${taskIndex + 2}`, styles: { fontStyle: 'bold' } },
        { content: taskSubtotal.toString(), styles: { fontStyle: 'bold' } },
        { content: '', styles: { fontStyle: 'bold' } },
        { content: '', styles: { fontStyle: 'bold' } }
      ]);

      this.doc.autoTable({
        startY: this.currentY,
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 2,
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
        },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 35 },
        },
        didDrawPage: (data) => {
          this.currentY = data.cursor.y;
        },
      });
      
      this.currentY = this.doc.lastAutoTable.finalY + 5;
    });
  }

  addFinalSummary() {
    // Check if we need a new page
    if (this.currentY > this.pageHeight - 60) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    const grandTotalData = [
      [
        { content: 'GRAND TOTAL', styles: { fontStyle: 'bold' } },
        { content: this.data.session.total_marks_available.toString(), styles: { fontStyle: 'bold' } },
        { content: this.data.session.total_marks_obtained.toString(), styles: { fontStyle: 'bold' } },
        { content: '', styles: { fontStyle: 'bold' } }
      ],
      [
        { content: `% = ${this.data.session.total_marks_obtained} / ${this.data.session.total_marks_available} x 100`, colSpan: 2, styles: { fontStyle: 'bold' } },
        { content: `${this.data.session.percentage.toFixed(1)}%`, colSpan: 2, styles: { fontStyle: 'bold', halign: 'center' } }
      ]
    ];

    this.doc.autoTable({
      startY: this.currentY,
      body: grandTotalData,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 35 },
      },
    });
    
    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  addAssessmentOutcome() {
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('ASSESSMENT OUTCOME', this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 8;
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('The candidate was found to be:', this.margin, this.currentY);
    this.currentY += 8;
    
    // Checkbox for Competent
    const checkboxSize = 5;
    const isCompetent = this.data.session.outcome === 'Competent';
    
    this.doc.rect(this.margin + 10, this.currentY - 4, checkboxSize, checkboxSize);
    if (isCompetent) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('X', this.margin + 11, this.currentY);
      this.doc.setFont('helvetica', 'normal');
    }
    this.doc.text('Competent', this.margin + 20, this.currentY);
    this.currentY += 8;
    
    // Checkbox for Not Yet Competent
    this.doc.rect(this.margin + 10, this.currentY - 4, checkboxSize, checkboxSize);
    if (!isCompetent) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('X', this.margin + 11, this.currentY);
      this.doc.setFont('helvetica', 'normal');
    }
    this.doc.text('Not Yet Competent', this.margin + 20, this.currentY);
    this.currentY += 10;
    
    // Instruction
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'italic');
    this.doc.text('Please tick as appropriate.', this.margin, this.currentY);
    this.currentY += 5;
    
    const threshold = this.data.config?.competency_threshold || 50;
    this.doc.text(`The candidate is competent if the candidate obtains at least ${threshold}%.`, this.margin, this.currentY);
    this.currentY += 10;
  }

  addFeedbackSection() {
    // Check if we need a new page
    if (this.currentY > this.pageHeight - 80) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    
    // Feedback from candidate
    this.doc.text('FEEDBACK FROM THE CANDIDATE', this.margin, this.currentY);
    this.currentY += 6;
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    if (this.data.session.candidate_feedback) {
      const feedbackText = this.doc.splitTextToSize(this.data.session.candidate_feedback, this.pageWidth - 2 * this.margin);
      this.doc.text(feedbackText, this.margin, this.currentY);
      this.currentY += feedbackText.length * 4 + 3;
    } else {
      this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 15);
      this.currentY += 18;
    }
    
    // Feedback to candidate
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('FEEDBACK TO THE CANDIDATE', this.margin, this.currentY);
    this.currentY += 6;
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    if (this.data.session.assessor_feedback) {
      const feedbackText = this.doc.splitTextToSize(this.data.session.assessor_feedback, this.pageWidth - 2 * this.margin);
      this.doc.text(feedbackText, this.margin, this.currentY);
      this.currentY += feedbackText.length * 4 + 5;
    } else {
      this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 15);
      this.currentY += 18;
    }
  }

  addSignatures() {
    // Check if we need a new page
    if (this.currentY > this.pageHeight - 50) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    
    const col1X = this.margin;
    const col2X = this.pageWidth / 2 + 5;
    
    // Candidate signature
    this.doc.text('CANDIDATE SIGNATURE:', col1X, this.currentY);
    this.doc.line(col1X + 50, this.currentY, col1X + 90, this.currentY);
    
    this.doc.text('DATE:', col2X, this.currentY);
    const candidateDate = this.data.session.candidate_signature_date 
      ? new Date(this.data.session.candidate_signature_date).toLocaleDateString()
      : '___________';
    this.doc.line(col2X + 15, this.currentY, col2X + 50, this.currentY);
    this.doc.text(candidateDate, col2X + 20, this.currentY - 1);
    
    this.currentY += 10;
    
    // Assessor signature
    this.doc.text("ASSESSOR'S SIGNATURE:", col1X, this.currentY);
    this.doc.line(col1X + 50, this.currentY, col1X + 90, this.currentY);
    
    this.doc.text('DATE:', col2X, this.currentY);
    const assessorDate = this.data.session.assessor_signature_date 
      ? new Date(this.data.session.assessor_signature_date).toLocaleDateString()
      : '___________';
    this.doc.line(col2X + 15, this.currentY, col2X + 50, this.currentY);
    this.doc.text(assessorDate, col2X + 20, this.currentY - 1);
    
    this.currentY += 15;
    
    // Add page numbers to all pages
    const pageCount = this.doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.text(
        `Page ${i} of ${pageCount}`,
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: 'center' }
      );
    }
  }

  async save(filename) {
    return this.doc.save(filename);
  }

  output(type = 'blob') {
    return this.doc.output(type);
  }
}

export async function generateAssessmentPDF(assessmentData) {
  const generator = new AssessmentPDFGenerator(assessmentData);
  await generator.generate();
  return generator;
}
