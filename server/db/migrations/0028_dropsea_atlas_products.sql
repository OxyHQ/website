-- Two Oxy apps join the catalogue: Atlas, the Oxy app store at atlas.oxy.so,
-- and Dropsea, photos and files by Oxy, whose web app is to live at
-- dropsea.net. Their icons are local brand marks (`src/api/hooks.ts`), so no
-- media row is needed.
--
-- Neither is on the status page: Atlas has no service of its own (the store
-- lives in oxy-api, which is already watched) and Dropsea is not deployed.
-- Dropsea stays out of the menu until dropsea.net serves it.
--
-- DO NOTHING on conflict: a row an editor has made or changed since is theirs,
-- and a rerun changes nothing.
INSERT INTO "products" (
  "_id", "product_id", "name", "tagline", "description", "href", "health_url",
  "external", "cta", "brand", "mark", "category", "section", "lifecycle",
  "show_on_products", "show_on_status", "show_in_nav", "order"
)
VALUES
  (
    'ce5e0eba9b633f027122d105', 'atlas', 'Atlas', 'The Oxy app store',
    'Find, try and review apps built on Oxy, with one account for all of them.',
    'https://atlas.oxy.so', NULL, true, 'Open Atlas', '#0ea5e9', 'A',
    (SELECT "_id" FROM "categories" WHERE "slug" = 'apps'), 'apps', 'live',
    true, false, true, 5
  ),
  (
    '09283021366d6c530805d74c', 'dropsea', 'Dropsea', 'Photos and files by Oxy',
    'Your photos and files in one place, kept in Oxy Files and organised into albums.',
    'https://dropsea.net', NULL, true, 'Open Dropsea', '#0a62e0', 'D',
    (SELECT "_id" FROM "categories" WHERE "slug" = 'apps'), 'apps', 'in-development',
    true, false, false, 5
  )
ON CONFLICT ("product_id") DO NOTHING;
