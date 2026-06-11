import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatUSD(value: number | string | undefined, rate: number): string {
    if (value === undefined || value === null || value === '') return '-';
    // Clean string if it happens to have commas
    let num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(num)) return '-';
    
    // convert UGX to USD and round to whole numbers
    const usdValue = Math.round(num / rate);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(usdValue);
}

export function formatCount(value: number | string | undefined): string {
    if (value === undefined || value === null || value === '') return '-';
    let num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(num)) return '-';
    return new Intl.NumberFormat('en-US').format(Math.round(num));
}

export function formatPercent(value: number | string | undefined, multiplyBy100: boolean = false): string {
    if (value === undefined || value === null || value === '') return '-';
    
    let isAlreadyPercentString = false;
    if (typeof value === 'string' && value.includes('%')) {
        isAlreadyPercentString = true;
    }
    
    let num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '').replace(/%/g, '')) : value;
    if (isNaN(num)) return '-';
    
    if (multiplyBy100 && !isAlreadyPercentString) {
        num = num * 100;
    }
    return `${num.toFixed(2)}%`;
}

export function getFilteredMonths(dateColumns: string[], endMonth: string | null): string[] {
    if (!endMonth) return dateColumns.slice(-5);
    
    const quarterMonthsRegex = /(mar|jun|sep|dec)/i;
    const allQuarterEnds = dateColumns.filter(c => quarterMonthsRegex.test(c));
    
    // Find index of endMonth in dateColumns
    const endIndex = dateColumns.indexOf(endMonth);
    if (endIndex === -1) return dateColumns.slice(-5); // Fallback
    
    const availableColumns = dateColumns.slice(0, endIndex + 1);
    const availableQuarterEnds = availableColumns.filter(c => quarterMonthsRegex.test(c));
    
    if (quarterMonthsRegex.test(endMonth)) {
        return availableQuarterEnds.slice(-5);
    } else {
        let lastQEIndex = -1;
        for (let i = availableColumns.length - 1; i >= 0; i--) {
            if (quarterMonthsRegex.test(availableColumns[i])) {
                lastQEIndex = i;
                break;
            }
        }
        
        let subsequentMonths = [];
        let precedingQEs = availableQuarterEnds;
        
        if (lastQEIndex !== -1) {
            subsequentMonths = availableColumns.slice(lastQEIndex + 1);
        } else {
            subsequentMonths = availableColumns;
        }
        
        const neededQEs = 5 - subsequentMonths.length;
        if (neededQEs > 0) {
            return precedingQEs.slice(-neededQEs).concat(subsequentMonths);
        } else {
            return subsequentMonths.slice(-5);
        }
    }
}
