export const environment = {
  production: true,
  // Relative URL - in production CloudFront serves the SPA and proxies /api/* to the
  // App Runner origin, so the browser sees one origin. This keeps the auth cookie
  // same-site (SameSite=Lax) and means no CORS is needed.
  apiUrl: '/api'
};
