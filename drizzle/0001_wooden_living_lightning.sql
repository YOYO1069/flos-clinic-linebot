CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int NOT NULL,
	`lineGroupId` varchar(100) NOT NULL,
	`lineUserId` varchar(100),
	`name` varchar(100) NOT NULL,
	`date` varchar(20) NOT NULL,
	`time` varchar(20) NOT NULL,
	`service` text NOT NULL,
	`status` enum('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clinics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`lineChannelId` varchar(100) NOT NULL,
	`lineChannelSecret` varchar(100) NOT NULL,
	`lineChannelAccessToken` text NOT NULL,
	`webhookUrl` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clinics_id` PRIMARY KEY(`id`),
	CONSTRAINT `clinics_lineChannelId_unique` UNIQUE(`lineChannelId`)
);
--> statement-breakpoint
CREATE TABLE `lineGroupStates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lineGroupId` varchar(100) NOT NULL,
	`clinicId` int NOT NULL,
	`bookingMode` varchar(20),
	`tempData` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lineGroupStates_id` PRIMARY KEY(`id`),
	CONSTRAINT `lineGroupStates_lineGroupId_unique` UNIQUE(`lineGroupId`)
);
