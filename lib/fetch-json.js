/** Browser + server-compatible JSON fetch helper for same-origin REST routes */
export async function apiFetch(url, opts = {}) {
  const {
    method = "GET",
    body,
    headers: extraHeaders,
    raw,
    ...rest
  } = opts;

  const headers = new Headers(extraHeaders ?? {});
  const init = { method, credentials: "include", headers, ...rest };

  if (body !== undefined && body !== null) {
    if (!(body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    init.body =
      typeof body === "string" || body instanceof FormData ? body : JSON.stringify(body);
  }

  const res = await fetch(url, init);
  if (raw) return res;

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    const msg =
      typeof data.error === "string"
        ? data.error
        : data.errors
          ? typeof data.errors === "object"
            ? JSON.stringify(data.errors)
            : String(data.errors)
          : `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}
