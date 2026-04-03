/** Pure helpers for Stripe webhook handling (testable without Stripe SDK). */
export function jobIdFromCheckoutSession(session: {
  metadata?: Record<string, string> | null;
  client_reference_id?: string | null;
}): string | null {
  const fromMeta = session.metadata?.job_id?.trim();
  if (fromMeta) return fromMeta;
  const ref = session.client_reference_id?.trim();
  return ref || null;
}
