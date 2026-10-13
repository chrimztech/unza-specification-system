-- V12's designation list was transcribed narrowly from the handwritten CICT note and
-- missed several designations already recognised elsewhere in the system (position_level
-- in V9 has the fuller academic/administrative ladder). Aligns designation with that same
-- ladder so requesters raising a request for a role (e.g. "Director") aren't stuck picking
-- "Other" for a title the system already knows about.

INSERT INTO lookup_values (list_key, value, label, sort_order) VALUES
  ('designation','Support Staff','Support Staff',14),
  ('designation','Officer','Officer',15),
  ('designation','Senior Officer','Senior Officer',16),
  ('designation','Principal Officer','Principal Officer',17),
  ('designation','Technician','Technician',18),
  ('designation','Assistant Lecturer','Assistant Lecturer',19),
  ('designation','Lecturer','Lecturer',20),
  ('designation','Senior Lecturer','Senior Lecturer',21),
  ('designation','Principal Lecturer','Principal Lecturer',22),
  ('designation','Specialist','Specialist',23),
  ('designation','Assistant Director','Assistant Director',24),
  ('designation','Deputy Director','Deputy Director',25),
  ('designation','Director','Director',26),
  ('designation','Associate Professor','Associate Professor',27),
  ('designation','Professor','Professor',28),
  ('designation','Deputy Dean','Deputy Dean',29),
  ('designation','Top Management','Top Management',30),
  ('designation','Executive Management','Executive Management',31)
ON CONFLICT (list_key, value) DO NOTHING;

-- "Other" should remain the last item in the dropdown now that more real designations exist above it.
UPDATE lookup_values SET sort_order = 99 WHERE list_key = 'designation' AND value = 'Other';
