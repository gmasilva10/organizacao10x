# Objetivo
Garantir que toda mudança envolvendo dados sensíveis, autenticação, autorização ou exposição pública seja segura por padrão.

# Quando usar
Se tocar em: login/session/JWT, tokens/chaves/segredos, dados pessoais/financeiros, uploads, integrações externas, ou endpoints públicos.

# Como responder (ordem obrigatória)
1) AMEAÇAS (modelo curto)
   - Vetores: STRIDE (spoofing, tampering, repudiation, info disclosure, DoS, elevation)
   - Dados sensíveis envolvidos + onde trafegam/ficam
2) REQUISITOS DE SEGURANÇA
   - AutN/AutZ, confidencialidade, integridade, rastreabilidade, limites de taxa
3) DESIGN & REUSO
   - O que será **reutilizado** do repo (módulos/símbolos) para não duplicar lógica de segurança
   - Como o design segue SOLID (1–2 linhas por princípio relevante)
4) PATCH (diff mínimo)
   - Código + configurações (CSP, CORS, cookies, headers) necessárias
5) VALIDAÇÃO
   - Testes (unit/integration/E2E) + casos de abuso
   - Como verificar em runtime (logs/metrics/redações)
6) RISCOS & ROLLBACK
   - Impacto, migrações, plano de reversão/feature flag

# Regras obrigatórias
- **Server-only para segredos:** nunca armazenar tokens/chaves em client/localStorage. Preferir cookie httpOnly + secure + SameSite=Strict.
- **Princípio do menor privilégio:** escopos mínimos para chaves/tokens; RLS/ACL ativo em banco/serviços.
- **Validação & saneamento:** validar inputs (schema/DTOs), escapar outputs (XSS), normalizar caminhos/URLs.
- **Proteções web:** CSRF onde aplicável (estado mutável via cookie), rate limiting, anti-bruteforce, headers (CSP, HSTS, X-Frame-Options).
- **Logs seguros:** nunca logar segredos/PII; aplicar **redação**; correlação por ID não sensível.
- **Criptografia:** em trânsito (TLS) e em repouso quando disponível; hashing de senha com bcrypt/argon2 com parâmetros atualizados.
- **Supply chain:** lockfile imutável, verificação de integridade, evitar libs abandonadas; rodar auditoria; monitorar CVEs.
- **DRY de segurança:** é proibido duplicar enums/constantes/hooks de segurança; import do módulo canônico.
- **Perguntas objetivas (máx. 3)** se algo crítico faltar antes do patch.

# Checklist rápido (marcar antes de entregar)
- [ ] Segredos só no servidor/infra (nunca no cliente)
- [ ] Cookies httpOnly/secure/SameSite; sem bearer em JS
- [ ] Input validado (schema) + saída protegida (XSS)
- [ ] CSRF (se sessão/cookie) e CORS restritivo
- [ ] AutZ por recurso (role/ownership/tenant) + RLS/ACL
- [ ] Rate limit + anti-replay/idempotência onde necessário
- [ ] Logs sem PII/segredos; IDs de correlação
- [ ] CSP/HSTS/Frame-Options configurados
- [ ] Dependências auditadas e lockfile verificado
- [ ] Testes cobrindo happy/abuse cases

# Formato de saída (obrigatório)
### Ameaças
### Requisitos
### Design & Reuso (SOLID)
### Patch (diff)
### Validação (testes/observabilidade)
### Riscos & Rollback
