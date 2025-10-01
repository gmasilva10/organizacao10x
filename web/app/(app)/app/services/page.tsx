"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Package, 
  Users, 
  Heart, 
  AlertTriangle, 
  FileText,
  ArrowRight 
} from "lucide-react"

export default function ServicesPage() {
  const services = [
    {
      title: "Financeiro",
      description: "Planos, categorias e configurações financeiras.",
      icon: Package,
      href: "/app/services/financial",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "Onboarding",
      description: "Kanban de onboarding de serviços.",
      icon: Users,
      href: "/app/services/onboard", 
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20"
    },
    {
      title: "Relacionamento",
      description: "Templates e mensagens de relacionamento.",
      icon: Heart,
      href: "/app/services/relationship",
      color: "text-pink-600", 
      bgColor: "bg-pink-50 dark:bg-pink-900/20"
    },
    {
      title: "Ocorrências",
      description: "Grupos e tipos de ocorrências.",
      icon: AlertTriangle,
      href: "/app/services/occurrences",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20"
    },
    {
      title: "Anamnese",
      description: "Templates e diretrizes de treino.",
      icon: FileText,
      href: "/app/services/anamnesis",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20"
    }
  ]

  return (
    <div className="container py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
        <p className="text-muted-foreground mt-2">
          Estruture seus serviços como Planos, Onboarding e Relacionamento.
        </p>
      </div>

      {/* Services Grid - Cards Compactos (5 por linha) */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {services.map((service) => (
          <Link key={service.title} href={service.href}>
            <Card className="group relative cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 border-l-4 border-l-transparent hover:border-l-primary">
              <CardContent className="p-4">
                <div className={`${service.bgColor} ${service.color} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
                  <service.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold mb-1">{service.title}</h3>
                <p className="text-muted-foreground text-xs mb-3 line-clamp-2">{service.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Acessar</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}