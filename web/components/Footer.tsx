"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Facebook, Instagram, Linkedin, Moon, Sun, Twitter } from "lucide-react"

export function Footer() {
	const [isDark, setIsDark] = useState(false)
	useEffect(() => {
		document.documentElement.classList.toggle("dark", isDark)
	}, [isDark])

	return (
		<footer id="contact" className="relative border-t bg-background text-foreground">
			<div className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
				<div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
					<div className="relative">
						<h2 className="mb-4 text-3xl font-bold tracking-tight">Assine a newsletter</h2>
						<p className="mb-6 text-muted-foreground">
							Novidades e ofertas diretamente no seu email.
						</p>
						<form className="relative" aria-label="Formulário de newsletter">
							<Input type="email" placeholder="Seu email" className="pr-12" />
							<Button type="submit" size="icon" className="absolute right-1 top-1 h-8 w-8 rounded-full" aria-label="Inscrever">
								→
							</Button>
						</form>
					</div>

					<div>
						<h3 className="mb-4 text-lg font-semibold">Links rápidos</h3>
						<nav className="space-y-2 text-sm" aria-label="Links rápidos">
							<a href="#features" className="block transition-colors hover:text-primary">Features</a>
							<a href="#stats" className="block transition-colors hover:text-primary">Stats</a>
							<a href="#about" className="block transition-colors hover:text-primary">About</a>
							<a href="#contact" className="block transition-colors hover:text-primary">Contact</a>
						</nav>
					</div>

					<div>
						<h3 className="mb-4 text-lg font-semibold">Contato</h3>
						<address className="space-y-2 text-sm not-italic">
							<p>Personal Global</p>
							<p>contato@personalglobal.com</p>
							<p>+55 (11) 99999-0000</p>
						</address>
					</div>

					<div className="relative">
						<h3 className="mb-4 text-lg font-semibold">Redes sociais</h3>
						<div className="mb-6 flex gap-3">
							<Button variant="outline" size="icon" className="rounded-full" aria-label="Facebook"><Facebook className="h-4 w-4" /></Button>
							<Button variant="outline" size="icon" className="rounded-full" aria-label="Twitter"><Twitter className="h-4 w-4" /></Button>
							<Button variant="outline" size="icon" className="rounded-full" aria-label="Instagram"><Instagram className="h-4 w-4" /></Button>
							<Button variant="outline" size="icon" className="rounded-full" aria-label="LinkedIn"><Linkedin className="h-4 w-4" /></Button>
						</div>
						<div className="flex items-center gap-2" aria-label="Alternar tema">
							<Sun className="h-4 w-4" />
							<Switch id="dark-mode" checked={isDark} onCheckedChange={setIsDark} aria-label="Alternar modo escuro" />
							<Moon className="h-4 w-4" />
							<Label htmlFor="dark-mode" className="sr-only">Modo escuro</Label>
						</div>
					</div>
				</div>

				<div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 text-center md:flex-row">
					<p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Personal Global. Todos os direitos reservados. <span className="text-blue-600 font-medium">v0.3.3-dev</span></p>
					<nav className="flex gap-4 text-sm" aria-label="Políticas">
						<a href="#" className="transition-colors hover:text-primary">Privacidade</a>
						<a href="#" className="transition-colors hover:text-primary">Termos</a>
						<a href="#" className="transition-colors hover:text-primary">Cookies</a>
					</nav>
				</div>
			</div>
		</footer>
	)
}
