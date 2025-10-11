# Checklist de Validação - Módulo de Alunos

**Versão:** 1.0  
**Data:** 2025-01-28  
**Última atualização:** 2025-01-28

## 📋 Objetivo

Este checklist garante que todas as funcionalidades do módulo de alunos estejam funcionando corretamente antes de cada release ou deploy.

---

## 1. LISTAGEM DE ALUNOS

### 1.1 Visualização

- [ ] A listagem carrega corretamente ao acessar `/app/students`
- [ ] O contador de alunos é exibido corretamente (ex: "19 alunos cadastrados")
- [ ] Os cards de alunos exibem todas as informações:
  - [ ] Nome do aluno
  - [ ] Nome do treinador principal (ou "Sem treinador")
  - [ ] Status (badge colorido)
  - [ ] Email
  - [ ] Telefone
  - [ ] Data de criação

### 1.2 Busca

- [ ] O campo de busca funciona corretamente
- [ ] A busca encontra alunos por **nome**
- [ ] A busca encontra alunos por **email**
- [ ] A busca encontra alunos por **telefone**
- [ ] A busca tem debounce (não busca a cada tecla)
- [ ] Mensagem "Nenhum aluno encontrado" aparece quando não há resultados

### 1.3 Filtros

- [ ] O botão "Filtros" abre o drawer lateral corretamente
- [ ] O drawer exibe o contador de filtros ativos (badge)
- [ ] Filtro por **Status** funciona (Todos / Ativo / Pausado / Arquivado / Onboarding)
- [ ] Filtro por **Treinador** funciona
- [ ] Filtro por **Nome** no drawer funciona
- [ ] Botão "Limpar" remove todos os filtros
- [ ] Botão "Aplicar Filtros" fecha o drawer e aplica os filtros
- [ ] Filtros são aplicados automaticamente ao buscar inline

### 1.4 Alternância de Visualização

- [ ] Toggle "Cards" exibe os alunos em grid de cards
- [ ] Toggle "Tabela" exibe os alunos em tabela
- [ ] A visualização selecionada é mantida ao navegar

### 1.5 Loading States

- [ ] Skeleton loader aparece durante carregamento inicial
- [ ] Skeleton loader mostra 6 cards pulsantes
- [ ] Indicador de loading aparece ao aplicar filtros

---

## 2. CADASTRO DE ALUNO

### 2.1 Abertura do Modal

- [ ] Botão "Novo Aluno" abre o modal de cadastro
- [ ] Modal abre centralizado na tela
- [ ] Modal tem título "Novo Aluno"

### 2.2 Campos Obrigatórios

- [ ] Campo "Nome" é obrigatório
- [ ] Campo "Email" é obrigatório
- [ ] Campo "Telefone" é obrigatório
- [ ] Campo "Status" é obrigatório (padrão: Onboarding)

### 2.3 Validações

- [ ] Nome com menos de 3 caracteres exibe erro
- [ ] Email inválido exibe erro
- [ ] Telefone inválido exibe erro (mínimo 10 dígitos)
- [ ] Erros são exibidos inline abaixo de cada campo
- [ ] Campos com erro ficam com borda vermelha

### 2.4 Upload de Foto (Opcional)

- [ ] Botão de upload de foto funciona
- [ ] Foto é redimensionada automaticamente para quadrado
- [ ] Preview da foto aparece corretamente
- [ ] Botão "Remover" limpa a foto
- [ ] Toast informa tamanho e compressão da foto

### 2.5 Salvamento

- [ ] Botão "Salvar" exibe spinner durante salvamento
- [ ] Botão "Salvar" fica desabilitado durante salvamento
- [ ] Toast de sucesso aparece após salvar
- [ ] Toast de erro aparece se falhar
- [ ] Modal fecha automaticamente após sucesso
- [ ] Listagem é atualizada automaticamente após criar aluno

### 2.6 Cancelamento

- [ ] Botão "Cancelar" fecha o modal sem salvar
- [ ] Dados preenchidos são perdidos ao cancelar
- [ ] Clicar fora do modal não fecha (ou solicita confirmação)

---

## 3. EDIÇÃO DE ALUNO

### 3.1 Navegação

- [ ] Clicar no botão "Editar" (lápis) abre a tela de edição
- [ ] URL muda para `/app/students/{id}/edit`
- [ ] Dados do aluno são carregados corretamente

### 3.2 Header da Tela

