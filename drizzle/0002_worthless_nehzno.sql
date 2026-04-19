ALTER TABLE `resource_history` ADD `previous_quantity_location_1` integer;--> statement-breakpoint
ALTER TABLE `resource_history` ADD `new_quantity_location_1` integer;--> statement-breakpoint
ALTER TABLE `resource_history` ADD `change_amount_location_1` integer;--> statement-breakpoint
ALTER TABLE `resource_history` ADD `previous_quantity_location_2` integer;--> statement-breakpoint
ALTER TABLE `resource_history` ADD `new_quantity_location_2` integer;--> statement-breakpoint
ALTER TABLE `resource_history` ADD `change_amount_location_2` integer;--> statement-breakpoint
ALTER TABLE `resources` ADD `quantity_location_1` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `resources` ADD `quantity_location_2` integer DEFAULT 0 NOT NULL;