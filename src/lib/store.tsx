import React, { createContext, useContext, useState, useEffect } from 'react';
import { ParsedData } from './parser';

interface DashboardState {
  data: ParsedData | null;
  setData: (data: ParsedData | null) => void;
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
  theme: string;
  setTheme: (theme: string) => void;
  selectedEndMonth: string | null;
  setSelectedEndMonth: (month: string | null) => void;
}

const DashboardContext = createContext<DashboardState | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ParsedData | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(3497.5);
  const [theme, setTheme] = useState<string>('corporate');
  const [selectedEndMonth, setSelectedEndMonth] = useState<string | null>(null);

  // Load from local storage
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('sajida_dashboard_data');
      if (storedData) {
        setData(JSON.parse(storedData));
      }
      const storedRate = localStorage.getItem('sajida_exchange_rate');
      if (storedRate) {
        setExchangeRate(parseFloat(storedRate));
      }
      const storedTheme = localStorage.getItem('sajida_theme');
      if (storedTheme) {
        setTheme(storedTheme);
      }
    } catch (e) {
      console.error("Could not load from local storage", e);
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (data) {
      localStorage.setItem('sajida_dashboard_data', JSON.stringify(data));
    }
  }, [data]);

  useEffect(() => {
    localStorage.setItem('sajida_exchange_rate', exchangeRate.toString());
  }, [exchangeRate]);

  useEffect(() => {
    localStorage.setItem('sajida_theme', theme);
    const root = document.documentElement;
    root.classList.remove('corporate', 'modern-dark', 'print-safe');
    root.classList.add(theme);
    if (theme === 'modern-dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Expose function to inject the ParsedData object securely without issues 
  const updateData = (newData: ParsedData | null) => {
    setData(newData);
    if (newData && newData.quarterEndColumns && newData.quarterEndColumns.length > 0) {
      setSelectedEndMonth(newData.quarterEndColumns[newData.quarterEndColumns.length - 1] || null);
    } else if (newData && newData.dateColumns && newData.dateColumns.length > 0) {
      setSelectedEndMonth(newData.dateColumns[newData.dateColumns.length - 1] || null);
    } else {
      setSelectedEndMonth(null);
    }
  };

  return (
    <DashboardContext.Provider value={{ data, setData: updateData, exchangeRate, setExchangeRate, theme, setTheme, selectedEndMonth, setSelectedEndMonth }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
