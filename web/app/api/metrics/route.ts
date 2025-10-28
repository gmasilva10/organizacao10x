import { NextResponse } from 'next/server'
import { apiMetrics } from '@/lib/metrics/api-metrics'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const route = searchParams.get('route')
    const format = searchParams.get('format') || 'json'

    let metrics
    
    if (route) {
      metrics = apiMetrics.getRouteMetrics(route)
    } else {
      metrics = apiMetrics.getMetricsSummary()
    }

    if (format === 'prometheus') {
      // Export in Prometheus format for monitoring systems
      const prometheusMetrics = metrics 
        ? (Array.isArray(metrics) ? metrics : [metrics]).map(metric => 
            `# HELP api_requests_total Total number of API requests
# TYPE api_requests_total counter
api_requests_total{route="${metric.route}"} ${metric.totalRequests}

# HELP api_error_rate Error rate percentage
# TYPE api_error_rate gauge
api_error_rate{route="${metric.route}"} ${metric.errorRate}

# HELP api_latency_p95 95th percentile latency in milliseconds
# TYPE api_latency_p95 gauge
api_latency_p95{route="${metric.route}"} ${metric.p95Latency}

# HELP api_latency_avg Average latency in milliseconds
# TYPE api_latency_avg gauge
api_latency_avg{route="${metric.route}"} ${metric.avgLatency}

# HELP api_requests_24h Total requests in last 24 hours
# TYPE api_requests_24h counter
api_requests_24h{route="${metric.route}"} ${metric.last24h.requests}

# HELP api_errors_24h Total errors in last 24 hours
# TYPE api_errors_24h counter
api_errors_24h{route="${metric.route}"} ${metric.last24h.errors}

# HELP api_latency_avg_24h Average latency in last 24 hours
# TYPE api_latency_avg_24h gauge
api_latency_avg_24h{route="${metric.route}"} ${metric.last24h.avgLatency}
`
          ).join('\n')
        : ''

      return new NextResponse(prometheusMetrics, {
        headers: {
          'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
      route: route || 'all'
    })

  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    apiMetrics.clearMetrics()
    
    return NextResponse.json({
      success: true,
      message: 'Metrics cleared successfully'
    })
  } catch (error) {
    console.error('Error clearing metrics:', error)
    return NextResponse.json(
      { error: 'Failed to clear metrics' },
      { status: 500 }
    )
  }
}
