// Monitor de queries lentas para auditoria e performance
export class QueryMonitor {
  private static readonly SLOW_QUERY_THRESHOLD = 1000 // 1 segundo em ms

  static async monitorQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    context?: {
      userId?: string
      tenantId?: string
      operation?: string
    }
  ): Promise<T> {
    const startTime = Date.now()
    
    try {
      const result = await queryFn()
      const duration = Date.now() - startTime
      
      // Log queries lentas
      if (duration > this.SLOW_QUERY_THRESHOLD) {
        console.warn(`🐌 SLOW QUERY DETECTED:`, {
          query: queryName,
          duration: `${duration}ms`,
          threshold: `${this.SLOW_QUERY_THRESHOLD}ms`,
          context: {
            userId: context?.userId,
            tenantId: context?.tenantId,
            operation: context?.operation
          },
          timestamp: new Date().toISOString()
        })
      }
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      
      console.error(`❌ QUERY ERROR:`, {
        query: queryName,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
        context: {
          userId: context?.userId,
          tenantId: context?.tenantId,
          operation: context?.operation
        },
        timestamp: new Date().toISOString()
      })
      
      throw error
    }
  }

  static logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    context?: {
      userId?: string
      tenantId?: string
      recordId?: string
    }
  ) {
    if (duration > this.SLOW_QUERY_THRESHOLD) {
      console.warn(`🐌 SLOW DB OPERATION:`, {
        operation,
        table,
        duration: `${duration}ms`,
        context,
        timestamp: new Date().toISOString()
      })
    }
  }
}

// Hook para monitorar queries em componentes React
export function useQueryMonitor() {
  const monitorQuery = async <T>(
    queryName: string,
    queryFn: () => Promise<T>,
    context?: {
      userId?: string
      tenantId?: string
      operation?: string
    }
  ): Promise<T> => {
    return QueryMonitor.monitorQuery(queryName, queryFn, context)
  }

  return { monitorQuery }
}
