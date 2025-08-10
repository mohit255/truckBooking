/*
  Warnings:

  - You are about to drop the column `insuranceValidTill` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `permitValidTill` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `ratePerKm` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `rcValidTill` on the `Vehicle` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Vehicle` DROP COLUMN `insuranceValidTill`,
    DROP COLUMN `permitValidTill`,
    DROP COLUMN `ratePerKm`,
    DROP COLUMN `rcValidTill`;
