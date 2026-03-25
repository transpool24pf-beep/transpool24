import Image from "next/image";
import Link from "next/link";
import { DotLottieRow } from "@/components/blog/DotLottieRow";

const LOTTIE_1 =
  "https://lottie.host/2b45c4cf-8d1b-4aff-b2a9-b2051fdcfaa7/y9NIyXNNR2.lottie";
const LOTTIE_2 =
  "https://lottie.host/458c62f4-7371-43f1-b3b7-c3e39d87883a/TUdNTQ1KvT.lottie";

type Props = {
  /** Inside blog card: omit bottom border so the host section frames the block. */
  embedded?: boolean;
};

/**
 * Arabic «من نحن» — vision, brand, strategy, CSR (+ Lottie). Used on /ar/why and /ar/blog.
 */
export function AboutUsArWhyNarrative({ embedded = false }: Props) {
  return (
    <div
      className={`${embedded ? "" : "border-b border-[#0d2137]/6 "}bg-gradient-to-br from-[#f8fafc] via-white to-[#e85d04]/[0.06] px-6 py-10 sm:px-10 sm:py-12`}
    >
      <div className="mx-auto max-w-3xl text-center">
        <div className="relative mx-auto inline-block rounded-[1.35rem] bg-gradient-to-br from-[#0d2137]/[0.08] via-white to-[#e85d04]/[0.14] p-6 shadow-[0_24px_56px_-28px_rgba(13,33,55,0.28)] ring-1 ring-black/[0.07] sm:p-8">
          <div className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-2xl bg-white/95 shadow-inner ring-1 ring-[#0d2137]/8 sm:h-44 sm:w-44">
            <Image
              src="/images/123.png"
              alt="TransPool24"
              width={176}
              height={176}
              className="object-contain p-3"
              priority={!embedded}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-3xl text-[var(--foreground)]" dir="rtl">
        <p className="text-lg leading-relaxed text-[var(--foreground)]/85">
          لم تبدأ <strong>TransPool24</strong> كمجرد منصة للنقل، بل ولدت من <strong>رؤية هندسية</strong> تهدف إلى إعادة
          صياغة مفهوم «اللوجستيات المرنة». اعتمدنا في تصميمنا فلسفة{" "}
          <strong>البساطة الحديثة (Minimalist Modern)</strong> التي تدمج بين ثبات{" "}
          <strong>الأزرق البروسي (Prussian Blue)</strong> وطاقة <strong>البرتقالي النابض</strong>، لتعكس واجهة رقمية
          متطورة تليق بسمعة التكنولوجيا الألمانية. تصميمنا ليس زينةً فقط؛ إنه{" "}
          <strong>رحلة مستخدم</strong> مدروسة لتبسيط أعقد العمليات — بضغطة زر واحدة حيث ينبغي أن تكون.
        </p>
        <p className="mt-4 text-base leading-relaxed text-[var(--foreground)]/78">
          وفي خط مع ما تثبته منصات اللوجستيات الرائدة عالمياً، نضع <strong>الشفافية</strong> و{" "}
          <strong>الأتمتة</strong> و<strong>الثقة المتبادلة</strong> بين العميل والسائق في صلب المنتج — لا وعوداً
          فارغة، بل تدفقاً واضحاً من الطلب إلى التسليم.
        </p>
      </div>

      <div className="mx-auto max-w-4xl">
        <DotLottieRow primarySrc={LOTTIE_1} secondarySrc={LOTTIE_2} />
      </div>

      <div className="mx-auto max-w-3xl space-y-8 text-[var(--foreground)]" dir="rtl">
        <section>
          <h2 className="text-xl font-bold text-[var(--primary)] sm:text-2xl">أهدافنا الاستراتيجية</h2>
          <p className="mt-4 leading-relaxed text-[var(--foreground)]/82">
            نسعى لأن نكون <strong>الشريان الرقمي</strong> الذي يربط <strong>بفورتسهايم (Pforzheim)</strong> بكافة
            الولايات الاتحادية، وإلغاء الفجوات الزمنية واللوجستية في النقل البري عبر:
          </p>
          <ul className="mt-4 list-disc space-y-3 ps-6 leading-relaxed text-[var(--foreground)]/80">
            <li>
              <strong>أتمتة شاملة:</strong> من التسعير اللحظي إلى تتبعٍ دقيق للشحنة — أقل اتصالاتٍ عشوائية، وأكثر
              قابليةٍ للتخطيط.
            </li>
            <li>
              <strong>شفافية في الدفع:</strong> أنظمة دفع عالمية آمنة تحفظ حقوق العميل والسائق وتقلل الاحتكاك
              الإداري.
            </li>
            <li>
              <strong>مسؤولية اجتماعية:</strong> دعم سوق العمل المحلي وبناء كوادر رقمية — لأن المنصة تنجح عندما
              ينجح المجتمع حولها.
            </li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-bold text-[var(--primary)] sm:text-xl">
            المسؤولية الاجتماعية: فرص عمل وتخطي البطالة
          </h3>
          <p className="mt-3 leading-relaxed text-[var(--foreground)]/80">
            نحن جزء من النسيج الاجتماعي للدولة الاتحادية؛ ولذلك يشكل <strong>تنشيط سوق العمل</strong> أحد أركاننا:
          </p>
          <ul className="mt-4 list-disc space-y-3 ps-6 leading-relaxed text-[var(--foreground)]/80">
            <li>
              <strong>خلق فرص عمل:</strong> فتح المجال أمام السائقين والمزودين المحليين للانضمام إلى شبكةٍ مهنية
              واضحة المعايير.
            </li>
            <li>
              <strong>تخطي البطالة:</strong> نؤمن أن التكنولوجيا تخدم الإنسان — نساهم في دمج الكفاءات وتدريبها على
              أدواتنا الرقمية، بما يقلل الاحتكاك مع سوق العمل ويخلق فرصاً مستدامة في{" "}
              <strong>بادن فورتمبيرغ</strong> وألمانيا.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--primary)] sm:text-2xl">جزء من الدولة الاتحادية</h2>
          <p className="mt-4 leading-relaxed text-[var(--foreground)]/82">
            بصفتنا شركةً ألمانية المنشأ، نطمح أن نكون نموذجاً في <strong>الجودة والامتثال</strong>. لا ننقل البضائع
            فحسب — ننقل <strong>الثقة</strong>، ونساهم في قوة الاقتصاد الألماني بتحويل لوجستيات تقليدية إلى{" "}
            <strong>صناعة رقمية ذكية</strong>. شركاء في البناء، وفخورون بأن نكون جزءاً من مستقبل ألمانيا اللوجستي.
          </p>
        </section>

        <p className="rounded-xl bg-[#fafbfc] px-5 py-4 text-center text-base font-semibold text-[var(--primary)] ring-1 ring-[#0d2137]/8">
          <span className="text-[var(--accent)]">TransPool24</span> — نقلٌ أذكى، لمستقبلٍ أوضح.{" "}
          <Link href="/ar/order" className="text-[var(--accent)] underline underline-offset-2 hover:opacity-90">
            احجز طلبك الآن
          </Link>
        </p>
      </div>
    </div>
  );
}
