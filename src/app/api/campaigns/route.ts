import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { createCampaign, listCampaigns } from "@/lib/campaigns";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const campaigns = await listCampaigns();
  return NextResponse.json(campaigns);
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { name, slug, destinations } = body;

  if (!name || !slug || !destinations || destinations.length < 2) {
    return NextResponse.json(
      { error: "Nome, slug e pelo menos 2 destinos são obrigatórios" },
      { status: 400 }
    );
  }

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "Slug deve conter apenas letras minúsculas, números e hífens" },
      { status: 400 }
    );
  }

  try {
    const campaign = await createCampaign(name, slug, destinations);
    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar campanha";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
