/** Validate that the request Origin matches NEXTAUTH_URL */
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const allowedOrigin = process.env.NEXTAUTH_URL;

  if (!allowedOrigin) return false;

  try {
    const allowed = new URL(allowedOrigin).origin;
    return origin === allowed;
  } catch {
    return false;
  }
}
