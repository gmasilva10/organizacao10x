import { NextRequest, NextResponse } from 'next/server'
import { createClientAdmin } from '@/utils/supabase/server'

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientAdmin()
    
    console.log('🔧 [MIGRATION] Aplicando migração da tabela relationship_logs...')
    
    // 1. Criar tabela
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.relationship_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
            task_id UUID REFERENCES public.relationship_tasks(id) ON DELETE SET NULL,
            action VARCHAR(50) NOT NULL,
            channel VARCHAR(50) NOT NULL,
            template_code VARCHAR(100),
            meta JSONB DEFAULT '{}',
            at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `
    })
    
    if (createError) {
      console.error('❌ Erro ao criar tabela:', createError)
      return NextResponse.json({ 
        error: 'Erro ao criar tabela',
        details: createError.message 
      }, { status: 500 })
    }
    
    console.log('✅ Tabela relationship_logs criada')
    
    // 2. Criar índices
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_relationship_logs_student_id ON public.relationship_logs(student_id)',
      'CREATE INDEX IF NOT EXISTS idx_relationship_logs_task_id ON public.relationship_logs(task_id)',
      'CREATE INDEX IF NOT EXISTS idx_relationship_logs_action ON public.relationship_logs(action)',
      'CREATE INDEX IF NOT EXISTS idx_relationship_logs_channel ON public.relationship_logs(channel)',
      'CREATE INDEX IF NOT EXISTS idx_relationship_logs_at ON public.relationship_logs(at)',
      'CREATE INDEX IF NOT EXISTS idx_relationship_logs_student_action ON public.relationship_logs(student_id, action)',
      'CREATE INDEX IF NOT EXISTS idx_relationship_logs_student_at ON public.relationship_logs(student_id, at DESC)'
    ]
    
    for (const indexSQL of indexes) {
      const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL })
      if (indexError) {
        console.error('❌ Erro ao criar índice:', indexError)
        return NextResponse.json({ 
          error: 'Erro ao criar índice',
          details: indexError.message 
        }, { status: 500 })
      }
    }
    
    console.log('✅ Índices criados')
    
    // 3. Habilitar RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.relationship_logs ENABLE ROW LEVEL SECURITY;'
    })
    
    if (rlsError) {
      console.error('❌ Erro ao habilitar RLS:', rlsError)
      return NextResponse.json({ 
        error: 'Erro ao habilitar RLS',
        details: rlsError.message 
      }, { status: 500 })
    }
    
    console.log('✅ RLS habilitado')
    
    // 4. Criar políticas RLS
    const policies = [
      `CREATE POLICY "relationship_logs_select_policy" ON public.relationship_logs
        FOR SELECT
        USING (
            student_id IN (
                SELECT id FROM public.students 
                WHERE tenant_id IN (
                    SELECT tenant_id FROM public.memberships 
                    WHERE user_id = auth.uid()
                )
            )
        );`,
      `CREATE POLICY "relationship_logs_insert_policy" ON public.relationship_logs
        FOR INSERT
        WITH CHECK (
            student_id IN (
                SELECT id FROM public.students 
                WHERE tenant_id IN (
                    SELECT tenant_id FROM public.memberships 
                    WHERE user_id = auth.uid()
                )
            )
        );`,
      `CREATE POLICY "relationship_logs_update_policy" ON public.relationship_logs
        FOR UPDATE
        USING (
            student_id IN (
                SELECT id FROM public.students 
                WHERE tenant_id IN (
                    SELECT tenant_id FROM public.memberships 
                    WHERE user_id = auth.uid()
                )
            )
        );`,
      `CREATE POLICY "relationship_logs_delete_policy" ON public.relationship_logs
        FOR DELETE
        USING (
            student_id IN (
                SELECT id FROM public.students 
                WHERE tenant_id IN (
                    SELECT tenant_id FROM public.memberships 
                    WHERE user_id = auth.uid()
                )
            )
        );`
    ]
    
    for (const policySQL of policies) {
      const { error: policyError } = await supabase.rpc('exec_sql', { sql: policySQL })
      if (policyError) {
        console.error('❌ Erro ao criar política:', policyError)
        return NextResponse.json({ 
          error: 'Erro ao criar política',
          details: policyError.message 
        }, { status: 500 })
      }
    }
    
    console.log('✅ Políticas RLS criadas')
    
    // 5. Criar trigger para updated_at
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.update_relationship_logs_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        CREATE TRIGGER trigger_update_relationship_logs_updated_at
            BEFORE UPDATE ON public.relationship_logs
            FOR EACH ROW
            EXECUTE FUNCTION public.update_relationship_logs_updated_at();
      `
    })
    
    if (triggerError) {
      console.error('❌ Erro ao criar trigger:', triggerError)
      return NextResponse.json({ 
        error: 'Erro ao criar trigger',
        details: triggerError.message 
      }, { status: 500 })
    }
    
    console.log('✅ Trigger criado')
    
    // 6. Verificar se a tabela foi criada corretamente
    const { data: tables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'relationship_logs')
    
    if (checkError) {
      console.error('❌ Erro ao verificar tabela:', checkError)
      return NextResponse.json({ 
        error: 'Erro ao verificar tabela',
        details: checkError.message 
      }, { status: 500 })
    }
    
    if (tables && tables.length > 0) {
      console.log('🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!')
      
      return NextResponse.json({
        success: true,
        message: 'Migração da tabela relationship_logs concluída com sucesso',
        details: {
          table: 'relationship_logs',
          indexes: indexes.length,
          policies: policies.length,
          rls: true,
          trigger: true
        }
      })
    } else {
      return NextResponse.json({ 
        error: 'Tabela não foi criada corretamente',
        details: 'Verificação falhou'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Erro geral na migração:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

