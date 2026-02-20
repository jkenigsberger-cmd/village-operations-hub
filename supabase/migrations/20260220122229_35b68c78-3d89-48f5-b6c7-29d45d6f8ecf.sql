CREATE OR REPLACE FUNCTION public.cleanup_stale_vip_tents()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tent_ids text[];
  v_count int;
BEGIN
  -- Collect stale VIP tent IDs (includes checkout-day tents per hotel rule)
  SELECT array_agg(id) INTO v_tent_ids
  FROM tents
  WHERE neighborhood_id = 'VIP'
    AND check_out_date IS NOT NULL
    AND check_out_date <= CURRENT_DATE;

  IF v_tent_ids IS NULL OR array_length(v_tent_ids, 1) IS NULL THEN
    RETURN jsonb_build_object('cleaned_tents', 0);
  END IF;

  v_count := array_length(v_tent_ids, 1);

  -- Reset beds to FREE and clear guest names
  UPDATE beds
  SET status = 'FREE', guest_name = NULL
  WHERE tent_id = ANY(v_tent_ids)
    AND (status != 'FREE' OR guest_name IS NOT NULL);

  -- Clear tent metadata
  UPDATE tents
  SET group_name = NULL,
      check_in_date = NULL,
      check_out_date = NULL,
      gender = 'MIXED',
      people_count = NULL
  WHERE id = ANY(v_tent_ids);

  RETURN jsonb_build_object('cleaned_tents', v_count);
END;
$function$;