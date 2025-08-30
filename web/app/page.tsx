import { Header } from "@/components/Header"
import { Hero } from "@/components/Hero"
import { Features } from "@/components/Features"
import { Stats } from "@/components/Stats"
import { Footer } from "@/components/Footer"
import dynamic from "next/dynamic"

const About = dynamic(() => import("@/components/About").then(m => m.About), {
	ssr: true,
	loading: () => <div className="container py-16 md:py-24 text-center text-muted-foreground">Carregando…</div>,
})

export default function Page() {
	return (
		<div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
			<Header />
			<main className="flex-1">
				<Hero />
				<section id="planos" className="scroll-mt-24">
					<div className="container py-12 md:py-20">
						<div className="grid gap-6 md:grid-cols-2">
							<a href="/signup?plan=basic&return=/#planos" className="block rounded-lg border p-6 hover:shadow-md">
								<h3 className="text-xl font-semibold">Plano Basic</h3>
								<p className="text-muted-foreground">Até 3 colaboradores • Recursos essenciais</p>
								<div className="mt-3 text-primary underline">Escolher Basic →</div>
							</a>
							<a href="/signup?plan=enterprise&return=/#planos" className="block rounded-lg border p-6 hover:shadow-md">
								<h3 className="text-xl font-semibold">Plano Enterprise</h3>
								<p className="text-muted-foreground">Até 100 colaboradores • Recursos avançados</p>
								<div className="mt-3 text-primary underline">Escolher Enterprise →</div>
							</a>
						</div>
					</div>
				</section>
				<Features />
				<About />
				<Stats />
			</main>
			<Footer />
		</div>
	)
}
