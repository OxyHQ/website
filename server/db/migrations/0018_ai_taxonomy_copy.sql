-- Bring the CMS-owned AI copy in line with the published taxonomy.
--
-- The seed is only read when a database is empty, so production still holds the
-- rows that described Oxy AI as "Open models you can inspect, fine-tune and
-- self-host" and listed the umbrella beside its own members in the apps
-- catalogue. Those are the claims OxyHQ/website#64 exists to retire, and leaving
-- them in the database means the site keeps making them from the CMS even after
-- the code stops.
--
-- Every statement is GUARDED on the old text. An editor who has already
-- rewritten one of these rows keeps their wording; this only replaces the
-- original seed copy.

-- Oxy AI is the umbrella, not an app beside Alia and Codea.
UPDATE "products"
SET
  "tagline" = 'The platform behind Oxy''s AI',
  "description" = 'The umbrella for Oxy''s AI platform, products and services: Oxy Inference, managed and dedicated serving, and the products built on them.',
  "show_on_products" = false,
  "updated_at" = now()
WHERE "product_id" = 'oxy-ai'
  AND "description" LIKE '%inspect, fine-tune and self-host%';
--> statement-breakpoint

-- Alia is a product built on the platform, not the platform.
UPDATE "products"
SET
  "name" = 'Alia',
  "tagline" = 'The Oxy assistant for people and teams',
  "description" = 'The assistant for people and teams, on web, iOS and Android. A product built on Oxy AI, with its own plans — it is not the inference API.',
  "updated_at" = now()
WHERE "product_id" = 'alia'
  AND "description" LIKE '%without your data feeding a training set%';
--> statement-breakpoint

-- The Platform dropdown's one-line description of Oxy AI. `items` is jsonb, so
-- the rewrite happens over the array and the element is replaced whole; a
-- targeted `jsonb_set` would need the index, which differs per row.
UPDATE "navigation_dropdowns"
SET
  "items" = (
    SELECT jsonb_agg(
      CASE
        WHEN item->>'title' = 'Oxy AI' AND item->>'description' = 'Private models, API and SDKs'
          THEN jsonb_set(item, '{description}', '"Models, inference and the products built on them"')
        ELSE item
      END
      ORDER BY ordinality
    )
    FROM jsonb_array_elements("navigation_dropdowns"."items") WITH ORDINALITY AS elements(item, ordinality)
  ),
  "updated_at" = now()
WHERE "items" @> '[{"title": "Oxy AI", "description": "Private models, API and SDKs"}]'::jsonb;
