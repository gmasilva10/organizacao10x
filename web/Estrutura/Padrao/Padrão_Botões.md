# Padrão de Botões - Personal Global

## Informações do Documento

- **Criado em**: 2025-01-08
- **Última atualização**: 2025-01-08
- **Responsável**: AI Assistant
- **Versão**: 1.0
- **Status**: Ativo

## Objetivo

Este documento estabelece o padrão visual e comportamental para todos os botões do sistema Personal Global, garantindo consistência, acessibilidade e experiência do usuário uniforme em toda a aplicação.

## Padrões Identificados no Sistema

### 1. Botões de Navegação (Cards de Serviços)


**Padrão atual**:
```tsx
<Link href={service.href}>
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
```

**Características**:
- Card com hover effects (shadow, translate, border)
- Ícone colorido em container arredondado
- Texto "Acessar" + seta animada
- Transições suaves

### 2. Botões de Ação Primária

**Padrão**: Componente Button do shadcn/ui

**Variantes**:
```tsx
// Padrão (primário)
<Button>Salvar</Button>

// Com ícone
<Button>
  <Plus className="h-4 w-4 mr-2" />
  Nova venda
</Button>

// Gradiente (especial)
<Button className="rounded-full bg-gradient-to-r from-primary to-accent">
  Entrar
</Button>
```

### 3. Botões de Ação Secundária

**Padrão**:
```tsx
// Outline
<Button variant="outline">Cancelar</Button>

// Ghost
<Button variant="ghost">Editar</Button>

// Link
<Button variant="link">Ver detalhes</Button>
```

### 4. Botões de Ícone

**Padrão**:
```tsx
// Botão de ícone simples
<Button variant="ghost" size="sm">
  <Menu className="h-4 w-4" />
</Button>

// Botão de ícone arredondado
<Button variant="outline" size="icon" className="rounded-full">
  <Facebook className="h-4 w-4" />
</Button>
```

### 5. Botões de Toggle/Seleção

**Localização**: `web/app/(app)/app/services/financial/page.tsx`

**Padrão atual**:
```tsx
<button
  onClick={() => setActiveTab('plans')}
  className={`block rounded-lg border p-6 text-left transition-colors ${
    activeTab === 'plans'
      ? 'bg-primary text-primary-foreground'
      : 'bg-card hover:bg-accent'
  }`}
>
  <div className="flex items-center gap-2 mb-1">
    <Package className="h-4 w-4" />
    <h3 className="font-semibold">Planos</h3>
  </div>
  <p className="text-sm opacity-80">Gerencie serviços, planos e opções de preços.</p>
</button>
```

## Padrão Estabelecido

### 1. Hierarquia de Botões

