# PLANO DE MERGE v0.1 - EXECUÇÃO IMEDIATA

## 🚀 COMANDOS EXATOS (COPIAR/COLAR)

### 1. Preparação
```bash
cd C:\Projetos\Organizacao10x
git add .
git commit -m "fix: dependências Radix UI para v0.1"
git checkout main
git pull origin main
```

### 2. Merge Sequencial (Ordem de Segurança)

**PR A - Base RBAC:**
```bash
git merge feat/rbac-restore-and-guards
git push origin main
echo "✅ PR A: RBAC + Guards aplicados"
```

**PR B - Settings:**
```bash  
git merge feat/settings-users-roles
git push origin main
echo "✅ PR B: Settings Users/Roles funcionais"
```

**PR C - Services:**
```bash
git merge feat/services-edit-toggle
git push origin main  
echo "✅ PR C: Services CRUD completo"
```

**Módulos P0:**
```bash
git merge feat/profile-avatar-and-ux
echo "✅ Profile: Avatar + UX polido"

git merge feat/team-collaborators-crud
echo "✅ Team: CRUD + limites plano"

git merge feat/settings-link-user-collaborator  
echo "✅ Settings: Vínculo User⇄Collaborator"

git push origin main
echo "🎉 TODOS OS MÓDULOS v0.1 INTEGRADOS"
```

### 3. Deploy Staging
```bash
cd web
npm install
npm run build
npm run start
# Verificar http://localhost:3000
```

## 📋 SMOKE TESTS OBRIGATÓRIOS

Execute **exatamente** estes 8 testes e salve evidências:

### 1. RBAC Restore (Admin)
- Login como admin
- `/app/settings/roles` → Restaurar Padrão → toast OK
- **Evidência**: `rbac_restore_staging.png`

### 2. Perfil + Avatar  
- Dropdown canto direito → "Meu Perfil" 
- Editar nome/telefone → salvar
- Upload avatar JPG/PNG ≤5MB → preview + persiste
- **Evidência**: `profile_avatar_staging.gif`

### 3. Services CRUD
- `/app/services` → Editar + toggle ativo
- Como viewer → botões não aparecem  
- **Evidência**: `services_rbac_staging.gif`

### 4. Team Limites
- `/app/team` → criar 3 colaboradores (Basic)
- Tentar 4º → erro 422 limite atingido
- **Evidência**: `team_limits_staging.gif`

### 5. User⇄Collaborator Link
- `/app/settings/users` → Vincular modal → sucesso
- Desvincular → confirmar  
- **Evidência**: `link_unlink_staging.gif`

### 6. Feature Gates
- `/kanban` staging → permitido
- `/kanban` prod → bloqueado (→ /onboarding)
- **Evidência**: `feature_gates_staging.png`

### 7. UX A11y
- Focus campo inválido + aria-live toasts
- **Evidência**: `a11y_ux_staging.png`

### 8. Audit Events
- Verificar events table: profile.*, collaborator.*, settings.*
- **Evidência**: `audit_logs_staging.json`

## ✅ CRITÉRIO GO/NO-GO

**ACEITAR v0.1 SE:**
- ✅ Todos 8 smoke tests passaram
- ✅ Limites Basic=3 funcionando  
- ✅ RBAC aplicado corretamente
- ✅ Avatar + vínculo funcionais

**REJEITAR SE:**
- ❌ Qualquer smoke falhar
- ❌ Erro de RBAC/limites
- ❌ Upload avatar quebrado

## 🏁 PRODUÇÃO (Após Staging OK)

```bash
# Tag release
git tag v0.1.0
git push origin v0.1.0

# Aplicar migrações prod
# POST /api/settings/rbac/restore_default (prod)
# Smoke rápido
# Atualizar Atividades.txt com aceite final
```

---
**STATUS**: Pronto para execução  
**DEADLINE**: Hoje (27/08/2025)  
**NEXT**: Executar comandos acima em sequência
