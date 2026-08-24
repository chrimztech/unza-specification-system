-- Replaces the placeholder demo seed data with the real UNZA CICT equipment
-- catalogue, transcribed from the official "ICT Equipment Specifications"
-- forms supplied by CICT. V2's seed data (org units, lookup values, app
-- settings, equipment categories, spec profiles) is cleared in full; only the
-- real equipment catalogue is reloaded here. Org units, dropdown lookup
-- values and app settings are intentionally left empty for CICT admins to
-- repopulate via the admin panel (the frontend falls back to sensible
-- built-in defaults for dropdowns and settings in the meantime).

DELETE FROM spec_profiles;
DELETE FROM equipment_categories;
DELETE FROM lookup_values;
DELETE FROM app_settings;
DELETE FROM org_units;

-- CATEGORIES
INSERT INTO equipment_categories (code, name, description, icon, standard_warranty_months, sort_order) VALUES
 ('LAPTOP','Laptop','Windows portable computing for staff and academics','💻',12,1),
 ('DESKTOP','Desktop Computer','Windows fixed workstation computing','🖥️',12,2),
 ('APPLE','Apple Computer','macOS laptops and all-in-one desktops','🍎',12,3),
 ('TABLET','Tablet','Portable touchscreen devices','📱',12,4),
 ('PRINTER','Printer','Departmental and personal printing','🖨️',12,5),
 ('PROJECTOR','Projector','Teaching and presentation display','📽️',12,6);

