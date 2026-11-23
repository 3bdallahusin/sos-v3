/**
 * Formatters and string humanizers for SOS V3 UI
 */

/**
 * Clean up raw filenames and deck names for human-readable display across the SOS application.
 * Strips common file extensions (.pdf, .mp4, .mov, .md, .docx, etc.),
 * replaces underscores with natural spaces, collapses extraneous whitespace, and trims.
 */
export function humanizeTitle(title: string | undefined | null): string {
  if (!title) return '';

  // Strip file extensions at the end of the string
  const withoutExt = title.replace(
    /\.(pdf|docx?|pptx?|xlsx?|mp4|mov|webm|mp3|wav|m4a|md|markdown|txt|epub|json|csv|note|cards|quiz|png|jpe?g|gif|svg|webp|excalidraw)$/i,
    ''
  );

  // Replace underscores with single spaces
  const withSpaces = withoutExt.replace(/_+/g, ' ');

  // Collapse multiple whitespace characters into a single space and trim
  return withSpaces.replace(/\s+/g, ' ').trim();
}
