-- The source "MACBOOK AIR" / "MACBOOK PRO" specification documents carry an
-- explicit footer: "Not to be re-used for any future procurement requests.
-- Not to be used after 31st December, 2024." (document code H-LAP-2404).
-- They are expired per their own issuing document and must not be offered
-- as live catalogue entries. The iMac profile is unaffected (its source
-- document carries no such restriction).

DELETE FROM spec_profiles
WHERE name IN ('MacBook Air', 'MacBook Pro')
  AND category_id = (SELECT id FROM equipment_categories WHERE code = 'APPLE');
