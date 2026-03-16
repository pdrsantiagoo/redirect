"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

export default function RedirectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function doRedirect() {
      try {
        // Build query string to forward UTMs
        const queryString = searchParams.toString();
        const apiUrl = `/api/go/${slug}${queryString ? `?${queryString}` : ""}`;

        const res = await fetch(apiUrl);
        const data = await res.json();

        if (data.error) {
          setError(data.error);
          return;
        }

        // Wait a moment for UTMify scripts to capture UTMs before redirecting
        setTimeout(() => {
          window.location.href = data.url;
        }, 800);
      } catch {
        setError("Erro ao redirecionar");
      }
    }

    doRedirect();
  }, [slug, searchParams]);

  if (error) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontFamily: "sans-serif",
        color: "#666"
      }}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      fontFamily: "sans-serif",
      color: "#999"
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 32,
          height: 32,
          border: "3px solid #e5e7eb",
          borderTop: "3px solid #3b82f6",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 12px"
        }} />
        <p>Redirecionando...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  );
}
