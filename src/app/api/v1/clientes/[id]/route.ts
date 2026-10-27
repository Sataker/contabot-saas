import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { authenticateApi } from "@/lib/api-auth";
import { pickStrings } from "@/lib/pick";

const EDITABLE_FIELDS = ["nome", "cpfCnpj", "whatsapp", "email", "tipo", "status", "driveFolderUrl", "observacoes"] as const;

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

  const client = await prisma.client.findFirst({
    where: { id, tenantId },
    include: { documents: true, pendencias: true, guias: true },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenantId = await getTenantId(req);
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = pickStrings(await req.json(), EDITABLE_FIELDS);
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "No editable fields" }, { status: 400 });

  const client = await prisma.client.updateMany({
    where: { id, tenantId },
    data,
  });

  if (client.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
