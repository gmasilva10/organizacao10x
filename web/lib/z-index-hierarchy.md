# 🎯 Hierarquia de Z-Index - Sistema 10x

**Data:** 30/09/2025  
**Objetivo:** Padronizar z-index em todo o projeto para evitar problemas de sobreposição

---

## 📊 HIERARQUIA DEFINIDA

```
┌─────────────────────────────────────────────────────────────┐
│  CAMADA          │ Z-INDEX  │ COMPONENTE                    │
├──────────────────┼──────────┼───────────────────────────────┤
│  Base            │  0       │ Conteúdo normal da página     │
│  Elevado         │  10      │ Cards, botões hover           │
│  Sticky Headers  │  20      │ Headers fixos, navegação      │
│  Dropdowns       │  30      │ (reservado para casos simples)│
│  Dialogs/Modals  │  50      │ Dialog, AlertDialog           │
│  ├─ Overlay      │  50      │ Backdrop do modal             │
│  └─ Content      │  50      │ Conteúdo do modal             │
│  Dropdowns (Modal)│ 100     │ Select, Dropdown, Tooltip     │
│  Popovers        │  9999    │ Popover (contexto especial)   │
│  Toasts/Snackbar │  999999  │ Sonner toasts                 │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ COMPONENTES ATUALIZADOS (GATE 10.7.1)

### **Dropdowns em Modais - z-[100]**

#### 1. `components/ui/select.tsx`
```tsx
SelectContent: z-[100]  // Era z-50
```
**Motivo:** Select dentro de modais ficava atrás do backdrop (z-50)

---

#### 2. `components/ui/dropdown-menu.tsx`
```tsx
DropdownMenuContent: z-[100]       // Era z-50
DropdownMenuSubContent: z-[100]    // Era z-50
```
**Motivo:** Dropdown de ações em cards dentro de modais

---

#### 3. `components/ui/tooltip.tsx`
```tsx
TooltipContent: z-[100]  // Era z-50
TooltipArrow: z-[100]    // Era z-50
```
**Motivo:** Tooltips dentro de modais devem aparecer acima do backdrop

---

### **Já Corretos - Não Modificados**

#### 4. `components/ui/popover.tsx`
```tsx
PopoverContent: z-[9999]  ✅ JÁ ESTAVA CORRETO
```

#### 5. `components/ui/dialog.tsx`
```tsx
DialogOverlay: z-50   ✅ CORRETO (backdrop do modal)
DialogContent: z-50   ✅ CORRETO (conteúdo do modal)
```

#### 6. `components/ui/alert-dialog.tsx`
```tsx
AlertDialogOverlay: z-50   ✅ CORRETO
AlertDialogContent: z-50   ✅ CORRETO
```

---

## 🎨 REGRAS DE OURO

### **1. Dropdowns SEMPRE acima de Modais**
```
Modal (z-50) < Dropdown (z-100)
```

### **2. Use Portal do Radix UI**
```tsx
// ✅ CORRETO - Usa Portal
<SelectPrimitive.Portal>
  <SelectPrimitive.Content className="z-[100]" />
</SelectPrimitive.Portal>

// ❌ INCORRETO - Sem Portal
<SelectPrimitive.Content className="z-[100]" />
```

### **3. Evite overflow: hidden em containers de modais**
```tsx
// ❌ INCORRETO - Pode cortar dropdowns
<DialogContent className="overflow-hidden">

// ✅ CORRETO - Permite dropdowns expandirem
<DialogContent className="overflow-visible">
// Ou use overflow-y-auto apenas no conteúdo interno
```

### **4. Não use z-index inline (className) para sobrescrever**
```tsx
// ❌ INCORRETO - Vai quebrar a hierarquia
<SelectContent className="z-[9999]" />

// ✅ CORRETO - Deixe o padrão do componente base
<SelectContent />
```

---

## 🔍 CASOS DE USO TESTADOS

### ✅ Caso 1: Select dentro de Dialog
```tsx
<Dialog>
  <DialogContent>
    <Select>
      <SelectTrigger />
      <SelectContent /> {/* z-[100] > z-50 do Dialog ✅ */}
    </Select>
  </DialogContent>
