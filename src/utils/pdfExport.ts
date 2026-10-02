import { jsPDF } from 'jspdf';
import { EphemeralTestSession, PersistentPerformanceRecord, UserProfile } from '../types';

export function generateTestPaperPdf(
  session: EphemeralTestSession,
  performance: PersistentPerformanceRecord,
  userProfile?: UserProfile
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const candidateName = userProfile?.name || 'Divesh Sah';
  const targetExam =
    session.examType === 'jee_advanced'
      ? 'JEE Advanced (IIT)'
      : session.examType === 'neet'
      ? 'NEET (UG)'
      : 'JEE Main (NTA)';

  // Helper to add new page if content overflows
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawPageHeader();
    }
  };

  const drawPageHeader = () => {
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('MISSION JEET • DRONA COMMAND CENTER | AUTHENTIC CBT QUESTION PAPER & NOTEBOOK SOLUTIONS', margin, 8);
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, 10, pageWidth - margin, 10);
    doc.setTextColor(30, 30, 30);
  };

  // ================= COVER HEADER =================
  drawPageHeader();
  y = 15;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(session.title.toUpperCase(), margin + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(200, 210, 230);
  doc.text(`Candidate: ${candidateName}   |   Stream: ${targetExam}   |   Date: ${new Date().toLocaleDateString()}`, margin + 6, y + 15);
  doc.text(`Score: ${performance.totalScore}/${performance.maxScore} (${performance.percentage.toFixed(1)}%)   |   Accuracy: ${performance.accuracy.toFixed(0)}%   |   Percentile: ${performance.predictedPercentile.toFixed(2)}%`, margin + 6, y + 22);

  y += 34;

  // ================= QUESTIONS SECTION =================
  session.questions.forEach((q, idx) => {
    const resp = session.responses[q.id];
    let isCorrect = false;
    let studentAns = 'Unattempted';

    if (resp) {
      if (q.type === 'single_choice') {
        studentAns = resp.selectedOption || 'Unattempted';
        isCorrect = resp.selectedOption === q.correctAnswer;
      } else if (q.type === 'multiple_choice') {
        studentAns = resp.selectedOptions?.join(', ') || 'Unattempted';
        const expected = Array.isArray(q.correctAnswer) ? q.correctAnswer.sort().join(', ') : q.correctAnswer;
        isCorrect = studentAns === expected;
      } else {
        studentAns = resp.numericalValue || 'Unattempted';
        isCorrect = String(resp.numericalValue).trim() === String(q.correctAnswer).trim();
      }
    }

    checkPageBreak(45);

    // Question Box Header
    doc.setFillColor(245, 247, 250);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setDrawColor(210, 220, 230);
    doc.rect(margin, y, contentWidth, 7, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    const secTag = q.section ? `[${q.section}] ` : '';
    doc.text(`Q${idx + 1}. ${secTag}[${q.subject.toUpperCase()}] - ${q.chapter || q.topic}`, margin + 3, y + 5);

    // Badge indicator
    doc.setFontSize(8);
    if (studentAns === 'Unattempted') {
      doc.setTextColor(120, 120, 120);
      doc.text('[UNATTEMPTED]', pageWidth - margin - 26, y + 5);
    } else if (isCorrect) {
      doc.setTextColor(16, 185, 129); // emerald
      doc.text('[CORRECT +4]', pageWidth - margin - 25, y + 5);
    } else {
      doc.setTextColor(239, 68, 68); // red
      doc.text('[INCORRECT -1]', pageWidth - margin - 26, y + 5);
    }

    y += 10;

    // Clean LaTeX and symbols for clean PDF rendering
    const cleanText = q.text.replace(/\$\$/g, '').replace(/\$/g, '').replace(/\\text\{([^}]+)\}/g, '$1');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);

    const textLines = doc.splitTextToSize(cleanText, contentWidth - 4);
    checkPageBreak(textLines.length * 4.5 + 20);
    doc.text(textLines, margin + 2, y);
    y += textLines.length * 4.5 + 3;

    // Render Options if MCQ
    if (q.options && q.options.length > 0) {
      q.options.forEach((opt) => {
        checkPageBreak(6);
        const cleanOpt = opt.text.replace(/\$/g, '').replace(/\\text\{([^}]+)\}/g, '$1');
        const isChosen = studentAns.includes(opt.id);
        const isAnswer = Array.isArray(q.correctAnswer) ? q.correctAnswer.includes(opt.id) : q.correctAnswer === opt.id;

        if (isAnswer) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(16, 185, 129);
        } else if (isChosen && !isCorrect) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(239, 68, 68);
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
        }

        doc.text(`(${opt.id}) ${cleanOpt}`, margin + 5, y);
        y += 4.5;
      });
      y += 2;
    }

    // Answer Summary Line
    checkPageBreak(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    const correctAnsStr = Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer;
    doc.text(`Correct Answer: ${correctAnsStr}    |    Your Response: ${studentAns}`, margin + 2, y);
    y += 5;

    // Detailed Notebook-Style Solution
    checkPageBreak(25);
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, contentWidth, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(79, 70, 229);
    doc.text('NOTEBOOK DERIVATION & SCIENTIFIC SOLUTION:', margin + 2, y + 3.8);
    y += 7;

    if (q.notebookSolution) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(`Given: ${q.notebookSolution.given}`, margin + 2, y);
      y += 4.5;
      doc.text(`Concept: ${q.notebookSolution.concept}`, margin + 2, y);
      y += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      q.notebookSolution.steps.forEach((st, sIdx) => {
        checkPageBreak(5);
        const cleanSt = st.replace(/\$\$/g, '').replace(/\$/g, '').replace(/\\text\{([^}]+)\}/g, '$1');
        doc.text(`[${sIdx + 1}] ${cleanSt}`, margin + 4, y);
        y += 4.2;
      });

      checkPageBreak(5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text(`Conclusion: ${q.notebookSolution.conclusion}`, margin + 2, y);
      y += 5;

      if (q.notebookSolution.pitfall) {
        checkPageBreak(5);
        doc.setTextColor(220, 38, 38);
        doc.text(`Pitfall Warning: ${q.notebookSolution.pitfall}`, margin + 2, y);
        y += 5;
      }
    } else {
      const cleanSolution = q.solution.replace(/\$\$/g, '').replace(/\$/g, '').replace(/\\text\{([^}]+)\}/g, '$1');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      const solLines = doc.splitTextToSize(cleanSolution, contentWidth - 4);
      checkPageBreak(solLines.length * 4 + 6);
      doc.text(solLines, margin + 2, y);
      y += solLines.length * 4 + 7;
    }

    // Divider line between questions
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
  });

  // Footer on last page
  checkPageBreak(12);
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Generated by Mission Jeet / DRONA AI Examination Platform • For personal preparation only.', margin, y + 4);

  // Trigger Save
  const safeTitle = session.title.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${safeTitle}_Paper_Solutions.pdf`);
}
