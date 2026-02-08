
CREATE OR REPLACE FUNCTION public.restore_stock_on_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only run when status changes TO 'בוטלה' (and wasn't already cancelled)
  IF NEW.status = 'בוטלה' AND (OLD.status IS DISTINCT FROM 'בוטלה') THEN
    UPDATE public.flowers f
    SET quantity = f.quantity + oi.quantity,
        in_stock = true
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.flower_id = f.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_restore_stock_on_cancel
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.restore_stock_on_cancel();
