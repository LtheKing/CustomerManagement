/// <reference types="vite/client" />

// Vite environment types
interface ImportMetaEnv {
  /** Preview / shared API URL (dev Fly app) */
  readonly VITE_API_BASE_URL?: string;
  /** Production-only API URL (prod Fly app) — set in Vercel Production env */
  readonly VITE_API_BASE_URL_PROD?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_APP_TITLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
