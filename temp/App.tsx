import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/pages/Dashboard';
import { Products } from '@/pages/Products';
import { Receipts } from '@/pages/Receipts';
import { Deliveries } from '@/pages/Deliveries';
import { Transfers } from '@/pages/Transfers';
import { Adjustments } from '@/pages/Adjustments';
import { MoveLedger } from '@/pages/MoveLedger';
import type { PageKey } from '@/types';

function App() {
  const [page, setPage] = useState<PageKey>('dashboard');

  function renderPage() {
    switch (page) {
      case 'dashboard':
        return <Dashboard onNavigate={setPage} />;
      case 'products':
        return <Products />;
      case 'receipts':
        return <Receipts />;
      case 'deliveries':
        return <Deliveries />;
      case 'transfers':
        return <Transfers />;
      case 'adjustments':
        return <Adjustments />;
      case 'ledger':
        return <MoveLedger />;
      default:
        return <Dashboard onNavigate={setPage} />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar current={page} onNavigate={setPage} />
      <main className="flex-1 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default App;
