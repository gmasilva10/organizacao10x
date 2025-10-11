# 📋 RESUMO DE PADRONIZAÇÕES - SISTEMA PERSONAL GLOBAL 2025

## 📊 Informações do Documento

- **Criado em**: 2025-01-28
- **Última atualização**: 2025-01-28
- **Responsável**: AI Assistant + Equipe Dev
- **Versão**: 1.0
- **Status**: ✅ Ativo

---

## 🎯 OBJETIVO

Este documento consolida todas as padronizações de interface implementadas no sistema Personal Global durante 2025, servindo como referência rápida para validação de consistência e guia para novos desenvolvimentos.

---

## 📐 PADRÕES ESTABELECIDOS

### 1️⃣ **Cards Compactos de Navegação**

**Documentação completa**: `web/Estrutura/Padrão_Botões.md` (Seção 6)

#### **Quando Usar**
✅ Navegação entre seções dentro de um módulo (tabs/abas)  
✅ Múltiplas visualizações do mesmo contexto  
❌ Módulos com visualização única  
❌ Listas/tabelas de dados  

#### **Especificação Técnica**
```tsx
<Card 
  className={`group relative cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
    isActive
      ? 'border-l-4 border-l-primary shadow-md -translate-y-0.5'
      : 'border-l-4 border-l-transparent hover:border-l-primary'
  }`}
  onClick={handleClick}
  aria-pressed={isActive}
  aria-label="Acessar Seção"
>
  <CardContent className="p-3">
    <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center mb-2">
      <Icon className="h-4 w-4" />
    </div>
    <h3 className="text-sm font-semibold mb-1">Título</h3>
    <p className="text-muted-foreground text-xs mb-2 line-clamp-2">Descrição</p>
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium">Acessar</span>
      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
    </div>
  </CardContent>
</Card>
```

#### **Tamanhos Obrigatórios**
| Elemento | Classe | Tamanho | Obrigatório |
|----------|--------|---------|-------------|
| Card padding | `p-3` | 12px | ✅ |
| Gap do grid | `gap-3` | 12px | ✅ |
| Container ícone | `w-8 h-8` | 32×32px | ✅ |
| Ícone | `h-4 w-4` | 16×16px | ✅ |
| Título | `text-sm` | 14px | ✅ |
| Descrição | `text-xs` | 12px | ✅ |
| Texto "Acessar" | `text-xs` | 12px | ✅ |
| Seta ArrowRight | `h-3 w-3` | 12×12px | ✅ |
| Border lateral | `border-l-4` | 4px | ✅ |

#### **Grids Responsivos por Quantidade**

**2 cards** (Ex: Configurações, Relacionamento):
```tsx
<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
```

**3 cards** (Ex: Equipe):
```tsx
<div className="grid gap-3 sm:grid-cols-3">
```

**4-5 cards** (Ex: Financeiro):
```tsx
<div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
```

**⚠️ Princípio fundamental**: Nunca usar larguras fixas. Largura ideal: 200-400px em desktop.

---

### 2️⃣ **Filtros Avançados (Modal/Drawer)**

**Documentação completa**: `web/Estrutura/Padrão_Filtros.md`

#### **Quando Usar**
✅ Filtros com 4+ campos  
✅ Filtros de data, período, ranges  
✅ Seleções múltiplas (checkboxes)  
❌ Filtros simples (1-2 campos inline)  

#### **Especificação Técnica**
- **Tipo**: Drawer que abre da direita para esquerda
- **Componente base**: `FilterDrawer` (`web/components/ui/filter-drawer.tsx`)
- **Largura**: `w-80 max-w-sm` (320px)
- **Animação**: `transition-transform duration-300 ease-in-out`

#### **Estrutura Padrão**
```tsx
<FilterDrawer
  open={open}
  onOpenChange={setOpen}
  title="Filtros de [Módulo]"
  onClear={handleClear}
  onApply={handleApply}
>
  <div className="space-y-4">
    {/* Campo de filtro 1 */}
    <div className="space-y-2">
      <Label className="text-sm font-medium">Label</Label>
      <Select>...</Select>
    </div>
    
    {/* Campo de filtro 2 */}
    {/* ... */}
  </div>
</FilterDrawer>
```

#### **Comportamento Obrigatório**
- ✅ Fechar ao pressionar ESC
- ✅ Fechar ao clicar no overlay
- ✅ Botão "Limpar" reseta todos os campos
- ✅ Botão "Aplicar Filtros" fecha o drawer e executa filtros
- ✅ Contador de filtros ativos no botão de abertura

---

## ✅ MÓDULOS PADRONIZADOS

### **Módulo: Relacionamento**
**Rota**: `/app/relationship`  
**Data**: 2025-01-28  
**Status**: ✅ Concluído

