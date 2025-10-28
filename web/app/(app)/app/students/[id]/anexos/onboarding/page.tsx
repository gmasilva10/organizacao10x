"use client"

import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import OnboardingHistoryTab from "@/components/students/tabs/OnboardingHistoryTab"
import { LayoutGrid, Loader2 } from "lucide-react"

export default function StudentOnboardingHistoryPage() {
  const params = useParams()
  const studentId = params.id as string
  const [studentName, setStudentName] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStudent()
  }, [studentId])

  async function loadStudent() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('students')
        .select('name')
        .eq('id', studentId)
        .single()

      if (error) {
        console.error('Erro ao carregar aluno:', error)
        return
      }

      if (data) {
        setStudentName(data.name)
      }
    } catch (err) {
      console.error('Erro inesperado:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Carregando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <LayoutGrid className="h-6 w-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Histórico de Onboarding</h1>
          <p className="text-muted-foreground">
            Acompanhe o histórico completo de onboarding de {studentName}
          </p>
        </div>
      </div>

      <OnboardingHistoryTab studentId={studentId} />
    </div>
  )
}