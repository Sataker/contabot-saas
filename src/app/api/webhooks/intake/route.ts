import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApi } from "@/lib/api-auth";
import { broadcast } from "@/lib/sse";

export async function POST(req: NextRequest) {
  const tenant = await authenticateApi(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // n8n sends the classified document data after Claude Vision processing
  const {
    whatsapp,
    tipoDoc,
    subtipo,
    valor,
    competencia,
    cnpjEmissor,
    nomeEmissor,
    driveUrl,
    confianca,
    resumo,
  } = body;

  // Find client by phone
  const phone = whatsapp?.replace(/\D/g, "").replace(/@.*/, "");
  const client = phone
    ? await prisma.client.findFirst({
        where: { tenantId: tenant.id, whatsapp: { contains: phone } },
      })
    : null;

  const doc = await prisma.document.create({
    data: {
      tenantId: tenant.id,
      clientId: client?.id || null,
      tipoDoc: tipoDoc || "outro",
      subtipo,
      valor: valor != null ? String(valor) : null,
      competencia,
      cnpjEmissor,
      nomeEmissor,
      driveUrl,
      confianca: confianca || 0,
      status: (confianca || 0) >= 0.7 ? "PROCESSADO" : "REVISAR",
      resumo,
      createdBy: "n8n",
    },
    include: { client: true },
  });

  await prisma.activityLog.create({
    data: {
      tenantId: tenant.id,
      entityType: "document",
      entityId: doc.id,
      action: "Documento recebido via WhatsApp",
      details: JSON.stringify({
        tipo: doc.tipoDoc,
        cliente: client?.nome || "desconhecido",
        confianca: doc.confianca,
      }),
    },
  });

  broadcast(tenant.id, "new-document", {
    id: doc.id,
    tipo: doc.tipoDoc,
    cliente: client?.nome,
    confianca: doc.confianca,
  });

  return NextResponse.json({
    id: doc.id,
    status: doc.status,
    clientFound: !!client,
    clientName: client?.nome,
  });
}
