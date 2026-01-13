ALTER TABLE `analyses` ADD `primaryManualId` int;--> statement-breakpoint
ALTER TABLE `analyses` ADD `primaryManualCustom` json;--> statement-breakpoint
ALTER TABLE `analyses` ADD `alternativeManuals` json;