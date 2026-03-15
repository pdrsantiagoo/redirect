"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CampaignWithStats } from "@/lib/types";

export default function AdminDashboard() {
  const [campaigns, setCampaigns] = useState<CampaignWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      const res = await fetch("/api/campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma campanha</h2>
        <p className="text-gray-500 mb-6">Crie sua primeira campanha para começar a dividir tráfego</p>
        <Link
          href="/admin/campaigns/new"
          className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Nova Campanha
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Campanhas</h1>
        <p className="text-gray-500 mt-1">Gerencie seus links de split de tráfego</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => (
          <Link
            key={campaign.slug}
            href={`/admin/campaigns/${campaign.slug}`}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {campaign.name}
              </h3>
              {campaign.winnerId && campaign.winnerId !== "null" ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                  Vencedor
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Dividindo
                </span>
              )}
            </div>

            <p className="text-sm text-gray-500 font-mono mb-3">/{campaign.slug}</p>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                {campaign.destinations.length} destino{campaign.destinations.length !== 1 ? "s" : ""}
              </span>
              <span className="font-medium text-gray-700">
                {campaign.totalClicks.toLocaleString("pt-BR")} clique{campaign.totalClicks !== 1 ? "s" : ""}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
