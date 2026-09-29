// Oxy platform API base URL. Sourced from the website's standard `VITE_*` env
// convention so deploys can override it, with the production URL as the
// committed default.
export const OXY_API =
  (import.meta.env.VITE_OXY_API as string | undefined) || 'https://api.oxy.so'
