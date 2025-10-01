"use client"

import { useState } from "react"
import { toast } from "sonner"

export type VersionActionsState = {
  isPublishing: string | null
  isSettingDefault: string | null
  isDeleting: string | null
  isRenaming: string | null
}

export type VersionActionsReturn = {
  state: VersionActionsState
  handlePublish: (id: string, publishFn: () => Promise<void>) => Promise<void>
  handleSetDefault: (id: string, setDefaultFn: () => Promise<void>) => Promise<void>
  handleDelete: (id: string, deleteFn: () => Promise<void>) => Promise<void>
  handleRename: (id: string, renameFn: (newTitle: string) => Promise<void>) => Promise<void>
}

export function useVersionActions(): VersionActionsReturn {
  const [state, setState] = useState<VersionActionsState>({
    isPublishing: null,
    isSettingDefault: null,
    isDeleting: null,
    isRenaming: null
  })

  const handlePublish = async (id: string, publishFn: () => Promise<void>) => {
    try {
      setState(prev => ({ ...prev, isPublishing: id }))
      await publishFn()
      toast.success("Versão publicada com sucesso")
    } catch (error) {
      console.error("Erro ao publicar versão:", error)
      toast.error("Erro ao publicar versão")
      throw error
    } finally {
      setState(prev => ({ ...prev, isPublishing: null }))
    }
  }

  const handleSetDefault = async (id: string, setDefaultFn: () => Promise<void>) => {
    try {
      setState(prev => ({ ...prev, isSettingDefault: id }))
      await setDefaultFn()
      toast.success("Versão definida como padrão")
    } catch (error) {
      console.error("Erro ao definir como padrão:", error)
      toast.error("Erro ao definir como padrão")
      throw error
    } finally {
      setState(prev => ({ ...prev, isSettingDefault: null }))
    }
  }

  const handleDelete = async (id: string, deleteFn: () => Promise<void>) => {
    try {
      setState(prev => ({ ...prev, isDeleting: id }))
      await deleteFn()
      toast.success("Versão excluída com sucesso")
    } catch (error) {
      console.error("Erro ao excluir versão:", error)
      toast.error("Erro ao excluir versão")
      throw error
    } finally {
      setState(prev => ({ ...prev, isDeleting: null }))
    }
  }

  const handleRename = async (id: string, renameFn: (newTitle: string) => Promise<void>) => {
    try {
      setState(prev => ({ ...prev, isRenaming: id }))
      // renameFn será chamado externamente com o newTitle
    } catch (error) {
      console.error("Erro ao renomear versão:", error)
      toast.error("Erro ao renomear versão")
      throw error
    } finally {
      setState(prev => ({ ...prev, isRenaming: null }))
    }
  }

  return {
    state,
    handlePublish,
    handleSetDefault,
    handleDelete,
    handleRename
  }
}
