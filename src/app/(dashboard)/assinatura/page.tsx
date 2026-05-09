"use client";

import { useEffect, useState } from "react";

type TenantInfo = {
  tenant: {
    nome: string;
    plano: string;
    status: string;
  };
};

const planos = [
  { id: "BASICO", nome: "Basico", preco: "R$ 500/mes", features: ["Ate 50 clientes", "Intake de documentos", "Q&A Bot", "Guias automaticas"] },
  { id: "PROFISSIONAL", nome: "Profissional", preco: "R$ 700/mes", features: ["Ate 150 clientes", "Tudo do Basico", "IRPF automatizado", "Relatorios avancados"] },
  { id: "ENTERPRISE", nome: "Enterprise", preco: "R$ 900/mes", features: ["Clientes ilimitados", "Tudo do Profissional", "API dedicada", "Suporte prioritario"] },
];

export default function AssinaturaPage() {
  const [info, setInfo] = useState<TenantInfo | null>(null);

  useEffect(() => {
    fetch("/api/v1/config").then((r) => r.json()).then(setInfo);
  }, []);

  if (!info) return <div className="p-6 text-muted">Carregando...</div>;

  const statusColors: Record<string, string> = {
    ATIVO: "bg-green-900/50 text-green-400",
    TRIAL: "bg-yellow-900/50 text-yellow-400",
    SUSPENSO: "bg-red-900/50 text-red-400",
    CANCELADO: "bg-gray-700/50 text-gray-400",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Assinatura</h1>

      <div className="bg-card border border-card-border rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">Plano atual</p>
            <p className="text-xl font-bold">{info.tenant.plano}</p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full ${statusColors[info.tenant.status] || ""}`}>
            {info.tenant.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {planos.map((plano) => (
          <div
            key={plano.id}
            className={`bg-card border rounded-xl p-6 ${
              info.tenant.plano === plano.id ? "border-primary" : "border-card-border"
            }`}
          >
            <h3 className="text-lg font-semibold mb-1">{plano.nome}</h3>
            <p className="text-2xl font-bold text-primary mb-4">{plano.preco}</p>
            <ul className="space-y-2">
              {plano.features.map((f) => (
                <li key={f} className="text-sm text-muted flex items-center gap-2">
                  <span className="text-green-400">{"\u2713"}</span> {f}
                </li>
              ))}
            </ul>
            <button
              className={`w-full mt-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                info.tenant.plano === plano.id
                  ? "bg-gray-700 text-gray-400 cursor-default"
                  : "bg-primary hover:bg-primary-hover text-white"
              }`}
              disabled={info.tenant.plano === plano.id}
            >
              {info.tenant.plano === plano.id ? "Plano Atual" : "Assinar"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
