-- AlterTable
ALTER TABLE `Ticket` ADD COLUMN `finalizedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `idx_ticket_finalized` ON `Ticket`(`finalizedAt`);
