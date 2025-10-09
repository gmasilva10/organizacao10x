# Padrão de Tela de Cadastro - Personal Global

**Última atualização**: 2025-01-08  
**Baseado em**: Formulário "Enviar Mensagem" do módulo de Relacionamento

## Estrutura Visual Padrão

### Layout do Modal/Dialog
```
┌─────────────────────────────────────┐
│ [Ícone] Título do Modal        [X]  │
├─────────────────────────────────────┤
│                                     │
│ 📋 Seção Principal                  │
│ ┌─────────────────────────────────┐ │
│ │ Campo Obrigatório *             │ │
│ │ [___________________________]   │ │
│ │                                 │ │
│ │ Campo Opcional                  │ │
│ │ [___________________________]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ⚙️ Seção Secundária                 │
│ ┌─────────────────────────────────┐ │
│ │ ☐ Opção com Switch              │ │
│ │                                 │ │
│ │ [Se ativado:]                   │ │
│ │ Campo Condicional *             │ │
│ │ [___] Exemplo                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ℹ️ Informações Contextuais          │
│ • Regra 1                          │
│ • Regra 2                          │
│ • Regra 3                          │
│                                     │
├─────────────────────────────────────┤
│           [Cancelar] [Ação Principal] │
└─────────────────────────────────────┘
```

## Elementos Obrigatórios

### 1. Cabeçalho do Modal
- **Ícone**: Representativo da ação (📋, ➕, ✏️, etc.)
- **Título**: Descrição clara da ação
- **Botão fechar**: [X] no canto superior direito
- **DialogDescription**: Texto explicativo para acessibilidade

### 2. Seções com Agrupamento Visual
- **Ícones**: Cada seção deve ter um ícone descritivo
- **Títulos**: Nomes claros e específicos
- **Bordas**: Agrupamento visual com bordas sutis
- **Espaçamento**: Consistente entre seções

### 3. Campos de Formulário
- **Labels**: Sempre presentes e descritivos
- **Espaçamento**: `className="mb-2 block"` para distanciar labels dos campos
- **Campos obrigatórios**: Marcados com asterisco (*)
- **Placeholders**: Texto de exemplo quando apropriado
- **Validação**: Mensagens de erro inline abaixo do campo
- **Tipos corretos**: `type="number"` para números, etc.

### 4. Controles Especiais
- **Switches**: Para ativar/desativar funcionalidades
- **Campos condicionais**: Aparecem apenas quando switch ativo
- **Dropdowns**: Com placeholder descritivo
- **Checkboxes**: Com labels claros

### 5. Rodapé de Ações
- **Cancelar**: Botão secundário à esquerda
- **Ação principal**: Botão primário à direita
- **Estados**: Botão principal desabilitado quando formulário inválido

## Padrões de Validação

### Campos Obrigatórios
- Mínimo 2 caracteres para campos de texto
- Validação em tempo real
- `aria-invalid` e `aria-describedby` em campos inválidos

### Campos Numéricos
- Aceitar apenas números inteiros positivos
- Validação de range quando aplicável
- Placeholder com exemplo

### Campos Condicionais
- Aparecer apenas quando condição ativa
- Validação apenas quando visível
- Transição suave (fade in/out)

## Acessibilidade

### Atributos ARIA
- `aria-label` em ícones sem texto
- `aria-describedby` para campos com ajuda
- `aria-invalid` para campos com erro
- `aria-expanded` para campos condicionais

### Navegação por Teclado
- **Enter**: Submeter formulário
- **Esc**: Cancelar/fechar modal
- **Tab**: Navegar entre campos
- **Foco visível**: Em todos os elementos interativos

### Contraste
- Mínimo 4.5:1 para texto normal
- Mínimo 3:1 para texto grande
- Cores de erro e sucesso acessíveis

## Responsividade

### Mobile (< 768px)
- Modal ocupa largura total menos margem
- Campos em coluna única
- Botões empilhados verticalmente

