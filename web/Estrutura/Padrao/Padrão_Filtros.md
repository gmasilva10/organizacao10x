# 📋 **MODELO PADRÃO DE FILTROS - SISTEMA ORGANIZAÇÃO 10X**

## 🎯 **VISÃO GERAL**

Este documento define o padrão visual e comportamental para todos os filtros do sistema, garantindo consistência e reutilização de componentes.

---

## 🎨 **LAYOUT PADRÃO (Baseado no Print 3)**

### **Estrutura Visual**
- **Tipo**: Modal/Drawer que abre da **direita para esquerda**
- **Posição**: Sobreposição do conteúdo principal
- **Largura**: Fixa, otimizada para controles de filtro
- **Fundo**: Branco com sombra sutil
- **Bordas**: Cantos arredondados

### **Componentes Internos**

#### **Header**
```tsx
<div className="flex items-center justify-between p-4 border-b">
  <div className="flex items-center gap-2">
    <Filter className="h-5 w-5 text-gray-600" />
    <h2 className="text-lg font-semibold">Filtros</h2>
  </div>
  <Button variant="ghost" size="sm" onClick={onClose}>
    <X className="h-4 w-4" />
  </Button>
</div>
```

#### **Body - Seções de Filtro**
```tsx
<div className="p-4 space-y-4">
  {/* Ação */}
  <div className="space-y-2">
    <Label className="text-sm font-medium">Ação</Label>
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Todas as Ações" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas as Ações</SelectItem>
        <SelectItem value="sent">Enviado</SelectItem>
        <SelectItem value="pending">Pendente</SelectItem>
        <SelectItem value="snoozed">Adiado</SelectItem>
        <SelectItem value="skipped">Ignorado</SelectItem>
      </SelectContent>
    </Select>
  </div>

  {/* Canal */}
  <div className="space-y-2">
    <Label className="text-sm font-medium">Canal</Label>
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Todos os Canais" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos os Canais</SelectItem>
        <SelectItem value="whatsapp">WhatsApp</SelectItem>
        <SelectItem value="email">E-mail</SelectItem>
        <SelectItem value="sms">SMS</SelectItem>
      </SelectContent>
    </Select>
  </div>

  {/* Template */}
  <div className="space-y-2">
    <Label className="text-sm font-medium">Template</Label>
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Todos os Templates" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos os Templates</SelectItem>
        <SelectItem value="MSG01">MSG01 - Boas-vindas</SelectItem>
        <SelectItem value="MSG02">MSG02 - Lembrete de Treino</SelectItem>
        {/* ... outros templates */}
      </SelectContent>
    </Select>
  </div>

  {/* Buscar */}
  <div className="space-y-2">
    <Label className="text-sm font-medium">Buscar</Label>
    <Input 
      placeholder="Buscar nos logs..." 
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
  </div>

  {/* Data Inicial */}
  <div className="space-y-2">
    <Label className="text-sm font-medium">Data Inicial</Label>
    <DatePicker
      placeholder="dd/mm/aaaa"
      value={dateFrom}
      onChange={setDateFrom}
    />
  </div>

  {/* Data Final */}
  <div className="space-y-2">
    <Label className="text-sm font-medium">Data Final</Label>
    <DatePicker
      placeholder="dd/mm/aaaa"
      value={dateTo}
      onChange={setDateTo}
    />
  </div>
</div>
```

#### **Footer - Botões de Ação**
```tsx
<div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
  <Button variant="outline" onClick={onClear}>
    Limpar
  </Button>
  <Button onClick={onApply} className="flex items-center gap-2">
    <RefreshCw className="h-4 w-4" />
    Aplicar Filtros
  </Button>
</div>
```

---

## 🎬 **COMPORTAMENTO PADRÃO**

### **Abertura e Fechamento**
- **Animação**: Slide-in da direita para esquerda
- **Duração**: 300ms ease-in-out
- **Overlay**: Fundo escurecido com opacidade 50%
- **Fechamento**: 
  - Clique no overlay
  - Tecla ESC
  - Botão X no header

