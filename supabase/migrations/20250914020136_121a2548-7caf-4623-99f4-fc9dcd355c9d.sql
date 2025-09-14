-- Ensure pickup orders cannot be auto-approved by any background job
-- Create trigger to prevent auto-approving pickups

-- Drop existing trigger if present to avoid duplicates
DROP TRIGGER IF EXISTS prevent_auto_approve_pickup_orders_trigger ON public.orders;

-- Create the trigger using the already-defined function public.prevent_auto_approve_pickup_orders()
CREATE TRIGGER prevent_auto_approve_pickup_orders_trigger
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.prevent_auto_approve_pickup_orders();

-- Optional: also add a stricter guard using the other helper if it exists
-- (Safe to create; it will simply enforce the same rule)
DROP TRIGGER IF EXISTS prevent_pickup_auto_approval_trigger ON public.orders;
CREATE TRIGGER prevent_pickup_auto_approval_trigger
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.prevent_pickup_auto_approval();

-- Add helpful comment for maintainers
COMMENT ON TRIGGER prevent_auto_approve_pickup_orders_trigger ON public.orders IS 'Blocks any automatic approval for pickup orders by reverting changes to keep them pending until manual manager action.';
COMMENT ON TRIGGER prevent_pickup_auto_approval_trigger ON public.orders IS 'Additional safeguard to keep pickup orders pending and require manual approval.';