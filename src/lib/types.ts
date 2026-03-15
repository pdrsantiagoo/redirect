export interface Campaign {
  id: string;
  slug: string;
  name: string;
  createdAt: string;
  winnerId: string | null;
}

export interface Destination {
  id: string;
  url: string;
  name: string;
}

export interface DestinationWithClicks extends Destination {
  clicks: number;
}

export interface CampaignWithStats extends Campaign {
  destinations: DestinationWithClicks[];
  totalClicks: number;
}
