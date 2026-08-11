-- The stored Platform dropdown was a leftover from the template this site
-- started as: "Native to your CRM", "Talk to sales", and seven of its ten items
-- pointing at `#`. It is deleted rather than rewritten, because the header
-- carries its own Platform dropdown now and a stored one only wins when an
-- editor writes a real one.
--
-- Guarded on the copy itself, so a Platform dropdown someone has since written
-- by hand is left alone.
DELETE FROM "navigation_dropdowns"
WHERE "label" = 'Platform'
  AND "kind" = 'manual'
  AND "items"::text LIKE '%Native to your CRM%';

-- The generated apps dropdown is fine; only its name is from the old copy.
UPDATE "navigation_dropdowns"
SET "label" = 'Technologies'
WHERE "label" = 'Ecosystem' AND "kind" = 'apps';
