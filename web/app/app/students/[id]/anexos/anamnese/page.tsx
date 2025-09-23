"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function StudentAnexosAnamnesePage() {
  const params = useParams()
  const router = useRouter()
  const studentId = (params?.id as string) || ""
  const [versions, setVersions] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/anamnese/versions/${studentId}`)
        const data = await res.json()
        if (res.ok) setVersions(data.versions || [])
      } finally {
        setLoading(false)
      }
    }
    if (studentId) load()
  }, [studentId])

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Anamneses do Aluno</h1>
      <p className="text-gray-600">Aluno: {studentId}</p>
      <div className="flex gap-2">
        <Button
          onClick={() => router.push(`/app/students/${studentId}/edit?action=gerar-anamnese`)}
        >
          Gerar Anamnese
        </Button>
      </div>
      <div className="rounded-md border p-4 bg-white">
        {loading ? (
          <div>Carregando anamneses...</div>
        ) : versions.length === 0 ? (
          <div>Nenhuma anamnese ainda. Clique em "Gerar Anamnese".</div>
        ) : (
          <div className="space-y-2">
            {versions.map(v => (
              <div key={v.id} className="flex items-center justify-between border rounded p-3">
                <div>
                  <div className="font-medium">{v.code}</div>
                  <div className="text-sm text-gray-600">Status: {v.status} {v.service_name ? `• Serviço: ${v.service_name}` : ''}</div>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="secondary">
                    <Link href={`/app/students/${studentId}/anexos/anamnese/${v.id}`}>Editar/Ver</Link>
                  </Button>
                  <Button onClick={() => router.push(`/app/students/${studentId}/edit?action=gerar-anamnese`)} variant="outline">Enviar</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
