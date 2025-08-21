"use client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { motion } from "framer-motion"
import { MessageSquare, Wallet, Megaphone, BarChart3 } from "lucide-react"

export function Features() {
	const container = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: { staggerChildren: 0.12 }
		}
	}
	const item = {
		hidden: { opacity: 0, y: 20 },
		visible: { opacity: 1, y: 0, transition: { duration: 0.25 } }
	}
	return (
		<section id="features" className="bg-muted/25 py-16 md:py-32">
			<div className="mx-auto max-w-5xl px-6">
				<div className="mb-12 text-center">
					<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Funcionalidades</h2>
					<p className="mx-auto mt-4 max-w-2xl text-muted-foreground md:text-xl">
						Ferramentas poderosas para conectar e colaborar
					</p>
				</div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mx-auto grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <motion.div variants={item}>
            <Card>
              <CardHeader className="font-medium">CRM e gestão de alunos</CardHeader>
              <CardContent className="flex h-32 items-center justify-center text-center text-sm text-muted-foreground">
                <MessageSquare className="mr-3 h-8 w-8 text-primary" aria-hidden />
                Perfil completo, histórico de aulas, planos e progresso.
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card>
              <CardHeader className="font-medium">Vendas e cobranças</CardHeader>
              <CardContent className="flex h-32 items-center justify-center text-center text-sm text-muted-foreground">
                <Wallet className="mr-3 h-8 w-8 text-accent" aria-hidden />
                Acompanhe compras de serviços, planos e pagamentos.
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card>
              <CardHeader className="font-medium">Campanhas e comunicação</CardHeader>
              <CardContent className="flex h-32 items-center justify-center text-center text-sm text-muted-foreground">
                <Megaphone className="mr-3 h-8 w-8 text-primary" aria-hidden />
                E‑mail, WhatsApp e SMS para lembretes e campanhas.
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card>
              <CardHeader className="font-medium">Relatórios e indicadores</CardHeader>
              <CardContent className="flex h-32 items-center justify-center text-center text-sm text-muted-foreground">
                <BarChart3 className="mr-3 h-8 w-8 text-accent" aria-hidden />
                Dashboards de receita, retenção e adesões.
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
			</div>
		</section>
	)
}
