import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { id: session.user.tenantId } });
  if (!tenant?.uazapiBaseUrl || !tenant?.uazapiToken || !tenant?.uazapiInstance) {
    return NextResponse.json({ error: "UazAPI nao configurada", configured: false }, { status: 400 });
  }

  try {
    const res = await fetch(`${tenant.uazapiBaseUrl}/instance/${tenant.uazapiInstance}/qrcode`, {
      headers: { "Authorization": `Bearer ${tenant.uazapiToken}` },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: "Erro ao buscar QR Code", detail: text }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: "Falha na conexao com UazAPI" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action } = await req.json();
  const tenant = await prisma.tenant.findUnique({ where: { id: session.user.tenantId } });

  if (!tenant?.uazapiBaseUrl || !tenant?.uazapiToken || !tenant?.uazapiInstance) {
    return NextResponse.json({ error: "UazAPI nao configurada" }, { status: 400 });
  }

  if (action === "status") {
    try {
      const res = await fetch(`${tenant.uazapiBaseUrl}/instance/${tenant.uazapiInstance}/status`, {
        headers: { "Authorization": `Bearer ${tenant.uazapiToken}` },
      });
      const data = await res.json();
      const connected = data?.status === "CONNECTED" || data?.state === "open";

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { uazapiConnected: connected },
      });

      return NextResponse.json({ connected, data });
    } catch {
      return NextResponse.json({ connected: false, error: "Falha na conexao" });
    }
  }

  if (action === "disconnect") {
    try {
      await fetch(`${tenant.uazapiBaseUrl}/instance/${tenant.uazapiInstance}/logout`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${tenant.uazapiToken}` },
      });
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { uazapiConnected: false },
      });
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ error: "Falha ao desconectar" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Acao invalida" }, { status: 400 });
}
