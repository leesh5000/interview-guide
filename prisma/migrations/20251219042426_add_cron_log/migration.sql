-- CreateTable
CREATE TABLE "CronLog" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "errorDetail" TEXT,
    "duration" INTEGER,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CronLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CronLog_jobName_idx" ON "CronLog"("jobName");

-- CreateIndex
CREATE INDEX "CronLog_executedAt_idx" ON "CronLog"("executedAt");
