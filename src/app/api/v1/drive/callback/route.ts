import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const tenantId = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/configuracoes?drive=error&reason=" + error, req.url));
  }

  if (!code || !tenantId) {
    return NextResponse.redirect(new URL("/configuracoes?drive=error&reason=missing_params", req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/v1/drive/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/configuracoes?drive=error&reason=not_configured", req.url));
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok || !tokens.access_token) {
      return NextResponse.redirect(new URL("/configuracoes?drive=error&reason=token_exchange", req.url));
    }

    // Get user email
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userRes.json();

    // Create root folder in Drive
    const folderRes = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "ContaBot - Documentos",
        mimeType: "application/vnd.google-apps.folder",
      }),
    });
    const folder = await folderRes.json();

    // Save to tenant
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        driveRefreshToken: tokens.refresh_token || null,
        driveEmail: userInfo.email || null,
        driveRootFolderId: folder.id || null,
      },
    });

    return NextResponse.redirect(new URL("/configuracoes?drive=success", req.url));
  } catch {
    return NextResponse.redirect(new URL("/configuracoes?drive=error&reason=exception", req.url));
  }
}
