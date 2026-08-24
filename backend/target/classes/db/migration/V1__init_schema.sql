-- UNZA CICT Equipment Specification and Request Management System
-- Core schema (Postgres). Replaces the former Supabase project: auth.users is
-- replaced by a local `users` table, and Supabase RLS policies are replaced by
-- authorization checks in the Spring Boot service layer.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ORG UNITS
CREATE TABLE org_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  unit_type text NOT NULL DEFAULT 'department',
  parent_id uuid REFERENCES org_units(id) ON DELETE SET NULL,
  campus text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- USERS (replaces auth.users + profiles)
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text,
  full_name text NOT NULL DEFAULT '',
  staff_number text,
  job_title text,
  position_level text,
  phone text,
  campus text,
  org_unit_id uuid REFERENCES org_units(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  hr_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- USER ROLES
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('requester','manager','cict_reviewer','cict_manager','procurement','auditor','admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- CATALOGUE
CREATE TABLE equipment_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text,
  asset_class text,
  typical_lifespan_years integer,
  standard_warranty_months integer,
  indicative_unit_cost numeric,
  requires_cict_review boolean NOT NULL DEFAULT true,
  requires_network_port boolean NOT NULL DEFAULT false,
  requires_software_licence boolean NOT NULL DEFAULT false,
  eligible_position_levels text[] NOT NULL DEFAULT '{}'::text[],
  procurement_lead_time_days integer,
  support_notes text,
  policy_reference text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE spec_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES equipment_categories(id) ON DELETE CASCADE,
  tier text NOT NULL,
  name text NOT NULL,
  summary text,
  specs jsonb NOT NULL DEFAULT '{}'::jsonb,
  suits_position_levels text[] NOT NULL DEFAULT '{}',
  version int NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- REQUESTS
CREATE SEQUENCE request_ref_seq;

CREATE TABLE requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  requester_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_for text,
  org_unit_id uuid REFERENCES org_units(id) ON DELETE SET NULL,
  org_unit_name text,
  manager_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT '',
  justification text,
  request_type text,
  business_context text,
  impact_if_not_provided text,
  priority text NOT NULL DEFAULT 'normal',
  priority_reason text,
  required_by date,
  funding_source text,
  cost_centre text,
  budget_status text,
  estimated_budget numeric,
  existing_asset_tag text,
  existing_asset_details text,
  replacement_reason text,
  declaration_accepted boolean NOT NULL DEFAULT false,
  declaration_at timestamptz,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','pending_manager','pending_cict','needs_clarification','approved','rejected','withdrawn')),
  manager_decision_note text,
  manager_decided_at timestamptz,
  cict_decision_note text,
  cict_decided_by uuid REFERENCES users(id) ON DELETE SET NULL,
  cict_decided_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE request_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  category_id uuid REFERENCES equipment_categories(id) ON DELETE SET NULL,
  quantity int NOT NULL DEFAULT 1,
  intended_users text,
  location text,
  is_shared boolean NOT NULL DEFAULT false,
  purpose text,
  required_software text,
  proposed_spec text,
  recommended_profile_id uuid REFERENCES spec_profiles(id) ON DELETE SET NULL,
  approved_profile_id uuid REFERENCES spec_profiles(id) ON DELETE SET NULL,
  approved_spec_snapshot jsonb,
  exception_justification text,
  reviewer_note text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE request_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  actor_name text,
  action text NOT NULL,
  from_status text,
  to_status text,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- DELEGATIONS
CREATE TABLE delegations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delegate_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason text,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT delegation_not_self CHECK (delegator_id <> delegate_id)
);

-- ATTACHMENTS (stored on local disk; storage_path is relative to app.storage.attachments-dir)
CREATE TABLE request_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  content_type text,
  size_bytes bigint,
  kind text NOT NULL DEFAULT 'supporting_document',
  uploaded_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id uuid REFERENCES requests(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  category text NOT NULL DEFAULT 'workflow',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON notifications(user_id, created_at DESC);

-- LOOKUP VALUES & SETTINGS
CREATE TABLE lookup_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_key text NOT NULL,
  value text NOT NULL,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (list_key, value)
);

CREATE TABLE app_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX requests_requester_idx ON requests(requester_id);
CREATE INDEX requests_submitted_by_idx ON requests(submitted_by);
CREATE INDEX requests_manager_idx ON requests(manager_id);
CREATE INDEX requests_status_idx ON requests(status);
CREATE INDEX request_items_request_idx ON request_items(request_id);
CREATE INDEX request_events_request_idx ON request_events(request_id);
CREATE INDEX request_attachments_request_idx ON request_attachments(request_id);
CREATE INDEX delegations_delegator_idx ON delegations(delegator_id);
CREATE INDEX delegations_delegate_idx ON delegations(delegate_id);
CREATE INDEX user_roles_user_idx ON user_roles(user_id);
