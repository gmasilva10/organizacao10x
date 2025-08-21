"use client"

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"

type Toast = { id: number; type: "success" | "error" | "info"; message: string }

const ToastContext = createContext<{
  toasts: Toast[]
  success: (msg: string) => void
  error: (msg: string) => void
  info: (msg: string) => void
} | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(1)

  const push = useCallback((type: Toast["type"], message: string) => {
    const id = idRef.current++
    setToasts((t) => [...t, { id, type, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
  }, [])

  const value = useMemo(
    () => ({
      toasts,
      success: (m: string) => push("success", m),
      error: (m: string) => push("error", m),
      info: (m: string) => push("info", m),
    }),
    [toasts, push]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed inset-x-0 top-2 z-[60] flex flex-col items-center gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`max-w-md rounded-md px-4 py-2 text-sm shadow ${
            t.type === "success" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" :
            t.type === "error" ? "bg-red-50 text-red-700 ring-1 ring-red-200" :
            "bg-sky-50 text-sky-700 ring-1 ring-sky-200"
          }`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error("useToast deve ser usado dentro de <ToastProvider>")
  }
  return ctx
}


