import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: {
      driveRefreshToken: null,
      driveEmail: null,
      driveRootFolderId: null,
    },
  });

  return NextResponse.json({ ok: true });
}
