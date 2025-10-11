# 📚 Estrutura de Documentação - Personal Global

**Última atualização**: 2025-10-11  
**Versão**: 2.0  
**Status**: ✅ Reorganizado e Ativo

---

## 🎯 Visão Geral

Este diretório contém toda a documentação técnica, padrões, pendências, relatórios e evidências do sistema Personal Global. A estrutura foi reorganizada para facilitar navegação, manutenção e escalabilidade.

---

## 📁 Estrutura de Pastas

### **`Padrao/`** - Padrões Técnicos
Documentação de padrões de desenvolvimento, UI/UX e arquitetura.

**Arquivos**:
- `Padrão_Botões.md` - Padrão completo de botões e Cards Compactos
- `Padrão_Filtros.md` - Padrão de filtros Modal/Drawer
- `Padrao_tela_cadastro.md` - Padrão de telas de cadastro
- `Padronizacao.txt` - Padronização geral (código, UI/UX, RBAC, telemetria)
- `RESUMO_PADRONIZACOES_2025.md` - Resumo consolidado de todas as padronizações

**Quando consultar**: Ao implementar novos componentes, módulos ou features que precisam seguir padrões estabelecidos.

---

### **`Pendencias/`** - Tarefas e Pendências
Lista de pendências, atividades e tarefas organizadas por período.

**Arquivos**:
- `Pendencias_202510.md` - Pendências de Outubro 2025 (ATIVO)
- `Pendencias_0903.txt` - Pendências de 09/03
- `Pendencias_0909.txt` - Pendências de 09/09
- `Pendencias_Agosto2025.txt` - Pendências de Agosto 2025
- `Pendencias_Setembro2025.txt` - Pendências de Setembro 2025
- `Pendencias.txt` - Pendências gerais
- `Atividades.txt` - Lista de atividades

**Quando consultar**: Para verificar tarefas pendentes, prioridades e próximos passos.

---

### **`Relatorios/`** - Relatórios e Auditorias
Relatórios de auditoria, migração, qualidade e validações realizadas.

**Categorias**:
- Migrações (MIGRACAO_*.md)
- Auditorias (AUDITORIA_*.md, AUDITORIA_*.txt)
- Relatórios Executivos (RELATORIO_*.md, RESUMO_*.md)
- Validações (VALIDACAO_*.md, VALIDACAO_*.txt)
- Correções (CORRECAO_*.md)
- Soluções (SOLUCAO_*.md)
- Resultados (RESULTADO_*.txt)

**Quando consultar**: Para revisar histórico de mudanças, auditorias e validações do sistema.

---

### **`Gates/`** - Documentação de Gates
Documentação de gates de validação e entrega.

**Conteúdo**:
- `GATE_13A_Templates/` - Templates e schemas de anamnese
- `GATE_D1_1_EVIDENCIAS.md` - Evidências do Gate D1.1

**Quando consultar**: Durante processo de validação de entregas e gates de qualidade.

---

### **`PRDs/`** - Product Requirements Documents
Documentos de requisitos de produto por versão.

**Arquivos**:
- `PRD_Relacionamento_v0.4.x.md` - PRD do módulo Relacionamento
- `PRD_v0.3.3.md` - PRD da versão 0.3.3
- `PRD_v0.4.0.md` - PRD da versão 0.4.0

**Quando consultar**: Para entender requisitos de features, escopo de versões e especificações de produto.

---

### **`Planejamento/`** - Planos de Ação e Realinhamento
Planos estratégicos, realinhamentos e ações de desenvolvimento.

**Arquivos**:
- `Plano_Merge_v01.md` - Plano de merge
- `Plano_Realinhamento_*.txt` - Planos de realinhamento por data
- `Plano_Realinhamento_Alunos_v0.4.0.txt` - Realinhamento do módulo Alunos
- `plan_reauditoria.md` - Plano de reauditoria
- `plan.md` - Plano geral

**Quando consultar**: Para revisar decisões estratégicas e planos de ação implementados.

---

### **`Arquivo/`** - Documentos Históricos
Documentos antigos da pasta `Estrutura/` raiz (consolidação).

