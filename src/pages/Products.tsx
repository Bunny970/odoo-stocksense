import { useState, useMemo } from 'react';
import { Search, Plus, Package, DollarSign, AlertTriangle } from 'lucide-react';
import { useProducts } from '@/lib/hooks';
import { supabase, type Product } from '@/lib/supabase';
import { Modal } from '@/components/Modal';
import { StockBadge } from '@/components/Badge';
import { Spinner } from '@/components/Spinner';

interface FormErrors {
  sku?: string;
  name?: string;
  category?: string;
  quantity_on_hand?: string;
  reorder_point?: string;
  unit_price?: string;
  location?: string;
}

export function Products() {
  const { products, loading, error, refetch } = useProducts();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [form, setForm] = useState({
    sku: '',
    name: '',
    category: '',
    description: '',
    quantity_on_hand: '',
    reorder_point: '',
    unit_price: '',
    location: '',
  });

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ['all', ...Array.from(cats).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'low' && p.quantity_on_hand <= p.reorder_point) ||
        (stockFilter === 'out' && p.quantity_on_hand <= 0) ||
        (stockFilter === 'ok' && p.quantity_on_hand > p.reorder_point);
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, search, categoryFilter, stockFilter]);

  function validateForm(): boolean {
    const errs: FormErrors = {};

    if (!form.sku.trim()) {
      errs.sku = 'SKU is required';
    } else if (!/^[A-Za-z0-9\-]+$/.test(form.sku.trim())) {
      errs.sku = 'SKU can only contain letters, numbers, and hyphens';
    }

    if (!form.name.trim()) {
      errs.name = 'Product name is required';
    } else if (form.name.trim().length < 3) {
      errs.name = 'Name must be at least 3 characters';
    }

    if (!form.category.trim()) {
      errs.category = 'Category is required';
    }

    const qty = parseInt(form.quantity_on_hand);
    if (form.quantity_on_hand === '' || isNaN(qty)) {
      errs.quantity_on_hand = 'Quantity is required';
    } else if (qty < 0) {
      errs.quantity_on_hand = 'Quantity cannot be negative';
    }

    const reorder = parseInt(form.reorder_point);
    if (form.reorder_point === '' || isNaN(reorder)) {
      errs.reorder_point = 'Reorder point is required';
    } else if (reorder < 0) {
      errs.reorder_point = 'Reorder point cannot be negative';
    }

    const price = parseFloat(form.unit_price);
    if (form.unit_price === '' || isNaN(price)) {
      errs.unit_price = 'Unit price is required';
    } else if (price < 0) {
      errs.unit_price = 'Price cannot be negative';
    }

    if (form.location && form.location.length > 50) {
      errs.location = 'Location must be 50 characters or less';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) return;

    // Check SKU uniqueness
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('sku', form.sku.trim())
      .maybeSingle();

    if (existing) {
      setFormErrors((prev) => ({ ...prev, sku: 'A product with this SKU already exists' }));
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('products').insert({
      sku: form.sku.trim(),
      name: form.name.trim(),
      category: form.category.trim(),
      description: form.description.trim() || null,
      quantity_on_hand: parseInt(form.quantity_on_hand),
      reorder_point: parseInt(form.reorder_point),
      unit_price: parseFloat(form.unit_price),
      location: form.location.trim() || null,
    });

    if (error) {
      setSubmitError(error.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setModalOpen(false);
    setForm({ sku: '', name: '', category: '', description: '', quantity_on_hand: '', reorder_point: '', unit_price: '', location: '' });
    setFormErrors({});
    refetch();
  }

  function openModal() {
    setFormErrors({});
    setSubmitError(null);
    setForm({ sku: '', name: '', category: '', description: '', quantity_on_hand: '', reorder_point: '', unit_price: '', location: '' });
    setModalOpen(true);
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Products</h2>
          <p className="text-slate-500 mt-1">{products.length} products in catalog</p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
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
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === 'all' ? 'All Categories' : c}
            </option>
          ))}
        </select>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
        >
          <option value="all">All Stock</option>
          <option value="ok">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Product</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">SKU</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Category</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">On Hand</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Reorder</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Unit Price</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Location</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No products found
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{p.name}</p>
                          {p.description && (
                            <p className="text-xs text-slate-400 truncate max-w-xs">{p.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">{p.sku}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 text-right">
                      {p.quantity_on_hand}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 text-right">{p.reorder_point}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-right">
                      ${p.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{p.location || '—'}</td>
                    <td className="px-6 py-4">
                      <StockBadge quantity={p.quantity_on_hand} reorderPoint={p.reorder_point} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add New Product" subtitle="Enter product details below" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                SKU <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="SKU-1001"
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all ${
                  formErrors.sku ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white focus:border-sky-500'
                }`}
              />
              {formErrors.sku && <p className="text-xs text-rose-600 mt-1">{formErrors.sku}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Wireless Mouse Pro"
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all ${
                  formErrors.name ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white focus:border-sky-500'
                }`}
              />
              {formErrors.name && <p className="text-xs text-rose-600 mt-1">{formErrors.name}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Category <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Electronics"
                list="category-suggestions"
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all ${
                  formErrors.category ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white focus:border-sky-500'
                }`}
              />
              <datalist id="category-suggestions">
                {categories.filter((c) => c !== 'all').map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              {formErrors.category && <p className="text-xs text-rose-600 mt-1">{formErrors.category}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="A-01-03"
                maxLength={50}
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all ${
                  formErrors.location ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white focus:border-sky-500'
                }`}
              />
              {formErrors.location && <p className="text-xs text-rose-600 mt-1">{formErrors.location}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief product description..."
              rows={2}
              className="w-full px-3.5 py-2.5 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Qty on Hand <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={form.quantity_on_hand}
                onChange={(e) => setForm({ ...form, quantity_on_hand: e.target.value })}
                placeholder="0"
                min={0}
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all ${
                  formErrors.quantity_on_hand ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white focus:border-sky-500'
                }`}
              />
              {formErrors.quantity_on_hand && <p className="text-xs text-rose-600 mt-1">{formErrors.quantity_on_hand}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Reorder Point <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={form.reorder_point}
                onChange={(e) => setForm({ ...form, reorder_point: e.target.value })}
                placeholder="10"
                min={0}
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all ${
                  formErrors.reorder_point ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white focus:border-sky-500'
                }`}
              />
              {formErrors.reorder_point && <p className="text-xs text-rose-600 mt-1">{formErrors.reorder_point}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Unit Price ($) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={form.unit_price}
                onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                placeholder="29.99"
                min={0}
                step="0.01"
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all ${
                  formErrors.unit_price ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white focus:border-sky-500'
                }`}
              />
              {formErrors.unit_price && <p className="text-xs text-rose-600 mt-1">{formErrors.unit_price}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {submitting ? <Spinner size={16} /> : <Plus className="w-4 h-4" />}
              {submitting ? 'Saving...' : 'Add Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
