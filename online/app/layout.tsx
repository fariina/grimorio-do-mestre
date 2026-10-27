import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grimório do Mestre",
  description: "Campanhas, biblioteca e combate de D&D em português brasileiro. Acesso pessoal.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
