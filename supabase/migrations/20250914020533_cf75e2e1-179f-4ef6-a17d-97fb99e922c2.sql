-- Stronger guard: require explicit MANUAL_* marker to change pickup orders out of pending
CREATE OR REPLACE FUNCTION public.enforce_manual_for_pickup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF (COALESCE(LOWER(OLD.delivery_type), 'pickup') = 'pickup')
     AND OLD.status = 'pending'
     AND (NEW.status IS DISTINCT FROM OLD.status OR NEW.manager_approved IS DISTINCT FROM OLD.manager_approved)
  THEN
    -- Allow only if manager added an explicit MANUAL_ marker in notes
    IF position('MANUAL_' in COALESCE(NEW.manager_notes, '')) = 0 THEN
      NEW.status := OLD.status;
      NEW.manager_approved := OLD.manager_approved;
      NEW.approved_at := OLD.approved_at;
      NEW.manager_notes := COALESCE(NEW.manager_notes, '') || ' [pickup protegido: alteração automática bloqueada]';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger
DROP TRIGGER IF EXISTS enforce_manual_for_pickup_trigger ON public.orders;
CREATE TRIGGER enforce_manual_for_pickup_trigger
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.enforce_manual_for_pickup();