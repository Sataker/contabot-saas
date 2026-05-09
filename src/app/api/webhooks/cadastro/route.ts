import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApi } from "@/lib/api-auth";
import { broadcast } from "@/lib/sse";

export async function POST(req: NextRequest) {
  const tenant = await authenticateApi(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { nome, cpfCnpj, whatsapp, email, tipo } = body;

  if (!nome || !cpfCnpj || !whatsapp) {
    return NextResponse.json({ error: "nome, cpfCnpj, whatsapp required" }, { status: 400 });
  }

  const existing = await prisma.client.findFirst({
    where: { tenantId: tenant.id, cpfCnpj },
  });

  if (existing) {
    return NextResponse.json({ error: "Cliente ja existe", client: existing }, { status: 409 });
  }

  const client = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      nome,
      cpfCnpj,
      whatsapp: whatsapp.replace(/\D/g, ""),
      email: email || null,
      tipo: tipo || "PF",
      status: "ATIVO",
    },
  });

  await prisma.activityLog.create({
    data: {
      tenantId: tenant.id,
      entityType: "client",
      entityId: client.id,
      action: "Cliente cadastrado via WhatsApp",
      details: JSON.stringify({ nome, cpfCnpj }),
    },
  });

  broadcast(tenant.id, "new-client", { id: client.id, nome: client.nome });

  return NextResponse.json(client, { status: 201 });
}
