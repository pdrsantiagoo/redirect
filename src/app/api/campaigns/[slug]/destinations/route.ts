import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { addDestination, removeDestination } from "@/lib/campaigns";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { slug } = await params;
  const body = await request.json();
  const { url, name } = body;

  if (!url) {
    return NextResponse.json({ error: "URL é obrigatória" }, { status: 400 });
  }

  const dest = await addDestination(slug, url, name);
  return NextResponse.json(dest, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const destId = searchParams.get("id");

  if (!destId) {
    return NextResponse.json({ error: "ID do destino é obrigatório" }, { status: 400 });
  }

  await removeDestination(slug, destId);
  return NextResponse.json({ ok: true });
}
