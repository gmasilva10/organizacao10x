"use client"

import { useState } from "react"
import { OccurrenceGroupsManager } from "@/components/OccurrenceGroupsManager"
import { OccurrenceTypesManager } from "@/components/OccurrenceTypesManager"
import {
  Users,
  Tag,
  Settings
} from "lucide-react"

type TabType = 'groups' | 'types'

export default function OccurrencesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('groups')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ocorrências</h1>
        <p className="text-muted-foreground mt-2">Gerencie grupos e tipos de ocorrências dos alunos.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => setActiveTab('groups')}
          className={`block rounded-lg border p-6 text-left transition-colors ${
            activeTab === 'groups'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card hover:bg-accent'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4" />
            <h3 className="font-semibold">Grupos</h3>
          </div>
          <p className="text-sm opacity-80">Gerencie grupos de ocorrências (ex: Saúde, Financeiro).</p>
        </button>

        <button
          onClick={() => setActiveTab('types')}
          className={`block rounded-lg border p-6 text-left transition-colors ${
            activeTab === 'types'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card hover:bg-accent'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Tag className="h-4 w-4" />
            <h3 className="font-semibold">Tipos</h3>
          </div>
          <p className="text-sm opacity-80">Gerencie tipos específicos dentro de cada grupo.</p>
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'groups' && <OccurrenceGroupsManager />}
        {activeTab === 'types' && <OccurrenceTypesManager />}
      </div>
    </div>
  )
}
