import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/dashboard/stats-cards";

export default async function DashboardPage() {
  const session = await auth();
  const tenantId = session!.user.tenantId;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalClientes,
    docsThisMonth,
    pendenciasAbertas,
    guiasAEnviar,
    docsRevisar,
    recentDocs,
    recentActivity,
  ] = await Promise.all([
    prisma.client.count({ where: { tenantId, status: "ATIVO" } }),
    prisma.document.count({ where: { tenantId, receivedAt: { gte: startOfMonth } } }),
    prisma.pendencia.count({ where: { tenantId, status: { in: ["PENDENTE", "EM_COBRANCA"] } } }),
    prisma.guia.count({ where: { tenantId, status: "A_ENVIAR" } }),
    prisma.document.count({ where: { tenantId, status: "REVISAR" } }),
    prisma.document.findMany({
      where: { tenantId },
      orderBy: { receivedAt: "desc" },
      take: 5,
      include: { client: true },
    }),
    prisma.activityLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const guiasVencendo = await prisma.guia.count({
    where: {
      tenantId,
      status: { in: ["A_ENVIAR", "ENVIADO"] },
      vencimento: {
        lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        gte: now,
      },
    },
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Clientes Ativos" value={totalClientes} color="primary" />
        <StatCard
          title="Documentos no Mes"
          value={docsThisMonth}
          subtitle={docsRevisar > 0 ? `${docsRevisar} para revisar` : undefined}
          color="info"
        />
        <StatCard title="Pendencias Abertas" value={pendenciasAbertas} color="warning" />
        <StatCard
          title="Guias a Enviar"
          value={guiasAEnviar}
          subtitle={guiasVencendo > 0 ? `${guiasVencendo} vencendo em 3 dias` : undefined}
          color={guiasVencendo > 0 ? "danger" : "success"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Documents */}
        <div className="bg-card border border-card-border rounded-xl p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4">Documentos Recentes</h2>
          <div className="space-y-3">
            {recentDocs.length === 0 && (
              <p className="text-muted text-sm">Nenhum documento recebido ainda.</p>
            )}
            {recentDocs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-sm font-medium">{doc.subtipo || doc.tipoDoc}</p>
                  <p className="text-xs text-muted">
                    {doc.client?.nome || "Sem cliente"} &middot;{" "}
                    {new Date(doc.receivedAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      doc.status === "PROCESSADO"
                        ? "bg-green-900/50 text-green-400"
                        : doc.status === "REVISAR"
                        ? "bg-yellow-900/50 text-yellow-400"
                        : "bg-red-900/50 text-red-400"
                    }`}
                  >
                    {doc.status === "PROCESSADO" ? "OK" : doc.status === "REVISAR" ? "Revisar" : "Erro"}
                  </span>
                  <span className="text-xs text-muted">{Math.round(doc.confianca * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-card-border rounded-xl p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4">Atividade Recente</h2>
          <div className="space-y-3">
            {recentActivity.length === 0 && (
              <p className="text-muted text-sm">Nenhuma atividade registrada ainda.</p>
            )}
            {recentActivity.map((log) => (
              <div key={log.id} className="flex items-start gap-3 py-2 border-b border-gray-800 last:border-0">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm">
                    <span className="font-medium">{log.action}</span>{" "}
                    <span className="text-muted">{log.entityType}</span>
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(log.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
