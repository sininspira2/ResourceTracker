CREATE TABLE `leaderboard` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`resource_id` text NOT NULL,
	`action_type` text NOT NULL,
	`quantity_changed` integer NOT NULL,
	`base_points` real NOT NULL,
	`resource_multiplier` real NOT NULL,
	`status_bonus` real NOT NULL,
	`final_points` real NOT NULL,
	`resource_name` text NOT NULL,
	`resource_category` text NOT NULL,
	`resource_status` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE resources ADD `multiplier` real DEFAULT 1 NOT NULL;