import { NextRequest, NextResponse } from 'next/server';

// Rota utilitária para controlar flag de auditoria degradada
// Disponível apenas em ambiente de teste
export async function POST(request: NextRequest) {
  // Verificar se está em ambiente de teste
  if (process.env.NODE_ENV !== 'test') {
    return NextResponse.json(
      { error: 'Esta rota está disponível apenas em ambiente de teste' },
      { status: 403 }
    );
  }

  try {
    const { enabled } = await request.json();
    
    // Definir variável de ambiente para controlar degradação
    process.env.AUDIT_FORCE_FAIL = enabled ? '1' : '0';
    
    return NextResponse.json({
      success: true,
      auditDegradationEnabled: enabled,
      message: `Auditoria degradada ${enabled ? 'habilitada' : 'desabilitada'}`
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao configurar flag de auditoria degradada' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Verificar se está em ambiente de teste
  if (process.env.NODE_ENV !== 'test') {
    return NextResponse.json(
      { error: 'Esta rota está disponível apenas em ambiente de teste' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    auditDegradationEnabled: process.env.AUDIT_FORCE_FAIL === '1',
    environment: process.env.NODE_ENV
  });
}
