import { useState, useMemo } from 'react';
import {
  BookOpen,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  SlidersHorizontal,
  Search,
} from 'lucide-react';
import { useMoves } from '@/lib/hooks';
import { StatusBadge } from '@/components/Badge';
import { FullPageSpinner } from '@/components/Spinner';
import type { MoveType } from '@/lib/supabase';

const moveTypeConfig: Record<MoveType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  receipt: { label: 'Receipt', icon: ArrowDownToLine, color: 'text-emerald-600 bg-emerald-50' },
  delivery: { label: 'Delivery', icon: ArrowUpFromLine, color: 'text-rose-600 bg-rose-50' },
  transfer: { label: 'Transfer', icon: ArrowLeftRight, color: 'text-sky-600 bg-sky-50' },
  adjustment: { label: 'Adjustment', icon: SlidersHorizontal, color: 'text-amber-600 bg-amber-50' },
};

export function MoveLedger() {
  const { moves, loading, error } = useMoves();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | MoveType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'validated' | 'cancelled'>('all');

  const filtered = useMemo(() => {
    return moves.filter((m) => {
      const matchesSearch =
        !search ||
        (m.product?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.reference || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.product?.sku || '').toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || m.move_type === typeFilter;
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [moves, search, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: moves.length,
      validated: moves.filter((m) => m.status === 'validated').length,
      pending: moves.filter((m) => m.status === 'pending').length,
    };
  }, [moves]);

  if (loading) return <FullPageSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Move Ledger</h2>
        <p className="text-slate-500 mt-1">Complete history of every inventory movement</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Moves</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Validated</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.validated}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product, SKU, or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as 'all' | MoveType)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
        >
          <option value="all">All Types</option>
          <option value="receipt">Receipts</option>
          <option value="delivery">Deliveries</option>
          <option value="transfer">Transfers</option>
          <option value="adjustment">Adjustments</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'validated' | 'cancelled')}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="validated">Validated</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Reference</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Product</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Qty</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">From → To</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Variance</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Created</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Validated</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No movements found
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const tc = moveTypeConfig[m.move_type];
                  const Icon = tc.icon;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tc.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-slate-700">{tc.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-900">{m.reference || '—'}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{m.product?.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-400">{m.product?.sku}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900 text-right">{m.quantity}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <span>{m.from_location || '—'}</span>
                          {m.to_location && (
                            <>
                              <ArrowLeftRight className="w-3 h-3 text-slate-300" />
                              <span>{m.to_location}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {m.variance !== null ? (
                          <span className={`text-sm font-semibold ${m.variance > 0 ? 'text-emerald-600' : m.variance < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                            {m.variance > 0 ? '+' : ''}{m.variance}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(m.created_at).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {m.validated_at
                          ? new Date(m.validated_at).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={m.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
