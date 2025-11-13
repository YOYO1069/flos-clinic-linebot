CREATE TABLE `authorizationCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`clinicId` int NOT NULL,
	`status` enum('active','used','expired') NOT NULL DEFAULT 'active',
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `authorizationCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `authorizationCodes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `authorizedGroups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lineGroupId` varchar(100) NOT NULL,
	`clinicId` int NOT NULL,
	`authorizationCode` varchar(50) NOT NULL,
	`authorizedAt` timestamp NOT NULL DEFAULT (now()),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `authorizedGroups_id` PRIMARY KEY(`id`),
	CONSTRAINT `authorizedGroups_lineGroupId_unique` UNIQUE(`lineGroupId`)
);
