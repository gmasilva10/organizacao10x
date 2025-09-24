"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Briefcase, UserCheck, ClipboardList, Activity, ArrowRight, TrendingUp, Calendar, BarChart3, MessageSquare, Send, Sparkles } from "lucide-react"
import MessageComposer from "@/components/relationship/MessageComposer"

interface DashboardStats {
  students: number
  services: number
  collaborators: number
  kanbanItems: number
  loading: boolean
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    students: 0,
    services: 0,
    collaborators: 0,
    kanbanItems: 0,
    loading: true
  })
  const [messageComposerOpen, setMessageComposerOpen] = useState(false)
  const [messageComposerMode, setMessageComposerMode] = useState<'free' | 'template'>('free')

  useEffect(() => {
    async function fetchStats() {
      try {
        // Buscar contadores em paralelo
        const [studentsRes, servicesRes, collaboratorsRes, kanbanRes] = await Promise.all([
          fetch("/api/students?count_only=true").catch(() => ({ ok: false })),
          fetch("/api/services?count_only=true").catch(() => ({ ok: false })),
          fetch("/api/collaborators?count_only=true").catch(() => ({ ok: false })),
          fetch("/api/kanban/items?count_only=true").catch(() => ({ ok: false }))
        ])

        const counts = {
          students: studentsRes.ok ? (await (studentsRes as Response).json()).count || 0 : 0,
          services: servicesRes.ok ? (await (servicesRes as Response).json()).count || 0 : 0,
          collaborators: collaboratorsRes.ok ? (await (collaboratorsRes as Response).json()).count || 0 : 0,
          kanbanItems: kanbanRes.ok ? (await (kanbanRes as Response).json()).count || 0 : 0,
          loading: false
        }

        setStats(counts)
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error)
        setStats(prev => ({ ...prev, loading: false }))
      }
    }

    fetchStats()
  }, [])

  const handleNewMessage = (mode: 'free' | 'template') => {
    setMessageComposerMode(mode)
    setMessageComposerOpen(true)
  }

  const cards = [
    {
      title: "Alunos",
      value: stats.students,
      description: "Total de alunos cadastrados",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      href: "/app/students",
      actionText: "Gerenciar alunos"
    },
    {
      title: "Serviços",
      value: stats.services,
      description: "Serviços disponíveis",
      icon: Briefcase,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      href: "/app/services",
      actionText: "Ver serviços"
    },
    {
      title: "Colaboradores",
      value: stats.collaborators,
      description: "Membros da equipe",
      icon: UserCheck,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      href: "/app/team",
      actionText: "Gerenciar equipe"
    },
    {
      title: "Itens no Kanban",
      value: stats.kanbanItems,
      description: "Processos em andamento",
      icon: ClipboardList,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      href: "/app/onboarding",
      actionText: "Ver processos"
    }
  ]

  const quickActions = [
    {
      title: "Novo Aluno",
      description: "Cadastrar um novo aluno",
      href: "/app/students?new=true",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Novo Serviço",
      description: "Criar um novo serviço",
      href: "/app/services?new=true",
      icon: Briefcase,
      color: "text-green-600"
    },
    {
      title: "Configurações",
      description: "Gerenciar usuários e papéis",
      href: "/app/settings",
      icon: Activity,
      color: "text-purple-600"
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral da sua plataforma Personal Global
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.loading ? (
          // Skeleton para os cards durante loading
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <div className="rounded-full p-2 bg-muted">
                  <Skeleton className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32 mb-3" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))
        ) : (
          cards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.title} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <div className={`rounded-full p-2 ${card.bgColor}`}>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {card.value.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {card.description}
                  </p>
                  <div className="mt-3">
                    <Button asChild variant="ghost" size="sm" className="h-auto p-0 text-xs">
                      <Link href={card.href} className="flex items-center gap-1">
                        {card.actionText}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Ações Rápidas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Ações Rápidas</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Card key={action.title} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-base">{action.title}</CardTitle>
                      <CardDescription>{action.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={action.href}>
                      Ir para {action.title.toLowerCase()}
                      <ArrowRight className="h-3 w-3 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Relacionamento - Ações Rápidas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Relacionamento - Ações Rápidas</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base">Nova Mensagem (Livre)</CardTitle>
                  <CardDescription>Enviar mensagem personalizada para qualquer aluno</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => handleNewMessage('free')}
              >
                <Send className="h-3 w-3 mr-2" />
                Criar Mensagem Livre
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base">Nova Mensagem (Template)</CardTitle>
                  <CardDescription>Usar template pré-definido para envio</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => handleNewMessage('template')}
              >
                <MessageSquare className="h-3 w-3 mr-2" />
                Usar Template
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Ativo</div>
                <p className="text-xs text-muted-foreground">Sistema operacional</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Version</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">v0.4.0</div>
                <p className="text-xs text-muted-foreground">Versão atual</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Features v0.4.0</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-green-600">✅ Módulo Alunos Completo</div>
                  <div className="text-sm font-medium text-green-600">✅ Anexos & Processos</div>
                  <div className="text-sm font-medium text-green-600">✅ Onboarding Kanban</div>
                  <div className="text-sm font-medium text-green-600">✅ Performance Otimizada</div>
                  <p className="text-xs text-muted-foreground">GATE 10.5 Concluído</p>
                  
                  {/* Botão Novidades da Versão */}
                  <div className="pt-3 mt-3 border-t border-gray-100">
                    <Button 
                      asChild 
                      variant="outline" 
                      size="sm" 
                      className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200 text-blue-700 hover:text-blue-800"
                    >
                      <Link href="/app/novidades" className="flex items-center justify-center gap-2">
                        <Sparkles className="h-3 w-3" />
                        Novidades da Versão
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Rodapé com informações */}
      <div className="text-center text-sm text-muted-foreground space-y-1">
        <p>Personal Global • Organize seus alunos. Escale seus resultados.</p>
        <p>
          Precisa de ajuda?{" "}
          <Link href="/app/settings" className="underline text-primary">
            Configurações
          </Link>
          {" "}•{" "}
          <Link href="/support" className="underline text-primary">
            Suporte
          </Link>
        </p>
      </div>

      {/* MessageComposer Modal */}
      <MessageComposer
        open={messageComposerOpen}
        onOpenChange={setMessageComposerOpen}
        initialMessage={messageComposerMode === 'free' ? '' : 'Olá [Primeiro Nome], [Saudação Temporal]! Como está o treino hoje?'}
        onSuccess={() => {
          console.log('Mensagem enviada com sucesso!')
        }}
      />
    </div>
  )
}