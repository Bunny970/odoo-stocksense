import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type MoveType = 'receipt' | 'delivery' | 'transfer' | 'adjustment';
export type MoveStatus = 'pending' | 'validated' | 'cancelled';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  description: string | null;
  quantity_on_hand: number;
  reorder_point: number;
  unit_price: number;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface Move {
  id: string;
  move_type: MoveType;
  product_id: string;
  quantity: number;
  from_location: string | null;
  to_location: string | null;
  reference: string | null;
  status: MoveStatus;
  variance: number | null;
  unit_cost: number | null;
  notes: string | null;
  created_at: string;
  validated_at: string | null;
}

export interface MoveWithProduct extends Move {
  product?: Pick<Product, 'id' | 'sku' | 'name' | 'category' | 'location'>;
}

export type ProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'quantity_on_hand'> & {
  quantity_on_hand?: number;
};

export type MoveInput = Omit<Move, 'id' | 'created_at' | 'validated_at' | 'status' | 'variance'> & {
  status?: MoveStatus;
};
