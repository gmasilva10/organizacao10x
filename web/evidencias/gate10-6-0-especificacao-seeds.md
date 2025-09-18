# GATE 10.6.0 - ESPECIFICAÇÃO & SEEDS

**Data:** 2025-01-10  
**Status:** ✅ CONCLUÍDO  
**Próximo:** GATE 10.6.1 - Data Model & RLS

## 📋 ESPECIFICAÇÃO EVENT_REGISTRY

### **Âncoras Oficiais Implementadas:**

1. **SALE_CLOSE** - Fechamento da Venda
   - Query: `students WHERE status = 'active' AND created_at::date = $1`
   - Offset: `+0d`
   - Variáveis: Nome, PrimeiroNome, DataVenda

2. **FIRST_WORKOUT** - Primeiro Treino
   - Query: `students WHERE first_workout_date IS NOT NULL AND first_workout_date::date = $1`
   - Offset: `-1d`
   - Variáveis: Nome, PrimeiroNome, DataTreino, LinkAnamnese

3. **WEEKLY_FOLLOWUP** - Acompanhamento Semanal
   - Query: `students WHERE status = 'active' AND last_workout_date IS NOT NULL`
   - Offset: `+7d`
   - Variáveis: Nome, PrimeiroNome, DataUltimoTreino

4. **MONTHLY_REVIEW** - Revisão Mensal
   - Query: `students WHERE status = 'active' AND EXTRACT(DAY FROM created_at) = EXTRACT(DAY FROM CURRENT_DATE)`
   - Offset: `+30d`
   - Variáveis: Nome, PrimeiroNome, DataInicio, MesesAtivo

5. **BIRTHDAY** - Aniversário
   - Query: `students WHERE birth_date IS NOT NULL AND EXTRACT(MONTH FROM birth_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(DAY FROM birth_date) = EXTRACT(DAY FROM CURRENT_DATE)`
   - Offset: `+0d`
   - Variáveis: Nome, PrimeiroNome, Idade, DataNascimento

6. **RENEWAL_WINDOW** - Janela de Renovação
   - Query: `students WHERE status = 'active' AND contract_end_date IS NOT NULL AND contract_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'`
   - Offset: `-7d`
   - Variáveis: Nome, PrimeiroNome, DataVencimento, DiasRestantes

7. **OCCURRENCE_FOLLOWUP** - Follow-up de Ocorrência
   - Query: `students s JOIN student_occurrences o ON s.id = o.student_id WHERE o.reminder_at IS NOT NULL AND o.reminder_at::date = $1`
   - Offset: `+0d`
   - Variáveis: Nome, PrimeiroNome, TipoOcorrencia, DescricaoOcorrencia, DataOcorrencia

### **Filtros de Audiência Permitidos:**
- `status`: array ['onboarding', 'active', 'paused']
- `tags`: array ['VIP', 'Novato', 'Renovacao', 'Especial']
- `trainer_id`: uuid
- `created_after`: date
- `created_before`: date

### **Variáveis de Template Disponíveis:**
Nome, PrimeiroNome, DataTreino, DataUltimoTreino, DataVenda, DataInicio, DataNascimento, DataVencimento, Idade, MesesAtivo, DiasRestantes, LinkAnamnese, TipoOcorrencia, DescricaoOcorrencia, DataOcorrencia

## 📊 SEEDS DOS TEMPLATES

### **Templates Implementados (MSG1-MSG10):**

1. **MSG1** - Logo Após a Venda
   - Âncora: `sale_close`
   - Offset: `+0d after sale_close`
   - Canal: `whatsapp`
   - 2 versões de mensagem

2. **MSG2** - Dia Anterior ao Primeiro Treino
   - Âncora: `first_workout`
   - Offset: `-1d before first_workout`
   - Canal: `whatsapp`
   - Inclui LinkAnamnese

3. **MSG3** - Após o Primeiro Treino
   - Âncora: `first_workout`
   - Offset: `+0d after first_workout`
   - Canal: `whatsapp`

4. **MSG4** - Final da Primeira Semana
   - Âncora: `weekly_followup`
   - Offset: `+7d after first_workout`
   - Canal: `whatsapp`

5. **MSG5** - Acompanhamento Semanal
   - Âncora: `weekly_followup`
   - Offset: `+7d after last_workout`
   - Canal: `whatsapp`

6. **MSG6** - Revisão Mensal
   - Âncora: `monthly_review`
   - Offset: `+30d after first_workout`
   - Canal: `whatsapp`

7. **MSG7** - Acompanhamento Mensal Motivacional
   - Âncora: `monthly_review`
   - Offset: `+30d after last_review`
   - Canal: `whatsapp`

8. **MSG8** - Aniversário
   - Âncora: `birthday`
   - Offset: `+0d on birthday`
   - Canal: `whatsapp`

9. **MSG9** - Feedback Trimestral
   - Âncora: `monthly_review`
   - Offset: `+90d after first_workout`
   - Canal: `whatsapp`

10. **MSG10** - Novos Serviços
    - Âncora: `weekly_followup`
    - Offset: `+14d after last_workout`
    - Canal: `whatsapp`

## ✅ CRITÉRIOS DE ACEITE ATENDIDOS

- ✅ **EVENT_REGISTRY documentado** com âncoras oficiais
- ✅ **Filtros permitidos** definidos (sem SQL custom)
- ✅ **Seeds MSG1..MSG10** validados e implementados
- ✅ **Variáveis de template** validadas
- ✅ **Estrutura base** para motor performático
- ✅ **Documentação completa** publicada

## 🔧 ARQUIVOS CRIADOS

- `web/lib/relationship/event-registry.ts` - Catálogo de âncoras
- `web/lib/relationship/template-seeds.ts` - Seeds dos templates
- `web/evidencias/gate10-6-0-especificacao-seeds.md` - Esta documentação

## 🚀 PRÓXIMO PASSO

**GATE 10.6.1 - Data Model & RLS**
- Migrations das 3 tabelas
- Índices otimizados
- RLS e roles
- Funções de serviço
