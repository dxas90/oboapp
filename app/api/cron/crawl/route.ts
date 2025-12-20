import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes max execution time

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("🕐 Cron job: Starting crawl...");

  try {
    const results = await Promise.allSettled([
      // Crawl rayon-oborishte-bg
      (async () => {
        const { crawl } = await import("@/lib/crawlers/rayon-oborishte-bg");
        await crawl();
        return { source: "rayon-oborishte-bg", success: true };
      })(),
      // Crawl sofiyska-voda
      (async () => {
        const { crawl } = await import("@/lib/crawlers/sofiyska-voda");
        await crawl(false); // not dry-run
        return { source: "sofiyska-voda", success: true };
      })(),
    ]);

    const crawlResults = results.map((result) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          source: "unknown",
          success: false,
          error: result.reason?.message || String(result.reason),
        };
      }
    });

    const success = crawlResults.every((r) => r.success);

    return NextResponse.json({
      success,
      timestamp: new Date().toISOString(),
      results: crawlResults,
    });
  } catch (error) {
    console.error("Crawl cron job failed:", error);
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
