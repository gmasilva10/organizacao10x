"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ProfessionalProfilesManager } from "@/components/ProfessionalProfilesManager"
import { ProfessionalsManager } from "@/components/ProfessionalsManager"
import { DefaultsManager } from "@/components/DefaultsManager"
import { VersionBanner } from "@/components/VersionBanner"
import {
  Users,
  UserCheck,
  Shield,
  Settings,
  ArrowRight
} from "lucide-react"

type TabType = 'profiles' | 'professionals' | 'defaults'

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState<TabType>('profiles')

  return (
    <div className="space-y-6">
      <VersionBanner />
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Equipe</h1>
        <p className="text-muted-foreground mt-2">Gerencie funções profissionais e profissionais da equipe.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card 
          className={`group relative cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
            activeTab === 'profiles'
              ? 'border-l-4 border-l-primary shadow-md -translate-y-0.5'
              : 'border-l-4 border-l-transparent hover:border-l-primary'
          }`}
          onClick={() => setActiveTab('profiles')}
          aria-pressed={activeTab === 'profiles'}
          aria-label="Acessar Funções"
        >
          <CardContent className="p-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center mb-2">
              <Shield className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Funções</h3>
            <p className="text-muted-foreground text-xs mb-2 line-clamp-2">Gerencie funções e permissões dos profissionais.</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Acessar</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`group relative cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
            activeTab === 'professionals'
              ? 'border-l-4 border-l-primary shadow-md -translate-y-0.5'
              : 'border-l-4 border-l-transparent hover:border-l-primary'
          }`}
          onClick={() => setActiveTab('professionals')}
          aria-pressed={activeTab === 'professionals'}
          aria-label="Acessar Profissionais"
        >
          <CardContent className="p-3">
            <div className="bg-green-50 dark:bg-green-900/20 text-green-600 w-8 h-8 rounded-lg flex items-center justify-center mb-2">
              <Users className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Profissionais</h3>
            <p className="text-muted-foreground text-xs mb-2 line-clamp-2">Cadastre e gerencie profissionais da equipe.</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Acessar</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`group relative cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
            activeTab === 'defaults'
              ? 'border-l-4 border-l-primary shadow-md -translate-y-0.5'
              : 'border-l-4 border-l-transparent hover:border-l-primary'
          }`}
          onClick={() => setActiveTab('defaults')}
          aria-pressed={activeTab === 'defaults'}
          aria-label="Acessar Padrões"
        >
          <CardContent className="p-3">
            <div className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 w-8 h-8 rounded-lg flex items-center justify-center mb-2">
              <Settings className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Padrões</h3>
            <p className="text-muted-foreground text-xs mb-2 line-clamp-2">Configure responsáveis padrão para novos alunos.</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Acessar</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </CardContent>
        </Card>
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
