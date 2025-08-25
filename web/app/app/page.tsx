"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  Users, 
  TrendingUp,
  Clock,
  DollarSign,
  CheckCircle2,
  UserCheck,
  ChevronUp,
  ChevronDown,
  Filter,
  Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  mockTrainerWorkload, 
  getFilteredData,
  type DashboardKPI,
  type TrainerWorkload,
  type RecentActivity
} from "@/mocks/dashboard"

type TimeRange = '7d' | '30d'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const [selectedTrainer, setSelectedTrainer] = useState<string>('')
  const [kpis, setKpis] = useState<DashboardKPI[]>([])
  const [trainers, setTrainers] = useState<TrainerWorkload[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  useEffect(() => {
    // Simulate loading mock data
    const loadDashboardData = () => {
      setLoading(true)
      
      // Simulate API delay
      setTimeout(() => {
        const filteredData = getFilteredData(selectedTrainer || undefined)
        if (filteredData) {
          setKpis(filteredData.kpis)
          setTrainers(filteredData.trainers)
          setRecentActivity(filteredData.activity)
        }
        setLoading(false)
      }, 500)
    }

    loadDashboardData()
  }, [selectedTrainer])

  const getIconComponent = (iconName: string) => {
    const iconMap = {
      'users': Users,
      'trending-up': TrendingUp,
      'user-check': UserCheck,
      'dollar-sign': DollarSign,
      'check-circle': CheckCircle2,
      'clock': Clock
    }
    return iconMap[iconName as keyof typeof iconMap] || Users
  }

  const getColorClasses = (color: string) => {
    const colorMap = {
      'blue': { bg: 'bg-blue-500', text: 'text-blue-600', bgLight: 'bg-blue-50 dark:bg-blue-900/20' },
      'green': { bg: 'bg-green-500', text: 'text-green-600', bgLight: 'bg-green-50 dark:bg-green-900/20' },
      'orange': { bg: 'bg-orange-500', text: 'text-orange-600', bgLight: 'bg-orange-50 dark:bg-orange-900/20' },
      'purple': { bg: 'bg-purple-500', text: 'text-purple-600', bgLight: 'bg-purple-50 dark:bg-purple-900/20' },
      'teal': { bg: 'bg-teal-500', text: 'text-teal-600', bgLight: 'bg-teal-50 dark:bg-teal-900/20' },
      'gray': { bg: 'bg-gray-500', text: 'text-gray-600', bgLight: 'bg-gray-50 dark:bg-gray-900/20' }
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.gray
  }

  const formatValue = (kpi: DashboardKPI) => {
    if (kpi.id === 'revenue') {
      return `R$ ${kpi.value.toLocaleString()}`
    }
    if (kpi.id === 'completion_rate' || kpi.id === 'avg_session') {
      return `${kpi.value}${kpi.id === 'completion_rate' ? '%' : 'min'}`
    }
    return kpi.value.toLocaleString()
  }

  const KpiCard = ({ kpi, loading: isLoading }: { kpi: DashboardKPI; loading: boolean }) => {
    const Icon = getIconComponent(kpi.icon)
    const colors = getColorClasses(kpi.color)

    return (
      <div className="bg-card border rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-border/80">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${colors.bgLight}`}>
            <Icon className={`h-5 w-5 ${colors.text}`} />
          </div>
          <div className={`flex items-center gap-1 text-sm font-medium ${
            kpi.changeType === 'increase' ? 'text-green-600' :
            kpi.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {kpi.changeType === 'increase' ? <ChevronUp className="h-4 w-4" /> :
             kpi.changeType === 'decrease' ? <ChevronDown className="h-4 w-4" /> : null}
            {kpi.change > 0 ? '+' : ''}{kpi.change}%
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{kpi.title}</p>
          <div className="text-3xl font-bold">
            {isLoading ? (
              <div className="h-9 w-24 bg-muted animate-pulse rounded" />
            ) : (
              formatValue(kpi)
            )}
          </div>
        </div>
      </div>
    )
  }

  const ActivityItem = ({ activity }: { activity: RecentActivity }) => {
    const getActivityIcon = (type: string) => {
      switch (type) {
        case 'student_created': return <UserCheck className="h-4 w-4 text-blue-500" />
        case 'student_moved': return <TrendingUp className="h-4 w-4 text-green-500" />
        case 'trainer_assigned': return <Users className="h-4 w-4 text-purple-500" />
        case 'service_purchased': return <DollarSign className="h-4 w-4 text-orange-500" />
        default: return <Clock className="h-4 w-4 text-gray-500" />
      }
    }

    const timeAgo = new Date(activity.timestamp).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })

    return (
      <div className="flex items-start gap-3 p-3 hover:bg-accent/50 rounded-lg transition-colors">
        <div className="p-2 rounded-full bg-muted flex-shrink-0">
          {getActivityIcon(activity.type)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground">{activity.title}</h4>
          <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>{timeAgo}</span>
            <span>•</span>
            <span>{activity.user}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header com Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral da sua plataforma Organização10x
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filtro de Período */}
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
            <Button
              variant={timeRange === '7d' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('7d')}
              className="text-xs"
            >
              <Calendar className="h-3 w-3 mr-1" />
              7 dias
            </Button>
            <Button
              variant={timeRange === '30d' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('30d')}
              className="text-xs"
            >
              <Calendar className="h-3 w-3 mr-1" />
              30 dias
            </Button>
          </div>

          {/* Filtro de Treinador */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedTrainer}
              onChange={(e) => setSelectedTrainer(e.target.value)}
              className="bg-background border border-input rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos os treinadores</option>
              {mockTrainerWorkload.map((trainer) => (
                <option key={trainer.id} value={trainer.id}>
                  {trainer.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} loading={loading} />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Trainer Workload */}
        <div className="lg:col-span-2">
          <div className="bg-card border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">
              {selectedTrainer ? 'Workload do Treinador' : 'Workload por Treinador'}
            </h3>
            
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {trainers.map((trainer) => (
                  <div key={trainer.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium">{trainer.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{trainer.studentsCount} alunos</span>
                        <span>•</span>
                        <span>{trainer.onboardingCount} onboarding</span>
                        <span>•</span>
                        <span>{trainer.activeCount} ativos</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-sm font-medium">
                        {trainer.studentsCount}/{trainer.maxCapacity}
                      </div>
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((trainer.studentsCount / trainer.maxCapacity) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="bg-card border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Atividade Recente</h3>
            
            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted animate-pulse rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted animate-pulse rounded" />
                      <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Gerenciar Alunos", href: "/app/students", icon: Users, color: "blue" },
          { title: "Onboarding", href: "/app/onboarding", icon: UserCheck, color: "purple" },
          { title: "Serviços", href: "/app/services", icon: CheckCircle2, color: "green", disabled: true },
          { title: "Team Admin", href: "/app/team-admin", icon: Users, color: "orange" }
        ].map((action) => {
          const colors = getColorClasses(action.color)
          return (
            <div key={action.title} className="bg-card border rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${colors.bgLight}`}>
                  <action.icon className={`h-5 w-5 ${colors.text}`} />
                </div>
                <h3 className="font-medium">{action.title}</h3>
              </div>
              {action.disabled ? (
                <Button variant="outline" size="sm" disabled className="w-full">
                  Em breve
                </Button>
              ) : (
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={action.href}>Acessar</Link>
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
