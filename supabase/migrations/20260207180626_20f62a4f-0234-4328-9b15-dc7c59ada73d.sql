-- ============================================================
-- AHARONSON FARM DATABASE SCHEMA
-- Complete migration from localStorage to Cloud backend
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE bed_status AS ENUM ('FREE', 'RESERVED', 'OCCUPIED', 'BLOCKED');
CREATE TYPE cleaning_status AS ENUM ('CLEAN', 'NEEDS_CLEANING', 'CLEANING_IN_PROGRESS');
CREATE TYPE working_status AS ENUM ('WORKING', 'BROKEN', 'MAINTENANCE', 'CLOSED');
CREATE TYPE bed_type AS ENUM ('SINGLE', 'BUNK_TOP', 'BUNK_BOTTOM');
CREATE TYPE tent_gender AS ENUM ('MIXED', 'MALE', 'FEMALE');
CREATE TYPE facility_type AS ENUM ('TOILET', 'SHOWER');
CREATE TYPE facility_gender AS ENUM ('UNISEX', 'MALE', 'FEMALE');
CREATE TYPE reservation_type AS ENUM ('FULL_NEIGHBORHOOD', 'SPECIFIC_TENTS');
CREATE TYPE task_type AS ENUM ('CLEANING', 'CHECKOUT', 'CHECKIN', 'MAINTENANCE', 'CUSTOM');
CREATE TYPE task_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE meal_type AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER');
CREATE TYPE meal_location AS ENUM ('DINING_HALL', 'OUTSIDE');
CREATE TYPE allocation_type AS ENUM ('VIP_TENT', 'NEIGHBORHOOD', 'TENT');

-- ============================================================
-- NEIGHBORHOODS TABLE
-- ============================================================

CREATE TABLE public.neighborhoods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  has_double_tents BOOLEAN DEFAULT FALSE,
  is_white_tent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write neighborhoods" ON public.neighborhoods FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- TENTS TABLE
-- ============================================================