### Tablet (768px - 1024px)
- Modal com largura máxima
- Campos podem ficar em duas colunas se apropriado

### Desktop (> 1024px)
- Modal centralizado
- Largura fixa otimizada
- Campos em layout otimizado

## Exemplos de Implementação

### Formulário Simples
```typescript
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>📋 Nova Tarefa</DialogTitle>
      <DialogDescription>
        Criar uma nova tarefa padrão para a coluna {column.title}
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-6">
      {/* Seção Principal */}
      <div>
        <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
          📝 Informações Básicas
        </h3>
        <div className="border rounded-lg p-4 space-y-4">
          <div>
            <Label htmlFor="title" className="mb-2 block">Título da Tarefa *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Preencher ficha de anamnese"
              required
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="required" checked={isRequired} onCheckedChange={setIsRequired} />
            <Label htmlFor="required">Tarefa obrigatória</Label>
          </div>
        </div>
      </div>

      {/* Seção SLA */}
      <div>
        <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
          ⏱️ SLA (Service Level Agreement)
        </h3>
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center space-x-2">
            <Switch id="hasSla" checked={hasSla} onCheckedChange={setHasSla} />
            <Label htmlFor="hasSla">Definir SLA</Label>
          </div>
          {hasSla && (
            <div>
              <Label htmlFor="slaHours" className="mb-2 block">Prazo (horas) *</Label>
              <Input
                id="slaHours"
                type="number"
                min="1"
                value={slaHours || ''}
                onChange={(e) => setSlaHours(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Ex: 48"
              />
            </div>
          )}
        </div>
      </div>

      {/* Informações Contextuais */}
      <div>
        <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
          ℹ️ Informações
        </h3>
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Coluna:</strong> {column.title} (#{column.position})</p>
          <p>A tarefa será adicionada automaticamente aos novos alunos nesta coluna.</p>
        </div>
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={onCancel}>
        Cancelar
      </Button>
      <Button onClick={handleSubmit} disabled={!title.trim()}>
        Criar Tarefa
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Checklist de Conformidade

### ✅ Estrutura
- [ ] Modal com ícone e título descritivo
- [ ] DialogDescription para acessibilidade
- [ ] Seções agrupadas visualmente
- [ ] Botões de ação no rodapé

### ✅ Campos
- [ ] Labels em todos os campos
- [ ] Espaçamento adequado: `className="mb-2 block"` entre labels e campos
- [ ] Asterisco (*) em campos obrigatórios
- [ ] Placeholders descritivos
- [ ] Validação inline

### ✅ Acessibilidade
- [ ] Atributos ARIA apropriados
- [ ] Navegação por teclado
- [ ] Contraste adequado
- [ ] Foco visível

### ✅ Responsividade
- [ ] Layout mobile otimizado
- [ ] Campos adaptáveis
- [ ] Botões empilhados em mobile

### ✅ Validação
- [ ] Campos obrigatórios validados
- [ ] Campos condicionais funcionais
- [ ] Mensagens de erro claras
- [ ] Botão submit desabilitado quando inválido

## Notas de Implementação

1. **Sempre use shadcn/ui components** para consistência
2. **Mantenha espaçamento consistente** entre seções
3. **Use ícones do lucide-react** para representar seções
4. **Implemente transições suaves** para campos condicionais
5. **SEMPRE aplique `className="mb-2 block"`** nos labels para espaçamento adequado
6. **Teste em diferentes tamanhos de tela**
7. **Valide com leitores de tela** quando possível

---

**Referência**: Este padrão deve ser seguido em todas as telas de cadastro do sistema Personal Global para garantir consistência visual e de experiência do usuário.

---

## Atualizações de Padrão

**2025-01-08**: Adicionado requisito obrigatório de espaçamento entre labels e campos:
- **Obrigatório**: `className="mb-2 block"` em todos os labels de campos de input
- **Motivo**: Melhorar legibilidade e evitar labels "colados" nos campos
- **Aplicação**: Todos os formulários existentes e futuros devem seguir este padrão
