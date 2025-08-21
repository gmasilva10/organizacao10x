"use client"

import { createContext, useContext, useState, ReactNode } from "react"

type LoginUIContextType = {
	open: boolean
	setOpen: (v: boolean) => void
}

const LoginUIContext = createContext<LoginUIContextType | undefined>(undefined)

export function LoginUIProvider({ children }: { children: ReactNode }) {
	const [open, setOpen] = useState(false)
	return (
		<LoginUIContext.Provider value={{ open, setOpen }}>
			{children}
		</LoginUIContext.Provider>
	)
}

export function useLoginUI() {
	const ctx = useContext(LoginUIContext)
	if (!ctx) throw new Error("useLoginUI must be used within LoginUIProvider")
	return ctx
}
