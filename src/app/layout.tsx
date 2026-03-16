import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Redirect A/B",
  description: "Sistema de split de tráfego para testes A/B",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <script
          src="https://cdn.utmify.com.br/scripts/utms/latest.js"
          data-utmify-prevent-xcod-sck
          data-utmify-is-click-bank
          async
          defer
        />
        <script
          src="https://cdn.utmify.com.br/scripts/utms/latest.js"
          data-utmify-prevent-xcod-sck
          data-utmify-prevent-subids
          data-utmify-ignore-iframe
          data-utmify-is-cartpanda
          async
          defer
        />
        <script
          src="https://cdn.utmify.com.br/scripts/utms/latest.js"
          data-utmify-prevent-subids
          async
          defer
        />
        <script
          src="https://cdn.utmify.com.br/scripts/utms/latest.js"
          data-utmify-prevent-xcod-sck
          data-utmify-prevent-subids
          async
          defer
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
  function getParam(name) {
    try {
      return new URL(window.location.href).searchParams.get(name) || "";
    } catch(e) {
      return "";
    }
  }
  function extractId(value) {
    if (!value) return "";
    var parts = value.split("|");
    return parts.length > 1 ? parts[parts.length - 1] : parts[0];
  }
  var utm_source   = extractId(getParam("utm_source"));
  var utm_campaign = extractId(getParam("utm_campaign"));
  var utm_medium   = extractId(getParam("utm_medium"));
  var utm_content  = extractId(getParam("utm_content"));
  var utm_term     = extractId(getParam("utm_term"));
  if (!utm_source && !utm_campaign && !utm_medium && !utm_content && !utm_term) {
    return;
  }
  var hopBase = "https://40c87-yjqj0s0mfe7eeiq-2h71.hop.clickbank.net";
  var params = [
    "aff_sub1=" + encodeURIComponent(utm_source),
    "aff_sub2=" + encodeURIComponent(utm_campaign),
    "aff_sub3=" + encodeURIComponent(utm_medium),
    "aff_sub4=" + encodeURIComponent(utm_content),
    "aff_sub5=" + encodeURIComponent(utm_term),
    "unique_aff_sub1=" + encodeURIComponent(utm_source),
    "unique_aff_sub2=" + encodeURIComponent(utm_campaign),
    "unique_aff_sub3=" + encodeURIComponent(utm_medium),
    "unique_aff_sub4=" + encodeURIComponent(utm_content),
    "unique_aff_sub5=" + encodeURIComponent(utm_term)
  ];
  var hopUrl = hopBase + "?" + params.join("&");
  var iframe = document.createElement("iframe");
  iframe.src = hopUrl;
  iframe.width = "0";
  iframe.height = "0";
  iframe.style.cssText = "display:none;width:0;height:0;border:0;position:absolute;left:-9999px;";
  iframe.setAttribute("tabindex", "-1");
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("title", "");
  if (document.body) {
    document.body.appendChild(iframe);
  } else {
    document.addEventListener("DOMContentLoaded", function() {
      document.body.appendChild(iframe);
    });
  }
  console.log("[HopLink] IDs extraidos:", {
    aff_sub1: utm_source,
    aff_sub2: utm_campaign,
    aff_sub3: utm_medium,
    aff_sub4: utm_content,
    aff_sub5: utm_term
  });
  console.log("[HopLink] URL:", hopUrl);
})();`,
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
