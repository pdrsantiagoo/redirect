import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/kv";
import type { Campaign, Destination } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const pipeline = redis.pipeline();
    pipeline.hgetall(`campaign:${slug}`);
    pipeline.zrange(`campaign:${slug}:destinations`, 0, -1);
    pipeline.incr(`campaign:${slug}:counter`);

    const results = await pipeline.exec();
    const campaign = results[0] as Campaign | null;
    const rawDestinations = results[1] as string[];
    const counter = results[2] as number;

    if (!campaign || !campaign.id || !rawDestinations || rawDestinations.length === 0) {
      return NextResponse.json(
        { error: "Campanha não encontrada" },
        { status: 404 }
      );
    }

    const destinations: Destination[] = rawDestinations.map((raw) =>
      typeof raw === "string" ? JSON.parse(raw) : (raw as unknown as Destination)
    );

    let target: Destination;

    if (campaign.winnerId && campaign.winnerId !== "null") {
      const winner = destinations.find((d) => d.id === campaign.winnerId);
      target = winner || destinations[0];
    } else {
      const index = (counter - 1) % destinations.length;
      target = destinations[index];
    }

    // Fire-and-forget click tracking
    redis.hincrby(`campaign:${slug}:clicks`, target.id, 1).catch(() => {});

    // Build destination URL with UTM params forwarded
    const destinationUrl = new URL(target.url);
    const incomingParams = request.nextUrl.searchParams;
    incomingParams.forEach((value, key) => {
      destinationUrl.searchParams.set(key, value);
    });

    return NextResponse.json({ url: destinationUrl.toString() });
  } catch {
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}
