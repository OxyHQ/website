-- Sales and private-evaluation requests from /contact/sales.
--
-- Hand-written rather than generated, for the same reason 0015 was: the
-- generator needs a live database to diff against, and this table is a plain
-- addition with no dependency on existing rows.
--
-- Numbered 0017 rather than 0016: main took that index first, and a migration
-- that has already been applied keeps its number.
--
-- `delete_after` is NOT NULL: the retention rule is a property of the row, so a
-- record cannot be written without one and a later cleanup job never has to
-- guess what an old row's policy was.
CREATE TABLE IF NOT EXISTS "sales_inquiries" (
  "_id" text PRIMARY KEY NOT NULL,
  "interest" text NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "company" text NOT NULL,
  "role" text,
  "country" text,
  "company_size" text,
  "website" text,
  "use_case" text NOT NULL,
  "monthly_volume" text,
  "budget" text,
  "modalities" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "preferred_region" text,
  "privacy_requirements" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "deployment_preference" text,
  "launch_timeline" text,
  "message" text,
  "marketing_consent" boolean DEFAULT false NOT NULL,
  "oxy_user_id" text,
  "account_id" text,
  "application_id" text,
  "status" text DEFAULT 'new' NOT NULL,
  "status_changed_by" text,
  "status_changed_at" timestamp with time zone,
  "internal_note" text,
  "idempotency_key" text NOT NULL,
  "delete_after" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "sales_inquiries_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "sales_inquiries_idempotency_idx"
  ON "sales_inquiries" USING btree ("idempotency_key");
--> statement-breakpoint
-- The admin list is ordered newest-first and filtered by status; both columns
-- are in the index so the common query does not fall back to a sequential scan
-- once the table has a year of rows in it.
CREATE INDEX IF NOT EXISTS "sales_inquiries_status_created_idx"
  ON "sales_inquiries" USING btree ("status", "created_at" DESC);
--> statement-breakpoint
-- Retention sweeps read this directly.
CREATE INDEX IF NOT EXISTS "sales_inquiries_delete_after_idx"
  ON "sales_inquiries" USING btree ("delete_after");
