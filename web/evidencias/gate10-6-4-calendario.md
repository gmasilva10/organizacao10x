# GATE 10.6.4 - CALENDÁRIO

**Data:** 2025-01-10  
**Status:** ✅ CONCLUÍDO  
**Próximo:** GATE 10.6.5 - Timeline mínima

## 🚀 CALENDÁRIO IMPLEMENTADO

### **1. Componente de Calendário (`RelationshipCalendar.tsx`)**
- **3 Visões:** Dia, Semana, Mês
- **Mesmas ações:** Do Kanban (Copiar, WhatsApp, Enviar, Snooze, Pular)
- **Navegação fluida:** Anterior, Hoje, Próximo
- **Filtros integrados:** Compartilhados com Kanban

### **2. Filtros Compartilhados (`RelationshipFilters.tsx`)**
- **Reutilizáveis:** Entre Kanban e Calendário
- **Estado persistente:** localStorage
- **Debounce:** Para busca (500ms)
- **Reset inteligente:** Limpar todos os filtros

### **3. Hook de Filtros (`useRelationshipFilters.ts`)**
- **Estado centralizado:** Compartilhado entre componentes
- **Persistência:** localStorage automática
- **Performance:** Debounce para busca
- **API otimizada:** Remove campos vazios

## ⚙️ ARQUITETURA DO CALENDÁRIO

### **Visões Implementadas:**

#### **1. Visão Dia:**
```typescript
const renderDayView = () => {
  const dayTasks = getTasksForDate(currentDate)
  
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {format(currentDate, 'dd \'de\' MMMM \'de\' yyyy', { locale: ptBR })}
        </h2>
        <p className="text-gray-600 capitalize">
          {format(currentDate, 'EEEE', { locale: ptBR })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dayTasks.map(renderTask)}
      </div>
    </div>
  )
}
```

