-- os.oxy.so is retired outright, with no redirect: the Oxy OS product page is
-- https://oxy.so/os. Repoint only a row still naming the old host, so a CMS edit
-- made since is kept, and a rerun changes nothing.
UPDATE "products"
SET "href" = 'https://oxy.so/os', "updated_at" = now()
WHERE "product_id" = 'oxyos'
  AND "href" ~* '^https?://os\.oxy\.so(/|$)';
