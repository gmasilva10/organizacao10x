import { NextRequest, NextResponse } from 'next/server'
import { gzip, brotliCompress } from 'zlib'
import { promisify } from 'util'

const gzipAsync = promisify(gzip)
const brotliAsync = promisify(brotliCompress)

export interface CompressionOptions {
  threshold?: number // Tamanho mínimo para compressão (bytes)
  gzip?: boolean
  brotli?: boolean
  level?: number // Nível de compressão (1-9)
}

export interface CompressionStats {
  originalSize: number
  compressedSize: number
  compressionRatio: number
  algorithm: 'gzip' | 'brotli' | 'none'
  timeMs: number
}

// Configurações padrão
const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  threshold: 1024, // 1KB mínimo
  gzip: true,
  brotli: true,
  level: 6
}

// Função para detectar suporte a compressão do cliente
function getSupportedCompression(acceptEncoding: string | null): string[] {
  if (!acceptEncoding) return []
  
  const supported: string[] = []
  const encoding = acceptEncoding.toLowerCase()
  
  if (encoding.includes('br')) {
    supported.push('br')
  }
  if (encoding.includes('gzip')) {
    supported.push('gzip')
  }
  
  return supported
}

// Função para escolher o melhor algoritmo de compressão
function chooseCompressionAlgorithm(supported: string[], options: Required<CompressionOptions>): 'gzip' | 'brotli' | 'none' {
  if (supported.includes('br') && options.brotli) {
    return 'brotli'
  }
  if (supported.includes('gzip') && options.gzip) {
    return 'gzip'
  }
  return 'none'
}

// Middleware de compressão
export function withCompression(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: CompressionOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Executar handler original
      const response = await handler(request)
      
      // Verificar se deve comprimir
      const opts = { ...DEFAULT_OPTIONS, ...options }
      const contentType = response.headers.get('content-type') || ''
      
      // Só comprimir JSON e texto
      if (!contentType.includes('application/json') && 
          !contentType.includes('text/') &&
          !contentType.includes('application/javascript')) {
        return response
      }
      
      // Obter corpo da resposta
      const responseText = await response.text()
      const originalSize = Buffer.byteLength(responseText, 'utf8')
      
      // Verificar threshold
      if (originalSize < opts.threshold) {
        return new NextResponse(responseText, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        })
      }
      
      // Verificar suporte do cliente
      const acceptEncoding = request.headers.get('accept-encoding')
      const supported = getSupportedCompression(acceptEncoding)
      const algorithm = chooseCompressionAlgorithm(supported, opts)
      
      if (algorithm === 'none') {
        return new NextResponse(responseText, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        })
      }
      
      // Comprimir
      const startTime = Date.now()
      let compressedBuffer: Buffer
      
      if (algorithm === 'brotli') {
        compressedBuffer = await brotliAsync(Buffer.from(responseText, 'utf8'), {
          params: {
            [require('zlib').constants.BROTLI_PARAM_QUALITY]: opts.level
          }
        })
      } else {
        compressedBuffer = await gzipAsync(Buffer.from(responseText, 'utf8'), {
          level: opts.level
        })
      }
      
      const compressionTime = Date.now() - startTime
      const compressedSize = compressedBuffer.length
      const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100
      
      // Log de estatísticas (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        console.log(`📦 [COMPRESSION] ${algorithm.toUpperCase()} - Original: ${originalSize}B, Compressed: ${compressedSize}B (${compressionRatio.toFixed(1)}% reduction) - ${compressionTime}ms`)
      }
      
      // Criar nova resposta com compressão
      const compressedResponse = new NextResponse(compressedBuffer as any, {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers)
      })
      
      // Adicionar headers de compressão
      compressedResponse.headers.set('Content-Encoding', algorithm)
      compressedResponse.headers.set('Content-Length', compressedSize.toString())
      compressedResponse.headers.set('X-Compression-Algorithm', algorithm)
      compressedResponse.headers.set('X-Compression-Ratio', compressionRatio.toFixed(1))
      compressedResponse.headers.set('X-Compression-Time', compressionTime.toString())
      
      return compressedResponse
      
    } catch (error) {
      console.error('❌ Erro no middleware de compressão:', error)
      // Em caso de erro, retornar resposta original
      return handler(request)
    }
  }
}

// Função helper para aplicar compressão em rotas
export function compress(config: CompressionOptions = {}) {
  return withCompression
}

// Configurações predefinidas para diferentes tipos de rotas
export const CompressionConfigs = {
  // APIs com dados grandes
  API_LARGE: {
    threshold: 512, // 512B mínimo
    gzip: true,
    brotli: true,
    level: 7
  },
  
  // APIs com dados pequenos
  API_SMALL: {
    threshold: 2048, // 2KB mínimo
    gzip: true,
    brotli: false, // Brotli tem overhead maior para dados pequenos
    level: 5
  },
  
  // APIs de métricas e logs
  METRICS: {
    threshold: 1024, // 1KB mínimo
    gzip: true,
    brotli: true,
    level: 6
  },
  
  // APIs de upload/download
  FILES: {
    threshold: 4096, // 4KB mínimo
    gzip: true,
    brotli: true,
    level: 8
  }
} as const
