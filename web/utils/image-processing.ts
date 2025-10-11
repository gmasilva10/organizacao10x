import imageCompression from 'browser-image-compression'

export async function processImageForUpload(file: File, forceSquareResize: boolean = false) {
  const options = {
    maxSizeMB: 2, // (max 2MB)
    maxWidthOrHeight: 600, // (max 600px) - mantém proporção
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.85, // 85% quality
  }

  const compressedFile = await imageCompression(file, options)

  let finalFile = compressedFile
  
  // Apenas forçar redimensionamento quadrado se solicitado
  if (forceSquareResize) {
    finalFile = await resizeToSquare(compressedFile, 600)
  }
  
  const previewUrl = URL.createObjectURL(finalFile)

  // Obter dimensões reais da imagem processada
  const dimensions = await getImageDimensions(finalFile)

  return {
    file: finalFile,
    previewUrl,
    originalSize: file.size,
    processedSize: finalFile.size,
    dimensions
  }
}

// Função para redimensionar imagem para quadrado exato
function resizeToSquare(file: File, size: number): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    
    img.onload = () => {
      // Configurar canvas para 600x600px
      canvas.width = size
      canvas.height = size
      
      // Desenhar imagem centralizada no canvas (cortando se necessário)
      const scale = Math.max(size / img.width, size / img.height)
      const scaledWidth = img.width * scale
      const scaledHeight = img.height * scale
      
      const x = (size - scaledWidth) / 2
      const y = (size - scaledHeight) / 2
      
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight)
      
      // Converter canvas para blob
      canvas.toBlob((blob) => {
        if (blob) {
          const newFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          })
          resolve(newFile)
        } else {
          resolve(file) // Fallback
        }
      }, 'image/jpeg', 0.85)
    }
    
    img.onerror = () => resolve(file) // Fallback
    img.src = URL.createObjectURL(file)
  })
}

// Função auxiliar para obter dimensões reais da imagem
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      // Fallback se não conseguir carregar a imagem
      resolve({ width: 0, height: 0 })
    }
    img.src = URL.createObjectURL(file)
  })
}

export function validateImageRequirements(file: File) {
  const errors: string[] = []
  const isValid = true

  if (!file.type.startsWith('image/')) {
    errors.push('Apenas arquivos de imagem são permitidos.')
  }
  if (file.size > 2 * 1024 * 1024) { // 2MB
    errors.push('O arquivo deve ter no máximo 2MB.')
  }
  // Client-side validation for dimensions is tricky without loading the image,
  // but we can assume the processing will handle it.
  // For now, we rely on the compression library to handle max dimensions.

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}