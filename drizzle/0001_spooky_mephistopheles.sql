CREATE TABLE `global_settings` (
	`setting_key` text PRIMARY KEY NOT NULL,
	`setting_value` text,
	`description` text,
	`created_at` integer NOT NULL,
	`last_updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `resources` ADD `subcategory` text;--> statement-breakpoint
ALTER TABLE `resources` ADD `tier` integer;