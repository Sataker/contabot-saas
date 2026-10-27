import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { authenticateApi } from "@/lib/api-auth";
import { pickStrings } from "@/lib/pick";
import { clientBelongsToTenant } from "@/lib/tenant";

const EDITABLE_FIELDS = [
  "clientId", "tipoDoc", "subtipo", "valor", "competencia",
  "cnpjEmissor", "nomeEmissor", "driveUrl", "status", "resumo",
] as const;

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

  const data = pickStrings(await req.json(), EDITABLE_FIELDS);
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "No editable fields" }, { status: 400 });

  // A document may only be linked to a client of the same tenant.
  if (data.clientId && !(await clientBelongsToTenant(data.clientId, tenantId))) {
    return NextResponse.json({ error: "Client not found" }, { status: 400 });
  }

  const updated = await prisma.document.updateMany({
    where: { id, tenantId },
    data,
  });

  if (updated.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.activityLog.create({
    data: {
      tenantId,
      entityType: "document",
      entityId: id,
      action: "Documento atualizado",
      details: JSON.stringify(data),
    },
  });

  return NextResponse.json({ ok: true });
}
