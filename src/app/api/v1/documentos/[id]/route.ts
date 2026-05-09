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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenantId = await getTenantId(req);
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doc = await prisma.document.findFirst({
    where: { id, tenantId },
    include: { client: true },
  });

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenantId = await getTenantId(req);
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const updated = await prisma.document.updateMany({
    where: { id, tenantId },
    data: body,
  });

  if (updated.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.activityLog.create({
    data: {
      tenantId,
      entityType: "document",
      entityId: id,
      action: "Documento atualizado",
      details: JSON.stringify(body),
    },
  });

  return NextResponse.json({ ok: true });
}
