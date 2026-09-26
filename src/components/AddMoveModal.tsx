import { useState, useMemo } from 'react';
import { supabase, type Product, type MoveType } from '@/lib/supabase';
import { Modal } from '@/components/Modal';
import { Spinner } from '@/components/Spinner';
import { Plus } from 'lucide-react';

interface AddMoveModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moveType: MoveType;
  products: Product[];
  title: string;
  subtitle: string;
  fromLabel: string;
  toLabel: string;
  showCost?: boolean;
  referencePrefix: string;
}

interface FormErrors {
  product_id?: string;
  quantity?: string;
  from_location?: string;
  to_location?: string;
  reference?: string;
  unit_cost?: string;
}

export function AddMoveModal({
  open,
  onClose,
  onSuccess,
  moveType,
  products,
  title,
  subtitle,
  fromLabel,
  toLabel,
  showCost = false,
  referencePrefix,
}: AddMoveModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [form, setForm] = useState({
    product_id: '',
    quantity: '',
    from_location: '',
    to_location: '',
    reference: '',
    unit_cost: '',
    notes: '',
  });

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === form.product_id),
    [products, form.product_id]
  );

  function validateForm(): boolean {
    const errs: FormErrors = {};

    if (!form.product_id) errs.product_id = 'Please select a product';

    const qty = parseInt(form.quantity);
    if (form.quantity === '' || isNaN(qty)) {
      errs.quantity = 'Quantity is required';
    } else if (qty <= 0) {
      errs.quantity = 'Quantity must be greater than 0';
    } else if (moveType === 'delivery' && selectedProduct && qty > selectedProduct.quantity_on_hand) {
      errs.quantity = `Insufficient stock (only ${selectedProduct.quantity_on_hand} available)`;
    }

    if (!form.from_location.trim()) errs.from_location = `${fromLabel} is required`;
    if (moveType !== 'adjustment' && !form.to_location.trim()) errs.to_location = `${toLabel} is required`;

    if (!form.reference.trim()) {
      errs.reference = 'Reference is required';
    }

    if (showCost && form.unit_cost) {
      const cost = parseFloat(form.unit_cost);
      if (isNaN(cost) || cost < 0) {
        errs.unit_cost = 'Invalid cost';
      }
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validateForm()) return;

    setSubmitting(true);
    const insertData: Record<string, unknown> = {
      move_type: moveType,
      product_id: form.product_id,
      quantity: parseInt(form.quantity),
      from_location: form.from_location.trim(),
      to_location: form.to_location.trim() || null,
      reference: form.reference.trim(),
      status: 'pending',
      notes: form.notes.trim() || null,
    };
    if (showCost && form.unit_cost) {
      insertData.unit_cost = parseFloat(form.unit_cost);
    }

    const { error } = await supabase.from('moves').insert(insertData);

    if (error) {
      setSubmitError(error.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    onClose();
    setForm({ product_id: '', quantity: '', from_location: '', to_location: '', reference: '', unit_cost: '', notes: '' });
    setFormErrors({});
    onSuccess();
  }

  function handleClose() {
    setFormErrors({});
    setSubmitError(null);
    setForm({ product_id: '', quantity: '', from_location: '', to_location: '', reference: '', unit_cost: '', notes: '' });
    onClose();
  }

  const inputClass = (err?: string) =>
    `w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all ${
      err ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white focus:border-sky-500'
    }`;

  return (
    <Modal open={open} onClose={handleClose} title={title} subtitle={subtitle} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {submitError && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700">
            {submitError}
          </div>
        )}

        {/* Product Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Product <span className="text-rose-500">*</span>
          </label>
          <select
            value={form.product_id}
            onChange={(e) => setForm({ ...form, product_id: e.target.value })}
            className={inputClass(formErrors.product_id)}
          >
            <option value="">Select a product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} — {p.name} (Stock: {p.quantity_on_hand})
              </option>
            ))}
          </select>
          {formErrors.product_id && <p className="text-xs text-rose-600 mt-1">{formErrors.product_id}</p>}
        </div>

        {/* Quantity + Cost */}
        <div className={`grid ${showCost ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Quantity <span className="text-rose-500">*</span>
              {moveType === 'adjustment' && (
                <span className="ml-1 text-xs font-normal text-slate-400">(physical count)</span>
              )}
            </label>
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              placeholder="0"
              min={0}
              className={inputClass(formErrors.quantity)}
            />
            {formErrors.quantity && <p className="text-xs text-rose-600 mt-1">{formErrors.quantity}</p>}
          </div>
          {showCost && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Unit Cost ($)</label>
              <input
                type="number"
                value={form.unit_cost}
                onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
                placeholder="0.00"
                min={0}
                step="0.01"
                className={inputClass(formErrors.unit_cost)}
              />
              {formErrors.unit_cost && <p className="text-xs text-rose-600 mt-1">{formErrors.unit_cost}</p>}
            </div>
          )}
        </div>

        {/* From / To */}
        <div className={`grid ${moveType === 'adjustment' ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {fromLabel} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form.from_location}
              onChange={(e) => setForm({ ...form, from_location: e.target.value })}
              placeholder={moveType === 'receipt' ? 'Supplier name' : moveType === 'delivery' ? 'Warehouse' : moveType === 'transfer' ? 'Source location' : 'Location'}
              className={inputClass(formErrors.from_location)}
            />
            {formErrors.from_location && <p className="text-xs text-rose-600 mt-1">{formErrors.from_location}</p>}
          </div>
          {moveType !== 'adjustment' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {toLabel} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.to_location}
                onChange={(e) => setForm({ ...form, to_location: e.target.value })}
                placeholder={moveType === 'receipt' ? 'Warehouse' : moveType === 'delivery' ? 'Customer name' : 'Destination location'}
                className={inputClass(formErrors.to_location)}
              />
              {formErrors.to_location && <p className="text-xs text-rose-600 mt-1">{formErrors.to_location}</p>}
            </div>
          )}
        </div>

        {/* Reference */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Reference <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
            placeholder={referencePrefix}
            className={inputClass(formErrors.reference)}
          />
          {formErrors.reference && <p className="text-xs text-rose-600 mt-1">{formErrors.reference}</p>}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Optional notes..."
            rows={2}
            className="w-full px-3.5 py-2.5 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
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
            {submitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
