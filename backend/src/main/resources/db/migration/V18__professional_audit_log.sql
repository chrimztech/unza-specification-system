-- Turns audit_log into a complete, tamper-resistant activity trail.
--
-- 1. Records the acting user's full name and the client IP address of every action.
-- 2. Brings the existing request workflow history (request_events) into the log, so the
--    trail is complete from the start. New workflow events are written by the application.
-- 3. Makes the table append-only: rows can never be edited, deleted or truncated. The one
--    permitted change is the ON DELETE SET NULL on actor_id when a user account is removed;
--    actor_email and actor_name are kept, so the entry still names who acted.

ALTER TABLE audit_log ADD COLUMN ip_address text;
ALTER TABLE audit_log ADD COLUMN actor_name text;

UPDATE audit_log a SET actor_name = NULLIF(u.full_name, '')
FROM users u WHERE u.id = a.actor_id;

INSERT INTO audit_log (actor_id, actor_email, actor_name, entity_type, entity_id, action, details, created_at)
SELECT e.actor_id,
       COALESCE(u.email, e.actor_name),
       NULLIF(u.full_name, ''),
       'Request',
       e.request_id::text,
       e.action,
       r.reference
         || CASE WHEN e.to_status IS NOT NULL
                 THEN ' · ' || COALESCE(replace(e.from_status, '_', ' '), 'new') || ' → ' || replace(e.to_status, '_', ' ')
                 ELSE '' END
         || CASE WHEN e.comment IS NOT NULL AND e.comment <> '' THEN ' · ' || e.comment ELSE '' END,
       e.created_at
FROM request_events e
JOIN requests r ON r.id = e.request_id
LEFT JOIN users u ON u.id = e.actor_id;

CREATE INDEX audit_log_actor_email_idx ON audit_log (lower(actor_email));
CREATE INDEX audit_log_action_idx ON audit_log (action);

CREATE FUNCTION audit_log_protect() RETURNS trigger AS $$
BEGIN
  -- Nested IFs: OLD/NEW must not be touched for statement-level (TRUNCATE) or DELETE calls.
  IF TG_OP = 'UPDATE' THEN
    IF OLD.actor_id IS NOT NULL AND NEW.actor_id IS NULL
       AND (NEW.id, NEW.actor_email, NEW.entity_type, NEW.entity_id, NEW.action, NEW.details,
            NEW.created_at, NEW.ip_address, NEW.actor_name)
           IS NOT DISTINCT FROM
           (OLD.id, OLD.actor_email, OLD.entity_type, OLD.entity_id, OLD.action, OLD.details,
            OLD.created_at, OLD.ip_address, OLD.actor_name) THEN
      RETURN NEW;
    END IF;
  END IF;
  RAISE EXCEPTION 'audit_log is append-only: % is not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_no_update_or_delete
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_protect();

CREATE TRIGGER audit_log_no_truncate
  BEFORE TRUNCATE ON audit_log
  FOR EACH STATEMENT EXECUTE FUNCTION audit_log_protect();
