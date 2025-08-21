// Mock data for Dashboard V1 (visual-only)
export interface DashboardKPI {
  id: string
  title: string
  value: number
  change: number
  changeType: 'increase' | 'decrease' | 'neutral'
  icon: string
  color: string
}

export interface TrainerWorkload {
  id: string
  name: string
  studentsCount: number
  onboardingCount: number
  activeCount: number
  maxCapacity: number
}

export interface TimeSeriesData {
  date: string
  value: number
  label?: string
}

export interface RecentActivity {
  id: string
  type: 'student_created' | 'student_moved' | 'trainer_assigned' | 'service_purchased'
  title: string
  description: string
  timestamp: string
  user: string
  metadata?: Record<string, any>
}

// Mock KPIs
export const mockKPIs: DashboardKPI[] = [
  {
    id: 'total_students',
    title: 'Total de Alunos',
    value: 247,
    change: 12,
    changeType: 'increase',
    icon: 'users',
    color: 'blue'
  },
  {
    id: 'active_students',
    title: 'Alunos Ativos',
    value: 189,
    change: 8,
    changeType: 'increase',
    icon: 'trending-up',
    color: 'green'
  },
  {
    id: 'onboarding_students',
    title: 'Em Onboarding',
    value: 34,
    change: -3,
    changeType: 'decrease',
    icon: 'user-check',
    color: 'orange'
  },
  {
    id: 'revenue',
    title: 'Receita Mensal',
    value: 45200,
    change: 18,
    changeType: 'increase',
    icon: 'dollar-sign',
    color: 'purple'
  },
  {
    id: 'completion_rate',
    title: 'Taxa de Conclusão',
    value: 87,
    change: 5,
    changeType: 'increase',
    icon: 'check-circle',
    color: 'teal'
  },
  {
    id: 'avg_session',
    title: 'Tempo Médio Sessão',
    value: 42,
    change: -2,
    changeType: 'decrease',
    icon: 'clock',
    color: 'gray'
  }
]

// Mock trainer workload
export const mockTrainerWorkload: TrainerWorkload[] = [
  {
    id: 'trainer_1',
    name: 'Carlos Silva',
    studentsCount: 45,
    onboardingCount: 8,
    activeCount: 37,
    maxCapacity: 50
  },
  {
    id: 'trainer_2', 
    name: 'Ana Santos',
    studentsCount: 38,
    onboardingCount: 5,
    activeCount: 33,
    maxCapacity: 45
  },
  {
    id: 'trainer_3',
    name: 'João Costa',
    studentsCount: 52,
    onboardingCount: 12,
    activeCount: 40,
    maxCapacity: 55
  },
  {
    id: 'trainer_4',
    name: 'Maria Oliveira',
    studentsCount: 29,
    onboardingCount: 4,
    activeCount: 25,
    maxCapacity: 40
  },
  {
    id: 'trainer_5',
    name: 'Pedro Lima',
    studentsCount: 41,
    onboardingCount: 7,
    activeCount: 34,
    maxCapacity: 45
  }
]

// Generate mock time series data for 7 days
const generateTimeSeriesData = (days: number, baseValue: number, variance: number): TimeSeriesData[] => {
  const data: TimeSeriesData[] = []
  const today = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    const value = Math.max(0, baseValue + Math.floor(Math.random() * variance * 2 - variance))
    data.push({
      date: date.toISOString().split('T')[0],
      value,
      label: date.toLocaleDateString('pt-BR', { weekday: 'short' })
    })
  }
  
  return data
}

// Generate mock time series data for 30 days
const generateMonthlyData = (days: number, baseValue: number, variance: number): TimeSeriesData[] => {
  const data: TimeSeriesData[] = []
  const today = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    const value = Math.max(0, baseValue + Math.floor(Math.random() * variance * 2 - variance))
    data.push({
      date: date.toISOString().split('T')[0],
      value,
      label: `${date.getDate()}/${date.getMonth() + 1}`
    })
  }
  
  return data
}

