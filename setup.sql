-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create trades table
CREATE TABLE IF NOT EXISTS public.trades (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  pair text NOT NULL,
  side text NOT NULL,
  order_type text NOT NULL,
  amount numeric NOT NULL,
  price numeric NOT NULL,
  total_value numeric NOT NULL,
  tx_hash text,
  executed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add index on user_id for faster queries
CREATE INDEX IF NOT EXISTS trades_user_id_idx ON public.trades(user_id);
-- Add index on executed_at for sorting
CREATE INDEX IF NOT EXISTS trades_executed_at_idx ON public.trades(executed_at DESC);
