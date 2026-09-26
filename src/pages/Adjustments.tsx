import { useState } from 'react';
import { SlidersHorizontal, Plus } from 'lucide-react';
import { useMoves, useProducts } from '@/lib/hooks';
import { OperationsTable } from '@/components/OperationsTable';
import { AddMoveModal } from '@/components/AddMoveModal';

export function Adjustments() {
  const { moves, loading, error, refetch } = useMoves('adjustment');
  const { products, refetch: refetchProducts } = useProducts();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Adjustments</h2>
          <p className="text-slate-500 mt-1">Update physical count — variance is logged automatically</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Adjustment
        </button>
      </div>

      {/* Variance info banner */}
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-start gap-3">
        <SlidersHorizontal className="w-5 h-5 text-sky-600 mt-0.5 shrink-0" />
        <div className="text-sm text-sky-800">
          <p className="font-medium">How adjustments work</p>
          <p className="text-sky-600 mt-0.5">
            Enter the actual physical count. When validated, the system calculates variance
            (counted - on hand) and updates your stock. Positive variance increases stock, negative decreases it.
          </p>
        </div>
      </div>

      <OperationsTable
        moves={moves}
        loading={loading}
        error={error}
        onRefetch={() => { refetch(); refetchProducts(); }}
        title=""
        subtitle=""
        emptyIcon={SlidersHorizontal}
        emptyMessage="No adjustments found"
      />

      <AddMoveModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { refetch(); refetchProducts(); }}
        moveType="adjustment"
        products={products}
        title="New Stock Adjustment"
        subtitle="Update physical count for a product"
        fromLabel="Location"
        toLabel="N/A"
        referencePrefix="ADJ-2024-XXX"
      />
    </div>
  );
}
