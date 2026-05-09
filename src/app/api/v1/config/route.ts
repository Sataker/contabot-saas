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

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const config = typeof tenant.config === "string" ? JSON.parse(tenant.config) : tenant.config;

  return NextResponse.json({ tenant, config });
}

export async function PUT(req: NextRequest) {
  const tenantId = await getTenantId(req);
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const tenantData: Record<string, unknown> = {};
  if (body.contadorNome) tenantData.contadorNome = body.contadorNome;
  if (body.contadorWhatsapp) tenantData.contadorWhatsapp = body.contadorWhatsapp;
  if (body.uazapiBaseUrl !== undefined) tenantData.uazapiBaseUrl = body.uazapiBaseUrl;
  if (body.uazapiToken !== undefined) tenantData.uazapiToken = body.uazapiToken;
  if (body.uazapiInstance !== undefined) tenantData.uazapiInstance = body.uazapiInstance;
  if (body.driveRootFolderId !== undefined) tenantData.driveRootFolderId = body.driveRootFolderId;

  const configFields = ["horario_inicio", "horario_fim", "intervalo_lembrete_dias", "max_tentativas_lembrete"];
  const configUpdate: Record<string, unknown> = {};
  for (const key of configFields) {
    if (body[key] !== undefined) configUpdate[key] = body[key];
  }

  if (Object.keys(configUpdate).length > 0) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const existing = typeof tenant?.config === "string" ? JSON.parse(tenant.config) : (tenant?.config || {});
    tenantData.config = JSON.stringify({ ...existing, ...configUpdate });
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: tenantData,
  });

  return NextResponse.json({ ok: true });
}
