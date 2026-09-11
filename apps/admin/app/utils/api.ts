export const apiFetch = async (url: string, options: any = {}) => {
  const config = useRuntimeConfig();
  const apiKey = 'diplomarbeit-secret-key';
  
  const headers = {
    ...options.headers,
    'x-api-key': apiKey
  };
  
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData) && !options.headers?.['Content-Type']) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  
  return fetch(url, { ...options, headers });
};
