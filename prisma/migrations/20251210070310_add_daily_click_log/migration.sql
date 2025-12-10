-- CreateTable
CREATE TABLE "DailyClickLog" (
    "id" TEXT NOT NULL,
    "affiliateUrl" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyClickLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyClickLog_date_idx" ON "DailyClickLog"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyClickLog_affiliateUrl_date_key" ON "DailyClickLog"("affiliateUrl", "date");
