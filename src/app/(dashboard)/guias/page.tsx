import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function GuiasPage() {
  const session = await auth();
  const tenantId = session!.user.tenantId;

  const guias = await prisma.guia.findMany({
    where: { tenantId },
    orderBy: { vencimento: "desc" },
    include: { client: true },
  });

  const statusColors: Record<string, string> = {
    A_ENVIAR: "bg-blue-900/50 text-blue-400",
    ENVIADO: "bg-yellow-900/50 text-yellow-400",
    PAGO: "bg-green-900/50 text-green-400",
    VENCIDO: "bg-red-900/50 text-red-400",
  };

  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Guias de Pagamento</h1>
        <Link
          href="/guias/nova"
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors"
        >
          + Nova Guia
        </Link>
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-card-border">
              <th className="text-left px-6 py-3 text-xs font-medium text-muted uppercase">Cliente</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted uppercase">Tipo</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted uppercase">Competencia</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted uppercase">Vencimento</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted uppercase">Valor</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {guias.map((g) => {
              const vence = new Date(g.vencimento);
              const nearDue = vence > now && vence.getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000;
              return (
                <tr key={g.id} className={`border-b border-gray-800/50 ${nearDue && g.status !== "PAGO" ? "bg-orange-950/10" : ""}`}>
                  <td className="px-6 py-4 text-sm font-medium">{g.client.nome}</td>
                  <td className="px-6 py-4 text-sm">{g.tipoGuia}</td>
                  <td className="px-6 py-4 text-sm text-muted">{g.competencia}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={nearDue && g.status !== "PAGO" ? "text-orange-400" : "text-muted"}>
                      {vence.toLocaleDateString("pt-BR")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">R$ {g.valor}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[g.status] || ""}`}>
                      {g.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              );
            })}
            {guias.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted">
                  Nenhuma guia cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
