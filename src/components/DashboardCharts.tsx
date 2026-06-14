import React from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, BarChart, LabelList
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
  const totalAmountDisbursedCumRow = extractRow(rows, 'Total', [['loan', 'disbursed', 'amount', 'year'], ['loan', 'disbursed', 'amount', 'cum'], ['amountofloandisbursed', 'yeartodate'], ['amountofloandisbursed', 'cumulative']], data.mapping?.['Amount of Loan Disbursed (Cumulative till Date)']);
  const totalLoanDisbursedCumRow = extractRow(rows, 'Total', [['loan', 'disbursed', 'year', 'no'], ['loan', 'disbursed', 'cum', 'no'], ['noofloandisbursed', 'yeartodate'], ['noofloandisbursed', 'cumulative']], data.mapping?.['Loan Disbursed (Cumulative till Date)']);
  
  const par30Row = extractRow(rows, 'Total', ['PAR>30', 'PAR > 30', 'PAR 30'], data.mapping?.['PAR>30']);
  
  const smlOutstandingRow = extractRow(rows, 'Group', ['Total Outstanding', 'Outstanding Balance'], data.mapping?.['Total Outstanding']);
  const selOutstandingRow = extractRow(rows, 'Enterprise', ['Total Outstanding', 'Outstanding Balance'], data.mapping?.['Total Outstanding']);

  const newLoanDisbursedAmountRow = extractRow(rows, 'Total', [['loan', 'disbursed', 'new', 'amount'], ['amountofloandisbursed', 'new']], data.mapping?.['Amount of New Loan Disbursed']);
  const totalLoanDisbursedAmountRow = extractRow(rows, 'Total', [['loan', 'disbursed', 'total', 'amount'], ['amountofloandisbursed', 'total']], data.mapping?.['Total Amount of Loan Disbursed']);

  const chartData = displayMonths.map(month => {
    // raw values
    const totOutRaw = totalOutstandingRow ? parseFloat(String(totalOutstandingRow[month]).replace(/,/g, '')) : 0;
    const totDisbCumAmountRaw = totalAmountDisbursedCumRow ? parseFloat(String(totalAmountDisbursedCumRow[month]).replace(/,/g, '')) : 0;
    const totDisbCumCountRaw = totalLoanDisbursedCumRow ? parseFloat(String(totalLoanDisbursedCumRow[month]).replace(/,/g, '')) : 0;
    
    const par30RawStr = String(par30Row ? par30Row[month] : '0');
    const isPar30PercentStr = par30RawStr.includes('%');
    let par30Raw = parseFloat(par30RawStr.replace(/,/g, '').replace(/%/g, ''));
    if (isNaN(par30Raw)) par30Raw = 0;
    const par30Final = isPar30PercentStr ? par30Raw : par30Raw * 100;

    const smlOutRaw = smlOutstandingRow ? parseFloat(String(smlOutstandingRow[month]).replace(/,/g, '')) : 0;
    const selOutRaw = selOutstandingRow ? parseFloat(String(selOutstandingRow[month]).replace(/,/g, '')) : 0;

    const newLoanAmountRaw = newLoanDisbursedAmountRow ? parseFloat(String(newLoanDisbursedAmountRow[month]).replace(/,/g, '')) : 0;
    const totalLoanAmountRaw = totalLoanDisbursedAmountRow ? parseFloat(String(totalLoanDisbursedAmountRow[month]).replace(/,/g, '')) : 0;
    const repeatLoanAmountRaw = totalLoanAmountRaw - newLoanAmountRaw;

    const smlOutCalculated = Math.round((smlOutRaw || 0) / exchangeRate);
    const selOutCalculated = Math.round((selOutRaw || 0) / exchangeRate);
    const totalMixRaw = smlOutCalculated + selOutCalculated;
    
    const smlPercent = totalMixRaw > 0 ? Number(((smlOutCalculated / totalMixRaw) * 100).toFixed(1)) : 0;
    const selPercent = totalMixRaw > 0 ? Number(((selOutCalculated / totalMixRaw) * 100).toFixed(1)) : 0;

    return {
        month,
        totalOutstanding: Math.round((totOutRaw || 0) / exchangeRate),
        totalDisbursedCumAmount: Math.round((totDisbCumAmountRaw || 0) / exchangeRate),
        totalDisbursedCumCount: totDisbCumCountRaw || 0,
        par30: par30Final,
        smlOutstanding: smlOutCalculated,
        selOutstanding: selOutCalculated,
        smlPercent,
        selPercent,
        newLoanAmount: Math.round((newLoanAmountRaw || 0) / exchangeRate),
        repeatLoanAmount: Math.round((repeatLoanAmountRaw || 0) / exchangeRate),
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
       
       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
       <section className="bg-white dark:bg-gray-800 rounded-md shadow-sm border border-slate-200 dark:border-gray-700 p-3 flex flex-col h-[240px] shrink-0 chart-container">
           <h3 className="text-base font-bold uppercase text-black dark:text-white mb-2">Visual 1: Cumulative Loan Disbursed</h3>
           <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 25, right: 10, bottom: 5, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                        <XAxis dataKey="month" tick={{ fill: colors.text, fontSize: 14 }} axisLine={{ stroke: colors.grid }} />
                        <YAxis yAxisId="left" tick={{ fill: colors.text, fontSize: 14 }} axisLine={{ stroke: colors.grid }} tickFormatter={(val) => `$${(val/1000000).toFixed(1)}M`} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: colors.text, fontSize: 14 }} axisLine={{ stroke: colors.grid }} tickFormatter={(val) => `${(val/1000).toFixed(1)}k`} />
                        <Tooltip 
                            formatter={(value: number, name: string) => {
                                if (name === 'Cm. Amount (USD)') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
                                return new Intl.NumberFormat('en-US').format(value);
                            }} 
                        />
                        <Legend wrapperStyle={{ fontSize: '14px', fontWeight: 'bold' }}/>
                        <Bar isAnimationActive={false} yAxisId="left" dataKey="totalDisbursedCumAmount" name="Cm. Amount (USD)" fill={colors.primary} radius={[4,4,0,0]} maxBarSize={40}>
                            <LabelList dataKey="totalDisbursedCumAmount" position="insideTop" formatter={(val: number) => `$${(val/1000000).toFixed(1)}M`} fill="#fff" fontSize={14} fontWeight="bold"/>
                        </Bar>
                        <Line isAnimationActive={false} yAxisId="right" type="monotone" dataKey="totalDisbursedCumCount" name="Cm. Count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}>
                            <LabelList dataKey="totalDisbursedCumCount" position="top" formatter={(val: number) => `${(val/1000).toFixed(1)}k`} fill="#3b82f6" fontSize={14} fontWeight="bold"/>
                        </Line>
                    </ComposedChart>
                </ResponsiveContainer>
           </div>
       </section>

       <section className="bg-white dark:bg-gray-800 rounded-md shadow-sm border border-slate-200 dark:border-gray-700 p-3 flex flex-col h-[240px] shrink-0 chart-container">
           <h3 className="text-base font-bold uppercase text-black dark:text-white mb-2">Visual 2: Risk Trend (PAR{'>'}30 %)</h3>
           <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 25, right: 10, bottom: 5, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                        <XAxis dataKey="month" tick={{ fill: colors.text, fontSize: 14 }} axisLine={{ stroke: colors.grid }} />
                        <YAxis tick={{ fill: colors.text, fontSize: 14 }} axisLine={{ stroke: colors.grid }} tickFormatter={(val) => `${val.toFixed(1)}%`} />
                        <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                        <Legend wrapperStyle={{ fontSize: '14px', fontWeight: 'bold' }}/>
                        <ReferenceLine y={2.0} stroke="red" strokeDasharray="3 3" label={{ position: 'top', value: '2.0% Threshold', fill: 'red', fontSize: 14, fontWeight: 'bold' }} />
                        <Line isAnimationActive={false} type="monotone" dataKey="par30" name="PAR>30%" stroke={colors.primary} strokeWidth={2} dot={{ r: 4, fill: colors.primary }} activeDot={{ r: 6 }}>
                            <LabelList dataKey="par30" position="top" formatter={(val: number) => `${val.toFixed(2)}%`} fill={colors.text} fontSize={14} fontWeight="bold"/>
                        </Line>
                    </ComposedChart>
                </ResponsiveContainer>
           </div>
       </section>

       <section className="bg-white dark:bg-gray-800 rounded-md shadow-sm border border-slate-200 dark:border-gray-700 p-3 flex flex-col h-[240px] shrink-0 chart-container">
           <h3 className="text-base font-bold uppercase text-black dark:text-white mb-2">Visual 3: Product Mix SML vs SEL</h3>
           <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 25, right: 10, bottom: 5, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                        <XAxis dataKey="month" tick={{ fill: colors.text, fontSize: 14 }} axisLine={{ stroke: colors.grid }} />
                        <YAxis tick={{ fill: colors.text, fontSize: 14 }} axisLine={{ stroke: colors.grid }} tickFormatter={(val) => `${Math.round(val)}%`} domain={[0, 100]} />
                        <Tooltip formatter={(value: number, name: string, props: any) => {
                            const rawOutstanding = name === 'Microcredit (SML)' ? props.payload.smlOutstanding : props.payload.selOutstanding;
                            const formattedCurrency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(rawOutstanding);
                            return `${value}% (${formattedCurrency})`;
                        }} />
                        <Legend wrapperStyle={{ fontSize: '14px', fontWeight: 'bold' }}/>
                        <Bar isAnimationActive={false} dataKey="smlPercent" name="Microcredit (SML)" stackId="a" fill={colors.primary} maxBarSize={60}>
                            <LabelList dataKey="smlPercent" position="inside" formatter={(val: number) => `${val}%`} fill="#ffffff" fontSize={14} fontWeight="bold"/>
                        </Bar>
                        <Bar isAnimationActive={false} dataKey="selPercent" name="Microenterprise (SEL)" stackId="a" fill={colors.secondary} radius={[4,4,0,0]} maxBarSize={60}>
                            <LabelList dataKey="selPercent" position="inside" formatter={(val: number) => `${val}%`} fill={colors.text} fontSize={14} fontWeight="bold"/>
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
           </div>
       </section>

       <section className="bg-white dark:bg-gray-800 rounded-md shadow-sm border border-slate-200 dark:border-gray-700 p-3 flex flex-col h-[240px] shrink-0 chart-container">
           <h3 className="text-base font-bold uppercase text-black dark:text-white mb-2">Visual 4: New vs Repeat Loan Disbursed</h3>
           <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 25, right: 10, bottom: 5, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                        <XAxis dataKey="month" tick={{ fill: colors.text, fontSize: 14 }} axisLine={{ stroke: colors.grid }} />
                        <YAxis tick={{ fill: colors.text, fontSize: 14 }} axisLine={{ stroke: colors.grid }} tickFormatter={(val) => `$${(val/1000000).toFixed(1)}M`} />
                        <Tooltip formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)} />
                        <Legend wrapperStyle={{ fontSize: '14px', fontWeight: 'bold' }}/>
                        <Bar isAnimationActive={false} dataKey="newLoanAmount" name="New Loan Amount" fill={colors.primary} maxBarSize={30}>
                            <LabelList dataKey="newLoanAmount" position="top" formatter={(val: number) => `$${(val/1000000).toFixed(1)}M`} fill={colors.text} fontSize={14} fontWeight="bold"/>
                        </Bar>
                        <Bar isAnimationActive={false} dataKey="repeatLoanAmount" name="Repeat Loan Amount" fill={colors.secondary} maxBarSize={30}>
                            <LabelList dataKey="repeatLoanAmount" position="top" formatter={(val: number) => `$${(val/1000000).toFixed(1)}M`} fill={colors.text} fontSize={14} fontWeight="bold"/>
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
           </div>
       </section>
       </div>
    </div>
  );
}
