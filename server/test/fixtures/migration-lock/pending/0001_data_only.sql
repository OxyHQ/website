-- A data-only migration with no guard of its own, like a seed: it is safe only
-- if it runs exactly once. The sleep holds its transaction open long enough that
-- two unlocked runners would both be inside it at the same time.
INSERT INTO "lock_test_runs" DEFAULT VALUES;
--> statement-breakpoint
SELECT pg_sleep(1);
