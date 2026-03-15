import { v4 as uuidv4 } from "uuid";
import { redis, campaignKey, destinationsKey, clicksKey, counterKey, CAMPAIGNS_INDEX } from "./kv";
import type { Campaign, Destination, DestinationWithClicks, CampaignWithStats } from "./types";

export async function createCampaign(
  name: string,
  slug: string,
  destinations: { url: string; name: string }[]
): Promise<Campaign> {
  const existing = await redis.hgetall(campaignKey(slug));
  if (existing && Object.keys(existing).length > 0) {
    throw new Error("Slug já existe");
  }

  const campaign: Campaign = {
    id: uuidv4(),
    slug,
    name,
    createdAt: new Date().toISOString(),
    winnerId: null,
  };

  const pipeline = redis.pipeline();
  pipeline.hset(campaignKey(slug), campaign as unknown as Record<string, string>);
  pipeline.sadd(CAMPAIGNS_INDEX, slug);
  pipeline.set(counterKey(slug), 0);

  for (let i = 0; i < destinations.length; i++) {
    const dest: Destination = {
      id: uuidv4(),
      url: destinations[i].url,
      name: destinations[i].name || `Destino ${i + 1}`,
    };
    pipeline.zadd(destinationsKey(slug), { score: i, member: JSON.stringify(dest) });
    pipeline.hset(clicksKey(slug), { [dest.id]: 0 });
  }

  await pipeline.exec();
  return campaign;
}

export async function listCampaigns(): Promise<CampaignWithStats[]> {
  const slugs = await redis.smembers(CAMPAIGNS_INDEX);
  if (!slugs || slugs.length === 0) return [];

  const campaigns: CampaignWithStats[] = [];

  for (const slug of slugs) {
    const campaign = await getCampaignWithStats(slug as string);
    if (campaign) campaigns.push(campaign);
  }

  campaigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return campaigns;
}

export async function getCampaign(slug: string): Promise<Campaign | null> {
  const data = await redis.hgetall(campaignKey(slug));
  if (!data || Object.keys(data).length === 0) return null;
  return data as unknown as Campaign;
}

export async function getCampaignWithStats(slug: string): Promise<CampaignWithStats | null> {
  const campaign = await getCampaign(slug);
  if (!campaign) return null;

  const [rawDestinations, clicks] = await Promise.all([
    redis.zrange(destinationsKey(slug), 0, -1),
    redis.hgetall(clicksKey(slug)),
  ]);

  const destinations: DestinationWithClicks[] = (rawDestinations || []).map((raw: string) => {
    const dest: Destination = typeof raw === "string" ? JSON.parse(raw) : raw as unknown as Destination;
    const clickCount = clicks ? Number(clicks[dest.id] || 0) : 0;
    return { ...dest, clicks: clickCount };
  });

  const totalClicks = destinations.reduce((sum, d) => sum + d.clicks, 0);

  return { ...campaign, destinations, totalClicks };
}

export async function addDestination(
  slug: string,
  url: string,
  name: string
): Promise<Destination> {
  const destinations = await redis.zrange(destinationsKey(slug), 0, -1);
  const dest: Destination = {
    id: uuidv4(),
    url,
    name: name || `Destino ${(destinations?.length || 0) + 1}`,
  };

  const pipeline = redis.pipeline();
  pipeline.zadd(destinationsKey(slug), { score: destinations?.length || 0, member: JSON.stringify(dest) });
  pipeline.hset(clicksKey(slug), { [dest.id]: 0 });
  await pipeline.exec();

  return dest;
}

export async function removeDestination(slug: string, destId: string): Promise<void> {
  const rawDestinations = await redis.zrange(destinationsKey(slug), 0, -1);
  const toRemove = (rawDestinations || []).find((raw: string) => {
    const dest: Destination = typeof raw === "string" ? JSON.parse(raw) : raw as unknown as Destination;
    return dest.id === destId;
  });

  if (toRemove) {
    const pipeline = redis.pipeline();
    pipeline.zrem(destinationsKey(slug), toRemove as string);
    pipeline.hdel(clicksKey(slug), destId);

    // If the winner was removed, clear it
    const campaign = await getCampaign(slug);
    if (campaign?.winnerId === destId) {
      pipeline.hset(campaignKey(slug), { winnerId: null });
    }

    await pipeline.exec();
  }
}

export async function setWinner(slug: string, destId: string): Promise<void> {
  await redis.hset(campaignKey(slug), { winnerId: destId });
}

export async function clearWinner(slug: string): Promise<void> {
  await redis.hset(campaignKey(slug), { winnerId: "null" });
}

export async function deleteCampaign(slug: string): Promise<void> {
  const pipeline = redis.pipeline();
  pipeline.del(campaignKey(slug));
  pipeline.del(destinationsKey(slug));
  pipeline.del(clicksKey(slug));
  pipeline.del(counterKey(slug));
  pipeline.srem(CAMPAIGNS_INDEX, slug);
  await pipeline.exec();
}

export async function updateCampaign(slug: string, data: { name?: string }): Promise<void> {
  if (data.name) {
    await redis.hset(campaignKey(slug), { name: data.name });
  }
}

export async function resetStats(slug: string): Promise<void> {
  const rawDestinations = await redis.zrange(destinationsKey(slug), 0, -1);
  const pipeline = redis.pipeline();
  pipeline.set(counterKey(slug), 0);
  for (const raw of rawDestinations || []) {
    const dest: Destination = typeof raw === "string" ? JSON.parse(raw) : raw as unknown as Destination;
    pipeline.hset(clicksKey(slug), { [dest.id]: 0 });
  }
  await pipeline.exec();
}
