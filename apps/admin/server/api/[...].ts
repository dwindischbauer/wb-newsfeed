export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const apiKey = process.env.API_KEY || 'diplomarbeit-secret-key';

  
  // event.path contains the full path including query params (e.g. /api/articles)
  const targetUrl = `${config.public.apiUrl || 'http://localhost:3005'}${event.path}`;
  
  return proxyRequest(event, targetUrl, {
    headers: {
      'x-api-key': apiKey
    }
  });
});
