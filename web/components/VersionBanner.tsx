"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"

interface VersionInfo {
  commit: string
  buildTime: string
  env: string
  lastMigration: string
}

export function VersionBanner() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Simular dados de versão (em produção viria do build)
    setVersionInfo({
      commit: "a8b5c2d",
      buildTime: "2025-01-28T16:30:00Z",
      env: "production",
      lastMigration: "20250128_equipe_p1_final_v2"
    })
  }, [])

  if (!isVisible || !versionInfo) return null

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-xs">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            v0.3.3-dev
          </Badge>
          <span className="text-blue-700">
            <strong>Commit:</strong> {versionInfo.commit}
          </span>
          <span className="text-blue-700">
            <strong>Build:</strong> {new Date(versionInfo.buildTime).toLocaleString('pt-BR')}
          </span>
          <span className="text-blue-700">
            <strong>ENV:</strong> {versionInfo.env}
          </span>
          <span className="text-blue-700">
            <strong>Migration:</strong> {versionInfo.lastMigration}
          </span>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-blue-600 hover:text-blue-800"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
