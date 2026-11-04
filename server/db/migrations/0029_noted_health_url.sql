-- api.noted.oxy.so is retired (oxy-infra#311): Noted's notes are served by
-- Nilo's API, so Noted's health is Nilo's readiness. Repoint only a row still
-- naming the retired host, so a CMS edit made since is kept, and a rerun
-- changes nothing.
UPDATE "products"
SET "health_url" = 'https://api.nilo.so/health/ready', "updated_at" = now()
WHERE "product_id" = 'noted'
  AND "health_url" ~* '^https?://api\.noted\.oxy\.so(/|$)';
