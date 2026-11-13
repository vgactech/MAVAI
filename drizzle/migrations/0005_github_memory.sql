CREATE TABLE public.app_user_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connector_id text NOT NULL,
  connection_key_ciphertext text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, connector_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_user_connections TO service_role;
ALTER TABLE public.app_user_connections ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.github_memory_repos (
  user_id uuid PRIMARY KEY,
  github_login text NOT NULL,
  repo_full_name text NOT NULL,
  repo_id bigint NOT NULL,
  owner_marker uuid NOT NULL DEFAULT gen_random_uuid(),
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.github_memory_repos TO authenticated;
GRANT ALL ON public.github_memory_repos TO service_role;
ALTER TABLE public.github_memory_repos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads own memory repo" ON public.github_memory_repos FOR SELECT TO authenticated USING (auth.uid() = user_id);