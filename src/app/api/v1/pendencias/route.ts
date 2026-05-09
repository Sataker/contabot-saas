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

  const status = req.nextUrl.searchParams.get("status");
  const statusList = status?.split(",") || [];

  const pendencias = await prisma.pendencia.findMany({
    where: {
      tenantId,
      ...(statusList.length > 0 ? { status: { in: statusList } } : {}),
    },
    orderBy: { prazo: "asc" },
    include: { client: true },
  });

  return NextResponse.json(pendencias);
}

export async function POST(req: NextRequest) {
  const tenantId = await getTenantId(req);
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const pendencia = await prisma.pendencia.create({
    data: {
      tenantId,
      clientId: body.clientId,
      tipo: body.tipo,
      descricao: body.descricao,
      prazo: body.prazo ? new Date(body.prazo) : null,
      criadoPor: body.criadoPor || null,
    },
  });

  return NextResponse.json(pendencia, { status: 201 });
}
