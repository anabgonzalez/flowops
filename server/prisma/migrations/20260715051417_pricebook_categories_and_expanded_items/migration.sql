-- CreateEnum
CREATE TYPE "PricingMethod" AS ENUM ('FLAT_RATE', 'TIME_AND_MATERIALS');

-- AlterEnum
ALTER TYPE "PricebookItemType" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "PricebookItem" ADD COLUMN     "addOnPriceCents" INTEGER,
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "estimatedDurationMinutes" INTEGER,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "laborRateCents" INTEGER,
ADD COLUMN     "markupPercent" DOUBLE PRECISION,
ADD COLUMN     "memberPriceCents" INTEGER,
ADD COLUMN     "nonDiscountable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pricingMethod" "PricingMethod" NOT NULL DEFAULT 'FLAT_RATE',
ADD COLUMN     "unitOfMeasure" TEXT NOT NULL DEFAULT 'each',
ADD COLUMN     "vendorName" TEXT,
ADD COLUMN     "vendorPartNumber" TEXT,
ADD COLUMN     "warrantyDurationMonths" INTEGER,
ADD COLUMN     "warrantyTerms" TEXT;

-- CreateTable
CREATE TABLE "PricebookCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricebookCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricebookItemComponent" (
    "id" TEXT NOT NULL,
    "parentItemId" TEXT NOT NULL,
    "componentItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PricebookItemComponent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PricebookCategory_name_parentId_key" ON "PricebookCategory"("name", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "PricebookItemComponent_parentItemId_componentItemId_key" ON "PricebookItemComponent"("parentItemId", "componentItemId");

-- AddForeignKey
ALTER TABLE "PricebookCategory" ADD CONSTRAINT "PricebookCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PricebookCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricebookItem" ADD CONSTRAINT "PricebookItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PricebookCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricebookItemComponent" ADD CONSTRAINT "PricebookItemComponent_parentItemId_fkey" FOREIGN KEY ("parentItemId") REFERENCES "PricebookItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricebookItemComponent" ADD CONSTRAINT "PricebookItemComponent_componentItemId_fkey" FOREIGN KEY ("componentItemId") REFERENCES "PricebookItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

