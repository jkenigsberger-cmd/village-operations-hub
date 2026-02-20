
-- ============================================================
-- RLS POLICIES: 3 new tables + 17 existing tables
-- ============================================================

-- ============ allowed_users ============
CREATE POLICY "Authenticated can view allowed_users"
  ON public.allowed_users FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert allowed_users"
  ON public.allowed_users FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete allowed_users"
  ON public.allowed_users FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update allowed_users"
  ON public.allowed_users FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ user_roles ============
CREATE POLICY "Authenticated can view user_roles"
  ON public.user_roles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert user_roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user_roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user_roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ profiles ============
CREATE POLICY "Authenticated can view profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR id = auth.uid());

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- DROP old permissive policies on 17 existing tables, replace
-- ============================================================

-- activity_log
DROP POLICY IF EXISTS "Public read/write activity_log" ON public.activity_log;
CREATE POLICY "Authenticated select activity_log" ON public.activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert activity_log" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update activity_log" ON public.activity_log FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete activity_log" ON public.activity_log FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- activity_reservations
DROP POLICY IF EXISTS "Public read/write activity_reservations" ON public.activity_reservations;
CREATE POLICY "Authenticated select activity_reservations" ON public.activity_reservations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert activity_reservations" ON public.activity_reservations FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update activity_reservations" ON public.activity_reservations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete activity_reservations" ON public.activity_reservations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- activity_spaces
DROP POLICY IF EXISTS "Public read/write activity_spaces" ON public.activity_spaces;
CREATE POLICY "Authenticated select activity_spaces" ON public.activity_spaces FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert activity_spaces" ON public.activity_spaces FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete activity_spaces" ON public.activity_spaces FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
-- Viewers can update operational columns (cleaning_status, working_status, maintenance_notes, maintenance_image)
CREATE POLICY "Authenticated update activity_spaces" ON public.activity_spaces FOR UPDATE TO authenticated USING (true);

-- allocations
DROP POLICY IF EXISTS "Public read/write allocations" ON public.allocations;
CREATE POLICY "Authenticated select allocations" ON public.allocations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert allocations" ON public.allocations FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update allocations" ON public.allocations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete allocations" ON public.allocations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- beds
DROP POLICY IF EXISTS "Public read/write beds" ON public.beds;
CREATE POLICY "Authenticated select beds" ON public.beds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert beds" ON public.beds FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete beds" ON public.beds FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
-- Viewers can update operational columns (status, guest_name)
CREATE POLICY "Authenticated update beds" ON public.beds FOR UPDATE TO authenticated USING (true);

-- daily_tasks
DROP POLICY IF EXISTS "Public read/write daily_tasks" ON public.daily_tasks;
CREATE POLICY "Authenticated select daily_tasks" ON public.daily_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert daily_tasks" ON public.daily_tasks FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete daily_tasks" ON public.daily_tasks FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
-- Viewers can update operational columns (status, completed_at, assigned_to)
CREATE POLICY "Authenticated update daily_tasks" ON public.daily_tasks FOR UPDATE TO authenticated USING (true);

-- expenses
DROP POLICY IF EXISTS "Public read/write expenses" ON public.expenses;
CREATE POLICY "Authenticated select expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update expenses" ON public.expenses FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete expenses" ON public.expenses FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- facilities
DROP POLICY IF EXISTS "Public read/write facilities" ON public.facilities;
CREATE POLICY "Authenticated select facilities" ON public.facilities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert facilities" ON public.facilities FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete facilities" ON public.facilities FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
-- Viewers can update operational columns (cleaning_status, working_status, maintenance_notes, maintenance_image)
CREATE POLICY "Authenticated update facilities" ON public.facilities FOR UPDATE TO authenticated USING (true);

-- facility_areas
DROP POLICY IF EXISTS "Public read/write facility_areas" ON public.facility_areas;
CREATE POLICY "Authenticated select facility_areas" ON public.facility_areas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert facility_areas" ON public.facility_areas FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update facility_areas" ON public.facility_areas FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete facility_areas" ON public.facility_areas FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- facility_reservations
DROP POLICY IF EXISTS "Public read/write facility_reservations" ON public.facility_reservations;
CREATE POLICY "Authenticated select facility_reservations" ON public.facility_reservations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert facility_reservations" ON public.facility_reservations FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update facility_reservations" ON public.facility_reservations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete facility_reservations" ON public.facility_reservations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- groups
DROP POLICY IF EXISTS "Public read/write groups" ON public.groups;
CREATE POLICY "Authenticated select groups" ON public.groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert groups" ON public.groups FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update groups" ON public.groups FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete groups" ON public.groups FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- income
DROP POLICY IF EXISTS "Public read/write income" ON public.income;
CREATE POLICY "Authenticated select income" ON public.income FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert income" ON public.income FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update income" ON public.income FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete income" ON public.income FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- kitchen_time_slots
DROP POLICY IF EXISTS "Public read/write kitchen_time_slots" ON public.kitchen_time_slots;
CREATE POLICY "Authenticated select kitchen_time_slots" ON public.kitchen_time_slots FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert kitchen_time_slots" ON public.kitchen_time_slots FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update kitchen_time_slots" ON public.kitchen_time_slots FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete kitchen_time_slots" ON public.kitchen_time_slots FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- neighborhood_reservations
DROP POLICY IF EXISTS "Public read/write neighborhood_reservations" ON public.neighborhood_reservations;
CREATE POLICY "Authenticated select neighborhood_reservations" ON public.neighborhood_reservations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert neighborhood_reservations" ON public.neighborhood_reservations FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update neighborhood_reservations" ON public.neighborhood_reservations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete neighborhood_reservations" ON public.neighborhood_reservations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- neighborhoods
DROP POLICY IF EXISTS "Public read/write neighborhoods" ON public.neighborhoods;
CREATE POLICY "Authenticated select neighborhoods" ON public.neighborhoods FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert neighborhoods" ON public.neighborhoods FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update neighborhoods" ON public.neighborhoods FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete neighborhoods" ON public.neighborhoods FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- outsourced
DROP POLICY IF EXISTS "Public read/write outsourced" ON public.outsourced;
CREATE POLICY "Authenticated select outsourced" ON public.outsourced FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert outsourced" ON public.outsourced FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update outsourced" ON public.outsourced FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete outsourced" ON public.outsourced FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- quotes
DROP POLICY IF EXISTS "Public read/write quotes" ON public.quotes;
CREATE POLICY "Authenticated select quotes" ON public.quotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert quotes" ON public.quotes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update quotes" ON public.quotes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete quotes" ON public.quotes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- tents
DROP POLICY IF EXISTS "Public read/write tents" ON public.tents;
CREATE POLICY "Authenticated select tents" ON public.tents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert tents" ON public.tents FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete tents" ON public.tents FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
-- Viewers can update operational columns (cleaning_status, cleaning_assigned_to, maintenance notes/images)
CREATE POLICY "Authenticated update tents" ON public.tents FOR UPDATE TO authenticated USING (true);
