import React from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, BarChart
} from 'recharts';
import { useDashboard } from '../lib/store';
import { extractRow } from '../lib/parser';
import { getFilteredMonths } from '../lib/utils';

export function DashboardCharts() {
  const { data, exchangeRate, theme, selectedEndMonth } = useDashboard();

  if (!data || !data.rows || data.rows.length === 0) {
    return null;
  }

  const { rows } = data;
  const displayMonths = getFilteredMonths(data.dateColumns, selectedEndMonth);

  if (displayMonths.length === 0) {
      return <div className="p-4 text-center text-gray-500">No data available for charts.</div>;
  }

  // Extract necessary rows
  const totalOutstandingRow = extractRow(rows, 'Total', ['Total Outstanding', 'Outstanding Balance'], data.mapping?.['Total Outstanding']);
  const amountOfTotalODRow = extractRow(rows, 'Total', ['Amount of Total OD', ['total', 'od', 'amount'], ['amount', 'total', 'od'], 'total od', 'overdue', ['amount', 'overdue'], ['total', 'od']], data.mapping?.['Amount of Total OD']);
  const totalAmountDisbursedRow = extractRow(rows, 'Total', [['loan', 'disbursed', 'total', 'amount'], ['amountofloandisbursed', 'total']], data.mapping?.['Total Amount of Loan Disbursed']);
  const par30Row = extractRow(rows, 'Total', ['PAR>30', 'PAR > 30', 'PAR 30'], data.mapping?.['PAR>30']);
  
  const smlOutstandingRow = extractRow(rows, 'Group', ['Total Outstanding', 'Outstanding Balance'], data.mapping?.['Total Outstanding']);
  const selOutstandingRow = extractRow(rows, 'Enterprise', ['Total Outstanding', 'Outstanding Balance'], data.mapping?.['Total Outstanding']);

  const chartData = displayMonths.map(month => {
    // raw values
    const totOutRaw = totalOutstandingRow ? parseFloat(String(totalOutstandingRow[month]).replace(/,/g, '')) : 0;
    const totalODRaw = amountOfTotalODRow ? parseFloat(String(amountOfTotalODRow[month]).replace(/,/g, '')) : 0;
    const totDisbRaw = totalAmountDisbursedRow ? parseFloat(String(totalAmountDisbursedRow[month]).replace(/,/g, '')) : 0;
    
    const par30RawStr = String(par30Row ? par30Row[month] : '0');
    const isPar30PercentStr = par30RawStr.includes('%');
    let par30Raw = parseFloat(par30RawStr.replace(/,/g, '').replace(/%/g, ''));
    if (isNaN(par30Raw)) par30Raw = 0;
    const par30Final = isPar30PercentStr ? par30Raw : par30Raw * 100;

    const smlOutRaw = smlOutstandingRow ? parseFloat(String(smlOutstandingRow[month]).replace(/,/g, '')) : 0;
    const selOutRaw = selOutstandingRow ? parseFloat(String(selOutstandingRow[month]).replace(/,/g, '')) : 0;

    return {
        month,
        totalOutstanding: Math.round((totOutRaw || 0) / exchangeRate),
        amountOfTotalOD: Math.round((totalODRaw || 0) / exchangeRate),
        totalDisbursed: Math.round((totDisbRaw || 0) / exchangeRate),
        par30: par30Final,
        smlOutstanding: Math.round((smlOutRaw || 0) / exchangeRate),
        selOutstanding: Math.round((selOutRaw || 0) / exchangeRate),
    }
  });

  const getThemeColors = () => {
    if (theme === 'print-safe') {
        return {
            primary: '#000000',
            secondary: '#666666',
            tertiary: '#999999',
            text: '#000000',
            grid: '#e5e5e5'
        }
    }
    if (theme === 'modern-dark') {
        return {
            primary: '#2dd4bf', // teal-400
            secondary: '#38bdf8', // sky-400
            tertiary: '#a78bfa', // violet-400
            text: '#f3f4f6', 
            grid: '#374151'
        }
    }
    // Corporate
    return {
        primary: '#004C97', // SAJIDA Blue
        secondary: '#64748b', // Slate
        tertiary: '#cbd5e1',
        text: '#1f2937',
        grid: '#e2e8f0'
    }
  };

  const colors = getThemeColors();

  return (
    <div className="flex flex-col gap-3" id="dashboard-charts">
       {/* PAGE BREAK MARKER FOR PDF */}
       <div className="pdf-page-break before:block before:h-8 hidden"></div>
       <h2 className="text-[11px] font-bold uppercase text-slate-400 dark:text-gray-400 px-2 print-show hidden">Quarter-End Analysis</h2>
       
       <section className="bg-white dark:bg-gray-800 rounded-md shadow-sm border border-slate-200 dark:border-gray-700 p-3 flex flex-col h-[240px] shrink-0 chart-container">
           <h3 className="text-[10px] font-bold uppercase text-slate-400 dark:text-gray-400 mb-2">Visual 1: Overdue vs Outstanding (USD)</h3>
           <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                        <XAxis dataKey="month" tick={{ fill: colors.text, fontSize: 10 }} axisLine={{ stroke: colors.grid }} />
                        <YAxis yAxisId="left" tick={{ fill: colors.text, fontSize: 10 }} axisLine={{ stroke: colors.grid }} tickFormatter={(val) => `$${(val/1000000).toFixed(1)}M`} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: colors.text, fontSize: 10 }} axisLine={{ stroke: colors.grid }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)} />
                        <Legend wrapperStyle={{ fontSize: '10px' }}/>
                        <Bar yAxisId="left" dataKey="totalOutstanding" name="Total Outstanding" fill={colors.primary} radius={[4,4,0,0]} maxBarSize={40} />
                        <Line yAxisId="right" type="monotone" dataKey="amountOfTotalOD" name="Overdue (OD)" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </ComposedChart>
                </ResponsiveContainer>
           </div>
       </section>

       <section className="bg-white dark:bg-gray-800 rounded-md shadow-sm border border-slate-200 dark:border-gray-700 p-3 flex flex-col h-[240px] shrink-0 chart-container">
           <h3 className="text-[10px] font-bold uppercase text-slate-400 dark:text-gray-400 mb-2">Visual 2: Risk Trend (PAR{'>'}30 %)</h3>
           <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                        <XAxis dataKey="month" tick={{ fill: colors.text, fontSize: 10 }} axisLine={{ stroke: colors.grid }} />
                        <YAxis tick={{ fill: colors.text, fontSize: 10 }} axisLine={{ stroke: colors.grid }} tickFormatter={(val) => `${val.toFixed(1)}%`} />
                        <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                        <Legend wrapperStyle={{ fontSize: '10px' }}/>
                        <ReferenceLine y={2.0} stroke="red" strokeDasharray="3 3" label={{ position: 'top', value: '2.0% Threshold', fill: 'red', fontSize: 9 }} />
                        <Line type="monotone" dataKey="par30" name="PAR>30%" stroke={colors.primary} strokeWidth={2} dot={{ r: 3, fill: colors.primary }} activeDot={{ r: 5 }} />
                    </ComposedChart>
                </ResponsiveContainer>
           </div>
       </section>

       <section className="bg-white dark:bg-gray-800 rounded-md shadow-sm border border-slate-200 dark:border-gray-700 p-3 flex flex-col h-[240px] shrink-0 chart-container">
           <h3 className="text-[10px] font-bold uppercase text-slate-400 dark:text-gray-400 mb-2">Visual 3: Product Mix SML vs SEL</h3>
           <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                        <XAxis dataKey="month" tick={{ fill: colors.text, fontSize: 10 }} axisLine={{ stroke: colors.grid }} />
                        <YAxis tick={{ fill: colors.text, fontSize: 10 }} axisLine={{ stroke: colors.grid }} tickFormatter={(val) => `$${(val/1000000).toFixed(1)}M`} />
                        <Tooltip formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)} />
                        <Legend wrapperStyle={{ fontSize: '10px' }}/>
                        <Bar dataKey="smlOutstanding" name="Microcredit (SML)" stackId="a" fill={colors.primary} maxBarSize={60} />
                        <Bar dataKey="selOutstanding" name="Microenterprise (SEL)" stackId="a" fill={colors.secondary} radius={[4,4,0,0]} maxBarSize={60} />
                    </BarChart>
                </ResponsiveContainer>
           </div>
       </section>
    </div>
  );
}
