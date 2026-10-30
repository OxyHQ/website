-- Two Oxy apps join the catalogue: Atlas, the Oxy app store at atlas.oxy.so,
-- and Stash, photos and files by Oxy, which has no public app yet and links to
-- its repository. Their icons are local brand marks (`src/api/hooks.ts`), so no
-- media row is needed.
--
-- Neither is on the status page: Atlas has no service of its own (the store
-- lives in oxy-api, which is already watched) and Stash is not deployed. Stash
-- stays out of the menu until it has somewhere to open.
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
    '09283021366d6c530805d74c', 'stash', 'Stash', 'Photos and files by Oxy',
    'Your photos and files in one place, kept in Oxy Files and organised into albums.',
    'https://github.com/OxyHQ/Stash', NULL, true, 'View on GitHub', '#ff5722', 'S',
    (SELECT "_id" FROM "categories" WHERE "slug" = 'apps'), 'apps', 'in-development',
    true, false, false, 5
  )
ON CONFLICT ("product_id") DO NOTHING;
