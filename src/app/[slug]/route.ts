import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/kv";
import type { Campaign, Destination } from "@/lib/types";

// Reserved paths that should not be treated as campaign slugs
const RESERVED_PATHS = new Set(["admin", "api", "favicon.ico", "_next"]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Don't intercept reserved paths
  if (RESERVED_PATHS.has(slug)) {
    return NextResponse.next();
  }

  try {
    // Pipeline: fetch campaign + destinations + increment counter in ONE round-trip
    const pipeline = redis.pipeline();
    pipeline.hgetall(`campaign:${slug}`);
    pipeline.zrange(`campaign:${slug}:destinations`, 0, -1);
    pipeline.incr(`campaign:${slug}:counter`);

    const results = await pipeline.exec();
    const campaign = results[0] as Campaign | null;
    const rawDestinations = results[1] as string[];
    const counter = results[2] as number;

    // Campaign not found
    if (!campaign || !campaign.id || !rawDestinations || rawDestinations.length === 0) {
      return NextResponse.json(
        { error: "Campanha não encontrada" },
        { status: 404 }
      );
    }

    const destinations: Destination[] = rawDestinations.map((raw) =>
      typeof raw === "string" ? JSON.parse(raw) : raw as unknown as Destination
    );

    let target: Destination;

    // Winner mode: send 100% to winner
    if (campaign.winnerId && campaign.winnerId !== "null") {
      const winner = destinations.find((d) => d.id === campaign.winnerId);
      target = winner || destinations[0];
    } else {
      // Round-robin: counter mod number of destinations
      const index = (counter - 1) % destinations.length;
      target = destinations[index];
    }

    // Fire-and-forget click tracking
    redis.hincrby(`campaign:${slug}:clicks`, target.id, 1).catch(() => {});

    // 302 redirect (temporary - browser must not cache)
    return NextResponse.redirect(target.url, 302);
  } catch {
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}
