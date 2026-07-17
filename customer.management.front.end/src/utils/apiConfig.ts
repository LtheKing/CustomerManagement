/**
 * Resolves the API base URL for the current build.
 *
 * Vercel Production → VITE_API_BASE_URL_PROD (fallback VITE_API_BASE_URL)
 * Vercel Preview / local Vite → VITE_API_BASE_URL (fallback localhost)
 */
export const getApiBaseUrl = (): string => {
  if (import.meta.env.PROD) {
    return (
      import.meta.env.VITE_API_BASE_URL_PROD ||
      import.meta.env.VITE_API_BASE_URL ||
      ""
    );
  }

  return (
    import.meta.env.VITE_API_BASE_URL ||
    "https://localhost:44372/api"
  );
};

/** API origin without trailing /api (for static assets like product images). */
export const getApiOrigin = (): string => {
  return getApiBaseUrl().replace(/\/api\/?$/, "");
};