-- SPEC PROFILES
INSERT INTO spec_profiles (category_id, tier, name, summary, specs, suits_position_levels)
SELECT c.id, v.tier, v.name, v.summary, v.specs::jsonb, v.levels
FROM equipment_categories c
JOIN (VALUES

 -- LAPTOP
 ('LAPTOP','Standard','ProBook 14-inch — Core i5','Everyday administrative and academic laptop',
   '{"Operating System":"Genuine Windows 11 Pro 64 with a valid transferable and non-expiring licence","Processor":"Intel Core i5 13th Generation","Memory":"16 GB and above","Storage":"512 GB SSD","Display":"14-inch FHD","Camera and Audio":"Webcam with integrated microphone, embedded speakers","Connectivity":"RJ-45, HDMI, USB, Wi-Fi","Classification":"ProBook","Warranty":"1 year"}',
   ARRAY['Support staff','Officer']),
 ('LAPTOP','Standard','ProBook 15.6-inch — Core i5','Everyday administrative and academic laptop, larger display',
   '{"Operating System":"Genuine Windows 11 Pro 64 with a valid transferable and non-expiring licence","Processor":"Intel Core i5 13th Generation","Memory":"16 GB and above","Storage":"512 GB SSD","Display":"15.6-inch FHD","Camera and Audio":"Webcam with integrated microphone, embedded speakers","Connectivity":"RJ-45, HDMI, USB, Wi-Fi","Classification":"ProBook","Warranty":"1 year"}',
   ARRAY['Support staff','Officer','Technician']),
 ('LAPTOP','Enhanced','ProBook 15.6-inch — Core i7','Higher-workload teaching and research laptop',
   '{"Operating System":"Genuine Windows 11 Pro 64 with a valid transferable and non-expiring licence","Processor":"Intel Core i7 13th Generation","Memory":"16 GB and above","Storage":"512 GB SSD","Display":"15.6-inch FHD","Camera and Audio":"Webcam with integrated microphone, embedded speakers","Connectivity":"RJ-45, HDMI, USB, Wi-Fi","Classification":"ProBook","Warranty":"1 year"}',
   ARRAY['Lecturer','Senior Lecturer','Researcher']),
 ('LAPTOP','Specialised','ProBook 15.6-inch — Core i7 High Performance','Heavy multitasking, engineering and data-intensive work',
   '{"Operating System":"Genuine Windows 11 Pro 64 with a valid transferable and non-expiring licence","Processor":"Intel Core i7 13th Generation","Memory":"32 GB and above","Storage":"1 TB SSD","Display":"15.6-inch FHD","Camera and Audio":"Webcam with integrated microphone, embedded speakers","Connectivity":"RJ-45, HDMI, USB, Wi-Fi","Classification":"ProBook","Warranty":"1 year"}',
   ARRAY['Professor','Researcher','Specialist','Manager']),
 ('LAPTOP','Enhanced','Business Laptop — Intel Core Ultra 5','Latest-generation efficient business laptop',
   '{"Operating System":"Genuine Windows 11 Professional with a valid transferable and non-expiring licence","Processor":"Intel Core Ultra 5","Memory":"16 GB","Storage":"512 GB SSD","Display":"15-inch WUXGA IPS FHD 1080p, dual mics, privacy shutter","Connectivity":"RJ-45, HDMI, 4x USB Type-A","Classification":"Business/Professional","Warranty":"1 year"}',
   ARRAY['Manager','Head of Department']),
 ('LAPTOP','Specialised','Business Laptop — Intel Core Ultra 7','Latest-generation high-performance business laptop',
   '{"Operating System":"Genuine Windows 11 Professional with a valid transferable and non-expiring licence","Processor":"Intel Core Ultra 7","Memory":"16 GB","Storage":"512 GB SSD","Display":"15-inch WUXGA IPS FHD 1080p, dual mics, privacy shutter","Connectivity":"RJ-45, HDMI, 4x USB Type-A","Classification":"Business/Professional","Warranty":"1 year"}',
   ARRAY['Director','Dean','Top management','Executive management']),

 -- DESKTOP
 ('DESKTOP','Standard','Desktop Tower — Core i5, 1TB','Office productivity and university systems',
   '{"Form Factor":"Tower","Operating System":"Genuine Windows 11 Pro 64 with a transferable non-expiring licence","Processor Type":"Intel Core i5 13th Gen or above","Processor Speed":"2.5 GHz or higher","Memory":"16 GB","Graphics":"Integrated","Storage":"1 TB SATA","Display":"21-inch and above FHD with Energy Star rating","Connectivity":"RJ-45, HDMI, USB","Classification":"Business","Warranty":"1 year"}',
   ARRAY['Support staff','Officer']),
 ('DESKTOP','Enhanced','Desktop Tower — Core i7, 512GB SSD','Computer laboratories and technical use',
   '{"Form Factor":"Tower","Operating System":"Genuine Windows 11 Pro 64 with a transferable non-expiring licence","Processor Type":"Intel Core i7 13th Gen or above","Processor Speed":"2.5 GHz or higher","Memory":"16 GB","Graphics":"Integrated","Storage":"512 GB SSD","Display":"21-inch and above FHD with Energy Star rating","Connectivity":"RJ-45, HDMI, USB","Classification":"Business","Warranty":"1 year"}',
   ARRAY['Lecturer','Technician']),
 ('DESKTOP','Specialised','Desktop Tower — Core i7 High Performance, 1TB','Heavier workstation computing and multitasking',
   '{"Form Factor":"Tower","Operating System":"Genuine Windows 11 Pro 64 with a transferable non-expiring licence","Processor Type":"Intel Core i7 13th Gen or above","Processor Speed":"2.5 GHz or higher","Memory":"32 GB","Graphics":"Integrated","Storage":"1 TB SATA","Display":"21-inch and above FHD with Energy Star rating","Connectivity":"RJ-45, HDMI, USB","Classification":"Business","Warranty":"1 year"}',
   ARRAY['Researcher','Specialist','Manager']),

 -- APPLE
 ('APPLE','Standard','MacBook Air','Standard Apple laptop for everyday professional use',
   '{"Form Factor":"Standard laptop with backlit Magic Keyboard","Operating System":"macOS Sonoma or higher","Processor":"Apple M3 chip, 8-core CPU or above","Memory":"12 GB","Storage":"512 GB SSD","Display":"13.3-inch FHD","Camera and Audio":"Webcam with integrated microphone, embedded speakers","Classification":"MacBook Air","Warranty":"1 year"}',
   ARRAY[]::text[]),
 ('APPLE','Enhanced','MacBook Pro','Higher-workload Apple laptop for teaching and research',
   '{"Form Factor":"Standard laptop with backlit Magic Keyboard","Operating System":"macOS Sonoma or higher","Processor":"Apple M3 chip, 8-core CPU or above","Memory":"12 GB","Storage":"512 GB SSD","Display":"14-inch FHD","Camera and Audio":"Webcam with integrated microphone, embedded speakers","Classification":"MacBook Pro","Warranty":"1 year"}',
   ARRAY['Professor','Researcher','Dean']),
 ('APPLE','Standard','iMac All-in-One','All-in-one desktop for consumer, business and creative use',
   '{"Form Factor":"All-in-One Desktop","Operating System":"macOS Sonoma, with entitlement to future macOS upgrades","Processor":"Apple M3 chip (8-core CPU)","Memory":"8 GB unified memory (configurable to 16 GB or 24 GB at purchase)","Storage":"512 GB SSD","Display":"24-inch 4.5K Retina","Connectivity":"2x USB-C/Thunderbolt, 3.5mm headphone jack, Gigabit Ethernet","Classification":"Consumer / Business / Creative Professional","Warranty":"1 year"}',
   ARRAY[]::text[]),

 -- TABLET
 ('TABLET','Standard','iPad','Apple portable tablet device',
   '{"Operating System":"iPadOS 16+","Processor":"Apple M3, up to 8-core GPU","Display":"10-inch","Memory":"4 GB and above","Storage":"64 GB","Camera":"Rear camera, 8.0 MP and above","SIM":"Nano-SIM, eSIM","Stylus Support":"Yes","Battery Life":"10 hours or more internet usage (LTE)","Ports and Connectivity":"USB-C, GPS, Wi-Fi, Bluetooth","Accessories":"Protective cover (pouch), glass screen protector, power bank","Warranty":"1 year"}',
   ARRAY[]::text[]),
 ('TABLET','Standard','Samsung Galaxy Tab','Android portable tablet device',
   '{"Operating System":"Android 11, upgradable to Android 14, One UI 6","Processor":"Octa-core Qualcomm","Display":"8.7-inch","Memory":"4 GB and above","Storage":"64 GB and above","Camera":"Rear camera, 8.0 MP and above","SIM":"Nano-SIM, eSIM","S Pen Support":"Yes","Battery Life":"10 hours or more internet usage (LTE)","Ports and Connectivity":"USB-C, GPS, Wi-Fi, Bluetooth","Classification":"Galaxy","Accessories":"Protective cover (pouch), glass screen protector, 20,000 mAh power bank","Warranty":"1 year"}',
   ARRAY[]::text[]),

 -- PRINTER
 ('PRINTER','Standard','Colour Multifunction Printer','Colour printing, copying and scanning',
   '{"Printing Type":"Colour","Printing Technology":"Colour laser","Available Functions":"Print, copy, scan","Print Speed":"28 ppm or faster","Print Resolution":"600 x 600 dpi","Display":"Colour graphic touchscreen","Duplex Printing":"Automatic","Media Sizes":"A4, A5, Legal, Letter, Envelopes","Scanner Type":"Flatbed + ADF (50+ sheets)","Standard Memory":"512 MB or above","Processor":"1200 MHz","Recommended Max Volume":"3,000 pages or above per month","Connectivity":"USB 2.0, Gigabit Ethernet, Wi-Fi","Warranty":"1 year"}',
   ARRAY[]::text[]),
 ('PRINTER','Enhanced','Monochrome Multifunction Printer','Higher-volume shared departmental printing, copying and scanning',
   '{"Printing Type":"Monochrome","Printing Technology":"Laser","Available Functions":"Print, copy, scan","Print Speed":"32 ppm or faster","Print Resolution":"1200 x 1200 dpi","Media Sizes":"A4, A5, Legal, Letter, Envelopes","Standard Memory":"512 MB or above","Processor":"1 GHz or above","Recommended Max Volume":"60,000 pages or above per month","Connectivity":"USB 2.0 Type-B, Gigabit Ethernet","Warranty":"1 year"}',
   ARRAY[]::text[]),
 ('PRINTER','Standard','Monochrome Printer (Print Only)','Personal or small-office black and white printing',
   '{"Printing Type":"Monochrome","Printing Technology":"Laser","Available Functions":"Print only (duplex + Ethernet)","Print Speed":"38 ppm or faster","Print Resolution":"1200 x 1200 dpi","Media Sizes":"A4, A5, Legal, Letter, Envelopes","Standard Memory":"1 GB or above","Processor":"1200 MHz","Recommended Max Volume":"3,000 pages or above per month","Connectivity":"USB 2.0 Type-B, Gigabit Ethernet","Warranty":"1 year"}',
   ARRAY[]::text[]),

 -- PROJECTOR
 ('PROJECTOR','Standard','Portable Projector — 3000 Lumen','Standard teaching and presentation venues',
   '{"Projector Type":"Portable","Projection System":"3LCD","Light Source":"Laser/Lamp","Max Screen Size":"150 inches","Resolution":"1080p and above","Aspect Ratio":"16:9 and above","Light Output":"3,000 lumens (normal mode)","Throw Ratio":"0.2:1 and above","Mounting":"Table/desktop, ceiling (minimum)","Wireless":"Yes","Connectivity":"HDMI, USB, Wi-Fi","Warranty":"1 year"}',
   ARRAY[]::text[]),
 ('PROJECTOR','Enhanced','Portable Projector — 4000+ Lumen','Larger venues and brighter rooms',
   '{"Projector Type":"Portable","Projection System":"3LCD","Light Source":"Laser/Lamp","Max Screen Size":"150 inches","Resolution":"1080p and above","Aspect Ratio":"16:9 and above","Contrast Ratio":"1,000:1 and above","Light Output":"At least 4,000 lumens (normal mode)","Throw Ratio":"0.2:1 and above","Mounting":"Table/desktop, ceiling (minimum)","Wireless":"Yes","Connectivity":"HDMI, USB, Wi-Fi","Warranty":"1 year"}',
   ARRAY[]::text[])

) AS v(cat, tier, name, summary, specs, levels) ON v.cat = c.code;
