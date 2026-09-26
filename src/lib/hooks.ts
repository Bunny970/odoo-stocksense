import { useEffect, useState, useCallback } from 'react';
import { supabase, type Product, type MoveWithProduct } from '@/lib/supabase';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    if (error) {
      setError(error.message);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}

export function useMoves(filterType?: string) {
  const [moves, setMoves] = useState<MoveWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMoves = useCallback(async () => {
    setLoading(true);
    setError(null);
    let query = supabase
      .from('moves')
      .select('*, product:products(id, sku, name, category, location)')
      .order('created_at', { ascending: false });
    if (filterType) {
      query = query.eq('move_type', filterType);
    }
    const { data, error } = await query;
    if (error) {
      setError(error.message);
    } else {
      setMoves(data || []);
    }
    setLoading(false);
  }, [filterType]);

  useEffect(() => {
    fetchMoves();
  }, [fetchMoves]);

  return { moves, loading, error, refetch: fetchMoves };
}
