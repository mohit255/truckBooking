-- CreateTable
CREATE TABLE `Vehicle` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vehicleNumber` VARCHAR(191) NOT NULL,
    `vehicleType` ENUM('CONTAINER_32FT', 'OPEN_20FT', 'OPEN_22FT', 'TRAILER', 'OTHER') NOT NULL,
    `ownerName` VARCHAR(191) NOT NULL,
    `ownerContact` VARCHAR(191) NOT NULL,
    `preferredRoute` VARCHAR(191) NULL,
    `ratePerKm` DECIMAL(10, 2) NOT NULL,
    `rcValidTill` DATETIME(3) NULL,
    `permitValidTill` DATETIME(3) NULL,
    `insuranceValidTill` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Vehicle_vehicleNumber_key`(`vehicleNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Booking` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bookingDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `partyName` VARCHAR(191) NOT NULL,
    `partyContact` VARCHAR(191) NULL,
    `sourceLocation` VARCHAR(191) NOT NULL,
    `destination` VARCHAR(191) NOT NULL,
    `requestedVehicle` ENUM('CONTAINER_32FT', 'OPEN_20FT', 'OPEN_22FT', 'TRAILER', 'OTHER') NOT NULL,
    `vehicleId` INTEGER NULL,
    `malikName` VARCHAR(191) NULL,
    `malikRate` DECIMAL(10, 2) NOT NULL,
    `partyRate` DECIMAL(10, 2) NOT NULL,
    `commission` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('PENDING', 'IN_TRANSIT', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bookingId` INTEGER NOT NULL,
    `totalFromParty` DECIMAL(10, 2) NOT NULL,
    `paidByParty` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `amountPayableMalik` DECIMAL(10, 2) NOT NULL,
    `paidToMalik` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `commissionEarned` DECIMAL(10, 2) NOT NULL,
    `paymentStatus` ENUM('ALL_PAID', 'PARTY_PENDING', 'MALIK_PENDING') NOT NULL DEFAULT 'PARTY_PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Payment_bookingId_key`(`bookingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
