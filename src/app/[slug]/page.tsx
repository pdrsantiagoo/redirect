import { redis } from "@/lib/kv";
import type { Campaign, Destination } from "@/lib/types";
import { notFound } from "next/navigation";
import ClientRedirect from "./client-redirect";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RedirectPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;

  // Reserved paths
  const RESERVED = new Set(["admin", "api", "favicon.ico", "_next"]);
  if (RESERVED.has(slug)) {
    notFound();
  }

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
      notFound();
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

    // Build destination URL with UTM params
    const destinationUrl = new URL(target.url);
    Object.entries(query).forEach(([key, value]) => {
      if (typeof value === "string") {
        destinationUrl.searchParams.set(key, value);
      } else if (Array.isArray(value)) {
        destinationUrl.searchParams.set(key, value[0] || "");
      }
    });

    return <ClientRedirect url={destinationUrl.toString()} />;
  } catch {
    notFound();
  }
}
