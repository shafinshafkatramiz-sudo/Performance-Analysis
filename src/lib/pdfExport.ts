import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function generatePDF(exchangeRate: number, latestMonth: string) {
  // Wait a little for any animations or state updates to settle
  await new Promise(resolve => setTimeout(resolve, 100));

  const tablesContainer = document.getElementById('dashboard-tables');
  const chartsContainer = document.getElementById('dashboard-charts');

  if (!tablesContainer || !chartsContainer) {
    throw new Error('Dashboard containers not found');
  }

  // Create A4 Landscape PDF
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  
  // Footer helper
  const addFooter = (doc: jsPDF) => {
    doc.setFontSize(8);
    doc.setTextColor(100);
    const text = `Dynamic Exchange Rate Applied: 1 USD = ${exchangeRate} UGX`;
    const textWidth = doc.getTextWidth(text);
    doc.text(text, pageWidth - margin - textWidth, pageHeight - 5);
  };

  // 1. Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(0, 76, 151); // SAJIDA Blue
  pdf.text('SAJIDA MICROFINANCE LIMITED', pageWidth / 2, margin + 5, { align: 'center' });
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  pdf.setTextColor(100);
  pdf.text(`Performance Report as of ${latestMonth}`, pageWidth / 2, margin + 12, { align: 'center' });

  // 2. Capture Tables
  const canvasTables = await html2canvas(tablesContainer, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff' // Force white background for PDF
  });

  const imgDataTables = canvasTables.toDataURL('image/png');
  // Target width is page width minus margins
  const targetWidth = pageWidth - (margin * 2);
  const scaleRatioTables = targetWidth / canvasTables.width;
  const imgHeightTables = canvasTables.height * scaleRatioTables;

  let currentY = margin + 20;

  // Wait, if tables are very long, they might exceed page height. But usually 3 simple tables fit in landscape A4 if scaled.
  // We'll just place it. If it overflows, it might be cropped. A4 height is 210mm. Y is already ~30. Room left is ~170mm.
  pdf.addImage(imgDataTables, 'PNG', margin, currentY, targetWidth, imgHeightTables);
  addFooter(pdf);

  // 3. Page Break for Charts
  pdf.addPage();
  currentY = margin;
  
  // Title for charts page maybe? 
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(0, 76, 151);
  pdf.text('Visual Analysis', margin, currentY + 5);
  currentY += 10;

  // Hide the charts heading momentarily for cleaner capture if needed, but it's fine
  // Capture Charts
  const canvasCharts = await html2canvas(chartsContainer, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff'
  });

  const imgDataCharts = canvasCharts.toDataURL('image/png');
  const scaleRatioCharts = targetWidth / canvasCharts.width;
  let imgHeightCharts = canvasCharts.height * scaleRatioCharts;

  // Make sure charts fit on the page without vertical scrolling/cropping
  const maxAvailHeight = pageHeight - currentY - 10;
  let adjustedWidth = targetWidth;

  if (imgHeightCharts > maxAvailHeight) {
      // Scale down proportionally to fit the height
      const heightRatio = maxAvailHeight / imgHeightCharts;
      imgHeightCharts = maxAvailHeight;
      adjustedWidth = adjustedWidth * heightRatio;
  }

  // Center horizontally if we scaled down width
  const xOffset = margin + (targetWidth - adjustedWidth) / 2;

  pdf.addImage(imgDataCharts, 'PNG', xOffset, currentY, adjustedWidth, imgHeightCharts);
  addFooter(pdf);

  pdf.save(`SAJIDA_Performance_Report_${latestMonth}.pdf`);
}
