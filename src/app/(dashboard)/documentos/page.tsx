import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DocumentosPage() {
  const session = await auth();
  const tenantId = session!.user.tenantId;

  const docs = await prisma.document.findMany({
    where: { tenantId },
    orderBy: { receivedAt: "desc" },
    include: { client: true },
    take: 50,
  });

  const confiancaColor = (c: number) =>
    c >= 0.7 ? "text-green-400" : c >= 0.5 ? "text-yellow-400" : "text-red-400";

  const statusColors: Record<string, string> = {
    PROCESSADO: "bg-green-900/50 text-green-400",
    REVISAR: "bg-yellow-900/50 text-yellow-400",
    ERRO: "bg-red-900/50 text-red-400",
  };

  const tipoIcons: Record<string, string> = {
    informe_rendimento: "IR",
    nota_fiscal: "NF",
    recibo_medico: "RM",
    recibo_educacao: "RE",
    extrato_bancario: "EB",
    guia_tributo: "GT",
    comprovante_pagamento: "CP",
    contrato: "CT",
    holerite: "HL",
    certidao: "CE",
    procuracao: "PR",
    outro: "??",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Documentos</h1>
        <div className="flex items-center gap-2 text-sm text-muted">
          <span>{docs.length} documentos</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {docs.map((doc) => (
          <Link
            key={doc.id}
            href={`/documentos/${doc.id}`}
            className="bg-card border border-card-border rounded-xl p-5 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                {tipoIcons[doc.tipoDoc] || "??"}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[doc.status] || ""}`}>
                {doc.status === "PROCESSADO" ? "OK" : doc.status === "REVISAR" ? "Revisar" : "Erro"}
              </span>
            </div>
            <h3 className="text-sm font-medium mb-1 truncate">{doc.subtipo || doc.tipoDoc}</h3>
            <p className="text-xs text-muted mb-2">{doc.client?.nome || "Sem cliente vinculado"}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">
                {new Date(doc.receivedAt).toLocaleDateString("pt-BR")}
              </span>
              <span className={`text-xs font-medium ${confiancaColor(doc.confianca)}`}>
                {Math.round(doc.confianca * 100)}% confianca
              </span>
            </div>
            {doc.valor && (
              <p className="text-sm font-medium mt-2">R$ {doc.valor}</p>
            )}
          </Link>
        ))}
      </div>

      {docs.length === 0 && (
        <div className="bg-card border border-card-border rounded-xl p-12 text-center">
          <p className="text-muted">Nenhum documento recebido ainda.</p>
          <p className="text-sm text-muted mt-2">
            Documentos aparecerao aqui quando clientes enviarem pelo WhatsApp.
          </p>
        </div>
      )}
    </div>
  );
}
