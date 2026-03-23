"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  uploadEndpoint: string;
  proxyEndpoint: string;
  onUploaded: (publicUrl: string) => void;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
  initialUrl?: string | null;
};

function bboxRotated(w: number, h: number, rotRad: number) {
  const c = Math.abs(Math.cos(rotRad));
  const s = Math.abs(Math.sin(rotRad));
  return {
    cw: Math.ceil(w * c + h * s),
    ch: Math.ceil(w * s + h * c),
  };
}

function renderTransformed(
  img: HTMLImageElement,
  scalePct: number,
  rotationDeg: number,
  flipH: boolean,
  flipV: boolean,
  maxExportWidth: number,
): HTMLCanvasElement {
  const S = Math.max(0.05, Math.min(3, scalePct / 100));
  const rot = (rotationDeg * Math.PI) / 180;
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  const w = nw * S;
  const h = nh * S;
  const { cw, ch } = bboxRotated(w, h, rot);

  const cv = document.createElement("canvas");
  cv.width = Math.max(1, cw);
  cv.height = Math.max(1, ch);
  const ctx = cv.getContext("2d");
  if (!ctx) return cv;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.save();
  ctx.translate(cv.width / 2, cv.height / 2);
  ctx.rotate(rot);
  const sx = (flipH ? -1 : 1) * S;
  const sy = (flipV ? -1 : 1) * S;
  ctx.scale(sx, sy);
  ctx.drawImage(img, -nw / 2, -nh / 2, nw, nh);
  ctx.restore();

  if (maxExportWidth > 0 && cv.width > maxExportWidth) {
    const ratio = maxExportWidth / cv.width;
    const c2 = document.createElement("canvas");
    c2.width = maxExportWidth;
    c2.height = Math.max(1, Math.ceil(cv.height * ratio));
    const c2x = c2.getContext("2d");
    if (c2x) {
      c2x.imageSmoothingEnabled = true;
      c2x.imageSmoothingQuality = "high";
      c2x.drawImage(cv, 0, 0, c2.width, c2.height);
    }
    return c2;
  }
  return cv;
}

