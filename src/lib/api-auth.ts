import { NextRequest } from "next/server";
import { prisma } from "./prisma";

export async function authenticateApi(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const apiKey = authHeader.slice(7);
  const tenant = await prisma.tenant.findUnique({
    where: { apiKey },
  });

  return tenant;
}
