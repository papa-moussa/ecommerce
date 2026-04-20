import sanitizeHtml from 'sanitize-html';

/** Strip all HTML — use for plain text fields (names, notes, etc.). */
export function sanitizeText(input: string): string {
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });
}

/** Allow a safe subset of HTML — use for rich-text descriptions. */
export function sanitizeRichText(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    allowedAttributes: {},
  });
}
