ALTER TABLE "pools" ADD COLUMN "winner_entry_id" uuid;--> statement-breakpoint
ALTER TABLE "pools" ADD COLUMN "winner_name" text;--> statement-breakpoint
ALTER TABLE "pools" ADD COLUMN "completed_at" timestamp;