-- CreateTable
CREATE TABLE "JobType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultPriority" "JobPriority" NOT NULL DEFAULT 'NORMAL',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_JobToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_JobToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobType_name_key" ON "JobType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "_JobToTag_B_index" ON "_JobToTag"("B");

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "estimateId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_estimateId_key" ON "Invoice"("estimateId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: add jobTypeId as nullable first so any existing rows can be
-- backfilled before the NOT NULL constraint is applied.
ALTER TABLE "Job" ADD COLUMN     "jobTypeId" TEXT;

-- Backfill: turn each distinct existing free-text jobType value into its
-- own JobType row, then point existing jobs at the matching one. On a
-- fresh database with no Job rows this is a no-op.
INSERT INTO "JobType" ("id", "name", "defaultPriority", "active", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, distinct_types."jobType", 'NORMAL', true, now(), now()
FROM (SELECT DISTINCT "jobType" FROM "Job") AS distinct_types
ON CONFLICT ("name") DO NOTHING;

UPDATE "Job" j SET "jobTypeId" = jt."id" FROM "JobType" jt WHERE jt."name" = j."jobType";

ALTER TABLE "Job" ALTER COLUMN "jobTypeId" SET NOT NULL;
ALTER TABLE "Job" DROP COLUMN "jobType";

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_jobTypeId_fkey" FOREIGN KEY ("jobTypeId") REFERENCES "JobType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JobToTag" ADD CONSTRAINT "_JobToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JobToTag" ADD CONSTRAINT "_JobToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
