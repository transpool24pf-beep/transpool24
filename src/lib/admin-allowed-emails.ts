/** Comma-separated allowlist in ADMIN_EMAILS (case-insensitive). When unset, any email may log in with the password. */
export function adminEmailGateEnabled(): boolean {
  return Boolean(process.env.ADMIN_EMAILS?.trim());
}

export function getAllowedAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS?.trim();
  if (!raw) return [];
  return [...new Set(raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean))];
}

export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isAllowedAdminEmail(email: string): boolean {
  if (!adminEmailGateEnabled()) return true;
  const normalized = normalizeAdminEmail(email);
  if (!normalized) return false;
  return getAllowedAdminEmails().includes(normalized);
}
