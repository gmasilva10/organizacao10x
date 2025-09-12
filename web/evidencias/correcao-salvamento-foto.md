# Correção: Salvamento de Foto do Aluno

## 📋 **Problema Identificado**
A foto do aluno não estava sendo salva no banco de dados. Após enviar uma foto, clicar em salvar e voltar para a lista, ao editar o mesmo aluno novamente, a foto não estava presente.

## 🔍 **Análise da Causa**
1. **API de Atualização**: A API `PUT /api/students/[id]` não estava incluindo o campo `photo_url` no `updateData`
2. **API de Busca**: A API `GET /api/students/[id]` não estava retornando os campos de foto e dados pessoais
3. **Upload Simulado**: A função `handlePhotoUpload` estava apenas criando um preview local com `URL.createObjectURL()`, sem fazer upload real
4. **Falta de API de Upload**: Não existia endpoint para upload de arquivos para o Supabase Storage

## ✅ **Soluções Implementadas**

### 1. **API de Upload de Foto** (`/api/upload/photo/route.ts`)
```typescript
// Upload real para Supabase Storage
const uploadUrl = `${url}/storage/v1/object/student-photos/${fileName}`

const uploadResponse = await fetch(uploadUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${key}`,
    'Content-Type': file.type,
    'Cache-Control': 'max-age=31536000'
  },
  body: buffer
})
```

### 2. **API de Alunos Atualizada** (`/api/students/[id]/route.ts`)
```typescript
// GET - Incluir campos de foto e dados pessoais
const select = `select=id,name,email,phone,status,created_at,trainer_id,photo_url,birth_date,gender,marital_status,nationality,birth_place`

// PUT - Incluir photo_url no updateData
const updateData = {
  name: body.name,
  email: body.email,
  phone: body.phone,
  status: body.status,
  photo_url: body.photo_url,
  birth_date: body.birth_date,
  gender: body.gender,
  marital_status: body.marital_status,
  nationality: body.nationality,
  birth_place: body.birth_place,
  trainer_id: body.trainer_id && body.trainer_id !== '4' ? body.trainer_id : null,
  updated_at: new Date().toISOString()
}
```

### 3. **Upload Real no Componente** (`StudentEditTabsV6.tsx`)
```typescript
const handlePhotoUpload = async (file: File) => {
  // ... validações ...
  
  // Upload real para Supabase Storage
  const formData = new FormData()
  formData.append('file', file)
  formData.append('studentId', studentId)
  
  const response = await fetch('/api/upload/photo', {
    method: 'POST',
    body: formData
  })
  
  const result = await response.json()
  
  if (result.success && result.photo_url) {
    setPhotoData(prev => ({ ...prev, preview: result.photo_url }))
    showSuccessToast('Foto enviada com sucesso!')
  }
}
```

## 🎯 **Funcionalidades Implementadas**

### **Upload de Foto**
- ✅ Validação de tipo de arquivo (apenas imagens)
- ✅ Validação de tamanho (máximo 10MB)
- ✅ Upload real para Supabase Storage
- ✅ Preview imediato da foto
- ✅ Tratamento de erros com fallback
- ✅ Toast de feedback para o usuário

### **Persistência no Banco**
- ✅ Campo `photo_url` incluído na API de atualização
- ✅ Campo `photo_url` incluído na API de busca
- ✅ Dados pessoais (birth_date, gender, etc.) também incluídos
- ✅ Foto persiste após salvamento e redirecionamento

### **Estrutura de Arquivos**
- ✅ Organização por tenant: `students/{tenantId}/{studentId}/photo.{ext}`
- ✅ Nome único para evitar conflitos
- ✅ URL pública para acesso direto
- ✅ Cache configurado para performance

## 🔧 **Arquivos Modificados**

1. **`web/app/api/upload/photo/route.ts`** - Nova API de upload
2. **`web/app/api/students/[id]/route.ts`** - APIs GET e PUT atualizadas
3. **`web/components/students/StudentEditTabsV6.tsx`** - Upload real implementado
4. **`web/Estrutura/Atividades.txt`** - Registro da correção

## ✅ **Resultado**
- **Antes**: Foto apenas preview local, não persistia no banco
- **Depois**: Upload real para Supabase Storage, foto persiste após salvamento

## 🧪 **Teste de Validação**
1. Acessar edição de aluno
2. Fazer upload de foto
3. Clicar em "Salvar"
4. Voltar para lista de alunos
5. Editar o mesmo aluno novamente
6. **Resultado**: Foto deve estar presente

**Status: ✅ CORREÇÃO CONCLUÍDA!**

A foto do aluno agora é salva corretamente no Supabase Storage e persiste no banco de dados após o salvamento.
