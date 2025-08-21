"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export function About() {
  return (
    <section id="about" className="container py-16 md:py-24 text-center">
      <motion.h2
        variants={item}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8"
      >
        Sobre a Personal Global
      </motion.h2>

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="max-w-3xl mx-auto text-muted-foreground space-y-4"
      >
        <motion.p variants={item}>
          Na Personal Global, nossa missão é empoderar personal trainers, oferecendo as ferramentas necessárias para que possam focar no que realmente importa: o sucesso de seus alunos. Acreditamos que a organização e a eficiência são a chave para escalar resultados e construir uma carreira sólida.
        </motion.p>
        <motion.p variants={item}>
          Com nossa plataforma, você centraliza cadastros, planos e acompanhamento de evolução, otimiza vendas e cobranças com recorrência e PIX, e automatiza campanhas de comunicação via e-mail e WhatsApp. Tudo para que você tenha mais tempo e controle.
        </motion.p>
        <motion.p variants={item}>
          Junte-se a centenas de personal trainers que já transformaram sua gestão com a Personal Global. Simplifique seu dia a dia e leve seu negócio para o próximo nível.
        </motion.p>
      </motion.div>

      <motion.div variants={item} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="mt-10">
        <Link href="mailto:contato@personalglobal.com" passHref>
          <Button size="lg" className="rounded-full">Fale com a gente</Button>
        </Link>
      </motion.div>
    </section>
  )
}


