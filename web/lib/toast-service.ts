"use client"

import { toast } from "sonner"

export type ToastType = "success" | "error" | "warning" | "degraded" | "info"

export interface ToastConfig {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  contextId?: string
  duration?: number
}

class ToastService {
  private defaultDuration = 4000

  private getIcon(type: ToastType): string {
    const icons = {
      success: "✅",
      error: "❌", 
      warning: "⚠️",
      degraded: "⚠️",
      info: "ℹ️"
    }
    return icons[type]
  }

  private getVariant(type: ToastType): "default" | "destructive" {
    return type === "error" ? "destructive" : "default"
  }

  private formatMessage(config: ToastConfig): string {
    const icon = this.getIcon(config.contextId?.includes("audit") ? "degraded" : "success")
    return `${icon} ${config.title}${config.description ? `\n${config.description}` : ""}`
  }

  success(config: ToastConfig) {
    toast.success(config.title, {
      description: config.description,
      duration: config.duration || this.defaultDuration,
      action: config.action ? {
        label: config.action.label,
        onClick: config.action.onClick
      } : undefined,
    })
  }

  error(config: ToastConfig) {
    toast.error(config.title, {
      description: config.description,
      duration: config.duration || this.defaultDuration,
      action: config.action ? {
        label: config.action.label,
        onClick: config.action.onClick
      } : undefined,
    })
  }

  warning(config: ToastConfig) {
    toast.warning(config.title, {
      description: config.description,
      duration: config.duration || this.defaultDuration,
      action: config.action ? {
        label: config.action.label,
        onClick: config.action.onClick
      } : undefined,
    })
  }

  degraded(config: ToastConfig) {
    toast.warning(config.title, {
      description: config.description,
      duration: config.duration || 6000, // Mais tempo para degraded
      action: config.action ? {
        label: config.action.label,
        onClick: config.action.onClick
      } : undefined,
    })
  }

  info(config: ToastConfig) {
    toast.info(config.title, {
      description: config.description,
      duration: config.duration || this.defaultDuration,
      action: config.action ? {
        label: config.action.label,
        onClick: config.action.onClick
      } : undefined,
    })
  }

  // Métodos de conveniência para casos comuns
  saved(contextId?: string) {
    this.success({
      title: "Salvo com sucesso",
      contextId
    })
  }

  deleted(contextId?: string) {
    this.success({
      title: "Excluído com sucesso", 
      contextId
    })
  }

  errorGeneric(message: string, contextId?: string) {
    this.error({
      title: "Erro",
      description: message,
      contextId
    })
  }

  auditDegraded(auditId: string, contextId?: string) {
    this.degraded({
      title: "Operação concluída",
      description: `Atenção: auditoria em modo degradado (ID: ${auditId})`,
      contextId: contextId || "audit"
    })
  }
}

export const toastService = new ToastService()
