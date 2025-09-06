-- Fix RLS policies for transactions table to allow managers to create purchase transactions

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;

-- Create new policies that allow managers to create purchase transactions
CREATE POLICY "Users can create transfer transactions" 
ON transactions FOR INSERT 
WITH CHECK (
  transaction_type = 'transfer' AND 
  from_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Managers can create purchase transactions" 
ON transactions FOR INSERT 
WITH CHECK (
  transaction_type IN ('purchase', 'store_transfer', 'motoboy_delivery')
);

CREATE POLICY "Users can view their own transactions" 
ON transactions FOR SELECT 
USING (
  from_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR 
  to_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Also create missing transactions for approved orders that don't have transaction records
-- This will fix the historical data
INSERT INTO transactions (
  from_user_id,
  to_user_id, 
  from_username,
  to_username,
  amount,
  transaction_type,
  description,
  created_at
)
SELECT 
  o.user_id,
  o.user_id,
  u.username,
  'Sistema',
  o.total_amount,
  'purchase',
  CONCAT('Compra na ', COALESCE(s.name, o.store_id), ': ', 
    COALESCE(
      (SELECT string_agg(item->>'name', ', ') FROM jsonb_array_elements(o.items) AS item), 
      'Itens diversos'
    )
  ),
  COALESCE(o.approved_at, o.updated_at)
FROM orders o
JOIN users u ON o.user_id = u.id
LEFT JOIN stores s ON o.store_id = s.id
WHERE o.manager_approved = true 
AND NOT EXISTS (
  SELECT 1 FROM transactions t 
  WHERE t.from_user_id = o.user_id 
  AND t.transaction_type = 'purchase' 
  AND t.amount = o.total_amount
  AND DATE(t.created_at) = DATE(COALESCE(o.approved_at, o.updated_at))
);