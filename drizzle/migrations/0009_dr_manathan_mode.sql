ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS assistant_mode text NOT NULL DEFAULT 'audiovisual' CHECK (assistant_mode IN ('audiovisual','dr_manathan'));
CREATE TABLE public.command_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  command text NOT NULL,
  source text NOT NULL CHECK (source IN ('text','voice')),
  status text NOT NULL CHECK (status IN ('recognized','acknowledged','executing','succeeded','failed','canceled')),
  correlation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  detail jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.command_events TO authenticated;
GRANT ALL ON public.command_events TO service_role;
ALTER TABLE public.command_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own command events read" ON public.command_events FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own command events insert" ON public.command_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE INDEX command_events_user_idx ON public.command_events(user_id, created_at DESC);