**Implementações**:
- ✅ Cards Compactos implementados (Kanban + Calendário)
- ✅ Filtros com drawer padrão
- ✅ Grid responsivo `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- ✅ Ícones: `LayoutGrid` (azul), `Calendar` (verde)
- ✅ Documentado em `Padrão_Botões.md`

**Arquivo**: `web/app/(app)/app/relationship/page.tsx`

**Screenshot**: `.playwright-mcp/relationship-plan-validated.png`

---

### **Módulo: Equipe**
**Rota**: `/app/team`  
**Data**: 2025-01-28  
**Status**: ✅ Concluído

**Implementações**:
- ✅ Cards Compactos implementados (Funções + Profissionais + Padrões)
- ✅ Grid responsivo `sm:grid-cols-3`
- ✅ Banner de versão visível
- ✅ Endpoint `/api/health` funcional
- ✅ Migração `20250128_equipe_p1_final_v2` aplicada

**Arquivo**: `web/app/(app)/app/team/page.tsx`

**Screenshot**: `.playwright-mcp/modulo-equipe-validado-final.png`

---

### **Módulo: Configurações**
**Rota**: `/app/settings`  
**Data**: 2025-01-10  
**Status**: ✅ Concluído

**Implementações**:
- ✅ Cards Compactos implementados (Organização + Integrações)
- ✅ Grid responsivo `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- ✅ Ícones: `Building2` (azul), `Plug` (roxo)
- ✅ Tamanho horizontal corrigido (gap-3, breakpoints adequados)

**Arquivo**: `web/app/(app)/app/settings/page.tsx`

**Screenshots**: 
- `.playwright-mcp/configuracoes-corrigido-tamanho.png`
- `.playwright-mcp/comparacao-final-tamanhos.png`

---

### **Módulo: Financeiro (Serviços)**
**Rota**: `/app/services/financial`  
**Data**: 2025-01-08  
**Status**: ✅ Concluído

**Implementações**:
- ✅ Cards Compactos implementados (Planos + Categorias)
- ✅ Grid responsivo `sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`
- ✅ Ícones: `Package` (azul), `FolderKanban` (verde)

**Arquivo**: `web/app/(app)/app/services/financial/page.tsx`

**Screenshot**: `.playwright-mcp/financeiro-buttons-padrao.png`

---

### **Módulo: Alunos**
**Rota**: `/app/students`  
**Data**: 2025-01-28  
**Status**: ✅ Filtros Padronizados

**Implementações**:
- ✅ FilterDrawer implementado (`StudentsFilterDrawer.tsx`)
- ✅ Filtros: busca, status, treinador
- ✅ Contador de filtros ativos
- ✅ Botão de filtros com badge

**Arquivo**: `web/app/(app)/app/students/page.tsx`

**Observação**: Módulo usa visualização única (Cards/Tabela toggle), não precisa de Cards Compactos de navegação.

---

## ⏭️ MÓDULOS ANALISADOS (NÃO REQUEREM PADRONIZAÇÃO)

### **Módulo: Onboarding**
**Rota**: `/app/onboarding`  
**Status**: ✅ Não requer Cards Compactos

**Motivo**: Visualização única (Kanban). Já possui filtros padronizados (`OnboardingFilterDrawer`).

**Screenshot**: `.playwright-mcp/onboarding-analise-atual.png`

---

### **Módulo: Ocorrências**
**Rota**: `/app/workflow/occurrences`  
**Status**: ✅ Não requer Cards Compactos

**Motivo**: Visualização única (Tabela). Já possui filtros padronizados (`OccurrencesFiltersDrawer`).

**Screenshot**: `.playwright-mcp/occurrences-analise-atual.png`

---

## 📚 DOCUMENTAÇÃO DE REFERÊNCIA

### **Documentos Principais**

1. **`web/Estrutura/Padrao/Padrão_Botões.md`**
   - Padrão completo de botões e cards de navegação
   - Seção 6: Cards Compactos de Aba (especificação completa)
   - Referência rápida de tamanhos
   - Implementações realizadas
   - **Status**: ✅ Atualizado e validado

2. **`web/Estrutura/Padrao/Padrão_Filtros.md`**
   - Padrão de filtros Modal/Drawer
   - Layout, comportamento e acessibilidade
   - Exemplos de implementação
   - Componentes base
   - **Status**: ✅ Atualizado e validado

3. **`web/Estrutura/Padrao/Padronizacao.txt`**
   - Padronização geral do sistema
   - Stack, commits, UI/UX, acessibilidade
   - RBAC, telemetria, auth
   - **Status**: ✅ Mantido como referência geral

---

## 🎨 PALETA DE CORES PADRONIZADA

### **Cores de Ícones em Cards**

| Contexto | Background | Text | Uso |
|----------|-----------|------|-----|
| Primary (Azul) | `bg-blue-50 dark:bg-blue-900/20` | `text-blue-600` | Funções principais, Kanban |
| Success (Verde) | `bg-green-50 dark:bg-green-900/20` | `text-green-600` | Calendário, dados positivos |
| Warning (Amarelo) | `bg-yellow-50 dark:bg-yellow-900/20` | `text-yellow-600` | Alertas, atenção |
| Info (Roxo) | `bg-purple-50 dark:bg-purple-900/20` | `text-purple-600` | Configurações, integrações |

---

## ✅ CHECKLIST DE VALIDAÇÃO

### **Para Novos Módulos com Cards Compactos**

