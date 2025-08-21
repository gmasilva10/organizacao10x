"use client"

import { useEffect, useMemo, useState, useContext, createContext, createElement } from "react"
import type { ReactNode } from "react"

type Theme = "light" | "dark"

type ThemeContextValue = {
  theme: Theme
  setTheme: (next: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light"
  const stored = localStorage.getItem("pg-theme") as Theme | null
  if (stored === "light" || stored === "dark") return stored
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
  return prefersDark ? "dark" : "light"
}

export function ThemeProvider({ children, initialTheme }: { children: ReactNode; initialTheme?: Theme }): ReactNode {
  const [theme, setThemeState] = useState<Theme>(initialTheme ?? getInitialTheme())

  const applyTheme = (next: Theme) => {
    setThemeState(next)
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", next === "dark")
    }
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("pg-theme", next)
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent<Theme>("pg-theme", { detail: next }))
    }
  }

  useEffect(() => {
    // Ensure DOM reflects current theme on mount
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle("dark", theme === "dark")
      // Remove initial opacity fade if present
      document.body.style.opacity = '1'
    }
    // Listen cross-tabs
    const onStorage = (e: StorageEvent) => {
      if (e.key === "pg-theme" && (e.newValue === "light" || e.newValue === "dark")) {
        setThemeState(e.newValue)
      }
    }
    const onCustom = (e: Event) => {
      const det = (e as CustomEvent<Theme>).detail
      if (det === "light" || det === "dark") setThemeState(det)
    }
    window.addEventListener("storage", onStorage)
    window.addEventListener("pg-theme", onCustom as EventListener)
    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("pg-theme", onCustom as EventListener)
    }
  }, [theme])

  const value = useMemo<ThemeContextValue>(() => ({ theme, setTheme: applyTheme }), [theme])

  return createElement(ThemeContext.Provider, { value }, children)
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (ctx) return ctx
  // Fallback (should not happen if provider is mounted in layout)
  return {
    theme: "light",
    setTheme: () => {},
  }
}


