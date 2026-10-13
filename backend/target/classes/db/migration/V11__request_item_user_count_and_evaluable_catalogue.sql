-- Makes the paper form's printer user count a structured, validated value and
-- supplies baseline CICT profiles for all categories introduced in V10. A
-- technical reviewer can therefore evaluate every seeded request item instead
-- of approving a category with no specification attached.

ALTER TABLE request_items ADD COLUMN number_of_users integer;
ALTER TABLE request_items ADD CONSTRAINT request_items_number_of_users_positive
  CHECK (number_of_users IS NULL OR number_of_users > 0);

-- Preserve a numeric count from any draft that previously stored values such as
-- "8 users" in the intended_users free-text field.
UPDATE request_items ri
SET number_of_users = substring(ri.intended_users from '[0-9]+')::integer
FROM equipment_categories c
WHERE ri.category_id = c.id
  AND c.code = 'PRINTER'
  AND ri.number_of_users IS NULL
  AND ri.intended_users ~ '[0-9]+';

UPDATE equipment_categories SET asset_class = 'End-user computing'
WHERE code IN ('LAPTOP','DESKTOP','APPLE','TABLET') AND asset_class IS NULL;
UPDATE equipment_categories SET asset_class = 'Peripheral'
WHERE code IN ('PRINTER','SCANNER') AND asset_class IS NULL;
UPDATE equipment_categories SET asset_class = 'Audio visual'
WHERE code = 'PROJECTOR' AND asset_class IS NULL;

INSERT INTO equipment_categories
  (code, name, description, asset_class, standard_warranty_months,
   requires_network_port, requires_software_licence, sort_order)
VALUES
  ('MONITOR','Monitor','External display for desktop and laptop users','Peripheral',12,false,false,14),
  ('UPS','Uninterruptible Power Supply (UPS)','Power backup and surge protection','Power and protection',12,false,false,15),
  ('POWER_SURGE_PROTECTOR','Power Adaptor / Surge Protector','Multi-way protected power adaptor','Power and protection',12,false,false,16),
  ('SERVER','Server','Server and datacentre computing','Server and datacentre',36,true,false,17),
  ('NETWORK_ACCESSORY','Network Rack / Patch Panel / Connector','Network installation accessories, racks, patch panels and connectors','Networking',12,false,false,18),
  ('ICT_ACCESSORY','ICT Accessory / Other Equipment','Keyboard, mouse, dock, headset, webcam or another ICT accessory','Peripheral',12,false,false,19)
ON CONFLICT (code) DO NOTHING;

