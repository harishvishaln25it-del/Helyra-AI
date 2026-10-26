import { jsPDF } from 'jspdf';
import { UserProfile, FamilyGroup, MedicationItem } from '../types';

interface PDFReportOptions {
  period: 'daily' | 'weekly' | 'monthly';
  user: UserProfile;
  family: FamilyGroup;
  medications: MedicationItem[];
  stats: {
    steps: number;
    stepGoal: number;
    waterMl: number;
    waterGoalMl: number;
    sleepMinutes: number;
    caloriesKcal: number;
    addedSugarGrams: number;
    sugarGoalGrams: number;
    weightKg: number;
  };
  aiSummary: string;
  adherencePercent: number;
  keyWins: string[];
  nextWeekFocus: string[];
  language: string;
}

export function generateHealthReportPDF(options: PDFReportOptions) {
  const {
    period,
    user,
    family,
    medications,
    stats,
    aiSummary,
    adherencePercent,
    keyWins,
    nextWeekFocus
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 16;

  // Header Banner
  doc.setFillColor(13, 148, 136); // Teal 600
  doc.rect(margin, y, contentWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('HELYRA HEALTH ASSISTANT', margin + 6, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const periodLabel = period.toUpperCase() + ' CLINICAL HEALTH & WELLNESS REPORT';
  doc.text(periodLabel, margin + 6, y + 18);

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  doc.text(`Generated: ${dateStr}`, pageWidth - margin - 6, y + 18, { align: 'right' });

  y += 30;

  // Patient Profile Section
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 28, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 28, 'S');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PATIENT PROFILE', margin + 5, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  doc.text(`Name: ${user.name}`, margin + 5, y + 14);
  doc.text(`Age / Gender: ${user.age} yrs / ${user.gender}`, margin + 5, y + 21);

  const conditionsStr = user.medicalConditions?.length ? user.medicalConditions.join(', ') : 'None reported';
  doc.text(`Conditions: ${conditionsStr.substring(0, 30)}`, margin + 65, y + 14);
  doc.text(`Emergency: ${user.emergencyContact.name} (${user.emergencyContact.phone})`, margin + 65, y + 21);

  doc.text(`Med Adherence: ${adherencePercent}%`, margin + 130, y + 14);
  doc.text(`Family Portal: ${family?.name || 'Family Circle'}`, margin + 130, y + 21);

  y += 34;

  // Key Vitals & Activity Metrics
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('DAILY VITALS & BIOMETRIC SUMMARY', margin, y);
  y += 4;

  const colWidth = contentWidth / 4;
  const metrics = [
    { label: 'Steps Tracked', val: `${stats.steps.toLocaleString()} / ${stats.stepGoal.toLocaleString()}` },
    { label: 'Hydration', val: `${(stats.waterMl / 1000).toFixed(1)} L / ${(stats.waterGoalMl / 1000).toFixed(1)} L` },
    { label: 'Calories Burned', val: `${stats.caloriesKcal} kcal` },
    { label: 'Sleep Rest', val: `${(stats.sleepMinutes / 60).toFixed(1)} hrs` }
  ];

  metrics.forEach((m, idx) => {
    const x = margin + idx * colWidth;
    doc.setFillColor(241, 245, 249);
    doc.rect(x, y, colWidth - 2, 16, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(x, y, colWidth - 2, 16, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, x + 3, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(m.val, x + 3, y + 12);
  });

  y += 22;

  // Medication Adherence & Schedule
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('MEDICATION SCHEDULE & STATUS', margin, y);
  y += 5;

  // Table header
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('MEDICATION', margin + 3, y + 5);
  doc.text('DOSAGE', margin + 55, y + 5);
  doc.text('TIMING', margin + 85, y + 5);
  doc.text('INSTRUCTIONS', margin + 115, y + 5);
  doc.text('STATUS', margin + 155, y + 5);

  y += 7;

  medications.forEach((med, i) => {
    doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 7, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(med.name || 'Medication', margin + 3, y + 5);
    doc.text(med.dose || 'Standard', margin + 55, y + 5);
    doc.text(med.scheduledTime || 'Scheduled', margin + 85, y + 5);
    doc.text(med.doctorInstructions || 'With water', margin + 115, y + 5);

    doc.setFont('helvetica', 'bold');
    if (med.status === 'taken') {
      doc.setTextColor(5, 150, 105);
      doc.text('TAKEN', margin + 155, y + 5);
    } else {
      doc.setTextColor(217, 119, 6);
      doc.text('PENDING', margin + 155, y + 5);
    }
    y += 7;
  });

  y += 7;

  // AI Clinical Synthesis
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('AI CLINICAL SYNTHESIS & INSIGHTS', margin, y);
  y += 5;

  doc.setFillColor(240, 253, 250); // Teal 50
  doc.setDrawColor(153, 246, 228);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  const cleanAiSummary = (aiSummary || '').replace(/[^\x00-\x7F]/g, '');
  const splitSummary = doc.splitTextToSize(cleanAiSummary || 'Patient exhibits steady adherence across tracked parameters.', contentWidth - 8);
  const summaryHeight = Math.max(14, splitSummary.length * 4.5 + 6);

  doc.rect(margin, y, contentWidth, summaryHeight, 'F');
  doc.rect(margin, y, contentWidth, summaryHeight, 'S');
  doc.text(splitSummary, margin + 4, y + 6);

  y += summaryHeight + 7;

  // Key Wins & Next Focus
  const halfCol = (contentWidth - 4) / 2;

  // Key Wins
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, halfCol, 36, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, halfCol, 36, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('KEY ACCOMPLISHMENTS', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  let winY = y + 13;
  (keyWins || []).forEach((win) => {
    const cleanWin = win.replace(/[^\x00-\x7F]/g, '');
    const lines = doc.splitTextToSize(`* ${cleanWin}`, halfCol - 8);
    doc.text(lines, margin + 4, winY);
    winY += lines.length * 4.2;
  });

  // Next Focus
  const rightX = margin + halfCol + 4;
  doc.setFillColor(248, 250, 252);
  doc.rect(rightX, y, halfCol, 36, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(rightX, y, halfCol, 36, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('CLINICAL RECOMMENDATIONS', rightX + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  let focusY = y + 13;
  (nextWeekFocus || []).forEach((focus) => {
    const cleanFocus = focus.replace(/[^\x00-\x7F]/g, '');
    const lines = doc.splitTextToSize(`* ${cleanFocus}`, halfCol - 8);
    doc.text(lines, rightX + 4, focusY);
    focusY += lines.length * 4.2;
  });

  y += 42;

  // Family Members Portal Summary
  if (family?.members && family.members.length > 0) {
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`CONNECTED FAMILY PORTAL: ${(family.name || 'Family').toUpperCase()}`, margin, y);
    y += 4;

    family.members.forEach((m) => {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, y, contentWidth, 8, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(`${m.name} (${m.relationship}):`, margin + 3, y + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(
        `Steps: ${m.stepsToday.toLocaleString()}  |  Hydration: ${m.waterPercent}%  |  Meds: ${m.medsTaken}/${m.medsTotal}  |  Sleep: ${m.sleepHours}h`,
        margin + 60,
        y + 5.5
      );
      y += 9;
    });
  }

  // Footer Disclaimer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  const footerText = 'CONFIDENTIAL CLINICAL SUMMARY: Generated by HELYRA Autonomous Health & Family Care Platform. For personal tracking and consultation with your physician.';
  doc.text(footerText, margin, 288);

  // Save the PDF file
  const fileName = `Helyra_Health_Report_${user.name.replace(/\s+/g, '_')}_${period}_${Date.now()}.pdf`;
  doc.save(fileName);
  return fileName;
}
