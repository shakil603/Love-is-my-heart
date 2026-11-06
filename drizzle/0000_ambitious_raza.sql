CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"blocker_id" text NOT NULL,
	"blocked_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_user_id" text NOT NULL,
	"to_user_id" text NOT NULL,
	"action" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" text PRIMARY KEY NOT NULL,
	"user_a_id" text NOT NULL,
	"user_b_id" text NOT NULL,
	"origin" text DEFAULT 'discovery' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"age" integer NOT NULL,
	"gender" text DEFAULT 'Prefer not to say' NOT NULL,
	"city" text DEFAULT 'London' NOT NULL,
	"area" text DEFAULT '' NOT NULL,
	"lat" real DEFAULT 51.5072 NOT NULL,
	"lng" real DEFAULT -0.1276 NOT NULL,
	"occupation" text DEFAULT '' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"photo" text DEFAULT '' NOT NULL,
	"photo_alt" text DEFAULT '' NOT NULL,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"interests" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"languages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"looking_for" text DEFAULT 'Long-term relationship' NOT NULL,
	"prompt_question" text DEFAULT 'We will get along if' NOT NULL,
	"prompt_answer" text DEFAULT '' NOT NULL,
	"ideal_sunday" text DEFAULT '' NOT NULL,
	"height" text DEFAULT '' NOT NULL,
	"education" text DEFAULT '' NOT NULL,
	"drinking" text DEFAULT 'Socially' NOT NULL,
	"smoking" text DEFAULT 'Never' NOT NULL,
	"workout" text DEFAULT '' NOT NULL,
	"anthem" text DEFAULT '' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"onboarding_complete" boolean DEFAULT false NOT NULL,
	"show_online" boolean DEFAULT true NOT NULL,
	"read_receipts" boolean DEFAULT true NOT NULL,
	"notifications" boolean DEFAULT true NOT NULL,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"body" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"min_age" integer DEFAULT 24 NOT NULL,
	"max_age" integer DEFAULT 36 NOT NULL,
	"max_distance" integer DEFAULT 25 NOT NULL,
	"looking_for" text DEFAULT 'Any intention' NOT NULL,
	"interests" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verified_only" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporter_id" text NOT NULL,
	"reported_id" text NOT NULL,
	"reason" text NOT NULL,
	"details" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocker_id_user_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocked_id_user_id_fk" FOREIGN KEY ("blocked_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_from_user_id_user_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_to_user_id_user_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_user_a_id_user_id_fk" FOREIGN KEY ("user_a_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_user_b_id_user_id_fk" FOREIGN KEY ("user_b_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_id_user_id_fk" FOREIGN KEY ("reported_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "block_pair_idx" ON "blocks" USING btree ("blocker_id","blocked_id");--> statement-breakpoint
CREATE UNIQUE INDEX "interaction_pair_idx" ON "interactions" USING btree ("from_user_id","to_user_id");--> statement-breakpoint
CREATE INDEX "interaction_to_idx" ON "interactions" USING btree ("to_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "match_pair_idx" ON "matches" USING btree ("user_a_id","user_b_id");--> statement-breakpoint
CREATE INDEX "match_user_a_idx" ON "matches" USING btree ("user_a_id");--> statement-breakpoint
CREATE INDEX "match_user_b_idx" ON "matches" USING btree ("user_b_id");--> statement-breakpoint
CREATE INDEX "message_match_idx" ON "messages" USING btree ("match_id","id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");