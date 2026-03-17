import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DriverApplicationForm } from "@/components/DriverApplicationForm";

export default async function DriverApplyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <Header />
      <main className="bg-[#f6f7fb]">
        <section className="overflow-hidden bg-[#f6f4ef]">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
            <div className="max-w-xl">
              <p className="mb-4 inline-flex rounded-full bg-white px-4 py-1 text-sm font-semibold text-[var(--accent)] shadow-sm">
                انضم إلى TransPool24
              </p>
              <h1 className="text-4xl font-bold leading-tight text-[#0d2137] sm:text-5xl">
                قدّم طلب عمل كسائق معنا
              </h1>
              <p className="mt-5 text-lg leading-8 text-[#0d2137]/75">
                صفحة توظيف بسيطة وواضحة للسائقين، بأسلوب احترافي قريب من
                تجربة التسجيل السريع، مع وصول مباشر إلى فريقنا.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/${locale}/order`}
                  className="rounded-lg border border-[#0d2137]/15 bg-white px-5 py-3 font-medium text-[#0d2137] shadow-sm transition hover:bg-[#0d2137]/5"
                >
                  للزبائن: احجز الآن
                </Link>
                <Link
                  href="#apply"
                  className="rounded-lg bg-[var(--accent)] px-5 py-3 font-medium text-white transition hover:opacity-90"
                >
                  ابدأ طلبك الآن
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -left-6 top-6 h-28 w-28 rounded-full bg-[var(--accent)]/20 blur-2xl" />
              <div className="absolute -bottom-6 right-10 h-24 w-24 rounded-full bg-[#0d2137]/10 blur-2xl" />
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

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#0d2137]">تسجيل سريع</h2>
              <p className="mt-2 text-sm text-[#0d2137]/70">أرسل بياناتك الأساسية وخلالها نراجع طلبك.</p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#0d2137]">طلبات واضحة</h2>
              <p className="mt-2 text-sm text-[#0d2137]/70">نربطك بالطلبات المناسبة حسب المدينة والمركبة.</p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#0d2137]">واجهة مهنية</h2>
              <p className="mt-2 text-sm text-[#0d2137]/70">تصميم نظيف ومتجاوب على الجوال والكمبيوتر.</p>
            </div>
          </div>
        </section>

        <section id="apply" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2 className="text-2xl font-bold text-[#0d2137]">نموذج التقديم</h2>
              <p className="mt-2 text-sm text-[#0d2137]/70">
                املأ البيانات التالية، وسنحفظ طلبك في النظام.
              </p>
            </div>
            <DriverApplicationForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
