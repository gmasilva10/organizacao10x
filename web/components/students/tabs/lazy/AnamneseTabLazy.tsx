"use client"

import { Suspense, lazy } from "react"
import { perf } from "@/lib/perfClient"

// Lazy import com webpack chunk name
const AnamneseTab = lazy(() => 
  import("../AnamneseTab").then(module => {
    // Performance mark quando o módulo for carregado
    perf.markOccurrencesTabDataReady() // Reutilizando o mark para anamnese
    return module
  })
)

// Skeleton leve para a aba de anamnese
function AnamneseSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-28 bg-gray-200 rounded animate-pulse" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Error Boundary para a aba
function AnamneseErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-red-500 mb-4">
        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Erro ao carregar anamnese
      </h3>
      <p className="text-gray-600 mb-4">
        Não foi possível carregar a anamnese do aluno.
      </p>
      <button
        onClick={retry}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  )
}

interface AnamneseTabLazyProps {
  studentId: string
  studentName: string
}

export default function AnamneseTabLazy({ studentId, studentName }: AnamneseTabLazyProps) {
  return (
    <Suspense fallback={<AnamneseSkeleton />}>
      <AnamneseTab 
        studentId={studentId} 
        studentName={studentName}
        onError={(error) => <AnamneseErrorFallback error={error} retry={() => window.location.reload()} />}
      />
    </Suspense>
  )
}
