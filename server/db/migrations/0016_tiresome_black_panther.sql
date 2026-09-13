CREATE TABLE "incidents" (
	"_id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"severity" text DEFAULT 'minor' NOT NULL,
	"status" text DEFAULT 'investigating' NOT NULL,
	"products" text[] DEFAULT '{}' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"updates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_uptime_daily" (
	"_id" text PRIMARY KEY NOT NULL,
	"product" text NOT NULL,
	"date" text NOT NULL,
	"total_checks" integer DEFAULT 0 NOT NULL,
	"operational_checks" integer DEFAULT 0 NOT NULL,
	"degraded_checks" integer DEFAULT 0 NOT NULL,
	"down_checks" integer DEFAULT 0 NOT NULL,
	"unknown_checks" integer DEFAULT 0 NOT NULL,
	"avg_latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "service_uptime_daily" ADD CONSTRAINT "service_uptime_daily_product_products__id_fk" FOREIGN KEY ("product") REFERENCES "public"."products"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "incidents_started_at_id_idx" ON "incidents" USING btree ("started_at" DESC NULLS LAST,"_id");--> statement-breakpoint
CREATE INDEX "incidents_status_idx" ON "incidents" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "service_uptime_daily_product_date_idx" ON "service_uptime_daily" USING btree ("product","date");--> statement-breakpoint
CREATE INDEX "service_uptime_daily_date_idx" ON "service_uptime_daily" USING btree ("date");