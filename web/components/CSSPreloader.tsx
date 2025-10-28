'use client'

import { useEffect } from 'react'

export default function CSSPreloader() {
  useEffect(() => {
    // Função para carregar CSS de forma assíncrona
    const loadCSS = (href: string) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      link.media = 'print'
      link.onload = function() {
        this.media = 'all'
      }
      document.head.appendChild(link)
    }

    // Carregar CSS não crítico após o carregamento da página
    const timer = setTimeout(() => {
      loadCSS('/_next/static/css/app/layout.css')
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return null
}
