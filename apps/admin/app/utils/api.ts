interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: BodyInit | Record<string, unknown> | null;
}

export const apiFetch = async (url: string, options: ApiFetchOptions = {}) => {
  // Ensure the request goes to the Nuxt internal API route (proxy) instead of directly to backend
  // URL comes in as e.g. "http://localhost:3005/api/articles"
  // We need to strip the domain and keep only the path
  try {
    const urlObj = new URL(url);
    url = urlObj.pathname + urlObj.search;
  } catch {
    // If it's already a relative path, ignore
  }

  const headers = new Headers(options.headers);

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
    options.body = JSON.stringify(options.body);
  }

  return fetch(url, { ...options, headers, body: options.body as BodyInit | null | undefined });
};
