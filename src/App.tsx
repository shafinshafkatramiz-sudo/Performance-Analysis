import React from 'react';
import { DashboardProvider } from './lib/store';
import { DashboardHeader } from './components/DashboardHeader';
import { DashboardTables } from './components/DashboardTables';
import { DashboardCharts } from './components/DashboardCharts';

export default function App() {
  return (
    <DashboardProvider>
      <div className="h-screen flex flex-col overflow-hidden font-sans transition-colors duration-200" style={{ backgroundColor: 'var(--bg-color, #f1f5f9)', color: 'var(--text-color, #1e293b)' }}>
        <style dangerouslySetInnerHTML={{__html: `
          :root.corporate { --bg-color: #f1f5f9; --text-color: #1e293b; }
          :root.modern-dark { --bg-color: #0f172a; --text-color: #f8fafc; }
          :root.print-safe { --bg-color: #ffffff; --text-color: #000000; }
          body { margin: 0; height: 100%; display: flex; flex-direction: column; overflow: hidden; }
        `}} />
        <DashboardHeader />
        
        <main className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 p-3 overflow-hidden min-h-0">
          <div className="md:col-span-8 flex flex-col gap-3 overflow-y-auto pr-1">
            <DashboardTables />
          </div>
          <div className="md:col-span-4 flex flex-col gap-3 overflow-y-auto pr-1">
            <DashboardCharts />
          </div>
        </main>
      </div>
    </DashboardProvider>
  );
}

