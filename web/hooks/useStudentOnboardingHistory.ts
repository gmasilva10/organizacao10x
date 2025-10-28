import { useEffect, useMemo, useRef, useState } from 'react'

type HistoryItem = {
  id: string
  completedAt: string
  initialStage: { id: string | null; name: string | null }
  finalStage: { id: string | null; name: string | null }
  totalDays: number | null
  totalTasksCompleted: number | null
  title: string | null
  finalStageName: string | null
}

type HistoryResponse = {
  page: number
  pageSize: number
  total: number
  items: HistoryItem[]
}

export function useStudentOnboardingHistory(studentId: string | undefined, opts?: { page?: number; pageSize?: number }) {
  const page = opts?.page ?? 1
  const pageSize = opts?.pageSize ?? 20
  const [data, setData] = useState<HistoryResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const url = useMemo(() => {
    if (!studentId) return null
    const u = new URL(`/api/students/${studentId}/onboarding-history`, location.origin)
    u.searchParams.set('page', String(page))
    u.searchParams.set('pageSize', String(pageSize))
    return u.toString()
  }, [studentId, page, pageSize])

  useEffect(() => {
    if (!url) return
    setLoading(true)
    setError(null)
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    ;(async () => {
      try {
        const res = await fetch(url, { signal: ac.signal, cache: 'no-store' })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          setError(body?.error || 'history_internal')
          setData(null)
          return
        }
        const json = (await res.json()) as HistoryResponse
        setData(json)
      } catch (e) {
        if ((e as any).name !== 'AbortError') setError('network_error')
      } finally {
        setLoading(false)
      }
    })()
    return () => ac.abort()
  }, [url])

  const retry = () => {
    // toggle state to force re-fetch
    setData((prev) => (prev ? { ...prev } : prev))
  }

  return { data, error, loading, retry }
}


