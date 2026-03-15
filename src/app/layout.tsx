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
      <body className="antialiased">{children}</body>
    </html>
  );
}
