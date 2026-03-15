"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { CampaignWithStats, DestinationWithClicks } from "@/lib/types";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [campaign, setCampaign] = useState<CampaignWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Add destination form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDestName, setNewDestName] = useState("");
  const [newDestUrl, setNewDestUrl] = useState("");

  const fetchCampaign = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setCampaign(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchCampaign();
    // Auto-refresh stats every 10 seconds
    const interval = setInterval(fetchCampaign, 10000);
    return () => clearInterval(interval);
  }, [fetchCampaign]);

  async function handleSetWinner(destId: string) {
    setActionLoading(`winner-${destId}`);
    await fetch(`/api/campaigns/${slug}/winner`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destId }),
    });
    await fetchCampaign();
    setActionLoading(null);
  }

  async function handleClearWinner() {
    setActionLoading("clear-winner");
    await fetch(`/api/campaigns/${slug}/winner`, { method: "DELETE" });
    await fetchCampaign();
    setActionLoading(null);
  }

  async function handleRemoveDestination(destId: string) {
    if (!confirm("Tem certeza que deseja remover este destino?")) return;
    setActionLoading(`remove-${destId}`);
    await fetch(`/api/campaigns/${slug}/destinations?id=${destId}`, {
      method: "DELETE",
    });
    await fetchCampaign();
    setActionLoading(null);
  }

  async function handleAddDestination(e: React.FormEvent) {
    e.preventDefault();
    if (!newDestUrl.trim()) return;
    setActionLoading("add");
    await fetch(`/api/campaigns/${slug}/destinations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: newDestUrl.trim(), name: newDestName.trim() }),
    });
    setNewDestName("");
    setNewDestUrl("");
    setShowAddForm(false);
    await fetchCampaign();
    setActionLoading(null);
  }

  async function handleDeleteCampaign() {
    if (!confirm("Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.")) return;
    await fetch(`/api/campaigns/${slug}`, { method: "DELETE" });
    router.push("/admin");
  }

  async function handleResetStats() {
    if (!confirm("Tem certeza que deseja zerar todas as estatísticas?")) return;
    setActionLoading("reset");
    await fetch(`/api/campaigns/${slug}/reset`, { method: "POST" });
    await fetchCampaign();
    setActionLoading(null);
  }

  function copyLink() {
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-900">Campanha não encontrada</h2>
      </div>
    );
  }

  const hasWinner = campaign.winnerId && campaign.winnerId !== "null";
  const winnerDest = hasWinner
    ? campaign.destinations.find((d) => d.id === campaign.winnerId)
    : null;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <code className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-mono">
              {typeof window !== "undefined" ? window.location.origin : ""}/{slug}
            </code>
            <button
              onClick={copyLink}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Copiar
            </button>
          </div>
        </div>
      </div>

      {/* Winner Status */}
      <div className={`rounded-xl border p-4 mb-6 ${
        hasWinner
          ? "bg-orange-50 border-orange-200"
          : "bg-green-50 border-green-200"
      }`}>
        {hasWinner ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-orange-800">
                100% do tráfego indo para: {winnerDest?.name || "Destino"}
              </p>
              <p className="text-sm text-orange-600 mt-0.5">
                {winnerDest?.url}
              </p>
            </div>
            <button
              onClick={handleClearWinner}
              disabled={actionLoading === "clear-winner"}
              className="bg-white text-orange-700 border border-orange-300 px-4 py-2 rounded-lg hover:bg-orange-100 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {actionLoading === "clear-winner" ? "..." : "Voltar a Dividir"}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <p className="font-medium text-green-800">
              Dividindo tráfego igualmente entre {campaign.destinations.length} destinos
              ({(100 / campaign.destinations.length).toFixed(1)}% cada)
            </p>
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Estatísticas
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-900">
              {campaign.totalClicks.toLocaleString("pt-BR")}
            </span>
            <span className="text-gray-500 text-sm">cliques totais</span>
          </div>
        </div>

        {/* Destinations table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">
                  Destino
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">
                  URL
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">
                  Cliques
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">
                  %
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {campaign.destinations.map((dest: DestinationWithClicks) => {
                const pct = campaign.totalClicks > 0
                  ? ((dest.clicks / campaign.totalClicks) * 100).toFixed(1)
                  : "0.0";
                const isWinner = campaign.winnerId === dest.id;

                return (
                  <tr key={dest.id} className={isWinner ? "bg-orange-50" : ""}>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{dest.name}</span>
                        {isWinner && (
                          <span className="text-xs bg-orange-200 text-orange-700 px-1.5 py-0.5 rounded font-medium">
                            VENCEDOR
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <a
                        href={dest.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 truncate max-w-xs block"
                      >
                        {dest.url}
                      </a>
                    </td>
                    <td className="py-3 pr-4 text-right font-medium text-gray-900">
                      {dest.clicks.toLocaleString("pt-BR")}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!isWinner && (
                          <button
                            onClick={() => handleSetWinner(dest.id)}
                            disabled={actionLoading === `winner-${dest.id}`}
                            className="text-xs text-orange-600 hover:text-orange-700 font-medium px-2 py-1 hover:bg-orange-50 rounded transition-colors disabled:opacity-50"
                            title="Enviar 100% do tráfego para este destino"
                          >
                            {actionLoading === `winner-${dest.id}` ? "..." : "100%"}
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveDestination(dest.id)}
                          disabled={actionLoading === `remove-${dest.id}` || campaign.destinations.length <= 1}
                          className="text-xs text-red-500 hover:text-red-600 px-2 py-1 hover:bg-red-50 rounded transition-colors disabled:opacity-30"
                          title="Remover destino"
                        >
                          {actionLoading === `remove-${dest.id}` ? "..." : "Remover"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Add destination */}
        {showAddForm ? (
          <form onSubmit={handleAddDestination} className="mt-4 flex gap-2 items-end border-t border-gray-100 pt-4">
            <input
              type="text"
              value={newDestName}
              onChange={(e) => setNewDestName(e.target.value)}
              className="w-36 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              placeholder="Nome"
            />
            <input
              type="url"
              value={newDestUrl}
              onChange={(e) => setNewDestUrl(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              placeholder="https://exemplo.com/pagina"
              required
            />
            <button
              type="submit"
              disabled={actionLoading === "add"}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {actionLoading === "add" ? "..." : "Adicionar"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600 px-2 py-2 text-sm"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Adicionar destino
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleResetStats}
          disabled={actionLoading === "reset"}
          className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors disabled:opacity-50"
        >
          {actionLoading === "reset" ? "Zerando..." : "Zerar estatísticas"}
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={handleDeleteCampaign}
          className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors"
        >
          Excluir campanha
        </button>
      </div>
    </div>
  );
}
