"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { FileText, Brain, Settings } from "lucide-react"
import { AnamnesisTemplatesManager } from "@/components/anamnesis/AnamnesisTemplatesManager"
import { TrainingGuidelinesManager } from "@/components/anamnesis/TrainingGuidelinesManager"
import { ActiveVersionsManager } from "@/components/anamnesis/ActiveVersionsManager"

type TabType = 'student' | 'guidelines' | 'active'

export default function AnamnesisPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabType>('student')

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'guidelines') {
      setActiveTab('guidelines')
    } else if (tab === 'active') {
      setActiveTab('active')
    } else {
      setActiveTab('student')
    }
  }, [searchParams])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Anamnese</h1>
        <p className="text-muted-foreground mt-2">Configure templates de perguntas e diretrizes de treino para seus alunos.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button
          onClick={() => setActiveTab('student')}
          className={`block rounded-lg border p-6 text-left transition-colors ${
            activeTab === 'student'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card hover:bg-accent'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4" />
            <h3 className="font-semibold">Anamnese do Aluno</h3>
          </div>
          <p className="text-sm opacity-80">Configure templates de perguntas para intake dos alunos.</p>
        </button>

        <button
          onClick={() => setActiveTab('guidelines')}
          className={`block rounded-lg border p-6 text-left transition-colors ${
            activeTab === 'guidelines'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card hover:bg-accent'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Brain className="h-4 w-4" />
            <h3 className="font-semibold">Diretrizes de Treino (Personal)</h3>
          </div>
          <p className="text-sm opacity-80">Configure regras automáticas para recomendações de treino.</p>
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`block rounded-lg border p-6 text-left transition-colors ${
            activeTab === 'active'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card hover:bg-accent'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Settings className="h-4 w-4" />
            <h3 className="font-semibold">Versões Ativas</h3>
          </div>
          <p className="text-sm opacity-80">Gerencie as versões padrão da organização.</p>
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'student' && (
          <AnamnesisTemplatesManager 
            onEditTemplate={(template) => {
              console.log('Editar template:', template)
              // TODO: Implementar modal de edição
            }}
            onViewTemplate={(template) => {
              console.log('Ver template:', template)
              // TODO: Implementar modal de visualização
            }}
          />
        )}
        
        {activeTab === 'guidelines' && (
          <TrainingGuidelinesManager 
            onEditGuideline={(guideline) => {
              console.log('Editar diretrizes:', guideline)
              // TODO: Implementar modal de edição
            }}
            onViewGuideline={(guideline) => {
              console.log('Ver diretrizes:', guideline)
              // TODO: Implementar modal de visualização
            }}
          />
        )}
        
        {activeTab === 'active' && <ActiveVersionsManager />}
      </div>
    </div>
  )
}