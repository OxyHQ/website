CREATE TABLE "faircoin_applications" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_name" text NOT NULL,
	"website" text NOT NULL,
	"contact_name" text NOT NULL,
	"contact_email" text NOT NULL,
	"offering" text NOT NULL,
	"needs" text NOT NULL,
	"capacity" text NOT NULL,
	"availability" text NOT NULL,
	"modality" text NOT NULL,
	"location" text NOT NULL,
	"conditions" text NOT NULL,
	"contact_consent_at" timestamp with time zone NOT NULL,
	"updates_consent" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'submitted' NOT NULL,
	"status_changed_by" text,
	"status_changed_at" timestamp with time zone,
	"internal_note" text,
	"key_hash" text NOT NULL,
	"request_hash" text NOT NULL,
	"delete_after" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "faircoin_applications_key_idx" ON "faircoin_applications" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "faircoin_applications_expiry_idx" ON "faircoin_applications" USING btree ("delete_after");--> statement-breakpoint
CREATE INDEX "faircoin_applications_status_idx" ON "faircoin_applications" USING btree ("status","_id");