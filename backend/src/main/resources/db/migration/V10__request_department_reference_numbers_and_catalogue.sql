-- Adds Unit/School + Department capture, system-generated request reference numbers
-- (replacing the manually-entered "CICT Help Desk ticket number" introduced by V7),
-- software categorisation for requested items, and rounds out the equipment catalogue
-- with the Scanner and networking/software items shown on CICT's paper spec and BoQ
-- forms but missing from the V3 real catalogue import. Also seeds org_units with the
-- real UNZA schools and directorates (left empty since V9) so the new Unit/School
-- picker has real data on day one.

ALTER TABLE requests ADD COLUMN department text;
ALTER TABLE request_items ADD COLUMN software_category text;

-- Day-scoped counter backing ReferenceNumberService.nextRequestNumber(): yyyyMMdd + 4-digit sequence.
CREATE TABLE request_number_sequences (
  seq_date date PRIMARY KEY,
  last_value int NOT NULL DEFAULT 0
);

INSERT INTO lookup_values (list_key, value, label, sort_order) VALUES
  ('software_category','Design','Design',1),
  ('software_category','Teaching','Teaching',2),
  ('software_category','Development','Development',3),
  ('software_category','Other','Other',4)
ON CONFLICT (list_key, value) DO NOTHING;

INSERT INTO lookup_values (list_key, value, label, sort_order) VALUES
  ('asset_class','Software','Software',7)
ON CONFLICT (list_key, value) DO NOTHING;

-- CATALOGUE: Scanner, networking equipment and a standalone software-licence category.
INSERT INTO equipment_categories (code, name, description, icon, asset_class, standard_warranty_months, requires_network_port, requires_software_licence, sort_order) VALUES
  ('SCANNER','Scanner','Document and image scanning','🖨️','Peripheral',12,false,false,7),
  ('NETWORK_SWITCH','Network Switch','Managed or unmanaged Ethernet switch for office/departmental networking','🔀','Networking',12,true,false,8),
  ('NETWORK_ROUTER','Router','Network routing equipment','📡','Networking',12,true,false,9),
  ('NETWORK_CABLE','Network Cable','UTP/Cat6 cabling for network runs','🔌','Networking',null,true,false,10),
  ('NETWORK_TRUNKING','Cable Trunking / Management','PVC wall trunking and cable management for network cable runs','📏','Networking',null,false,false,11),
  ('NETWORK_ACCESS_POINT','Wireless Access Point','Wi-Fi access point for network coverage','📶','Networking',12,true,false,12),
  ('SOFTWARE_LICENCE','Software Licence','Standalone software licence request (design, teaching, development or other)','💿','Software',null,false,true,13)
ON CONFLICT (code) DO NOTHING;

-- ORG UNITS: real UNZA schools and directorates/centres/units (unit_type per admin.tsx's
-- UNIT_TYPES: school, directorate, department, unit, centre).
INSERT INTO org_units (code, name, unit_type, campus) VALUES
  ('SAS','School of Agricultural Sciences','school','Great East Road Campus'),
  ('SOE','School of Education','school','Great East Road Campus'),
  ('GSB','Graduate School of Business','school','Great East Road Campus'),
  ('SENG','School of Engineering','school','Great East Road Campus'),
  ('SHS','School of Health Sciences','school','Ridgeway Campus'),
  ('SHSS','School of Humanities and Social Sciences','school','Great East Road Campus'),
  ('SLAW','School of Law','school','Great East Road Campus'),
  ('SMED','School of Medicine','school','Ridgeway Campus'),
  ('SMIN','School of Mines','school','Great East Road Campus'),
  ('SNAS','School of Natural and Applied Sciences','school','Great East Road Campus'),
  ('SPH','School of Public Health','school','Ridgeway Campus'),
  ('SVM','School of Veterinary Medicine','school','Great East Road Campus'),
  ('CICT','Centre for Information & Communication Technologies','centre','Great East Road Campus'),
  ('DRD','Directorate of Research and Development','directorate','Great East Road Campus'),
  ('DITTC','Directorate of Innovation, Technology Transfer and Commercialization','directorate','Great East Road Campus'),
  ('CRHMA','Collaborative Research Hub for Multidisciplinary Advancement','centre','Great East Road Campus'),
  ('QAS','Quality Assurance and Security','directorate','Great East Road Campus'),
  ('VC','Office of the Vice-Chancellor','unit','Great East Road Campus'),
  ('REG','Registrar''s Office','directorate','Great East Road Campus'),
  ('BUR','Bursar''s Office','directorate','Great East Road Campus'),
  ('HR','Human Resources','directorate','Great East Road Campus'),
  ('DOSA','Dean of Student Affairs','directorate','Great East Road Campus'),
  ('IDE','Distance Education (IDE)','directorate','Great East Road Campus'),
  ('LIB','University Library','unit','Great East Road Campus'),
  ('ILLO','International Link and Liaison Office','unit','Great East Road Campus')
ON CONFLICT (code) DO NOTHING;