export function WebsiteHeroImageEditor({
  uploadEndpoint,
  proxyEndpoint,
  onUploaded,
  disabled = false,
  onBusyChange,
  initialUrl,
}: Props) {
  const [sourceUrl, setSourceUrl] = useState("");
  const [scalePct, setScalePct] = useState(100);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [maxExportWidth, setMaxExportWidth] = useState(2560);
  const [status, setStatus] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<HTMLImageElement | null>(null);

  const previewRef = useRef<HTMLCanvasElement>(null);

  const setBusy = useCallback(
    (b: boolean) => {
      onBusyChange?.(b);
    },
    [onBusyChange],
  );

  const loadImageFromDataUrl = useCallback((dataUrl: string) => {
    const im = new Image();
    im.onload = () => {
      setLoaded(im);
      setStatus(null);
    };
    im.onerror = () => {
      setLoaded(null);
      setStatus("Bild konnte nicht geladen werden.");
    };
    im.src = dataUrl;
  }, []);

  const handleLoadUrl = async () => {
    const u = sourceUrl.trim();
    if (!u) {
      setStatus("URL eingeben.");
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(proxyEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u }),
      });
      const j = (await res.json()) as { mime?: string; base64?: string; error?: string };
      if (!res.ok) throw new Error(j.error || "Proxy fehlgeschlagen");
      if (!j.mime || !j.base64) throw new Error("Ungültige Antwort");
      const dataUrl = `data:${j.mime};base64,${j.base64}`;
      loadImageFromDataUrl(dataUrl);
    } catch (e) {
      setLoaded(null);
      setStatus(e instanceof Error ? e.message : "Laden fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  const handleLoadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => loadImageFromDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleLoadInitial = async () => {
    const u = initialUrl?.trim();
    if (!u || !u.startsWith("http")) {
      setStatus("Keine gültige Hero-URL gespeichert.");
      return;
    }
    setSourceUrl(u);
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(proxyEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u }),
      });
      const j = (await res.json()) as { mime?: string; base64?: string; error?: string };
      if (!res.ok) throw new Error(j.error || "Proxy fehlgeschlagen");
      if (!j.mime || !j.base64) throw new Error("Ungültige Antwort");
      loadImageFromDataUrl(`data:${j.mime};base64,${j.base64}`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Laden fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas || !loaded) return;
    const out = renderTransformed(loaded, scalePct, rotationDeg, flipH, flipV, maxExportWidth);
    const maxPreview = 520;
    const r = Math.min(1, maxPreview / out.width, maxPreview / out.height);
    canvas.width = Math.max(1, Math.floor(out.width * r));
    canvas.height = Math.max(1, Math.floor(out.height * r));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(out, 0, 0, canvas.width, canvas.height);
  }, [loaded, scalePct, rotationDeg, flipH, flipV, maxExportWidth]);

  const handleExportUpload = async () => {
    if (!loaded) {
      setStatus("Zuerst ein Bild laden.");
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const out = renderTransformed(loaded, scalePct, rotationDeg, flipH, flipV, maxExportWidth);
      const dataUrl = out.toDataURL("image/jpeg", 0.92);
      const res = await fetch(uploadEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64: dataUrl, filename: "hero-edited.jpg" }),
      });
      const body = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(body.error || "Upload fehlgeschlagen.");
      if (!body.url) throw new Error("Keine URL");
      onUploaded(body.url);
      setStatus("Hochgeladen — bitte unten „Speichern“ für die Startseite.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Export fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="rounded-xl border border-[#0d2137]/20 bg-[#14171c] p-4 text-white shadow-inner sm:p-5"
      dir="rtl"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <h3 className="text-sm font-semibold text-white">تحويل الصورة · Bild transformieren</h3>
        <span className="text-[10px] text-white/45">URL · مقياس · دوران · قلب</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px] lg:items-start">
        <div className="space-y-3">
          <label className="block text-xs text-white/70">رابط الصورة / Bild-URL</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              disabled={disabled}
              placeholder="https://…"
              className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => void handleLoadUrl()}
              className="shrink-0 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-50"
            >
              تحميل
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="cursor-pointer rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10">
              ملف محلي
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleLoadFile} disabled={disabled} />
            </label>
            <button
              type="button"
              disabled={disabled}
              onClick={() => void handleLoadInitial()}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10 disabled:opacity-50"
            >
              تحميل صورة الـ Hero الحالية
            </button>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/25 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs text-white/75">حجم (موحد) / Maßstab</span>
              <span className="font-mono text-xs text-[#5eead4]">{scalePct.toFixed(0)} %</span>
            </div>
            <input
              type="range"
              min={10}
              max={200}
              step={1}
              value={scalePct}
              disabled={disabled}
              onChange={(e) => setScalePct(Number(e.target.value))}
              className="h-2 w-full accent-[#2dd4bf]"
            />
          </div>

          <div className="rounded-lg border border-white/10 bg-black/25 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs text-white/75">استدارة / Rotation</span>
              <span className="font-mono text-xs text-[#5eead4]">{rotationDeg.toFixed(0)}°</span>
            </div>
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={rotationDeg}
              disabled={disabled}
              onChange={(e) => setRotationDeg(Number(e.target.value))}
              className="h-2 w-full accent-[#2dd4bf]"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => setRotationDeg((r) => r - 90)}
                className="rounded border border-white/15 px-2 py-1 text-[11px] hover:bg-white/10 disabled:opacity-50"
              >
                −90°
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => setRotationDeg((r) => r + 90)}
                className="rounded border border-white/15 px-2 py-1 text-[11px] hover:bg-white/10 disabled:opacity-50"
              >
                +90°
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => setRotationDeg(0)}
                className="rounded border border-white/15 px-2 py-1 text-[11px] hover:bg-white/10 disabled:opacity-50"
              >
                0°
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-white/10 bg-black/25 p-3">
            <span className="text-xs text-white/75">عكس / Spiegeln</span>
            <label className="flex cursor-pointer items-center gap-2 text-xs">
              <input type="checkbox" checked={flipH} disabled={disabled} onChange={(e) => setFlipH(e.target.checked)} className="accent-[#2dd4bf]" />
              أفقي
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs">
              <input type="checkbox" checked={flipV} disabled={disabled} onChange={(e) => setFlipV(e.target.checked)} className="accent-[#2dd4bf]" />
              عمودي
            </label>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/25 p-3">
            <label className="mb-1 block text-xs text-white/75">أقصى عرض للتصدير (بكسل) / Max. Exportbreite</label>
            <input
              type="number"
              min={800}
              max={6000}
              step={80}
              value={maxExportWidth}
              disabled={disabled}
              onChange={(e) => setMaxExportWidth(Math.max(400, Number(e.target.value) || 2560))}
              className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 font-mono text-sm text-white disabled:opacity-50"
            />
            <p className="mt-1 text-[10px] text-white/40">يُصغَّر فقط إذا تجاوز العرض؛ لا تكبير فوق الناتج.</p>
          </div>

          <button
            type="button"
            disabled={disabled || !loaded}
            onClick={() => void handleExportUpload()}
            className="w-full rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-white shadow-lg hover:opacity-95 disabled:opacity-50"
          >
            تطبيق التحويل ورفع الصورة · Export &amp; Upload
          </button>
          {status ? <p className="text-xs text-amber-200/90">{status}</p> : null}
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-white/55">معاينة</span>
          <div className="flex max-h-[min(360px,55vh)] max-w-full items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/40 p-2">
            <canvas ref={previewRef} className="max-h-[min(340px,50vh)] max-w-full object-contain" />
          </div>
          {!loaded ? <p className="text-center text-[11px] text-white/35">لا توجد صورة محمّلة</p> : null}
        </div>
      </div>
    </div>
  );
}