**Conteúdo**:
- Documentos de auditoria antigos
- Migrações históricas
- Diagnósticos antigos
- Planos de ação arquivados

**Quando consultar**: Apenas para referência histórica ou arqueologia de decisões passadas.

---

### **`Checklists/`** - Checklists de Validação
Checklists para validação de releases, features e qualidade.

**Arquivos**:
- `Checklist_Release_Validation.txt` - Checklist de validação de release
- `Checklist_Validacao_Dropdowns_Modais.txt` - Checklist de dropdowns e modais
- `CHECKLIST_TENANT_ID_ZERO.md` - Checklist de tenant ID zero

**Quando consultar**: Antes de releases, deploys e validações de qualidade.

---

### **`Instrucoes/`** - Instruções e Procedimentos
Guias de procedimentos, instruções de teste e configuração.

**Arquivos**:
- `Procedimento_Login.txt` - Procedimento de login
- `guia_de_teste.txt` - Guia de testes

**Quando consultar**: Ao executar procedimentos específicos ou configurar ambientes.

---

### **Pastas de Estados e Amostras**

#### **`account/`** - Estados e samples de account
JSON de estados de menu, telemetria, wizard, etc.

#### **`equipe/`** - Histórico de desenvolvimento do módulo Equipe
JSONs de fixes, features e polimentos do módulo Equipe (P1).

#### **`integracoes/`** - Documentação de integrações
Docs de WhatsApp, Eduzz, Hotmart e outras integrações.

#### **`profile/`** - Estados de profile
JSONs de edição e visualização de perfis.

#### **`screenshots/`** - Screenshots de validação
Evidências visuais de implementações e validações.

#### **`smoke_2025-08-20/`** - Resultados de smoke tests
Resultados de testes de fumaça executados.

#### **`students/`** - Estados e samples de students
JSONs de estados do módulo de alunos.

#### **`val03/`, `val04/`** - Validações históricas
Resultados de validações de gates específicos.

#### **`Dailys/`** - Reuniões e Dailys
Atas de reuniões e alinhamentos diários.

---

## 🚀 Guia Rápido de Navegação

### **Preciso implementar um novo componente**
→ Consultar `Padrao/Padrão_Botões.md` e `Padrao/RESUMO_PADRONIZACOES_2025.md`

### **Preciso criar filtros em um módulo**
→ Consultar `Padrao/Padrão_Filtros.md`

### **Preciso saber o que fazer próximo**
→ Consultar `Pendencias/Pendencias_202510.md`

### **Preciso entender uma migração passada**
→ Consultar `Relatorios/MIGRACAO_*.md`

### **Preciso validar uma entrega (gate)**
→ Consultar `Gates/` e `Checklists/`

### **Preciso entender requisitos de uma feature**
→ Consultar `PRDs/PRD_v*.md`

### **Preciso revisar decisões estratégicas**
→ Consultar `Planejamento/Plano_*.md`

---

## 📊 Estatísticas

- **Total de arquivos organizados**: ~100+
- **Pastas principais**: 9 categorias
- **Padrões documentados**: 2 (Botões + Filtros)
- **Módulos padronizados**: 4 (Relacionamento, Equipe, Configurações, Financeiro)
- **Cobertura de filtros**: 100% (5/5 módulos)

---

## 🔄 Manutenção

### **Ao adicionar novos documentos**:

1. **Padrões técnicos** → `Padrao/`
2. **Pendências/tarefas** → `Pendencias/`
3. **Relatórios de auditoria** → `Relatorios/`
4. **Gates de validação** → `Gates/`
5. **PRDs de features** → `PRDs/`
6. **Planos estratégicos** → `Planejamento/`
7. **Checklists** → `Checklists/`
8. **Instruções/procedimentos** → `Instrucoes/`

### **Ao arquivar documentos antigos**:
→ Mover para `Arquivo/` com comentário de motivo

---

## 📞 Suporte

Para dúvidas sobre organização ou localização de documentos:
1. Consultar este README
2. Usar busca no VS Code (`Ctrl+Shift+F`)
3. Verificar git history se documento foi movido

---

**Reorganizado em**: 2025-10-11  
**Responsável**: Equipe Dev + AI Assistant  
**Próxima revisão**: 2025-11-11

