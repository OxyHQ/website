-- The FairCoin dashboard moved out of the hero carousel into its own home
-- section, so the `faircoin` face type no longer renders. A stored slot that
-- names it leaves an 800×400 hole in the row rather than an error, so the
-- stored hero is the thing that has to change.
UPDATE "hero_contents"
SET "carousel_slots" = COALESCE(
  (
    SELECT jsonb_agg(slot ORDER BY ord)
    FROM jsonb_array_elements("carousel_slots") WITH ORDINALITY AS t(slot, ord)
    WHERE NOT (slot -> 'faces' @> '[{"type": "faircoin"}]'::jsonb)
  ),
  '[]'::jsonb
)
WHERE "carousel_slots" @> '[{"faces": [{"type": "faircoin"}]}]'::jsonb;
