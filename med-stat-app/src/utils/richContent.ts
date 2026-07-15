/** The backend's origin, derived from VITE_API_URL (which includes the /api prefix). */
export function getApiOrigin(): string {
  const apiBase = import.meta.env.VITE_API_URL as string;
  return apiBase.replace(/\/api\/?$/, "");
}

/**
 * Lesson/section HTML (from the Jodit editor) can contain <img src="/api/..."/>
 * — a path relative to the backend, not whichever origin is currently
 * rendering the page. In dev the frontend and backend run on different
 * ports, so a bare relative path 404s and the browser falls back to showing
 * the broken-image alt text (which looks like "a URL instead of a picture").
 * Rewrite any such relative /api/ reference to an absolute URL using the
 * backend's real origin before rendering.
 *
 * Some existing content also has the upload turned into a plain link
 * (<a href="/api/upload/images/x.webp">/api/upload/images/x.webp</a>)
 * instead of an actual <img> — the relative path couldn't preview inside
 * the editor at insert-time, so it never became a real image element.
 * Detect that exact shape (href and link text are the same image URL) and
 * convert it into a real <img> before resolving URLs.
 */
export function resolveContentUrls(html: string): string {
  if (!html) return html;

  const origin = getApiOrigin();

  const withRealImages = html.replace(
    /<a\s+href=["'](\/api\/upload\/images\/[^"']+\.(?:webp|png|jpe?g|gif))["'][^>]*>\s*\1\s*<\/a>/gi,
    '<img src="$1" alt="" />'
  );

  const withResolvedUrls = withRealImages.replace(
    /((?:src|href)=["'])\/api\//g,
    `$1${origin}/api/`
  );

  // Styling overflow directly on a <table> is unreliable across browsers —
  // tables have their own intrinsic-sizing behavior that can still leak
  // their natural content width to shrink-to-fit ancestors even with
  // overflow set on the table itself, which is exactly what pushed the
  // whole page wider. Wrap each table in a plain div and scroll THAT
  // instead; a plain div reliably contains its descendants' width because
  // overflow != visible makes an element establish its own sizing context.
  return withResolvedUrls.replace(
    /<table\b([^>]*)>([\s\S]*?)<\/table>/gi,
    '<div class="table-scroll-wrapper"><table$1>$2</table></div>'
  );
}
