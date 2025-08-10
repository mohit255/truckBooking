-- AlterTable
ALTER TABLE `Vehicle` ADD COLUMN `preferredRouteDestinationCityId` INTEGER NULL,
    ADD COLUMN `preferredRouteSourceCityId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Vehicle` ADD CONSTRAINT `Vehicle_preferredRouteSourceCityId_fkey` FOREIGN KEY (`preferredRouteSourceCityId`) REFERENCES `City`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vehicle` ADD CONSTRAINT `Vehicle_preferredRouteDestinationCityId_fkey` FOREIGN KEY (`preferredRouteDestinationCityId`) REFERENCES `City`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
