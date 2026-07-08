-- CreateTable TicketParticipant
CREATE TABLE `TicketParticipant` (
    `id` CHAR(36) NOT NULL,
    `ticketId` CHAR(36) NOT NULL,
    `participantId` CHAR(36) NOT NULL,
    `individualTipPercentage` DECIMAL(5, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_tp_ticket`(`ticketId`),
    INDEX `idx_tp_participant`(`participantId`),
    UNIQUE INDEX `uq_ticket_participant`(`ticketId`, `participantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable ProductAssignment
CREATE TABLE `ProductAssignment` (
    `id` CHAR(36) NOT NULL,
    `productId` CHAR(36) NOT NULL,
    `participantId` CHAR(36) NOT NULL,
    `shareRatio` DECIMAL(10, 4) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_pa_product`(`productId`),
    INDEX `idx_pa_participant`(`participantId`),
    UNIQUE INDEX `uq_product_participant`(`productId`, `participantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TicketParticipant` ADD CONSTRAINT `TicketParticipant_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `Ticket`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TicketParticipant` ADD CONSTRAINT `TicketParticipant_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `Participant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductAssignment` ADD CONSTRAINT `ProductAssignment_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductAssignment` ADD CONSTRAINT `ProductAssignment_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `Participant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
