"use client"
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoginDrawer } from "./LoginDrawer"
import Link from "next/link"
import Image from "next/image"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useTheme } from "@/lib/use-theme"
import { useFeature } from "@/lib/feature-flags"
import { UpgradeModal } from "@/components/UpgradeModal"
import { UpgradeBadge } from "@/components/Badges"

export function Header() {
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const [isScrolled, setIsScrolled] = useState(false)
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const [mounted, setMounted] = useState(false)
  const onboarding = useFeature("features.onboarding.kanban")
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
      setMounted(true)
  }, [])

  const logoSrc = mounted ? (isDark ? "/logo_branca.png" : "/logo_preta.png") : "/logo_preta.png"

	useEffect(() => {
		const onScroll = () => setIsScrolled(window.scrollY > 50)
		window.addEventListener("scroll", onScroll)
		return () => window.removeEventListener("scroll", onScroll)
	}, [])

	const menu = [
		{ name: "Features", href: "#features" },
		{ name: "Stats", href: "#stats" },
		{ name: "About", href: "#about" },
		{ name: "Contact", href: "#contact" },
	]

	return (
		<motion.header
			initial={{ y: -100 }}
			animate={{ y: 0 }}
			transition={{ duration: 0.5 }}
			className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${isScrolled ? "shadow-md" : ""}`}
		>
			{showUpgrade && (
				<UpgradeModal
					open={showUpgrade}
					onClose={() => setShowUpgrade(false)}
					title="Limite do seu plano foi atingido"
					description="Para adicionar mais treinadores, faça upgrade para o plano Enterprise."
					primaryHref="/contact"
					secondaryHref="/planos"
				/>
			)}
			<div className="container flex h-16 items-center justify-between">
				<Link href="/" className="flex items-center gap-2" aria-label="Home - Personal Global" suppressHydrationWarning>
					<Image
						src={logoSrc}
						alt="Personal Global"
						width={32}
						height={32}
						sizes="32px"
						className="object-contain [filter:brightness(0)_contrast(1.05)] dark:[filter:brightness(1)]"
					/>
					<span className="font-bold text-xl">Personal Global</span>
				</Link>

                <nav className="hidden md:flex gap-10" aria-label="Menu principal" suppressHydrationWarning>
					{menu.map((item) => (
                        <a key={item.href} href={item.href} className="text-sm font-medium underline-offset-4 hover:underline hover:text-primary">
							{item.name}
						</a>
					))}
					{/* Onboarding sempre visível com guard de feature */}
					{onboarding.loading ? null : onboarding.enabled ? (
						<Link href="/onboarding" className="text-sm font-medium underline-offset-4 hover:underline hover:text-primary">
							Onboarding
						</Link>
					) : (
						<button
							type="button"
							onClick={() => setShowUpgrade(true)}
							aria-haspopup="dialog"
							className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
						>
							<span>Onboarding</span>
							<UpgradeBadge />
						</button>
					)}
				</nav>

				<div className="hidden md:flex items-center gap-3">
					<ThemeToggle />
					<Button asChild size="sm" variant="ghost" className="rounded-full">
						<Link href="/login">Entrar</Link>
					</Button>
					<Button asChild size="sm" className="rounded-full bg-gradient-to-r from-primary to-accent">
						<Link href="/signup">Começar agora</Link>
					</Button>
				</div>

				<button className="flex md:hidden" onClick={() => setIsMenuOpen((v) => !v)} aria-label="Abrir menu mobile">
					<Menu className="h-6 w-6" />
				</button>
			</div>

			{isMenuOpen && (
				<div className="fixed inset-0 z-50 bg-background md:hidden">
					<div className="container flex h-16 items-center justify-between">
						<Link href="/" className="flex items-center gap-3">
							<div className="h-10 w-10 flex items-center justify-center">
								<img src="/logo.png" alt="Personal Global" className="h-8 w-8 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }} />
							</div>
							<span className="font-bold text-xl">Personal Global</span>
						</Link>
						<button onClick={() => setIsMenuOpen(false)} aria-label="Fechar menu mobile">
							<X className="h-6 w-6" />
						</button>
					</div>
					<nav className="container grid gap-3 pb-8 pt-6" aria-label="Menu mobile">
						{menu.map((item) => (
							<a
								key={item.href}
								href={item.href}
								className="flex items-center justify-between rounded-full px-3 py-2 text-lg font-medium hover:bg-accent"
								onClick={() => setIsMenuOpen(false)}
							>
								{item.name}
							</a>
						))}
						{onboarding.loading ? null : onboarding.enabled ? (
							<Link href="/onboarding" className="flex items-center justify-between rounded-full px-3 py-2 text-lg font-medium hover:bg-accent">
								Onboarding
							</Link>
						) : (
							<button
								type="button"
								onClick={() => { setShowUpgrade(true); setIsMenuOpen(false) }}
								aria-haspopup="dialog"
								className="flex items-center justify-between rounded-full px-3 py-2 text-lg font-medium hover:bg-accent"
							>
								Onboarding <UpgradeBadge />
							</button>
						)}
						<div className="flex flex-col gap-3 pt-4">
							<Button asChild variant="ghost" className="w-full rounded-full">
								<Link href="/login">Entrar</Link>
							</Button>
							<Button asChild className="w-full rounded-full bg-gradient-to-r from-primary to-accent">
								<Link href="/signup">Começar agora</Link>
							</Button>
						</div>
					</nav>
				</div>
			)}
		</motion.header>
	)
}