// Mock time series for different ranges
export const mockTimeSeries = {
  '7d': {
    students: generateTimeSeriesData(7, 35, 8),
    revenue: generateTimeSeriesData(7, 1800, 400),
    sessions: generateTimeSeriesData(7, 42, 10)
  },
  '30d': {
    students: generateMonthlyData(30, 35, 12),
    revenue: generateMonthlyData(30, 1800, 600),
    sessions: generateMonthlyData(30, 42, 15)
  }
}

// Mock recent activity
export const mockRecentActivity: RecentActivity[] = [
  {
    id: 'act_1',
    type: 'student_created',
    title: 'Novo aluno cadastrado',
    description: 'Amanda Silva foi adicionada ao sistema',
    timestamp: '2025-08-20T16:30:00Z',
    user: 'Carlos Silva',
    metadata: { student_id: 'std_001', trainer_id: 'trainer_1' }
  },
  {
    id: 'act_2',
    type: 'student_moved',
    title: 'Aluno movido no Kanban',
    description: 'João Santos: Novo Aluno → Avaliação Física',
    timestamp: '2025-08-20T15:45:00Z',
    user: 'Ana Santos',
    metadata: { student_id: 'std_002', from: 'Novo Aluno', to: 'Avaliação Física' }
  },
  {
    id: 'act_3',
    type: 'trainer_assigned',
    title: 'Treinador atribuído',
    description: 'Pedro Lima foi atribuído a 3 novos alunos',
    timestamp: '2025-08-20T14:20:00Z',
    user: 'Sistema',
    metadata: { trainer_id: 'trainer_5', students_count: 3 }
  },
  {
    id: 'act_4',
    type: 'service_purchased',
    title: 'Serviço adquirido',
    description: 'Marina Costa adquiriu Personal Training Premium',
    timestamp: '2025-08-20T13:15:00Z',
    user: 'Maria Oliveira',
    metadata: { service: 'Personal Training Premium', value: 450 }
  },
  {
    id: 'act_5',
    type: 'student_moved',
    title: 'Aluno concluiu onboarding',
    description: 'Roberto Alves: Entrega do Treino → Concluído',
    timestamp: '2025-08-20T12:30:00Z',
    user: 'João Costa',
    metadata: { student_id: 'std_003', completed: true }
  },
  {
    id: 'act_6',
    type: 'student_created',
    title: 'Novo aluno cadastrado',
    description: 'Felipe Rodrigues foi adicionado ao sistema',
    timestamp: '2025-08-20T11:45:00Z',
    user: 'Carlos Silva',
    metadata: { student_id: 'std_004', trainer_id: 'trainer_1' }
  }
]

// Helper function to get filtered data by trainer
export const getFilteredData = (trainerId?: string) => {
  if (!trainerId) {
    return {
      kpis: mockKPIs,
      trainers: mockTrainerWorkload,
      timeSeries: mockTimeSeries,
      activity: mockRecentActivity
    }
  }

  // Filter data for specific trainer
  const trainer = mockTrainerWorkload.find(t => t.id === trainerId)
  if (!trainer) return null

  // Simulate filtered KPIs for trainer
  const filteredKPIs = mockKPIs.map(kpi => {
    switch (kpi.id) {
      case 'total_students':
        return { ...kpi, value: trainer.studentsCount }
      case 'active_students':
        return { ...kpi, value: trainer.activeCount }
      case 'onboarding_students':
        return { ...kpi, value: trainer.onboardingCount }
      default:
        return { ...kpi, value: Math.floor(kpi.value * (trainer.studentsCount / 50)) }
    }
  })

  const filteredActivity = mockRecentActivity.filter(
    activity => activity.user === trainer.name || activity.metadata?.trainer_id === trainerId
  )

  return {
    kpis: filteredKPIs,
    trainers: [trainer],
    timeSeries: mockTimeSeries,
    activity: filteredActivity
  }
}
