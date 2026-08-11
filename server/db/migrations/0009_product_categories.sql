-- The Technologies dropdown groups by a product's CATEGORY, and production only
-- had two of them: everything sat in "Apps" except TNP. So the panel was one
-- column of fourteen beside a column of one, whatever the layout did with it.
--
-- The three missing categories are created, and each product is filed by hand
-- into the one that describes it. `_id` is a primary key with a JS-side default,
-- so these carry their own ObjectId-shaped ids.
INSERT INTO "categories" ("_id", "slug", "label", "scope", "order")
VALUES
  ('69dd0000000000000000c001', 'social-communication', 'Social & Communication', 'apps', 0),
  ('69dd0000000000000000c002', 'finance-commerce', 'Finance & Commerce', 'apps', 1),
  ('69dd0000000000000000c003', 'developer', 'Developer', 'apps', 4)
ON CONFLICT ("slug") DO NOTHING;

-- Apps and Infrastructure already exist; put them in the order the rest expect.
UPDATE "categories" SET "order" = 2 WHERE "slug" = 'apps';
UPDATE "categories" SET "order" = 3 WHERE "slug" IN ('infrastructure', 'infraestructure');

/*
 * Each move names the category it is moving FROM, so a product an editor has
 * since filed by hand stays where they put it. `section` moves with `category`:
 * the dropdown reads the category, the technologies page reads the section, and
 * the two disagreeing is what made the same product sit in different groups on
 * different pages.
 */
UPDATE "products" p
SET "category" = c."_id", "section" = c."slug"
FROM "categories" c
WHERE c."slug" = 'social-communication'
  AND p."product_id" IN ('mention', 'i', 'inbox', 'alia')
  AND p."category" = (SELECT "_id" FROM "categories" WHERE "slug" = 'apps');

UPDATE "products" p
SET "category" = c."_id", "section" = c."slug"
FROM "categories" c
WHERE c."slug" = 'finance-commerce'
  AND p."product_id" IN ('faircoin', 'fairwallet', 'faircoin-wallet', 'faircoinexplorer', 'faircoin-explorer', 'pay', 'marketplace', 'mercaria')
  AND p."category" = (SELECT "_id" FROM "categories" WHERE "slug" = 'apps');

-- Last, the rows whose two fields already disagreed: TNP was in the
-- Infrastructure category and still said `apps` in its section, so the dropdown
-- put it under Infrastructure and the technologies page under Apps. The
-- category is the one an editor picked from a list, so it wins.
UPDATE "products" p
SET "section" = c."slug"
FROM "categories" c
WHERE c."_id" = p."category"
  AND p."section" = 'apps'
  AND c."slug" <> 'apps';
