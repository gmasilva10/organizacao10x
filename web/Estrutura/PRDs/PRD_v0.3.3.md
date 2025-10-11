# 📑 PRD – Organização10x v0.3.3-dev
**Módulo atual**: Anamnese/Diretrizes  
**Patrocinador**: Personal Global  
**Consultor Externo**: [nome a confirmar]  
**GP**: Gustavo Moreira  
**DEV**: [nome do desenvolvedor]
**Última atualização**: 15/01/2025

---

## 1. 🎯 Visão Geral
O **Organização10x** é uma plataforma de gestão para personal trainers e seus alunos, com fluxo ponta-a-ponta desde cadastro até financeiro.  
Atualmente, estamos na **versão v0.3.3-dev**, com escopo focado no módulo **Anamnese/Diretrizes**, que se conecta ao roadmap geral:

1. Cadastro de Alunos  
2. Cadastro de Serviços  
3. Onboarding/Kanban  
4. Histórico  
5. Pagamentos  

---

## 2. 📌 Objetivo da Release v0.3.3-dev
- Implementar **sistema completo de Diretrizes de Treino** com motor de decisão baseado em regras
- Garantir **UI premium** e **consistência total com planilha fonte** (`C:\Projetos\Organizacao10x\Planilha\Anamnese - TOMADA DE DECISÃO.xlsx`)
- Implementar **sistema de versões** para controle de mudanças nas diretrizes
- Criar **catálogos especializados** (RIR, Protocolos, Prontidão, Tags)
- Validar performance (<400ms P95) e auditoria completa
- Preparar base para integração com histórico do aluno

---

## 3. 📊 Escopo Funcional
### 3.1. Funcionalidades Inclusas

#### **3.1.1. Sistema de Diretrizes de Treino**
- **Gestão de Versões**:
  - Criar, editar, publicar diretrizes
  - Sistema de versionamento (v1, v2, etc.)
  - Status: DRAFT, PUBLISHED, DEFAULT
  - Ações: Publicar, Corrigir versão, Definir como Padrão, Excluir, Despublicar

- **Sistema de Regras**:
  - Criar regras com condições baseadas em Tags canônicas
  - Operadores: Igual a, Diferente de, Maior que, Menor que, Contém, etc.
  - Prioridades: Crítica, Alta, Média, Baixa
  - Parâmetros de saída: Aeróbio, Pesos, Flex/Mob, Contraindicações, Observações

#### **3.1.2. Catálogos Especializados**
- **Catálogo RIR (Reps in Reserve)**:
  - Escala 5-10 (conforme planilha)
  - Matriz de conversão RIR → %1RM
  - Interface com tabela interativa e tooltips

- **Catálogo de Protocolos**:
  - 8 protocolos antropométricos com fórmulas LaTeX
  - Renderização com MathJax/KaTeX
  - Cálculos: densidade, %G, MG, MM

- **Catálogo de Prontidão**:
  - Escala de prontidão física
  - Dimensões: física, mental, emocional
  - Orientações de uso e interpretação

- **Catálogo de Tags**:
  - Tags canônicas categorizadas (Cardiovascular, Musculoesquelética, Metabólica, etc.)
  - Sistema de busca e filtros
  - Validação de tags válidas

#### **3.1.3. Motor de Decisão**
- **Entrada de dados**:
  - Antropometria (8 protocolos – fórmulas conforme planilha)
  - Métodos aeróbios: FCR, PSE, vVO2, MFEL (com rótulo **MFEL (Limiar)**)
  - Força: RIR → %1RM

- **Processamento**:
  - Motor de decisão aplicando regra combinada
  - "Mais restritivo vence"
  - União de contraindicações/observações
  - Aplicação sequencial de regras com identificadores

- **Saída (Preview Diretrizes)** em 5 seções:
  1. Aeróbio
  2. Pesos
  3. Flex/Mob
  4. Contraindicações
  5. Observações

