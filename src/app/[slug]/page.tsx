"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function RedirectPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function doRedirect() {
      try {
        // Use window.location.search directly - more reliable than useSearchParams
        const fullSearch = window.location.search;
        const apiUrl = `/api/go/${slug}${fullSearch}`;

        const res = await fetch(apiUrl);
        const data = await res.json();

        if (data.error) {
          setError(data.error);
          return;
        }

        // Wait for UTMify scripts to capture UTMs before redirecting
        setTimeout(() => {
          // Let UTMify append its params to the destination URL
          const destUrl = new URL(data.url);

          // Also grab all current URL params and force-append to destination
          const currentParams = new URLSearchParams(window.location.search);
          currentParams.forEach((value, key) => {
            if (!destUrl.searchParams.has(key)) {
              destUrl.searchParams.set(key, value);
            }
          });

          window.location.href = destUrl.toString();
        }, 1200);
      } catch {
        setError("Erro ao redirecionar");
      }
    }

    doRedirect();
  }, [slug]);

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
