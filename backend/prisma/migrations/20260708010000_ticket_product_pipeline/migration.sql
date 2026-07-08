-- AlterTable Ticket: expand columns for full MDD §3 + pipeline metadata
ALTER TABLE `Ticket`
  ADD COLUMN `subtotal` DECIMAL(10, 2) NULL,
  ADD COLUMN `tax` DECIMAL(10, 2) NULL,
  ADD COLUMN `discount` DECIMAL(10, 2) NULL DEFAULT 0,
  ADD COLUMN `total` DECIMAL(10, 2) NULL,
  ADD COLUMN `tipMode` VARCHAR(20) NOT NULL DEFAULT 'GLOBAL',
  ADD COLUMN `globalTipPercentage` DECIMAL(5, 2) NULL,
  ADD COLUMN `rawOcrText` TEXT NULL,
  ADD COLUMN `failureReason` VARCHAR(500) NULL,
  ADD INDEX `idx_ticket_created`(`createdAt`),
  ADD INDEX `idx_ticket_status`(`processingStatus`);

-- CreateTable
CREATE TABLE `Product` (
    `id` CHAR(36) NOT NULL,
    `ticketId` CHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `unitPrice` DECIMAL(10, 2) NOT NULL,
    `detectedByAI` BOOLEAN NOT NULL DEFAULT false,
    `confidenceScore` DECIMAL(5, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_product_ticket`(`ticketId`),
    INDEX `idx_product_name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `Ticket`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
