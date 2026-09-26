/*
# StockSense Inventory Management Schema

## Overview
Creates the full database schema for a single-tenant inventory management system.
No authentication — all policies use `anon, authenticated` since the data is intentionally shared.

## New Tables

### products
- `id` (uuid, PK)
- `sku` (text, unique, not null) — stock keeping unit
- `name` (text, not null)
- `category` (text, not null)
- `description` (text)
- `quantity_on_hand` (integer, not null, default 0)
- `reorder_point` (integer, not null, default 10)
- `unit_price` (numeric(12,2), not null, default 0)
- `location` (text) — default storage location
- `created_at` (timestamptz, default now)
- `updated_at` (timestamptz, default now)

### moves
Tracks every inventory movement (receipts, deliveries, transfers, adjustments).
- `id` (uuid, PK)
- `move_type` (text, not null) — 'receipt' | 'delivery' | 'transfer' | 'adjustment'
- `product_id` (uuid, FK -> products.id)
- `quantity` (integer, not null) — qty moved (for adjustment: the counted qty; variance stored separately)
- `from_location` (text) — source location / supplier
- `to_location` (text) — destination location / customer
- `reference` (text) — document reference (PO#, SO#, etc.)
- `status` (text, not null, default 'pending') — 'pending' | 'validated' | 'cancelled'
- `variance` (integer) — adjustment variance (counted - on_hand_at_validation)
- `unit_cost` (numeric(12,2)) — cost per unit at time of move
- `notes` (text)
- `created_at` (timestamptz, default now)
- `validated_at` (timestamptz)

## Functions

### validate_move(uuid)
Atomically validates a pending move:
1. Locks the product row.
2. Checks the move is still pending (prevents double-validation).
3. Updates product quantity_on_hand based on move_type:
   - receipt: +quantity
   - delivery: -quantity (checks sufficient stock)
   - transfer: no net change (stock moves between locations, tracked in ledger)
   - adjustment: sets quantity_on_hand = quantity (the counted value), records variance
4. Sets move status to 'validated' and validated_at = now().
Returns the updated product quantity_on_hand, or raises exception on error.

### cancel_move(uuid)
Cancels a pending move (sets status to 'cancelled'). Only works on pending moves.

## Security
- RLS enabled on both tables.
- `anon, authenticated` CRUD on both (single-tenant, no auth).

## Seed Data
- 12 realistic products across categories (Electronics, Office, Packaging, Tools).
- 8 pending moves (mix of receipts, deliveries, transfers, adjustments).
*/

-- ============ PRODUCTS ============
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  description text,
  quantity_on_hand integer NOT NULL DEFAULT 0,
  reorder_point integer NOT NULL DEFAULT 10,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE
  TO anon, authenticated USING (true);

-- ============ MOVES ============
CREATE TABLE IF NOT EXISTS moves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  move_type text NOT NULL CHECK (move_type IN ('receipt', 'delivery', 'transfer', 'adjustment')),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  from_location text,
  to_location text,
  reference text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'cancelled')),
  variance integer,
  unit_cost numeric(12,2),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  validated_at timestamptz
);

