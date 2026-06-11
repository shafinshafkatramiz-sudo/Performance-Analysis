import { extractRow } from './src/lib/parser';

const data = [
  {"Data Key": "Total", "No": 18, "datakeyname": " Total Amount of Loan Realisation (Month) ", "24-Apr": "8,469,668"},
  {"Data Key": "Total", "No": 19, "datakeyname": " No. of Total OD Realization ", "24-Apr": " -   "},
  {"Data Key": "Total", "No": 20, "datakeyname": " Amount of Total OD Realization ", "24-Apr": " -   "},
  {"Data Key": "Total", "No": 29, "datakeyname": " Amount of Total OD ", "24-Apr": "2,645,833"}
];

const row = extractRow(data, 'Total', ['Amount of Total OD', ['total', 'od', 'amount'], ['amount', 'total', 'od'], 'total od', 'overdue', ['amount', 'overdue'], ['total', 'od']]);

console.log("EXTRACTED ROW:", row);
