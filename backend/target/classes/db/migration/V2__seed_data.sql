-- SEED: org units
INSERT INTO org_units (code, name, unit_type, campus) VALUES
 ('CICT','Centre for Information and Communications Technology','directorate','Great East Road'),
 ('SOE','School of Engineering','school','Great East Road'),
 ('SNS','School of Natural Sciences','school','Great East Road'),
 ('SOM','School of Medicine','school','Ridgeway'),
 ('REG','Registrar''s Office','directorate','Great East Road'),
 ('LIB','University Library','unit','Great East Road'),
 ('FIN','Finance Directorate','directorate','Great East Road');

-- SEED: equipment categories
INSERT INTO equipment_categories (code, name, description, sort_order) VALUES
 ('LAPTOP','Laptop','Portable computing for staff and academics',1),
 ('DESKTOP','Desktop computer','Fixed workstation computing',2),
 ('PRINTER','Printer','Departmental and personal printing',3),
 ('PROJECTOR','Projector','Teaching and presentation display',4),
 ('MONITOR','Monitor','External display',5),
 ('SCANNER','Scanner','Document digitisation',6),
 ('UPS','UPS','Power backup and protection',7),
 ('SERVER','Server','Server and datacentre compute',8),
 ('NETWORK','Networking equipment','Switches, access points, routers',9),
 ('ACCESSORY','Accessory','Peripherals and accessories',10);

-- SEED: spec profiles
INSERT INTO spec_profiles (category_id, tier, name, summary, specs, suits_position_levels)
SELECT c.id, v.tier, v.name, v.summary, v.specs::jsonb, v.levels
FROM equipment_categories c
JOIN (VALUES
 ('LAPTOP','Standard','Laptop - Standard Administrative','Everyday administrative and clerical work','{"Processor":"Intel Core i5 (latest generation) or equivalent","Memory":"8 GB DDR4","Storage":"256 GB SSD","Display":"14 inch Full HD","Operating system":"Windows 11 Pro","Warranty":"3 years on-site"}', ARRAY['Support staff','Officer']),
 ('LAPTOP','Enhanced','Laptop - Enhanced Academic','Teaching, research and heavy multitasking','{"Processor":"Intel Core i7 (latest generation) or equivalent","Memory":"16 GB DDR4","Storage":"512 GB SSD","Display":"14-15.6 inch Full HD","Operating system":"Windows 11 Pro","Warranty":"3 years on-site"}', ARRAY['Lecturer','Senior Lecturer','Manager']),
 ('LAPTOP','Specialised','Laptop - Specialised Workstation','Engineering, GIS, data science and media production','{"Processor":"Intel Core i9 / Ryzen 9 or equivalent","Memory":"32 GB DDR5","Storage":"1 TB NVMe SSD","Graphics":"Dedicated 6 GB GPU","Display":"15.6-16 inch, colour accurate","Operating system":"Windows 11 Pro","Warranty":"3 years on-site"}', ARRAY['Professor','Researcher','Specialist']),
 ('DESKTOP','Standard','Desktop - Standard Office','Office productivity and university systems','{"Processor":"Intel Core i5 or equivalent","Memory":"8 GB","Storage":"256 GB SSD","Monitor":"22 inch Full HD","Warranty":"3 years"}', ARRAY['Support staff','Officer']),
 ('DESKTOP','Enhanced','Desktop - Enhanced Laboratory','Computer laboratories and technical use','{"Processor":"Intel Core i7 or equivalent","Memory":"16 GB","Storage":"512 GB SSD","Monitor":"24 inch Full HD","Warranty":"3 years"}', ARRAY['Lecturer','Technician']),
 ('PRINTER','Standard','Printer - Departmental Mono Laser','Shared black and white departmental printing','{"Type":"Monochrome laser multifunction","Speed":"35 ppm","Duplex":"Automatic","Connectivity":"Ethernet and Wi-Fi","Duty cycle":"50,000 pages/month"}', ARRAY[]::text[]),
 ('PRINTER','Enhanced','Printer - Colour Multifunction','Colour printing, scanning and copying','{"Type":"Colour laser multifunction","Speed":"30 ppm","Duplex":"Automatic","Connectivity":"Ethernet and Wi-Fi","Duty cycle":"75,000 pages/month"}', ARRAY[]::text[]),
 ('PROJECTOR','Standard','Projector - Lecture Room','Standard teaching venues','{"Brightness":"4,000 ANSI lumens","Resolution":"WXGA 1280x800","Inputs":"HDMI, VGA, USB","Lamp life":"10,000 hours (eco)"}', ARRAY[]::text[]),
 ('MONITOR','Standard','Monitor - Standard 24 inch','General purpose external display','{"Size":"24 inch","Resolution":"1920x1080","Panel":"IPS","Adjustability":"Height and tilt","Warranty":"3 years"}', ARRAY[]::text[]),
 ('UPS','Standard','UPS - Desktop 1kVA','Protects a single workstation','{"Capacity":"1000 VA / 600 W","Topology":"Line interactive","Runtime":"15 minutes at half load","Outlets":"4 protected"}', ARRAY[]::text[]),
 ('SERVER','Specialised','Server - Rack Mount Standard','Departmental application hosting','{"Form factor":"2U rack","Processor":"Dual Xeon Silver","Memory":"128 GB ECC","Storage":"4 x 2 TB SAS, RAID 10","Power":"Redundant PSU","Warranty":"5 years next business day"}', ARRAY[]::text[]),
 ('NETWORK','Standard','Switch - 48 Port Managed','Access layer connectivity','{"Ports":"48 x 1GbE with PoE+","Uplinks":"4 x 10G SFP+","Management":"Layer 2+ managed","Warranty":"Limited lifetime"}', ARRAY[]::text[]),
 ('SCANNER','Standard','Scanner - Departmental ADF','Bulk document digitisation','{"Type":"Sheet-fed duplex","Speed":"40 ppm","ADF":"80 sheets","Connectivity":"USB and network"}', ARRAY[]::text[]),
 ('ACCESSORY','Standard','Accessory - Standard Peripheral Set','Keyboard, mouse and docking','{"Keyboard":"USB wired","Mouse":"USB optical","Dock":"USB-C universal dock","Warranty":"1 year"}', ARRAY[]::text[])
) AS v(cat, tier, name, summary, specs, levels) ON v.cat = c.code;

