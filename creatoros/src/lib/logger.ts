// Structured logger — outputs JSON in production, readable in dev

const isDev = process.env.NODE_ENV === 'development'

function fmt(level: string, msg: string, data?: Record<string, unknown>) {
  if (isDev) {
    const extra = data ? ' ' + JSON.stringify(data) : ''
    console[level === 'ERROR' ? 'error' : 'log'](`[${level}] ${msg}${extra}`)
  } else {
    console[level === 'ERROR' ? 'error' : 'log'](
      JSON.stringify({ level, msg, ts: new Date().toISOString(), ...data })
    )
  }
}

export const logger = {
  info:  (msg: string, data?: Record<string, unknown>) => fmt('INFO',  msg, data),
  warn:  (msg: string, data?: Record<string, unknown>) => fmt('WARN',  msg, data),
  error: (msg: string, err?: unknown, data?: Record<string, unknown>) => {
    const errData = err instanceof Error
      ? { error: err.message, stack: isDev ? err.stack : undefined }
      : { error: String(err) }
    fmt('ERROR', msg, { ...errData, ...data })
  },
}
