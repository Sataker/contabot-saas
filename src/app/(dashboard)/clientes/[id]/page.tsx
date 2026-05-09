import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ClienteDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const tenantId = session!.user.tenantId;

  const cliente = await prisma.client.findFirst({
    where: { id, tenantId },
  });

  if (!cliente) notFound();

  const [documents, pendencias, guias] = await Promise.all([
    prisma.document.findMany({
      where: { tenantId, clientId: id },
      orderBy: { receivedAt: "desc" },
      take: 20,
    }),
    prisma.pendencia.findMany({
      where: { tenantId, clientId: id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.guia.findMany({
      where: { tenantId, clientId: id },
      orderBy: { vencimento: "desc" },
    }),
  ]);

  const statusColors: Record<string, string> = {
    ATIVO: "bg-green-900/50 text-green-400",
    INATIVO: "bg-gray-700/50 text-gray-400",
    PENDENTE_CADASTRO: "bg-yellow-900/50 text-yellow-400",
  };

  const docStatusColors: Record<string, string> = {
    PROCESSADO: "bg-green-900/50 text-green-400",
    REVISAR: "bg-yellow-900/50 text-yellow-400",
    ERRO: "bg-red-900/50 text-red-400",
  };

  const pendStatusColors: Record<string, string> = {
    PENDENTE: "bg-yellow-900/50 text-yellow-400",
    EM_COBRANCA: "bg-orange-900/50 text-orange-400",
    RESOLVIDO: "bg-green-900/50 text-green-400",
    CANCELADO: "bg-gray-700/50 text-gray-400",
  };

  const guiaStatusColors: Record<string, string> = {
    A_ENVIAR: "bg-blue-900/50 text-blue-400",
    ENVIADO: "bg-yellow-900/50 text-yellow-400",
    PAGO: "bg-green-900/50 text-green-400",
    VENCIDO: "bg-red-900/50 text-red-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clientes" className="text-muted hover:text-white transition-colors">&larr; Voltar</Link>
        <h1 className="text-2xl font-bold">{cliente.nome}</h1>
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[cliente.status] || ""}`}>
          {cliente.status}
        </span>
      </div>

      {/* Client Info */}
      <div className="bg-card border border-card-border rounded-xl p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted">CPF/CNPJ</p>
            <p className="text-sm font-medium">{cliente.cpfCnpj}</p>
          </div>
          <div>
            <p className="text-xs text-muted">WhatsApp</p>
            <p className="text-sm font-medium">{cliente.whatsapp}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Email</p>
            <p className="text-sm font-medium">{cliente.email || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Tipo</p>
            <p className="text-sm font-medium">{cliente.tipo}</p>
          </div>
        </div>
        {cliente.observacoes && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-xs text-muted">Observacoes</p>
            <p className="text-sm">{cliente.observacoes}</p>
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="bg-card border border-card-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Documentos ({documents.length})</h2>
        {documents.length === 0 ? (
          <p className="text-muted text-sm">Nenhum documento recebido.</p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <Link href={`/documentos/${doc.id}`} className="text-sm font-medium hover:text-primary">
                    {doc.subtipo || doc.tipoDoc}
                  </Link>
                  <p className="text-xs text-muted">
                    {new Date(doc.receivedAt).toLocaleDateString("pt-BR")}
                    {doc.valor && ` - R$ ${doc.valor}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${docStatusColors[doc.status] || ""}`}>
                    {doc.status}
                  </span>
                  <span className="text-xs text-muted">{Math.round(doc.confianca * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pendencias */}
      <div className="bg-card border border-card-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Pendencias ({pendencias.length})</h2>
        {pendencias.length === 0 ? (
          <p className="text-muted text-sm">Nenhuma pendencia.</p>
        ) : (
          <div className="space-y-2">
            {pendencias.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-sm font-medium">{p.descricao}</p>
                  <p className="text-xs text-muted">
                    {p.prazo ? `Prazo: ${new Date(p.prazo).toLocaleDateString("pt-BR")}` : "Sem prazo"}
                    {` - ${p.tentativas} tentativa(s)`}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${pendStatusColors[p.status] || ""}`}>
                  {p.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guias */}
      <div className="bg-card border border-card-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Guias ({guias.length})</h2>
        {guias.length === 0 ? (
          <p className="text-muted text-sm">Nenhuma guia.</p>
        ) : (
          <div className="space-y-2">
            {guias.map((g) => (
              <div key={g.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-sm font-medium">{g.tipoGuia} - {g.competencia}</p>
                  <p className="text-xs text-muted">
                    Vencimento: {new Date(g.vencimento).toLocaleDateString("pt-BR")} - R$ {g.valor}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${guiaStatusColors[g.status] || ""}`}>
                  {g.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
