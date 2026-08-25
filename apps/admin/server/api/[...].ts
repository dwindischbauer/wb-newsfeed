export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const apiKey = 'diplomarbeit-secret-key'; // Secure server-side key
  
  // event.path contains the full path including query params (e.g. /api/articles)
  const targetUrl = `${config.public.apiUrl || 'http://localhost:3005'}${event.path}`;
  
  return proxyRequest(event, targetUrl, {
    headers: {
      'x-api-key': apiKey
    }
  });
});
