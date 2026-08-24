-- V3__real_catalog.sql wiped app_settings (as part of clearing seed/catalogue data) but never
-- restored these system-configuration rows, which are not equipment data and are still read by
-- the frontend everywhere (header branding, declaration text, SLA days, support contact). The
-- admin Settings panel also has no way to create a setting key that doesn't already exist, so
-- until this ran, that tab was permanently empty with nothing to add.
INSERT INTO app_settings (key, value, description) VALUES
  ('declaration_text', 'I confirm that the information provided is accurate, that the equipment is required for authorised University of Zambia use, and that I have not knowingly submitted a duplicate request.', 'Declaration a requester must accept before submitting'),
  ('organisation_name', 'University of Zambia', 'Institution name shown in the header and documents'),
  ('unit_name', 'CICT · Equipment Specifications', 'Sub-title shown beside the institution name'),
  ('support_email', 'servicedesk@unza.zm', 'Contact address shown on help and sign-in pages'),
  ('manager_sla_days', '3', 'Working days a manager has to act on a request'),
  ('cict_sla_days', '5', 'Working days CICT has to complete a technical review')
ON CONFLICT (key) DO NOTHING;
