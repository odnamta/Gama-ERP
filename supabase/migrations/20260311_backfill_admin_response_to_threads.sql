-- =====================================================
-- Backfill: Create support_threads + support_messages
-- for competition_feedback items that have admin_response
-- but don't have corresponding thread messages yet.
--
-- Context: reviewFeedback() originally only saved to
-- admin_response column. The sendThreadMessage() call
-- was added later. This migration backfills the gap.
--
-- Scale: ~597 feedback items need threads + messages.
-- IDEMPOTENT: safe to run multiple times.
-- =====================================================

DO $$
DECLARE
  v_admin_id UUID;
  v_feedback RECORD;
  v_thread_id UUID;
  v_existing_thread_id UUID;
  v_has_admin_msg BOOLEAN;
  v_created_count INTEGER := 0;
  v_msg_only_count INTEGER := 0;
  v_skipped_count INTEGER := 0;
BEGIN
  -- -------------------------------------------------------
  -- 1. Find an admin user (owner role) to use as sender_id
  --    Fallback to sysadmin if no owner exists
  -- -------------------------------------------------------
  SELECT user_id INTO v_admin_id
  FROM user_profiles
  WHERE role = 'owner'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    SELECT user_id INTO v_admin_id
    FROM user_profiles
    WHERE role = 'sysadmin'
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'No admin user (owner/sysadmin) found in user_profiles';
  END IF;

  RAISE NOTICE 'Using admin user_id: %', v_admin_id;

  -- -------------------------------------------------------
  -- 2. Loop through all competition_feedback with admin_response
  -- -------------------------------------------------------
  FOR v_feedback IN
    SELECT id, admin_response, reviewed_at, created_at, user_id
    FROM competition_feedback
    WHERE admin_response IS NOT NULL
      AND admin_response != ''
      AND is_active = true
    ORDER BY created_at ASC
  LOOP
    -- Check if thread already exists for this feedback
    SELECT id INTO v_existing_thread_id
    FROM support_threads
    WHERE entity_type = 'competition_feedback'
      AND entity_id = v_feedback.id;

    IF v_existing_thread_id IS NOT NULL THEN
      -- Thread exists — check if it already has an admin message
      SELECT EXISTS (
        SELECT 1 FROM support_messages
        WHERE thread_id = v_existing_thread_id
          AND sender_type = 'admin'
      ) INTO v_has_admin_msg;

      IF v_has_admin_msg THEN
        -- Already has thread + admin message, skip
        v_skipped_count := v_skipped_count + 1;
        CONTINUE;
      END IF;

      -- Thread exists but no admin message — just add the message
      INSERT INTO support_messages (
        thread_id,
        sender_id,
        sender_type,
        message,
        metadata,
        is_read,
        created_at
      ) VALUES (
        v_existing_thread_id,
        v_admin_id,
        'admin',
        v_feedback.admin_response,
        '{"backfilled": true}'::jsonb,
        false,
        COALESCE(v_feedback.reviewed_at, v_feedback.created_at)
      );

      -- Update thread timestamp
      UPDATE support_threads
      SET updated_at = COALESCE(v_feedback.reviewed_at, v_feedback.created_at)
      WHERE id = v_existing_thread_id;

      v_msg_only_count := v_msg_only_count + 1;
      CONTINUE;
    END IF;

    -- -------------------------------------------------------
    -- 3. No thread exists — create thread + message
    -- -------------------------------------------------------

    -- Create the thread
    -- created_by = the feedback submitter (the user who opened the conversation)
    INSERT INTO support_threads (
      entity_type,
      entity_id,
      status,
      priority,
      created_by,
      created_at,
      updated_at
    ) VALUES (
      'competition_feedback',
      v_feedback.id,
      'in_progress',
      'normal',
      v_feedback.user_id,
      v_feedback.created_at,
      COALESCE(v_feedback.reviewed_at, v_feedback.created_at)
    )
    RETURNING id INTO v_thread_id;

    -- Create the admin response message
    INSERT INTO support_messages (
      thread_id,
      sender_id,
      sender_type,
      message,
      metadata,
      is_read,
      created_at
    ) VALUES (
      v_thread_id,
      v_admin_id,
      'admin',
      v_feedback.admin_response,
      '{"backfilled": true}'::jsonb,
      false,
      COALESCE(v_feedback.reviewed_at, v_feedback.created_at)
    );

    v_created_count := v_created_count + 1;
  END LOOP;

  RAISE NOTICE 'Backfill complete: % threads+messages created, % messages added to existing threads, % skipped (already complete)',
    v_created_count, v_msg_only_count, v_skipped_count;
END $$;
