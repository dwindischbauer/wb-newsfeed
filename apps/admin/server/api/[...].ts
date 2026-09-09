export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const apiKey = process.env.API_KEY; // Secure server-side key
  if (!apiKey) throw new Error('API_KEY is not configured on the server');
  
  // event.path contains the full path including query params (e.g. /api/articles)
  const targetUrl = `${config.public.apiUrl || 'http://localhost:3005'}${event.path}`;
  
  return proxyRequest(event, targetUrl, {
    headers: {
      'x-api-key': apiKey
    }
  });
});
