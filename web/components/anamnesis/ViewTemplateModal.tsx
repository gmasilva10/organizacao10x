"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Eye, 
  Calendar, 
  User, 
  CheckCircle, 
  Clock, 
  Tag,
  HelpCircle,
  ArrowLeft,
  ArrowRight
} from "lucide-react"
import { AnamnesisTemplateWithVersions } from "@/types/anamnesis"
import { useState } from "react"

interface ViewTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  template: AnamnesisTemplateWithVersions | null
}

export function ViewTemplateModal({ isOpen, onClose, template }: ViewTemplateModalProps) {
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0)

  if (!template) return null

  const versions = template.versions || []
  const currentVersion = versions[currentVersionIndex]
  const questions = currentVersion?.questions || []

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <Tag className="h-4 w-4" />
      case 'single': return <ArrowRight className="h-4 w-4" />
      case 'multi': return <CheckCircle className="h-4 w-4" />
      default: return <HelpCircle className="h-4 w-4" />
    }
  }

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'text': return 'Texto Livre'
      case 'single': return 'Escolha Única'
      case 'multi': return 'Múltipla Escolha'
      default: return type
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100">
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-left">{template.name}</DialogTitle>
              <DialogDescription className="text-left">
                {template.description || 'Sem descrição'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Template */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Informações do Template</CardTitle>
                <div className="flex gap-2">
                  {template.is_default && (
                    <Badge className="bg-blue-100 text-blue-800">
                      Padrão
                    </Badge>
                  )}
                  {currentVersion?.is_published && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Publicado
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Criado em:</span>
                  <span>{new Date(template.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Versões:</span>
                  <span>{versions.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seletor de Versão */}
          {versions.length > 1 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Versões</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentVersionIndex(Math.max(0, currentVersionIndex - 1))}
                    disabled={currentVersionIndex === 0}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex-1 text-center">
                    <span className="font-medium">
                      Versão {currentVersion?.version_number || 1}
                    </span>
                    {currentVersion?.is_published && (
                      <Badge className="ml-2 bg-green-100 text-green-800">
                        Publicada
                      </Badge>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentVersionIndex(Math.min(versions.length - 1, currentVersionIndex + 1))}
                    disabled={currentVersionIndex === versions.length - 1}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Perguntas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Perguntas ({questions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {questions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma pergunta cadastrada nesta versão</p>
                    </div>
                  ) : (
                    questions.map((question, index) => (
                      <div key={question.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-muted-foreground">
                              {index + 1}.
                            </span>
                            <span className="font-medium">{question.label}</span>
                            {question.required && (
                              <Badge variant="destructive" className="text-xs">
                                Obrigatória
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getQuestionTypeIcon(question.type)}
                            <span className="text-sm text-muted-foreground">
                              {getQuestionTypeLabel(question.type)}
                            </span>
                          </div>
                        </div>

                        {question.help_text && (
                          <p className="text-sm text-muted-foreground">
                            {question.help_text}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2">
                          <Badge className={getPriorityColor(question.priority)}>
                            Prioridade: {question.priority === 'high' ? 'Alta' : question.priority === 'medium' ? 'Média' : 'Baixa'}
                          </Badge>
                          
                          {question.decision_enabled && (
                            <Badge className="bg-purple-100 text-purple-800">
                              <Tag className="h-3 w-3 mr-1" />
                              {question.decision_tag}
                            </Badge>
                          )}
                        </div>

                        {question.options && question.options.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                              Opções:
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                              {question.options.map((option, optIndex) => (
                                <li key={optIndex} className="text-sm text-muted-foreground">
                                  {option}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
