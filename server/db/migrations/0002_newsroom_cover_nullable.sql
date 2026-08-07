ALTER TABLE "newsroom_posts" DROP CONSTRAINT "newsroom_posts_cover_image_media__id_fk";
--> statement-breakpoint
ALTER TABLE "newsroom_posts" ALTER COLUMN "cover_image" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "newsroom_posts" ADD CONSTRAINT "newsroom_posts_cover_image_media__id_fk" FOREIGN KEY ("cover_image") REFERENCES "public"."media"("_id") ON DELETE set null ON UPDATE no action;