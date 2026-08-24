const TOKEN_KEY = "unza_cict_token";

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
  notify();
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  notify();
}

/** Subscribe to sign-in/sign-out. Returns an unsubscribe function. */
export function onSessionChange(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function decodeExpiry(token: string): number | null {
  const parts = token.split(".");
  const payloadSegment = parts[1];
  if (parts.length !== 3 || !payloadSegment) return null;
  try {
    const payload = JSON.parse(atob(payloadSegment.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function hasValidSession(): boolean {
  const token = getToken();
  if (!token) return false;
  const expiresAt = decodeExpiry(token);
  return expiresAt === null || expiresAt > Date.now();
}