### **Interação**
- **Aplicar**: Executa filtros e fecha modal
- **Limpar**: Reseta todos os campos para padrão
- **Cancelar**: Fecha modal sem aplicar filtros

---

## 📅 **MODELO PADRÃO DE CALENDÁRIO (Baseado no Print 4)**

### **Estrutura do Modal de Data**
```tsx
<div className="bg-white rounded-lg shadow-lg p-4">
  {/* Header do Calendário */}
  <div className="flex items-center justify-between mb-4">
    <Button variant="ghost" size="sm" onClick={previousMonth}>
      <ChevronLeft className="h-4 w-4" />
    </Button>
    <h3 className="text-lg font-semibold">
      {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
    </h3>
    <Button variant="ghost" size="sm" onClick={nextMonth}>
      <ChevronRight className="h-4 w-4" />
    </Button>
  </div>

  {/* Grade do Calendário */}
  <div className="grid grid-cols-7 gap-1 mb-4">
    {/* Dias da semana */}
    {['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].map(day => (
      <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
        {day}
      </div>
    ))}
    
    {/* Dias do mês */}
    {calendarDays.map(day => (
      <Button
        key={day.date}
        variant={day.isSelected ? "default" : "ghost"}
        size="sm"
        onClick={() => handleDateSelect(day.date)}
        className="h-8 w-8 p-0"
      >
        {day.day}
      </Button>
    ))}
  </div>

  {/* Seletor de Hora */}
  <div className="flex items-center gap-2 mb-4">
    <Clock className="h-4 w-4 text-gray-500" />
    <Input
      type="time"
      value={selectedTime}
      onChange={(e) => setSelectedTime(e.target.value)}
      className="w-24"
    />
  </div>

  {/* Botões de Ação */}
  <div className="flex justify-end gap-2">
    <Button variant="outline" onClick={onCancel}>
      Cancelar
    </Button>
    <Button onClick={onConfirm}>
      OK
    </Button>
  </div>
</div>
```

---

## 🛠️ **IMPLEMENTAÇÃO TÉCNICA**

### **Componente Base - FilterDrawer**
```tsx
interface FilterDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  title?: string
}

export function FilterDrawer({ open, onOpenChange, children, title = "Filtros" }: FilterDrawerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed right-0 top-0 h-full w-80 max-w-sm transform transition-transform duration-300 ease-in-out data-[state=open]:translate-x-0 data-[state=closed]:translate-x-full">
        {children}
      </DialogContent>
    </Dialog>
  )
}
```

### **Componente Base - DatePicker**
```tsx
interface DatePickerProps {
  placeholder?: string
  value?: Date
  onChange?: (date: Date) => void
}

export function DatePicker({ placeholder, value, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          <Calendar className="mr-2 h-4 w-4" />
          {value ? format(value, 'dd/MM/yyyy') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {/* Implementar calendário padrão aqui */}
      </PopoverContent>
    </Popover>
  )
}
```

---

## 📝 **CHECKLIST DE IMPLEMENTAÇÃO**

### **Para Novos Filtros**
- [ ] Usar `FilterDrawer` como container
- [ ] Implementar seções com labels consistentes
- [ ] Usar `DatePicker` para campos de data
- [ ] Implementar botões "Limpar" e "Aplicar Filtros"
- [ ] Testar animação slide-in da direita
- [ ] Validar responsividade

### **Para Campos de Data**
- [ ] Usar `DatePicker` padrão
- [ ] Implementar seletor de hora quando necessário
- [ ] Seguir layout do Print 4
- [ ] Validar formatação dd/MM/yyyy
- [ ] Testar navegação do calendário

---

## 🎯 **EXEMPLOS DE USO**

### **Filtro de Relacionamento**
```tsx
<FilterDrawer open={filtersOpen} onOpenChange={setFiltersOpen}>
  <FilterHeader title="Filtros de Relacionamento" />
  <FilterBody>
    <ActionFilter value={action} onChange={setAction} />
    <ChannelFilter value={channel} onChange={setChannel} />
    <TemplateFilter value={template} onChange={setTemplate} />
    <SearchFilter value={search} onChange={setSearch} />
    <DateRangeFilter from={dateFrom} to={dateTo} onChange={setDateRange} />
  </FilterBody>
  <FilterFooter onClear={clearFilters} onApply={applyFilters} />
</FilterDrawer>
```

