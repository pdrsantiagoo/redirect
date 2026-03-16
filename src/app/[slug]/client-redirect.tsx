"use client";

import { useEffect } from "react";

export default function ClientRedirect({ url }: { url: string }) {
  useEffect(() => {
    // Wait for UTMify scripts to load and capture UTMs
    // Redirect almost instantly - UTMify scripts load async in parallel
    const destUrl = new URL(url);
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.forEach((value, key) => {
      if (!destUrl.searchParams.has(key)) {
        destUrl.searchParams.set(key, value);
      }
    });

    window.location.href = destUrl.toString();
  }, [url]);

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