-- SEED: lookup values
INSERT INTO lookup_values (list_key, value, label, sort_order) VALUES
  ('position_level','Support staff','Support staff',1),
  ('position_level','Officer','Officer',2),
  ('position_level','Technician','Technician',3),
  ('position_level','Lecturer','Lecturer',4),
  ('position_level','Senior Lecturer','Senior Lecturer',5),
  ('position_level','Researcher','Researcher',6),
  ('position_level','Specialist','Specialist',7),
  ('position_level','Manager','Manager',8),
  ('position_level','Professor','Professor',9),
  ('position_level','Head of Department','Head of Department',10),
  ('position_level','Dean','Dean',11),
  ('position_level','Director','Director',12),
  ('position_level','Top management','Top management',13),
  ('position_level','Executive management','Executive management',14),
  ('request_type','New requirement','New requirement',1),
  ('request_type','Replacement','Replacement',2),
  ('request_type','Upgrade','Upgrade',3),
  ('request_type','Expansion','Expansion',4),
  ('request_type','Shared resource','Shared resource',5),
  ('request_type','Project requirement','Project requirement',6),
  ('request_type','Temporary need','Temporary need',7),
  ('business_context','Administration','Administration',1),
  ('business_context','Teaching','Teaching',2),
  ('business_context','Research','Research',3),
  ('business_context','Laboratory','Laboratory',4),
  ('business_context','Student service','Student service',5),
  ('business_context','Grant / project','Grant / project',6),
  ('priority','normal','Normal',1),
  ('priority','high','High',2),
  ('priority','urgent','Urgent',3),
  ('budget_status','Budgeted for current year','Budgeted for current year',1),
  ('budget_status','Not yet budgeted','Not yet budgeted',2),
  ('budget_status','Funded by project or grant','Funded by project or grant',3),
  ('budget_status','Unknown','Unknown',4),
  ('spec_tier','Standard','Standard',1),
  ('spec_tier','Enhanced','Enhanced',2),
  ('spec_tier','Specialised','Specialised',3),
  ('asset_class','End-user computing','End-user computing',1),
  ('asset_class','Peripheral','Peripheral',2),
  ('asset_class','Networking','Networking',3),
  ('asset_class','Server and datacentre','Server and datacentre',4),
  ('asset_class','Audio visual','Audio visual',5),
  ('asset_class','Power and protection','Power and protection',6),
  ('campus','Great East Road Campus','Great East Road Campus',1),
  ('campus','Ridgeway Campus','Ridgeway Campus',2),
  ('campus','Liempe Farm','Liempe Farm',3),
  ('role','requester','Requester',1),
  ('role','manager','Manager',2),
  ('role','cict_reviewer','CICT reviewer',3),
  ('role','cict_manager','CICT manager',4),
  ('role','procurement','Procurement',5),
  ('role','auditor','Auditor',6),
  ('role','admin','Administrator',7);

-- SEED: app settings
INSERT INTO app_settings (key, value, description) VALUES
  ('declaration_text','I confirm that the information provided is accurate, that the equipment is required for authorised University of Zambia use, and that I have not knowingly submitted a duplicate request.','Declaration a requester must accept before submitting'),
  ('organisation_name','University of Zambia','Institution name shown in the header and documents'),
  ('unit_name','CICT · Equipment Specifications','Sub-title shown beside the institution name'),
  ('support_email','servicedesk@unza.zm','Contact address shown on help and sign-in pages'),
  ('manager_sla_days','3','Working days a manager has to act on a request'),
  ('cict_sla_days','5','Working days CICT has to complete a technical review');