### **Filtro de Ocorrências**
```tsx
<FilterDrawer open={filtersOpen} onOpenChange={setFiltersOpen}>
  <FilterHeader title="Filtros de Ocorrências" />
  <FilterBody>
    <StatusFilter value={status} onChange={setStatus} />
    <PriorityFilter value={priority} onChange={setPriority} />
    <DateRangeFilter from={dateFrom} to={dateTo} onChange={setDateRange} />
  </FilterBody>
  <FilterFooter onClear={clearFilters} onApply={applyFilters} />
</FilterDrawer>
```

### **Filtro de Onboarding**
```tsx
<OnboardingFilterDrawer open={filtersOpen} onOpenChange={setFiltersOpen}>
  <FilterHeader title="Filtros de Onboarding" />
  <FilterBody>
    <ColumnVisibilityFilter value={visibleColumns} onChange={setVisibleColumns} />
    <StatusFilter value={status} onChange={setStatus} />
    <ServiceFilter value={service} onChange={setService} />
    <ResponsibleFilter value={responsible} onChange={setResponsible} />
    <DateRangeFilter from={dateFrom} to={dateTo} onChange={setDateRange} />
    <SearchFilter value={search} onChange={setSearch} />
  </FilterBody>
  <FilterFooter onClear={clearFilters} onApply={applyFilters} />
</OnboardingFilterDrawer>
```

---

## 🔧 **FILTROS ESPECÍFICOS DO ONBOARDING**

### **Campos Disponíveis**
- **Colunas Visíveis**: Checkbox para mostrar/ocultar colunas específicas do Kanban
- **Status**: Onboarding, Ativo, Pausado
- **Serviço**: Personal Training, Aula em Grupo, Nutrição, Avaliação
- **Responsável**: Personal Trainer, Nutricionista, Coordenador
- **Data de Criação**: Range de datas (início e fim)
- **Data de Agendamento**: Range de datas (início e fim)
- **Busca**: Texto livre para buscar por nome, ID ou notas

### **Comportamentos Específicos**
- **Colunas Dinâmicas**: As opções de colunas visíveis são carregadas dinamicamente baseadas nas colunas existentes
- **Debounce de 300ms**: Para busca textual (mais rápido que Relacionamento)
- **Persistência**: Filtros salvos no localStorage com chave `onboarding_filters`

---

## 📊 **IMPLEMENTAÇÕES REALIZADAS**

### **Módulo Relacionamento**
**Data**: 2025-01-27  
**Arquivo**: `web/components/relationship/RelationshipFilterDrawer.tsx`  
**Status**: ✅ Implementado

**Campos implementados**:
- ✅ Ação (Select: todas, enviado, criado, pendente, adiado, ignorado, falhou)
- ✅ Canal (Select: todos, whatsapp, email, sms, manual, sistema)
- ✅ Template (Select: todos, MSG01-MSG10)
- ✅ Buscar (Input: busca nos logs)
- ✅ Data Inicial (Input type="text" com placeholder dd/mm/aaaa)
- ✅ Data Final (Input type="text" com placeholder dd/mm/aaaa)

**Funcionalidades**:
- ✅ Debounce de 500ms para busca textual
- ✅ Persistência em hook `useRelationshipFilters`
- ✅ Contador de filtros ativos no botão
- ✅ Botões inline: Status, Hoje, Filtros, Limpar, Atualizar

---

### **Módulo Onboarding**
**Data**: 2025-01-27  
**Arquivo**: `web/components/onboarding/OnboardingFilterDrawer.tsx`  
**Status**: ✅ Implementado

