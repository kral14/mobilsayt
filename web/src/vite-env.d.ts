/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface MobilsaytApiHelpers {
  getBaseUrl: () => string
  getSource: () => string
  setBaseUrl: (url: string) => void
  clearBaseUrl: () => void
}

interface Window {
  MOBILSAYT_API_URL?: string
  mobilsaytApi?: MobilsaytApiHelpers
}
