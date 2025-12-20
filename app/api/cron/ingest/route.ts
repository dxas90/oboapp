import { NextResponse } from "next/server";
import { resolve } from "node:path";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes max execution time

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("🕐 Cron job: Starting ingestion...");

  try {
    const { ingest } = await import("@/lib/messageIngest/from-sources");

    const boundariesPath = resolve(
      process.cwd(),
      "lib/messageIngest/boundaries/oborishte.geojson"
    );

    const summary = await ingest({
      boundariesPath,
      dryRun: false,
    });

    console.log("\n📊 Ingestion Summary:");
    console.log(`   Total sources: ${summary.total}`);
    console.log(`   Within bounds: ${summary.withinBounds}`);
    console.log(`   Successfully ingested: ${summary.ingested}`);
    console.log(`   Already ingested: ${summary.alreadyIngested}`);
    console.log(`   Failed: ${summary.failed}`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
    });
  } catch (error) {
    console.error("Ingest cron job failed:", error);
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
