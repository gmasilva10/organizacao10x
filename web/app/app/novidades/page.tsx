"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Sparkles, 
  TrendingUp, 
  Users, 
  FileText, 
  DollarSign, 
  Zap, 
  Shield, 
  BarChart3,
  MessageSquare,
  Calendar,
  Target,
  Heart,
  Brain,
  Rocket,
  Star,
  CheckCircle,
  Clock,
  ArrowRight
} from "lucide-react"

interface Feature {
  id: string
  title: string
  description: string
  icon: any
  status: 'desenvolvendo' | 'planejado' | 'em-breve'
  priority: 'alta' | 'media' | 'baixa'
  version?: string
  benefits?: string[]
}

const upcomingFeatures: Feature[] = [
  {
    id: 'dashboards',
    title: 'Dashboards Avançados',
    description: 'Painéis personalizáveis com métricas em tempo real, gráficos interativos e KPIs essenciais para seu negócio.',
    icon: BarChart3,
    status: 'planejado',
    priority: 'alta',
    version: 'v0.5.0',
    benefits: ['Visão 360° do negócio', 'Métricas de performance', 'Relatórios automáticos']
  },
  {
    id: 'import-alunos',
    title: 'Importação de Alunos',
    description: 'Importe listas de alunos em massa via Excel/CSV com validação automática e mapeamento inteligente de campos.',
    icon: Users,
    status: 'desenvolvendo',
    priority: 'alta',
    version: 'v0.5.1',
    benefits: ['Migração facilitada', 'Validação automática', 'Mapeamento inteligente']
  },
  {
    id: 'import-treinos',
    title: 'Importação de Treinos',
    description: 'Sistema completo para importar treinos e planilhas de exercícios de outras plataformas.',
    icon: FileText,
    status: 'planejado',
    priority: 'media',
    version: 'v0.5.2',
    benefits: ['Migração de treinos', 'Compatibilidade multiplataforma', 'Preservação de dados']
  },
  {
    id: 'gestao-financeira',
    title: 'Gestão Financeira',
    description: 'Controle completo de contas a receber, vendas, comissões e relatórios financeiros integrados.',
    icon: DollarSign,
    status: 'em-breve',
    priority: 'alta',
    version: 'v0.6.0',
    benefits: ['Contas a receber', 'Controle de vendas', 'Relatórios financeiros', 'Comissões automáticas']
  },
  {
    id: 'integracoes',
    title: 'Integrações',
    description: 'Conexões nativas com Eduzz, Hotmart e outras plataformas de afiliados para automação completa.',
    icon: Zap,
    status: 'planejado',
    priority: 'media',
    version: 'v0.6.1',
    benefits: ['Eduzz integrado', 'Hotmart conectado', 'Automação de vendas', 'Sincronização em tempo real']
  },
  {
    id: 'parceiros',
    title: 'Sistema de Parceiros',
    description: 'Plataforma completa para gerenciar parceiros, comissões e programas de afiliados.',
    icon: Target,
    status: 'planejado',
    priority: 'media',
    version: 'v0.6.2',
    benefits: ['Gestão de parceiros', 'Comissões automáticas', 'Programa de afiliados', 'Relatórios de performance']
  },
  {
    id: 'pesquisa-satisfacao',
    title: 'Pesquisa de Satisfação',
    description: 'Sistema automatizado para coletar feedback dos alunos e medir satisfação.',
    icon: Heart,
    status: 'planejado',
    priority: 'baixa',
    version: 'v0.7.0',
    benefits: ['Feedback automatizado', 'Métricas de satisfação', 'Relatórios de NPS', 'Ações corretivas']
  },
  {
    id: 'sistema-treinos',
    title: 'Sistema de Treinos',
    description: 'Plataforma completa para criação, prescrição e acompanhamento de treinos personalizados.',
    icon: Brain,
    status: 'planejado',
    priority: 'alta',
    version: 'v0.7.1',
    benefits: ['Prescrição digital', 'Acompanhamento em tempo real', 'Biblioteca de exercícios', 'Progressão automática']
  },
  {
    id: 'ajuda-sistema',
    title: 'Central de Ajuda',
    description: 'Sistema integrado de ajuda com tutoriais, FAQ e suporte em tempo real.',
    icon: Shield,
    status: 'planejado',
    priority: 'baixa',
    version: 'v0.7.2',
    benefits: ['Tutoriais interativos', 'FAQ inteligente', 'Suporte em tempo real', 'Base de conhecimento']
  }
]

