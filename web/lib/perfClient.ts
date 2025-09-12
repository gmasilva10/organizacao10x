"use client"

// Performance Client - GATE 10.4.3
// Instrumentação de performance marks e coleta de web-vitals

interface PerformanceMark {
  name: string
  startTime: number
  duration?: number
}

interface WebVitals {
  name: string
  value: number
  delta: number
  id: string
  navigationType: string
}

interface PerformanceMetrics {
  marks: PerformanceMark[]
  webVitals: WebVitals[]
  navigationStart: number
  loadComplete: number
}

class PerformanceClient {
  private marks: PerformanceMark[] = []
  private webVitals: WebVitals[] = []
  private navigationStart: number = 0
  private loadComplete: number = 0

  constructor() {
    this.navigationStart = performance.now()
    this.initializeWebVitals()
  }

  // Performance Marks
  mark(name: string): void {
    const startTime = performance.now() - this.navigationStart
    this.marks.push({ name, startTime })
    performance.mark(name)
    console.log(`[PERF] Mark: ${name} at ${startTime.toFixed(2)}ms`)
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const startTime = performance.now() - this.navigationStart
    const endTime = endMark ? performance.now() - this.navigationStart : startTime
    const duration = endTime - startTime
    
    this.marks.push({ name, startTime, duration })
    performance.measure(name, startMark, endMark)
    
    console.log(`[PERF] Measure: ${name} = ${duration.toFixed(2)}ms`)
    return duration
  }

  // Web Vitals Collection
  private initializeWebVitals(): void {
    // TTFB (Time to First Byte)
    this.measureTTFB()
    
    // FCP (First Contentful Paint)
    this.measureFCP()
    
    // LCP (Largest Contentful Paint)
    this.measureLCP()
    
    // CLS (Cumulative Layout Shift)
    this.measureCLS()
  }

  private measureTTFB(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      const ttfb = navigation.responseStart - navigation.requestStart
      this.webVitals.push({
        name: 'TTFB',
        value: ttfb,
        delta: ttfb,
        id: 'ttfb',
        navigationType: navigation.type
      })
      console.log(`[PERF] TTFB: ${ttfb.toFixed(2)}ms`)
    }
  }

  private measureFCP(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const fcp = entries[0].startTime
      this.webVitals.push({
        name: 'FCP',
        value: fcp,
        delta: fcp,
        id: 'fcp',
        navigationType: 'navigate'
      })
      console.log(`[PERF] FCP: ${fcp.toFixed(2)}ms`)
      observer.disconnect()
    })
    observer.observe({ entryTypes: ['paint'] })
  }

  private measureLCP(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      const lcp = lastEntry.startTime
      this.webVitals.push({
        name: 'LCP',
        value: lcp,
        delta: lcp,
        id: 'lcp',
        navigationType: 'navigate'
      })
      console.log(`[PERF] LCP: ${lcp.toFixed(2)}ms`)
      observer.disconnect()
    })
    observer.observe({ entryTypes: ['largest-contentful-paint'] })
  }

  private measureCLS(): void {
    let clsValue = 0
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value
        }
      }
      this.webVitals.push({
        name: 'CLS',
        value: clsValue,
        delta: clsValue,
        id: 'cls',
        navigationType: 'navigate'
      })
      console.log(`[PERF] CLS: ${clsValue.toFixed(4)}`)
    })
    observer.observe({ entryTypes: ['layout-shift'] })
  }

  // Route-specific marks
  markAlunosListTTFB(): void {
    this.mark('alunos:list:ttfb')
  }

  markAlunosListDataReady(): void {
    this.mark('alunos:list:dataReady')
  }

  markAlunosEditInteractive(): void {
    this.mark('alunos:edit:interactive')
  }

  markOccurrencesTabDataReady(): void {
    this.mark('occurrences:tab:dataReady')
  }

  // P95 Calculation
  calculateP95(values: number[]): number {
    const sorted = values.sort((a, b) => a - b)
    const index = Math.ceil(sorted.length * 0.95) - 1
    return sorted[index] || 0
  }

  // Get all metrics
  getMetrics(): PerformanceMetrics {
    this.loadComplete = performance.now() - this.navigationStart
    return {
      marks: this.marks,
      webVitals: this.webVitals,
      navigationStart: this.navigationStart,
      loadComplete: this.loadComplete
    }
  }

  // Export metrics to console and local storage
  exportMetrics(): void {
    const metrics = this.getMetrics()
    
    // Console output
    console.group('[PERF] Performance Metrics')
    console.log('Marks:', metrics.marks)
    console.log('Web Vitals:', metrics.webVitals)
    console.log('Load Complete:', metrics.loadComplete.toFixed(2) + 'ms')
    console.groupEnd()

    // Local storage backup
    const timestamp = new Date().toISOString()
    const stored = JSON.parse(localStorage.getItem('perf_metrics') || '[]')
    stored.push({ timestamp, ...metrics })
    localStorage.setItem('perf_metrics', JSON.stringify(stored))

    // P95 calculations
    const dataReadyTimes = metrics.marks
      .filter(m => m.name.includes('dataReady'))
      .map(m => m.duration || 0)
    
    if (dataReadyTimes.length > 0) {
      const p95 = this.calculateP95(dataReadyTimes)
      console.log(`[PERF] P95 (dataReady): ${p95.toFixed(2)}ms`)
    }
  }
}

// Singleton instance
let perfClient: PerformanceClient | null = null

export function getPerformanceClient(): PerformanceClient {
  if (!perfClient) {
    perfClient = new PerformanceClient()
  }
  return perfClient
}

// Export for easy access
export const perf = getPerformanceClient()

// Auto-export on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    perf.exportMetrics()
  })
}
