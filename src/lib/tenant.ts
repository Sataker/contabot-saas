import { prisma } from "./prisma";

/**
 * True when the client exists and belongs to the tenant.
 * Every route that accepts a clientId from a request must check this; otherwise a
 * tenant could attach records to (and read back) another tenant's client.
 */
export async function clientBelongsToTenant(clientId: string, tenantId: string): Promise<boolean> {
  const client = await prisma.client.findFirst({ where: { id: clientId, tenantId }, select: { id: true } });
  return client !== null;
}
