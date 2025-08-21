"use client"
import { motion } from "framer-motion"

export function Stats() {
  const stats = [
    { number: "500+", label: "Personal Trainers" },
    { number: "5.000+", label: "Alunos Ativos" },
    { number: "200 mil", label: "Aulas Registradas" },
    { number: "99,9%", label: "Uptime" },
  ]
  const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
  }
  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  }
  return (
    <section id="stats" className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="grid gap-8 text-center md:grid-cols-2 lg:grid-cols-4"
        >
          {stats.map((s) => (
            <motion.div key={s.label} variants={item}>
              <div className="mb-2 text-4xl font-bold text-primary">{s.number}</div>
              <div className="text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
