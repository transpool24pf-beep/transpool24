"use client";

import { useState } from "react";
import Image from "next/image";
import { DriverWizardForm } from "./DriverWizardForm";

const FAQ_ITEMS: { q: string; a: string }[] = [
  { q: "ما هو السن المطلوب للعمل كسائق؟", a: "يجب أن يكون عمرك 18 عاماً على الأقل وحاصل على رخصة قيادة سارية." },
  { q: "كم يتقاضى سائقو TransPool24؟", a: "نعمل بأجر بالساعة وفقاً للمسافة ووقت التحميل والتفريغ، مع شفافية كاملة." },
  { q: "مدينتي غير مدرجة، هل يمكنني التقديم؟", a: "نعم. اختر «أخرى» وأذكر مدينتك في الملاحظات، وسنتواصل معك." },
  { q: "هل أحتاج إلى سيارة خاصة؟", a: "يمكن العمل كسائق فقط، أو مع سيارة، أو مع سيارة ومعاون حسب الخدمة." },
  { q: "كيف أتواصل معكم؟", a: "بعد تقديم الطلب سنراجع بياناتك ونتواصل عبر البريد أو الهاتف." },
];

export function DriverPageClient({ locale }: { locale: string }) {
  const [showForm, setShowForm] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const scrollToApply = () => {
    setShowForm(true);
    setTimeout(() => document.getElementById("driver-form")?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  return (
    <main className="bg-[#f6f7fb]">
      {!showForm ? (
        <>
          {/* 1. Hero - Lieferando style */}
          <section className="overflow-hidden bg-[#f6f4ef]">
            <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
              <div className="max-w-xl">
                <h1 className="text-4xl font-bold leading-tight text-[var(--accent)] sm:text-5xl">
                  انضم إلى فريق توصيل TransPool24
                </h1>
                <p className="mt-5 text-lg leading-8 text-[#0d2137]">
                  انضم إلينا كسائق واكسب أجراً بالساعة بالإضافة إلى الإكراميات.
                </p>
                <button
                  type="button"
                  onClick={scrollToApply}
                  className="mt-8 rounded-xl bg-[var(--accent)] px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:opacity-90"
                >
                  قدم الآن
                </button>
                <p className="mt-4 text-sm text-[#0d2137]/70">
                  * يشمل الأجر الأساسي ومكافآت الطلبات لسائق بدوام كامل.
                </p>
              </div>
              <div className="relative">
                <div className="overflow-hidden rounded-[2rem] bg-[#ff8a00] p-4 shadow-2xl">
                  <Image
                    src="/images/van2.png"
                    alt="TransPool24 driver"
                    width={900}
                    height={620}
                    className="h-[360px] w-full rounded-[1.5rem] object-cover"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 2. Benefits - 3 cards */}
          <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl bg-[#e3f2fd] p-6">
                <div className="mb-3 text-3xl">💻</div>
                <h2 className="text-lg font-semibold text-[#0d2137]">أجر عادل: أجر بالساعة بالإضافة إلى مزايا إضافية</h2>
                <p className="mt-2 text-sm text-[#0d2137]/80">نقدم أجراً واضحاً بالساعة مع تعويض وقت الانتظار والإكراميات.</p>
              </div>
              <div className="rounded-2xl bg-[#fff8e1] p-6">
                <div className="mb-3 text-3xl">🪪</div>
                <h2 className="text-lg font-semibold text-[#0d2137]">التوظيف الآمن: الاستقرار والدعم</h2>
                <p className="mt-2 text-sm text-[#0d2137]/80">تعاون واضح، دفع في الوقت، وفريق دعم للاستفسارات.</p>
              </div>
              <div className="rounded-2xl bg-[#fce4ec] p-6">
                <div className="mb-3 text-3xl">👥</div>
                <h2 className="text-lg font-semibold text-[#0d2137]">المرونة: عمل يناسب نمط حياتك</h2>
                <p className="mt-2 text-sm text-[#0d2137]/80">اختر أوقات العمل المناسبة لك، بدوام كامل أو جزئي.</p>
              </div>
            </div>
          </section>

          {/* 3. What you need + CTA */}
          <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="text-center text-2xl font-bold text-[#0d2137]">ما تحتاجه للبدء كسائق</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <div className="text-2xl">🛵</div>
                <h3 className="mt-2 font-semibold text-[#0d2137]">المستندات المطلوبة</h3>
                <p className="mt-1 text-sm text-[#0d2137]/70">هوية سارية، رخصة قيادة، وتأمين حسب نوع المركبة.</p>
              </div>
              <div>
                <div className="text-2xl">⏱</div>
                <h3 className="mt-2 font-semibold text-[#0d2137]">المركبة أو الدراجة</h3>
                <p className="mt-1 text-sm text-[#0d2137]/70">ربط سيارتك أو دراجتك والتعويض عن المسافة المقطوعة.</p>
              </div>
              <div>
                <div className="text-2xl">🎉</div>
                <h3 className="mt-2 font-semibold text-[#0d2137]">الخبرة</h3>
                <p className="mt-1 text-sm text-[#0d2137]/70">لا تشترط خبرة سابقة؛ نقدّر المبادرة والاعتمادية.</p>
              </div>
              <div>
                <div className="text-2xl">📦</div>
                <h3 className="mt-2 font-semibold text-[#0d2137]">الدافع</h3>
                <p className="mt-1 text-sm text-[#0d2137]/70">الشغف بالعمل الميداني وإسعاد العملاء بالتوصيل.</p>
              </div>
            </div>
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={scrollToApply}
                className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-4 font-semibold text-white shadow-lg transition hover:opacity-90"
              >
                <span>→</span> قدم طلبك الآن!
              </button>
            </div>
          </section>

          {/* 4. Process - 3 steps */}
          <section className="bg-white py-14">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <h2 className="text-center text-3xl font-bold text-[var(--accent)]">عملية التوظيف</h2>
              <div className="mt-12 grid gap-8 md:grid-cols-3">
                <div className="text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#e3f2fd] text-3xl">📱</div>
                  <p className="mt-4 text-sm font-medium text-[#0d2137]">1. قدم طلبك عبر النموذج. 2. جهّز مستنداتك.</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fff8e1] text-3xl">📄</div>
                  <p className="mt-4 text-sm font-medium text-[#0d2137]">3. مقابلة قصيرة. 4. إن كنت مناسباً نرسل لك عرض عمل.</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fce4ec] text-3xl">🛞</div>
                  <p className="mt-4 text-sm font-medium text-[#0d2137]">5. تفاصيل المعدات والجدول. 6. في يومك الأول نرشدك لكل شيء.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Testimonials */}
          <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-center text-2xl font-bold text-[#0d2137]">ماذا يقول سائقونا</h2>
            <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-[#0d2137]/10 bg-white p-8 shadow-sm">
              <p className="text-lg text-[#0d2137]/90">
                "العمل مع TransPool24 مرن وواضح، خاصة في المساء وعطلة نهاية الأسبوع."
              </p>
              <p className="mt-4 font-semibold text-[#0d2137]">— سائق من بفورتسهايم</p>
            </div>
            <div className="mt-6 flex justify-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
              <span className="h-2 w-2 rounded-full bg-[#0d2137]/20" />
              <span className="h-2 w-2 rounded-full bg-[#0d2137]/20" />
            </div>
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={scrollToApply}
                className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-4 font-semibold text-white shadow-lg transition hover:opacity-90"
              >
                <span>→</span> قدم طلبك الآن!
              </button>
            </div>
          </section>

          {/* 6. FAQ */}
          <section className="bg-white py-14">
            <div className="mx-auto max-w-3xl px-4 sm:px-6">
              <h2 className="text-center text-2xl font-bold text-[#0d2137]">الأسئلة الشائعة</h2>
              <div className="mt-8 space-y-2">
                {FAQ_ITEMS.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-[#0d2137]/10 bg-[#f8f9fa]"
                  >
                    <button
                      type="button"
                      onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                      className="flex w-full items-center justify-between px-5 py-4 text-right font-medium text-[#0d2137]"
                    >
                      {item.q}
                      <span className="text-xl text-[var(--accent)]">{faqOpen === i ? "−" : "+"}</span>
                    </button>
                    {faqOpen === i && (
                      <div className="border-t border-[#0d2137]/10 px-5 py-4 text-sm text-[#0d2137]/80">
                        {item.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={scrollToApply}
                  className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-4 font-semibold text-white shadow-lg transition hover:opacity-90"
                >
                  <span>→</span> قدم طلبك الآن!
                </button>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section id="driver-form" className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <div className="rounded-2xl border border-[#0d2137]/10 bg-white p-6 shadow-lg sm:p-8">
            <DriverWizardForm onBack={() => setShowForm(false)} initialCity="" />
          </div>
        </section>
      )}

    </main>
  );
}
