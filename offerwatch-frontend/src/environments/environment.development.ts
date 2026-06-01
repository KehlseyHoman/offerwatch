export const environment = {
  production: false,
  // Relative URL - Angular CLI proxies /api/* → http://localhost:8080/api/*
  // so the browser sees one origin and httpOnly cookies work without SameSite=None.
  apiUrl: '/api'
};
