"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type Config = {
  tenant: {
    id: string;
    nome: string;
    cnpj: string;
    contadorNome: string;
    contadorWhatsapp: string;
    apiKey: string;
    uazapiBaseUrl: string | null;
    uazapiToken: string | null;
    uazapiInstance: string | null;
    uazapiConnected: boolean;
    driveRootFolderId: string | null;
  };
  config: {
    horario_inicio: string;
    horario_fim: string;
    intervalo_lembrete_dias: number;
    max_tentativas_lembrete: number;
  };
};

export default function ConfiguracoesPage() {
  const { data: session } = useSession();
  const [config, setConfig] = useState<Config | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    contadorNome: "",
    contadorWhatsapp: "",
    uazapiBaseUrl: "",
    uazapiToken: "",
    uazapiInstance: "",
    driveRootFolderId: "",
    horario_inicio: "08:00",
    horario_fim: "18:00",
    intervalo_lembrete_dias: 3,
    max_tentativas_lembrete: 3,
  });

  useEffect(() => {
    fetch("/api/v1/config")
      .then((r) => r.json())
      .then((data: Config) => {
        setConfig(data);
        setForm({
          contadorNome: data.tenant.contadorNome || "",
          contadorWhatsapp: data.tenant.contadorWhatsapp || "",
          uazapiBaseUrl: data.tenant.uazapiBaseUrl || "https://spark.uazapi.com",
          uazapiToken: data.tenant.uazapiToken || "",
          uazapiInstance: data.tenant.uazapiInstance || "",
          driveRootFolderId: data.tenant.driveRootFolderId || "",
          horario_inicio: data.config.horario_inicio || "08:00",
          horario_fim: data.config.horario_fim || "18:00",
          intervalo_lembrete_dias: data.config.intervalo_lembrete_dias || 3,
          max_tentativas_lembrete: data.config.max_tentativas_lembrete || 3,
        });
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/v1/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (!config) return <div className="p-6 text-muted">Carregando...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Configuracoes</h1>

      {/* API Key */}
      <div className="bg-card border border-card-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">API Key (n8n)</h2>
        <p className="text-xs text-muted mb-2">Use esta chave nos workflows do n8n para autenticar.</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm font-mono text-primary">
            {config.tenant.apiKey}
          </code>
          <button
            onClick={() => navigator.clipboard.writeText(config.tenant.apiKey)}
            className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
          >
            Copiar
          </button>
        </div>
      </div>

      {/* WhatsApp Connection */}
      <div className="bg-card border border-card-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">WhatsApp (UazAPI)</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full ${config.tenant.uazapiConnected ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>
            {config.tenant.uazapiConnected ? "Conectado" : "Desconectado"}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-muted mb-1">Base URL</label>
            <input
              value={form.uazapiBaseUrl}
              onChange={(e) => setForm({ ...form, uazapiBaseUrl: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Token</label>
            <input
              value={form.uazapiToken}
              onChange={(e) => setForm({ ...form, uazapiToken: e.target.value })}
              type="password"
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Instancia</label>
            <input
              value={form.uazapiInstance}
              onChange={(e) => setForm({ ...form, uazapiInstance: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Google Drive */}
      <div className="bg-card border border-card-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Google Drive</h2>
        <div>
          <label className="block text-sm text-muted mb-1">ID da Pasta Raiz</label>
          <input
            value={form.driveRootFolderId}
            onChange={(e) => setForm({ ...form, driveRootFolderId: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
            placeholder="1abc123def..."
          />
        </div>
      </div>

      {/* Escritorio */}
      <div className="bg-card border border-card-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Escritorio</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-muted mb-1">Nome do Contador</label>
            <input
              value={form.contadorNome}
              onChange={(e) => setForm({ ...form, contadorNome: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">WhatsApp do Contador</label>
            <input
              value={form.contadorWhatsapp}
              onChange={(e) => setForm({ ...form, contadorWhatsapp: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Behavior */}
      <div className="bg-card border border-card-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Comportamento</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-muted mb-1">Horario Inicio</label>
            <input
              type="time"
              value={form.horario_inicio}
              onChange={(e) => setForm({ ...form, horario_inicio: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Horario Fim</label>
            <input
              type="time"
              value={form.horario_fim}
              onChange={(e) => setForm({ ...form, horario_fim: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Intervalo Lembrete (dias)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={form.intervalo_lembrete_dias}
              onChange={(e) => setForm({ ...form, intervalo_lembrete_dias: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Max Tentativas</label>
            <input
              type="number"
              min={1}
              max={10}
              value={form.max_tentativas_lembrete}
              onChange={(e) => setForm({ ...form, max_tentativas_lembrete: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar Configuracoes"}
        </button>
        {saved && <span className="text-sm text-green-400">Salvo com sucesso!</span>}
      </div>
    </div>
  );
}