#### **2. Visão Semana:**
```typescript
const renderWeekView = () => {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">
          {format(startDate, 'dd \'de\' MMM', { locale: ptBR })} - {format(endDate, 'dd \'de\' MMM \'de\' yyyy', { locale: ptBR })}
        </h2>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          const dayTasks = getTasksForDate(day)
          const isToday = isSameDay(day, new Date())
          const isWeekend = day.getDay() === 0 || day.getDay() === 6
          
          return (
            <div key={day.toISOString()} className="space-y-2">
              <div className={`text-center p-2 rounded-lg ${
                isToday 
                  ? 'bg-blue-100 text-blue-900 font-bold' 
                  : isWeekend 
                  ? 'bg-gray-100 text-gray-600' 
                  : 'bg-gray-50 text-gray-900'
              }`}>
                <div className="text-sm font-medium">
                  {format(day, 'EEE', { locale: ptBR })}
                </div>
                <div className="text-lg">
                  {format(day, 'd')}
                </div>
              </div>
              
              <div className="space-y-1 min-h-[200px]">
                {dayTasks.map(renderTask)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

#### **3. Visão Mês:**
```typescript
const renderMonthView = () => {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">
          {format(currentDate, 'MMMM \'de\' yyyy', { locale: ptBR })}
        </h2>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {/* Cabeçalho dos dias da semana */}
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="text-center p-2 font-medium text-gray-600 bg-gray-50 rounded-lg">
            {day}
          </div>
        ))}
        
        {/* Dias do mês */}
        {days.map((day, index) => {
          const dayTasks = getTasksForDate(day)
          const isToday = isSameDay(day, new Date())
          const isCurrentMonth = day.getMonth() === currentDate.getMonth()
          
          return (
            <div key={day.toISOString()} className="space-y-1 min-h-[120px]">
              <div className={`text-center p-2 rounded-lg ${
                isToday 
                  ? 'bg-blue-100 text-blue-900 font-bold' 
                  : isCurrentMonth 
                  ? 'bg-white text-gray-900' 
                  : 'bg-gray-50 text-gray-400'
              }`}>
                {format(day, 'd')}
              </div>
              
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map(renderTask)}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayTasks.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

### **Navegação Inteligente:**
```typescript
const navigatePrevious = () => {
  switch (viewMode) {
    case 'day':
      setCurrentDate(prev => subDays(prev, 1))
      break
    case 'week':
      setCurrentDate(prev => subWeeks(prev, 1))
      break
    case 'month':
      setCurrentDate(prev => subMonths(prev, 1))
      break
  }
}

const navigateNext = () => {
  switch (viewMode) {
    case 'day':
      setCurrentDate(prev => addDays(prev, 1))
      break
    case 'week':
      setCurrentDate(prev => addWeeks(prev, 1))
      break
    case 'month':
      setCurrentDate(prev => addMonths(prev, 1))
      break
  }
}
```

## 🔧 FILTROS COMPARTILHADOS

### **Hook de Filtros:**
```typescript
export function useRelationshipFilters() {
  const [filters, setFilters] = useState<RelationshipFilters>(DEFAULT_FILTERS)
  const [debouncedFilters, setDebouncedFilters] = useState<RelationshipFilters>(DEFAULT_FILTERS)
  
  // Debounce para busca (500ms)
  const debouncedQ = useDebounce(filters.q, 500)

  // Carregar filtros do localStorage na inicialização
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsedFilters = JSON.parse(saved)
        setFilters(parsedFilters)
        setDebouncedFilters(parsedFilters)
      }
    } catch (error) {
      console.warn('Erro ao carregar filtros do localStorage:', error)
    }
  }, [])

  // Salvar filtros no localStorage quando mudarem
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
    } catch (error) {
      console.warn('Erro ao salvar filtros no localStorage:', error)
    }
  }, [filters])

  return {
    filters,
    debouncedFilters,
    updateFilters,
    resetFilters,
    hasActiveFilters: hasActiveFilters(),
    getApiFilters,
    getActiveFiltersCount: getActiveFiltersCount()
  }
}
```

### **Componente de Filtros:**
```typescript
export default function RelationshipFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  showDateFilters = true,
  compact = false 
}: RelationshipFiltersProps) {
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => 
    key !== 'q' && value && value !== 'all'
  ) || filters.q.trim() !== ''

  return (
    <Card className={compact ? 'mb-4' : ''}>
      <CardHeader className={compact ? 'pb-3' : ''}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className={compact ? 'pt-0' : ''}>
        {/* Filtros implementados */}
      </CardContent>
    </Card>
  )
}
```

## 📊 FUNCIONALIDADES AVANÇADAS

### **1. Renderização de Tarefas:**
```typescript
const renderTask = (task: Task) => (
  <div
    key={task.id}
    className="bg-white border border-gray-200 rounded-lg p-2 mb-1 hover:shadow-sm transition-shadow cursor-pointer"
  >
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-1">
          <Badge 
            variant="outline" 
            className={`text-xs ${
              task.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
              task.status === 'due_today' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              task.status === 'sent' ? 'bg-green-50 text-green-700 border-green-200' :
              'bg-gray-50 text-gray-700 border-gray-200'
            }`}
          >
            {task.template_code}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {task.channel}
          </Badge>
        </div>
        
        <p className="text-xs font-medium text-gray-900 truncate">
          {task.student?.name || 'Aluno não encontrado'}
        </p>
        
        <p className="text-xs text-gray-600 line-clamp-2 mt-1">
          {task.payload.message}
        </p>

        <div className="flex items-center gap-1 mt-2">
          {/* Ações do card */}
        </div>
      </div>
    </div>
  </div>
)
```

### **2. Cálculo de Datas:**
```typescript
const { startDate, endDate, days } = useMemo(() => {
  let start: Date
  let end: Date

  switch (viewMode) {
    case 'day':
      start = currentDate
      end = currentDate
      break
    case 'week':
      start = startOfWeek(currentDate, { locale: ptBR })
      end = endOfWeek(currentDate, { locale: ptBR })
      break
    case 'month':
      start = startOfMonth(currentDate)
      end = endOfMonth(currentDate)
      break
  }

  const daysArray = eachDayOfInterval({ start, end })

  return {
    startDate: start,
    endDate: end,
    days: daysArray
  }
}, [currentDate, viewMode])
```

### **3. Filtros por Data:**
```typescript
const getTasksForDate = (date: Date) => {
  return tasks.filter(task => 
    isSameDay(new Date(task.scheduled_for), date)
  )
}
```

## 🔗 INTEGRAÇÃO COM SISTEMA EXISTENTE

### **Página Principal:**
- **Localização:** `web/app/app/relacionamento/page.tsx`
- **Tab:** Calendário integrado
- **Filtros:** Compartilhados com Kanban

### **Componentes Atualizados:**
- **RelationshipKanban:** Usa filtros compartilhados
- **RelationshipCalendar:** Usa filtros compartilhados
- **RelationshipFilters:** Componente reutilizável

## 🧪 TESTES REALIZADOS

### **1. Visões do Calendário:**
- ✅ **Dia:** Tarefas do dia atual
- ✅ **Semana:** Grid 7x1 com navegação
- ✅ **Mês:** Grid 7xN com cabeçalho

### **2. Navegação:**
- ✅ **Anterior/Próximo:** Funciona para todas as visões
- ✅ **Hoje:** Volta para data atual
- ✅ **Modos:** Troca entre Dia/Semana/Mês

### **3. Filtros:**
- ✅ **Compartilhados:** Entre Kanban e Calendário
- ✅ **Persistência:** localStorage
- ✅ **Debounce:** Busca otimizada
- ✅ **Reset:** Limpa todos os filtros

### **4. Ações:**
- ✅ **Mesmas do Kanban:** Copiar, WhatsApp, Enviar, Snooze, Pular
- ✅ **Responsivas:** Adaptam ao tamanho do card
- ✅ **Toasts:** Feedback consistente

## ✅ CRITÉRIOS DE ACEITE ATENDIDOS

- ✅ **3 Visões** implementadas (Dia, Semana, Mês)
- ✅ **Mesmas ações** do Kanban funcionando
- ✅ **Filtros integrados** com sistema existente
- ✅ **Navegação fluida** entre visões
- ✅ **Performance otimizada** com debounce
- ✅ **Estado persistente** no localStorage
- ✅ **UX Premium** consistente

## 🔧 ARQUIVOS CRIADOS

- `web/components/relationship/RelationshipCalendar.tsx` - Calendário principal
- `web/components/relationship/RelationshipFilters.tsx` - Filtros compartilhados
- `web/hooks/useRelationshipFilters.ts` - Hook de gerenciamento
- `web/evidencias/gate10-6-4-calendario.md` - Esta documentação

## 🔧 ARQUIVOS MODIFICADOS

- `web/components/relationship/RelationshipKanban.tsx` - Integração com filtros
- `web/app/app/relacionamento/page.tsx` - Integração do calendário

## 🚀 PRÓXIMO PASSO

**GATE 10.6.5 - Timeline mínima**
- Logs do relacionamento no detalhe do aluno
- Lista cronológica de eventos
- Integração com sistema de alunos existente
