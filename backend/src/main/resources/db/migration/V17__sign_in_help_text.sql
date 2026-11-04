-- Optional help line under the sign-in form (e.g. who to contact when sign-in fails).
-- Starts blank, which hides it; administrators set the wording under Admin → Settings.
INSERT INTO app_settings (key, value, description) VALUES
  ('sign_in_help_text', '', 'Help line shown under the sign-in form, e.g. who to contact if sign-in fails. Leave blank to hide it.')
ON CONFLICT (key) DO NOTHING;