#### **Primário (Ação Principal)**
- **Uso**: Ações principais (Salvar, Criar, Confirmar)
- **Estilo**: `variant="default"` ou gradiente especial
- **Cor**: Primary (#5B7CFA)
- **Exemplo**: 
```tsx
<Button className="bg-primary text-primary-foreground">
  <Plus className="h-4 w-4 mr-2" />
  Criar Novo
</Button>
```

#### **Secundário (Ação Secundária)**
- **Uso**: Ações secundárias (Cancelar, Editar, Ver)
- **Estilo**: `variant="outline"`
- **Cor**: Borda com hover
- **Exemplo**:
```tsx
<Button variant="outline">
  Cancelar
</Button>
```

#### **Tertiary (Ações Sutis)**
- **Uso**: Ações sutis (Editar inline, Configurar)
- **Estilo**: `variant="ghost"`
- **Cor**: Transparente com hover
- **Exemplo**:
```tsx
<Button variant="ghost" size="sm">
  <Settings className="h-4 w-4" />
</Button>
```

### 2. Tamanhos Padronizados

```tsx
// Pequeno - Para ações inline
<Button size="sm">Editar</Button>

// Padrão - Para ações principais
<Button>Salvar</Button>

// Grande - Para CTAs importantes
<Button size="lg">Começar Agora</Button>

// Ícone - Para ações compactas
<Button size="icon">
  <Plus className="h-4 w-4" />
</Button>
```

### 3. Estados dos Botões

#### **Normal**
```tsx
<Button>Salvar</Button>
```

#### **Loading**
```tsx
<Button disabled>
  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
  Salvando...
</Button>
```

#### **Desabilitado**
```tsx
<Button disabled>Salvar</Button>
```

#### **Perigoso**
```tsx
<Button variant="destructive">Excluir</Button>
```

### 4. Botões de Navegação

#### **Cards de Serviços**
```tsx
<Link href="/path">
  <Card className="group relative cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 border-l-4 border-l-transparent hover:border-l-primary">
    <CardContent className="p-4">
      <div className="bg-blue-50 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold mb-1">Título</h3>
      <p className="text-muted-foreground text-xs mb-3">Descrição</p>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Acessar</span>
        <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </CardContent>
  </Card>
</Link>
```

#### **Tabs/Seleção**
```tsx
<button
  onClick={() => setActiveTab('option')}
  className={`block rounded-lg border p-6 text-left transition-colors ${
    activeTab === 'option'
      ? 'bg-primary text-primary-foreground'
      : 'bg-card hover:bg-accent'
  }`}
>
  <div className="flex items-center gap-2 mb-1">
    <Icon className="h-4 w-4" />
    <h3 className="font-semibold">Título</h3>
  </div>
  <p className="text-sm opacity-80">Descrição</p>
</button>
```

### 5. Botões de Navegação entre Módulos

Usado para navegação entre diferentes módulos/serviços do sistema.

#### **Padrão**
```tsx
<button
  onClick={() => {
    setActiveService(service.title)
    window.location.href = service.href
  }}
  aria-pressed={activeService === service.title}
  aria-label={`Acessar ${service.title}`}
  className={`block rounded-lg border p-6 text-left transition-colors ${
    activeService === service.title
      ? 'bg-primary text-primary-foreground'
      : 'bg-card hover:bg-accent'
  }`}
>
  <div className="flex items-center gap-2 mb-1">
    <Icon className="h-4 w-4" />
    <h3 className="font-semibold">Título</h3>
  </div>
  <p className="text-sm opacity-80">Descrição</p>
</button>
```

#### **Características**
- **Estado visual claro**: Ativo (azul) vs Inativo (cinza com hover)
- **Ícone + título**: Na mesma linha com espaçamento adequado
- **Descrição**: Em linha separada com opacidade reduzida
- **Transições suaves**: Para mudanças de estado
- **Acessibilidade**: aria-pressed e aria-label apropriados
- **Navegação**: Redirecionamento via window.location.href

#### **Exemplo de Uso**
```tsx
// Página de Serviços - Navegação entre módulos
const services = [
  {
    title: "Financeiro",
    description: "Planos, categorias e configurações financeiras.",
    icon: Package,
    href: "/app/services/financial"
  }
]

// Grid responsivo
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
  {services.map((service) => (
    <button
      key={service.title}
      onClick={() => {
        setActiveService(service.title)
        window.location.href = service.href
      }}
      aria-pressed={activeService === service.title}
      aria-label={`Acessar ${service.title}`}
      className={`block rounded-lg border p-6 text-left transition-colors ${
        activeService === service.title
          ? 'bg-primary text-primary-foreground'
          : 'bg-card hover:bg-accent'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <service.icon className="h-4 w-4" />
        <h3 className="font-semibold">{service.title}</h3>
      </div>
      <p className="text-sm opacity-80">{service.description}</p>
    </button>
  ))}
</div>
```

### 6. Botões de Aba (Cards Compactos)

Usado para navegação entre diferentes seções dentro de um módulo.

#### **Padrão**
```tsx
<Card 
  className={`group relative cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
    activeTab === 'tab-value'
      ? 'border-l-4 border-l-primary shadow-md -translate-y-0.5'
      : 'border-l-4 border-l-transparent hover:border-l-primary'
  }`}
  onClick={() => setActiveTab('tab-value')}
  aria-pressed={activeTab === 'tab-value'}
  aria-label="Acessar Seção"
>
  <CardContent className="p-3">
    <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center mb-2">
      <Icon className="h-4 w-4" />
    </div>
    <h3 className="text-sm font-semibold mb-1">Título da Seção</h3>
    <p className="text-muted-foreground text-xs mb-2 line-clamp-2">Descrição da seção.</p>
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium">Acessar</span>
      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
    </div>
  </CardContent>
