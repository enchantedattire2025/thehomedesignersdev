/*
# Fix ambiguous column references in accept_quote (project_assignments update)

The RETURNS TABLE declaration exposes `project_id` and `designer_id` as output
column names, which are in scope inside the function body. The UPDATE on
project_assignments used bare `project_id` and `designer_id` in its WHERE
clause, making them ambiguous against project_assignments' own columns.
Qualify with the table name.
*/

CREATE OR REPLACE FUNCTION public.accept_quote(
  p_quote_id uuid,
  p_feedback text DEFAULT NULL
)
RETURNS TABLE(
  success boolean,
  project_id uuid,
  designer_id uuid,
  advance_amount numeric,
  accepted_quote_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_quote public.designer_quotes%ROWTYPE;
  v_project public.customers%ROWTYPE;
  v_advance_percent numeric;
  v_advance_min numeric;
  v_advance numeric;
  v_terms text;
  v_designer_user_id uuid;
  v_customer_name text;
  v_project_name text;
  v_competing public.designer_quotes%ROWTYPE;
  v_competing_designer_user_id uuid;
BEGIN
  SELECT q.* INTO v_quote FROM public.designer_quotes q WHERE q.id = p_quote_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote not found.';
  END IF;

  SELECT c.* INTO v_project
  FROM public.customers c
  WHERE c.id = v_quote.project_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project for this quote not found.';
  END IF;

  IF v_project.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'You are not authorized to accept a quote for this project.';
  END IF;

  IF v_quote.project_id IS DISTINCT FROM v_project.id THEN
    RAISE EXCEPTION 'Quote does not belong to this project.';
  END IF;

  IF v_project.accepted_quote_id IS NOT NULL THEN
    RAISE EXCEPTION 'A quotation has already been accepted for this project.';
  END IF;

  IF v_quote.status NOT IN ('sent','draft') OR v_quote.customer_accepted = true THEN
    RAISE EXCEPTION 'This quotation is not in a state that can be accepted (current status: %).', v_quote.status;
  END IF;

  SELECT percent, min_amount, terms INTO v_advance_percent, v_advance_min, v_terms
  FROM public.get_advance_payment_config();
  v_advance := ROUND((v_quote.total_amount * v_advance_percent) / 100.0, 2);
  IF v_advance < v_advance_min THEN
    v_advance := v_advance_min;
  END IF;

  UPDATE public.designer_quotes
  SET status = 'accepted',
      customer_accepted = true,
      acceptance_date = now(),
      customer_feedback = COALESCE(p_feedback, 'Quote accepted'),
      confirmation_amount = v_advance,
      updated_at = now()
  WHERE id = p_quote_id;

  UPDATE public.customers
  SET accepted_quote_id = p_quote_id,
      assigned_designer_id = v_quote.designer_id,
      assignment_status = 'assigned',
      activation_status = 'awaiting_advance',
      updated_at = now()
  WHERE id = v_project.id;

  INSERT INTO public.quote_acceptance_history
    (quote_id, previous_status, new_status, changed_by, changed_by_type, feedback)
  VALUES
    (p_quote_id, v_quote.status, 'accepted', auth.uid(), 'customer', COALESCE(p_feedback, 'Quote accepted'));

  FOR v_competing IN
    SELECT q.* FROM public.designer_quotes q
    WHERE q.project_id = v_project.id
      AND q.id <> p_quote_id
      AND q.status IN ('sent','draft','changes_requested')
  LOOP
    UPDATE public.designer_quotes
    SET status = 'rejected',
        rejection_reason = 'ANOTHER_DESIGNER_SELECTED',
        rejection_comments = 'Another designer was selected for this project.',
        customer_accepted = false,
        updated_at = now()
    WHERE id = v_competing.id;

    INSERT INTO public.quote_acceptance_history
      (quote_id, previous_status, new_status, changed_by, changed_by_type, feedback)
    VALUES
      (v_competing.id, v_competing.status, 'rejected', auth.uid(), 'customer',
       'Closed automatically: another designer was selected.');

    SELECT d.user_id INTO v_competing_designer_user_id
    FROM public.designers d WHERE d.id = v_competing.designer_id;
    IF v_competing_designer_user_id IS NOT NULL THEN
      PERFORM public.create_notification(
        v_competing_designer_user_id,
        'designer',
        'Quotation Not Selected',
        COALESCE(v_project.project_name, 'A project') || ': the homeowner selected another designer. Your quotation is preserved for reference.',
        'quotation_not_selected',
        v_competing.id,
        'quotation'
      );
    END IF;
  END LOOP;

  UPDATE public.project_assignments pa
  SET status = 'closed',
      updated_at = now(),
      responded_at = COALESCE(pa.responded_at, now())
  WHERE pa.project_id = v_project.id
    AND pa.designer_id IS DISTINCT FROM v_quote.designer_id
    AND pa.status IN ('pending','accepted');

  SELECT d.user_id INTO v_designer_user_id
  FROM public.designers d WHERE d.id = v_quote.designer_id;
  SELECT COALESCE(raw_user_meta_data->>'full_name', email) INTO v_customer_name
  FROM auth.users WHERE id = v_project.user_id;

  IF v_designer_user_id IS NOT NULL THEN
    PERFORM public.create_notification(
      v_designer_user_id,
      'designer',
      'Quotation Accepted',
      COALESCE(v_customer_name, 'A homeowner') || ' has accepted your quotation for "' || COALESCE(v_project.project_name,'') || '". An advance payment of ' || v_advance::text || ' is now pending to activate the project.',
      'quotation_accepted',
      p_quote_id,
      'quotation'
    );
  END IF;

  RETURN QUERY SELECT true, v_project.id, v_quote.designer_id, v_advance, p_quote_id;
END;
$function$;
