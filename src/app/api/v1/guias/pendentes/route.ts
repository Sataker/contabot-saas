import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApi } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const tenant = await authenticateApi(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guias = await prisma.guia.findMany({
    where: { tenantId: tenant.id, status: "A_ENVIAR" },
    include: { client: true },
    orderBy: { vencimento: "asc" },
  });

  return NextResponse.json(guias);
}
