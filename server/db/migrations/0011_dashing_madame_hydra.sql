ALTER TABLE "newsroom_posts" ADD COLUMN "theme_preset" text DEFAULT 'oxy' NOT NULL;

-- Give existing posts a stable Bloom recipe instead of leaving every legacy
-- row on the default. The order is deterministic and remains tied to the
-- newsroom's published ordering when this migration is applied.
WITH ranked AS (
  SELECT "_id", row_number() OVER (ORDER BY "published_at" DESC, "_id" ASC) AS position
  FROM "newsroom_posts"
), recipes AS (
  SELECT ARRAY[
    'teal', 'blue', 'green', 'yellow', 'red', 'purple', 'pink', 'sky', 'orange',
    'mint', 'faircoin', 'pumpkin', 'gray', 'brown', 'peach', 'rose', 'mono',
    'grove', 'ember', 'merlot', 'cobalt', 'jade', 'pine', 'olive', 'lagoon',
    'navy', 'azure', 'violet', 'lavender', 'plum', 'cherry', 'chocolate',
    'graphite', 'oxy'
  ]::text[] AS presets
)
UPDATE "newsroom_posts" AS post
SET "theme_preset" = recipes.presets[((ranked.position - 1) % cardinality(recipes.presets)) + 1]
FROM ranked
CROSS JOIN recipes
WHERE post."_id" = ranked."_id";
