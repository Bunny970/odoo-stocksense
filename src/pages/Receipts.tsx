import { useState } from 'react';
import { ArrowDownToLine, Plus } from 'lucide-react';
import { useMoves, useProducts } from '@/lib/hooks';
import { OperationsTable } from '@/components/OperationsTable';
import { AddMoveModal } from '@/components/AddMoveModal';

export function Receipts() {
  const { moves, loading, error, refetch } = useMoves('receipt');
  const { products, refetch: refetchProducts } = useProducts();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Receipts</h2>
          <p className="text-slate-500 mt-1">Incoming stock from suppliers — validating increases inventory</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Receipt
        </button>
      </div>

      <OperationsTable
        moves={moves}
        loading={loading}
        error={error}
        onRefetch={() => { refetch(); refetchProducts(); }}
        title=""
        subtitle=""
        emptyIcon={ArrowDownToLine}
        emptyMessage="No receipts found"
        showCost
      />

      <AddMoveModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { refetch(); refetchProducts(); }}
        moveType="receipt"
        products={products}
        title="New Receipt"
        subtitle="Record incoming stock from a supplier"
        fromLabel="Supplier"
        toLabel="Destination"
        showCost
        referencePrefix="PO-2024-XXX"
      />
    </div>
  );
}
