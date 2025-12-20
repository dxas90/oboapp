import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 1 minute max execution time

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("🕐 Cron job: Starting notification matching...");

  try {
    const { main } = await import("@/lib/notifications/match-and-notify");

    await main();

    console.log("\n✅ Notification processing complete!");

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: "Notifications processed successfully",
    });
  } catch (error) {
    console.error("Notify cron job failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
