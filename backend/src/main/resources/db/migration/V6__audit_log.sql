-- Generic audit log for admin/configuration actions that request_events never
-- covered: role grants/revocations, org-unit/equipment-category/spec-profile/
-- lookup-value/app-setting changes, attachment upload/delete, and delegation
-- create/deactivate. actor_id is nullable and ON DELETE SET NULL, and
-- actor_email is denormalised at write time, so the audit trail survives
-- even if the acting user's account is later removed.

CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  actor_email text,
  entity_type text NOT NULL,
  entity_id text,
  action text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_log_entity_idx ON audit_log(entity_type, entity_id);
CREATE INDEX audit_log_created_idx ON audit_log(created_at DESC);
