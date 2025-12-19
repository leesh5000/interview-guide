import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

// GET: Cron 로그 목록 조회
export async function GET() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs = await prisma.cronLog.findMany({
    orderBy: { executedAt: "desc" },
    take: 50,
  });

  return NextResponse.json(logs);
}
