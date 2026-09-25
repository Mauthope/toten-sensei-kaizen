import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sensei Kaizen - Toten Interativo",
  description: "Toten Interativo com Visão Computacional, Reconhecimento de Pessoas e Cultura Kaizen",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sensei Kaizen",
  },
};

export const viewport: Viewport = {
  themeColor: "#06b6d4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="bg-slate-900 text-slate-100 min-h-screen flex flex-col selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