</Dialog>
```

### ✅ Caso 2: Dropdown dentro de Dialog
```tsx
<Dialog>
  <DialogContent>
    <DropdownMenu>
      <DropdownMenuTrigger />
      <DropdownMenuContent /> {/* z-[100] > z-50 ✅ */}
    </DropdownMenu>
  </DialogContent>
</Dialog>
```

### ✅ Caso 3: Select dentro de AlertDialog
```tsx
<AlertDialog>
  <AlertDialogContent>
    <Select>
      <SelectContent /> {/* z-[100] > z-50 ✅ */}
    </Select>
  </AlertDialogContent>
</AlertDialog>
```

### ✅ Caso 4: Tooltip em qualquer contexto
```tsx
<Tooltip>
  <TooltipContent /> {/* z-[100] funciona em modais ✅ */}
</Tooltip>
```

---

## 🐛 PROBLEMAS RESOLVIDOS

### ❌ ANTES:
```
Modal Filtros → Select "Canais"
  ├─ DialogOverlay (z-50) ← Backdrop escuro
  ├─ DialogContent (z-50) ← Conteúdo do modal
  └─ SelectContent (z-50) ← ❌ MESMO z-index!
  
Resultado: SelectContent fica ATRÁS do backdrop
Visual: Dropdown aparece "transparente/escurecido"
```

### ✅ DEPOIS:
```
Modal Filtros → Select "Canais"
  ├─ DialogOverlay (z-50) ← Backdrop escuro
  ├─ DialogContent (z-50) ← Conteúdo do modal
  └─ SelectContent (z-100) ← ✅ ACIMA do modal!
  
Resultado: SelectContent fica ACIMA do backdrop
Visual: Dropdown totalmente visível e clicável
```

---

## 🧪 CHECKLIST DE VALIDAÇÃO

### **Testes Manuais Obrigatórios:**

- [ ] **Modal "Enviar Mensagem"**
  - [ ] Select "Aluno" → dropdown visível e clicável
  - [ ] Select "Canal" → dropdown visível e clicável
  - [ ] Select "Classificação" → dropdown visível e clicável

- [ ] **Modal "Filtros" (Relacionamento)**
  - [ ] Select "Status" → dropdown visível e clicável
  - [ ] Select "Canais" → dropdown visível e clicável
  - [ ] Select "Templates" → dropdown visível e clicável
  - [ ] Input "Data" (calendar) → picker visível

- [ ] **Modal "Anamnese"**
  - [ ] Select "Grupo WhatsApp" → dropdown visível e clicável

- [ ] **Modal "Criar Aluno"**
  - [ ] Todos os selects → dropdowns visíveis

- [ ] **Navegadores**
  - [ ] Chrome (desktop)
  - [ ] Firefox (desktop)
  - [ ] Edge (desktop)

---

## 🚨 ALERTAS PARA DESENVOLVEDORES

### ⚠️ Ao Criar Novo Modal:

1. **Use os componentes base sem modificar z-index**
   ```tsx
   // ✅ CORRETO
   <Select>
     <SelectContent /> {/* Usa z-[100] automático */}
   </Select>
   ```

2. **Evite overflow: hidden no DialogContent**
   ```tsx
   // ⚠️ CUIDADO
   <DialogContent className="overflow-hidden">
     {/* Pode cortar dropdowns */}
   </DialogContent>
   
   // ✅ MELHOR
   <DialogContent className="overflow-visible">
     <div className="overflow-y-auto max-h-[600px]">
       {/* Scroll apenas no conteúdo interno */}
     </div>
   </DialogContent>
   ```

3. **Teste SEMPRE dropdowns dentro do modal**

---

## 📚 REFERÊNCIAS

- **Radix UI Portal:** https://www.radix-ui.com/primitives/docs/guides/styling#portals
- **Z-Index Best Practices:** https://css-tricks.com/z-index-best-practices/
- **Issue original:** Print anexado em issue #XXX

---

**Última atualização:** 30/09/2025  
**Responsável:** Dev Team  
**Status:** ✅ Implementado e Documentado
