-- Create a trigger function to check inventory item limits
CREATE OR REPLACE FUNCTION public.check_inventory_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if adding this quantity would exceed the limit of 10 for this item
    IF (SELECT COALESCE(SUM(quantity), 0) FROM inventory 
        WHERE user_id = NEW.user_id AND item_id = NEW.item_id) + NEW.quantity > 10 THEN
        RAISE EXCEPTION 'Limite de 10 itens por tipo atingido para este item';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger function to check inventory limit on updates
CREATE OR REPLACE FUNCTION public.check_inventory_limit_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the new quantity would exceed the limit of 10 for this item
    IF (SELECT COALESCE(SUM(quantity), 0) FROM inventory 
        WHERE user_id = NEW.user_id AND item_id = NEW.item_id AND id != NEW.id) + NEW.quantity > 10 THEN
        RAISE EXCEPTION 'Limite de 10 itens por tipo atingido para este item';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to enforce the limit
CREATE TRIGGER trigger_check_inventory_limit_insert
    BEFORE INSERT ON public.inventory
    FOR EACH ROW
    EXECUTE FUNCTION public.check_inventory_limit();

CREATE TRIGGER trigger_check_inventory_limit_update
    BEFORE UPDATE ON public.inventory
    FOR EACH ROW
    EXECUTE FUNCTION public.check_inventory_limit_update();