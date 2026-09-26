import { useState } from 'react';
import { ArrowLeftRight, Plus } from 'lucide-react';
import { useMoves, useProducts } from '@/lib/hooks';
import { OperationsTable } from '@/components/OperationsTable';
import { AddMoveModal } from '@/components/AddMoveModal';

export function Transfers() {
  const { moves, loading, error, refetch } = useMoves('transfer');
  const { products, refetch: refetchProducts } = useProducts();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Internal Transfers</h2>
          <p className="text-slate-500 mt-1">Move stock between locations within your organization</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Transfer
        </button>
      </div>

      <OperationsTable
        moves={moves}
        loading={loading}
        error={error}
        onRefetch={() => { refetch(); refetchProducts(); }}
        title=""
        subtitle=""
        emptyIcon={ArrowLeftRight}
        emptyMessage="No transfers found"
      />

      <AddMoveModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { refetch(); refetchProducts(); }}
        moveType="transfer"
        products={products}
        title="New Internal Transfer"
        subtitle="Move stock between warehouse locations"
        fromLabel="From Location"
        toLabel="To Location"
        referencePrefix="TR-2024-XXX"
      />
    </div>
  );
}