</Card>
```

#### **Tamanhos Padronizados (OBRIGATÓRIO)**
- **CardContent padding**: `p-3` (12px em todos os lados)
- **Gap do grid**: `gap-3` (12px entre cards)
- **Container do ícone**: `w-8 h-8` (32px × 32px)
- **Ícone**: `h-4 w-4` (16px × 16px)
- **Título**: `text-sm` (14px)
- **Descrição**: `text-xs` (12px)
- **Texto "Acessar"**: `text-xs font-medium` (12px, peso 500)
- **Seta (ArrowRight)**: `h-3 w-3` (12px × 12px)
- **Margem inferior do ícone**: `mb-2` (8px)
- **Margem inferior do título**: `mb-1` (4px)
- **Margem inferior da descrição**: `mb-2` (8px)
- **Border lateral (ativo)**: `border-l-4` (4px)

**⚠️ Importante**: Estes tamanhos são obrigatórios para manter a consistência visual em todos os módulos. Não alterar sem justificativa documentada.

#### **Controle de Largura Horizontal (OBRIGATÓRIO)**

A largura dos cards é controlada pelo sistema de grid do Tailwind CSS. **Nunca defina larguras fixas** (`w-[valor]`). Sempre use o grid responsivo:

**Regras por quantidade de cards**:

**2 cards** (exemplo: Configurações):
```tsx
<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
```
- Mobile: 1 coluna (100% width)
- Tablet (sm): 2 colunas (~50% cada)
- Desktop (lg): 3 colunas (~33% cada)
- Large Desktop (xl): 4 colunas (~25% cada)

**3 cards** (exemplo: Equipe):
```tsx
<div className="grid gap-3 sm:grid-cols-3">
```
- Mobile: 1 coluna (100% width)
- Tablet+ (sm): 3 colunas (~33% cada)

**4-5 cards** (exemplo: Financeiro com possibilidade de expansão):
```tsx
<div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
```
- Mobile: 1 coluna (100% width)
- Tablet (sm): 3 colunas (~33% cada)
- Desktop (lg): 4 colunas (~25% cada)
- Large Desktop (xl): 5 colunas (~20% cada)

**Princípio Fundamental**: 
- **Poucos cards** (2-3): Use breakpoints progressivos (lg/xl) para evitar esticamento excessivo
- **Muitos cards** (4+): Permita mais colunas em telas grandes para otimizar espaço
- **Largura ideal do card**: Entre 200px e 400px em telas desktop
- **Nunca ultrapasse**: 50% da largura da tela em desktop (max 2 colunas se apenas 2 cards)

**❌ ERRADO**:
```tsx
// NÃO fazer isso
<Card className="w-full" /> // Estica demais em telas grandes
<Card className="w-[300px]" /> // Largura fixa quebra responsividade
<div className="grid gap-4 sm:grid-cols-2"> // gap-4 está fora do padrão
```

**✅ CORRETO**:
```tsx
// Sistema de grid responsivo adequado ao número de cards
<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  <Card className="..." /> // Largura controlada pelo grid
</div>
```

#### **Características**
- **Cards compactos**: Estilo similar aos cards de serviços
- **Ícone colorido**: Container com cor de fundo e ícone
- **Estado visual claro**: Borda lateral azul quando ativo
- **Hover effects**: Sombra e movimento sutil
- **Texto "Acessar"**: Com seta animada
- **Acessibilidade**: aria-pressed e aria-label apropriados
- **Grid responsivo**: Adaptável a diferentes tamanhos de tela

#### **Exemplo de Uso - Módulo Equipe**
```tsx
// Página de Equipe - Navegação entre seções
const tabs = [
  {
    id: 'profiles',
    title: 'Funções',
    description: 'Gerencie funções e permissões dos profissionais.',
    icon: Shield,
    color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
  },
  {
    id: 'professionals',
    title: 'Profissionais',
    description: 'Cadastre e gerencie profissionais da equipe.',
    icon: Users,
    color: 'bg-green-50 dark:bg-green-900/20 text-green-600'
  },
  {
    id: 'defaults',
    title: 'Padrões',
    description: 'Configure responsáveis padrão para novos alunos.',
    icon: Settings,
    color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600'
  }
]

