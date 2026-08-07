CREATE TABLE "categories" (
	"_id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"scope" text DEFAULT 'generic' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "changelog_entries" (
	"_id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"items" text[] DEFAULT '{}' NOT NULL,
	"media" text,
	"github_release_id" double precision,
	"repo_owner" text,
	"repo_name" text,
	"repo_display_name" text,
	"html_url" text,
	"tag_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "changelog_entries_githubReleaseId_unique" UNIQUE("github_release_id")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"_id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"cover_image" text,
	"category" text,
	"level" text DEFAULT 'beginner' NOT NULL,
	"duration_minutes" integer,
	"lessons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "courses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "help_articles" (
	"_id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"category" text,
	"icon" text DEFAULT '' NOT NULL,
	"cover_image" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "help_articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"_id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"subtitle" text DEFAULT '' NOT NULL,
	"department" text NOT NULL,
	"location" text DEFAULT 'Remote' NOT NULL,
	"type" text DEFAULT 'Full-time' NOT NULL,
	"compensation" text DEFAULT '' NOT NULL,
	"description" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jobs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "locales" (
	"_id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"slug" text,
	"name" text NOT NULL,
	"native_name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "locales_code_unique" UNIQUE("code"),
	CONSTRAINT "locales_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "media" (
	"_id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"thumbnails" jsonb DEFAULT '{"sm":"","md":"","lg":""}'::jsonb NOT NULL,
	"filename" text NOT NULL,
	"key" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer DEFAULT 0 NOT NULL,
	"width" integer,
	"height" integer,
	"alt" text DEFAULT '' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"folder" text DEFAULT 'images' NOT NULL,
	"uploaded_by" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsroom_posts" (
	"_id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"resume" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"cover_image" text NOT NULL,
	"image_alt" text,
	"oxy_user_id" text,
	"author_username" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"categories" text[] DEFAULT '{}' NOT NULL,
	"products" text[] DEFAULT '{}' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"color_primary" text,
	"color_secondary" text,
	"dark" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"meta_title" text,
	"og_image" text,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "newsroom_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"_id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"prompt_phrases" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "pricing_plans" (
	"_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"price" jsonb NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"features" text[] DEFAULT '{}' NOT NULL,
	"cta" text DEFAULT 'Get started' NOT NULL,
	"highlighted" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"_id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"name" text NOT NULL,
	"tagline" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"href" text NOT NULL,
	"landing_url" text,
	"health_url" text,
	"external" boolean DEFAULT false NOT NULL,
	"cta" text DEFAULT 'Learn more' NOT NULL,
	"brand" text NOT NULL,
	"brand_foreground" text,
	"mark" text NOT NULL,
	"logo" text,
	"category" text,
	"section" text DEFAULT 'apps' NOT NULL,
	"lifecycle" text DEFAULT 'live' NOT NULL,
	"show_on_products" boolean DEFAULT true NOT NULL,
	"show_on_status" boolean DEFAULT true NOT NULL,
	"show_in_nav" boolean DEFAULT true NOT NULL,
	"nav_opens_app" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_productId_unique" UNIQUE("product_id")
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"_id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"type" text DEFAULT 'guide' NOT NULL,
	"cover_image" text,
	"category" text,
	"href" text NOT NULL,
	"external" boolean DEFAULT false NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resources_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "seo_entries" (
	"_id" text PRIMARY KEY NOT NULL,
	"brand" text NOT NULL,
	"path" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"og_image" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"role" text NOT NULL,
	"department" text DEFAULT '' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"avatar" text,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"socials" jsonb DEFAULT '{"linkedin":"","twitter":"","github":"","website":""}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_members_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"_id" text PRIMARY KEY NOT NULL,
	"quote" text NOT NULL,
	"author" text NOT NULL,
	"role" text DEFAULT '' NOT NULL,
	"company" text DEFAULT '' NOT NULL,
	"avatar" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "translations" (
	"_id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"collection_name" text NOT NULL,
	"document_id" text NOT NULL,
	"fields" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"_id" text PRIMARY KEY NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"parent_id" text,
	"user_id" text NOT NULL,
	"username" text NOT NULL,
	"body" text NOT NULL,
	"status" text DEFAULT 'visible' NOT NULL,
	"edited_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_proposals" (
	"_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"username" text NOT NULL,
	"owner" text NOT NULL,
	"repo" text NOT NULL,
	"issue_number" integer NOT NULL,
	"issue_url" text NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "footers" (
	"_id" text PRIMARY KEY NOT NULL,
	"columns" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"social_links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"copyright" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hero_contents" (
	"_id" text PRIMARY KEY NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"eyebrow" text DEFAULT '' NOT NULL,
	"background_video_webm" jsonb,
	"background_video_mp4" jsonb,
	"background_poster" jsonb,
	"carousel_slots" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"_id" text PRIMARY KEY NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"user_id" text NOT NULL,
	"username" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_tokens" (
	"_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"token_hash" text NOT NULL,
	"created_by" text NOT NULL,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"revoked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mcp_tokens_tokenHash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "navigation_dropdowns" (
	"_id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"kind" text DEFAULT 'manual' NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"side_panel" jsonb,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"_id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"type" text DEFAULT 'user' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"oxy_user_id" text,
	"commission_percent" integer,
	"custom_landing_url" text,
	"notes" text,
	"clicks" integer DEFAULT 0 NOT NULL,
	"signups" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referrals_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"_id" text PRIMARY KEY NOT NULL,
	"site_title" text DEFAULT 'Oxy' NOT NULL,
	"site_description" text DEFAULT '' NOT NULL,
	"og_image" text,
	"banner" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracked_repos" (
	"_id" text PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"repo" text NOT NULL,
	"display_name" text NOT NULL,
	"default_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_sync_at" timestamp with time zone,
	"last_sync_error" text,
	"active" boolean DEFAULT true NOT NULL,
	"feature_board" boolean DEFAULT false NOT NULL,
	"accepts_proposals" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_badges" (
	"_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"username" text NOT NULL,
	"badge_id" text NOT NULL,
	"awarded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"awarded_by" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profile_extras" (
	"_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"username" text NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"show_activity" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_profile_extras_userId_unique" UNIQUE("user_id"),
	CONSTRAINT "user_profile_extras_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"_id" text PRIMARY KEY NOT NULL,
	"feature_request_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "changelog_entries" ADD CONSTRAINT "changelog_entries_media_media__id_fk" FOREIGN KEY ("media") REFERENCES "public"."media"("_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_cover_image_media__id_fk" FOREIGN KEY ("cover_image") REFERENCES "public"."media"("_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_category_categories__id_fk" FOREIGN KEY ("category") REFERENCES "public"."categories"("_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_articles" ADD CONSTRAINT "help_articles_category_categories__id_fk" FOREIGN KEY ("category") REFERENCES "public"."categories"("_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_articles" ADD CONSTRAINT "help_articles_cover_image_media__id_fk" FOREIGN KEY ("cover_image") REFERENCES "public"."media"("_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsroom_posts" ADD CONSTRAINT "newsroom_posts_cover_image_media__id_fk" FOREIGN KEY ("cover_image") REFERENCES "public"."media"("_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsroom_posts" ADD CONSTRAINT "newsroom_posts_og_image_media__id_fk" FOREIGN KEY ("og_image") REFERENCES "public"."media"("_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_logo_media__id_fk" FOREIGN KEY ("logo") REFERENCES "public"."media"("_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_categories__id_fk" FOREIGN KEY ("category") REFERENCES "public"."categories"("_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_cover_image_media__id_fk" FOREIGN KEY ("cover_image") REFERENCES "public"."media"("_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_category_categories__id_fk" FOREIGN KEY ("category") REFERENCES "public"."categories"("_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_avatar_media__id_fk" FOREIGN KEY ("avatar") REFERENCES "public"."media"("_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_og_image_media__id_fk" FOREIGN KEY ("og_image") REFERENCES "public"."media"("_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "courses_level_idx" ON "courses" USING btree ("level");--> statement-breakpoint
CREATE INDEX "courses_status_idx" ON "courses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "courses_featured_idx" ON "courses" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "help_articles_status_idx" ON "help_articles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "help_articles_featured_idx" ON "help_articles" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "help_articles_order_idx" ON "help_articles" USING btree ("order");--> statement-breakpoint
CREATE INDEX "newsroom_posts_status_idx" ON "newsroom_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "products_lifecycle_section_order_idx" ON "products" USING btree ("lifecycle","section","order");--> statement-breakpoint
CREATE INDEX "products_show_on_status_idx" ON "products" USING btree ("show_on_status");--> statement-breakpoint
CREATE INDEX "products_show_in_nav_idx" ON "products" USING btree ("show_in_nav");--> statement-breakpoint
CREATE INDEX "resources_type_idx" ON "resources" USING btree ("type");--> statement-breakpoint
CREATE INDEX "resources_status_idx" ON "resources" USING btree ("status");--> statement-breakpoint
CREATE INDEX "resources_featured_idx" ON "resources" USING btree ("featured");--> statement-breakpoint
CREATE UNIQUE INDEX "seo_entries_brand_path_idx" ON "seo_entries" USING btree ("brand","path");--> statement-breakpoint
CREATE UNIQUE INDEX "translations_locale_collection_doc_idx" ON "translations" USING btree ("locale","collection_name","document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "likes_target_user_idx" ON "likes" USING btree ("target_type","target_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tracked_repos_owner_repo_idx" ON "tracked_repos" USING btree ("owner","repo");--> statement-breakpoint
CREATE UNIQUE INDEX "user_badges_user_badge_idx" ON "user_badges" USING btree ("user_id","badge_id");--> statement-breakpoint
CREATE UNIQUE INDEX "votes_feature_user_idx" ON "votes" USING btree ("feature_request_id","user_id");