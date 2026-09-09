/*
  Warnings:

  - You are about to drop the column `endAt` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `guestCount` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `startAt` on the `bookings` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `bookings` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(1))` to `Enum(EnumId(3))`.
  - You are about to drop the column `basePrice` on the `halls` table. All the data in the column will be lost.
  - You are about to drop the column `pricingType` on the `halls` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[hallId,date,daytime]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `date` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `daytime` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purpose` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Made the column `totalPrice` on table `bookings` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `depositAmount` to the `halls` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `availability_blocks` ADD COLUMN `daytime` ENUM('MORNING', 'EVENING', 'FULL_DAY') NULL;

-- AlterTable
ALTER TABLE `bookings` DROP COLUMN `endAt`,
    DROP COLUMN `guestCount`,
    DROP COLUMN `startAt`,
    ADD COLUMN `bankAccountId` VARCHAR(191) NULL,
    ADD COLUMN `date` DATE NOT NULL,
    ADD COLUMN `daytime` ENUM('MORNING', 'EVENING', 'FULL_DAY') NOT NULL,
    ADD COLUMN `purpose` VARCHAR(191) NOT NULL,
    MODIFY `status` ENUM('PENDING_REVIEW', 'ACCEPTED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING_REVIEW',
    MODIFY `totalPrice` DECIMAL(65, 30) NOT NULL;

-- AlterTable
ALTER TABLE `halls` DROP COLUMN `basePrice`,
    DROP COLUMN `pricingType`,
    ADD COLUMN `depositAmount` DECIMAL(65, 30) NOT NULL;

-- CreateTable
CREATE TABLE `daytime_prices` (
    `id` VARCHAR(191) NOT NULL,
    `hallId` VARCHAR(191) NOT NULL,
    `daytime` ENUM('MORNING', 'EVENING', 'FULL_DAY') NOT NULL,
    `price` DECIMAL(65, 30) NOT NULL,

    INDEX `daytime_prices_hallId_idx`(`hallId`),
    UNIQUE INDEX `daytime_prices_hallId_daytime_key`(`hallId`, `daytime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hall_bank_accounts` (
    `id` VARCHAR(191) NOT NULL,
    `hallId` VARCHAR(191) NOT NULL,
    `bankCode` VARCHAR(191) NOT NULL,
    `accountHolder` VARCHAR(191) NOT NULL,
    `accountNumber` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `hall_bank_accounts_hallId_idx`(`hallId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `receipts` (
    `id` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `status` ENUM('UPLOADED', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'UPLOADED',
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `receipts_bookingId_key`(`bookingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `bookings_hallId_date_daytime_key` ON `bookings`(`hallId`, `date`, `daytime`);

-- AddForeignKey
ALTER TABLE `daytime_prices` ADD CONSTRAINT `daytime_prices_hallId_fkey` FOREIGN KEY (`hallId`) REFERENCES `halls`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hall_bank_accounts` ADD CONSTRAINT `hall_bank_accounts_hallId_fkey` FOREIGN KEY (`hallId`) REFERENCES `halls`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `receipts` ADD CONSTRAINT `receipts_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
