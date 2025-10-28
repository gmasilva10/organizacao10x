import { Header } from "@/components/Header"
import { Hero } from "@/components/Hero"
import { Suspense } from "react"

// Componente de fallback para evitar problemas de hidratação
function LoadingFallback() {
	return (
		<div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
			<header className="p-4">
				<h1 className="text-2xl font-bold">Personal Global</h1>
			</header>
			<main className="flex-1 p-8">
				<div className="text-center">
					<h2 className="text-4xl font-bold mb-4">Organize seus alunos. Escale seus resultados.</h2>
					<p className="text-lg text-muted-foreground mb-8">
						Plataforma para personal trainers que centraliza alunos, vendas, campanhas e comunicação.
					</p>
					<div className="space-y-4">
						<a href="/login" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg">
							Entrar
						</a>
					</div>
				</div>
			</main>
		</div>
	)
}

export default function Page() {
	console.log('🔍 [LANDING PAGE] Componente sendo renderizado')
	
	return (
		<div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
			<Suspense fallback={<LoadingFallback />}>
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
				</main>
			</Suspense>
		</div>
	)
}
