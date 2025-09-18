export const MOCK_STUDENTS = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao.silva@email.com',
    phone: '(11) 99999-1111',
    status: 'Ativo',
    course: 'Desenvolvimento Web',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T09:00:00Z',
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria.santos@email.com',
    phone: '(11) 99999-2222',
    status: 'Inativo',
    course: 'Data Science',
    createdAt: '2024-01-16T10:30:00Z',
    updatedAt: '2024-01-16T10:30:00Z',
  },
  {
    id: '3',
    name: 'Pedro Oliveira',
    email: 'pedro.oliveira@email.com',
    phone: '(11) 99999-3333',
    status: 'Pendente',
    course: 'UX/UI Design',
    createdAt: '2024-01-17T14:15:00Z',
    updatedAt: '2024-01-17T14:15:00Z',
  },
  {
    id: '4',
    name: 'Ana Costa',
    email: 'ana.costa@email.com',
    phone: '(11) 99999-4444',
    status: 'Ativo',
    course: 'Mobile Development',
    createdAt: '2024-01-18T11:45:00Z',
    updatedAt: '2024-01-18T11:45:00Z',
  },
  {
    id: '5',
    name: 'Carlos Ferreira',
    email: 'carlos.ferreira@email.com',
    phone: '(11) 99999-5555',
    status: 'Concluído',
    course: 'DevOps',
    createdAt: '2024-01-19T16:20:00Z',
    updatedAt: '2024-01-19T16:20:00Z',
  },
]

export const MOCK_STUDENT_CREATE = {
  name: 'Novo Estudante',
  email: 'novo.estudante@email.com',
  phone: '(11) 99999-9999',
  course: 'Desenvolvimento Web',
}

export const MOCK_STUDENT_UPDATE = {
  id: '1',
  name: 'João Silva Atualizado',
  email: 'joao.silva.atualizado@email.com',
  phone: '(11) 99999-1111',
  status: 'Ativo',
  course: 'Desenvolvimento Web',
}

export const MOCK_API_RESPONSES = {
  success: {
    status: 200,
    data: { success: true, message: 'Operação realizada com sucesso' },
  },
  error: {
    status: 500,
    data: { error: 'Erro interno do servidor' },
  },
  notFound: {
    status: 404,
    data: { error: 'Estudante não encontrado' },
  },
  validation: {
    status: 400,
    data: { error: 'Dados inválidos', details: ['Nome é obrigatório'] },
  },
}
