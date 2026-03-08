
CREATE TABLE public.guest_form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  client_name text,
  client_org text,
  client_phone text,
  client_email text,
  total_pax integer,
  staff_count integer,
  participant_count integer,
  boys_count integer,
  girls_count integer,
  group_type text,
  special_diets jsonb DEFAULT '{}'::jsonb,
  tent_distribution_notes text,
  schedule_notes text,
  general_notes text,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guest_form_submissions ENABLE ROW LEVEL SECURITY;

-- Admin full CRUD
CREATE POLICY "Admin select guest_form_submissions" ON public.guest_form_submissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin insert guest_form_submissions" ON public.guest_form_submissions
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin update guest_form_submissions" ON public.guest_form_submissions
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin delete guest_form_submissions" ON public.guest_form_submissions
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger
CREATE TRIGGER update_guest_form_submissions_updated_at
  BEFORE UPDATE ON public.guest_form_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
