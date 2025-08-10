/*
  Warnings:

  - You are about to drop the column `preferredRouteCityId` on the `Vehicle` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Vehicle` DROP FOREIGN KEY `Vehicle_preferredRouteCityId_fkey`;

-- AlterTable
ALTER TABLE `Vehicle` DROP COLUMN `preferredRouteCityId`;
