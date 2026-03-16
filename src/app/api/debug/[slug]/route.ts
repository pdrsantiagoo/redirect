import { NextResponse } from "next/server";
import { redis } from "@/lib/kv";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const pipeline = redis.pipeline();
  pipeline.hgetall(`campaign:${slug}`);
  pipeline.zrange(`campaign:${slug}:destinations`, 0, -1);
  pipeline.incr(`campaign:${slug}:counter`);

  const results = await pipeline.exec();

  const campaign = results[0];
  const rawDestinations = results[1];
  const counter = results[2];

  const destinations = (rawDestinations as string[])?.map((raw: unknown, i: number) => ({
    index: i,
    type: typeof raw,
    isString: typeof raw === "string",
    raw: raw,
    parsed: typeof raw === "string" ? JSON.parse(raw) : raw,
  }));

  const numDestinations = destinations?.length || 0;
  const selectedIndex = numDestinations > 0 ? ((counter as number) - 1) % numDestinations : -1;

  return NextResponse.json({
    counter,
    counterType: typeof counter,
    numDestinations,
    selectedIndex,
    selectedDest: destinations?.[selectedIndex],
    allDestinations: destinations,
    campaign,
  });
}
