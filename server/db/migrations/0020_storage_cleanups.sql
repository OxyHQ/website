-- Object-storage deletions still owed (issue #108, F06).
--
-- Hand-written, like 0015 and 0017: the generator needs snapshots that stop at
-- 0016, and this is a plain addition with no dependency on existing rows.
--
-- A media row is deleted in the same transaction that records its objects
-- here, so a storage failure after the commit leaves a durable to-do rather
-- than an orphan nobody can find. `key` is unique: the upload key is
-- content-addressed, so the same object can be owed twice and is deleted once.
CREATE TABLE IF NOT EXISTS "storage_cleanups" (
  "_id" text PRIMARY KEY NOT NULL,
  "key" text NOT NULL,
  "reason" text NOT NULL,
  "media_id" text,
  "attempts" integer DEFAULT 0 NOT NULL,
  "last_error" text,
  "next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "storage_cleanups_key_idx" ON "storage_cleanups" USING btree ("key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "storage_cleanups_next_attempt_idx" ON "storage_cleanups" USING btree ("next_attempt_at");
