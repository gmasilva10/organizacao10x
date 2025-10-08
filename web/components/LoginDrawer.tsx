"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthSync } from "@/lib/use-auth-sync"
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
	DrawerDescription,
} from "@/components/ui/drawer"
import { LogIn } from "lucide-react"
import { useLoginUI } from "./LoginUIContext"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import { motion, LayoutGroup } from "framer-motion"
import { useTheme } from "@/lib/use-theme"
import { useState, Suspense } from "react"
import { createClient } from "@/utils/supabase/client"
import { useToast } from "@/components/ui/toast"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

function LoginDrawerContent() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { open, setOpen } = useLoginUI()
    const [show, setShow] = useState(false)
    const { theme } = useTheme()
    const toast = useToast()
    const { syncAuth } = useAuthSync()

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        const email = String(form.get("email") || "").trim()
        const password = String(form.get("password") || "")
        if (!email || !password) return
        try {
            // Debug: verificar variáveis de ambiente
            console.log("🔍 [LOGIN DEBUG] Variáveis de ambiente:", {
                SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
                SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Presente" : "❌ Ausente",
                NODE_ENV: process.env.NODE_ENV
            })
            
            const supabase = createClient()
            console.log("🔍 [LOGIN DEBUG] Cliente Supabase criado")
            
            console.log("🔍 [LOGIN DEBUG] Tentando autenticar com:", { email, hasPassword: !!password })
            const { data, error } = await supabase.auth.signInWithPassword({ email, password })
            console.log("🔍 [LOGIN DEBUG] Resultado da autenticação:", { data, error })
            if (error) {
                toast.error("Credenciais inválidas. Tente novamente.")
                return
            }
            // Garante tokens atualizados pós-login
            const { data: sessionData } = await supabase.auth.getSession()
            const accessToken = sessionData?.session?.access_token
            const refreshToken = sessionData?.session?.refresh_token
            if (!accessToken || !refreshToken) {
                toast.error("Falha ao obter sessão após login. Tente novamente.")
                return
            }
            try {
                const syncResult = await syncAuth(accessToken, refreshToken)
                if (!syncResult.success) {
                    if (syncResult.reason === 'already_pending' || syncResult.reason === 'debounced') {
                        // Ignorar silenciosamente - já está sendo processado
                        console.log('Auth sync ignorado:', syncResult.reason)
                    } else {
                        toast.error("Falha ao sincronizar sessão. Tente novamente.")
                        return
                    }
                }
            } catch {
                toast.error("Erro ao sincronizar sessão. Verifique a conexão e tente novamente.")
                return
            }
            toast.success("Login realizado com sucesso.")
            setOpen(false)
            // Aguardar propagação de cookies e forçar reload completo
            await new Promise(resolve => setTimeout(resolve, 300))
            window.location.href = "/app"
        } catch {
            toast.error("Erro ao autenticar. Tente novamente.")
        }
    }
	return (
		<Drawer direction="right" open={open} onOpenChange={setOpen}>
			<DrawerTrigger asChild>
				<Button variant="outline" size="sm" className="rounded-full" aria-label="Abrir login">
					<LogIn className="mr-2 h-4 w-4" />
					Login
				</Button>
			</DrawerTrigger>
			<DrawerContent className="sm:max-w-[480px]" aria-describedby="login-drawer-description">
				<DrawerHeader>
                <LayoutGroup>
                    <div className="flex items-center gap-3">
                        <motion.div layoutId="pg-hero-logo" className="mb-4 flex justify-center">
                            <Image
                                src={theme === "dark" ? "/logo_branca.png" : "/Global_Preto.png"}
                                alt="Personal Global"
                                width={56}
                                height={56}
                                sizes="56px"
                                className="rounded-sm object-contain"
                            />
                        </motion.div>
                        <div className="text-left">
                          <DrawerTitle>Bem-vindo de volta</DrawerTitle>
                          <DrawerDescription id="login-drawer-description">Acesse sua conta Personal Global</DrawerDescription>
                        </div>
                    </div>
                </LayoutGroup>
				</DrawerHeader>
				<div className="px-4 pb-4">
					<form className="space-y-4" onSubmit={onSubmit} autoComplete="off">
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<div className="relative">
								<Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input id="email" name="email" type="email" placeholder="demo@personalglobal.com.br" className="pl-9" autoFocus aria-label="Email" autoComplete="off" spellCheck={false} inputMode="email" defaultValue="gma_silva@yahoo.com.br" />
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Senha</Label>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input id="password" name="password" type={show ? "text" : "password"} placeholder="••••••••" className="pl-9 pr-9" autoComplete="new-password" defaultValue="Gma@11914984" />
                                <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Ocultar senha" : "Mostrar senha"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
						</div>
						<div className="flex items-center justify-between">
							<label className="flex cursor-pointer items-center gap-2 text-sm">
								<input type="checkbox" className="accent-primary h-4 w-4" aria-label="Lembrar-me" />
								<span>Lembrar-me</span>
							</label>
							<a href="#" className="text-sm text-primary hover:underline">Esqueci minha senha</a>
						</div>
						<Button type="submit" className="w-full rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground" aria-label="Entrar">Entrar</Button>
					</form>
					<div className="mt-6 flex items-center">
						<div className="h-px w-full bg-border" />
						<span className="mx-3 text-xs text-muted-foreground">ou</span>
						<div className="h-px w-full bg-border" />
					</div>
					<div className="mt-4">
						<Button variant="outline" className="w-full rounded-full" aria-label="Continuar com Google">Continuar com Google</Button>
					</div>
				</div>
				<DrawerFooter>
					<Button
						variant="outline"
						onClick={() => {
							const from = searchParams?.get("from") || "/"
							// Fecha o drawer e navega sem reabrir via histórico
							if (pathname === "/login") {
								setOpen(false)
								router.replace(from)
							} else {
								setOpen(false)
							}
						}}
					>
						Cancelar
					</Button>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	)
}

export function LoginDrawer() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <LoginDrawerContent />
        </Suspense>
    )
}
