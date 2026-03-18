"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function RateDriverContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "form" | "done" | "invalid">("loading");
  const [orderLabel, setOrderLabel] = useState("");
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [selected, setSelected] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    fetch(`/api/rate-driver?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setOrderLabel(String(data.order_number ?? "").slice(0, 8));
          setAlreadyRated(!!data.already_rated);
          setStatus(data.already_rated ? "done" : "form");
        } else {
          setStatus("invalid");
        }
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  const submit = async () => {
    if (!token || selected < 1) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/rate-driver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, rating: selected, comment: comment.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok && data.ok) setStatus("done");
      else alert(data?.error ?? "فشل الإرسال");
    } catch {
      alert("فشل الإرسال");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-md rounded-2xl border bg-white p-8 shadow-lg">
        <p className="text-center text-[#0d2137]/70">جاري التحميل…</p>
      </div>
    );
  }
  if (status === "invalid") {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 shadow-lg">
        <p className="text-center font-medium text-red-800">الرابط غير صالح أو منتهي الصلاحية.</p>
      </div>
    );
  }
  if (status === "done") {
    return (
      <div className="mx-auto max-w-md rounded-2xl border bg-white p-8 shadow-lg">
        <h1 className="text-center text-xl font-bold text-[#0d2137]">شكراً لتقييمك</h1>
        <p className="mt-2 text-center text-[#0d2137]/70">
          {alreadyRated ? "كنت قد قيّمت السائق مسبقاً." : "تم تسجيل تقييمك بنجاح."}
        </p>
        <p className="mt-4 text-center text-sm text-[#0d2137]/60">— TransPool24</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-white p-8 shadow-lg">
      <h1 className="text-center text-xl font-bold text-[#0d2137]">تقييم السائق</h1>
      <p className="mt-2 text-center text-sm text-[#0d2137]/70">
        كيف تقيّم خدمة السائق؟ (الطلب {orderLabel})
      </p>
      <div className="mt-6 flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setSelected(n)}
            className={`text-3xl transition ${selected >= n ? "text-amber-500" : "text-[#0d2137]/25 hover:text-amber-400"}`}
          >
            ★
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-[#0d2137]/60">
        {selected > 0 ? `${selected} نجوم` : "اختر عدد النجوم"}
      </p>
      <div className="mt-4">
        <label className="mb-1 block text-sm font-medium text-[#0d2137]/80">تعليق (اختياري)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="أضف تعليقاً عن تجربتك مع السائق..."
          rows={3}
          className="w-full rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm text-[#0d2137] placeholder:text-[#0d2137]/40 focus:border-[var(--accent)] focus:outline-none"
          maxLength={500}
        />
      </div>
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={submit}
          disabled={selected < 1 || submitting}
          className="rounded-lg bg-[var(--accent)] px-6 py-2 font-medium text-white disabled:opacity-50"
        >
          {submitting ? "جاري الإرسال…" : "إرسال التقييم"}
        </button>
      </div>
    </div>
  );
}

export default function RateDriverPage() {
  return (
    <div className="min-h-screen bg-[#f6f7fb] px-4 py-16">
      <Suspense fallback={<div className="mx-auto max-w-md rounded-2xl border bg-white p-8">جاري التحميل…</div>}>
        <RateDriverContent />
      </Suspense>
    </div>
  );
}
