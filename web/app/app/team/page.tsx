"use client"

import { useState } from "react"
import { ProfessionalProfilesManager } from "@/components/ProfessionalProfilesManager"
import { ProfessionalsManager } from "@/components/ProfessionalsManager"
import { DefaultsManager } from "@/components/DefaultsManager"
import {
  Users,
  UserCheck,
  Shield,
  Settings
} from "lucide-react"

type TabType = 'profiles' | 'professionals' | 'defaults'

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState<TabType>('profiles')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Equipe</h1>
        <p className="text-muted-foreground mt-2">Gerencie perfis profissionais e profissionais da equipe.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <button 
          onClick={() => setActiveTab('profiles')}
          className={`block rounded-lg border p-6 text-left transition-colors ${
            activeTab === 'profiles' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-card hover:bg-accent'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4" />
            <h3 className="font-semibold">Perfis Profissionais</h3>
          </div>
          <p className="text-sm opacity-80">Gerencie perfis e permissões dos profissionais.</p>
        </button>
        
        <button 
          onClick={() => setActiveTab('professionals')}
          className={`block rounded-lg border p-6 text-left transition-colors ${
            activeTab === 'professionals' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-card hover:bg-accent'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4" />
            <h3 className="font-semibold">Profissionais</h3>
          </div>
          <p className="text-sm opacity-80">Cadastre e gerencie profissionais da equipe.</p>
        </button>
        
        <button 
          onClick={() => setActiveTab('defaults')}
          className={`block rounded-lg border p-6 text-left transition-colors ${
            activeTab === 'defaults' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-card hover:bg-accent'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Settings className="h-4 w-4" />
            <h3 className="font-semibold">Defaults</h3>
          </div>
          <p className="text-sm opacity-80">Configure responsáveis padrão para novos alunos.</p>
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'profiles' && <ProfessionalProfilesManager />}
        {activeTab === 'professionals' && <ProfessionalsManager />}
        {activeTab === 'defaults' && <DefaultsManager />}
      </div>
    </div>
  )
}