- [ ] Nome do aluno é exibido no header
- [ ] Status do aluno é exibido como badge
- [ ] Data de criação é exibida
- [ ] Botões "Anexos" e "Processos" são exibidos
- [ ] Botões de ação estão visíveis:
  - [ ] Cancelar
  - [ ] Aplicar
  - [ ] Salvar e Voltar

### 3.3 Aba "Identificação"

#### Dados Pessoais

- [ ] Nome pode ser editado
- [ ] Email pode ser editado
- [ ] Telefone pode ser editado (com máscara)
- [ ] Status pode ser alterado
- [ ] Data de nascimento pode ser preenchida
- [ ] Gênero pode ser selecionado
- [ ] Estado civil pode ser selecionado
- [ ] Nacionalidade pode ser preenchida
- [ ] Local de nascimento pode ser preenchido
- [ ] Validações funcionam para todos os campos obrigatórios

#### Upload de Foto

- [ ] Botão "Carregar Foto" funciona
- [ ] Foto atual é exibida (se existir)
- [ ] Preview da nova foto aparece corretamente
- [ ] Foto é processada e redimensionada automaticamente
- [ ] Toast informa detalhes do processamento
- [ ] Botão "Remover Foto" funciona

#### Informações do Sistema

- [ ] ID do aluno é exibido (somente leitura)
- [ ] Data de criação é exibida (somente leitura)
- [ ] Data de atualização é exibida (somente leitura)

### 3.4 Aba "Endereço"

- [ ] CEP pode ser preenchido (com máscara)
- [ ] Rua pode ser preenchida
- [ ] Número pode ser preenchido
- [ ] Complemento pode ser preenchido
- [ ] Bairro pode ser preenchido
- [ ] Cidade pode ser preenchida
- [ ] Estado pode ser selecionado (UF)
- [ ] Todos os campos de endereço são opcionais

### 3.5 Aba "Responsáveis"

#### Treinador Principal

- [ ] Botão "Buscar Treinador Principal" abre modal de busca
- [ ] Modal de busca lista profissionais disponíveis
- [ ] Profissional selecionado aparece no card
- [ ] Nome e perfil do treinador são exibidos
- [ ] Botão "X" remove o treinador principal

#### Treinadores de Apoio

- [ ] Botão "Adicionar Treinador de Apoio" funciona
- [ ] Múltiplos treinadores de apoio podem ser adicionados
- [ ] Cada treinador tem card individual
- [ ] Botão "X" remove treinador de apoio

#### Responsáveis Específicos

- [ ] Botão "Adicionar Responsável Específico" funciona
- [ ] Modal permite definir roles específicos
- [ ] Responsável pode ter múltiplos roles
- [ ] Responsável é exibido em card
- [ ] Botão "X" remove responsável

### 3.6 Botões de Ação

#### Cancelar

- [ ] Botão "Cancelar" volta para a listagem sem salvar
- [ ] Botão fica desabilitado durante salvamento

#### Aplicar

- [ ] Botão "Aplicar" salva as alterações
- [ ] Usuário permanece na tela de edição após salvar
- [ ] Toast de sucesso aparece
- [ ] Spinner aparece no botão durante salvamento
- [ ] Botão fica desabilitado durante salvamento

#### Salvar e Voltar

- [ ] Botão "Salvar e Voltar" salva as alterações
- [ ] Usuário é redirecionado para a listagem após salvar
- [ ] Toast de sucesso aparece
- [ ] Spinner aparece no botão durante salvamento
- [ ] Botão fica desabilitado durante salvamento

---

## 4. AÇÕES RÁPIDAS

### 4.1 Menu "Anexos" (ícone de clipe)

- [ ] Botão "Anexos" abre menu dropdown
- [ ] Menu exibe opções:
  - [ ] Ocorrências
  - [ ] Relacionamento
  - [ ] Anamnese
  - [ ] Diretriz
  - [ ] Treino
  - [ ] Arquivos

### 4.2 Menu "Processos" (ícone de engrenagem)

- [ ] Botão "Processos" abre menu dropdown
- [ ] Menu exibe opções:
  - [ ] Matricular Aluno
  - [ ] Enviar Onboarding
  - [ ] Gerar Anamnese
  - [ ] Gerar Diretriz
  - [ ] Nova Ocorrência
  - [ ] Enviar Mensagem
  - [ ] Enviar E-mail
  - [ ] WhatsApp (submenu)
  - [ ] **Excluir Aluno** (em vermelho)

### 4.3 Excluir Aluno

