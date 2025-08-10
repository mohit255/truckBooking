-- AlterTable
ALTER TABLE `Booking` ADD COLUMN `destinationCityId` INTEGER NULL,
    ADD COLUMN `sourceCityId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Vehicle` ADD COLUMN `preferredRouteCityId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Vehicle` ADD CONSTRAINT `Vehicle_preferredRouteCityId_fkey` FOREIGN KEY (`preferredRouteCityId`) REFERENCES `City`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_sourceCityId_fkey` FOREIGN KEY (`sourceCityId`) REFERENCES `City`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_destinationCityId_fkey` FOREIGN KEY (`destinationCityId`) REFERENCES `City`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
