-- Add nullable active-owner key to enforce one active hall per owner.
ALTER TABLE `halls`
  ADD COLUMN `ownerActiveKey` VARCHAR(191) NULL;

-- Backfill active halls with owner id. Deleted halls remain nullable.
UPDATE `halls`
SET `ownerActiveKey` = `ownerId`
WHERE `status` <> 'DELETED';

UPDATE `halls`
SET `ownerActiveKey` = NULL
WHERE `status` = 'DELETED';

CREATE UNIQUE INDEX `halls_ownerActiveKey_key` ON `halls`(`ownerActiveKey`);
