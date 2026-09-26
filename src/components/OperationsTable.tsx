import { useState, useMemo } from 'react';
import { supabase, type MoveWithProduct } from '@/lib/supabase';
import { StatusBadge } from '@/components/Badge';
import { Spinner } from '@/components/Spinner';
import { CheckCircle2, XCircle, Search } from 'lucide-react';

interface OperationsTableProps {
  moves: MoveWithProduct[];
  loading: boolean;
  error: string | null;
  onRefetch: () => void;
  title: string;
  subtitle: string;
  emptyIcon: React.ComponentType<{ className?: string }>;
  emptyMessage: string;
  showFromLabel?: boolean;
  showToLabel?: boolean;
  fromLabel?: string;
  toLabel?: string;
  showCost?: boolean;
}

export function OperationsTable({
  moves,
  loading,
  error,
  onRefetch,
  title,
  subtitle,
  emptyIcon: EmptyIcon,
  emptyMessage,
  showCost = false,
}: OperationsTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'validated' | 'cancelled'>('all');
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return moves.filter((m) => {
      const matchesSearch =
        !search ||
        (m.product?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.reference || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.from_location || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.to_location || '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [moves, search, statusFilter]);

  async function handleValidate(moveId: string) {
    setValidatingId(moveId);
    setActionError(null);
    const { data, error } = await supabase.rpc('validate_move', { p_move_id: moveId });
    if (error) {
      setActionError(error.message);
    } else {
      setToast(`Validated successfully. New stock: ${data} units`);
      onRefetch();
      setTimeout(() => setToast(null), 3000);
    }
    setValidatingId(null);
  }

  async function handleCancel(moveId: string) {
    setCancellingId(moveId);
    setActionError(null);
    const { error } = await supabase.rpc('cancel_move', { p_move_id: moveId });
    if (error) {
      setActionError(error.message);
    } else {
      onRefetch();
    }
    setCancellingId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={32} className="text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="text-slate-500 mt-1">{subtitle}</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {actionError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700">
          {actionError}
        </div>
      )}

      {toast && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {toast}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product, reference, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
          />
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(['all', 'pending', 'validated', 'cancelled'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                statusFilter === s
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Reference</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Product</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Qty</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">From</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">To</th>
                {showCost && (
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Unit Cost</th>
                )}
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Date</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={showCost ? 9 : 8} className="px-6 py-12 text-center text-slate-400">
                    <EmptyIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 font-mono">
                      {m.reference || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{m.product?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-400">{m.product?.sku}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 text-right">
                      {m.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{m.from_location || '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{m.to_location || '—'}</td>
                    {showCost && (
                      <td className="px-6 py-4 text-sm text-slate-600 text-right">
                        {m.unit_cost ? `$${m.unit_cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {m.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleValidate(m.id)}
                            disabled={validatingId === m.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                          >
                            {validatingId === m.id ? <Spinner size={14} /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            Validate
                          </button>
                          <button
                            onClick={() => handleCancel(m.id)}
                            disabled={cancellingId === m.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
                          >
                            {cancellingId === m.id ? <Spinner size={14} /> : <XCircle className="w-3.5 h-3.5" />}
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
