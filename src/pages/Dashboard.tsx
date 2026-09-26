import { useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from 'lucide-react';
import { useProducts, useMoves } from '@/lib/hooks';
import { FullPageSpinner } from '@/components/Spinner';
import { StockBadge } from '@/components/Badge';
import type { PageKey } from '@/types';

interface DashboardProps {
  onNavigate: (page: PageKey) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { products, loading: pLoading } = useProducts();
  const { moves, loading: mLoading } = useMoves();

  const stats = useMemo(() => {
    const lowStock = products.filter((p) => p.quantity_on_hand <= p.reorder_point);
    const pendingReceipts = moves.filter((m) => m.move_type === 'receipt' && m.status === 'pending');
    const pendingDeliveries = moves.filter((m) => m.move_type === 'delivery' && m.status === 'pending');
    const totalValue = products.reduce((sum, p) => sum + p.quantity_on_hand * p.unit_price, 0);
    return {
      totalProducts: products.length,
      lowStock: lowStock.length,
      pendingReceipts: pendingReceipts.length,
      pendingDeliveries: pendingDeliveries.length,
      totalValue,
      lowStockItems: lowStock,
    };
  }, [products, moves]);

  if (pLoading || mLoading) return <FullPageSpinner />;

  const kpiCards = [
    {
      label: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      gradient: 'from-sky-500 to-blue-600',
      iconBg: 'bg-sky-500',
      page: 'products' as PageKey,
    },
    {
      label: 'Low Stock Alerts',
      value: stats.lowStock,
      icon: AlertTriangle,
      gradient: 'from-amber-500 to-orange-600',
      iconBg: 'bg-amber-500',
      page: 'products' as PageKey,
    },
    {
      label: 'Pending Receipts',
      value: stats.pendingReceipts,
      icon: ArrowDownToLine,
      gradient: 'from-emerald-500 to-green-600',
      iconBg: 'bg-emerald-500',
      page: 'receipts' as PageKey,
    },
    {
      label: 'Pending Deliveries',
      value: stats.pendingDeliveries,
      icon: ArrowUpFromLine,
      gradient: 'from-rose-500 to-red-600',
      iconBg: 'bg-rose-500',
      page: 'deliveries' as PageKey,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-slate-500 mt-1">Overview of your inventory and operations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              onClick={() => onNavigate(card.page)}
              className="group bg-white rounded-2xl border border-slate-200 p-5 text-left hover:shadow-lg hover:border-slate-300 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl font-bold text-slate-900">{card.value}</span>
              </div>
              <p className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                {card.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Inventory Value + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Inventory Value */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Inventory Value</p>
              <p className="text-2xl font-bold text-slate-900">
                ${stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>{stats.totalProducts} unique SKUs tracked</span>
          </div>
        </div>

        {/* Low Stock List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-slate-900">Low Stock Items</h3>
            </div>
            <button
              onClick={() => onNavigate('products')}
              className="text-sm text-sky-600 hover:text-sky-700 font-medium"
            >
              View all
            </button>
          </div>
          {stats.lowStockItems.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">All products are well stocked</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.lowStockItems.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                      <Package className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.sku} · {p.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-700">
                      {p.quantity_on_hand} / {p.reorder_point}
                    </span>
                    <StockBadge quantity={p.quantity_on_hand} reorderPoint={p.reorder_point} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Recent Movements</h3>
          <button
            onClick={() => onNavigate('ledger')}
            className="text-sm text-sky-600 hover:text-sky-700 font-medium"
          >
            View ledger
          </button>
        </div>
        <div className="space-y-2">
          {moves.slice(0, 6).map((m) => {
            const isReceipt = m.move_type === 'receipt';
            const isDelivery = m.move_type === 'delivery';
            const Icon = isReceipt ? ArrowDownToLine : isDelivery ? ArrowUpFromLine : TrendingDown;
            const iconColor = isReceipt ? 'text-emerald-600 bg-emerald-50' : isDelivery ? 'text-rose-600 bg-rose-50' : 'text-sky-600 bg-sky-50';
            return (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {m.product?.name || 'Unknown product'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {m.reference} · {m.move_type} · {m.quantity} units
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(m.created_at).toLocaleDateString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
