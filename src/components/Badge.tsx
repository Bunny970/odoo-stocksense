import { CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';
import type { MoveStatus } from '@/lib/supabase';

interface StatusBadgeProps {
  status: MoveStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config: Record<MoveStatus, { label: string; classes: string; icon: React.ReactNode }> = {
    pending: {
      label: 'Pending',
      classes: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    validated: {
      label: 'Validated',
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    cancelled: {
      label: 'Cancelled',
      classes: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
  };

  const c = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${c.classes}`}>
      {c.icon}
      {c.label}
    </span>
  );
}

interface StockBadgeProps {
  quantity: number;
  reorderPoint: number;
}

export function StockBadge({ quantity, reorderPoint }: StockBadgeProps) {
  if (quantity <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-rose-50 text-rose-700 border-rose-200">
        <AlertTriangle className="w-3.5 h-3.5" />
        Out of stock
      </span>
    );
  }
  if (quantity <= reorderPoint) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
        <AlertTriangle className="w-3.5 h-3.5" />
        Low stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
      <CheckCircle2 className="w-3.5 h-3.5" />
      In stock
    </span>
  );
}
