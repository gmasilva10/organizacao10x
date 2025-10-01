"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { User, Upload } from "lucide-react"

type Membership = { organization_id: string; organization_name: string; role: string }

export default function ProfilePage() {
  const { success, error } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [phone, setPhone] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [errMsg, setErrMsg] = useState("")
  const nameRef = useRef<HTMLInputElement | null>(null)
  const phoneRef = useRef<HTMLInputElement | null>(null)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const resp = await fetch("/api/profile", { cache: "no-store" })
        const json = await resp.json()
        if (!cancelled && resp.ok && json?.ok) {
          setFullName(json.profile?.full_name || "")
          setEmail(json.profile?.email || "")
          setPhone(json.profile?.phone || "")
          setAvatarUrl(json.profile?.avatar_url || null)
          setMemberships(Array.isArray(json.profile?.memberships) ? json.profile.memberships : [])
        }
      } catch {}
      if (!cancelled) setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrMsg("")
    const v = fullName.trim()
    if (v.length < 2) {
      setErrMsg("Nome deve ter pelo menos 2 caracteres.")
      nameRef.current?.focus()
      return
    }
    const p = phone.trim()
    if (p && !/^\+?[1-9]\d{1,14}$/.test(p)) {
      setErrMsg("Telefone inválido. Use formato E.164, ex.: +5511999999999.")
      phoneRef.current?.focus()
      return
    }
    setSaving(true)
    try {
      const resp = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: v, phone: p || null }),
      })
      const json = await resp.json()
      if (!resp.ok || !json?.ok) {
        if (resp.status === 400) {
          setErrMsg("Nome deve ter pelo menos 2 caracteres.")
          nameRef.current?.focus()
          return
        }
        if (resp.status === 400 && json?.code === "invalid_phone") {
          setErrMsg("Telefone inválido. Use formato E.164, ex.: +5511999999999.")
          phoneRef.current?.focus()
          return
        }
        throw new Error("unexpected")
      }
      success("Perfil atualizado.")
    } catch {
      error("Não foi possível atualizar o perfil. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validações no frontend
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    
    if (file.size > maxSize) {
      error("Arquivo muito grande. Máximo 5MB.")
      return
    }

    if (!allowedTypes.includes(file.type)) {
      error("Tipo de arquivo inválido. Use JPEG, PNG ou WebP.")
      return
    }

    // Preview local
    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload
    uploadAvatar(file)
  }

  const uploadAvatar = async (file: File) => {
    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append("avatar", file)

      const resp = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      })

      const json = await resp.json()
      if (!resp.ok || !json?.ok) {
        if (json?.code === "file_too_large") {
          error("Arquivo muito grande. Máximo 5MB.")
        } else if (json?.code === "invalid_file_type") {
          error("Tipo de arquivo inválido. Use JPEG, PNG ou WebP.")
        } else {
          error("Erro ao fazer upload do avatar. Tente novamente.")
        }
        setAvatarPreview(null)
        return
      }

      setAvatarUrl(json.avatar_url)
      setAvatarPreview(null)
      success("Avatar atualizado com sucesso!")
    } catch {
      error("Erro ao fazer upload do avatar. Tente novamente.")
      setAvatarPreview(null)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const triggerAvatarUpload = () => {
    avatarInputRef.current?.click()
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <a href="#form" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md">Pular para o conteúdo</a>
      <header className="mb-8">
        <nav className="mb-2 text-sm text-muted-foreground" aria-label="Breadcrumb"><ol className="flex items-center gap-2"><li><Link href="/app" className="underline">Início</Link></li><li aria-hidden> / </li><li aria-current="page">Perfil</li></ol></nav>
        <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>
        <p className="text-muted-foreground mt-1">Gerencie seu nome e visualize suas organizações.</p>
      </header>
      {loading ? (
        <div role="status" aria-live="polite" className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-10 bg-muted rounded" />
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-10 bg-muted rounded" />
        </div>
      ) : (
        <form id="form" onSubmit={onSubmit} noValidate className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4 pb-6 border-b">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border-2 border-border flex items-center justify-center">
                {avatarPreview || avatarUrl ? (
                  <img 
                    src={avatarPreview || avatarUrl || ""} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={triggerAvatarUpload}
              disabled={uploadingAvatar}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {uploadingAvatar ? "Enviando..." : "Alterar avatar"}
            </Button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
              aria-label="Upload de avatar"
            />
            <p className="text-xs text-muted-foreground text-center">
              JPEG, PNG ou WebP. Máximo 5MB.
            </p>
          </div>

          <div>
            <Label htmlFor="full_name">Nome completo</Label>
            <Input
              id="full_name"
              ref={nameRef}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              aria-invalid={!!errMsg}
              aria-describedby={errMsg ? "name-error" : "name-help"}
            />
            <p id="name-help" className="text-xs text-muted-foreground mt-1">Mínimo de 2 caracteres.</p>
            {errMsg ? <p id="name-error" className="text-xs text-red-600 mt-1">{errMsg}</p> : null}
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" value={email} readOnly aria-readonly className="bg-muted/50" />
          </div>
          <div>
            <Label htmlFor="phone">Telefone (E.164)</Label>
            <Input id="phone" ref={phoneRef} value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="+5511999999999" aria-describedby="phone-help" />
            <p id="phone-help" className="text-xs text-muted-foreground mt-1">Formato internacional, ex.: +5511999999999.</p>
          </div>
          <div>
            <Label>Organizações</Label>
            <ul className="mt-2 space-y-2">
              {memberships.length === 0 ? (
                <li className="text-sm text-muted-foreground">Nenhuma organização</li>
              ) : (
                memberships.map((m) => (
                  <li key={m.organization_id} className="text-sm">
                    {m.organization_name} — <span className="text-muted-foreground">{m.role}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="flex justify-end gap-2">
            <Link href="/" className="text-sm underline" aria-label="Alterar senha (fluxo do provedor)">Alterar senha</Link>
            <Button type="submit" disabled={saving} aria-label="Salvar alterações">{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </form>
      )}
    </div>
  )
}