#### **3.1.4. Interface Premium**
- **Modais Customizados**: Nunca usar alert/confirm nativos
- **TagSelect Premium**: Busca, categorização, seleção com mouse/teclado
- **Layout Responsivo**: Campos bem espaçados, sem scroll indevido
- **Acessibilidade**: data-testid para automação, roles ARIA
- **Feedback Visual**: Loading states, toasts, tooltips informativos

### 3.2. Fora do Escopo
- Integração com **Planos/Financeiro** (guard-rail explícito)
- Qualquer vinculação com pagamento ou pacotes
- Sistema de notificações push
- Relatórios avançados de performance  

---

## 4. 🎨 Requisitos de UX/UI Premium
- **Consistência visual** com a landing page
- **Zero scroll indevido** - campos dimensionados adequadamente
- **Navegação clara**: breadcrumb ou botão Voltar em todas as telas
- **Feedback imediato**: loading states, toasts, estados claros
- **Cross-browser testado**: Chrome, Edge, Safari, Firefox
- **Reuso de componentes**: VersionCard, TagSelect, modais customizados
- **Modais premium**: Nunca usar alert/confirm nativos do navegador
- **Acessibilidade**: data-testid, roles ARIA, navegação por teclado
- **Layout responsivo**: Adaptação para mobile e desktop
- **Cores semânticas**: Verde para sucesso, vermelho para erro, azul para info

---

## 5. 🧪 Critérios de Aceite

### **5.1. Fluxo Principal**
1. **Login e Navegação**:
   - Usuário loga no sistema e acessa Anamnese
   - Navega para "Diretrizes de Treino" sem erros
   - Interface carrega em <2s

2. **Gestão de Diretrizes**:
   - Criar nova diretriz com título e descrição
   - Editar diretriz existente (apenas DRAFT)
   - Publicar diretriz (validação de regras obrigatória)
   - Definir como padrão (apenas PUBLISHED)
   - Excluir diretriz (apenas DRAFT não-padrão)

3. **Sistema de Regras**:
   - Criar regra com condições baseadas em Tags
   - Selecionar tags com mouse e teclado
   - Adicionar/remover condições (mínimo 1)
   - Configurar parâmetros de saída
   - Salvar regra sem erros

4. **Catálogos**:
   - RIR: Escala 5-10, conversão %1RM correta
   - Protocolos: 8 fórmulas renderizadas com LaTeX
   - Prontidão: Escala e orientações claras
   - Tags: Busca, categorização, validação

5. **Preview Engine**:
   - Cenário A: Hipertensão → diretrizes específicas
   - Cenário B: Hipertensão + Betabloqueador → + orientação PSE
   - Cenário C: Faixas sem sobreposição → menor limite superior
   - Cenário D: Antropometria → cálculos ±0,02%G, ±0,1kg

6. **Performance e Qualidade**:
   - P95 <400ms em todas as operações
   - Evidências em **Atividades.txt** com timestamp
   - Testes automatizados passando 100%

---

## 6. 🔒 Requisitos Não Funcionais
- **Performance**: P95 <400ms em todas as operações
- **Segurança**: RLS ativa (Supabase), autenticação obrigatória
- **Auditoria**: logs completos de alterações (criar, editar, publicar, excluir)
- **Escalabilidade**: suporte a +10k alunos sem degradação
- **Disponibilidade**: 99.9% uptime
- **Backup**: Backup automático diário dos dados críticos
- **Monitoramento**: Logs de erro e performance em tempo real

---

## 7. 🛠️ Infraestrutura
- **Frontend**: Next.js 14 + React + TypeScript + Tailwind CSS + Shadcn/ui + Radix UI
- **Backend**: Supabase (Postgres com RLS) + Edge Functions
- **Testes**: TestSprite + Puppeteer + Jest + Vitest
- **QA**: Validação automática com planilha Excel + 4 cenários de teste
- **Deploy**: Vercel (frontend) + Supabase (backend)
- **Monitoramento**: Sentry + Analytics

