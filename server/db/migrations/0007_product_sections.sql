-- Three products sat under a heading that did not describe them: an assistant
-- filed under social, a code editor and an operating system filed as apps. The
-- seed is the source for a fresh database; these move the rows that already
-- exist. Each names the section it is moving FROM, so a product an editor has
-- since filed by hand is left where they put it.
UPDATE "products"
SET "section" = 'apps', "category" = (SELECT "_id" FROM "categories" WHERE "slug" = 'apps')
WHERE "product_id" = 'alia' AND "section" = 'social-communication';

UPDATE "products"
SET "section" = 'developer', "category" = (SELECT "_id" FROM "categories" WHERE "slug" = 'developer')
WHERE "product_id" = 'codea' AND "section" = 'apps';

UPDATE "products"
SET "section" = 'infrastructure', "category" = (SELECT "_id" FROM "categories" WHERE "slug" = 'infrastructure')
WHERE "product_id" = 'oxyos' AND "section" = 'apps';