- [ ] Usar componente `Card` do shadcn/ui
- [ ] Padding `p-3` no `CardContent`
- [ ] Container de ícone `w-8 h-8`
- [ ] Ícone `h-4 w-4` do lucide-react
- [ ] Título `text-sm font-semibold`
- [ ] Descrição `text-xs` com `line-clamp-2`
- [ ] Texto "Acessar" + seta `ArrowRight h-3 w-3`
- [ ] Grid responsivo adequado ao número de cards
- [ ] Gap `gap-3` entre cards
- [ ] Border lateral `border-l-4` quando ativo
- [ ] Hover effects (shadow, translate)
- [ ] Acessibilidade (`aria-pressed`, `aria-label`)
- [ ] Transições suaves (`transition-all`)
- [ ] Darkmode suportado
- [ ] Testado em mobile e desktop

### **Para Novos Módulos com Filtros**

- [ ] Usar `FilterDrawer` base se 4+ campos
- [ ] Drawer abre da direita para esquerda
- [ ] Header com ícone `Filter` e título
- [ ] Footer com botões "Limpar" e "Aplicar Filtros"
- [ ] Fechar com ESC
- [ ] Fechar clicando no overlay
- [ ] Botão de abertura com contador de filtros ativos
- [ ] Estados de filtro persistidos (se aplicável)
- [ ] Animações suaves (300ms ease-in-out)

---

## 📊 ESTATÍSTICAS DE PADRONIZAÇÃO

### **Módulos Totais Analisados**: 7

**Com Cards Compactos**: 4
- ✅ Relacionamento
- ✅ Equipe
- ✅ Configurações
- ✅ Financeiro (Serviços)

**Sem Cards Compactos (Adequado)**: 3
- ✅ Onboarding (visualização única)
- ✅ Ocorrências (visualização única)
- ✅ Alunos (visualização única)

### **Cobertura de Filtros Padronizados**: 100%

- ✅ Relacionamento (`RelationshipFilterDrawer`)
- ✅ Equipe (sem filtros complexos)
- ✅ Configurações (sem filtros)
- ✅ Financeiro (sem filtros)
- ✅ Onboarding (`OnboardingFilterDrawer`)
- ✅ Ocorrências (`OccurrencesFiltersDrawer`)
- ✅ Alunos (`StudentsFilterDrawer`)

---

## 🚀 PRÓXIMAS AÇÕES RECOMENDADAS

### **Alta Prioridade**
1. ✅ Validar consistência visual em todos os módulos (Browser testing)
2. ⏳ Implementar testes automatizados para padrões de UI
3. ⏳ Documentar padrões de acessibilidade (WCAG AA)

### **Média Prioridade**
4. ⏳ Criar Storybook com exemplos de todos os padrões
5. ⏳ Implementar linting de padrões UI (ESLint custom rules)
6. ⏳ Otimizar performance (lazy loading, memoization)

### **Baixa Prioridade**
7. ⏳ Criar guia de contribuição com padrões
8. ⏳ Implementar dark mode em 100% dos componentes
9. ⏳ Revisar e consolidar paleta de cores

---

## 📝 NOTAS IMPORTANTES

### **Lições Aprendidas**

1. **Grid Responsivo**: Com poucos cards (2-3), usar breakpoints maiores (lg/xl) evita esticamento excessivo em telas grandes.

2. **Análise Antes da Implementação**: Usar `@Browser` para análise real do módulo antes de planejar mudanças previne trabalho desnecessário.

3. **Documentação Viva**: Manter documentos atualizados durante a implementação (não depois) garante precisão.

4. **Consistência > Perfeição**: É melhor ter um padrão simples e consistente em 100% dos módulos do que padrões complexos em apenas alguns.

5. **Validação Visual**: Screenshots e browser automation são essenciais para confirmar que o código implementado está correto no ambiente real.

### **Armadilhas Comuns**

❌ **Usar larguras fixas**: `w-[300px]` → ✅ Usar grid responsivo  
❌ **Gap incorreto**: `gap-4` → ✅ Sempre usar `gap-3`  
❌ **Ícones grandes demais**: `h-5 w-5` → ✅ Sempre `h-4 w-4`  
❌ **Padding inconsistente**: `p-4` → ✅ Sempre `p-3`  
❌ **Esquecer dark mode**: `bg-blue-50` sem dark → ✅ `bg-blue-50 dark:bg-blue-900/20`  
❌ **Sem acessibilidade**: Botão sem aria → ✅ Sempre usar `aria-pressed`, `aria-label`  

---

## 🔄 CONTROLE DE VERSÃO

| Versão | Data | Alterações | Responsável |
|--------|------|------------|-------------|
| 1.0 | 2025-01-28 | Criação do documento consolidado | AI Assistant |

---

## 📞 CONTATO E SUPORTE

Para dúvidas sobre padrões ou sugestões de melhoria, consultar:
- **Documentação**: `web/Estrutura/`
- **Código de referência**: Módulos padronizados listados acima
- **Screenshots de evidência**: `.playwright-mcp/`

---

**Última revisão**: 2025-01-28  
**Próxima revisão**: 2025-02-28  
**Status do documento**: ✅ Ativo e atualizado