const statusConfig = {
  'desenvolvendo': {
    label: 'Em Desenvolvimento',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Clock
  },
  'em-breve': {
    label: 'Em Breve',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: Rocket
  },
  'planejado': {
    label: 'Planejado',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: Calendar
  }
}

const priorityConfig = {
  'alta': 'bg-red-100 text-red-700 border-red-200',
  'media': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'baixa': 'bg-green-100 text-green-700 border-green-200'
}

export default function NovidadesPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const filteredFeatures = selectedStatus === 'all' 
    ? upcomingFeatures 
    : upcomingFeatures.filter(feature => feature.status === selectedStatus)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/app" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Dashboard
              </Link>
            </Button>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Novidades da Versão
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Descubra as funcionalidades que estão chegando para revolucionar sua gestão de personal training
            </p>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            <div className="flex gap-1">
              {[
                { key: 'all', label: 'Todas' },
                { key: 'desenvolvendo', label: 'Em Desenvolvimento' },
                { key: 'em-breve', label: 'Em Breve' },
                { key: 'planejado', label: 'Planejado' }
              ].map((status) => (
                <Button
                  key={status.key}
                  variant={selectedStatus === status.key ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedStatus(status.key)}
                  className="px-4"
                >
                  {status.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredFeatures.map((feature) => {
            const StatusIcon = statusConfig[feature.status].icon
            const FeatureIcon = feature.icon
            
            return (
              <Card key={feature.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors">
                      <FeatureIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={`${statusConfig[feature.status].color} text-xs font-medium`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[feature.status].label}
                      </Badge>
                      <Badge className={`${priorityConfig[feature.priority]} text-xs font-medium`}>
                        Prioridade {feature.priority}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </CardTitle>
                  
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  {feature.version && (
                    <div className="mb-4">
                      <Badge variant="outline" className="text-blue-600 border-blue-200">
                        {feature.version}
                      </Badge>
                    </div>
                  )}
                  
                  {feature.benefits && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Principais benefícios:</h4>
                      <div className="space-y-1">
                        {feature.benefits.map((benefit, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Roadmap Timeline */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Roadmap de Desenvolvimento</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Nossa jornada de inovação contínua para oferecer a melhor experiência em gestão de personal training
            </p>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-500 via-purple-500 to-indigo-500 rounded-full"></div>
            
            <div className="space-y-12">
              {[
                {
                  version: 'v0.5.0',
                  title: 'Q2 2025',
                  subtitle: 'Dashboards & Importação',
                  features: ['Dashboards Avançados', 'Importação de Alunos', 'Importação de Treinos'],
                  color: 'bg-blue-500'
                },
                {
                  version: 'v0.6.0',
                  title: 'Q3 2025',
                  subtitle: 'Financeiro & Integrações',
                  features: ['Gestão Financeira', 'Integrações Eduzz/Hotmart', 'Sistema de Parceiros'],
                  color: 'bg-purple-500'
                },
                {
                  version: 'v0.7.0',
                  title: 'Q4 2025',
                  subtitle: 'Experiência & Treinos',
                  features: ['Pesquisa de Satisfação', 'Sistema de Treinos', 'Central de Ajuda'],
                  color: 'bg-indigo-500'
                }
              ].map((milestone, index) => (
                <div key={milestone.version} className={`relative flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-3 h-3 rounded-full ${milestone.color}`}></div>
                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                          {milestone.version}
                        </Badge>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{milestone.title}</h3>
                      <p className="text-gray-600 mb-4">{milestone.subtitle}</p>
                      <div className="space-y-2">
                        {milestone.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Timeline Dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-4 border-blue-500 rounded-full shadow-lg"></div>
                  
                  <div className="w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="py-12">
              <div className="max-w-2xl mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-6">
                  <Rocket className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Pronto para o futuro?
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Seja um dos primeiros a experimentar essas funcionalidades incríveis. 
                  Nossa equipe está trabalhando constantemente para trazer inovações que vão revolucionar sua gestão.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    <Link href="/app" className="flex items-center gap-2">
                      Voltar ao Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/app/settings" className="flex items-center gap-2">
                      Configurações
                      <Shield className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-gray-500 space-y-1">
          <p>Personal Global • Organize seus alunos. Escale seus resultados.</p>
          <p>Roadmap atualizado em {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>
    </div>
  )
}
