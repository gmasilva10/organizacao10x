/**
 * GATE 10.9 - Organization Settings Component
 * Configurações gerais da organização
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Palette, Globe } from 'lucide-react'

export default function OrganizationSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Organização</h2>
        <p className="text-muted-foreground">
          Configure dados da sua empresa e preferências gerais.
        </p>
      </div>

      {/* Dados da Empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Dados da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-name">Nome da Organização</Label>
              <Input 
                id="org-name" 
                placeholder="Minha Academia" 
                defaultValue="Organizacao10x"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-cnpj">CNPJ</Label>
              <Input 
                id="org-cnpj" 
                placeholder="00.000.000/0000-00" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-address">Endereço</Label>
            <Input 
              id="org-address" 
              placeholder="Rua, número, bairro, cidade - UF" 
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-phone">Telefone</Label>
              <Input 
                id="org-phone" 
                placeholder="(00) 00000-0000" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-email">E-mail</Label>
              <Input 
                id="org-email" 
                type="email" 
                placeholder="contato@academia.com" 
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button>Salvar Dados</Button>
          </div>
        </CardContent>
      </Card>

      {/* Tema e Preferências */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Tema e Preferências
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tema da Interface</Label>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">Claro</Button>
              <Button variant="default" className="flex-1">Escuro</Button>
              <Button variant="outline" className="flex-1">Automático</Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Fuso Horário</Label>
            <Input 
              id="timezone" 
              value="America/Sao_Paulo (GMT-3)" 
              disabled
            />
            <p className="text-xs text-muted-foreground">
              Fuso horário usado para agendamentos e lembretes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Localização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Localização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <Input 
                id="language" 
                value="Português (Brasil)" 
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Moeda</Label>
              <Input 
                id="currency" 
                value="Real (R$)" 
                disabled
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
