"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Edit, 
  Plus, 
  Trash2, 
  GripVertical,
  Save,
  X,
  AlertCircle
} from "lucide-react"
import { AnamnesisTemplateWithVersions } from "@/types/anamnesis"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface EditTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  template: AnamnesisTemplateWithVersions | null
  onSuccess: () => void
}

interface Question {
  id?: string
  label: string
  type: 'text' | 'single' | 'multi'
  required: boolean
  priority: 'low' | 'medium' | 'high'
  decision_enabled: boolean
  decision_tag: string
  options: string[]
  help_text: string
  order_index: number
}

export function EditTemplateModal({ isOpen, onClose, template, onSuccess }: EditTemplateModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (template) {
      setName(template.name)
      setDescription(template.description || '')
      
      // Carregar perguntas da versão mais recente
      const latestVersion = template.versions?.[0]
      if ((latestVersion as any)?.questions) {
        setQuestions(((latestVersion as any).questions).map((q: any, index: number) => ({
          id: q.id,
          label: q.label,
          type: q.type,
          required: q.required,
          priority: q.priority,
          decision_enabled: q.decision_enabled,
          decision_tag: q.decision_tag || '',
          options: q.options || [],
          help_text: q.help_text || '',
          order_index: index
        })))
      } else {
        setQuestions([])
      }
    }
  }, [template])

  const addQuestion = () => {
    const newQuestion: Question = {
      label: '',
      type: 'text',
      required: false,
      priority: 'medium',
      decision_enabled: false,
      decision_tag: '',
      options: [],
      help_text: '',
      order_index: questions.length
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
  }

  const removeQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index)
    setQuestions(updated.map((q, i) => ({ ...q, order_index: i })))
  }

  const addOption = (questionIndex: number) => {
    const updated = [...questions]
    updated[questionIndex].options.push('')
    setQuestions(updated)
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions]
    updated[questionIndex].options[optionIndex] = value
    setQuestions(updated)
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions]
    updated[questionIndex].options.splice(optionIndex, 1)
    setQuestions(updated)
  }

  const handleSave = async () => {
    if (!template) return

    setIsLoading(true)
    try {
      // Atualizar template
      const response = await fetch(`/api/anamnesis/templates/${template.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao atualizar template')
      }

      // Atualizar perguntas
      const questionsResponse = await fetch(`/api/anamnesis/templates/${template.id}/questions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questions: questions.map((q, index) => ({
            ...q,
            order_index: index
          }))
        })
      })

      if (!questionsResponse.ok) {
        const data = await questionsResponse.json()
        throw new Error(data.error || 'Erro ao atualizar perguntas')
      }

      toast.success('Template atualizado com sucesso!')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Erro ao salvar template:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar template')
    } finally {
      setIsLoading(false)
    }
  }

  if (!template) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-orange-100">
              <Edit className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle className="text-left">Editar Template</DialogTitle>
              <DialogDescription className="text-left">
                Modifique as informações e perguntas do template
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Template</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Digite o nome do template"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o propósito do template"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Perguntas */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Perguntas ({questions.length})</CardTitle>
                  <Button onClick={addQuestion} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Pergunta
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Pergunta {index + 1}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeQuestion(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Pergunta</Label>
                          <Input
                            value={question.label}
                            onChange={(e) => updateQuestion(index, 'label', e.target.value)}
                            placeholder="Digite a pergunta"
                          />
                        </div>
                        <div>
                          <Label>Tipo</Label>
                          <select
                            className="w-full p-2 border rounded-md"
                            value={question.type}
                            onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                          >
                            <option value="text">Texto Livre</option>
                            <option value="single">Escolha Única</option>
                            <option value="multi">Múltipla Escolha</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`required-${index}`}
                            checked={question.required}
                            onChange={(e) => updateQuestion(index, 'required', e.target.checked)}
                          />
                          <Label htmlFor={`required-${index}`}>Obrigatória</Label>
                        </div>
                        <div>
                          <Label>Prioridade</Label>
                          <select
                            className="w-full p-2 border rounded-md"
                            value={question.priority}
                            onChange={(e) => updateQuestion(index, 'priority', e.target.value)}
                          >
                            <option value="low">Baixa</option>
                            <option value="medium">Média</option>
                            <option value="high">Alta</option>
                          </select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`decision-${index}`}
                            checked={question.decision_enabled}
                            onChange={(e) => updateQuestion(index, 'decision_enabled', e.target.checked)}
                          />
                          <Label htmlFor={`decision-${index}`}>Usar em Decisão</Label>
                        </div>
                      </div>

                      {question.decision_enabled && (
                        <div>
                          <Label>Tag de Decisão</Label>
                          <Input
                            value={question.decision_tag}
                            onChange={(e) => updateQuestion(index, 'decision_tag', e.target.value)}
                            placeholder="Ex: hipertensao, diabetes, lesoes"
                          />
                        </div>
                      )}

                      <div>
                        <Label>Texto de Ajuda (opcional)</Label>
                        <Input
                          value={question.help_text}
                          onChange={(e) => updateQuestion(index, 'help_text', e.target.value)}
                          placeholder="Texto explicativo para o usuário"
                        />
                      </div>

                      {(question.type === 'single' || question.type === 'multi') && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Opções de Resposta</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addOption(index)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar Opção
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center gap-2">
                                <Input
                                  value={option}
                                  onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                  placeholder={`Opção ${optionIndex + 1}`}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeOption(index, optionIndex)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {questions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma pergunta cadastrada</p>
                      <p className="text-sm">Clique em "Adicionar Pergunta" para começar</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
