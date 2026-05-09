import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PendenciasPage() {
  const session = await auth();
  const tenantId = session!.user.tenantId;

  const pendencias = await prisma.pendencia.findMany({
    where: { tenantId },
    orderBy: [{ status: "asc" }, { prazo: "asc" }],
    include: { client: true },
  });

  const statusColors: Record<string, string> = {
    PENDENTE: "bg-yellow-900/50 text-yellow-400",
    EM_COBRANCA: "bg-orange-900/50 text-orange-400",
    RESOLVIDO: "bg-green-900/50 text-green-400",
    CANCELADO: "bg-gray-700/50 text-gray-400",
  };

  const now = new Date();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pendencias</h1>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-card-border">
              <th className="text-left px-6 py-3 text-xs font-medium text-muted uppercase">Cliente</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted uppercase">Descricao</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted uppercase">Tipo</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted uppercase">Prazo</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted uppercase">Tentativas</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {pendencias.map((p) => {
              const overdue = p.prazo && new Date(p.prazo) < now && !["RESOLVIDO", "CANCELADO"].includes(p.status);
              return (
                <tr key={p.id} className={`border-b border-gray-800/50 ${overdue ? "bg-red-950/20" : ""}`}>
                  <td className="px-6 py-4 text-sm font-medium">{p.client.nome}</td>
                  <td className="px-6 py-4 text-sm">{p.descricao}</td>
                  <td className="px-6 py-4 text-sm text-muted">{p.tipo.replace(/_/g, " ")}</td>
                  <td className="px-6 py-4">
                    {p.prazo ? (
                      <span className={`text-sm ${overdue ? "text-red-400 font-medium" : "text-muted"}`}>
                        {new Date(p.prazo).toLocaleDateString("pt-BR")}
                        {overdue && " (vencido)"}
                      </span>
                    ) : (
                      <span className="text-sm text-muted">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">{p.tentativas}/3</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[p.status] || ""}`}>
                      {p.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              );
            })}
            {pendencias.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted">
                  Nenhuma pendencia registrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