**Campos implementados**:
- ✅ Colunas Visíveis (Checkboxes dinâmicos)
- ✅ Status (Select: todos, onboarding, ativo, pausado)
- ✅ Serviço (Select: todos, personal training, grupo, nutrição, avaliação)
- ✅ Responsável (Select: todos, trainer, nutricionista, coordenador)
- ✅ Data de Criação (Range: início e fim)
- ✅ Data de Agendamento (Range: início e fim)
- ✅ Busca (Input: nome, ID, notas)

**Funcionalidades**:
- ✅ Debounce de 300ms para busca
- ✅ Persistência em localStorage `onboarding_filters`
- ✅ Colunas dinâmicas carregadas do board
- ✅ Contador de filtros ativos

---

### **Módulo Profissionais (Equipe)**
**Data**: 2025-01-27  
**Arquivo**: `web/components/team/ProfessionalsFilterDrawer.tsx`  
**Status**: ✅ Implementado

**Campos implementados**:
- ✅ Busca por nome/email (Input)
- ✅ Perfil Profissional (Select: todos, perfis disponíveis)
- ✅ Status (Select: todos, ativo, inativo)

**Funcionalidades**:
- ✅ Busca integrada ao hook `useProfessionalsFilters`
- ✅ Carregamento dinâmico de perfis via API
- ✅ Contador de filtros ativos

---

### **Módulo Ocorrências**
**Data**: 2025-01-27  
**Arquivo**: `web/components/occurrences/OccurrencesFiltersDrawer.tsx`  
**Status**: ✅ Implementado

**Campos implementados**:
- ✅ Período (Date range: de/até)
- ✅ Grupo (Select dinâmico via API)
- ✅ Tipo (Select dinâmico filtrado por grupo)
- ✅ Status (Select: abertas, encerradas, todas)
- ✅ Prioridade (Select: todas, baixa, média, alta)
- ✅ Sensível (Select: todos, sim, não)
- ✅ Lembrete (Select + campos condicionais)
  - Has reminder: todos, com lembrete, sem lembrete
  - Período do lembrete (datetime-local)
  - Status do lembrete (pendente, concluído, cancelado)
- ✅ Responsáveis (Checkboxes com lista de trainers)
- ✅ Busca rápida (Input: aluno, #ID, descrição)

**Funcionalidades**:
- ✅ Carregamento assíncrono de grupos, tipos e trainers
- ✅ Filtro em cascata (grupo → tipo)
- ✅ Campos condicionais (lembrete)
- ✅ Focus no primeiro campo ao abrir
- ✅ Hotkey ESC para fechar

---

### **Módulo Alunos**
**Data**: 2025-01-28  
**Arquivo**: `web/components/students/StudentsFilterDrawer.tsx`  
**Status**: ✅ Implementado

**Campos implementados**:
- ✅ Buscar por Nome (Input)
- ✅ Status (Select: todos, ativo, pausado, arquivado)
- ✅ Treinador (Select dinâmico)

**Funcionalidades**:
- ✅ Integração com busca inline (debounce via hook)
- ✅ Filtros aplicados automaticamente via React Query
- ✅ Contador de filtros ativos

---

## 📈 **COBERTURA DE IMPLEMENTAÇÃO**

### **Status Geral**
- **Módulos com filtros**: 5/7 (71%)
- **Módulos usando FilterDrawer**: 5/5 (100%)
- **Padrão aplicado**: ✅ 100% de conformidade

### **Componentes Base**
- ✅ `FilterDrawer` (`web/components/ui/filter-drawer.tsx`)
- ✅ `DatePicker` (documentado, implementação inline em cada drawer)
- ✅ `StandardizedCalendar` (`web/components/ui/standardized-calendar.tsx`)

### **Hooks de Filtros**
- ✅ `useRelationshipFilters` (`web/hooks/useRelationshipFilters.ts`)
- ✅ `useOnboardingFilters` (`web/hooks/useOnboardingFilters.ts`)
- ✅ `useProfessionalsFilters` (`web/hooks/useProfessionalsFilters.ts`)

---

**Última atualização**: 2025-01-28  
**Versão**: 1.2  
**Status**: ✅ Ativo e 100% implementado
