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
CREATE TABLE `resource_history` (
	`id` text PRIMARY KEY NOT NULL,
	`resource_id` text NOT NULL,
	`previous_quantity_hagga` integer NOT NULL,
	`new_quantity_hagga` integer NOT NULL,
	`change_amount_hagga` integer NOT NULL,
	`previous_quantity_deep_desert` integer NOT NULL,
	`new_quantity_deep_desert` integer NOT NULL,
	`change_amount_deep_desert` integer NOT NULL,
	`change_type` text NOT NULL,
	`updated_by` text NOT NULL,
	`reason` text,
	`created_at` integer NOT NULL,
	`transfer_amount` integer,
	`transfer_direction` text,
	FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `resources` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`quantity_hagga` integer DEFAULT 0 NOT NULL,
	`quantity_deep_desert` integer DEFAULT 0 NOT NULL,
	`description` text,
	`category` text,
	`icon` text,
	`image_url` text,
	`status` text,
	`target_quantity` integer,
	`multiplier` real DEFAULT 1 NOT NULL,
	`is_priority` integer DEFAULT false NOT NULL,
	`last_updated_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`roles` text NOT NULL,
	`is_in_guild` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`discord_id` text NOT NULL,
	`username` text NOT NULL,
	`avatar` text,
	`custom_nickname` text,
	`created_at` integer NOT NULL,
	`last_login` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_discord_id_unique` ON `users` (`discord_id`);