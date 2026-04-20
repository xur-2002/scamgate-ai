const ANONYMOUS_ID_KEY = "scamgate_anonymous_id";

export function getOrCreateAnonymousId(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  const existing = window.localStorage.getItem(ANONYMOUS_ID_KEY);

  if (existing) {
    return existing;
  }

  const nextId =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `anon_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(ANONYMOUS_ID_KEY, nextId);
  return nextId;
}
