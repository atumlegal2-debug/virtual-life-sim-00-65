-- Add inventory limit and consolidation triggers
DROP TRIGGER IF EXISTS trg_inventory_check_limit_insert ON public.inventory;
DROP TRIGGER IF EXISTS trg_inventory_check_limit_update ON public.inventory;
DROP TRIGGER IF EXISTS trg_inventory_consolidate ON public.inventory;

-- Enforce max 10 items per type on insert
CREATE TRIGGER trg_inventory_check_limit_insert
BEFORE INSERT ON public.inventory
FOR EACH ROW
EXECUTE FUNCTION public.check_inventory_limit();

-- Enforce max 10 items per type on update
CREATE TRIGGER trg_inventory_check_limit_update
BEFORE UPDATE ON public.inventory
FOR EACH ROW
EXECUTE FUNCTION public.check_inventory_limit_update();

-- Consolidate duplicate items (same user_id + item_id)
CREATE TRIGGER trg_inventory_consolidate
BEFORE INSERT ON public.inventory
FOR EACH ROW
EXECUTE FUNCTION public.consolidate_duplicate_inventory_items();