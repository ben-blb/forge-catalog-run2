export const camel = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
export const pascal = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const kebab = (s: string) =>
  s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

export function plural(word: string): string {
  if (/[^aeiou]y$/.test(word)) return `${word.slice(0, -1)}ies`;
  if (/(s|x|ch|sh)$/.test(word)) return `${word}es`;
  return `${word}s`;
}
