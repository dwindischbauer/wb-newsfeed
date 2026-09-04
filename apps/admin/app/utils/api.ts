export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // Ensure the request goes to the Nuxt internal API route (proxy) instead of directly to backend
  // URL comes in as e.g. "http://localhost:3005/api/articles"
  // We need to strip the domain and keep only the path
  try {
    const urlObj = new URL(url);
    url = urlObj.pathname + urlObj.search;
  } catch {
    // If it's already a relative path, ignore
  }

  const headers = options.headers as Record<string, string> | undefined;
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData) && !headers?.['Content-Type']) {
    options.headers = { ...headers, 'Content-Type': 'application/json' };
    options.body = JSON.stringify(options.body);
  }

  return fetch(url, options);
};
