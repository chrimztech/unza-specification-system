-- Adds "Designation of Intended User" (present on CICT's paper ICT Equipment
-- Specifications forms, e.g. "Assistant Dean Undergraduate & Assistant Dean
-- Postgraduate"), which is distinct from the requester's own HR position level
-- when the request is raised for a role rather than a named individual.

ALTER TABLE requests ADD COLUMN designation text;

INSERT INTO lookup_values (list_key, value, label, sort_order) VALUES
  ('designation','Vice-Chancellor','Vice-Chancellor',1),
  ('designation','Deputy Vice-Chancellor','Deputy Vice-Chancellor',2),
  ('designation','Registrar','Registrar',3),
  ('designation','Bursar / CFO','Bursar / CFO',4),
  ('designation','Dean','Dean',5),
  ('designation','Assistant Dean','Assistant Dean',6),
  ('designation','Head of Department','Head of Department',7),
  ('designation','Manager','Manager',8),
  ('designation','Researcher','Researcher',9),
  ('designation','Academic Staff','Academic Staff',10),
  ('designation','Non-Academic Staff','Non-Academic Staff',11),
  ('designation','Technical Staff','Technical Staff',12),
  ('designation','Other','Other (please specify)',13)
ON CONFLICT (list_key, value) DO NOTHING;
