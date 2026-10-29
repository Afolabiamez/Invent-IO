export class ApiError extends Error {
  constructor(message, status = 0, code = "NETWORK_ERROR", requestId = "") {
    super(message);
    Object.assign(this, { status, code, requestId });
  }
}
export function createApi({
  base = "/api/v1",
  fetcher = fetch,
  storage = sessionStorage,
  onExpired = () => {},
} = {}) {
  const key = "invent-api-session-v1";
  let session = null,
    refreshing = null;
  try {
    session = JSON.parse(storage.getItem(key));
  } catch {}
  const setSession = (value) => {
    session = value;
    if (value) storage.setItem(key, JSON.stringify(value));
    else storage.removeItem(key);
  };
  async function send(
    path,
    { method = "GET", body, auth = true, retry = true, signal } = {},
  ) {
    if (!path.startsWith("/") || path.startsWith("//"))
      throw new Error("Invalid API path");
    let response;
    try {
      response = await fetcher(base + path, {
        method,
        signal,
        credentials: "omit",
        headers: {
          Accept: "application/json",
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...(auth && session?.accessToken
            ? { Authorization: "Bearer " + session.accessToken }
            : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
    } catch (error) {
      if (error.name === "AbortError") throw error;
      throw new ApiError(
        "Could not reach the server. Check your connection and try again.",
      );
    }
    let data = null;
    const raw = await response.text();
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      if (response.ok)
        throw new ApiError(
          "The server returned an unexpected response.",
          response.status,
          "INVALID_RESPONSE",
        );
    }
    if (response.status === 401 && auth && retry && session?.refreshToken) {
      if (!refreshing)
        refreshing = (async () => {
          const previous = session;
          try {
            const next = await send("/auth/refresh", {
              method: "POST",
              body: { refreshToken: previous.refreshToken },
              auth: false,
            });
            if (!next?.accessToken || !next?.refreshToken)
              throw new ApiError("Session expired.", 401);
            if (session === previous) setSession({ ...previous, ...next });
          } catch (error) {
            if (session === previous) {
              setSession(null);
              onExpired();
            }
            throw error;
          }
        })().finally(() => {
          refreshing = null;
        });
      await refreshing;
      if (!session)
        throw new ApiError("Please log in again.", 401, "SESSION_EXPIRED");
      return send(path, { method, body, auth, signal, retry: false });
    }
    if (!response.ok) {
      const error = data?.error;
      const message = typeof error === "object" ? error.message : data?.message;
      throw new ApiError(
        Array.isArray(message)
          ? message.join(" ")
          : message ||
            (response.status === 404
              ? "This feature is not available on the deployed backend yet."
              : "The request could not be completed."),
        response.status,
        error?.code || "HTTP_" + response.status,
        error?.requestId || response.headers.get("x-railway-request-id") || "",
      );
    }
    return data;
  }
  async function authenticate(kind, values) {
    const data = await send("/auth/" + kind, {
      method: "POST",
      body: values,
      auth: false,
    });
    if (!data?.accessToken || !data?.refreshToken)
      throw new ApiError(
        "The server did not return a session.",
        0,
        "INVALID_RESPONSE",
      );
    setSession({
      ...data,
      email: values.email,
      name: values.name || "",
      businessName: values.businessName || "",
    });
    return data;
  }
  async function logout() {
    const token = session?.refreshToken;
    try {
      if (token)
        await send("/auth/logout", {
          method: "POST",
          body: { refreshToken: token },
          auth: false,
        });
    } finally {
      setSession(null);
    }
  }
  async function pages(path) {
    let cursor = null;
    const items = [],
      seen = new Set();
    do {
      const page = await send(
        path +
          (path.includes("?") ? "&" : "?") +
          "limit=100" +
          (cursor ? "&cursor=" + encodeURIComponent(cursor) : ""),
      );
      if (!Array.isArray(page?.items))
        throw new ApiError("Unexpected list response.", 0, "INVALID_RESPONSE");
      items.push(...page.items);
      cursor = page.nextCursor;
      if (cursor && seen.has(cursor))
        throw new ApiError(
          "The server repeated a pagination cursor.",
          0,
          "INVALID_RESPONSE",
        );
      if (cursor) seen.add(cursor);
    } while (cursor);
    return items;
  }
  return {
    request: send,
    authenticate,
    logout,
    pages,
    get session() {
      return session;
    },
    clear: () => setSession(null),
  };
}
