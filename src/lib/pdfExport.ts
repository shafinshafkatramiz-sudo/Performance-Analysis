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
  const margin = 8;
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
  pdf.setFontSize(18);
  pdf.setTextColor(0, 76, 151); // SAJIDA Blue
  pdf.text('SAJIDA MICROFINANCE LIMITED', pageWidth / 2, margin + 5, { align: 'center' });
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(14);
  pdf.setTextColor(100);
  pdf.text(`Performance Report as of ${latestMonth}`, pageWidth / 2, margin + 12, { align: 'center' });

  // 2. Generate Tables using autoTable
  let currentY = margin + 18;

  // Table 1
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(100);
  pdf.text('TABLE 1: FINANCIAL OUTCOMES', margin, currentY);
  currentY += 3;
  
  autoTable(pdf, {
      html: '#table1-pdf',
      startY: currentY,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 1.2, textColor: [0, 0, 0], lineColor: [200, 200, 200], lineWidth: 0.1 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      margin: { left: margin, right: margin, bottom: margin }
  });
  
  currentY = (pdf as any).lastAutoTable.finalY + 6;

  // Check if we need space for next two tables alongside each other,
  // Actually autoTable draws tables. If we want them side-by-side, we can use `margin` and `tableWidth`.
  // Half width
  const halfWidth = (pageWidth - (margin * 2) - 5) / 2;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);
  pdf.text('TABLE 2: OPERATIONAL EFFICIENCY', margin, currentY);
  pdf.text('TABLE 3: PRODUCT COMPOSITION', margin + halfWidth + 5, currentY);
  currentY += 3;

  const table2And3StartY = Math.max(currentY, (pdf as any).lastAutoTable.finalY || currentY);
  const startPageNumForTables = pdf.getCurrentPageInfo().pageNumber;

  // Render Table 2 on the left side
  autoTable(pdf, {
      html: '#table2-pdf',
      startY: table2And3StartY,
      theme: 'grid',
      tableWidth: halfWidth,
      styles: { fontSize: 9, cellPadding: 1.2, textColor: [0, 0, 0], lineColor: [200, 200, 200], lineWidth: 0.1 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      margin: { left: margin, right: margin + halfWidth + 5, bottom: margin }
  });

  const table2FinalPage = pdf.getCurrentPageInfo().pageNumber;
  const table2FinalY = (pdf as any).lastAutoTable.finalY;

  // Restore the starting page context before drawing Table 3
  pdf.setPage(startPageNumForTables);

  // Render Table 3 on the right side
  autoTable(pdf, {
      html: '#table3-pdf',
      startY: table2And3StartY,
      theme: 'grid',
      tableWidth: halfWidth,
      styles: { fontSize: 9, cellPadding: 1.2, textColor: [0, 0, 0], lineColor: [200, 200, 200], lineWidth: 0.1 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      margin: { left: margin + halfWidth + 5, right: margin, bottom: margin }
  });

  const table3FinalPage = pdf.getCurrentPageInfo().pageNumber;
  const table3FinalY = (pdf as any).lastAutoTable.finalY + 6;

  // Fast forward to the deepest page and calculate currentY
  const finalPage = Math.max(table2FinalPage, table3FinalPage);
  pdf.setPage(finalPage);
  currentY = finalPage === table2FinalPage && finalPage === table3FinalPage
      ? Math.max(table2FinalY, table3FinalY)
      : (finalPage === table2FinalPage ? table2FinalY : table3FinalY);

  addFooter(pdf);

  // 3. Page Break for Charts
  pdf.addPage();
  currentY = margin;
  
  // Title for charts page maybe? 
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
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
              backgroundColor: '#ffffff',
              onclone: (clonedDoc) => {
                  const texts = clonedDoc.querySelectorAll('text');
                  texts.forEach(t => {
                      t.setAttribute('fill', '#0f172a');
                      (t as any).style.fill = '#0f172a';
                      (t as any).style.fontWeight = 'bold';
                  });
                  const lines = clonedDoc.querySelectorAll('.recharts-cartesian-grid line, .recharts-cartesian-axis-line');
                  lines.forEach(l => {
                      l.setAttribute('stroke', '#64748b');
                      (l as any).style.stroke = '#64748b';
                  });
              }
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
