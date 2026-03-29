#!/usr/bin/env python3
"""One-off: inject messages/*.json → aboutNarrative (run from repo root)."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MSG = ROOT / "messages"

AR = {
    "pageTitle": "من نحن",
    "operationalKicker": "التشغيل اليومي للشركات والتجارة",
    "metaTitle": "من نحن | TransPool24 — رؤية رقمية من بفورتسهايم",
    "metaDescription": "رؤية هندسية، لوجستيات مرنة، وأهداف استراتيجية من ألمانيا — ثم تفاصيل التشغيل للشركات.",
    "intro1": (
        "لم تبدأ TransPool24 كمجرد منصة للنقل، بل ولدت من رؤية هندسية تهدف إلى إعادة صياغة مفهوم «اللوجستيات المرنة». "
        "لقد اعتمدنا في تصميمنا على فلسفة البساطة الحديثة (Minimalist Modern) التي تدمج بين القوة المتمثلة في اللون الأزرق البروسي (Prussian Blue) "
        "والطاقة المتجددة في البرتقالي النابض، ليعكس موقعنا واجهة رقمية متطورة تليق بسمعة التكنولوجيا الألمانية. "
        "تصميمنا ليس مجرد جماليات، بل هو رحلة مستخدم مدروسة بعناية لتبسيط أكثر العمليات تعقيداً بضغطة زر واحدة."
    ),
    "intro2": (
        "وفي اتساق مع ما تثبته منصات اللوجستيات الرائدة عالمياً، نضع الشفافية والأتمتة والثقة المتبادلة بين العميل والسائق في صلب المنتج — "
        "تدفق واضح من الطلب إلى التسليم، لا وعوداً فارغة."
    ),
    "strategicTitle": "أهدافنا الاستراتيجية",
    "strategicLead": (
        "نحن نسعى لنكون الشريان الرقمي الذي يربط بين منطقة بفورتسهايم (Pforzheim) وكافة الولايات الاتحادية. "
        "هدفنا هو إلغاء الفجوات الزمنية واللوجستية في عمليات النقل البري عبر:"
    ),
    "bulletAutomation": "الأتمتة الكاملة: من التسعير اللحظي إلى تتبع الشحنات بالثانية.",
    "bulletTransparency": "الشفافية المطلقة: عبر أنظمة دفع عالمية آمنة تضمن حقوق كافة الأطراف.",
    "bulletSocial": "المسؤولية الاجتماعية: محاربة البطالة وبناء الكوادر.",
    "dailyOpsTitle": "التشغيل اليومي على أرض الواقع",
    "dailyOpsLead": "بين الحجز والاستلام والتسليم، يجب أن يعمل المسار في الواقع التشغيلي للشركات — لا في العروض التقديمية فقط.",
    "dailyOpsB1": "حالة واضحة للتصرف: من تأكيد الطلب إلى التسليم، مع التتبع وإثبات التسليم حيث يلزم.",
    "dailyOpsB2": "التسعير والدفع: عرض سعر قبل الدفع ودفع آمن عبر Stripe — خلافات أقل وتدفق نقدي أوضح.",
    "dailyOpsB3": "بفورتسهايم وألمانيا: شبكة سائقين موثوقين لشحنات الأعمال والنقل التجاري.",
    "csrTitle": "المسؤولية الاجتماعية والعمل",
    "csrLead": (
        "نحن ندرك أننا جزء لا يتجزأ من النسيج الاجتماعي للدولة الاتحادية الألمانية. لذا، فإن أحد أركان TransPool24 الأساسية هو المساهمة الفعالة في تنشيط سوق العمل:"
    ),
    "csrJobs": "خلق فرص عمل: من خلال فتح المجال أمام السائقين والمزودين المحليين للانضمام إلى شبكتنا الاحترافية.",
    "csrUnemployment": (
        "تخطي البطالة: نحن نؤمن بأن التكنولوجيا يجب أن تخدم الإنسان؛ لذا نساهم في دمج الكفاءات وتدريبها على استخدام أدواتنا الرقمية، "
        "مما يقلل من نسب البطالة ويخلق فرصاً اقتصادية مستدامة للشباب والمحترفين في بادن فورتمبيرغ وألمانيا قاطبة."
    ),
    "federalTitle": "جزء من الدولة الاتحادية",
    "federalP": (
        "بصفتنا شركة ألمانية المنشأ، نطمح لأن نكون نموذجاً يُحتذى به في الالتزام بالمعايير والجودة. نحن لا ننقل البضائع فحسب، بل ننقل الثقة، "
        "ونساهم في قوة الاقتصاد الألماني عبر تحويل اللوجستيات التقليدية إلى صناعة رقمية ذكية. نحن هنا لنكون شركاء في البناء، مساهمين في استقرار سوق العمل، "
        "وفخورين بكوننا جزءاً من مستقبل ألمانيا اللوجستي."
    ),
    "ctaPrefix": "نقلٌ أذكى، لمستقبلٍ أوضح.",
    "ctaLink": "احجز طلبك الآن",
}

DE = {
    "pageTitle": "Über uns",
    "operationalKicker": "TÄGLICHER BETRIEB FÜR UNTERNEHMEN & HANDEL",
    "metaTitle": "Über uns | TransPool24 — digitale Logistik aus Pforzheim",
    "metaDescription": "Technische Vision, flexible Logistik und strategische Ziele in Deutschland — gefolgt von operativen Details für B2B.",
    "intro1": (
        "TransPool24 begann nicht als „nur eine Buchungsseite“ für Transport, sondern aus einer technischen Vision: flexible Logistik neu zu denken. "
        "Unser Produkt folgt einem minimalistisch-modernen Ansatz — Preußischblau für Ruhe und Vertrauen, kräftiges Orange für Dynamik — "
        "damit die Plattform sowohl deutsche Technologie-Erwartungen als auch Klarheit im Tagesgeschäft trifft. "
        "Das Interface ist keine Deko: Es ist eine durchdachte Nutzerreise, die komplexe Abläufe in wenigen Klicks fassbar macht."
    ),
    "intro2": (
        "Wie führende digitale Logistikplattformen weltweit verankern wir Transparenz, Automatisierung und Vertrauen zwischen Auftraggeber und Fahrer — "
        "klarer Status, weniger Telefon-Ping-Pong, planbare Zahlungsflüsse."
    ),
    "strategicTitle": "Unsere strategischen Ziele",
    "strategicLead": (
        "Wir wollen das digitale Bindeglied sein, das Pforzheim mit allen Bundesländern verbindet — und Zeit- sowie Logistiklücken im Straßentransport schließt:"
    ),
    "bulletAutomation": "Volle Automatisierung: von der Moment-Preisfindung bis zu nachvollziehbarem Sendungs-Tracking.",
    "bulletTransparency": "Maximale Transparenz: sichere, internationale Zahlungswege, die alle Parteien schützen.",
    "bulletSocial": "Soziale Verantwortung: Arbeitsmarkt stärken und Kompetenzen im Feld aufbauen.",
    "dailyOpsTitle": "Täglicher Betrieb in der Praxis",
    "dailyOpsLead": "Zwischen Buchung, Abholung und Lieferung muss der Ablauf im realen Geschäftskunden-Alltag funktionieren — nicht nur auf Folien.",
    "dailyOpsB1": "Status zum Handeln: vom bestätigten Auftrag bis zur Zustellung, mit Sendungsverfolgung und Liefernachweis wo es relevant ist.",
    "dailyOpsB2": "Preis und Zahlung: Angebot vor der Zahlung und sicherer Stripe-Checkout — weniger Rückfragen, planbare Liquidität.",
    "dailyOpsB3": "Pforzheim und deutschlandweit: eingebundene Fahrer für gewerbliche Sendungen und operative Transporte.",
    "csrTitle": "Soziale Verantwortung: Jobs und Teilhabe",
    "csrLead": (
        "Wir sind Teil des gesellschaftlichen Gefüges in Deutschland. Die Aktivierung des Arbeitsmarktes ist für uns ein zentrales Standbein:"
    ),
    "csrJobs": (
        "Jobs schaffen: Fahrerinnen und lokale Dienstleister können sich einem professionellen, standards-basierten Netz anschließen."
    ),
    "csrUnemployment": (
        "Arbeitslosigkeit überwinden: Technologie soll Menschen dienen — wir investieren in Onboarding, digitale Werkzeuge und fairen Zugang, "
        "damit Fachkräfte in Baden-Württemberg und deutschlandweit nachhaltig verdienen können."
    ),
    "federalTitle": "Teil der Bundesrepublik",
    "federalP": (
        "Als in Deutschland verwurzeltes Unternehmen wollen wir Maßstäbe für Qualität und Compliance setzen. Wir bewegen nicht nur Güter — wir bewegen Vertrauen — "
        "und helfen, klassische Logistik in eine intelligentere digitale Industrie zu überführen. Partner beim Aufbau, Beitrag zu stabilen Arbeitsmärkten, "
        "stolz auf die Zukunft der Logistik in Deutschland."
    ),
    "ctaPrefix": "Smarter Transport für eine klarere Zukunft.",
    "ctaLink": "Jetzt buchen",
}

EN = {
    "pageTitle": "About us",
    "operationalKicker": "DAY-TO-DAY OPERATIONS FOR BUSINESSES & TRADE",
    "metaTitle": "About us | TransPool24 — digital logistics from Pforzheim",
    "metaDescription": "Engineering vision, flexible logistics, and strategic goals in Germany — plus operational detail for B2B shippers.",
    "intro1": (
        "TransPool24 did not start as “just” a transport booking page. It was born from an engineering vision: to redefine flexible logistics end to end. "
        "Our design follows a minimalist-modern philosophy — Prussian blue for calm authority, vibrant orange for momentum — "
        "so the product matches both German technology expectations and clarity under operational pressure. "
        "This is not decoration: it is a deliberate user journey that turns complex flows into steps you can finish in a few clicks."
    ),
    "intro2": (
        "Like leading digital logistics platforms worldwide, we build on transparency, automation, and mutual trust between customer and driver — "
        "clear status, fewer phone loops, predictable payments."
    ),
    "strategicTitle": "Our strategic goals",
    "strategicLead": (
        "We aim to be the digital artery linking Pforzheim with every federal state, closing time and logistics gaps in road transport through:"
    ),
    "bulletAutomation": "Full automation: from instant pricing to shipment tracking you can rely on.",
    "bulletTransparency": "Radical transparency: secure global payment systems that protect every party.",
    "bulletSocial": "Social responsibility: tackling unemployment and building workforce capability.",
    "dailyOpsTitle": "Day-to-day operations in practice",
    "dailyOpsLead": "Between booking, pickup and delivery, the process has to work in the real world — not only in a slide deck.",
    "dailyOpsB1": "Status you can act on: from confirmed booking to delivery, with tracking and proof of delivery where it matters.",
    "dailyOpsB2": "Pricing and payment: upfront quote and secure Stripe checkout — fewer disputes, predictable cash flow.",
    "dailyOpsB3": "Pforzheim and nationwide: a network of vetted drivers for B2B freight and commercial moves.",
    "csrTitle": "Social responsibility: jobs and employability",
    "csrLead": (
        "We are part of Germany’s social fabric. Activating the labour market is a core pillar for TransPool24:"
    ),
    "csrJobs": (
        "Creating jobs: opening the door for drivers and local providers to join a professional, standards-based network."
    ),
    "csrUnemployment": (
        "Moving past unemployment: technology should serve people — we help onboard and train teams on our digital tools, "
        "reducing friction in the labour market and creating sustainable opportunities across Baden-Württemberg and Germany."
    ),
    "federalTitle": "Part of the Federal Republic",
    "federalP": (
        "As a German-rooted company we aspire to lead on quality and compliance. We move not only goods — we move trust — "
        "and help turn traditional logistics into a smarter digital industry. Partners in growth, contributors to stable labour markets, "
        "proud to be part of Germany’s logistics future."
    ),
    "ctaPrefix": "Smarter transport for a clearer future.",
    "ctaLink": "Book now",
}

TR = {
    **EN,
    "pageTitle": "Hakkımızda",
    "operationalKicker": "İŞLETMELER VE TİCARET İÇİN GÜNLÜK OPERASYON",
    "metaTitle": "Hakkımızda | TransPool24 — Pforzheim’dan dijital lojistik",
    "metaDescription": "Mühendislik vizyonu, esnek lojistik ve Almanya’da stratejik hedefler — ardından B2B operasyonel ayrıntılar.",
    "intro1": (
        "TransPool24 yalnızca bir taşıma rezervasyon ekranı olarak doğmadı; uçtan uca esnek lojistiği yeniden tanımlayan bir mühendislik vizyonundan doğdu. "
        "Tasarımımız minimalist-modern bir çizgiyi takip eder — otorite için Prusya mavisi, dinamizm için canlı turuncu — "
        "böylece platform hem Alman teknoloji beklentilerine hem operasyonel baskı altında netliğe uygun olur. "
        "Arayüz süs değil; karmaşık süreçleri birkaç tıklamada tamamlanabilir kılan bilinçli bir kullanıcı yolculuğudur."
    ),
    "intro2": (
        "Dünyanın önde gelen dijital lojistik platformları gibi şeffaflık, otomasyon ve müşteri ile sürücü arasında karşılıklı güven üzerine kurarız."
    ),
    "strategicTitle": "Stratejik hedeflerimiz",
    "strategicLead": "Pforzheim’ı tüm eyaletlerle dijital bir omurgayla bağlamayı ve kara taşımacılığında zaman ile lojistik boşluklarını kapatmayı hedefliyoruz:",
    "bulletAutomation": "Tam otomasyon: anlık fiyatlandırmadan güvenilir gönderi takibine.",
    "bulletTransparency": "Tam şeffaflık: tüm tarafları koruyan güvenli küresel ödeme altyapıları.",
    "bulletSocial": "Sosyal sorumluluk: işsizlikle mücadele ve yetkinlik oluşturma.",
    "dailyOpsTitle": "Günlük operasyon pratikte",
    "dailyOpsLead": "Rezervasyon, yükleme ve teslimat arasında süreç gerçek iş dünyasında işlemeli — yalnızca sunumlarda değil.",
    "dailyOpsB1": "Harekete geçirilebilir durum: onaylı rezervasyondan teslimata, gerektiğinde takip ve teslim kanıtı ile.",
    "dailyOpsB2": "Fiyatlandırma ve ödeme: önceden net teklif ve güvenli Stripe ödemesi — daha az anlaşmazlık, öngörülebilir nakit akışı.",
    "dailyOpsB3": "Pforzheim ve Almanya geneli: B2B yük ve ticari taşımalar için doğrulanmış sürücü ağı.",
    "csrTitle": "Sosyal sorumluluk: iş ve istihdam",
    "csrLead": "Almanya’nın toplumsal dokusunun parçasıyız. İşgücü piyasasını canlandırmak temel önceliklerimizdendir:",
    "csrJobs": "İş yaratmak: sürücülerin ve yerel sağlayıcıların profesyonel ağımıza katılmasına açık kapı.",
    "csrUnemployment": (
        "İşsizliği aşmak: teknoloji insana hizmet etmeli — dijital araçlarımızda eğitim ve uyum sağlayarak Baden-Württemberg ve Almanya genelinde sürdürülebilir fırsatlar yaratırız."
    ),
    "federalTitle": "Federal Cumhuriyet’in parçası",
    "federalP": (
        "Almanya kökenli bir şirket olarak kalite ve uyumda örnek olmayı hedefliyoruz. Sadece yük taşımıyoruz — güven taşıyoruz — "
        "ve geleneksel lojistiği daha akıllı bir dijital sektöre dönüştürmeye yardım ediyoruz."
    ),
    "ctaPrefix": "Daha net bir gelecek için daha akıllı taşıma.",
    "ctaLink": "Şimdi rezervasyon yap",
}

FR = {
    **EN,
    "pageTitle": "À propos",
    "operationalKicker": "EXPLOITATION QUOTIDIENNE POUR LES ENTREPRISES ET LE COMMERCE",
    "metaTitle": "À propos | TransPool24 — logistique numérique depuis Pforzheim",
    "metaDescription": "Vision d’ingénierie, logistique flexible et objectifs stratégiques en Allemagne — puis le détail opérationnel B2B.",
    "intro1": (
        "TransPool24 n’a pas commencé comme un simple écran de réservation. Elle est née d’une vision d’ingénierie : repenser la logistique flexible de bout en bout. "
        "Notre design suit une philosophie minimaliste moderne — bleu de Prusse pour l’autorité, orange vif pour l’élan — "
        "afin de répondre aux attentes technologiques allemandes et à la clarté sous pression opérationnelle."
    ),
    "intro2": "Comme les grandes plateformes logistiques, nous bâtissons transparence, automatisation et confiance mutuelle.",
    "strategicTitle": "Nos objectifs stratégiques",
    "strategicLead": "Nous voulons être l’artère numérique reliant Pforzheim à tous les Länder, en réduisant les délais et ruptures logistiques :",
    "bulletAutomation": "Automatisation complète : du prix instantané au suivi fiable des envois.",
    "bulletTransparency": "Transparence : paiements mondiaux sécurisés qui protègent chaque partie.",
    "bulletSocial": "Responsabilité sociale : emploi et montée en compétences.",
    "dailyOpsTitle": "L’exploitation quotidienne sur le terrain",
    "dailyOpsLead": "Entre réservation, enlèvement et livraison, le parcours doit fonctionner dans la réalité opérationnelle — pas seulement sur des slides.",
    "dailyOpsB1": "Un statut actionnable : de la commande confirmée à la livraison, avec suivi et preuve de livraison lorsque c’est pertinent.",
    "dailyOpsB2": "Tarification et paiement : devis clair avant paiement et encaissement sécurisé Stripe — moins de litiges, trésorerie plus lisible.",
    "dailyOpsB3": "Pforzheim et toute l’Allemagne : un réseau de conducteurs intégrés pour fret B2B et flux commerciaux.",
    "csrTitle": "Responsabilité sociale : emploi",
    "csrLead": "Nous faisons partie du tissu social allemand. L’activation du marché du travail est essentielle :",
    "csrJobs": "Créer des emplois : ouvrir notre réseau professionnel aux conducteurs et prestataires locaux.",
    "csrUnemployment": "Réduire le chômage : la technologie doit servir les personnes — formation et accès équitable en Bade-Wurtemberg et en Allemagne.",
    "federalTitle": "Partie de la République fédérale",
    "federalP": "Entreprise ancrée en Allemagne, nous visons l’exemplarité qualité et conformité. Nous transportons la confiance, pas seulement les marchandises.",
    "ctaPrefix": "Un transport plus intelligent pour un avenir plus clair.",
    "ctaLink": "Réserver",
}

ES = {
    **EN,
    "pageTitle": "Sobre nosotros",
    "operationalKicker": "OPERACIÓN DIARIA PARA EMPRESAS Y COMERCIO",
    "metaTitle": "Sobre nosotros | TransPool24 — logística digital desde Pforzheim",
    "metaDescription": "Visión de ingeniería, logística flexible y objetivos estratégicos en Alemania — más el detalle operativo B2B.",
    "intro1": (
        "TransPool24 no nació como una simple pantalla de reserva. Nació de una visión de ingeniería: redefinir la logística flexible de extremo a extremo. "
        "Nuestro diseño sigue una filosofía minimalista moderna — azul prusiano para autoridad, naranja vibrante para impulso — "
        "alineada con las expectativas tecnológicas alemanas y la claridad bajo presión operativa."
    ),
    "intro2": "Como las plataformas líderes, basamos el producto en transparencia, automatización y confianza mutua.",
    "strategicTitle": "Nuestros objetivos estratégicos",
    "strategicLead": "Queremos ser la arteria digital que une Pforzheim con todos los estados federales, cerrando brechas de tiempo y logística:",
    "bulletAutomation": "Automatización completa: desde precio instantáneo hasta seguimiento fiable del envío.",
    "bulletTransparency": "Transparencia radical: pagos globales seguros que protegen a todas las partes.",
    "bulletSocial": "Responsabilidad social: empleo y capacitación.",
    "dailyOpsTitle": "Operación diaria en la práctica",
    "dailyOpsLead": "Entre reserva, recogida y entrega, el flujo debe funcionar en el día a día real — no solo en presentaciones.",
    "dailyOpsB1": "Estado con el que puedes actuar: desde la reserva confirmada hasta la entrega, con seguimiento y prueba de entrega cuando importa.",
    "dailyOpsB2": "Precio y pago: presupuesto claro antes de pagar y checkout seguro con Stripe — menos disputas, tesorería más predecible.",
    "dailyOpsB3": "Pforzheim y toda Alemania: red de conductores integrados para mercancía B2B y operaciones comerciales.",
    "csrTitle": "Responsabilidad social: empleo",
    "csrLead": "Somos parte del tejido social alemán. Activar el mercado laboral es un pilar central:",
    "csrJobs": "Crear empleo: conductores y proveedores locales en una red profesional con estándares claros.",
    "csrUnemployment": "Superar el desempleo: la tecnología debe servir a las personas — formación y acceso justo en Baden-Wurtemberg y Alemania.",
    "federalTitle": "Parte de la República Federal",
    "federalP": "Como empresa con raíces en Alemania aspiramos a liderar en calidad y cumplimiento. Movemos confianza, no solo mercancías.",
    "ctaPrefix": "Transporte más inteligente para un futuro más claro.",
    "ctaLink": "Reservar ahora",
}

# Remaining locales: English copy (professional baseline)
for name, blob in [
    ("ru.json", EN),
    ("pl.json", EN),
    ("ro.json", EN),
    ("uk.json", EN),
    ("it.json", EN),
    ("ku.json", EN),
]:
    pass  # handled in loop below

KU = {
    **EN,
    "dailyOpsTitle": "کارکردنی ڕۆژانە لە پراکتیکدا",
    "dailyOpsLead": "لەنێوان حیجزکردن و وەرگرتن و گەیاندن، ڕێڕەو دەبێت لە ژینگەی کارکردنی ڕاستەقینەدا کار بکات — تەنها لە پرزێنتەیشندا نەبێت.",
    "dailyOpsB1": "دۆخی کرداری: لە داواکاری پشتڕاستکراوەوە تا گەیاندن، بە شوێنپێهەڵگرتن و بەڵگەی گەیاندن کاتێک پێویستە.",
    "dailyOpsB2": "نرخ و پارەدان: پێشنیار پێش پارەدان و پارەدانی Stripeی پارێزراو — ناکۆکی کەمتر و ڕۆنی پارە.",
    "dailyOpsB3": "فۆرتسهایم و هەموو ئەڵمانیا: تۆڕی شۆفێرانی پشتڕاستکراو بۆ بارگەی B2B و گواستنەوەی بازرگانی.",
    "pageTitle": "دەربارەی ئێمە",
    "operationalKicker": "کارکردنی ڕۆژانە بۆ بازرگانی و کۆمپانیاکان",
    "metaTitle": "دەربارەی ئێمە | TransPool24",
    "metaDescription": "بینینی ئەندازیاری و لۆجستیکی دیجیتاڵ لە ئەڵمانیا.",
    "ctaPrefix": "گواستنەوەی زیرەکتر بۆ داهاتوویەکی ڕوونتر.",
    "ctaLink": "ئێستا حیجز بکە",
}

BY_FILE = {
    "ar.json": AR,
    "de.json": DE,
    "en.json": EN,
    "tr.json": TR,
    "fr.json": FR,
    "es.json": ES,
    "ru.json": EN,
    "pl.json": EN,
    "ro.json": EN,
    "uk.json": EN,
    "it.json": EN,
    "ku.json": KU,
}


def inject(path: Path, narrative: dict) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    if "aboutNarrative" in data:
        del data["aboutNarrative"]
    # Rebuild with aboutNarrative after "common"
    new_order: dict = {}
    for k, v in data.items():
        new_order[k] = v
        if k == "common":
            new_order["aboutNarrative"] = narrative
    path.write_text(json.dumps(new_order, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    for fname, narrative in BY_FILE.items():
        inject(MSG / fname, narrative)
    print("Injected aboutNarrative into", len(BY_FILE), "files")


if __name__ == "__main__":
    main()