CREATE TABLE public.tents (
  id TEXT PRIMARY KEY,
  neighborhood_id TEXT NOT NULL REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  double_tent_id TEXT,
  is_alef BOOLEAN,
  group_name TEXT,
  people_count INTEGER,
  check_in_date DATE,
  check_out_date DATE,
  notes TEXT,
  cleaning_status cleaning_status NOT NULL DEFAULT 'CLEAN',
  cleaning_assigned_to TEXT,
  gender tent_gender DEFAULT 'MIXED',
  has_private_bathroom BOOLEAN DEFAULT FALSE,
  has_private_shower BOOLEAN DEFAULT FALSE,
  bathroom_working_status working_status,
  bathroom_maintenance_notes TEXT,
  bathroom_maintenance_image TEXT,
  shower_working_status working_status,
  shower_maintenance_notes TEXT,
  shower_maintenance_image TEXT,
  is_accessible BOOLEAN DEFAULT FALSE,
  is_vip BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tents_neighborhood ON public.tents(neighborhood_id);
CREATE INDEX idx_tents_check_in ON public.tents(check_in_date);
CREATE INDEX idx_tents_check_out ON public.tents(check_out_date);

ALTER TABLE public.tents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write tents" ON public.tents FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- BEDS TABLE
-- ============================================================

CREATE TABLE public.beds (
  id TEXT PRIMARY KEY,
  tent_id TEXT NOT NULL REFERENCES public.tents(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  bed_type bed_type NOT NULL,
  bunk_number INTEGER,
  status bed_status NOT NULL DEFAULT 'FREE',
  guest_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_beds_tent ON public.beds(tent_id);
CREATE INDEX idx_beds_status ON public.beds(status);

ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write beds" ON public.beds FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- FACILITY AREAS TABLE
-- ============================================================

CREATE TABLE public.facility_areas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.facility_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write facility_areas" ON public.facility_areas FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- FACILITIES TABLE
-- ============================================================

CREATE TABLE public.facilities (
  id TEXT PRIMARY KEY,
  area_id TEXT NOT NULL REFERENCES public.facility_areas(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  facility_type facility_type NOT NULL,
  gender facility_gender NOT NULL DEFAULT 'UNISEX',
  is_accessible BOOLEAN DEFAULT FALSE,
  cleaning_status cleaning_status NOT NULL DEFAULT 'CLEAN',
  working_status working_status NOT NULL DEFAULT 'WORKING',
  notes TEXT,
  maintenance_image TEXT,
  maintenance_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_facilities_area ON public.facilities(area_id);

ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write facilities" ON public.facilities FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- ACTIVITY SPACES TABLE
-- ============================================================

CREATE TABLE public.activity_spaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cleaning_status cleaning_status DEFAULT 'CLEAN',
  cleaning_notes TEXT,
  working_status working_status DEFAULT 'WORKING',
  notes TEXT,
  maintenance_image TEXT,
  maintenance_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_spaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write activity_spaces" ON public.activity_spaces FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- GROUPS TABLE (Admin Groups with nested JSON for complex data)
-- ============================================================

CREATE TABLE public.groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  arrival_date DATE NOT NULL,
  departure_date DATE NOT NULL,
  total_pax INTEGER NOT NULL DEFAULT 0,
  staff_count INTEGER NOT NULL DEFAULT 0,
  participant_count INTEGER NOT NULL DEFAULT 0,
  vip_people_per_tent INTEGER DEFAULT 3,
  remaining_staff INTEGER DEFAULT 0,
  remaining_participants INTEGER DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'confirmed',
  color TEXT,
  meal_plan JSONB DEFAULT '{}',
  schedule_items JSONB DEFAULT '[]',
  vip_tent_configs JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_groups_arrival ON public.groups(arrival_date);
CREATE INDEX idx_groups_departure ON public.groups(departure_date);
CREATE INDEX idx_groups_status ON public.groups(status);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write groups" ON public.groups FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- ALLOCATIONS TABLE
-- ============================================================

CREATE TABLE public.allocations (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  allocation_type allocation_type NOT NULL,
  resource_id TEXT NOT NULL,
  resource_label TEXT NOT NULL,
  beds_assigned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_allocations_group ON public.allocations(group_id);
CREATE INDEX idx_allocations_dates ON public.allocations(date_range_start, date_range_end);
CREATE INDEX idx_allocations_resource ON public.allocations(resource_id);

ALTER TABLE public.allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write allocations" ON public.allocations FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- NEIGHBORHOOD RESERVATIONS TABLE
-- ============================================================

CREATE TABLE public.neighborhood_reservations (
  id TEXT PRIMARY KEY,
  neighborhood_id TEXT NOT NULL REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  reservation_type reservation_type NOT NULL,
  tent_ids JSONB,
  tent_count INTEGER,
  gender_distribution JSONB,
  total_beds INTEGER,
  total_people INTEGER,
  contact_name TEXT,
  contact_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_neighborhood_reservations_neighborhood ON public.neighborhood_reservations(neighborhood_id);
CREATE INDEX idx_neighborhood_reservations_dates ON public.neighborhood_reservations(check_in_date, check_out_date);

ALTER TABLE public.neighborhood_reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write neighborhood_reservations" ON public.neighborhood_reservations FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- ACTIVITY RESERVATIONS TABLE
-- ============================================================

CREATE TABLE public.activity_reservations (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL REFERENCES public.activity_spaces(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  group_name TEXT NOT NULL,
  notes TEXT,
  source TEXT DEFAULT 'manual',
  group_id TEXT,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_reservations_space ON public.activity_reservations(space_id);
CREATE INDEX idx_activity_reservations_date ON public.activity_reservations(date);

ALTER TABLE public.activity_reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write activity_reservations" ON public.activity_reservations FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- FACILITY RESERVATIONS TABLE
-- ============================================================

CREATE TABLE public.facility_reservations (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  group_name TEXT NOT NULL,
  number_of_people INTEGER,
  group_color TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_facility_reservations_facility ON public.facility_reservations(facility_id);
CREATE INDEX idx_facility_reservations_date ON public.facility_reservations(date);

ALTER TABLE public.facility_reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write facility_reservations" ON public.facility_reservations FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- KITCHEN TIME SLOTS TABLE
-- ============================================================

CREATE TABLE public.kitchen_time_slots (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  meal_type meal_type NOT NULL,
  time TEXT NOT NULL,
  location meal_location NOT NULL DEFAULT 'DINING_HALL',
  total_pax INTEGER NOT NULL DEFAULT 0,
  special_diets JSONB DEFAULT '{"vegetarian":0,"vegan":0,"glutenFree":0,"lactoseFree":0,"allergies":0,"notes":""}',
  groups JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kitchen_time_slots_date ON public.kitchen_time_slots(date);
CREATE INDEX idx_kitchen_time_slots_meal ON public.kitchen_time_slots(meal_type);

ALTER TABLE public.kitchen_time_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write kitchen_time_slots" ON public.kitchen_time_slots FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- DAILY TASKS TABLE
-- ============================================================

CREATE TABLE public.daily_tasks (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  task_type task_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  entity_type TEXT,
  entity_id TEXT,
  status task_status NOT NULL DEFAULT 'PENDING',
  assigned_to TEXT,
  maintenance_image TEXT,
  facility_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_daily_tasks_date ON public.daily_tasks(date);
CREATE INDEX idx_daily_tasks_status ON public.daily_tasks(status);
CREATE INDEX idx_daily_tasks_entity ON public.daily_tasks(entity_type, entity_id);

ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write daily_tasks" ON public.daily_tasks FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- INCOME TABLE
-- ============================================================

CREATE TABLE public.income (
  id TEXT PRIMARY KEY,
  group_id TEXT REFERENCES public.groups(id) ON DELETE SET NULL,
  group_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  payment_method TEXT,
  invoice_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_income_group ON public.income(group_id);
CREATE INDEX idx_income_date ON public.income(date);

ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write income" ON public.income FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- EXPENSES TABLE
-- ============================================================

CREATE TABLE public.expenses (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  vendor TEXT,
  receipt_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_date ON public.expenses(date);
CREATE INDEX idx_expenses_category ON public.expenses(category);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- OUTSOURCED WORKERS TABLE
-- ============================================================

CREATE TABLE public.outsourced (
  id TEXT PRIMARY KEY,
  worker_name TEXT NOT NULL,
  role TEXT NOT NULL,
  hours DECIMAL(5,2) NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_outsourced_date ON public.outsourced(date);
CREATE INDEX idx_outsourced_worker ON public.outsourced(worker_name);

ALTER TABLE public.outsourced ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write outsourced" ON public.outsourced FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- ACTIVITY LOG TABLE
-- ============================================================

CREATE TABLE public.activity_log (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details TEXT
);

CREATE INDEX idx_activity_log_timestamp ON public.activity_log(timestamp DESC);
CREATE INDEX idx_activity_log_entity ON public.activity_log(entity_type, entity_id);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write activity_log" ON public.activity_log FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply to tables with updated_at
CREATE TRIGGER update_neighborhoods_updated_at BEFORE UPDATE ON public.neighborhoods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tents_updated_at BEFORE UPDATE ON public.tents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_beds_updated_at BEFORE UPDATE ON public.beds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_facility_areas_updated_at BEFORE UPDATE ON public.facility_areas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON public.facilities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_activity_spaces_updated_at BEFORE UPDATE ON public.activity_spaces FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_kitchen_time_slots_updated_at BEFORE UPDATE ON public.kitchen_time_slots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_income_updated_at BEFORE UPDATE ON public.income FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_outsourced_updated_at BEFORE UPDATE ON public.outsourced FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- ENABLE REALTIME ON KEY TABLES
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.tents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.beds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.allocations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.kitchen_time_slots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.neighborhood_reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.facility_reservations;