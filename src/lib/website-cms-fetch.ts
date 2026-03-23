/**
 * Website CMS API calls must send the httpOnly session cookie.
 * Some browsers / host combinations omit cookies unless credentials is explicit.
 */
export function cmsFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, { ...init, credentials: "include" });
}
