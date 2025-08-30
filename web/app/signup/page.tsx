"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/toast"
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react"

interface SignupForm {
  org_name: string
  full_name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
}

export default function SignupPage() {
  const { success, error } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [plan, setPlan] = useState<string>("basic")
  
  const [form, setForm] = useState<SignupForm>({
    org_name: "",
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false
  })

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const planParam = searchParams.get("plan")
    if (planParam && ["basic", "enterprise"].includes(planParam)) {
      setPlan(planParam)
    }
  }, [searchParams])

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "org_name":
        return value.trim().length < 2 ? "Nome da organização deve ter pelo menos 2 caracteres" : ""
      case "full_name":
        return value.trim().length < 2 ? "Nome completo deve ter pelo menos 2 caracteres" : ""
      case "email":
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
        return !emailRegex.test(value) ? "Email deve ter um formato válido" : ""
      case "phone":
        if (!value) return "" // Telefone é opcional
        const phoneRegex = /^\+?[1-9]\d{1,14}$/
        return !phoneRegex.test(value) ? "Telefone deve estar no formato +55..." : ""
      case "password":
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/
        return !passwordRegex.test(value) ? "Senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula e número" : ""
      case "confirmPassword":
        return value !== form.password ? "Confirmação de senha não confere" : ""
      default:
        return ""
    }
  }

  const handleChange = (name: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [name]: value }))
    
    if (typeof value === "string") {
      const fieldError = validateField(name, value)
      setFieldErrors(prev => ({ ...prev, [name]: fieldError }))
      
      // Validar confirmPassword quando password mudar
      if (name === "password" && form.confirmPassword) {
        const confirmError = form.confirmPassword !== value ? "Confirmação de senha não confere" : ""
        setFieldErrors(prev => ({ ...prev, confirmPassword: confirmError }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar todos os campos
    const errors: Record<string, string> = {}
    Object.keys(form).forEach(key => {
      if (key !== "acceptTerms" && key !== "confirmPassword") {
        const error = validateField(key, form[key as keyof SignupForm] as string)
        if (error) errors[key] = error
      }
    })
    
    // Validar confirmPassword
    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "Confirmação de senha não confere"
    }
    
    // Validar termos
    if (!form.acceptTerms) {
      errors.acceptTerms = "Você deve aceitar os termos de uso"
    }
    
    setFieldErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      error("Por favor, corrija os campos destacados")
      // Focar no primeiro campo com erro
      const firstErrorField = Object.keys(errors)[0]
      const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement
      element?.focus()
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/public/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_name: form.org_name.trim(),
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          password: form.password,
          plan: plan
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          error(data.errors.join(", "))
        } else {
          error(data.message || "Erro ao criar conta")
        }
        return
      }

      success("Conta criada com sucesso! Redirecionando...")
      
      // Aguardar um pouco antes de redirecionar
      setTimeout(() => {
        router.push(data.redirect_url || "/app")
      }, 1500)

    } catch (err) {
      console.error("Erro no signup:", err)
      error("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const planDisplayName = plan === "basic" ? "Basic" : "Enterprise"
  const planDescription = plan === "basic" 
    ? "Até 3 colaboradores • Recursos essenciais" 
    : "Até 100 colaboradores • Recursos avançados"

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para início
            </Link>
          </Button>
          
          <h1 className="text-2xl font-bold tracking-tight">Criar conta</h1>
          <p className="text-muted-foreground mt-2">
            Comece sua jornada no Personal Global
          </p>
          
          {/* Plano selecionado */}
          <div className="mt-4 p-3 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Plano {planDisplayName}</span>
                <p className="text-sm text-muted-foreground">{planDescription}</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={{ pathname: '/', hash: 'planos', query: { from: '/signup' } }}>Alterar</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Nome da Organização */}
          <div>
            <Label htmlFor="org_name">Nome da organização *</Label>
            <Input
              id="org_name"
              name="org_name"
              type="text"
              value={form.org_name}
              onChange={(e) => handleChange("org_name", e.target.value)}
              placeholder="Ex: Studio Fitness Pro"
              required
              aria-invalid={!!fieldErrors.org_name}
              aria-describedby={fieldErrors.org_name ? "org_name-error" : undefined}
              className={fieldErrors.org_name ? "border-destructive" : ""}
            />
            {fieldErrors.org_name && (
              <p id="org_name-error" role="alert" className="text-sm text-destructive mt-1">
                {fieldErrors.org_name}
              </p>
            )}
          </div>

          {/* Nome Completo */}
          <div>
            <Label htmlFor="full_name">Seu nome completo *</Label>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              value={form.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              placeholder="Ex: João Silva"
              required
              aria-invalid={!!fieldErrors.full_name}
              aria-describedby={fieldErrors.full_name ? "full_name-error" : undefined}
              className={fieldErrors.full_name ? "border-destructive" : ""}
            />
            {fieldErrors.full_name && (
              <p id="full_name-error" role="alert" className="text-sm text-destructive mt-1">
                {fieldErrors.full_name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="seu@email.com"
              required
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              className={fieldErrors.email ? "border-destructive" : ""}
            />
            {fieldErrors.email && (
              <p id="email-error" role="alert" className="text-sm text-destructive mt-1">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Telefone */}
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+55 11 99999-9999"
              aria-invalid={!!fieldErrors.phone}
              aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
              className={fieldErrors.phone ? "border-destructive" : ""}
            />
            {fieldErrors.phone && (
              <p id="phone-error" role="alert" className="text-sm text-destructive mt-1">
                {fieldErrors.phone}
              </p>
            )}
          </div>

          {/* Senha */}
          <div>
            <Label htmlFor="password">Senha *</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? "password-error" : "password-hint"}
                className={fieldErrors.password ? "border-destructive pr-10" : "pr-10"}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password ? (
              <p id="password-error" role="alert" className="text-sm text-destructive mt-1">
                {fieldErrors.password}
              </p>
            ) : (
              <p id="password-hint" className="text-sm text-muted-foreground mt-1">
                Deve conter maiúscula, minúscula e número
              </p>
            )}
          </div>

          {/* Confirmar Senha */}
          <div>
            <Label htmlFor="confirmPassword">Confirme sua senha *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                placeholder="Digite a senha novamente"
                required
                aria-invalid={!!fieldErrors.confirmPassword}
                aria-describedby={fieldErrors.confirmPassword ? "confirmPassword-error" : undefined}
                className={fieldErrors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Ocultar confirmação" : "Mostrar confirmação"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p id="confirmPassword-error" role="alert" className="text-sm text-destructive mt-1">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Termos */}
          <div className="flex items-start gap-2">
            <input
              id="acceptTerms"
              name="acceptTerms"
              type="checkbox"
              checked={form.acceptTerms}
              onChange={(e) => handleChange("acceptTerms", e.target.checked)}
              required
              aria-invalid={!!fieldErrors.acceptTerms}
              aria-describedby={fieldErrors.acceptTerms ? "acceptTerms-error" : undefined}
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="acceptTerms" className="text-sm font-normal cursor-pointer">
                Aceito os <Link href="/termos" className="underline text-primary">termos de uso</Link> e{" "}
                <Link href="/privacidade" className="underline text-primary">política de privacidade</Link> *
              </Label>
              {fieldErrors.acceptTerms && (
                <p id="acceptTerms-error" role="alert" className="text-sm text-destructive mt-1">
                  {fieldErrors.acceptTerms}
                </p>
              )}
            </div>
          </div>

          {/* Submit */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
            aria-live="polite"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando conta...
              </>
            ) : (
              "Criar conta"
            )}
          </Button>

          {/* Login Link */}
          <p className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link href="/login" className="underline text-primary hover:text-primary/80">
              Faça login
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
