'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProtocolsCatalog } from './ProtocolsCatalog'
import { RIRCatalog } from './RIRCatalog'
import { ReadinessCatalog } from './ReadinessCatalog'
import { TagsCatalog } from './TagsCatalog'
import { FileText, Table, Activity, Tag } from 'lucide-react'

export function GuidelinesCatalogs() {
  const [activeTab, setActiveTab] = useState('protocols')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Catálogos de Diretrizes</h2>
        <p className="text-muted-foreground">
          Dados de referência para o sistema de diretrizes de treino
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="protocols" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Protocolos
          </TabsTrigger>
          <TabsTrigger value="rir" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            RIR
          </TabsTrigger>
          <TabsTrigger value="readiness" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Prontidão
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tags
          </TabsTrigger>
        </TabsList>

        <TabsContent value="protocols" className="mt-6">
          <ProtocolsCatalog />
        </TabsContent>

        <TabsContent value="rir" className="mt-6">
          <RIRCatalog />
        </TabsContent>

        <TabsContent value="readiness" className="mt-6">
          <ReadinessCatalog />
        </TabsContent>

        <TabsContent value="tags" className="mt-6">
          <TagsCatalog />
        </TabsContent>
      </Tabs>
    </div>
  )
}
