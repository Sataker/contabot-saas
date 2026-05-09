import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { authenticateApi } from "@/lib/api-auth";

async function getTenantId(req: NextRequest) {
  // Try API key first (for n8n), then session
  const tenant = await authenticateApi(req);
  if (tenant) return tenant.id;

  const session = await auth();
  return session?.user?.tenantId || null;
}

export async function GET(req: NextRequest) {
  const tenantId = await getTenantId(req);
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientes = await prisma.client.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(clientes);
}

export async function POST(req: NextRequest) {
  const tenantId = await getTenantId(req);
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { nome, cpfCnpj, whatsapp, email, tipo, observacoes } = body;

  if (!nome || !cpfCnpj || !whatsapp) {
    return NextResponse.json({ error: "Nome, CPF/CNPJ e WhatsApp sao obrigatorios" }, { status: 400 });
  }

  const existing = await prisma.client.findFirst({
    where: { tenantId, cpfCnpj },
  });

  if (existing) {
    return NextResponse.json({ error: "Cliente com este CPF/CNPJ ja existe" }, { status: 409 });
  }

  const client = await prisma.client.create({
    data: {
      tenantId,
      nome,
      cpfCnpj,
      whatsapp,
      email: email || null,
      tipo: tipo || "PF",
      observacoes: observacoes || null,
    },
  });

  await prisma.activityLog.create({
    data: {
      tenantId,
      entityType: "client",
      entityId: client.id,
      action: "Cadastrou cliente",
      details: JSON.stringify({ nome, cpfCnpj }),
    },
  });

  return NextResponse.json(client, { status: 201 });
}
