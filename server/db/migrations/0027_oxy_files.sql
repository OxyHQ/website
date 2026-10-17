CREATE TABLE "media_storage_migrations" (
	"_id" text PRIMARY KEY NOT NULL,
	"media_id" text NOT NULL,
	"legacy_key" text NOT NULL,
	"legacy_url" text NOT NULL,
	"legacy_thumbnails" jsonb NOT NULL,
	"status" text NOT NULL,
	"legacy_sha256" text,
	"oxy_sha256" text,
	"oxy_file_id" text,
	"error" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"migrated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oxy_file_events" (
	"_id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"type" text NOT NULL,
	"file_id" text NOT NULL,
	"file_status" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"references" jsonb NOT NULL,
	"action" text NOT NULL,
	"media_ids" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oxy_file_reconciliations" (
	"_id" text PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"dry_run" boolean NOT NULL,
	"status" text NOT NULL,
	"inventory" integer,
	"added" integer,
	"removed" integer,
	"unchanged" integer,
	"refused" integer,
	"error" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oxy_file_reference_removals" (
	"_id" text PRIMARY KEY NOT NULL,
	"file_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"purge" boolean DEFAULT false NOT NULL,
	"reason" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "media" ALTER COLUMN "key" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "oxy_file_id" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "sha256" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "unavailable_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "unavailable_reason" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "file_event_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "media_storage_migrations_media_id_idx" ON "media_storage_migrations" USING btree ("media_id");--> statement-breakpoint
CREATE UNIQUE INDEX "oxy_file_events_event_id_idx" ON "oxy_file_events" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "oxy_file_events_file_id_idx" ON "oxy_file_events" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX "oxy_file_reconciliations_started_at_idx" ON "oxy_file_reconciliations" USING btree ("started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "oxy_file_reference_removals_reference_idx" ON "oxy_file_reference_removals" USING btree ("file_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "oxy_file_reference_removals_next_attempt_idx" ON "oxy_file_reference_removals" USING btree ("next_attempt_at");--> statement-breakpoint
CREATE INDEX "media_oxy_file_id_idx" ON "media" USING btree ("oxy_file_id");--> statement-breakpoint
CREATE INDEX "media_sha256_idx" ON "media" USING btree ("sha256");--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_storage_check" CHECK ("media"."oxy_file_id" is not null or "media"."key" is not null);