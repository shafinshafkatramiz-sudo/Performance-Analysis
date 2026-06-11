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
  const targetWidth = pageWidth - (margin * 2);
  const scaleRatioTables = targetWidth / canvasTables.width;
  let imgHeightTables = canvasTables.height * scaleRatioTables;

  let currentY = margin + 20;

  // Make sure tables fit on the page without vertical scrolling/cropping
  const maxAvailHeightTables = pageHeight - currentY - 15; // 15 to leave room for footer
  let adjustedWidthTables = targetWidth;

  if (imgHeightTables > maxAvailHeightTables) {
      const heightRatio = maxAvailHeightTables / imgHeightTables;
      imgHeightTables = maxAvailHeightTables;
      adjustedWidthTables = adjustedWidthTables * heightRatio;
  }

  const xOffsetTables = margin + (targetWidth - adjustedWidthTables) / 2;

  pdf.addImage(imgDataTables, 'PNG', xOffsetTables, currentY, adjustedWidthTables, imgHeightTables);
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
  const chartContainers = document.querySelectorAll('.chart-container');
  
  if (chartContainers.length === 3) {
      // Specifically handle our 3 charts side-by-side
      const spacing = 5; // mm
      const chartWidth = (targetWidth - (spacing * 2)) / 3;
      let currentX = margin;

      for (let i = 0; i < chartContainers.length; i++) {
          const el = chartContainers[i] as HTMLElement;
          const canvasChart = await html2canvas(el, {
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff'
          });
          const imgDataChart = canvasChart.toDataURL('image/png');
          const imgHeightChart = canvasChart.height * (chartWidth / canvasChart.width);
          
          pdf.addImage(imgDataChart, 'PNG', currentX, currentY, chartWidth, imgHeightChart);
          currentX += chartWidth + spacing;
      }
  } else if (chartContainers.length > 0) {
      // Fallback for general case side-by-side
      const spacing = 5;
      const chartWidth = (targetWidth - spacing) / 2;
      let currentX = margin;
      let rowY = currentY;
      let maxHeightInRow = 0;

      for (let i = 0; i < chartContainers.length; i++) {
          const el = chartContainers[i] as HTMLElement;
          const canvasChart = await html2canvas(el, {
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff'
          });
          const imgDataChart = canvasChart.toDataURL('image/png');
          const imgHeightChart = canvasChart.height * (chartWidth / canvasChart.width);
          
          pdf.addImage(imgDataChart, 'PNG', currentX, rowY, chartWidth, imgHeightChart);
          
          if (imgHeightChart > maxHeightInRow) maxHeightInRow = imgHeightChart;
          
          currentX += chartWidth + spacing;
          if ((i + 1) % 2 === 0) { // wrap every 2
              currentX = margin;
              rowY += maxHeightInRow + spacing;
              maxHeightInRow = 0;
          }
      }
  } else {
      // Original fallback if the classes are somehow missing
      const canvasCharts = await html2canvas(chartsContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgDataCharts = canvasCharts.toDataURL('image/png');
      const scaleRatioCharts = targetWidth / canvasCharts.width;
      let imgHeightCharts = canvasCharts.height * scaleRatioCharts;

      const maxAvailHeight = pageHeight - currentY - 10;
      let adjustedWidth = targetWidth;

      if (imgHeightCharts > maxAvailHeight) {
          const heightRatio = maxAvailHeight / imgHeightCharts;
          imgHeightCharts = maxAvailHeight;
          adjustedWidth = adjustedWidth * heightRatio;
      }

      const xOffset = margin + (targetWidth - adjustedWidth) / 2;
      pdf.addImage(imgDataCharts, 'PNG', xOffset, currentY, adjustedWidth, imgHeightCharts);
  }

  addFooter(pdf);

  pdf.save(`SAJIDA_Performance_Report_${latestMonth}.pdf`);
}
