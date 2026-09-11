-- The public status board must include every product currently declared live,
-- and its critical AI rows must probe backend readiness rather than a landing
-- page. Functional alarms are combined by the status API; these URLs remain
-- the independent reachability half of each decision.
UPDATE "products"
SET "health_url" = CASE "product_id"
  WHEN 'alia' THEN 'https://api.alia.onl/health/ready'
  WHEN 'kaana' THEN 'https://kaana.ai/livez'
  WHEN 'codea' THEN NULL
  WHEN 'oxy-ai' THEN NULL
  WHEN 'tnp' THEN NULL
  ELSE "health_url"
END,
"show_on_status" = true,
"updated_at" = now()
WHERE "product_id" IN ('alia', 'kaana', 'codea', 'faircoin-wallet', 'oxy-ai', 'tnp');

INSERT INTO "products" (
  "_id", "product_id", "name", "tagline", "description", "href", "health_url",
  "external", "cta", "brand", "mark", "category", "section", "lifecycle",
  "show_on_products", "show_on_status", "show_in_nav", "order"
)
VALUES
  ('525e73975ff54373b46964f3', 'allo', 'Allo', 'Private communication', 'Messaging and calling across the Oxy ecosystem.', 'https://allo.you', 'https://api.allo.you/api/health', true, 'Open Allo', '#2563eb', 'A', (SELECT "_id" FROM "categories" WHERE "slug" = 'social-communication'), 'social-communication', 'live', true, true, true, 2),
  ('94a162a5143d4b37b652388c', 'noted', 'Noted', 'Notes that stay yours', 'A private notes workspace with real-time collaboration.', 'https://noted.oxy.so', 'https://api.noted.oxy.so/health/ready', true, 'Open Noted', '#7c3aed', 'N', (SELECT "_id" FROM "categories" WHERE "slug" = 'apps'), 'apps', 'live', true, true, true, 4),
  ('58e99b7168694585b628c43e', 'moovo', 'Moovo', 'Move together', 'Mobility and transport services for Oxy communities.', 'https://moovo.now', 'https://api.moovo.now/health/ready', true, 'Open Moovo', '#0d9488', 'M', (SELECT "_id" FROM "categories" WHERE "slug" = 'apps'), 'apps', 'live', true, true, true, 5)
ON CONFLICT ("product_id") DO UPDATE SET
  "health_url" = EXCLUDED."health_url",
  "show_on_status" = true,
  "updated_at" = now();

UPDATE "products"
SET "health_url" = CASE "product_id"
  WHEN 'nilo' THEN 'https://api.nilo.so/health/ready'
  WHEN 'peable' THEN NULL
  WHEN 'crowdsource' THEN 'https://api.crowdsource.oxy.so/health/ready'
  WHEN 'clarity' THEN 'https://api.clarity.surf/health/ready'
  WHEN 'syra' THEN NULL
  WHEN 'mercaria' THEN 'https://api.mercaria.co/health/ready'
  WHEN 'astro' THEN NULL
  WHEN 'codex-extension' THEN NULL
  ELSE "health_url"
END,
"show_on_status" = true,
"updated_at" = now()
WHERE "product_id" IN ('nilo', 'peable', 'crowdsource', 'clarity', 'syra', 'mercaria', 'astro', 'codex-extension');

-- Fail the deployment instead of silently publishing an incomplete board when
-- an older database is missing a row this migration expected to update.
DO $$
DECLARE
  missing_ids text[];
BEGIN
  WITH expected(product_id) AS (
    VALUES
      ('alia'), ('mention'), ('allo'), ('inbox'), ('faircoin'),
      ('faircoin-bridge'), ('faircoin-buy'), ('faircoin-wallet'), ('peable'),
      ('faircoin-explorer'), ('homiio'), ('nilo'), ('noted'), ('moovo'),
      ('clarity'), ('kaana'), ('codea'), ('oxyos'), ('oxy-ai'), ('oxy-api'),
      ('website-api'), ('accounts'), ('tnp'), ('astro'), ('codex-extension'),
      ('syra'), ('mercaria'), ('crowdsource')
  )
  SELECT array_agg(expected.product_id ORDER BY expected.product_id)
  INTO missing_ids
  FROM expected
  LEFT JOIN "products"
    ON "products"."product_id" = expected.product_id
   AND "products"."show_on_status" = true
  WHERE "products"."product_id" IS NULL;

  IF missing_ids IS NOT NULL THEN
    RAISE EXCEPTION 'public status inventory is incomplete: %', missing_ids;
  END IF;
END $$;
