import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  SlidersHorizontal,
  BookOpen,
  Boxes,
} from 'lucide-react';
import type { NavSection, PageKey } from '@/types';

interface SidebarProps {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
}

const navSections: NavSection[] = [
  {
    label: 'Main',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { key: 'products', label: 'Products', icon: Package },
    ],
  },
  {
    label: 'Operations',
    items: [
      { key: 'receipts', label: 'Receipts', icon: ArrowDownToLine },
      { key: 'deliveries', label: 'Deliveries', icon: ArrowUpFromLine },
      { key: 'transfers', label: 'Internal Transfers', icon: ArrowLeftRight },
      { key: 'adjustments', label: 'Adjustments', icon: SlidersHorizontal },
    ],
  },
  {
    label: 'History',
    items: [
      { key: 'ledger', label: 'Move Ledger', icon: BookOpen },
    ],
  },
];

export function Sidebar({ current, onNavigate }: SidebarProps) {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20">
          <Boxes className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg leading-tight">StockSense</h1>
          <p className="text-xs text-slate-500">Inventory Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navSections.map((section) => (
          <div key={section.label} className="mb-6">
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = current === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => onNavigate(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-800">
        <p className="text-xs text-slate-600">StockSense v1.0</p>
      </div>
    </aside>
  );
}
