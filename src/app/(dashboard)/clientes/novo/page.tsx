"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NovoClientePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const body = {
      nome: fd.get("nome"),
      cpfCnpj: fd.get("cpfCnpj"),
      whatsapp: fd.get("whatsapp"),
      email: fd.get("email") || null,
      tipo: fd.get("tipo"),
      observacoes: fd.get("observacoes") || null,
    };

    const res = await fetch("/api/v1/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erro ao cadastrar cliente");
      setLoading(false);
      return;
    }

    router.push("/clientes");
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Novo Cliente</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-card border border-card-border rounded-xl p-6 space-y-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Nome *</label>
            <input
              name="nome"
              required
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary text-white"
              placeholder="Nome completo ou razao social"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">CPF/CNPJ *</label>
            <input
              name="cpfCnpj"
              required
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary text-white"
              placeholder="123.456.789-00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">WhatsApp *</label>
            <input
              name="whatsapp"
              required
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary text-white"
              placeholder="5511999999999"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              name="email"
              type="email"
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary text-white"
              placeholder="email@exemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Tipo *</label>
            <select
              name="tipo"
              required
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary text-white"
            >
              <option value="PF">Pessoa Fisica</option>
              <option value="MEI">MEI</option>
              <option value="PJ_SIMPLES">PJ Simples Nacional</option>
              <option value="PJ_PRESUMIDO">PJ Lucro Presumido</option>
              <option value="PJ_REAL">PJ Lucro Real</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Observacoes</label>
          <textarea
            name="observacoes"
            rows={3}
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary text-white resize-none"
            placeholder="Anotacoes sobre o cliente..."
          />
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Cadastrar"}
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
