-- Retain the historical CMS row and every other surface setting. The canonical
-- Moovo record already links to https://moovo.now; only hide the duplicate menu
-- entry when that canonical replacement is itself visible in navigation.
UPDATE "products" AS legacy
SET "show_in_nav" = false, "updated_at" = now()
WHERE legacy."product_id" = 'm'
  AND legacy."show_in_nav" IS TRUE
  AND EXISTS (
    SELECT 1 FROM "products" AS canonical
    WHERE canonical."product_id" = 'moovo'
      AND canonical."show_in_nav" IS TRUE
  );
