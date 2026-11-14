CREATE TABLE public.conversations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, title text NOT NULL DEFAULT 'Nouvelle conversation', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own conversations" ON public.conversations FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE, user_id uuid NOT NULL, role text NOT NULL CHECK (role IN ('user','assistant')), content text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX messages_conv_idx ON public.messages(conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own messages" ON public.messages FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.memories (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, content text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memories TO authenticated;
GRANT ALL ON public.memories TO service_role;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own memories" ON public.memories FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.works (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, kind text NOT NULL CHECK (kind IN ('briefing','agents','image')), prompt text NOT NULL, result jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX works_user_kind_idx ON public.works(user_id, kind, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.works TO authenticated;
GRANT ALL ON public.works TO service_role;
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own works" ON public.works FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.production_projects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, title text NOT NULL, description text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_projects TO authenticated;
GRANT ALL ON public.production_projects TO service_role;
ALTER TABLE public.production_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY project_owner ON public.production_projects FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TABLE public.production_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES public.production_projects(id) ON DELETE CASCADE, user_id uuid NOT NULL, kind text NOT NULL CHECK (kind IN ('character','scene','shot','asset','decision','audio','frame','continuity','storyboard')), title text NOT NULL, content text NOT NULL DEFAULT '', data jsonb NOT NULL DEFAULT '{}', validated boolean NOT NULL DEFAULT false, version integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_items TO authenticated;
GRANT ALL ON public.production_items TO service_role;
ALTER TABLE public.production_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY item_owner ON public.production_items FOR ALL TO authenticated USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.production_projects p WHERE p.id = project_id AND p.user_id = auth.uid())) WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.production_projects p WHERE p.id = project_id AND p.user_id = auth.uid()));
CREATE INDEX production_items_project_idx ON public.production_items(project_id,created_at);
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS client_message_id text;
CREATE UNIQUE INDEX IF NOT EXISTS messages_client_id_idx ON public.messages(user_id,client_message_id) WHERE client_message_id IS NOT NULL;
ALTER TABLE public.works ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.production_projects(id) ON DELETE CASCADE;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.production_projects(id) ON DELETE CASCADE;
ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.production_projects(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS works_project_idx ON public.works(project_id,user_id);
CREATE INDEX IF NOT EXISTS conversations_project_idx ON public.conversations(project_id,user_id);
CREATE INDEX IF NOT EXISTS memories_project_idx ON public.memories(project_id,user_id);
CREATE OR REPLACE FUNCTION public.validate_project_owner() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF NEW.project_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.production_projects p WHERE p.id=NEW.project_id AND p.user_id=NEW.user_id) THEN RAISE EXCEPTION 'Project does not belong to owner' USING ERRCODE='42501'; END IF; RETURN NEW; END; $$;
CREATE TRIGGER works_project_owner BEFORE INSERT OR UPDATE ON public.works FOR EACH ROW EXECUTE FUNCTION public.validate_project_owner();
CREATE TRIGGER conversations_project_owner BEFORE INSERT OR UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.validate_project_owner();
CREATE TRIGGER memories_project_owner BEFORE INSERT OR UPDATE ON public.memories FOR EACH ROW EXECUTE FUNCTION public.validate_project_owner();
CREATE TRIGGER production_items_project_owner BEFORE INSERT OR UPDATE ON public.production_items FOR EACH ROW EXECUTE FUNCTION public.validate_project_owner();

