# 🎨 Logos de Integrações

## 📍 Localização
`web/public/integrations/`

## 📦 Arquivos

### Atuais (Placeholders SVG)
- `whatsapp-logo.svg` - Logo simplificada do WhatsApp
- `eduzz-logo.svg` - Placeholder (substituir pela logo real)
- `hotmart-logo.svg` - Placeholder (substituir pela logo real)

---

## 🔄 Como Substituir pelos Logos Reais

### **1. WhatsApp**
✅ Logo oficial já incluída (SVG com desenho real)

**OU** salvar a imagem PNG que você tem:
1. Renomear a imagem para `whatsapp-logo.png`
2. Salvar em `web/public/integrations/whatsapp-logo.png`
3. Atualizar código para usar `.png` ao invés de `.svg`

---

### **2. Eduzz**
A logo que você enviou deve ser salva assim:

**Opção A - PNG (Recomendado):**
```
1. Salvar a imagem como: web/public/integrations/eduzz-logo.png
2. Atualizar IntegrationsSettings.tsx:
   logo: '/integrations/eduzz-logo.png'
```

**Opção B - SVG (Melhor qualidade):**
```
1. Converter PNG para SVG (https://convertio.co/pt/png-svg/)
2. Salvar como: web/public/integrations/eduzz-logo.svg
3. Substituir o arquivo atual
```

---

### **3. Hotmart**
⚠️ Atualmente usando placeholder (letra "H")

**Para adicionar logo real:**
```
1. Baixar logo oficial da Hotmart
2. Salvar como: web/public/integrations/hotmart-logo.png
3. Atualizar IntegrationsSettings.tsx:
   logo: '/integrations/hotmart-logo.png'
```

**Link para logo oficial:**
https://hotmart.com/pt-br/company/brand

---

## 📐 Especificações Técnicas

### Tamanhos Recomendados
- **Grid de integrações:** 48x48px
- **Página de detalhes:** 56x56px

### Formatos Aceitos
- ✅ SVG (recomendado - escalável)
- ✅ PNG (com fundo transparente)
- ❌ JPG (evitar - fundo branco)

### Otimização
As imagens são otimizadas automaticamente pelo Next.js Image component.

---

## 🚀 Depois de Substituir

1. **Hard refresh:** CTRL + SHIFT + R
2. Verificar em `/app/settings` → Integrações
3. Logos devem aparecer nos cards
4. Logos devem aparecer nas páginas individuais

---

**Última Atualização:** 30/09/2025  
**Responsável:** Dev Team
