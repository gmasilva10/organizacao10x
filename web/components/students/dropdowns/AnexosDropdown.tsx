"use client"

import { useState, Suspense, lazy } from "react"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { 
  FileText, 
  ChevronDown,
  AlertTriangle,
  Target,
  Dumbbell,
  Eye
} from "lucide-react"
import { useStudentTabPreload } from "@/hooks/usePreload"

// Lazy imports com webpack chunk names
const OcorrenciasModal = lazy(() => 
  import("../modals/OcorrenciasModal").then(module => ({
    default: module.default
  }))
)

const AnamneseModal = lazy(() => 
  import("../modals/AnamneseModal").then(module => ({
    default: module.default
  }))
)

const PlaceholderModal = lazy(() => 
  import("../modals/PlaceholderModal").then(module => ({
    default: module.default
  }))
)

type AnexosDropdownProps = {
  studentId: string
  studentName: string
}

export default function AnexosDropdown({ studentId, studentName }: AnexosDropdownProps) {
  const [open, setOpen] = useState(false)
  const [ocorrenciasModalOpen, setOcorrenciasModalOpen] = useState(false)
  const [anamneseModalOpen, setAnamneseModalOpen] = useState(false)
  const [diretrizModalOpen, setDiretrizModalOpen] = useState(false)
  const [treinoModalOpen, setTreinoModalOpen] = useState(false)
  
  // Pré-carregamento inteligente
  const { preloadOcorrencias, preloadAnamnese, preloadDiretriz } = useStudentTabPreload()

  const handleOcorrencias = () => {
    setOpen(false)
    setOcorrenciasModalOpen(true)
  }

  const handleAnamnese = () => {
    setOpen(false)
    setAnamneseModalOpen(true)
  }

  const handleDiretriz = () => {
    setOpen(false)
    setDiretrizModalOpen(true)
  }

  const handleTreino = () => {
    setOpen(false)
    setTreinoModalOpen(true)
  }

  return (
    <>
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Anexos
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem 
          onClick={handleOcorrencias} 
          className="flex items-center gap-3"
          {...preloadOcorrencias()}
        >
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span>Ocorrências</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleAnamnese} 
          className="flex items-center gap-3"
          {...preloadAnamnese()}
        >
          <FileText className="h-4 w-4 text-blue-600" />
          <span>Anamnese</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleDiretriz} 
          className="flex items-center gap-3"
          {...preloadDiretriz()}
        >
          <Target className="h-4 w-4 text-green-600" />
          <span>Diretriz</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleTreino} className="flex items-center gap-3">
          <Dumbbell className="h-4 w-4 text-orange-600" />
          <span>Treino</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    {/* Modais com Lazy Loading */}
    {ocorrenciasModalOpen && (
      <Suspense fallback={
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="animate-pulse">
              <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-200 rounded"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      }>
        <OcorrenciasModal
          open={ocorrenciasModalOpen}
          onClose={() => setOcorrenciasModalOpen(false)}
          studentId={studentId}
          studentName={studentName}
        />
      </Suspense>
    )}

    {anamneseModalOpen && (
      <Suspense fallback={
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="animate-pulse">
              <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-200 rounded"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      }>
        <AnamneseModal
          open={anamneseModalOpen}
          onClose={() => setAnamneseModalOpen(false)}
          studentId={studentId}
          studentName={studentName}
        />
      </Suspense>
    )}

    {diretrizModalOpen && (
      <Suspense fallback={
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="animate-pulse">
              <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-200 rounded"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      }>
        <PlaceholderModal
          open={diretrizModalOpen}
          onClose={() => setDiretrizModalOpen(false)}
          title="Diretriz de Treino"
          description="Módulo de Diretriz de Treino em desenvolvimento. Em breve: motor de diretrizes baseado na anamnese."
          icon={<Target className="h-5 w-5 text-green-600" />}
        />
      </Suspense>
    )}

    {treinoModalOpen && (
      <Suspense fallback={
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="animate-pulse">
              <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-200 rounded"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      }>
        <PlaceholderModal
          open={treinoModalOpen}
          onClose={() => setTreinoModalOpen(false)}
          title="Treino"
          description="Módulo de Treino em desenvolvimento. Em breve: planos e registros de treino personalizados."
          icon={<Dumbbell className="h-5 w-5 text-purple-600" />}
        />
      </Suspense>
    )}
  </>
  )
}