CREATE POLICY "mavai files own read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'mavai-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "mavai files own insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'mavai-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "mavai files own update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'mavai-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "mavai files own delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'mavai-files' AND (storage.foldername(name))[1] = auth.uid()::text);

ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE TABLE public.app_user_connections (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, connector_id text NOT NULL, connection_key_ciphertext text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (user_id, connector_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_user_connections TO service_role;
ALTER TABLE public.app_user_connections ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.github_memory_repos (user_id uuid PRIMARY KEY, github_login text NOT NULL, repo_full_name text NOT NULL, repo_id bigint NOT NULL, owner_marker uuid NOT NULL DEFAULT gen_random_uuid(), last_synced_at timestamptz, last_error text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.github_memory_repos TO authenticated;
GRANT ALL ON public.github_memory_repos TO service_role;
ALTER TABLE public.github_memory_repos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads own memory repo" ON public.github_memory_repos FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.user_api_credentials (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, provider text NOT NULL, key_ciphertext text NOT NULL, key_hint text NOT NULL, verified_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (user_id, provider));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_api_credentials TO service_role;
ALTER TABLE public.user_api_credentials ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.production_projects ADD COLUMN IF NOT EXISTS target_duration_seconds integer CHECK (target_duration_seconds IS NULL OR (target_duration_seconds > 0 AND target_duration_seconds <= 86400));
CREATE TABLE public.production_nodes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES public.production_projects(id) ON DELETE CASCADE, user_id uuid NOT NULL, parent_id uuid REFERENCES public.production_nodes(id) ON DELETE CASCADE, kind text NOT NULL, position integer NOT NULL DEFAULT 0, archived_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE ON public.production_nodes TO authenticated;
GRANT ALL ON public.production_nodes TO service_role;
ALTER TABLE public.production_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY node_owner ON public.production_nodes FOR ALL TO authenticated USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.production_projects p WHERE p.id = project_id AND p.user_id = auth.uid())) WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.production_projects p WHERE p.id = project_id AND p.user_id = auth.uid()));
CREATE INDEX production_nodes_project_idx ON public.production_nodes(project_id, parent_id, position);
CREATE TABLE public.production_node_versions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), node_id uuid NOT NULL REFERENCES public.production_nodes(id) ON DELETE CASCADE, user_id uuid NOT NULL, version integer NOT NULL, title text NOT NULL, content text NOT NULL DEFAULT '', data jsonb NOT NULL DEFAULT '{}', note text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (node_id, version));
GRANT SELECT, INSERT ON public.production_node_versions TO authenticated;
GRANT ALL ON public.production_node_versions TO service_role;
ALTER TABLE public.production_node_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY version_read ON public.production_node_versions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY version_insert ON public.production_node_versions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.production_nodes n WHERE n.id = node_id AND n.user_id = auth.uid()));

ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS assistant_mode text NOT NULL DEFAULT 'audiovisual' CHECK (assistant_mode IN ('audiovisual','dr_manathan'));
CREATE TABLE public.command_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE, command text NOT NULL, source text NOT NULL CHECK (source IN ('text','voice')), status text NOT NULL CHECK (status IN ('recognized','acknowledged','executing','succeeded','failed','canceled')), correlation_id uuid NOT NULL DEFAULT gen_random_uuid(), detail jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT ON public.command_events TO authenticated;
GRANT ALL ON public.command_events TO service_role;
ALTER TABLE public.command_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own command events read" ON public.command_events FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own command events insert" ON public.command_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE INDEX command_events_user_idx ON public.command_events(user_id, created_at DESC);

CREATE TABLE public.bnb_trades (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, wallet_address text NOT NULL, chain_id integer NOT NULL DEFAULT 56, side text NOT NULL CHECK (side IN ('buy','sell')), token_in text NOT NULL, token_out text NOT NULL, amount_in text NOT NULL, min_amount_out text NOT NULL, quoted_amount_out text NOT NULL, slippage_bps integer NOT NULL, tx_hash text, status text NOT NULL DEFAULT 'prepared' CHECK (status IN ('prepared','submitted','confirmed','failed','rejected')), error text, block_number bigint, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE ON public.bnb_trades TO authenticated;
GRANT ALL ON public.bnb_trades TO service_role;
ALTER TABLE public.bnb_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bnb trades" ON public.bnb_trades FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX bnb_trades_user_idx ON public.bnb_trades(user_id, created_at DESC);