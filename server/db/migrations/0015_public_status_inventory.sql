-- The public status board must include every product currently declared live,
-- and its critical AI rows must probe backend readiness rather than a landing
-- page. Functional alarms are combined by the status API; these URLs remain
-- the independent reachability half of each decision.
UPDATE "products"
SET "health_url" = CASE "product_id"
  WHEN 'alia' THEN 'https://api.alia.onl/health/ready'
  WHEN 'kaana' THEN 'https://kaana.ai/livez'
  WHEN 'codea' THEN 'https://oxy.so/codea'
  WHEN 'oxy-ai' THEN 'https://oxy.so/ai'
  WHEN 'tnp' THEN 'https://oxy.so/tnp'
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
  ('525e73975ff54373b46964f3', 'allo', 'Allo', 'Private communication', 'Messaging and calling across the Oxy ecosystem.', 'https://allo.you', 'https://api.allo.you/', true, 'Open Allo', '#2563eb', 'A', (SELECT "_id" FROM "categories" WHERE "slug" = 'social-communication'), 'social-communication', 'live', true, true, true, 2),
  ('94a162a5143d4b37b652388c', 'noted', 'Noted', 'Notes that stay yours', 'A private notes workspace with real-time collaboration.', 'https://noted.oxy.so', 'https://api.noted.oxy.so/health', true, 'Open Noted', '#7c3aed', 'N', (SELECT "_id" FROM "categories" WHERE "slug" = 'apps'), 'apps', 'live', true, true, true, 4),
  ('58e99b7168694585b628c43e', 'moovo', 'Moovo', 'Move together', 'Mobility and transport services for Oxy communities.', 'https://moovo.now', 'https://api.moovo.now/health/ready', true, 'Open Moovo', '#0d9488', 'M', (SELECT "_id" FROM "categories" WHERE "slug" = 'apps'), 'apps', 'live', true, true, true, 5)
ON CONFLICT ("product_id") DO UPDATE SET
  "health_url" = EXCLUDED."health_url",
  "show_on_status" = true,
  "updated_at" = now();

UPDATE "products"
SET "health_url" = CASE "product_id"
  WHEN 'nilo' THEN 'https://api.nilo.so/health/ready'
  WHEN 'peable' THEN 'https://api.peable.to/health'
  WHEN 'crowdsource' THEN 'https://api.crowdsource.oxy.so/health/ready'
  WHEN 'clarity' THEN 'https://api.clarity.surf/health/ready'
  WHEN 'syra' THEN 'https://api.syra.fm/'
  WHEN 'mercaria' THEN 'https://api.mercaria.co/health'
  WHEN 'astro' THEN 'https://oxy.so/astro'
  WHEN 'codex-extension' THEN 'https://oxy.so/codea/extension'
  ELSE "health_url"
END,
"show_on_status" = true,
"updated_at" = now()
WHERE "product_id" IN ('nilo', 'peable', 'crowdsource', 'clarity', 'syra', 'mercaria', 'astro', 'codex-extension');
