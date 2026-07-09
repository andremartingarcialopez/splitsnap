-- SplitSnap v2 Fase 1: sesión colaborativa (campos nuevos, compatibles con datos existentes)

ALTER TABLE `Ticket`
  ADD COLUMN `sessionStatus` VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN `shareCode` VARCHAR(16) NULL,
  ADD COLUMN `expectedParticipantCount` INT NULL,
  ADD COLUMN `divisionStartedAt` DATETIME(3) NULL;

CREATE UNIQUE INDEX `Ticket_shareCode_key` ON `Ticket`(`shareCode`);
CREATE INDEX `idx_ticket_session_status` ON `Ticket`(`sessionStatus`);
CREATE INDEX `idx_ticket_share_code` ON `Ticket`(`shareCode`);

ALTER TABLE `TicketParticipant`
  ADD COLUMN `sessionStatus` VARCHAR(20) NOT NULL DEFAULT 'NOT_JOINED',
  ADD COLUMN `paymentStatus` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  ADD COLUMN `isAdmin` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `avatarId` VARCHAR(50) NULL,
  ADD COLUMN `displayName` VARCHAR(100) NULL,
  ADD COLUMN `selectionSubmittedAt` DATETIME(3) NULL,
  ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

CREATE INDEX `idx_tp_session_status` ON `TicketParticipant`(`sessionStatus`);
CREATE INDEX `idx_tp_payment_status` ON `TicketParticipant`(`paymentStatus`);

ALTER TABLE `Product`
  ADD COLUMN `lineGroupId` CHAR(36) NULL,
  ADD COLUMN `isIndivisible` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `emoji` VARCHAR(10) NULL;

CREATE INDEX `idx_product_line_group` ON `Product`(`lineGroupId`);
