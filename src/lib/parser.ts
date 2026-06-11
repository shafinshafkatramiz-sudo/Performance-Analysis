import * as XLSX from 'xlsx';

export interface ParsedData {
  headers: string[];
  dateColumns: string[];
  recentMonths: string[];
  quarterEndColumns: string[];
  rows: any[];
  mapping: Record<string, string>;
}

const targetMetricsList = [
  "New Loan Disbursed",
  "Amount of New Loan Disbursed",
  "Total Loan Disbursed",
  "Total Amount of Loan Disbursed",
  "Loan Disbursed (Cumulative till Date)",
  "Amount of Loan Disbursed (Cumulative till Date)",
  "Total Outstanding",
  "Current Outstanding",
  "Amount of Total OD",
  "Closing Security Deposit Balance",
  "Per FO Total Outstanding",
  "PAR>30",
  "No. of Branches",
  "No. of Centers",
  "No. of FO/SFO/CO/SCO",
  "Member Admission",
  "Member Dropouts",
  "Total Member",
  "Current Borrowers",
  "Per FO Total Borrowers",
  "Avg. Member Per Center"
];

const monthRegex = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i;
const quarterMonthRegex = /(mar|jun|sep|dec)/i;

export function parseExcelFile(file: File): Promise<ParsedData | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        if (!workbook.SheetNames.includes('All')) {
          throw new Error('Sheet "All" not found in the uploaded Excel file.');
        }

        const worksheet = workbook.Sheets['All'];
        let rows = XLSX.utils.sheet_to_json(worksheet, { range: 1, defval: 0 }) as any[];
        
        if (rows.length === 0) {
            rows = XLSX.utils.sheet_to_json(worksheet, { defval: 0 }) as any[];
        }

        if (rows.length === 0) {
            throw new Error('No data found in the "All" sheet.');
        }

        const raw_rows = XLSX.utils.sheet_to_json(worksheet, { range: 1, raw: false, defval: 0 }) as any[];
        let headers = Object.keys(raw_rows[0] || {});
        let dateColumns = headers.filter(key => monthRegex.test(key));
        
        if (dateColumns.length === 0) {
           dateColumns = headers.filter(key => {
               return /\\d{1,4}[-/]\\d{1,2}[-/]\\d{1,4}/.test(key) || /\\d{4}/.test(key);
           });
        }

        dateColumns = dateColumns.filter(c => !/(total|key|indicator|sl|no|particulars|name|details)/i.test(c));

        const parseColDate = (col: string) => {
            const mMatch = col.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i);
            let yMatch = col.match(/\b(20\d{2}|\d{2})\b/);
            if (!yMatch) yMatch = col.match(/\d{2,4}/);
            if (mMatch && yMatch) {
               const m = mMatch[1];
               let y = yMatch[0];
               if (y.length === 2) y = '20' + y;
               return new Date(`${m} 1, ${y}`);
            }
            return new Date(0);
        };

        dateColumns.sort((a, b) => parseColDate(a).getTime() - parseColDate(b).getTime());

        const quarterMonthsRegex = /(mar|jun|sep|dec)/i;
        const allQuarterEnds = dateColumns.filter(c => quarterMonthsRegex.test(c));
        
        let recentMonths: string[] = [];
        if (dateColumns.length > 0) {
            const latestCol = dateColumns[dateColumns.length - 1];
            if (quarterMonthsRegex.test(latestCol)) {
                recentMonths = allQuarterEnds.slice(-5);
            } else {
                let lastQEIndex = -1;
                for (let i = dateColumns.length - 1; i >= 0; i--) {
                    if (quarterMonthsRegex.test(dateColumns[i])) {
                        lastQEIndex = i;
                        break;
                    }
                }
                
                let subsequentMonths = [];
                let precedingQEs = allQuarterEnds;
                
                if (lastQEIndex !== -1) {
                    subsequentMonths = dateColumns.slice(lastQEIndex + 1);
                } else {
                    subsequentMonths = dateColumns;
                }
                
                const neededQEs = 5 - subsequentMonths.length;
                if (neededQEs > 0) {
                    recentMonths = precedingQEs.slice(-neededQEs).concat(subsequentMonths);
                } else {
                    recentMonths = subsequentMonths.slice(-5);
                }
            }
        }

        const quarterEndColumns = allQuarterEnds;
        const finalRows = XLSX.utils.sheet_to_json(worksheet, { range: 1, raw: true, defval: 0 }) as any[];

        // Extract unique indicators for AI mapping
        const allIndicators = new Set<string>();
        finalRows.forEach(r => {
           for (const val of Object.values(r)) {
              if (typeof val === 'string' && val.length > 3 && !['Total', 'Group', 'Enterprise'].includes(val.trim())) {
                  allIndicators.add(val.trim());
              }
           }
        });

        // Call our Express backend to map intelligently with Gemini
        let mapping = {};
        try {
            const apiRes = await fetch('/api/map-indicators', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    indicators: Array.from(allIndicators),
                    targets: targetMetricsList
                })
            });
            if (apiRes.ok) {
                const resData = await apiRes.json();
                if (resData.mapping) {
                    mapping = resData.mapping;
                }
            }
        } catch (err) {
            console.error("AI mapping fallback:", err);
            // Fallback to empty mapping, the extractRow function will still use manual regex search as fallback
        }

        resolve({
          headers,
          dateColumns,
          recentMonths,
          quarterEndColumns,
          rows: finalRows,
          mapping
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}

export function extractRow(
  data: any[], 
  dataKey: string, 
  indicatorMatches: (string | string[])[], 
  mappedIndicatorName?: string
) {
  let literalExactCandidates: any[] = [];
  let aiExactCandidates: any[] = [];
  let partialCandidates: any[] = [];

  data.forEach(row => {
    let isLiteralExact = false;
    let isAiExact = false;
    let isPartial = false;

    Object.values(row).forEach(v => {
      if (typeof v === 'string') {
        const trimmed = v.trim();
        const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Exact match check
        const exactMatch = indicatorMatches.find(m => !Array.isArray(m) && normalized === String(m).toLowerCase().replace(/[^a-z0-9]/g, ''));
        if (exactMatch) isLiteralExact = true;

        if (mappedIndicatorName && trimmed === mappedIndicatorName) {
            isAiExact = true;
        }

        // Partial match check
        const partialMatch = indicatorMatches.find(matchPattern => {
          if (Array.isArray(matchPattern)) {
             return matchPattern.every(m => normalized.includes(m.toLowerCase().replace(/[^a-z0-9]/g, '')));
          } else {
             const mNormalized = matchPattern.toLowerCase().replace(/[^a-z0-9]/g, '');
             return normalized.includes(mNormalized);
          }
        });

        if (partialMatch) isPartial = true;
      }
    });

    if (isLiteralExact) literalExactCandidates.push(row);
    else if (isAiExact) aiExactCandidates.push(row);
    else if (isPartial) partialCandidates.push(row);
  });

  const checkDataKey = (row: any) => {
    const firstKey = Object.keys(row)[0];
    const firstVal = String(row[firstKey] || '').trim().toLowerCase();
    if (firstVal === dataKey.toLowerCase()) return true;
    if (row['Data Key'] && String(row['Data Key']).trim().toLowerCase() === dataKey.toLowerCase()) return true;
    if (row['Data_Key'] && String(row['Data_Key']).trim().toLowerCase() === dataKey.toLowerCase()) return true;
    return false;
  };

  const match1 = literalExactCandidates.find(checkDataKey);
  if (match1) return match1;

  const match2 = aiExactCandidates.find(checkDataKey);
  if (match2) return match2;

  const match3 = partialCandidates.find(checkDataKey);
  if (match3) return match3;

  if (literalExactCandidates.length > 0) return literalExactCandidates[0];
  if (aiExactCandidates.length > 0) return aiExactCandidates[0];
  if (partialCandidates.length > 0) return partialCandidates[0];

  return undefined;
}
