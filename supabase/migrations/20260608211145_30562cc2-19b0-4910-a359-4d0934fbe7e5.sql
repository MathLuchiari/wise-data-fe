
-- updated_at trigger helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- projects
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own projects" ON public.projects FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- data_sources
CREATE TABLE public.data_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  row_count INT,
  column_count INT,
  schema_json JSONB,
  sample_rows JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.data_sources TO authenticated;
GRANT ALL ON public.data_sources TO service_role;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own data_sources" ON public.data_sources FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- chat_messages
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  response_type TEXT,
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own chat_messages" ON public.chat_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- saved_kpis
CREATE TABLE public.saved_kpis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  source_message_id UUID REFERENCES public.chat_messages ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_kpis TO authenticated;
GRANT ALL ON public.saved_kpis TO service_role;
ALTER TABLE public.saved_kpis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own saved_kpis" ON public.saved_kpis FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX ON public.projects(user_id, created_at DESC);
CREATE INDEX ON public.data_sources(project_id);
CREATE INDEX ON public.chat_messages(project_id, created_at);
CREATE INDEX ON public.saved_kpis(project_id, created_at DESC);
