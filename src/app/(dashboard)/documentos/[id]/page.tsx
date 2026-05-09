"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type Doc = {
  id: string;
  tipoDoc: string;
  subtipo: string | null;
  valor: string | null;
  competencia: string | null;
  cnpjEmissor: string | null;
  nomeEmissor: string | null;
  driveUrl: string | null;
  confianca: number;
  status: string;
  resumo: string | null;
  receivedAt: string;
  client: { id: string; nome: string } | null;
};

const tipoOptions = [
  "informe_rendimento", "nota_fiscal", "recibo_medico", "recibo_educacao",
  "extrato_bancario", "guia_tributo", "comprovante_pagamento", "contrato",
  "holerite", "certidao", "procuracao", "outro",
];

export default function DocumentoDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ tipoDoc: "", subtipo: "", status: "" });

  useEffect(() => {
    fetch(`/api/v1/documentos/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setDoc(d);
        setForm({ tipoDoc: d.tipoDoc, subtipo: d.subtipo || "", status: d.status });
      });
  }, [params.id]);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/v1/documentos/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
    const r = await fetch(`/api/v1/documentos/${params.id}`);
    setDoc(await r.json());
  }

  if (!doc) return <div className="p-6 text-muted">Carregando...</div>;

  const confiancaColor = doc.confianca >= 0.7 ? "text-green-400" : doc.confianca >= 0.5 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/documentos" className="text-muted hover:text-white transition-colors">&larr; Voltar</Link>
        <h1 className="text-2xl font-bold">Documento</h1>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{doc.subtipo || doc.tipoDoc}</h2>
            <p className="text-sm text-muted">
              {doc.client?.nome || "Sem cliente"} &middot;{" "}
              {new Date(doc.receivedAt).toLocaleString("pt-BR")}
            </p>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            {editing ? "Cancelar" : "Editar"}
          </button>
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted mb-1">Tipo</label>
              <select
                value={form.tipoDoc}
                onChange={(e) => setForm({ ...form, tipoDoc: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white"
              >
                {tipoOptions.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">Subtipo</label>
              <input
                value={form.subtipo}
                onChange={(e) => setForm({ ...form, subtipo: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white"
              >
                <option value="PROCESSADO">Processado</option>
                <option value="REVISAR">Revisar</option>
                <option value="ERRO">Erro</option>
              </select>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted">Tipo</p>
              <p className="text-sm font-medium">{doc.tipoDoc.replace(/_/g, " ")}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Status</p>
              <p className="text-sm font-medium">{doc.status}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Confianca IA</p>
              <p className={`text-sm font-bold ${confiancaColor}`}>{Math.round(doc.confianca * 100)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted">Valor</p>
              <p className="text-sm font-medium">{doc.valor ? `R$ ${doc.valor}` : "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Competencia</p>
              <p className="text-sm font-medium">{doc.competencia || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Emissor</p>
              <p className="text-sm font-medium">{doc.nomeEmissor || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted">CNPJ Emissor</p>
              <p className="text-sm font-medium">{doc.cnpjEmissor || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Drive</p>
              {doc.driveUrl ? (
                <a href={doc.driveUrl} target="_blank" className="text-sm text-primary hover:underline">
                  Abrir no Drive
                </a>
              ) : (
                <p className="text-sm text-muted">-</p>
              )}
            </div>
          </div>
        )}

        {doc.resumo && (
          <div className="pt-4 border-t border-gray-800">
            <p className="text-xs text-muted mb-1">Resumo da IA</p>
            <p className="text-sm">{doc.resumo}</p>
          </div>
        )}
      </div>
    </div>
  );
}
