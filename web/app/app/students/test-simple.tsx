"use client"

import { useState, useEffect } from "react"

export default function TestSimple() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔥 TESTE SIMPLES - CARREGANDO DADOS')
    fetch('/api/students?page=1&page_size=20')
      .then(res => res.json())
      .then(data => {
        console.log('📊 DADOS RECEBIDOS:', data)
        setStudents(data.students || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('❌ ERRO:', err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">🔥 TESTE SIMPLES</h1>
      
      <div className="bg-yellow-100 p-4 rounded mb-4">
        <p>Loading: {loading.toString()}</p>
        <p>Students: {students.length}</p>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : students.length === 0 ? (
        <p>Nenhum aluno encontrado</p>
      ) : (
        <div>
          <h2 className="text-xl mb-2">{students.length} alunos encontrados:</h2>
          {students.map((student: any, index: number) => (
            <div key={student.id || index} className="bg-green-100 p-2 mb-2 rounded">
              <strong>{student.name}</strong> - {student.email}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
