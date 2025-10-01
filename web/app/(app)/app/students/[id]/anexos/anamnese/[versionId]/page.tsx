"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type Question = { key: string; label: string; type: string; options?: any }

export default function StudentAnamneseEditorPage() {
  const params = useParams()
  const studentId = params?.id as string
  const versionId = params?.versionId as string

  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [code, setCode] = useState<string>("")
  const [saving, setSaving] = useState<boolean>(false)

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/anamnese/version/${versionId}`)
      const data = await res.json()
      if (res.ok) {
        setCode(data.version.code)
        setQuestions((data.version.questions || []).map((q: any) => ({ key: q.key, label: q.label, type: q.type, options: q.options })))
        setAnswers(data.version.answers || {})
      }
    }
    if (versionId) load()
  }, [versionId])

  const onChange = (key: string, value: any) => setAnswers(prev => ({ ...prev, [key]: value }))

  const save = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/anamnese/version/${versionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      alert('Respostas salvas')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="text-2xl font-bold">Anamnese {code}</div>

      <div className="space-y-4">
        {questions.map((q) => (
          <div key={q.key} className="space-y-1">
            <div className="text-sm font-medium">{q.label}</div>
            {q.type === 'text' || q.type === 'single' ? (
              <Input value={answers[q.key] ?? ''} onChange={e => onChange(q.key, e.target.value)} />
            ) : q.type === 'multi' ? (
              <Textarea value={(answers[q.key] ?? '') as any} onChange={e => onChange(q.key, e.target.value)} />
            ) : (
              <Input value={answers[q.key] ?? ''} onChange={e => onChange(q.key, e.target.value)} />
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </div>
  )
}


