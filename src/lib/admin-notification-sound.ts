/**
 * Long, loud attention alarm via Web Audio (no MP3 dependency).
 * Browsers may block until a user gesture; we still try after fetch.
 */
export function playAdminNotificationAlarm(): void {
  if (typeof window === "undefined") return;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;

  const ctx = new AC();
  const master = ctx.createGain();
  master.gain.value = 0.001;
  master.connect(ctx.destination);

  const now = ctx.currentTime;
  master.gain.setValueAtTime(0.001, now);
  master.gain.exponentialRampToValueAtTime(0.55, now + 0.08);

  const steps = 14;
  for (let i = 0; i < steps; i++) {
    const t = now + i * 0.38;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = i % 2 === 0 ? "square" : "sawtooth";
    const f = i % 4 === 0 ? 920 : i % 4 === 1 ? 740 : i % 4 === 2 ? 520 : 680;
    osc.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.42, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + 0.34);
  }

  const end = now + steps * 0.38 + 0.5;
  master.gain.setValueAtTime(0.55, end - 0.4);
  master.gain.exponentialRampToValueAtTime(0.001, end);

  void ctx.resume().catch(() => {});
  window.setTimeout(() => {
    try {
      ctx.close();
    } catch {
      /* ignore */
    }
  }, Math.ceil((end - now) * 1000) + 200);
}
