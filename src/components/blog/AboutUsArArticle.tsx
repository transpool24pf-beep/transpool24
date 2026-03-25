import Image from "next/image";
import Link from "next/link";
import { DotLottieRow } from "@/components/blog/DotLottieRow";

const LOTTIE_1 =
  "https://lottie.host/2b45c4cf-8d1b-4aff-b2a9-b2051fdcfaa7/y9NIyXNNR2.lottie";
const LOTTIE_2 =
  "https://lottie.host/458c62f4-7371-43f1-b3b7-c3e39d87883a/TUdNTQ1KvT.lottie";

export function AboutUsArArticle() {
  return (
    <div className="about-us-ar max-w-none text-[var(--foreground)]">
      <div className="mb-10 flex flex-col items-center">
        <div className="relative rounded-[1.35rem] bg-gradient-to-br from-[#0d2137]/[0.06] via-white to-[#e85d04]/[0.12] p-6 shadow-[0_24px_56px_-28px_rgba(13,33,55,0.35)] ring-1 ring-black/[0.07] sm:p-8">
          <div className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-2xl bg-white/90 shadow-inner ring-1 ring-black/[0.05] sm:h-44 sm:w-44">
            <Image
              src="/images/123.png"
              alt="TransPool24"
              width={176}
              height={176}
              className="object-contain p-3"
              priority
            />
          </div>
          <p className="mt-4 text-center text-sm font-medium text-[#5c5c5c]">
            Prussian Blue × البرتقالي — هوية رقمية بسيطة وحديثة
          </p>
        </div>
      </div>

      <p className="mb-6 text-lg leading-relaxed text-[#3d3d3d]">
        لم تبدأ <strong>TransPool24</strong> كمجرد منصة للنقل، بل ولدت من رؤية هندسية تهدف إلى إعادة صياغة مفهوم
        «اللوجستيات المرنة». لقد اعتمدنا في تصميمنا على فلسفة <strong>البساطة الحديثة (Minimalist Modern)</strong>{" "}
        التي تدمج بين القوة المتمثلة في اللون <strong>الأزرق البروسي (Prussian Blue)</strong> والطاقة المتجددة في{" "}
        <strong>البرتقالي النابض</strong>، ليعكس موقعنا واجهة رقمية متطورة تليق بسمعة التكنولوجيا الألمانية. تصميمنا ليس
        مجرد جماليات، بل هو رحلة مستخدم مدروسة بعناية لتبسيط أكثر العمليات تعقيداً بضغطة زر واحدة.
      </p>

      <DotLottieRow primarySrc={LOTTIE_1} secondarySrc={LOTTIE_2} />

      <h2 className="mb-3 mt-10 text-2xl font-semibold tracking-tight text-[#1a1a1a]">أهدافنا الاستراتيجية</h2>
      <p className="mb-4 leading-relaxed text-[#3d3d3d]">
        نحن نسعى لنكون <strong>الشريان الرقمي</strong> الذي يربط بين منطقة <strong>بفورتسهايم (Pforzheim)</strong> وكافة
        الولايات الاتحادية. هدفنا هو إلغاء الفجوات الزمنية واللوجستية في عمليات النقل البري عبر:
      </p>
      <ul className="mb-8 list-disc space-y-2 ps-6 leading-relaxed text-[#3d3d3d]">
        <li>
          <strong>الأتمتة الكاملة:</strong> من التسعير اللحظي إلى تتبع الشحنات بالثانية.
        </li>
        <li>
          <strong>الشفافية المطلقة:</strong> عبر أنظمة دفع عالمية آمنة تضمن حقوق كافة الأطراف.
        </li>
        <li>
          <strong>المسؤولية الاجتماعية:</strong> محاربة البطالة وبناء الكوادر.
        </li>
      </ul>

      <h3 className="mb-3 text-xl font-semibold text-[#1a1a1a]">المسؤولية الاجتماعية: محاربة البطالة وبناء الكوادر</h3>
      <p className="mb-4 leading-relaxed text-[#3d3d3d]">
        نحن ندرك أننا جزء لا يتجزأ من النسيج الاجتماعي للدولة الاتحادية الألمانية. لذا، فإن أحد أركان{" "}
        <strong>TransPool24</strong> الأساسية هو المساهمة الفعالة في تنشيط سوق العمل:
      </p>
      <ul className="mb-8 list-disc space-y-2 ps-6 leading-relaxed text-[#3d3d3d]">
        <li>
          <strong>خلق فرص عمل:</strong> من خلال فتح المجال أمام السائقين والمزودين المحليين للانضمام إلى شبكتنا
          الاحترافية.
        </li>
        <li>
          <strong>تخطي البطالة:</strong> نحن نؤمن بأن التكنولوجيا يجب أن تخدم الإنسان؛ لذا نساهم في دمج الكفاءات وتدريبها
          على استخدام أدواتنا الرقمية، مما يقلل من نسب البطالة ويخلق فرصاً اقتصادية مستدامة للشباب والمحترفين في{" "}
          <strong>بادن فورتمبيرغ</strong> وألمانيا قاطبة.
        </li>
      </ul>

      <h2 className="mb-3 mt-10 text-2xl font-semibold tracking-tight text-[#1a1a1a]">جزء من الدولة الاتحادية</h2>
      <p className="mb-8 leading-relaxed text-[#3d3d3d]">
        بصفتنا شركة ألمانية المنشأ، نطمح لأن نكون نموذجاً يُحتذى به في الالتزام بالمعايير والجودة. نحن لا ننقل البضائع
        فحسب، بل ننقل الثقة، ونساهم في قوة الاقتصاد الألماني عبر تحويل اللوجستيات التقليدية إلى صناعة رقمية ذكية. نحن
        هنا لنكون شركاء في البناء، مساهمين في استقرار سوق العمل، وفخورين بكوننا جزءاً من مستقبل ألمانيا اللوجستي.
      </p>

      <p className="rounded-xl bg-[#f5f6f8] px-5 py-4 text-center text-base font-semibold text-[#1a1a1a] ring-1 ring-black/[0.05]">
        <strong className="text-[var(--accent)]">TransPool24</strong> — نقل ذكي، لمستقبل أفضل.{" "}
        <Link href="/ar/order" className="text-[var(--accent)] underline underline-offset-2 hover:opacity-90">
          احجز طلبك الآن
        </Link>
      </p>
    </div>
  );
}
