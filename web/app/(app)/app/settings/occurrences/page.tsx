"use client"

import { useState, useEffect } from "react"
import { useOccurrencesPermissions } from "@/lib/use-occurrences-permissions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { OccurrenceGroupsManager } from "@/components/occurrences/OccurrenceGroupsManager"
import { OccurrenceTypesManager } from "@/components/occurrences/OccurrenceTypesManager"

export default function OccurrencesAdminPage() {
  const { permissions, loading: permissionsLoading } = useOccurrencesPermissions()

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!permissions.manage) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para gerenciar grupos e tipos de ocorrências.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Badge variant="secondary" className="mb-4">
              Permissão necessária: occurrences.manage
            </Badge>
            <p className="text-sm text-muted-foreground">
              Entre em contato com o administrador para solicitar acesso.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administração de Ocorrências</h1>
          <p className="text-muted-foreground">
            Gerencie grupos e tipos de ocorrências da sua organização
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Eye className="h-4 w-4 mr-1" />
          Modo Administrativo
        </Badge>
      </div>

      <Tabs defaultValue="groups" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="groups">Grupos de Ocorrências</TabsTrigger>
          <TabsTrigger value="types">Tipos de Ocorrências</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Grupos de Ocorrências</CardTitle>
              <CardDescription>
                Organize as ocorrências em grupos temáticos. Ex: "Comportamento", "Acadêmico", "Financeiro"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OccurrenceGroupsManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Ocorrências</CardTitle>
              <CardDescription>
                Defina tipos específicos dentro de cada grupo. Ex: "Falta", "Atraso", "Indisciplina"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OccurrenceTypesManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
