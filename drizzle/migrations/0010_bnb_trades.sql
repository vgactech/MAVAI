CREATE TABLE public.bnb_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  wallet_address text NOT NULL,
  chain_id integer NOT NULL DEFAULT 56,
  side text NOT NULL CHECK (side IN ('buy','sell')),
  token_in text NOT NULL,
  token_out text NOT NULL,
  amount_in text NOT NULL,
  min_amount_out text NOT NULL,
  quoted_amount_out text NOT NULL,
  slippage_bps integer NOT NULL,
  tx_hash text,
  status text NOT NULL DEFAULT 'prepared' CHECK (status IN ('prepared','submitted','confirmed','failed','rejected')),
  error text,
  block_number bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.bnb_trades TO authenticated;
GRANT ALL ON public.bnb_trades TO service_role;
ALTER TABLE public.bnb_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bnb trades" ON public.bnb_trades FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX bnb_trades_user_idx ON public.bnb_trades(user_id, created_at DESC);