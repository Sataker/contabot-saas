import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { authenticateApi } from "@/lib/api-auth";

async function getTenantId(req: NextRequest) {
  const tenant = await authenticateApi(req);
  if (tenant) return tenant.id;
  const session = await auth();
  return session?.user?.tenantId || null;
}

export async function GET(req: NextRequest) {
  const tenantId = await getTenantId(req);
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guias = await prisma.guia.findMany({
    where: { tenantId },
    orderBy: { vencimento: "desc" },
    include: { client: true },
  });

  return NextResponse.json(guias);
}

export async function POST(req: NextRequest) {
  const tenantId = await getTenantId(req);
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const guia = await prisma.guia.create({
    data: {
      tenantId,
      clientId: body.clientId,
      tipoGuia: body.tipoGuia,
      competencia: body.competencia,
      vencimento: new Date(body.vencimento),
      valor: body.valor,
      codigoBarras: body.codigoBarras || null,
      driveUrl: body.driveUrl || null,
    },
  });

  return NextResponse.json(guia, { status: 201 });
}
