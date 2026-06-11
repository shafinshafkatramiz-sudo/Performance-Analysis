import React from 'react';
import { useDashboard } from '../lib/store';
import { extractRow } from '../lib/parser';
import { formatUSD, formatCount, formatPercent, cn, getFilteredMonths } from '../lib/utils';

export function DashboardTables() {
  const { data, exchangeRate, theme, selectedEndMonth } = useDashboard();

  if (!data || !data.rows || data.rows.length === 0) {
    return <div className="p-8 text-center text-gray-500">No data available. Please upload an Excel file.</div>;
  }

  const { rows } = data;
  const recentMonths = getFilteredMonths(data.dateColumns, selectedEndMonth);

  // Render Table helper
  const renderTable = (
    title: string,
    mappings: { destLabel: string; searchKeys: (string | string[])[]; type: 'usd' | 'count' | 'percent' | 'percentMultiplied', groupKey?: string }[],
    id: string
  ) => {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-md shadow-sm border border-slate-200 dark:border-gray-700 flex flex-col shrink-0 table-container">
        <div className="px-4 py-2 bg-slate-50 dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-[11px] font-bold uppercase text-slate-500 dark:text-gray-400">
            {title}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table id={id} className="w-full text-left text-[11px] border-collapse">
            <thead className="bg-white dark:bg-gray-800 sticky top-0 z-10">
              <tr className="border-b border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900">
                <th className="p-2 font-semibold text-slate-700 dark:text-gray-300">Indicator Metric</th>
                {recentMonths.map((m, i) => (
                  <th key={m} className={`p-2 text-right ${i === recentMonths.length - 1 ? 'font-bold text-slate-800 dark:text-gray-200' : 'opacity-60 italic text-slate-600 dark:text-gray-400'}`}>
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-700/50">
              {mappings.map((mapping, idx) => {
                const rowData = extractRow(rows, mapping.groupKey || 'Total', mapping.searchKeys, data.mapping?.[mapping.destLabel]);
                return (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-gray-700/50">
                    <td className="p-2 font-medium text-slate-800 dark:text-gray-200">{mapping.destLabel}</td>
                    {recentMonths.map((m, i) => {
                      const rawValue = rowData ? rowData[m] : undefined;
                      let formatted = '-';
                      if (mapping.type === 'usd') formatted = formatUSD(rawValue, exchangeRate);
                      else if (mapping.type === 'count') formatted = formatCount(rawValue);
                      else if (mapping.type === 'percent') formatted = formatPercent(rawValue, false);
                      else if (mapping.type === 'percentMultiplied') formatted = formatPercent(rawValue, true);
                      
                      return (
                        <td key={m} className={`p-2 text-right ${i === recentMonths.length - 1 ? 'font-bold text-slate-800 dark:text-gray-200' : 'text-slate-600 dark:text-gray-400'}`}>
                          {formatted}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  const table1Mappings: { destLabel: string; searchKeys: (string | string[])[]; type: 'usd' | 'count' | 'percent' | 'percentMultiplied', groupKey?: string }[] = [
    { destLabel: 'New Loan Disbursed', searchKeys: [['loan', 'disbursed', 'new', 'no'], ['loan', 'disbursed', 'new', 'number'], ['noofloandisbursed', 'new']], type: 'count' as const },
    { destLabel: 'Amount of New Loan Disbursed', searchKeys: [['loan', 'disbursed', 'new', 'amount'], ['amountofloandisbursed', 'new']], type: 'usd' as const },
    { destLabel: 'Total Loan Disbursed', searchKeys: [['loan', 'disbursed', 'total', 'no'], ['loan', 'disbursed', 'total', 'number'], ['noofloandisbursed', 'total']], type: 'count' as const },
    { destLabel: 'Total Amount of Loan Disbursed', searchKeys: [['loan', 'disbursed', 'total', 'amount'], ['amountofloandisbursed', 'total']], type: 'usd' as const },
    { destLabel: 'Loan Disbursed (Cumulative till Date)', searchKeys: [['loan', 'disbursed', 'year', 'no'], ['loan', 'disbursed', 'cum', 'no'], ['noofloandisbursed', 'yeartodate'], ['noofloandisbursed', 'cumulative']], type: 'count' as const },
    { destLabel: 'Amount of Loan Disbursed (Cumulative till Date)', searchKeys: [['loan', 'disbursed', 'amount', 'year'], ['loan', 'disbursed', 'amount', 'cum'], ['amountofloandisbursed', 'yeartodate'], ['amountofloandisbursed', 'cumulative']], type: 'usd' as const },
    { destLabel: 'Total Outstanding', searchKeys: ['Total Outstanding', 'Outstanding Balance'], type: 'usd' as const },
    { destLabel: 'Current Outstanding', searchKeys: ['Current Outstanding', 'Current Balance'], type: 'usd' as const },
    { destLabel: 'Amount of Total OD', searchKeys: ['Amount of Total OD', ['total', 'od', 'amount'], ['amount', 'total', 'od'], 'total od', 'overdue', ['amount', 'overdue'], ['total', 'od']], type: 'usd' as const },
    { destLabel: 'Closing Security Deposit Balance', searchKeys: ['Total Closing Savings Balance', 'Closing Security Deposit Balance', 'Closing Deposit Balance'], type: 'usd' as const },
    { destLabel: 'Per FO Total Outstanding', searchKeys: [['Per FO', 'Outstanding'], ['Outstanding', 'Per FO']], type: 'usd' as const },
    { destLabel: 'PAR>30', searchKeys: ['PAR>30', 'PAR > 30', 'PAR 30'], type: 'percentMultiplied' as const },
  ];

  const table2Mappings: { destLabel: string; searchKeys: (string | string[])[]; type: 'usd' | 'count' | 'percent' | 'percentMultiplied', groupKey?: string }[] = [
    { destLabel: 'No. of Branches', searchKeys: ['No. of Branches'], type: 'count' as const },
    { destLabel: 'No. of Centers', searchKeys: ['No. of Centers'], type: 'count' as const },
    { destLabel: 'No. of FO/SFO/CO/SCO', searchKeys: ['No. of FO'], type: 'count' as const },
    { destLabel: 'Member Admission', searchKeys: ['Member Admission'], type: 'count' as const },
    { destLabel: 'Member Dropouts', searchKeys: ['Member Dropouts'], type: 'count' as const },
    { destLabel: 'Total Member', searchKeys: ['Total Member'], type: 'count' as const },
    { destLabel: 'Current Borrowers', searchKeys: ['Current Borrowers'], type: 'count' as const },
    { destLabel: 'Per FO Total Borrowers', searchKeys: ['Per FO Total Borrowers'], type: 'count' as const },
    { destLabel: 'Avg. Member Per Center', searchKeys: [['Avg', 'Member Per Center']], type: 'count' as const },
  ];

  // For Table 3 we have custom logic for portfolio ratio. Let's do it manually.
  const renderTable3 = () => {
      const smlOutstandingRow = extractRow(rows, 'Group', ['Total Outstanding', 'Outstanding Balance'], data.mapping?.['Total Outstanding']);
      const selOutstandingRow = extractRow(rows, 'Enterprise', ['Total Outstanding', 'Outstanding Balance'], data.mapping?.['Total Outstanding']);
      const totalOutstandingRow = extractRow(rows, 'Total', ['Total Outstanding', 'Outstanding Balance'], data.mapping?.['Total Outstanding']);

      return (
        <section className="bg-white dark:bg-gray-800 rounded-md shadow-sm border border-slate-200 dark:border-gray-700 flex flex-col shrink-0 table-container">
          <div className="px-4 py-2 bg-slate-50 dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-[11px] font-bold uppercase text-slate-500 dark:text-gray-400">
              Table 3: Product Composition
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table id="table3-pdf" className="w-full text-left text-[11px] border-collapse">
              <thead className="bg-white dark:bg-gray-800 sticky top-0 z-10">
                <tr className="border-b border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900">
                  <th className="p-2 font-semibold text-slate-700 dark:text-gray-300">Indicator Metric</th>
                  {recentMonths.map((m, i) => (
                    <th key={m} className={`p-2 text-right ${i === recentMonths.length - 1 ? 'font-bold text-slate-800 dark:text-gray-200' : 'opacity-60 italic text-slate-600 dark:text-gray-400'}`}>
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700/50">
                  <tr className="hover:bg-slate-50 dark:hover:bg-gray-700/50">
                      <td className="p-2 font-medium text-slate-800 dark:text-gray-200">Microcredit (SML) Loan outstanding</td>
                      {recentMonths.map((m, i) => (
                          <td key={m} className={`p-2 text-right ${i === recentMonths.length - 1 ? 'font-bold text-slate-800 dark:text-gray-200' : 'text-slate-600 dark:text-gray-400'}`}>
                              {formatUSD(smlOutstandingRow ? smlOutstandingRow[m] : undefined, exchangeRate)}
                          </td>
                      ))}
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-gray-700/50">
                      <td className="p-2 font-medium text-slate-800 dark:text-gray-200">Microcredit (SML) Loan outstanding/portfolio</td>
                      {recentMonths.map((m, i) => {
                          const sml = smlOutstandingRow ? parseFloat(smlOutstandingRow[m]) : 0;
                          const total = totalOutstandingRow ? parseFloat(totalOutstandingRow[m]) : 0;
                          const ratio = (total && sml && !isNaN(sml) && !isNaN(total)) ? (sml / total) : undefined;
                          return (
                              <td key={m} className={`p-2 text-right ${i === recentMonths.length - 1 ? 'font-bold text-slate-800 dark:text-gray-200' : 'text-slate-600 dark:text-gray-400'}`}>
                                  {formatPercent(ratio, true)}
                              </td>
                          )
                      })}
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-gray-700/50">
                      <td className="p-2 font-medium text-slate-800 dark:text-gray-200">Microenterprise (SEL) Loan outstanding</td>
                      {recentMonths.map((m, i) => (
                          <td key={m} className={`p-2 text-right ${i === recentMonths.length - 1 ? 'font-bold text-slate-800 dark:text-gray-200' : 'text-slate-600 dark:text-gray-400'}`}>
                              {formatUSD(selOutstandingRow ? selOutstandingRow[m] : undefined, exchangeRate)}
                          </td>
                      ))}
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-gray-700/50">
                      <td className="p-2 font-medium text-slate-800 dark:text-gray-200">Microenterprise (SEL) Loan outstanding/portfolio</td>
                      {recentMonths.map((m, i) => {
                          const sel = selOutstandingRow ? parseFloat(selOutstandingRow[m]) : 0;
                          const total = totalOutstandingRow ? parseFloat(totalOutstandingRow[m]) : 0;
                          const ratio = (total && sel && !isNaN(sel) && !isNaN(total)) ? (sel / total) : undefined;
                          return (
                              <td key={m} className={`p-2 text-right ${i === recentMonths.length - 1 ? 'font-bold text-slate-800 dark:text-gray-200' : 'text-slate-600 dark:text-gray-400'}`}>
                                  {formatPercent(ratio, true)}
                              </td>
                          )
                      })}
                  </tr>
              </tbody>
            </table>
          </div>
        </section>
      );
  }

  return (
    <div className="flex flex-col gap-3" id="dashboard-tables">
      {renderTable('Table 1: Financial Outcomes', table1Mappings, 'table1-pdf')}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
        {renderTable('Table 2: Operational Efficiency', table2Mappings, 'table2-pdf')}
        {renderTable3()}
      </div>
    </div>
  );
}
