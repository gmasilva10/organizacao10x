/**
 * GATE 10.8 - Category Manager Component
 * Gerenciamento de categorias financeiras
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2, FolderTree } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function CategoryManager() {
  const [categories] = useState([
    { id: 1, name: 'Mensalidades', color: 'blue', active: true },
    { id: 2, name: 'Personal Trainer', color: 'green', active: true },
    { id: 3, name: 'Avaliações', color: 'purple', active: true },
    { id: 4, name: 'Planos Especiais', color: 'orange', active: false },
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Categorias Financeiras</h2>
          <p className="text-muted-foreground">
            Organize seus serviços em categorias para melhor gestão.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full bg-${category.color}-500`} />
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </div>
                <Badge variant={category.active ? 'default' : 'secondary'}>
                  {category.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State se não houver categorias */}
      {categories.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-3">
            <FolderTree className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
            <div>
              <h3 className="font-semibold">Nenhuma categoria cadastrada</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Comece criando sua primeira categoria financeira.
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Categoria
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
