import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApi } from "@/lib/api-auth";
import { auth } from "@/lib/auth";

async function getTenantId(req: NextRequest) {
  const tenant = await authenticateApi(req);
  if (tenant) return tenant.id;
  const session = await auth();
  return session?.user?.tenantId || null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenantId = await getTenantId(req);
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.status) data.status = body.status;
  if (body.tentativas !== undefined) data.tentativas = body.tentativas;
  if (body.ultimoContato) data.ultimoContato = new Date(body.ultimoContato);
  if (body.status === "RESOLVIDO") data.resolvedAt = new Date();

  const updated = await prisma.pendencia.updateMany({
    where: { id, tenantId },
    data,
  });

  if (updated.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
