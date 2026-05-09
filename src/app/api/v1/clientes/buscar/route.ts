import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApi } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const tenant = await authenticateApi(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const whatsapp = req.nextUrl.searchParams.get("whatsapp");
  if (!whatsapp) return NextResponse.json({ error: "whatsapp param required" }, { status: 400 });

  const phone = whatsapp.replace(/\D/g, "").replace(/@.*/, "");

  const client = await prisma.client.findFirst({
    where: { tenantId: tenant.id, whatsapp: { contains: phone } },
  });

  if (!client) return NextResponse.json({ found: false }, { status: 404 });
  return NextResponse.json({ found: true, client });
}
