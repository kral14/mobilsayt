const STORAGE_KEY = 'mobilsayt:apiBaseUrl'
const QUERY_PARAM_KEYS = ['apiBase', 'api', 'apiUrl']

type ApiSource =
  | 'env'
  | 'global'
  | 'query-param'
  | 'local-storage'
  | 'localhost'
  | 'render-guess'
  | 'same-origin'

interface ApiBaseResult {
  url: string
  source: ApiSource
}

const isBrowser = typeof window !== 'undefined'
let cachedResult: ApiBaseResult | null = null

export const getApiBaseMeta = (): ApiBaseResult => {
  if (cachedResult) {
    return cachedResult
  }

  cachedResult = determineApiBase()

  if (isBrowser) {
    exposeDebuggerHelpers(cachedResult)
    logFallbackWarning(cachedResult)
  }

  return cachedResult
}

export const getApiBaseUrl = (): string => getApiBaseMeta().url

const determineApiBase = (): ApiBaseResult => {
  const envUrl = import.meta?.env?.VITE_API_URL
  if (isNonEmpty(envUrl)) {
    return { url: normalizeUrl(envUrl!), source: 'env' }
  }

  if (!isBrowser) {
    return { url: 'http://localhost:5000/api', source: 'localhost' }
  }

  const runtimeOverride = (window as any).MOBILSAYT_API_URL
  if (isNonEmpty(runtimeOverride)) {
    return { url: normalizeUrl(runtimeOverride), source: 'global' }
  }

  const queryOverride = consumeQueryOverride()
  if (queryOverride) {
    return { url: queryOverride, source: 'query-param' }
  }

  const storedOverride = readStoredOverride()
  if (storedOverride) {
    return { url: storedOverride, source: 'local-storage' }
  }

  const hostname = window.location.hostname
  if (isLocalHostname(hostname)) {
    return { url: 'http://localhost:5000/api', source: 'localhost' }
  }

  const guessedRenderUrl = guessRenderBackendUrl()
  if (guessedRenderUrl) {
    return { url: guessedRenderUrl, source: 'render-guess' }
  }

  return { url: `${window.location.origin}/api`, source: 'same-origin' }
}

const consumeQueryOverride = (): string | null => {
  if (!isBrowser) return null

  try {
    const params = new URLSearchParams(window.location.search)
    const matchingKey = QUERY_PARAM_KEYS.find((key) => params.has(key))
    if (!matchingKey) return null

    const rawValue = params.get(matchingKey)
    if (!isNonEmpty(rawValue)) return null

    const normalized = normalizeUrl(rawValue!)
    window.localStorage.setItem(STORAGE_KEY, normalized)

    params.delete(matchingKey)
    const newQuery = params.toString()
    const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}${window.location.hash}`
    window.history.replaceState({}, '', newUrl)

    return normalized
  } catch (error) {
    console.warn('[MobilSayt] API base override (query param) could not be applied:', error)
    return null
  }
}

const readStoredOverride = (): string | null => {
  if (!isBrowser) return null

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return isNonEmpty(stored) ? normalizeUrl(stored!) : null
  } catch {
    return null
  }
}

const guessRenderBackendUrl = (): string | null => {
  if (!isBrowser) return null

  const suffix = '.onrender.com'
  const { protocol, hostname } = window.location

  if (!hostname.endsWith(suffix)) {
    return null
  }

  const subdomain = hostname.slice(0, -suffix.length)
  if (!subdomain) {
    return null
  }

  const candidates = new Set<string>()
  const replacementTokens = ['-frontend', '-mobil', '-mobile', '-web', '-client', '-site']

  for (const token of replacementTokens) {
    if (subdomain.includes(token)) {
      candidates.add(subdomain.replace(token, '-backend'))
    }
  }

  if (!subdomain.endsWith('-backend')) {
    candidates.add(`${subdomain.replace(/-+$/, '')}-backend`)
  }

  for (const candidate of candidates) {
    const sanitized = candidate.replace(/^-+/, '')
    if (sanitized && sanitized !== subdomain) {
      return `${protocol}//${sanitized}${suffix}/api`
    }
  }

  return null
}

const exposeDebuggerHelpers = (result: ApiBaseResult) => {
  if (!isBrowser) return
  const helpers = {
    getBaseUrl: () => result.url,
    getSource: () => result.source,
    setBaseUrl: (url: string) => {
      const normalized = normalizeUrl(url)
      window.localStorage.setItem(STORAGE_KEY, normalized)
      window.location.reload()
    },
    clearBaseUrl: () => {
      window.localStorage.removeItem(STORAGE_KEY)
      window.location.reload()
    },
  }

  Object.defineProperty(window, 'mobilsaytApi', {
    value: helpers,
    configurable: true,
    enumerable: false,
    writable: false,
  })
}

const logFallbackWarning = (result: ApiBaseResult) => {
  if (!isBrowser) return
  if (['render-guess', 'same-origin'].includes(result.source)) {
    console.warn(
      `[MobilSayt] API URL resolved via "${result.source}" fallback: ${result.url}. ` +
        'Set VITE_API_URL (or MOBILSAYT_API_URL) to silence this warning.'
    )
  }
}

const normalizeUrl = (value: string): string => {
  let url = value.trim()
  if (!url) {
    return ''
  }

  if (url.startsWith('//')) {
    url = `https:${url}`
  } else if (!/^https?:\/\//i.test(url)) {
    if (url.startsWith('/')) {
      url = isBrowser ? `${window.location.origin}${url}` : `http://localhost:5000${url}`
    } else {
      const protocol = isBrowser ? window.location.protocol : 'https:'
      url = `${protocol}//${url}`
    }
  }

  return url.replace(/\/+$/, '')
}

const isNonEmpty = (value: string | null | undefined): value is string =>
  typeof value === 'string' && value.trim().length > 0

const isLocalHostname = (hostname: string): boolean => {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.endsWith('.local')
  )
}

