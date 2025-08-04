CREATE TABLE `resource_history` (
	`id` text PRIMARY KEY NOT NULL,
	`resource_id` text NOT NULL,
	`previous_quantity` integer NOT NULL,
	`new_quantity` integer NOT NULL,
	`change_amount` integer NOT NULL,
	`change_type` text NOT NULL,
	`updated_by` text NOT NULL,
	`reason` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE no action
);
