import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function generatePDF(exchangeRate: number, latestMonth: string) {
  // Wait a little for any animations or state updates to settle
  await new Promise(resolve => setTimeout(resolve, 100));

  const chartsContainer = document.getElementById('dashboard-charts');

  if (!chartsContainer) {
    throw new Error('Dashboard charts container not found');
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
  const targetWidth = pageWidth - (margin * 2);
  
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

  // 2. Generate Tables using autoTable
  let currentY = margin + 20;

  // Table 1
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  pdf.text('TABLE 1: FINANCIAL OUTCOMES', margin, currentY);
  currentY += 4;
  
  autoTable(pdf, {
      html: '#table1-pdf',
      startY: currentY,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 1.5, textColor: [0, 0, 0], lineColor: [200, 200, 200], lineWidth: 0.1 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      margin: { left: margin, right: margin }
  });
  
  currentY = (pdf as any).lastAutoTable.finalY + 8;

  // Check if we need space for next two tables alongside each other,
  // Actually autoTable draws tables. If we want them side-by-side, we can use `margin` and `tableWidth`.
  // Half width
  const halfWidth = (pageWidth - (margin * 2) - 5) / 2;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text('TABLE 2: OPERATIONAL EFFICIENCY', margin, currentY);
  pdf.text('TABLE 3: PRODUCT COMPOSITION', margin + halfWidth + 5, currentY);
  currentY += 3;

  autoTable(pdf, {
      html: '#table2-pdf',
      startY: currentY,
      theme: 'grid',
      tableWidth: halfWidth,
      styles: { fontSize: 8.5, cellPadding: 1.5, textColor: [0, 0, 0], lineColor: [200, 200, 200], lineWidth: 0.1 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      margin: { left: margin, right: margin + halfWidth + 5 }
  });

  autoTable(pdf, {
      html: '#table3-pdf',
      startY: currentY,
      theme: 'grid',
      tableWidth: halfWidth,
      styles: { fontSize: 8.5, cellPadding: 1.5, textColor: [0, 0, 0], lineColor: [200, 200, 200], lineWidth: 0.1 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      margin: { left: margin + halfWidth + 5, right: margin }
  });

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
  
  if (chartContainers.length > 0) {
      // 2 charts side-by-side
      const spacing = 10;
      const chartWidth = (targetWidth - spacing) / 2;
      let currentX = margin;
      let rowY = currentY;
      let maxHeightInRow = 0;

      let lastImgHeight = 0;

      for (let i = 0; i < chartContainers.length; i++) {
          const el = chartContainers[i] as HTMLElement;
          const origCssText = el.style.cssText;
          
          // Force fixed dimensions for rendering consistency across all screens
          el.style.width = '850px';
          el.style.height = '480px';
          el.style.position = 'absolute';
          el.style.top = '0';
          el.style.left = '0';
          el.style.zIndex = '-999';
          el.style.background = '#ffffff';

          // Let Recharts catch the resize
          await new Promise(r => setTimeout(r, 200));

          const canvasChart = await html2canvas(el, {
              scale: 2, // sufficient given the 850px base width
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff'
          });

          // Restore normal flow
          el.style.cssText = origCssText;
          await new Promise(r => setTimeout(r, 50));

          const imgDataChart = canvasChart.toDataURL('image/jpeg', 0.95);
          const imgHeightChart = canvasChart.height * (chartWidth / canvasChart.width);
          lastImgHeight = imgHeightChart;
          
          let xOffset = currentX;

          pdf.addImage(imgDataChart, 'JPEG', xOffset, rowY, chartWidth, imgHeightChart);
          
          if (imgHeightChart > maxHeightInRow) maxHeightInRow = imgHeightChart;
          
          currentX += chartWidth + spacing;
          if ((i + 1) % 2 === 0) { // wrap every 2
              currentX = margin;
              rowY += maxHeightInRow + spacing;
              maxHeightInRow = 0;
          }
      }

      // If we rendered an odd number of charts (like 3), draw the summary box to the right of the 3rd one.
      if (chartContainers.length % 2 !== 0) {
          const summaryText = (document.getElementById('pdf-summary') as HTMLTextAreaElement)?.value || '';
          
          const summaryX = currentX; 
          const summaryHeight = lastImgHeight; // same height as the chart adjacent to it
          
          pdf.setFillColor(248, 250, 252); // slate-50
          pdf.setDrawColor(226, 232, 240); // slate-200
          pdf.setLineWidth(0.5);
          pdf.roundedRect(summaryX, rowY, chartWidth, summaryHeight, 2, 2, 'FD');

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(100, 116, 139); // slate-500
          pdf.text('EXECUTIVE SUMMARY', summaryX + 5, rowY + 8);

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(51, 65, 85); // slate-700
          
          const splitText = pdf.splitTextToSize(summaryText, chartWidth - 10);
          pdf.text(splitText, summaryX + 5, rowY + 14);
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
