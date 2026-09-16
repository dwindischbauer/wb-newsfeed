export const truncate = (str: string, length: number = 100): string => {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
};

export const stripHtml = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '');
};

export const parseKeyTakeaways = (raw: string | null | undefined): string[] => {
  if (!raw) return [];
  return raw
    .split(/(?:\n|[,;]?\s*(?:•|-|\*|\d+\.)\s+)/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
};

export const estimateReadingTime = (text: string | null | undefined, wordsPerMinute: number = 200): string => {
  if (!text) return '< 1 Min Lesezeit';
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} Min Lesezeit`;
};
