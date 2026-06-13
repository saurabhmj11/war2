/**
 * Sanitizes AI-generated text before rendering as HTML.
 * Prevents XSS by allowing only safe formatting tags.
 */
export function sanitizeHtml(text: string): string {
  // First escape all HTML entities to prevent injection
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  // Then selectively allow safe formatting
  return escaped
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}
