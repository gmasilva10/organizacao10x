"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"

export default function LoginSimplePage() {
  const [email, setEmail] = useState('gma_silva@yahoo.com.br')
  const [password, setPassword] = useState('Gma@11914984')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Login attempt:', { email, password })
    // Aqui você pode implementar a lógica de login
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
          <p className="text-muted-foreground">Acesse sua conta para continuar</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </form>
        
        <div className="flex items-center justify-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/">Voltar</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup?plan=basic">Criar conta</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
