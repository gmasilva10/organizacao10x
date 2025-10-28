interface APIMetric {
  route: string
  method: string
  statusCode: number
  duration: number
  timestamp: number
  userId?: string
  orgId?: string
  error?: string
}

interface MetricsSummary {
  route: string
  totalRequests: number
  errorRate: number
  p95Latency: number
  avgLatency: number
  last24h: {
    requests: number
    errors: number
    avgLatency: number
  }
}

class APIMetricsCollector {
  private metrics: APIMetric[] = []
  private maxMetrics = 10000 // Keep last 10k metrics in memory

  recordMetric(metric: APIMetric) {
    this.metrics.push(metric)
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Log critical metrics
    if (metric.statusCode >= 500) {
      console.error(`🚨 [API ERROR] ${metric.method} ${metric.route} - ${metric.statusCode} - ${metric.duration}ms`, {
        userId: metric.userId,
        orgId: metric.orgId,
        error: metric.error,
        timestamp: new Date(metric.timestamp).toISOString()
      })
    } else if (metric.duration > 2000) {
      console.warn(`⚠️ [API SLOW] ${metric.method} ${metric.route} - ${metric.duration}ms`, {
        userId: metric.userId,
        orgId: metric.orgId,
        timestamp: new Date(metric.timestamp).toISOString()
      })
    } else {
      console.debug(`📊 [API METRIC] ${metric.method} ${metric.route} - ${metric.statusCode} - ${metric.duration}ms`)
    }
  }

  getMetricsSummary(route?: string): MetricsSummary[] {
    const now = Date.now()
    const last24h = now - (24 * 60 * 60 * 1000)
    
    const filteredMetrics = route 
      ? this.metrics.filter(m => m.route === route)
      : this.metrics

    const routeGroups = new Map<string, APIMetric[]>()
    
    filteredMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.route}`
      if (!routeGroups.has(key)) {
        routeGroups.set(key, [])
      }
      routeGroups.get(key)!.push(metric)
    })

    return Array.from(routeGroups.entries()).map(([routeKey, metrics]) => {
      const [method, routePath] = routeKey.split(' ', 2)
      const totalRequests = metrics.length
      const errors = metrics.filter(m => m.statusCode >= 400).length
      const errorRate = totalRequests > 0 ? (errors / totalRequests) * 100 : 0
      
      const latencies = metrics.map(m => m.duration).sort((a, b) => a - b)
      const p95Index = Math.floor(latencies.length * 0.95)
      const p95Latency = latencies[p95Index] || 0
      const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0
      
      const last24hMetrics = metrics.filter(m => m.timestamp >= last24h)
      const last24hRequests = last24hMetrics.length
      const last24hErrors = last24hMetrics.filter(m => m.statusCode >= 400).length
      const last24hAvgLatency = last24hMetrics.length > 0 
        ? last24hMetrics.reduce((sum, m) => sum + m.duration, 0) / last24hMetrics.length 
        : 0

      return {
        route: routePath,
        totalRequests,
        errorRate,
        p95Latency,
        avgLatency,
        last24h: {
          requests: last24hRequests,
          errors: last24hErrors,
          avgLatency: last24hAvgLatency
        }
      }
    })
  }

  getRouteMetrics(route: string): MetricsSummary | null {
    const summaries = this.getMetricsSummary(route)
    return summaries.find(s => s.route === route) || null
  }

  clearMetrics() {
    this.metrics = []
  }
}

export const apiMetrics = new APIMetricsCollector()

export function createAPIMetric(
  route: string,
  method: string,
  statusCode: number,
  duration: number,
  userId?: string,
  orgId?: string,
  error?: string
): APIMetric {
  return {
    route,
    method,
    statusCode,
    duration,
    timestamp: Date.now(),
    userId,
    orgId,
    error
  }
}

export function recordAPIMetric(metric: APIMetric) {
  apiMetrics.recordMetric(metric)
}

// Utility function for API route middleware
export function withMetrics<T extends any[]>(
  route: string,
  method: string,
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    const startTime = Date.now()
    let statusCode = 500
    let error: string | undefined

    try {
      const response = await handler(...args)
      statusCode = response.status
      return response
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      const duration = Date.now() - startTime
      
      // Extract context from request if available
      let userId: string | undefined
      let orgId: string | undefined
      
      try {
        // Try to extract user context from request
        const request = args[0] as Request
        if (request) {
          // This would need to be implemented based on your auth system
          // userId = await getUserIdFromRequest(request)
          // orgId = await getOrgIdFromRequest(request)
        }
      } catch (e) {
        // Ignore context extraction errors
      }

      recordAPIMetric(createAPIMetric(
        route,
        method,
        statusCode,
        duration,
        userId,
        orgId,
        error
      ))
    }
  }
}
