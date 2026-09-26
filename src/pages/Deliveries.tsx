import { useState } from 'react';
import { ArrowUpFromLine, Plus } from 'lucide-react';
import { useMoves, useProducts } from '@/lib/hooks';
import { OperationsTable } from '@/components/OperationsTable';
import { AddMoveModal } from '@/components/AddMoveModal';

export function Deliveries() {
  const { moves, loading, error, refetch } = useMoves('delivery');
  const { products, refetch: refetchProducts } = useProducts();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Deliveries</h2>
          <p className="text-slate-500 mt-1">Outgoing orders to customers — validating decreases inventory</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Delivery
        </button>
      </div>

      <OperationsTable
        moves={moves}
        loading={loading}
        error={error}
        onRefetch={() => { refetch(); refetchProducts(); }}
        title=""
        subtitle=""
        emptyIcon={ArrowUpFromLine}
        emptyMessage="No deliveries found"
      />

      <AddMoveModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { refetch(); refetchProducts(); }}
        moveType="delivery"
        products={products}
        title="New Delivery"
        subtitle="Record outgoing stock to a customer"
        fromLabel="Source"
        toLabel="Customer"
        referencePrefix="SO-2024-XXX"
      />
    </div>
  );
}
