"use client"

import { useState, useEffect } from "react"

export default function StudentsPage() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔥 COMPONENTE CARREGADO!')
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      console.log('🔄 Carregando alunos...')
      const response = await fetch('/api/students?page=1&page_size=20')
      const data = await response.json()
      
      console.log('📊 Dados da API:', data)
      console.log('📊 Número de alunos:', data.students?.length || 0)
      
      if (data.students) {
        setStudents(data.students)
        console.log('✅ Alunos carregados:', data.students.length)
      }
    } catch (error) {
      console.error('❌ Erro:', error)
    } finally {
      setLoading(false)
      console.log('✅ Carregamento finalizado')
    }
  }

  console.log('🎨 Renderizando:', { loading, studentsCount: students.length })

  return (
    <div className="p-8">
      <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded z-50">
        🔥 COMPONENTE ATIVO: {new Date().toLocaleTimeString()}
      </div>
      
      <h1 className="text-4xl font-bold mb-8">🔥 ALUNOS FUNCIONAL 🔥</h1>
      
      <div className="bg-yellow-100 p-4 rounded mb-8">
        <h2 className="font-bold">🔍 Debug Info:</h2>
        <p>Loading: {loading.toString()}</p>
        <p>Students Count: {students.length}</p>
        <p>API Working: {students.length > 0 ? '✅ SIM' : '❌ NÃO'}</p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-8">
          <h3 className="text-xl mb-4">❌ Nenhum aluno encontrado</h3>
          <p>A API não retornou dados ou houve um erro.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xl mb-4">✅ {students.length} alunos encontrados:</h3>
          {students.map((student: any, index: number) => (
            <div key={student.id || index} className="bg-green-100 p-4 rounded">
              <h4 className="font-bold">{student.name}</h4>
              <p>{student.email}</p>
              <p>Status: {student.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}