-- Add missing columns needed by cancellation + returns workflow

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

ALTER TABLE public.returns
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now() NOT NULL;

-- Keep updated_at current on returns updates
DROP TRIGGER IF EXISTS handle_returns_updated_at ON public.returns;
CREATE TRIGGER handle_returns_updated_at
BEFORE UPDATE ON public.returns
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
