
-- ============================================================
-- QUOTES TABLE - Financial quote/proposal management
-- ============================================================

CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text REFERENCES public.groups(id) ON DELETE SET NULL,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft',
  currency text NOT NULL DEFAULT 'ILS',
  
  -- Quote title for standalone quotes
  title text,
  
  -- JSONB data columns
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  client_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  pricing jsonb NOT NULL DEFAULT '{}'::jsonb,
  totals jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  -- Generated HTML documents (cached)
  doc_client_html text,
  doc_operational_html text,
  
  -- Metadata
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_quotes_group_id ON public.quotes(group_id);
CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_quotes_created_at ON public.quotes(created_at DESC);
CREATE UNIQUE INDEX idx_quotes_group_version ON public.quotes(group_id, version) WHERE group_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Public read/write (matches existing app pattern - no auth)
CREATE POLICY "Public read/write quotes"
ON public.quotes
FOR ALL
USING (true)
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.quotes;

-- Auto-update updated_at
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
