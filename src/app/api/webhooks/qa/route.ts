import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApi } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const tenant = await authenticateApi(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { whatsapp } = await req.json();
  const phone = whatsapp?.replace(/\D/g, "").replace(/@.*/, "");

  if (!phone) return NextResponse.json({ error: "whatsapp required" }, { status: 400 });

  const client = await prisma.client.findFirst({
    where: { tenantId: tenant.id, whatsapp: { contains: phone } },
  });

  if (!client) {
    return NextResponse.json({
      found: false,
      escritorio: tenant.nome,
      contadorWhatsapp: tenant.contadorWhatsapp,
    });
  }

  // Get recent docs and pendencias for context
  const [recentDocs, pendencias] = await Promise.all([
    prisma.document.findMany({
      where: { tenantId: tenant.id, clientId: client.id },
      orderBy: { receivedAt: "desc" },
      take: 5,
    }),
    prisma.pendencia.findMany({
      where: {
        tenantId: tenant.id,
        clientId: client.id,
        status: { in: ["PENDENTE", "EM_COBRANCA"] },
      },
    }),
  ]);

  const config = typeof tenant.config === "string" ? JSON.parse(tenant.config) : tenant.config;

  return NextResponse.json({
    found: true,
    client,
    recentDocs,
    pendencias,
    escritorio: tenant.nome,
    contadorNome: tenant.contadorNome,
    contadorWhatsapp: tenant.contadorWhatsapp,
    config,
  });
}
