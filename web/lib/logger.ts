const isDev = process.env.NODE_ENV === 'development'
const isDebug = process.env.DEBUG_LOGS === '1'

export const logger = {
  debug: (...args: any[]) => {
    if (isDev || isDebug) console.log(...args)
  },
  info: (...args: any[]) => {
    console.log(...args)
  },
  warn: (...args: any[]) => {
    console.warn(...args)
  },
  error: (...args: any[]) => {
    console.error(...args)
  }
}