ALTER TABLE moves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_moves" ON moves;
CREATE POLICY "anon_select_moves" ON moves FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_moves" ON moves;
CREATE POLICY "anon_insert_moves" ON moves FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_moves" ON moves;
CREATE POLICY "anon_update_moves" ON moves FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_moves" ON moves;
CREATE POLICY "anon_delete_moves" ON moves FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_moves_product_id ON moves(product_id);
CREATE INDEX IF NOT EXISTS idx_moves_status ON moves(status);
CREATE INDEX IF NOT EXISTS idx_moves_move_type ON moves(move_type);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- ============ VALIDATE_MOVE FUNCTION ============
CREATE OR REPLACE FUNCTION validate_move(p_move_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_move_type text;
  v_product_id uuid;
  v_quantity integer;
  v_status text;
  v_current_qty integer;
  v_variance integer;
  v_new_qty integer;
BEGIN
  -- Get the move details and lock it
  SELECT m.move_type, m.product_id, m.quantity, m.status
    INTO v_move_type, v_product_id, v_quantity, v_status
  FROM moves m
  WHERE m.id = p_move_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Move not found';
  END IF;

  IF v_status != 'pending' THEN
    RAISE EXCEPTION 'Move is not pending (current status: %)', v_status;
  END IF;

  -- Lock the product row
  SELECT p.quantity_on_hand INTO v_current_qty
  FROM products p
  WHERE p.id = v_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  -- Apply stock change based on move type
  CASE v_move_type
    WHEN 'receipt' THEN
      v_new_qty := v_current_qty + v_quantity;
      UPDATE products SET quantity_on_hand = v_new_qty, updated_at = now()
        WHERE id = v_product_id;

    WHEN 'delivery' THEN
      IF v_current_qty < v_quantity THEN
        RAISE EXCEPTION 'Insufficient stock: have %, need %', v_current_qty, v_quantity;
      END IF;
      v_new_qty := v_current_qty - v_quantity;
      UPDATE products SET quantity_on_hand = v_new_qty, updated_at = now()
        WHERE id = v_product_id;

    WHEN 'transfer' THEN
      -- Transfers don't change total qty; they move between locations
      -- For this single-location-per-product model, qty stays the same
      v_new_qty := v_current_qty;
      UPDATE products SET updated_at = now() WHERE id = v_product_id;

    WHEN 'adjustment' THEN
      -- quantity field holds the counted physical qty
      v_variance := v_quantity - v_current_qty;
      v_new_qty := v_quantity;
      UPDATE products SET quantity_on_hand = v_new_qty, updated_at = now()
        WHERE id = v_product_id;
      -- Store variance on the move
      UPDATE moves SET variance = v_variance WHERE id = p_move_id;

    ELSE
      RAISE EXCEPTION 'Unknown move type: %', v_move_type;
  END CASE;

  -- Mark move as validated
  UPDATE moves SET status = 'validated', validated_at = now()
    WHERE id = p_move_id;

  RETURN v_new_qty;
END;
$$;

-- ============ CANCEL_MOVE FUNCTION ============
CREATE OR REPLACE FUNCTION cancel_move(p_move_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
BEGIN
  SELECT m.status INTO v_status FROM moves m WHERE m.id = p_move_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Move not found';
  END IF;

  IF v_status != 'pending' THEN
    RAISE EXCEPTION 'Cannot cancel move with status: %', v_status;
  END IF;

  UPDATE moves SET status = 'cancelled' WHERE id = p_move_id;
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION validate_move(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cancel_move(uuid) TO anon, authenticated;

-- ============ SEED DATA ============
INSERT INTO products (sku, name, category, description, quantity_on_hand, reorder_point, unit_price, location) VALUES
('SKU-1001', 'Wireless Mouse Pro', 'Electronics', 'Ergonomic 2.4GHz wireless mouse with USB-C charging', 145, 50, 29.99, 'A-01-03'),
('SKU-1002', 'Mechanical Keyboard', 'Electronics', 'Full-size RGB mechanical keyboard, blue switches', 32, 40, 89.99, 'A-01-04'),
('SKU-1003', 'USB-C Hub 7-in-1', 'Electronics', 'Multi-port USB-C hub with HDMI, SD card reader', 8, 25, 49.99, 'A-02-01'),
('SKU-1004', '27-inch 4K Monitor', 'Electronics', 'IPS panel, USB-C 90W power delivery', 18, 10, 349.99, 'B-01-01'),
('SKU-2001', 'A4 Paper Ream (500)', 'Office Supplies', '80gsm white printer paper, 500 sheets', 320, 100, 6.50, 'C-01-01'),
('SKU-2002', 'Ballpoint Pen Box (50)', 'Office Supplies', 'Blue ink, 0.7mm tip, box of 50', 15, 30, 12.00, 'C-01-02'),
('SKU-2003', 'Sticky Notes Pack', 'Office Supplies', 'Assorted colors, 3x3 inch, 12 pads', 75, 40, 8.99, 'C-02-01'),
('SKU-2004', 'Desk Organizer Tray', 'Office Supplies', 'Metal mesh desk organizer with 5 compartments', 22, 15, 18.50, 'C-03-01'),
('SKU-3001', 'Cardboard Box Medium', 'Packaging', 'Double-wall corrugated box, 400x300x200mm', 5, 200, 1.20, 'D-01-01'),
('SKU-3002', 'Bubble Wrap Roll 100m', 'Packaging', 'Small bubble protective wrap, 100 meter roll', 48, 20, 24.99, 'D-01-02'),
('SKU-3003', 'Packing Tape Clear', 'Packaging', '48mm x 100m clear packing tape', 12, 50, 4.50, 'D-02-01'),
('SKU-4001', 'Cordless Drill 18V', 'Tools', 'Variable speed cordless drill with 2 batteries', 7, 8, 129.99, 'E-01-01')
ON CONFLICT (sku) DO NOTHING;

-- Seed some pending moves
INSERT INTO moves (move_type, product_id, quantity, from_location, to_location, reference, status, unit_cost, notes)
SELECT 'receipt', p.id, 50, 'Supplier: TechImport Ltd', 'Warehouse A', 'PO-2024-001', 'pending', 29.99, 'Restock wireless mice'
FROM products p WHERE p.sku = 'SKU-1001' AND NOT EXISTS (SELECT 1 FROM moves m WHERE m.reference = 'PO-2024-001');

INSERT INTO moves (move_type, product_id, quantity, from_location, to_location, reference, status, unit_cost, notes)
SELECT 'receipt', p.id, 25, 'Supplier: TechImport Ltd', 'Warehouse A', 'PO-2024-002', 'pending', 49.99, 'Restock USB-C hubs'
FROM products p WHERE p.sku = 'SKU-1003' AND NOT EXISTS (SELECT 1 FROM moves m WHERE m.reference = 'PO-2024-002');

INSERT INTO moves (move_type, product_id, quantity, from_location, to_location, reference, status, notes)
SELECT 'delivery', p.id, 5, 'Warehouse A', 'Customer: Apex Corp', 'SO-2024-101', 'pending', 'Order for Apex Corp'
FROM products p WHERE p.sku = 'SKU-1004' AND NOT EXISTS (SELECT 1 FROM moves m WHERE m.reference = 'SO-2024-101');

INSERT INTO moves (move_type, product_id, quantity, from_location, to_location, reference, status, notes)
SELECT 'delivery', p.id, 10, 'Warehouse A', 'Customer: BrightSchools', 'SO-2024-102', 'pending', 'School bulk order'
FROM products p WHERE p.sku = 'SKU-2002' AND NOT EXISTS (SELECT 1 FROM moves m WHERE m.reference = 'SO-2024-102');

INSERT INTO moves (move_type, product_id, quantity, from_location, to_location, reference, status, notes)
SELECT 'delivery', p.id, 2, 'Warehouse A', 'Customer: HomeFix DIY', 'SO-2024-103', 'pending', 'Drill order'
FROM products p WHERE p.sku = 'SKU-4001' AND NOT EXISTS (SELECT 1 FROM moves m WHERE m.reference = 'SO-2024-103');

INSERT INTO moves (move_type, product_id, quantity, from_location, to_location, reference, status, notes)
SELECT 'transfer', p.id, 20, 'Warehouse A', 'Warehouse B', 'TR-2024-001', 'pending', 'Transfer paper stock to Warehouse B'
FROM products p WHERE p.sku = 'SKU-2001' AND NOT EXISTS (SELECT 1 FROM moves m WHERE m.reference = 'TR-2024-001');

INSERT INTO moves (move_type, product_id, quantity, from_location, to_location, reference, status, notes)
SELECT 'transfer', p.id, 10, 'Warehouse A', 'Store Front', 'TR-2024-002', 'pending', 'Move monitors to store front'
FROM products p WHERE p.sku = 'SKU-1004' AND NOT EXISTS (SELECT 1 FROM moves m WHERE m.reference = 'TR-2024-002');

INSERT INTO moves (move_type, product_id, quantity, from_location, to_location, reference, status, notes)
SELECT 'adjustment', p.id, 3, 'Warehouse A', NULL, 'ADJ-2024-001', 'pending', 'Cycle count: only 3 drills found'
FROM products p WHERE p.sku = 'SKU-4001' AND NOT EXISTS (SELECT 1 FROM moves m WHERE m.reference = 'ADJ-2024-001');

-- Seed a few validated moves for ledger history
INSERT INTO moves (move_type, product_id, quantity, from_location, to_location, reference, status, unit_cost, validated_at, notes)
SELECT 'receipt', p.id, 100, 'Supplier: TechImport Ltd', 'Warehouse A', 'PO-2024-000', 'validated', 29.99, now() - interval '5 days', 'Initial stock'
FROM products p WHERE p.sku = 'SKU-1001' AND NOT EXISTS (SELECT 1 FROM moves m WHERE m.reference = 'PO-2024-000');

INSERT INTO moves (move_type, product_id, quantity, from_location, to_location, reference, status, unit_cost, validated_at, notes)
SELECT 'delivery', p.id, 5, 'Warehouse A', 'Customer: TechRetail Inc', 'SO-2024-099', 'validated', 89.99, now() - interval '3 days', 'Keyboard order'
FROM products p WHERE p.sku = 'SKU-1002' AND NOT EXISTS (SELECT 1 FROM moves m WHERE m.reference = 'SO-2024-099');
