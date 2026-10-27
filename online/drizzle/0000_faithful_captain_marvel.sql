CREATE TABLE `grimorio_guard` (
	`id` integer PRIMARY KEY NOT NULL,
	`valid` integer NOT NULL,
	CONSTRAINT "guard_valid" CHECK("grimorio_guard"."valid" = 1)
);
--> statement-breakpoint
CREATE TABLE `grimorio_rows` (
	`dataset` text NOT NULL,
	`tn` text NOT NULL,
	`k` text NOT NULL,
	`value` text NOT NULL,
	`parent` text DEFAULT '' NOT NULL,
	`category` text DEFAULT '' NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`source` text DEFAULT '' NOT NULL,
	`edition` text DEFAULT '' NOT NULL,
	`search` text DEFAULT '' NOT NULL,
	PRIMARY KEY(`dataset`, `tn`, `k`)
);
--> statement-breakpoint
CREATE INDEX `rows_parent` ON `grimorio_rows` (`dataset`,`tn`,`parent`);--> statement-breakpoint
CREATE INDEX `rows_library` ON `grimorio_rows` (`dataset`,`tn`,`category`,`edition`,`source`);--> statement-breakpoint
CREATE TABLE `grimorio_state` (
	`id` text PRIMARY KEY NOT NULL,
	`dataset` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`owner_id` text,
	`csrf` text NOT NULL,
	`initialized` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE VIRTUAL TABLE `grimorio_fts` USING fts5(dataset UNINDEXED,id UNINDEXED,search,tokenize='unicode61 remove_diacritics 2');