INSERT INTO spec_profiles (category_id, tier, name, summary, specs, suits_position_levels)
SELECT c.id, v.tier, v.name, v.summary, v.specs::jsonb, ARRAY[]::text[]
FROM equipment_categories c
JOIN (VALUES
  ('SCANNER','Standard','Departmental document scanner','Duplex document digitisation for office use',
   '{"Type":"Sheet-fed duplex scanner with flatbed where required","Speed":"40 ppm or better","ADF":"80 sheets or better","Resolution":"600 dpi or better","Connectivity":"USB 3.0 and Ethernet/Wi-Fi where shared","Warranty":"1 year or better"}'),
  ('NETWORK_SWITCH','Standard','Small-business unmanaged switch','Basic office Ethernet expansion',
   '{"Classification":"Small business","Management":"Unmanaged","Ethernet Ports":"10/100/1000 Mbps","Number of Ports":"5 or more","Warranty":"1 year or better"}'),
  ('NETWORK_SWITCH','Enhanced','Managed access switch','Departmental managed access switching',
   '{"Management":"Managed Layer 2+","Ethernet Ports":"24 x 1GbE or as assessed","Uplinks":"SFP/SFP+ as assessed","PoE":"PoE+ where required","Mounting":"Rack mount","Warranty":"1 year or better"}'),
  ('NETWORK_ROUTER','Standard','Business network router','CICT-managed routing for an approved network deployment',
   '{"Interfaces":"Gigabit Ethernet WAN and LAN","Routing":"IPv4/IPv6 with VLAN support","Security":"Stateful firewall and access control","Management":"Central or secure web/CLI management","Warranty":"1 year or better"}'),
  ('NETWORK_CABLE','Standard','Cat 6 structured cabling','Office structured copper network run',
   '{"Cable Type":"UTP Cat 6 solid copper","Performance":"1 Gigabit Ethernet minimum","Termination":"RJ-45 with tested endpoints","Installation":"Length and route determined by CICT site assessment","Testing":"Certified after installation"}'),
  ('NETWORK_TRUNKING','Standard','PVC trunking and cable management','Protected routing and dressing of office cabling',
   '{"Trunking":"PVC adhesive wall trunking, size determined by route","Cable Management":"Reusable wraps or equivalent","Installation":"Neat, labelled and separated from unsafe power runs","Quantity":"Based on measured route"}'),
  ('NETWORK_ACCESS_POINT','Standard','Wi-Fi 6 access point','Managed institutional wireless coverage',
   '{"Wireless":"Wi-Fi 6 (802.11ax) or better","Bands":"2.4 GHz and 5 GHz","Power":"PoE/PoE+","Security":"WPA2-Enterprise/WPA3-Enterprise","Management":"Compatible with the institutional wireless platform","Warranty":"1 year or better"}'),
  ('SOFTWARE_LICENCE','Standard','Institutional software licence','Supported software entitlement for authorised University use',
   '{"Licence":"Genuine institutional/commercial licence","Term":"Perpetual or subscription as approved","Platform":"Compatible with the approved endpoint","Deployment":"CICT-managed installation where applicable","Support":"Publisher updates and support for the licence term"}'),
  ('MONITOR','Standard','24-inch business monitor','General-purpose external display',
   '{"Display":"24-inch Full HD","Resolution":"1920 x 1080","Panel":"IPS or equivalent","Connectivity":"HDMI and DisplayPort","Adjustability":"Tilt; height adjustment preferred","Warranty":"1 year or better"}'),
  ('UPS','Standard','Desktop UPS','Backup and surge protection for a workstation',
   '{"Capacity":"1000 VA / 600 W or better","Topology":"Line interactive","Runtime":"15 minutes at half load or better","Protection":"Surge and overload protection","Warranty":"1 year or better"}'),
  ('POWER_SURGE_PROTECTOR','Standard','Four-way surge-protected adaptor','Protected multi-way office power adaptor',
   '{"Outlets":"Four or more","Protection":"Surge and overload protection","Cable":"Heavy-duty cable suitable for rated load","Compliance":"Applicable electrical safety standards","Warranty":"1 year or better"}'),
  ('SERVER','Specialised','Rack server baseline','Departmental or institutional application hosting',
   '{"Form Factor":"Rack mount","Processor":"Server-grade multi-core CPU","Memory":"128 GB ECC or as assessed","Storage":"Enterprise RAID storage sized to workload","Power":"Redundant power supplies","Management":"Out-of-band remote management","Warranty":"3 years or better"}'),
  ('NETWORK_ACCESSORY','Standard','Network installation accessory','Racks, patch panels, faceplates and connectors',
   '{"Compatibility":"Compatible with the approved Cat 6/fibre installation","Labelling":"Permanent endpoint and panel labels","Installation":"CICT-approved layout and workmanship","Quantity":"Based on site assessment"}'),
  ('ICT_ACCESSORY','Standard','Standard ICT accessory','Common endpoint peripheral or accessory',
   '{"Compatibility":"Compatible with the assigned University equipment","Connectivity":"USB-A, USB-C or wireless as approved","Classification":"Business-grade","Warranty":"1 year where applicable"}')
) AS v(code, tier, name, summary, specs) ON v.code = c.code
WHERE NOT EXISTS (
  SELECT 1 FROM spec_profiles p
  WHERE p.category_id = c.id AND p.tier = v.tier AND p.name = v.name
);
