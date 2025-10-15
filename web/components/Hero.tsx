"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Globe as GlobeIcon } from "lucide-react"
// removed unused alias m
import { Button } from "@/components/ui/button"
import { useLoginUI } from "./LoginUIContext"
import Image from "next/image"
import Link from "next/link"
import { useTheme } from "@/lib/use-theme"
import { Globe as DottedGlobe } from "@/components/ui/globe"
import { useState, useEffect } from "react"

export function Hero() {
  const { open } = useLoginUI()
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Forçar re-render após hidratação completa
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  // Fallback seguro para SSR
  const logoSrc = mounted ? (isDark ? "/logo_branca.png" : "/logo_preta.png") : "/logo_preta.png"
  const logoOpacity = 0.9
  const logoExitOpacity = 0

  return (
    <section className="relative w-full overflow-hidden py-16 md:py-28 lg:py-36 xl:py-44">
      {/* gradiente diagonal discreto + glow atrás do globo */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#5B7CFA0D] to-[#22D3EE0D]" />
      <div className="pointer-events-none absolute left-[-120px] top-1/2 -translate-y-1/2 h-[60vw] w-[60vw] rounded-full bg-[radial-gradient(circle_at_center,theme(colors.primary)/0.15,transparent_60%)]" />
      {/* Globo pontilhado: grande, mais transparente e ao fundo à esquerda (sem alterações estruturais) */}
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: open ? 1 : 1.02 }}
        transition={{ duration: 6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        className="pointer-events-none absolute left-[-160px] top-1/2 -translate-y-[48%] relative w-[60vw] md:w-[56vw] lg:w-[52vw]"
      >
        <DottedGlobe paused={open} className="max-w-[60vw] md:max-w-[56vw] lg:max-w-[52vw] opacity-35" />
      </motion.div>
      {/* Large Logo (desktop) - only while drawer closed */}
      <AnimatePresence mode="wait">
        {!open && (
          <motion.div
            key="hero-logo"
            layoutId="pg-hero-logo"
            className="pointer-events-none absolute inset-0 z-[1] flex justify-end"
            initial={{ opacity: 0, scale: 1.05, x: 0 }}
            animate={{ opacity: logoOpacity, scale: 1, x: 0 }}
            exit={{ opacity: logoExitOpacity, scale: 0.75, x: 64 }}
            transition={{ type: "spring", stiffness: 220, damping: 30 }}
          >
            <Image
              src={logoSrc}
              alt="Personal Global"
              width={1200}
              height={1200}
              sizes="(max-width: 768px) 60vw, (max-width: 1200px) 48vw, 48vw"
              priority
              className="select-none object-contain translate-x-[6vw] lg:translate-x-[8vw] max-w-none w-[58vw] md:w-[52vw] lg:w-[48vw] [filter:brightness(0)_contrast(1.05)] dark:[filter:brightness(1)]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container relative z-10 px-6">
        <div className="flex flex-col items-center space-y-4 text-center md:items-start md:text-left">
					<div className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm">
						<GlobeIcon className="mr-1 h-3 w-3" />
						Plataforma para Personal Trainers
					</div>

					<motion.h1
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.7, delay: 0.2 }}
						className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none"
					>
						Organize seus alunos. Escale seus resultados.
					</motion.h1>

					<motion.p
						initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.7, delay: 0.4 }}
            className="max-w-[650px] text-muted-foreground md:text-xl"
					>
						Centralize alunos, vendas, campanhas e comunicação — do primeiro contato ao acompanhamento.
					</motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="rounded-full group bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/40 hover:scale-[1.03] transition-transform" aria-label="Começar agora">
              <Link href="/signup?plan=basic">
                Começar agora
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full border-primary text-primary hover:bg-primary hover:text-white" aria-label="Ver planos">
              <Link href="#planos">Ver planos</Link>
            </Button>
          </motion.div>
          {/* Animação de logo ao abrir Login (mobile) */}
          <AnimatePresence>
            {!open ? (
              <motion.img
                key="hero-logo"
                src="/Global_Preto.png"
                alt="Personal Global"
                className="mt-6 h-20 w-20 select-none object-contain md:hidden"
                initial={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.3 }}
              />
            ) : null}
          </AnimatePresence>
				</div>
			</div>
		</section>
	)
}