---

## 8. 📅 Roadmap & Marcos

### **8.1. GATES Concluídos** ✅
- **D2.5**: UI e reuso do VersionCard – ✅ Aprovado
- **D2.6**: Ciclo de Vida de Versões – ✅ Aprovado
- **D2.7**: Catálogos UX + Fórmula RIR + Bug RIR – ✅ Aprovado
- **D2.8**: Tags Canônicas – ✅ Aprovado
- **D2.9**: Preview com Contrato Definitivo – ✅ Aprovado

### **8.2. GATES Em Andamento** 🚧
- **D3**: Motor real das diretrizes – 🚧 Em andamento
  - Modal "Ver" (leitura) com metadados
  - Preview engine completo com 4 cenários
  - Validação com planilha Excel

### **8.3. Próximos Marcos** 📋
- **Release v0.3.3**: Previsto após conclusão do D3
- **v0.3.4**: Integração com histórico do aluno
- **v0.4.0**: Módulo de Planos e Financeiro

---

## 9. ⚠️ Riscos e Mitigações
| Risco | Impacto | Mitigação |
|-------|----------|-----------|
| Divergência de cálculos vs planilha | Alto | Validar 100% com planilha antes de release |
| Performance acima de 400ms | Médio | Ajuste de queries + indexes Supabase |
| UX fora do padrão premium | Alto | Testes visuais + validação com usuário |
| Regressão em módulos já entregues | Médio | Automação QA obrigatória |
| Complexidade do sistema de regras | Alto | Documentação detalhada + testes unitários |
| Problemas de acessibilidade | Médio | Testes com screen readers + validação ARIA |

---

## 10. 📂 Governança

### **10.1. Documentação**
- **Atividades.txt**: Registro contínuo das tarefas com timestamp
- **Pendencias_0909.txt**: Controle de pendências da sprint
- **Checklist_Release_Validation.txt**: Check de aceite antes do deploy
- **PRD_v0.3.3.md**: Este documento (atualizado em 15/01/2025)

### **10.2. Evidências Obrigatórias**
- GIFs dos fluxos principais (criar, editar, publicar diretrizes)
- Screenshots dos catálogos funcionando
- Logs de performance (X-Query-Time <400ms)
- Relatório de testes automatizados (100% passando)
- Validação com planilha Excel (4 cenários)

### **10.3. Processo de Release**
1. **Desenvolvimento**: Implementação seguindo GATES
2. **QA Interna**: Testes automatizados + manuais
3. **Validação**: Comparação com planilha Excel
4. **Aprovação**: GP valida evidências
5. **Deploy**: Release para produção
6. **Monitoramento**: Acompanhamento pós-deploy

---

## 11. 📋 Checklist de Validação

### **11.1. Funcionalidades Core**
- [ ] Login e navegação funcionando
- [ ] Criar/editar/publicar diretrizes
- [ ] Sistema de regras com tags
- [ ] Catálogos (RIR, Protocolos, Prontidão, Tags)
- [ ] Preview engine com 4 cenários
- [ ] Performance <400ms P95

### **11.2. UX/UI Premium**
- [ ] Modais customizados (nunca nativos)
- [ ] TagSelect funcionando com mouse/teclado
- [ ] Layout responsivo sem scroll indevido
- [ ] Acessibilidade (data-testid, ARIA)
- [ ] Feedback visual (loading, toasts)

### **11.3. Qualidade**
- [ ] Testes automatizados 100% passando
- [ ] Validação com planilha Excel
- [ ] Logs de auditoria funcionando
- [ ] Evidências documentadas
- [ ] Aprovação do GP

---

**Documento atualizado em**: 15/01/2025  
**Versão**: v0.3.3-dev  
**Status**: Em desenvolvimento ativo
