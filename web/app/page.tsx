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
				<Features />
				<About />
				<Stats />
			</main>
			<Footer />
		</div>
	)
}
