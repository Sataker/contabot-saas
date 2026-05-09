"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

type ClientOption = { id: string; nome: string; cpfCnpj: string };

export default function NovaGuiaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clientes, setClientes] = useState<ClientOption[]>([]);

  useEffect(() => {
    fetch("/api/v1/clientes")
      .then((r) => r.json())
      .then((data) => setClientes(data));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const body = {
      clientId: fd.get("clientId"),
      tipoGuia: fd.get("tipoGuia"),
      competencia: fd.get("competencia"),
      vencimento: fd.get("vencimento"),
      valor: fd.get("valor"),
      codigoBarras: fd.get("codigoBarras") || null,
    };

    const res = await fetch("/api/v1/guias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erro ao criar guia");
      setLoading(false);
      return;
    }

    router.push("/guias");
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Nova Guia de Pagamento</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-card border border-card-border rounded-xl p-6 space-y-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Cliente *</label>
            <select
              name="clientId"
              required
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white"
            >
              <option value="">Selecione...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} ({c.cpfCnpj})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Tipo *</label>
            <select
              name="tipoGuia"
              required
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white"
            >
              <option value="DAS">DAS</option>
              <option value="DARF">DARF</option>
              <option value="ISS">ISS</option>
              <option value="GPS">GPS</option>
              <option value="FGTS">FGTS</option>
              <option value="IPTU">IPTU</option>
              <option value="IPVA">IPVA</option>
              <option value="IRPF">IRPF</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Competencia *</label>
            <input
              name="competencia"
              required
              placeholder="05/2026"
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Vencimento *</label>
            <input
              name="vencimento"
              type="date"
              required
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Valor *</label>
            <input
              name="valor"
              required
              placeholder="1.234,56"
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Codigo de Barras</label>
          <input
            name="codigoBarras"
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white"
            placeholder="Linha digitavel do boleto"
          />
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Criar Guia"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
