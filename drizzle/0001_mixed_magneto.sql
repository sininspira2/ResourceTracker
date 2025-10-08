CREATE TABLE `global_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`setting_key` text NOT NULL,
	`setting_value` text,
	`description` text,
	`created_at` integer NOT NULL,
	`last_updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `global_settings_setting_key_unique` ON `global_settings` (`setting_key`);--> statement-breakpoint
ALTER TABLE `resources` ADD `tier` integer;--> statement-breakpoint
ALTER TABLE `resources` ADD `subcategory` text;