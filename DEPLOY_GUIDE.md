# Guia de Deploy - GitHub Actions

## ✅ Status Atual
- [x] Código commitado e enviado para `main`
- [x] Workflow GitHub Actions configurado
- [x] Variáveis de ambiente adicionadas ao workflow
- [ ] **PENDENTE**: Configurar secrets no repositório GitHub

## 🔐 Configuração de Secrets (OBRIGATÓRIO)

Para que o build funcione, você precisa configurar os seguintes secrets no repositório GitHub:

### Como configurar:
1. Acesse: https://github.com/gmasilva10/organizacao10x/settings/secrets/actions
2. Clique em "New repository secret"
3. Adicione cada uma das variáveis abaixo:

### Secrets necessários:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  
SUPABASE_SERVICE_ROLE_KEY
```

### Valores das variáveis:
Você pode encontrar esses valores no seu projeto Supabase:
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em Settings > API
4. Copie os valores:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

## 🚀 Após configurar os secrets:

1. O workflow será executado automaticamente
2. Você pode acompanhar em: https://github.com/gmasilva10/organizacao10x/actions
3. Se houver erros, eles aparecerão nos logs do build

## 📋 Checklist de Deploy:
- [x] Commit e push realizado
- [x] Workflow configurado
- [ ] Secrets configurados no GitHub
- [ ] Build executado com sucesso
- [ ] Validação pós-deploy

## 🔍 Verificação pós-deploy:
Após o build bem-sucedido, verificar:
- Módulo Serviços > Financeiro > Planos funcionando
- Lista de planos carregando corretamente
- Sem erros de console no frontend
