import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ClientesPage() {
  const session = await auth();
  const tenantId = session!.user.tenantId;

  const clientes = await prisma.client.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { documents: true, pendencias: { where: { status: { in: ["PENDENTE", "EM_COBRANCA"] } } } } },
    },
  });

  const statusColors: Record<string, string> = {
    ATIVO: "bg-green-900/50 text-green-400",
    INATIVO: "bg-gray-700/50 text-gray-400",
    PENDENTE_CADASTRO: "bg-yellow-900/50 text-yellow-400",
  };

  const tipoLabels: Record<string, string> = {
    PF: "PF",
    MEI: "MEI",
    PJ_SIMPLES: "PJ Simples",
    PJ_PRESUMIDO: "PJ Presumido",
    PJ_REAL: "PJ Real",
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Clientes</h1>
        <Link
          href="/clientes/novo"
          className="px-3 sm:px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
        >
          + Novo
        </Link>
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-card-border">
              <th className="text-left px-6 py-3 text-xs font-medium text-muted uppercase">Nome</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted uppercase">CPF/CNPJ</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted uppercase">WhatsApp</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted uppercase">Tipo</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted uppercase">Docs</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted uppercase">Pend.</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4">
                  <Link href={`/clientes/${c.id}`} className="text-sm font-medium hover:text-primary transition-colors">
                    {c.nome}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-muted">{c.cpfCnpj}</td>
                <td className="px-6 py-4 text-sm text-muted">{c.whatsapp}</td>
                <td className="px-6 py-4 text-sm">{tipoLabels[c.tipo] || c.tipo}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[c.status] || ""}`}>
                    {c.status === "ATIVO" ? "Ativo" : c.status === "INATIVO" ? "Inativo" : "Pendente"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-muted">{c._count.documents}</td>
                <td className="px-6 py-4">
                  {c._count.pendencias > 0 ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900/50 text-yellow-400">
                      {c._count.pendencias}
                    </span>
                  ) : (
                    <span className="text-sm text-muted">0</span>
                  )}
                </td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-muted">
                  Nenhum cliente cadastrado.{" "}
                  <Link href="/clientes/novo" className="text-primary hover:underline">
                    Cadastrar primeiro cliente
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
