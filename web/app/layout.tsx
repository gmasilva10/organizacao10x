import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "../styles/animations.css"
import { LoginUIProvider } from "@/components/LoginUIContext"
import { ThemeProvider } from "@/lib/use-theme"
import { ToastProvider } from "@/components/ui/toast"
import { Toaster } from "sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ClientTelemetryInit } from "@/components/ClientTelemetryInit"
import QueryProvider from "@/components/providers/QueryProvider"
import CSSPreloader from "@/components/CSSPreloader"

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-sans",
	display: "swap",
})

export const metadata: Metadata = {
  title: "Personal Global — Organize seus alunos. Escale seus resultados.",
  description:
    "Plataforma para personal trainers que centraliza alunos, vendas, campanhas e comunicação — do primeiro contato ao acompanhamento.",
  metadataBase: new URL("http://localhost:3000"),
  icons: {
    icon: [
      { url: "/favicon-16x16.png?v=1", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png?v=1", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png?v=1", type: "image/png" },
    ],
    apple: [{ url: "/icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "Personal Global — Organize seus alunos. Escale seus resultados.",
    description:
      "Plataforma para personal trainers que centraliza alunos, vendas, campanhas e comunicação — do primeiro contato ao acompanhamento.",
    url: "http://localhost:3000",
    siteName: "Personal Global",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Personal Global",
      },
    ],
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal Global — Organize seus alunos. Escale seus resultados.",
    description:
      "Plataforma para personal trainers que centraliza alunos, vendas, campanhas e comunicação — do primeiro contato ao acompanhamento.",
    images: ["/og.png"],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	// Layout renderizado - log removido para produção
	
	return (
		<html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=1" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=1" />
        <link rel="shortcut icon" type="image/png" href="/favicon.png?v=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon.png" />
        <meta name="theme-color" content="#0F172A" />
        {/* CSS crítico inline para evitar FOUC */}
        <style dangerouslySetInnerHTML={{
          __html: `
            body { margin: 0; font-family: Inter, sans-serif; }
            .dark { background-color: #0F172A; color: white; }
            .light { background-color: white; color: #0F172A; }
          `
        }} />
        <noscript>
          <link rel="stylesheet" href="/_next/static/css/app/layout.css" />
        </noscript>
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider initialTheme="light">
          <QueryProvider>
            <TooltipProvider>
              <ToastProvider>
                <LoginUIProvider>
                  <ClientTelemetryInit />
                  <CSSPreloader />
                  {children}
                  <Toaster richColors position="top-right" />
                </LoginUIProvider>
              </ToastProvider>
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
		</html>
	)
}
