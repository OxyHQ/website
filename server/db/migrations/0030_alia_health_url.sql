-- Alia's backend answers at api.gemies.ai (Gemies ADR 0034): api.alia.onl is
-- the same service under the host being retired. Repoint only a row still
-- naming the retired host, so a CMS edit made since is kept, and a rerun
-- changes nothing.
UPDATE "products"
SET "health_url" = 'https://api.gemies.ai/health/ready', "updated_at" = now()
WHERE "product_id" = 'alia'
  AND "health_url" ~* '^https?://api\.alia\.onl(/|$)';
