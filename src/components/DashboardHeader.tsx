import React, { useRef, useState } from 'react';
import { useDashboard } from '../lib/store';
import { parseExcelFile } from '../lib/parser';
import { generatePDF } from '../lib/pdfExport';

export function DashboardHeader() {
  const { data, setData, exchangeRate, setExchangeRate, theme, setTheme, selectedEndMonth, setSelectedEndMonth } = useDashboard();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const parsedData = await parseExcelFile(file);
      setData(parsedData);
      
      // Reset input so same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      alert(`Error parsing Excel file: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await generatePDF(exchangeRate, selectedEndMonth || 'Latest');
    } catch (err) {
      console.error(err);
      alert('Error generating PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header className="bg-[#004C97] dark:bg-gray-900 text-white h-14 px-6 flex items-center justify-between shadow-md shrink-0 print-hide">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded flex items-center justify-center text-[#004C97] dark:text-white font-bold">
          S
        </div>
        <h1 className="text-lg font-bold tracking-tight uppercase">Sajida Microfinance <span className="font-light opacity-80">| Performance Dashboard</span></h1>
      </div>

      <div className="flex items-center gap-6">
        {/* Period Selector */}
        {data && data.dateColumns && data.dateColumns.length > 0 && (
          <div className="flex items-center bg-[#003a75] dark:bg-gray-800 px-3 py-1.5 rounded border border-white/10 dark:border-gray-700">
            <label htmlFor="end-month" className="text-[10px] uppercase font-bold opacity-70 mr-3 whitespace-nowrap">
              Reporting End
            </label>
            <select
              id="end-month"
              value={selectedEndMonth ?? ''}
              onChange={(e) => setSelectedEndMonth(e.target.value)}
              className="bg-transparent border-none text-white text-xs focus:ring-0 outline-none cursor-pointer"
            >
              {data.dateColumns.map(m => (
                <option key={m} value={m} className="text-black dark:text-gray-900">
                  {m}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Exchange Rate Input */}
        <div className="flex items-center bg-[#003a75] dark:bg-gray-800 px-3 py-1.5 rounded border border-white/10 dark:border-gray-700">
          <label htmlFor="exchange-rate" className="text-[10px] uppercase font-bold opacity-70 mr-3 whitespace-nowrap">
            UGX to USD Rate
          </label>
          <input
            id="exchange-rate"
            type="number"
            step="0.1"
            value={exchangeRate}
            onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
            className="bg-transparent border-none text-white font-mono w-20 text-sm focus:ring-0 outline-none text-right"
          />
        </div>

        {/* Theme & Actions */}
        <div className="flex items-center gap-2 text-sm">
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="bg-[#003a75] dark:bg-gray-800 border border-white/10 dark:border-gray-700 text-white rounded px-2 py-1 text-xs focus:outline-none cursor-pointer"
          >
            <option value="corporate">Corporate Theme</option>
            <option value="modern-dark">Modern Dark</option>
            <option value="print-safe">Print-Safe</option>
          </select>

          <input
            type="file"
            accept=".xlsx, .xls"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-1 rounded text-xs transition disabled:opacity-50"
          >
            {isUploading ? 'PARSING...' : 'UPLOAD DATA'}
          </button>
          
          <button
            onClick={handleExport}
            disabled={!data || isExporting}
            className="bg-white dark:bg-gray-700 text-[#004C97] dark:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 font-bold px-3 py-1 rounded text-xs transition"
          >
            {isExporting ? 'GENERATING...' : 'EXPORT PDF'}
          </button>
        </div>
      </div>
    </header>
  );
}