- [ ] Opção "Excluir Aluno" abre modal de confirmação
- [ ] Modal tem ícone de alerta vermelho
- [ ] Modal exibe nome do aluno
- [ ] Modal lista consequências da exclusão
- [ ] Botão "Cancelar" fecha o modal sem excluir
- [ ] Botão "Sim, Excluir Aluno" está em vermelho (destructive)
- [ ] Spinner aparece no botão durante exclusão
- [ ] Toast de sucesso aparece após exclusão
- [ ] Listagem é atualizada automaticamente
- [ ] Aluno é removido da lista (soft delete)

---

## 5. PREFETCH E PERFORMANCE

### 5.1 Prefetch

- [ ] Hover no card de aluno dispara prefetch dos dados
- [ ] Hover no botão "Editar" dispara prefetch
- [ ] Tela de edição carrega mais rápido após prefetch

### 5.2 Performance

- [ ] Listagem com 50+ alunos não trava
- [ ] Busca retorna resultados em < 300ms
- [ ] Upload de foto é rápido (< 2s)
- [ ] Salvamento de dados é rápido (< 1s)

---

## 6. ACESSIBILIDADE

### 6.1 Navegação por Teclado

- [ ] Tab navega entre campos do formulário
- [ ] Enter no campo de busca executa a busca
- [ ] Esc fecha modais
- [ ] Campos têm ordem lógica de tabulação

### 6.2 Leitores de Tela

- [ ] Botões têm `aria-label` descritivos
- [ ] Campos têm `label` associados
- [ ] Erros de validação têm `aria-describedby`
- [ ] Loading states têm `aria-live="polite"`

### 6.3 Contraste e Cores

- [ ] Textos têm contraste adequado (WCAG AA)
- [ ] Erros são visíveis em modo claro e escuro
- [ ] Badges de status têm cores distintas

---

## 7. EDGE CASES E ERROS

### 7.1 Estados de Erro

- [ ] Erro 404 exibe mensagem amigável
- [ ] Erro 500 exibe mensagem amigável
- [ ] Erro de rede exibe toast de erro
- [ ] Timeout exibe mensagem de retry

### 7.2 Validações Especiais

- [ ] Email duplicado é tratado corretamente
- [ ] Telefone duplicado é tratado corretamente
- [ ] Nome com caracteres especiais é aceito
- [ ] Upload de arquivo muito grande é rejeitado
- [ ] Upload de arquivo inválido é rejeitado

### 7.3 Sem Dados

- [ ] Listagem vazia exibe EmptyState
- [ ] EmptyState tem botão "Novo Aluno"
- [ ] Busca sem resultados exibe mensagem apropriada

---

## 8. RESPONSIVIDADE

### 8.1 Mobile (< 768px)

- [ ] Cards empilham verticalmente
- [ ] Modal de criação é responsivo
- [ ] Tela de edição é rolável
- [ ] Botões são tocáveis (min 44px)

### 8.2 Tablet (768px - 1024px)

- [ ] Grid de cards se ajusta (2 colunas)
- [ ] Drawer de filtros se ajusta
- [ ] Formulário de edição é legível

### 8.3 Desktop (> 1024px)

- [ ] Grid de cards usa até 5 colunas
- [ ] Layout otimiza espaço disponível
- [ ] Modais são centralizados

---

## 9. INTEGRAÇÃO COM OUTROS MÓDULOS

### 9.1 Módulo de Relacionamento

- [ ] Criar mensagem para aluno funciona
- [ ] Timeline de relacionamento é exibida

### 9.2 Módulo de Ocorrências

- [ ] Criar ocorrência para aluno funciona
- [ ] Ocorrências do aluno são listadas

### 9.3 Módulo de Onboarding

- [ ] Enviar onboarding funciona
- [ ] Status do onboarding é atualizado

---

## ✅ Critérios de Aprovação

Para considerar o módulo de alunos pronto para produção, **todos os itens críticos** devem estar marcados:

### Críticos (Bloqueadores)

- [ ] Listagem funciona corretamente
- [ ] Busca funciona corretamente
- [ ] Cadastro funciona corretamente
- [ ] Edição funciona corretamente
- [ ] Exclusão funciona corretamente
- [ ] Validações impedem dados inválidos
- [ ] Erros são tratados graciosamente

### Importantes (Desejáveis)

- [ ] Prefetch melhora performance
- [ ] Acessibilidade básica implementada
- [ ] Responsividade funciona bem
- [ ] Loading states informam o usuário

### Opcionais (Nice to Have)

- [ ] Paginação implementada
- [ ] Virtual scrolling para listas grandes
- [ ] Testes E2E automatizados

---

**Última revisão:** 2025-01-28  
**Revisado por:** AI Assistant  
**Próxima revisão:** Após cada sprint ou antes de release

