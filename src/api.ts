// Lightweight session-token plumbing for the app's own backend API.
//
// On login the server issues a token; we store it and attach it as the
// `x-session-token` header on every request to our own `/api/*` endpoints.
// The token is ONLY sent to same-origin /api requests, never to third-party
// services (Cloudinary, Nominatim, ipapi, Spotify, etc.).

const TOKEN_KEY = 'couple_app_token';

export function getSessionToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSessionToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore storage errors */
  }
}

function isOwnApiRequest(url: string): boolean {
  try {
    if (url.startsWith('/api/')) return true;
    const parsed = new URL(url, window.location.origin);
    return parsed.origin === window.location.origin && parsed.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

let installed = false;

/**
 * Wraps the global fetch once so every same-origin /api request carries the
 * session token. Call this before the app renders.
 */
export function installApiAuth(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : (input as Request).url;

      const token = getSessionToken();
      if (token && isOwnApiRequest(url)) {
        const headers = new Headers(
          init?.headers || (input instanceof Request ? input.headers : undefined)
        );
        headers.set('x-session-token', token);
        return originalFetch(input as any, { ...init, headers });
      }
    } catch {
      /* fall through to a normal fetch */
    }
    return originalFetch(input as any, init);
  };
}

