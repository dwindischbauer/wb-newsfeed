export const helloFromShortform = () => {
  return 'Hello from shared shortform-news package';
};

export const truncate = (str: string, length: number = 100): string => {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
};

export const stripHtml = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '');
};
