// GATE S1: Tipos para módulo de Anamnese

export interface AnamnesisTemplate {
  id: string
  organization_id: string
  name: string
  description?: string
  is_default: boolean
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface AnamnesisTemplateVersion {
  id: string
  template_id: string
  version_number: number
  is_published: boolean
  published_at?: string
  published_by?: string
  created_at: string
}

export interface AnamnesisQuestion {
  id: string
  template_version_id: string
  question_id: string // slug estável
  label: string
  type: 'text' | 'single' | 'multi'
  required: boolean
  priority: 'low' | 'medium' | 'high'
  decision_enabled: boolean
  decision_tag?: string // ex: hipertensao, condromalacia, dac
  options?: string[] // para single/multi
  help_text?: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface PlanAnamnesisTemplate {
  id: string
  service_id: string
  template_version_id: string
  created_at: string
  created_by: string
}

export interface OrganizationDefaultTemplate {
  id: string
  organization_id: string
  template_version_id: string
  created_at: string
  created_by: string
}

// DTOs para API
export interface CreateAnamnesisTemplateRequest {
  name: string
  description?: string
  is_default?: boolean
}

export interface UpdateAnamnesisTemplateRequest {
  name?: string
  description?: string
  is_default?: boolean
  is_active?: boolean
}

export interface CreateAnamnesisQuestionRequest {
  question_id: string
  label: string
  type: 'text' | 'single' | 'multi'
  required?: boolean
  priority?: 'low' | 'medium' | 'high'
  decision_enabled?: boolean
  decision_tag?: string
  options?: string[]
  help_text?: string
  order_index?: number
}

export interface UpdateAnamnesisQuestionRequest {
  label?: string
  type?: 'text' | 'single' | 'multi'
  required?: boolean
  priority?: 'low' | 'medium' | 'high'
  decision_enabled?: boolean
  decision_tag?: string
  options?: string[]
  help_text?: string
  order_index?: number
}

export interface PublishTemplateRequest {
  template_id: string
}

export interface AssociateTemplateToPlanRequest {
  service_id: string
  template_version_id: string
}

export interface SetOrganizationDefaultRequest {
  template_version_id: string
}

// Respostas da API
export interface AnamnesisTemplateWithVersions extends AnamnesisTemplate {
  versions: AnamnesisTemplateVersion[]
  latest_version?: AnamnesisTemplateVersion
  published_version?: AnamnesisTemplateVersion
}

export interface TemplateVersionWithQuestions extends AnamnesisTemplateVersion {
  questions: AnamnesisQuestion[]
  template: AnamnesisTemplate
}

// Status da Anamnese (conforme especificação)
export type AnamnesisStatus = 
  | 'gerada'      // instância criada (vazia/rascunho)
  | 'enviada'     // link de intake emitido (expira em 7 dias)
  | 'respondida'  // aluno enviou (ou profissional "preencheu como aluno")
  | 'executada'   // Diretrizes preenchidas pelo personal (após ver as respostas)
  | 'validada'    // aprovada por Proprietário/Treinador Principal
  | 'atualizada'  // houve edição após validação → requer nova validação
  | 'cancelada'   // descartada

// ===== DIRETRIZES DE TREINO =====

export interface TrainingGuideline {
  id: string
  organization_id: string
  name: string
  description?: string
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface TrainingGuidelineVersion {
  id: string
  guideline_id: string
  version_number: number
  is_published: boolean
  published_at?: string
  published_by?: string
  created_at: string
}

export interface TrainingGuidelineRule {
  id: string
  guideline_version_id: string
  rule_name: string
  decision_tag: string // ex: hipertensao, condromalacia, dac
  condition_type: 'single' | 'multiple' | 'custom'
  conditions: Record<string, any> // ex: {"hipertensao": "Sim", "idade": {"min": 50}}
  outputs: TrainingGuidelineOutputs
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TrainingGuidelineOutputs {
  resistencia_aerobia?: {
    duracao?: string
    intensidade?: string
    observacoes?: string
  }
  treino_pesos?: {
    volume?: string
    series?: string
    reps?: string
    frequencia?: string
    intensidade?: string
  }
  contraindicacoes?: string[]
  observacoes_gerais?: string
}

export interface PlanTrainingGuideline {
  id: string
  service_id: string
  guideline_version_id: string
  created_at: string
  created_by: string
}

export interface OrganizationDefaultGuideline {
  id: string
  organization_id: string
  guideline_version_id: string
  created_at: string
  created_by: string
}

// DTOs para API de Diretrizes
export interface CreateTrainingGuidelineRequest {
  name: string
  description?: string
}

export interface UpdateTrainingGuidelineRequest {
  name?: string
  description?: string
  is_active?: boolean
}

export interface CreateTrainingGuidelineRuleRequest {
  rule_name: string
  decision_tag: string
  condition_type: 'single' | 'multiple' | 'custom'
  conditions: Record<string, any>
  outputs: TrainingGuidelineOutputs
  priority?: number
}

export interface UpdateTrainingGuidelineRuleRequest {
  rule_name?: string
  condition_type?: 'single' | 'multiple' | 'custom'
  conditions?: Record<string, any>
  outputs?: TrainingGuidelineOutputs
  priority?: number
  is_active?: boolean
}

export interface PublishGuidelineRequest {
  guideline_id: string
}

export interface PreviewGuidelineRequest {
  guideline_version_id: string
  mock_responses: Record<string, any> // ex: {"hipertensao": "Sim", "condromalacia": "Não"}
}

// Respostas da API de Diretrizes
export interface TrainingGuidelineWithVersions extends TrainingGuideline {
  versions: TrainingGuidelineVersion[]
  latest_version?: TrainingGuidelineVersion
  published_version?: TrainingGuidelineVersion
}

export interface GuidelineVersionWithRules extends TrainingGuidelineVersion {
  rules: TrainingGuidelineRule[]
  guideline: TrainingGuideline
}

export interface GuidelinePreviewResponse {
  applicable_rules: TrainingGuidelineRule[]
  combined_outputs: TrainingGuidelineOutputs
  preview_generated_at: string
}
