import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const requiredDocs = [
  "informe_rendimento",
  "recibo_medico",
  "recibo_educacao",
  "comprovante_pagamento",
  "extrato_bancario",
];

const docLabels: Record<string, string> = {
  informe_rendimento: "Informes de Rendimentos",
  recibo_medico: "Recibos Medicos",
  recibo_educacao: "Recibos Educacao",
  comprovante_pagamento: "Comprovantes de Pagamento",
  extrato_bancario: "Extratos Bancarios",
};

export default async function IrpfPage() {
  const session = await auth();
  const tenantId = session!.user.tenantId;

  const pfClients = await prisma.client.findMany({
    where: { tenantId, tipo: "PF", status: "ATIVO" },
    include: {
      documents: {
        where: { tipoDoc: { in: requiredDocs } },
      },
    },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">IRPF — Temporada 2026</h1>
        <span className="text-sm text-muted">Prazo: 31/05/2026</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pfClients.map((client) => {
          const received = new Set(client.documents.map((d) => d.tipoDoc));
          const progress = requiredDocs.filter((d) => received.has(d)).length;
          const total = requiredDocs.length;
          const pct = Math.round((progress / total) * 100);
          const complete = progress === total;

          return (
            <div
              key={client.id}
              className={`bg-card border rounded-xl p-5 ${
                complete ? "border-green-800" : "border-card-border"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold truncate">{client.nome}</h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    complete
                      ? "bg-green-900/50 text-green-400"
                      : pct >= 60
                      ? "bg-yellow-900/50 text-yellow-400"
                      : "bg-red-900/50 text-red-400"
                  }`}
                >
                  {pct}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-gray-800 rounded-full mb-4">
                <div
                  className={`h-2 rounded-full transition-all ${
                    complete ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="space-y-1.5">
                {requiredDocs.map((docType) => {
                  const has = received.has(docType);
                  return (
                    <div key={docType} className="flex items-center gap-2 text-xs">
                      <span className={has ? "text-green-400" : "text-gray-600"}>
                        {has ? "\u2713" : "\u25CB"}
                      </span>
                      <span className={has ? "text-gray-300" : "text-muted"}>
                        {docLabels[docType]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {pfClients.length === 0 && (
        <div className="bg-card border border-card-border rounded-xl p-12 text-center">
          <p className="text-muted">Nenhum cliente PF ativo cadastrado.</p>
        </div>
      )}
    </div>
  );
}
