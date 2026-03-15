"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DestinationInput {
  name: string;
  url: string;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [destinations, setDestinations] = useState<DestinationInput[]>([
    { name: "", url: "" },
    { name: "", url: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) {
      setSlug(
        value
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  }

  function updateDestination(index: number, field: keyof DestinationInput, value: string) {
    const updated = [...destinations];
    updated[index] = { ...updated[index], [field]: value };
    setDestinations(updated);
  }

  function addDestination() {
    setDestinations([...destinations, { name: "", url: "" }]);
  }

  function removeDestination(index: number) {
    if (destinations.length <= 2) return;
    setDestinations(destinations.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate
    const validDestinations = destinations.filter((d) => d.url.trim());
    if (validDestinations.length < 2) {
      setError("Adicione pelo menos 2 URLs de destino");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          destinations: validDestinations.map((d, i) => ({
            url: d.url.trim(),
            name: d.name.trim() || `Destino ${i + 1}`,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao criar campanha");
        return;
      }

      router.push(`/admin/campaigns/${slug}`);
    } catch {
      setError("Erro ao criar campanha");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nova Campanha</h1>
        <p className="text-gray-500 mt-1">Configure um novo link de split de tráfego</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campaign Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome da campanha
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Ex: Campanha Saúde"
              required
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
              Slug (URL)
            </label>
            <div className="flex items-center">
              <span className="text-gray-400 text-sm mr-1">seudominio.com/</span>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                  setSlugEdited(true);
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                placeholder="saude"
                required
              />
            </div>
          </div>
        </div>

        {/* Destinations */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            URLs de Destino
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            O tráfego será dividido igualmente entre todos os destinos ({destinations.length} destinos = {(100 / destinations.length).toFixed(1)}% cada)
          </p>

          <div className="space-y-3">
            {destinations.map((dest, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-shrink-0 w-8 h-10 flex items-center justify-center text-sm font-medium text-gray-400">
                  {index + 1}.
                </div>
                <input
                  type="text"
                  value={dest.name}
                  onChange={(e) => updateDestination(index, "name", e.target.value)}
                  className="w-36 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  placeholder={`Destino ${index + 1}`}
                />
                <input
                  type="url"
                  value={dest.url}
                  onChange={(e) => updateDestination(index, "url", e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  placeholder="https://exemplo.com/pagina"
                  required
                />
                {destinations.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeDestination(index)}
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addDestination}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Adicionar mais um destino
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
          >
            {loading ? "Criando..." : "Criar Campanha"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700 px-4 py-2.5 font-medium transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
