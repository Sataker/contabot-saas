import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { authenticateApi } from "@/lib/api-auth";
import { broadcast } from "@/lib/sse";

async function getTenantId(req: NextRequest) {
  const tenant = await authenticateApi(req);
  if (tenant) return tenant.id;
  const session = await auth();
  return session?.user?.tenantId || null;
}

export async function GET(req: NextRequest) {
  const tenantId = await getTenantId(req);
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");
  const docs = await prisma.document.findMany({
    where: { tenantId, ...(status ? { status } : {}) },
    orderBy: { receivedAt: "desc" },
    include: { client: true },
    take: 50,
  });

  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const tenantId = await getTenantId(req);
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const doc = await prisma.document.create({
    data: {
      tenantId,
      clientId: body.clientId || null,
      tipoDoc: body.tipoDoc,
      subtipo: body.subtipo || null,
      valor: body.valor || null,
      competencia: body.competencia || null,
      cnpjEmissor: body.cnpjEmissor || null,
      nomeEmissor: body.nomeEmissor || null,
      driveUrl: body.driveUrl || null,
      confianca: body.confianca || 0,
      status: body.confianca >= 0.7 ? "PROCESSADO" : "REVISAR",
      resumo: body.resumo || null,
      createdBy: body.createdBy || "sistema",
    },
    include: { client: true },
  });

  await prisma.activityLog.create({
    data: {
      tenantId,
      entityType: "document",
      entityId: doc.id,
      action: "Documento recebido",
      details: JSON.stringify({ tipo: doc.tipoDoc, cliente: doc.client?.nome }),
    },
  });

  broadcast(tenantId, "new-document", doc);

  return NextResponse.json(doc, { status: 201 });
}
