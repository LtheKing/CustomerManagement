/**
 * Resolves the API base URL for the current build.
 *
 * Vercel:
 * - Production → VITE_API_BASE_URL_PROD
 * - Preview/Development → VITE_API_BASE_URL
 * Local Vite → localhost fallback
 */
export const getApiBaseUrl = (): string => {
  return (
    import.meta.env.VITE_API_BASE_URL_PROD ||
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? 'https://localhost:44372/api' : '')
  );
};

/** API origin without trailing /api (for static assets like product images). */
export const getApiOrigin = (): string => {
  return getApiBaseUrl().replace(/\/api\/?$/, '');
};
