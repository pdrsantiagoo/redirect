import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { setWinner, clearWinner } from "@/lib/campaigns";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { slug } = await params;
  const body = await request.json();
  const { destId } = body;

  if (!destId) {
    return NextResponse.json({ error: "ID do destino é obrigatório" }, { status: 400 });
  }

  await setWinner(slug, destId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { slug } = await params;
  await clearWinner(slug);
  return NextResponse.json({ ok: true });
}