// Grid responsivo
<div className="grid gap-3 sm:grid-cols-3">
  {tabs.map((tab) => (
    <Card 
      key={tab.id}
      className={`group relative cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
        activeTab === tab.id
          ? 'border-l-4 border-l-primary shadow-md -translate-y-0.5'
          : 'border-l-4 border-l-transparent hover:border-l-primary'
      }`}
      onClick={() => setActiveTab(tab.id)}
      aria-pressed={activeTab === tab.id}
      aria-label={`Acessar ${tab.title}`}
    >
      <CardContent className="p-3">
        <div className={`${tab.color} w-8 h-8 rounded-lg flex items-center justify-center mb-2`}>
          <tab.icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold mb-1">{tab.title}</h3>
        <p className="text-muted-foreground text-xs mb-2 line-clamp-2">{tab.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Acessar</span>
          <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

### 7. Agrupamento de Botões

#### **Footer de Modal**
```tsx
<div className="flex justify-end gap-2 pt-2">
  <Button variant="outline" onClick={onCancel}>
    Cancelar
  </Button>
  <Button onClick={onSave}>
    Salvar
  </Button>
</div>
```

#### **Header de Ação**
```tsx
<div className="flex items-center justify-between">
  <div>
    <h3 className="text-lg font-semibold">Título</h3>
    <p className="text-sm text-muted-foreground">Descrição</p>
  </div>
  <Button onClick={onAction}>
    <Plus className="h-4 w-4 mr-2" />
    Nova Ação
  </Button>
</div>
```

### 6. Acessibilidade

#### **Atributos Obrigatórios**
```tsx
<Button
  aria-label="Descrição da ação"
  aria-pressed={isPressed} // Para toggles
  aria-expanded={isExpanded} // Para dropdowns
  aria-describedby="help-text-id" // Para ajuda
>
  Ação
</Button>
```

#### **Estados de Foco**
- Todos os botões têm `focus-visible` com ring
- Contraste adequado para modo escuro
- Navegação por teclado funcional

### 7. Animações e Transições

#### **Hover Effects**
- **Cards**: `hover:shadow-md hover:-translate-y-0.5`
- **Botões**: `hover:bg-primary/90`
- **Setas**: `group-hover:translate-x-0.5`

#### **Transições**
- **Duração**: `transition-all` (padrão)
- **Timing**: `transition-colors` para mudanças de cor
- **Transform**: `transition-transform` para movimentos

## Cores por Contexto

### **Primário**
- **Cor**: `#5B7CFA` (primary)
- **Uso**: Ações principais, CTAs
- **Hover**: `#4A6CF7`

### **Secundário**
- **Cor**: `#22D3EE` (accent)
- **Uso**: Ações secundárias, destaques
- **Hover**: `#06B6D4`

### **Destrutivo**
- **Cor**: `#EF4444` (destructive)
- **Uso**: Excluir, cancelar operações críticas
- **Hover**: `#DC2626`

### **Neutro**
- **Cor**: `#64748B` (muted)
- **Uso**: Ações sutis, links
- **Hover**: `#475569`

## Exemplos de Implementação

### **Formulário Padrão**
```tsx
<form>
  {/* Campos do formulário */}
  
  <div className="flex justify-end gap-2 pt-4">
    <Button type="button" variant="outline" onClick={onCancel}>
      Cancelar
    </Button>
    <Button type="submit" disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Salvando...
        </>
      ) : (
        'Salvar'
      )}
    </Button>
  </div>
</form>
```

### **Lista com Ações**
```tsx
<div className="space-y-4">
  {items.map(item => (
    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <h3 className="font-medium">{item.title}</h3>
        <p className="text-sm text-muted-foreground">{item.description}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="destructive" size="sm">
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  ))}
</div>
```

### **Header com Ação**
```tsx
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold">Título da Página</h1>
    <p className="text-muted-foreground">Descrição da página</p>
  </div>
  <Button onClick={onCreate}>
    <Plus className="h-4 w-4 mr-2" />
    Criar Novo
  </Button>
</div>
```

## Referência Rápida de Tamanhos

### **Cards de Aba Compactos**

| Elemento | Classe Tailwind | Tamanho Real | Uso |
|----------|----------------|--------------|-----|
| Card padding | `p-3` | 12px | Espaçamento interno do card |
| Gap do grid | `gap-3` | 12px | Espaço entre cards |
| Largura card | Controlada pelo grid | 200-400px ideal | Nunca usar largura fixa |
| Container ícone | `w-8 h-8` | 32px × 32px | Fundo colorido do ícone |
| Ícone | `h-4 w-4` | 16px × 16px | Tamanho do ícone Lucide |
| Título | `text-sm` | 14px | Nome da aba |
| Descrição | `text-xs` | 12px | Texto descritivo |
| Texto "Acessar" | `text-xs` | 12px | Label de ação |
| Seta | `h-3 w-3` | 12px × 12px | ArrowRight icon |
| Border lateral | `border-l-4` | 4px | Indicador visual ativo |

**Grid Responsivo**:
- Mobile: 1 coluna (padrão)
- Tablet: `sm:grid-cols-2` ou `sm:grid-cols-3`
- Desktop: `lg:grid-cols-3` a `xl:grid-cols-5` (conforme necessidade)

### **Módulos Já Padronizados**
✅ **Configurações** (`/app/settings`) - 2 abas em grid `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
✅ **Equipe** (`/app/team`) - 3 abas em grid `sm:grid-cols-3`
✅ **Financeiro** (`/app/services/financial`) - 2 abas em grid `sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`

**Nota importante sobre grids**: Quando há poucos cards (2-3), use breakpoints maiores (lg/xl) para evitar que os cards fiquem muito esticados horizontalmente. O grid deve expandir gradualmente conforme o tamanho da tela aumenta.

## Regras de Aplicação

### **Obrigatório**
1. **Consistência**: Todos os botões devem seguir este padrão
2. **Acessibilidade**: Sempre incluir `aria-label` quando necessário
3. **Estados**: Implementar loading, disabled e error states
4. **Hierarquia**: Respeitar a hierarquia primário > secundário > terciário
5. **Tamanhos**: Seguir rigorosamente os tamanhos padronizados da tabela de referência

### **Recomendado**
1. **Ícones**: Usar ícones do Lucide React consistentemente
2. **Agrupamento**: Agrupar botões relacionados
3. **Feedback**: Fornecer feedback visual para todas as ações
4. **Responsividade**: Testar em diferentes tamanhos de tela

### **Proibido**
1. **Cores customizadas**: Não usar cores fora do sistema de design
2. **Estilos inline**: Não usar estilos inline para botões
3. **Botões sem acessibilidade**: Não criar botões sem suporte a teclado
4. **Hierarquia confusa**: Não misturar hierarquias de botões

## Atualizações de Padrão

**2025-01-08**: Criação do documento de padrão baseado na análise dos componentes existentes no sistema Personal Global. Padrão estabelecido com base nos componentes shadcn/ui e padrões identificados nas páginas de serviços e navegação.

**2025-01-08**: Adicionada seção "Botões de Navegação entre Módulos" baseada no padrão dos botões de seleção de aba do módulo Financeiro. Aplicado na página principal de Serviços, substituindo os cards com Links por botões interativos com estado visual claro.

**2025-01-10**: Padronização dos botões de aba do módulo de Configurações (Organização e Integrações) seguindo o padrão de "Botões de Aba (Cards Compactos)" da seção 6. Implementação validada com browser automation confirmando:
- Cards compactos com padding p-3
- Ícones coloridos (azul para Organização, roxo para Integrações)
- Border-left azul quando ativo
- Hover effects (shadow, translate, seta animada)
- Texto "Acessar" + seta com transição
- Acessibilidade (aria-pressed, aria-label)
- Alternância de estado funcional
- Grid responsivo sm:grid-cols-2

**2025-01-10**: Adicionada seção "Referência Rápida de Tamanhos" com tabela completa de tamanhos padronizados para Cards de Aba Compactos. Validação visual confirmou consistência entre os módulos Equipe, Financeiro e Configurações:
- Todos os módulos usam padding p-3 (12px)
- Container de ícone: w-8 h-8 (32px × 32px)
- Ícones: h-4 w-4 (16px × 16px)
- Títulos: text-sm (14px)
- Descrições: text-xs (12px)
- Seta ArrowRight: h-3 w-3 (12px × 12px)
- Gap entre cards: gap-3 (12px)
- Border lateral ativo: border-l-4 (4px)
Screenshots de evidência: equipe-buttons-padrao.png, financeiro-buttons-padrao.png, comparacao-final-tamanhos.png

**2025-01-10**: Correção de tamanho horizontal dos cards do módulo Configurações. Ajustes aplicados:
- Alterado gap de `gap-4` (16px) para `gap-3` (12px) - padrão obrigatório
- Ajustado grid de `lg:grid-cols-2` para `lg:grid-cols-3 xl:grid-cols-4` para evitar cards muito esticados
- Resultado: Cards agora têm largura proporcional consistente com outros módulos
- Screenshot de evidência: configuracoes-corrigido-tamanho.png
- Lição aprendida: Com poucos cards (2-3), usar breakpoints maiores evita esticamento excessivo

**2025-01-10**: Adicionada seção completa "Controle de Largura Horizontal" ao padrão de Cards de Aba:
- Regras específicas por quantidade de cards (2, 3, 4-5 cards)
- Exemplos de grids responsivos para cada caso
- Princípio fundamental: largura ideal entre 200-400px, evitar > 50% em desktop
- Exemplos do que NÃO fazer (larguras fixas, gap incorreto)
- Exemplos do que fazer corretamente (grid responsivo)
- Atualizada tabela de referência rápida incluindo informações sobre largura
- Documentação completa garante consistência em futuros desenvolvimentos

## Validação

### **Checklist de Implementação**
- [ ] Botão segue hierarquia correta (primário/secundário/terciário)
- [ ] Tamanho adequado para o contexto
- [ ] Ícones consistentes do Lucide React
- [ ] Estados implementados (normal, loading, disabled, error)
- [ ] Acessibilidade com aria-labels apropriados
- [ ] Animações e transições suaves
- [ ] Responsividade testada
- [ ] Contraste adequado para modo escuro
- [ ] Agrupamento lógico com outros botões
- [ ] Feedback visual para ações do usuário

### **Testes Recomendados**
1. **Funcionalidade**: Botão executa ação esperada
2. **Acessibilidade**: Navegação por teclado funcional
3. **Responsividade**: Funciona em mobile e desktop
4. **Estados**: Loading, disabled e error funcionam corretamente
5. **Performance**: Animações suaves sem lag
6. **Consistência**: Visualmente alinhado com outros botões

---

## Implementações Realizadas

### **Módulo Relacionamento - Padronização Completa**

**Data**: 2025-01-28  
**Arquivo**: `web/app/(app)/app/relationship/page.tsx`  
**Mudanças aplicadas**:

#### Implementação
- ✅ **Removido**: Tabs tradicionais (`TabsList`, `TabsTrigger`)
- ✅ **Adicionado**: Cards Compactos com padrão visual consistente
- ✅ **Removido**: Lógica condicional `NEXT_PUBLIC_REL_KANBAN_SIMPLE`
- ✅ **Simplificado**: Usar apenas `RelationshipKanban` (removido `RelationshipKanbanSimple`)

#### Cards Implementados

**Card Kanban**:
- Ícone: `LayoutGrid` (lucide-react)
- Cor: `bg-blue-50 dark:bg-blue-900/20 text-blue-600`
- Título: "Kanban"
- Descrição: "Visualize e gerencie tarefas de relacionamento."

**Card Calendário**:
- Ícone: `Calendar` (lucide-react)
- Cor: `bg-green-50 dark:bg-green-900/20 text-green-600`
- Título: "Calendário"
- Descrição: "Visualize tarefas organizadas por data."

#### Classes CSS Aplicadas
- Container: `grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- Padding: `p-3`
- Ícone container: `w-8 h-8 rounded-lg flex items-center justify-center mb-2`
- Ícone: `h-4 w-4`
- Título: `text-sm font-semibold mb-1`
- Descrição: `text-muted-foreground text-xs mb-2 line-clamp-2`
- Texto "Acessar": `text-xs font-medium`
- Seta: `h-3 w-3 group-hover:translate-x-0.5 transition-transform`

#### Funcionalidades Preservadas
- ✅ Estado de navegação (`activeTab`) mantido
- ✅ Renderização condicional dos componentes preservada
- ✅ Componentes internos (`RelationshipKanban`, `RelationshipCalendar`) inalterados
- ✅ Acessibilidade (`aria-pressed`, `aria-label`) implementada
- ✅ Transições suaves e indicadores visuais de seleção

#### Estrutura Final
```tsx
<div className="space-y-6 container py-6">
  {/* Header com título e descrição */}
  <div>
    <h1 className="text-3xl font-bold tracking-tight">Relacionamento</h1>
    <p className="text-muted-foreground mt-2">
      Gerencie tarefas e comunicações com seus alunos.
    </p>
  </div>

  {/* Grid de Cards Compactos */}
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {/* Card Kanban - azul */}
    {/* Card Calendário - verde */}
  </div>

  {/* Conteúdo da aba ativa */}
  <div className="space-y-6">
    {activeTab === 'kanban' && <RelationshipKanban />}
    {activeTab === 'calendar' && <RelationshipCalendar />}
  </div>
</div>
```

**Data**: 2025-01-28  
**Status**: ✅ Aplicado e documentado
