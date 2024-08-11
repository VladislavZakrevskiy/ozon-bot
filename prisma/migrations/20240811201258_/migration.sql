/*
  Warnings:

  - Added the required column `employee_level` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EmployeeLevel" AS ENUM ('EmployeeLevel_1', 'EmployeeLevel_2', 'EmployeeLevel_3', 'EmployeeLevel_4');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "employee_level" "EmployeeLevel" NOT NULL;
