'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Move, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'

interface ImageCropModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageFile: File | null
  onCropComplete: (croppedFile: File) => void
  targetSize?: number
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export function ImageCropModal({ 
  open, 
  onOpenChange, 
  imageFile, 
  onCropComplete, 
  targetSize = 600 
}: ImageCropModalProps) {
  console.log('🔍 ImageCropModal renderizado com props:', {
    open,
    imageFile: imageFile?.name || 'null',
    targetSize
  })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 0,
    y: 0,
    width: targetSize,
    height: targetSize
  })

  // Desenhar imagem no canvas
  const drawImage = useCallback(() => {
    const canvas = canvasRef.current
    const img = imageRef.current
    
    if (!canvas || !img || !imageLoaded) {
      return
    }
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Configurar transformações
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(scale, scale)
    
    // Calcular posição centralizada
    const scaledWidth = img.naturalWidth
    const scaledHeight = img.naturalHeight
    const x = position.x / scale - scaledWidth / 2
    const y = position.y / scale - scaledHeight / 2
    
    // Desenhar imagem
    ctx.drawImage(img, x, y)
    ctx.restore()
    
    // Desenhar overlay de crop
    drawCropOverlay(ctx)
  }, [imageLoaded, scale, rotation, position])

  // Carregar imagem quando o modal abrir
  const handleImageLoad = useCallback(() => {
    if (imageLoaded) return // Evitar múltiplas chamadas
    
    if (imageRef.current && canvasRef.current) {
      const img = imageRef.current
      const canvas = canvasRef.current
      
      // Configurar canvas
      canvas.width = 600
      canvas.height = 600
      
      // Calcular escala inicial para fit
      const scaleX = canvas.width / img.naturalWidth
      const scaleY = canvas.height / img.naturalHeight
      const initialScale = Math.min(scaleX, scaleY)
      
      setScale(initialScale)
      setImageLoaded(true)
      
      // Centralizar imagem
      const scaledWidth = img.naturalWidth * initialScale
      const scaledHeight = img.naturalHeight * initialScale
      setPosition({
        x: (canvas.width - scaledWidth) / 2,
        y: (canvas.height - scaledHeight) / 2
      })
    }
  }, [imageLoaded])

  // Desenhar overlay de crop
  const drawCropOverlay = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Área de crop (quadrado central)
    const cropSize = targetSize
    const cropX = (canvas.width - cropSize) / 2
    const cropY = (canvas.height - cropSize) / 2
    
    // Overlay escuro
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Área clara (crop)
    ctx.clearRect(cropX, cropY, cropSize, cropSize)
    
    // Borda do crop
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.strokeRect(cropX, cropY, cropSize, cropSize)
    
    // Cantos do crop
    const cornerSize = 20
    ctx.fillStyle = '#3b82f6'
    
    // Cantos superiores
    ctx.fillRect(cropX - 2, cropY - 2, cornerSize, 4)
    ctx.fillRect(cropX - 2, cropY - 2, 4, cornerSize)
    ctx.fillRect(cropX + cropSize - cornerSize + 2, cropY - 2, cornerSize, 4)
    ctx.fillRect(cropX + cropSize - 2, cropY - 2, 4, cornerSize)
    
    // Cantos inferiores
    ctx.fillRect(cropX - 2, cropY + cropSize - 2, cornerSize, 4)
    ctx.fillRect(cropX - 2, cropY + cropSize - cornerSize + 2, 4, cornerSize)
    ctx.fillRect(cropX + cropSize - cornerSize + 2, cropY + cropSize - 2, cornerSize, 4)
    ctx.fillRect(cropX + cropSize - 2, cropY + cropSize - cornerSize + 2, 4, cornerSize)
  }

  // Estado para armazenar o blob URL
  const [imageSrc, setImageSrc] = React.useState<string>('')

  // Criar e limpar blob URL quando o arquivo mudar
  React.useEffect(() => {
    if (imageFile) {
      console.log('🖼️ Criando blob URL para:', imageFile.name)
      const url = URL.createObjectURL(imageFile)
      console.log('🔗 Blob URL criado:', url)
      setImageSrc(url)
      
      // Cleanup: revogar URL quando o componente desmontar ou o arquivo mudar
      return () => {
        console.log('🗑️ Revogando blob URL')
        URL.revokeObjectURL(url)
      }
    }
  }, [imageFile])

  // Resetar estado quando o modal abrir com novo arquivo
  React.useEffect(() => {
    if (open && imageFile) {
      console.log('🔄 Modal aberto com novo arquivo, resetando estado')
      setImageLoaded(false)
      setScale(1)
      setRotation(0)
      setPosition({ x: 0, y: 0 })
    }
  }, [open, imageFile])

  // Atualizar desenho quando parâmetros mudarem
  React.useEffect(() => {
    if (imageLoaded && canvasRef.current && imageRef.current) {
      drawImage()
    }
  }, [scale, rotation, position, imageLoaded, drawImage])

  // Manipulação de mouse para arrastar imagem
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return
    
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y
    
    setPosition({ x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Aplicar crop
  const handleCrop = () => {
    const canvas = canvasRef.current
    const img = imageRef.current
    
    if (!canvas || !img) return
    
    // Criar novo canvas para a imagem cortada
    const cropCanvas = document.createElement('canvas')
    const cropCtx = cropCanvas.getContext('2d')
    
    if (!cropCtx) return
    
    cropCanvas.width = targetSize
    cropCanvas.height = targetSize
    
    // Aplicar transformações e cortar
    cropCtx.save()
    cropCtx.translate(targetSize / 2, targetSize / 2)
    cropCtx.rotate((rotation * Math.PI) / 180)
    cropCtx.scale(scale, scale)
    
    const x = position.x / scale - img.naturalWidth / 2
    const y = position.y / scale - img.naturalHeight / 2
    
    cropCtx.drawImage(img, x, y)
    cropCtx.restore()
    
    // Converter para File
    cropCanvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], imageFile?.name || 'cropped-image.jpg', {
          type: 'image/jpeg',
          lastModified: Date.now()
        })
        onCropComplete(croppedFile)
        onOpenChange(false)
      }
    }, 'image/jpeg', 0.9)
  }

  // Resetar transformações
  const handleReset = () => {
    setScale(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
    
    // Recalcular escala inicial
    if (imageRef.current && canvasRef.current) {
      const img = imageRef.current
      const canvas = canvasRef.current
      const scaleX = canvas.width / img.naturalWidth
      const scaleY = canvas.height / img.naturalHeight
      const initialScale = Math.min(scaleX, scaleY)
      setScale(initialScale)
      
      const scaledWidth = img.naturalWidth * initialScale
      const scaledHeight = img.naturalHeight * initialScale
      setPosition({
        x: (canvas.width - scaledWidth) / 2,
        y: (canvas.height - scaledHeight) / 2
      })
    }
  }

  // Não renderizar se não há arquivo
  if (!imageFile) {
    console.log('❌ Modal não renderizado: imageFile é null')
    return null
  }

  console.log('✅ Modal renderizado:', { open, imageFile: imageFile.name, imageSrc })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Move className="h-5 w-5" />
            Ajustar Imagem
          </DialogTitle>
          <DialogDescription>
            Redimensione, rotacione e ajuste a imagem antes de salvar.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Canvas para preview */}
          <div className="flex justify-center">
            <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                width={600}
                height={600}
                className="cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
              
              {/* Imagem oculta para carregar */}
              <img
                ref={imageRef}
                src={imageSrc}
                onLoad={handleImageLoad}
                onError={() => console.log('❌ Erro ao carregar imagem')}
                style={{ display: 'none' }}
                alt="Preview"
              />
            </div>
          </div>
          
          {/* Controles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Zoom */}
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <ZoomIn className="h-4 w-4" />
                Zoom
              </label>
              <Slider
                value={[scale]}
                onValueChange={([value]: number[]) => setScale(value)}
                min={0.1}
                max={3}
                step={0.1}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground text-center">
                {Math.round(scale * 100)}%
              </div>
            </div>
            
            {/* Rotação */}
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Rotação
              </label>
              <Slider
                value={[rotation]}
                onValueChange={([value]: number[]) => setRotation(value)}
                min={-180}
                max={180}
                step={5}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground text-center">
                {rotation}°
              </div>
            </div>
            
            {/* Ações */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Ações</label>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Resetar
                </Button>
              </div>
            </div>
          </div>
          
          {/* Instruções */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Como usar:
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• <strong>Arrastar:</strong> Clique e arraste para mover a imagem</li>
              <li>• <strong>Zoom:</strong> Use o controle de zoom para aproximar/afastar</li>
              <li>• <strong>Rotar:</strong> Gire a imagem conforme necessário</li>
              <li>• <strong>Área azul:</strong> Mostra como a imagem ficará (600x600px)</li>
            </ul>
          </div>
          
          {/* Botões de ação */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCrop}
              disabled={!imageLoaded}
            >
              Aplicar Ajustes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
