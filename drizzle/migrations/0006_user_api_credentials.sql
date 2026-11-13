CREATE TABLE public.user_api_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,
  key_ciphertext text NOT NULL,
  key_hint text NOT NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_api_credentials TO service_role;
ALTER TABLE public.user_api_credentials ENABLE ROW LEVEL SECURITY;