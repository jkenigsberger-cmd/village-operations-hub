
-- RPC function: Atomically create or update an activity reservation with 15-min buffer conflict check
CREATE OR REPLACE FUNCTION public.create_activity_reservation_safe(
  p_space_id TEXT,
  p_date DATE,
  p_start_time TEXT,
  p_end_time TEXT,
  p_group_name TEXT,
  p_group_id TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'manual',
  p_status TEXT DEFAULT 'confirmed',
  p_reservation_id TEXT DEFAULT NULL
)
RETURNS TABLE(
  id TEXT,
  space_id TEXT,
  date DATE,
  start_time TEXT,
  end_time TEXT,
  group_name TEXT,
  group_id TEXT,
  notes TEXT,
  source TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_start INT;
  v_new_end INT;
  v_ex_start INT;
  v_ex_end INT;
  v_id TEXT;
  v_conflict_group TEXT;
  v_rec RECORD;
BEGIN
  -- Validate times
  v_new_start := (SPLIT_PART(p_start_time, ':', 1)::INT * 60) + SPLIT_PART(p_start_time, ':', 2)::INT;
  v_new_end := (SPLIT_PART(p_end_time, ':', 1)::INT * 60) + SPLIT_PART(p_end_time, ':', 2)::INT;

  IF v_new_end <= v_new_start THEN
    RAISE EXCEPTION 'שעת סיום חייבת להיות אחרי שעת התחלה';
  END IF;

  -- Advisory lock to prevent race conditions for same space+date
  PERFORM pg_advisory_xact_lock(hashtext(p_space_id || '::' || p_date::text)::bigint);

  -- Check conflicts with 15-min buffer
  FOR v_rec IN
    SELECT ar.space_id, ar.date, ar.start_time AS st, ar.end_time AS et, ar.group_name AS gn, ar.id AS rid
    FROM activity_reservations ar
    WHERE ar.space_id = p_space_id
      AND ar.date = p_date
      AND (p_reservation_id IS NULL OR ar.id != p_reservation_id)
  LOOP
    v_ex_start := (SPLIT_PART(v_rec.st, ':', 1)::INT * 60) + SPLIT_PART(v_rec.st, ':', 2)::INT;
    v_ex_end := (SPLIT_PART(v_rec.et, ':', 1)::INT * 60) + SPLIT_PART(v_rec.et, ':', 2)::INT;

    -- Overlap with 15-min buffer: (ex_start - 15) < new_end AND (ex_end + 15) > new_start
    IF (v_ex_start - 15) < v_new_end AND (v_ex_end + 15) > v_new_start THEN
      v_conflict_group := v_rec.gn;
      RAISE EXCEPTION 'התנגשות: המקום תפוס ע"י "%" (כולל 15 דק׳ ניקיון)', v_conflict_group;
    END IF;
  END LOOP;

  -- No conflict: insert or update
  IF p_reservation_id IS NULL THEN
    v_id := substr(md5(random()::text), 1, 9);
    INSERT INTO activity_reservations (id, space_id, date, start_time, end_time, group_name, group_id, notes, source, status)
    VALUES (v_id, p_space_id, p_date, p_start_time, p_end_time, p_group_name, p_group_id, p_notes, p_source, p_status);
    
    RETURN QUERY SELECT ar.id, ar.space_id, ar.date, ar.start_time, ar.end_time, ar.group_name, ar.group_id, ar.notes, ar.source, ar.status, ar.created_at
    FROM activity_reservations ar WHERE ar.id = v_id;
  ELSE
    UPDATE activity_reservations
    SET space_id = p_space_id, date = p_date, start_time = p_start_time, end_time = p_end_time,
        group_name = p_group_name, group_id = p_group_id, notes = p_notes, source = p_source, status = p_status
    WHERE activity_reservations.id = p_reservation_id;
    
    RETURN QUERY SELECT ar.id, ar.space_id, ar.date, ar.start_time, ar.end_time, ar.group_name, ar.group_id, ar.notes, ar.source, ar.status, ar.created_at
    FROM activity_reservations ar WHERE ar.id = p_reservation_id;
  END IF;
END;
$$;
