# 🧪 Plano de Teste Manual - Organizacao10x v0.3.3

## 🎯 Objetivo
Validar as funcionalidades implementadas nos GATES D2.5-D2.9, focando no sistema de Diretrizes de Treino.

## 🔐 Pré-requisitos
- Sistema rodando em `http://localhost:3000`
- Credenciais: `gma_silva@yahoo.com.br` / `Gma@11914984`

## 📋 Casos de Teste

### **TC001: Login e Navegação**
**Objetivo**: Validar acesso ao sistema
**Passos**:
1. Acessar `http://localhost:3000`
2. Clicar em "Entrar"
3. Inserir credenciais
4. Validar redirecionamento para dashboard

**Resultado Esperado**: Login bem-sucedido, dashboard carregado

### **TC002: Acesso às Diretrizes**
**Objetivo**: Navegar para o módulo de Diretrizes
**Passos**:
1. No dashboard, navegar para Serviços → Anamnese
2. Clicar na aba "Diretrizes"
3. Validar carregamento da lista de diretrizes

**Resultado Esperado**: Lista de diretrizes carregada, botões de ação visíveis

### **TC003: Criar Nova Regra**
**Objetivo**: Validar criação de regras com TagSelect
**Passos**:
1. Clicar em "Nova Regra"
2. Preencher título da regra
3. Clicar em "Selecione a tag"
4. Selecionar uma tag com MOUSE (ex: "DAC")
5. Configurar operador e valor
6. Salvar regra

**Resultado Esperado**: Tag selecionada corretamente, regra criada

### **TC004: Adicionar/Remover Condições**
**Objetivo**: Validar botões de adicionar/remover condições
**Passos**:
1. Na criação de regra, clicar "Adicionar Nova Condição"
2. Validar que aparece nova condição
3. Validar que botão de lixeira aparece
4. Clicar na lixeira para remover uma condição
5. Validar remoção

**Resultado Esperado**: Condições adicionadas/removidas corretamente, lixeira visível

### **TC005: Catálogos**
**Objetivo**: Validar funcionamento dos catálogos
**Passos**:
1. Navegar para aba "Catálogos"
2. Testar cada catálogo:
   - RIR: Validar escala 5-10
   - Protocolos: Validar fórmulas LaTeX
   - Prontidão: Validar orientações
   - Tags: Validar busca e categorização

**Resultado Esperado**: Todos os catálogos funcionando corretamente

### **TC006: Preview Engine**
**Objetivo**: Validar geração de preview
**Passos**:
1. Criar regra simples (ex: Hipertensão = Sim)
2. Clicar em "Preview"
3. Preencher dados de teste
4. Gerar preview
5. Validar saída nas 5 seções

**Resultado Esperado**: Preview gerado com diretrizes corretas

### **TC007: Gestão de Versões**
**Objetivo**: Validar ciclo de vida das versões
**Passos**:
1. Publicar uma diretriz
2. Testar "Corrigir versão"
3. Testar "Definir como Padrão"
4. Testar "Despublicar"

**Resultado Esperado**: Todas as ações de versionamento funcionando

## ✅ Critérios de Aceite
- [ ] Login funcionando
- [ ] Navegação sem erros
- [ ] TagSelect funcionando com mouse
- [ ] Botões de adicionar/remover condições visíveis
- [ ] Catálogos carregando corretamente
- [ ] Preview gerando diretrizes
- [ ] Versionamento funcionando
- [ ] Performance < 2s por operação

## 🐛 Bugs Conhecidos Corrigidos
- ✅ TagSelect não funcionava com mouse (corrigido)
- ✅ Botão de remover condição não aparecia (corrigido)
- ✅ RIR com escala incorreta (corrigido)
- ✅ Layout desalinhado (corrigido)
