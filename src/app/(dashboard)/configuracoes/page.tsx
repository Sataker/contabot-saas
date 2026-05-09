"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

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
    driveEmail: string | null;
  };
  config: {
    horario_inicio: string;
    horario_fim: string;
    intervalo_lembrete_dias: number;
    max_tentativas_lembrete: number;
  };
};

export default function ConfiguracoesPage() {
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<Config | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [whatsappStatus, setWhatsappStatus] = useState<"checking" | "connected" | "disconnected" | null>(null);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveMessage, setDriveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
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
        setWhatsappStatus(data.tenant.uazapiConnected ? "connected" : "disconnected");
      });

    // Check drive OAuth callback result
    const driveStatus = searchParams.get("drive");
    if (driveStatus === "success") {
      setDriveMessage({ type: "success", text: "Google Drive conectado com sucesso!" });
    } else if (driveStatus === "error") {
      const reason = searchParams.get("reason") || "unknown";
      const messages: Record<string, string> = {
        not_configured: "OAuth do Google nao configurado no servidor. Adicione GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env",
        token_exchange: "Falha ao trocar codigo por token. Tente novamente.",
        missing_params: "Parametros ausentes no callback.",
        access_denied: "Acesso negado. Voce precisa autorizar o acesso ao Drive.",
      };
      setDriveMessage({ type: "error", text: messages[reason] || `Erro na conexao: ${reason}` });
    }
  }, [searchParams]);

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

  const fetchQrCode = useCallback(async () => {
    setQrLoading(true);
    setQrError(null);
    setQrCode(null);
    try {
      const res = await fetch("/api/v1/whatsapp");
      const data = await res.json();
      if (!res.ok) {
        setQrError(data.error || "Erro ao buscar QR Code");
        return;
      }
      // UazAPI returns { qrcode: "base64..." } or { qr: "base64..." }
      const qr = data.qrcode || data.qr || data.base64 || null;
      if (qr) {
        setQrCode(qr.startsWith("data:") ? qr : `data:image/png;base64,${qr}`);
      } else {
        setQrError("QR Code nao disponivel. O WhatsApp ja pode estar conectado.");
      }
    } catch {
      setQrError("Falha na conexao com a API");
    } finally {
      setQrLoading(false);
    }
  }, []);

  async function checkWhatsappStatus() {
    setWhatsappStatus("checking");
    try {
      const res = await fetch("/api/v1/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status" }),
      });
      const data = await res.json();
      setWhatsappStatus(data.connected ? "connected" : "disconnected");
      if (data.connected) {
        setQrCode(null);
      }
    } catch {
      setWhatsappStatus("disconnected");
    }
  }

  async function connectGoogleDrive() {
    setDriveLoading(true);
    setDriveMessage(null);
    try {
      const res = await fetch("/api/v1/drive/auth");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setDriveMessage({ type: "error", text: data.error || "Erro ao iniciar conexao" });
        setDriveLoading(false);
      }
    } catch {
      setDriveMessage({ type: "error", text: "Falha na conexao com o servidor" });
      setDriveLoading(false);
    }
  }

  async function disconnectGoogleDrive() {
    try {
      await fetch("/api/v1/drive/disconnect", { method: "POST" });
      setConfig((prev) =>
        prev ? { ...prev, tenant: { ...prev.tenant, driveEmail: null, driveRootFolderId: null } } : prev
      );
      setDriveMessage({ type: "success", text: "Google Drive desconectado" });
    } catch {
      setDriveMessage({ type: "error", text: "Erro ao desconectar" });
    }
  }

  async function disconnectWhatsapp() {
    await fetch("/api/v1/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "disconnect" }),
    });
    setWhatsappStatus("disconnected");
    setQrCode(null);
  }

  if (!config) return <div className="p-6 text-muted">Carregando...</div>;

  const statusBadge = {
    connected: "bg-green-900/50 text-green-400",
    disconnected: "bg-red-900/50 text-red-400",
    checking: "bg-yellow-900/50 text-yellow-400",
  };

  const statusLabel = {
    connected: "Conectado",
    disconnected: "Desconectado",
    checking: "Verificando...",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Configuracoes</h1>

      {/* WhatsApp Connection with QR Code */}
      <div className="bg-card border border-card-border rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <h2 className="text-lg font-semibold">WhatsApp</h2>
          {whatsappStatus && (
            <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${statusBadge[whatsappStatus]}`}>
              {statusLabel[whatsappStatus]}
            </span>
          )}
        </div>

        {/* UazAPI credentials */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
          <div>
            <label className="block text-xs sm:text-sm text-muted mb-1">Base URL</label>
            <input
              value={form.uazapiBaseUrl}
              onChange={(e) => setForm({ ...form, uazapiBaseUrl: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
              placeholder="https://spark.uazapi.com"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm text-muted mb-1">Token</label>
            <input
              value={form.uazapiToken}
              onChange={(e) => setForm({ ...form, uazapiToken: e.target.value })}
              type="password"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm text-muted mb-1">Instancia</label>
            <input
              value={form.uazapiInstance}
              onChange={(e) => setForm({ ...form, uazapiInstance: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
            />
          </div>
        </div>

        {/* QR Code area */}
        <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
          {whatsappStatus === "connected" ? (
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 text-green-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg font-medium">WhatsApp conectado</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  onClick={checkWhatsappStatus}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                >
                  Verificar Status
                </button>
                <button
                  onClick={disconnectWhatsapp}
                  className="px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-400 rounded-lg text-sm transition-colors"
                >
                  Desconectar
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-3">
              {qrCode ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted">Escaneie o QR Code com o WhatsApp</p>
                  <div className="inline-block p-3 bg-white rounded-xl">
                    <img src={qrCode} alt="QR Code WhatsApp" className="w-48 h-48 sm:w-64 sm:h-64" />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                      onClick={fetchQrCode}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                    >
                      Atualizar QR Code
                    </button>
                    <button
                      onClick={checkWhatsappStatus}
                      className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm transition-colors"
                    >
                      Ja escaneei
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 py-4">
                  {qrError && (
                    <p className="text-sm text-red-400">{qrError}</p>
                  )}
                  <p className="text-sm text-muted">
                    {form.uazapiToken ? "Clique para gerar o QR Code de conexao" : "Preencha as credenciais da UazAPI acima e salve antes de conectar"}
                  </p>
                  <button
                    onClick={fetchQrCode}
                    disabled={qrLoading || !form.uazapiToken}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {qrLoading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Gerando...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.397 0-4.612-.738-6.453-1.998l-.452-.31-2.966.994.994-2.966-.31-.452A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                        </svg>
                        Conectar WhatsApp
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Google Drive */}
      <div className="bg-card border border-card-border rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <h2 className="text-lg font-semibold">Google Drive</h2>
          {config.tenant.driveEmail ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/50 text-green-400 w-fit">Conectado</span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-400 w-fit">Nao conectado</span>
          )}
        </div>

        {driveMessage && (
          <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm ${
            driveMessage.type === "success" ? "bg-green-900/30 text-green-400 border border-green-800" : "bg-red-900/30 text-red-400 border border-red-800"
          }`}>
            {driveMessage.text}
          </div>
        )}

        {config.tenant.driveEmail ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
              <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{config.tenant.driveEmail}</p>
                <p className="text-xs text-muted truncate">Pasta: ContaBot - Documentos</p>
              </div>
            </div>
            <button
              onClick={disconnectGoogleDrive}
              className="px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-400 rounded-lg text-sm transition-colors"
            >
              Desconectar Google Drive
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Conecte sua conta Google para salvar documentos automaticamente no Drive.
            </p>
            <button
              onClick={connectGoogleDrive}
              disabled={driveLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-5 py-2.5 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-lg transition-colors border border-gray-300 disabled:opacity-50"
            >
              {driveLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Conectando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Entrar com Google
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Escritorio */}
      <div className="bg-card border border-card-border rounded-xl p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4">Escritorio</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm text-muted mb-1">Nome do Contador</label>
            <input
              value={form.contadorNome}
              onChange={(e) => setForm({ ...form, contadorNome: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm text-muted mb-1">WhatsApp do Contador</label>
            <input
              value={form.contadorWhatsapp}
              onChange={(e) => setForm({ ...form, contadorWhatsapp: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Behavior */}
      <div className="bg-card border border-card-border rounded-xl p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4">Comportamento</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm text-muted mb-1">Horario Inicio</label>
            <input
              type="time"
              value={form.horario_inicio}
              onChange={(e) => setForm({ ...form, horario_inicio: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm text-muted mb-1">Horario Fim</label>
            <input
              type="time"
              value={form.horario_fim}
              onChange={(e) => setForm({ ...form, horario_fim: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm text-muted mb-1">Lembrete (dias)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={form.intervalo_lembrete_dias}
              onChange={(e) => setForm({ ...form, intervalo_lembrete_dias: parseInt(e.target.value) })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm text-muted mb-1">Max Tentativas</label>
            <input
              type="number"
              min={1}
              max={10}
              value={form.max_tentativas_lembrete}
              onChange={(e) => setForm({ ...form, max_tentativas_lembrete: parseInt(e.target.value) })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pb-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar Configuracoes"}
        </button>
        {saved && <span className="text-sm text-green-400 text-center sm:text-left">Salvo com sucesso!</span>}
      </div>
    </div>
  );
}
