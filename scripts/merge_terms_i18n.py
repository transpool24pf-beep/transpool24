#!/usr/bin/env python3
"""Merge or replace namespace termsOfUse in messages/*.json — run from repo root: python3 scripts/merge_terms_i18n.py"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MSG = ROOT / "messages"

TERMS_DE = {
    "metaTitle": "Allgemeine Geschäftsbedingungen (AGB) | TransPool24",
    "metaDescription": "AGB für die Nutzung der Website und Online-Buchung von Transportleistungen bei TransPool24.",
    "breadcrumbHome": "Startseite",
    "breadcrumbCurrent": "AGB",
    "pageTitle": "Allgemeine Geschäftsbedingungen (AGB)",
    "pageLead": "Diese AGB regeln die Nutzung unserer Website, unseres Buchungsangebots für Transport- und Logistikleistungen sowie ergänzend die vertragliche Beziehung zwischen uns und gewerblichen oder privaten Kundinnen und Kunden, soweit nicht Individualvereinbarungen Vorrang haben.",
    "updated": "Stand: März 2026",
    "tocTitle": "Auf dieser Seite",
    "relatedTitle": "Weitere rechtliche Hinweise",
    "relatedBody": "Informationen zur Verarbeitung personenbezogener Daten finden Sie in unserer Datenschutzerklärung. Kontaktieren Sie uns bei Fragen über unser Support-Formular.",
    "relatedPrivacy": "Datenschutzerklärung",
    "relatedContact": "Kontakt / Support",
    "toc": {
        "scope": "1. Geltungsbereich",
        "contract": "2. Vertragspartner und Leistung",
        "booking": "3. Angebot und Vertragsschluss",
        "payment": "4. Preise und Zahlung",
        "conduct": "5. Pflichten der Kundin / des Kunden",
        "liability": "6. Haftung",
        "final": "7. Schlussbestimmungen",
    },
    "s1": {
        "title": "1. Geltungsbereich",
        "p1": "Anbieter ist TransPool24 (im Folgenden „wir“). Maßgeblich sind diese AGB in der jeweils auf der Website veröffentlichten Fassung sowie — soweit anwendbar — gesetzliche Regelungen, insbesondere des Bürgerlichen Gesetzbuchs (BGB).",
        "p2": "Abweichende oder entgegenstehende Bedingungen des Kunden erkennen wir nicht an, es sei denn, wir stimmen ihrer Geltung ausdrücklich schriftlich zu.",
        "p3": "Verbraucher im Sinne dieser AGB ist jede natürliche Person, die ein Rechtsgeschäft zu überwiegend privaten Zwecken abschließt.",
    },
    "s2": {
        "title": "2. Vertragspartner und Leistungsbeschreibung",
        "p1": "Wir vermitteln bzw. erbringen Transport- und Logistikdienstleistungen — je nach konkretem Auftrag — mit Schwerpunkt Pforzheim und Umgebung. Umfang, Strecke, Zeitfenster und Preis ergeben sich aus der Buchung bzw. dem Angebot im Bestellprozess sowie etwaigen schriftlichen Bestätigungen.",
        "p2": "Sofern Dritte (z. B. Subunternehmer oder eingesetzte Fahrerinnen und Fahrer) zur Leistungserbringung hinzugezogen werden, bleiben wir — soweit vertraglich vereinbart — Ihr erster Ansprechpartner, sofern nicht ausdrücklich anders gekennzeichnet.",
    },
    "s3": {
        "title": "3. Angebot, Buchung und Vertragsschluss",
        "p1": "Darstellungen auf der Website und im Buchungsablauf stellen eine Einladung zur Abgabe eines Angebots durch die Kundin / den Kunden dar. Der Vertrag kommt durch unsere Annahme der Buchung bzw. eine Auftragsbestätigung zustande, sofern im jeweiligen Prozess nicht ausdrücklich etwas Abweichendes angezeigt wird.",
        "p2": "Die Kundin / der Kunde ist verpflichtet, bei der Buchung wahrheitsgemäße und vollständige Angaben zu Ladung, Adressen, Kontaktdaten und Besonderheiten (z. B. Zugangsbeschränkungen) zu machen. Nachträgliche Änderungen können zu Preis- oder Terminanpassungen führen.",
        "p3": "Stornierungen und Umbuchungen richten sich nach den zum Zeitpunkt der Buchung mitgeteilten Regelungen sowie dem Gesetz, soweit die Kundin / der Kunde Verbraucherin oder Verbraucher ist.",
    },
    "s4": {
        "title": "4. Preise, Zahlung, Zahlungsdienstleister",
        "p1": "Die angezeigten Preise verstehen sich — sofern nicht anders gekennzeichnet — in Euro und enthalten die gesetzliche Umsatzsteuer, soweit diese anfällt. Abweichungen können sich aus Route, Zusatzleistungen, Wartezeiten oder Sonderaufwand ergeben.",
        "p2": "Die Abwicklung von Kartenzahlungen kann über den Zahlungsdienstleister Stripe erfolgen. Es gelten ergänzend die jeweiligen Nutzungsbedingungen von Stripe. Ein Zurückbehaltungsrecht steht der Kundin / dem Kunden nur zu, soweit der Gegenanspruch auf demselben Vertragsverhältnis beruht.",
    },
    "s5": {
        "title": "5. Mitwirkungspflichten, Ladung, Sicherheit",
        "p1": "Die Kundin / der Kunde stellt sicher, dass die Ladung den angegebenen Angaben entspricht, ordnungsgemäß verpackt ist und keine gesetzlichen oder vertraglichen Transportverbote verletzt.",
        "p2": "Anweisungen der eingesetzten Person vor Ort — soweit sie der Verkehrssicherheit oder ordnungsgemäßer Durchführung dienen — sind zu befolgen. Bei grob fahrlässiger oder vorsätzlicher Falschangaben oder Gefährdung können wir den Auftrag ablehnen oder abbrechen; § 314 BGB bleibt für Verbraucher unberührt.",
    },
    "s6": {
        "title": "6. Haftung",
        "p1": "Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Verletzung von Leben, Körper oder Gesundheit. Bei leichter Fahrlässigkeit haften wir nur bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten); in diesem Fall ist die Haftung auf den typischerweise vorhersehbaren Schaden begrenzt.",
        "p2": "Eine weitergehende Haftung ist ausgeschlossen, soweit gesetzlich zulässig. Dies gilt insbesondere für mittelbare Schäden und entgangenen Gewinn, sofern nicht zwingendes Haftungsrecht entgegensteht.",
        "p3": "Haftungsbeschränkungen gelten nicht, soweit wir eine Garantie übernommen haben oder Ansprüche nach dem Produkthaftungsgesetz oder bei Arglist bestehen.",
    },
    "s7": {
        "title": "7. Schlussbestimmungen",
        "p1": "Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts, soweit nicht zwingendes Verbraucherschutzrecht des Staates, in dem der Verbraucher seinen gewöhnlichen Aufenthalt hat, Vorrang hat.",
        "p2": "Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Regelungen unberührt. An die Stelle der unwirksamen Bestimmung tritt — soweit möglich — eine wirksame Regelung, die dem wirtschaftlichen Zweck am nächsten kommt.",
        "p3": "Wir behalten uns vor, diese AGB zu aktualisieren. Für laufende Verträge gilt die zum Vertragsschluss maßgebliche Fassung, sofern gesetzlich nichts anderes vorschreibt.",
    },
}

TERMS_EN = {
    "metaTitle": "Terms of Use | TransPool24",
    "metaDescription": "Terms governing use of the TransPool24 website and online booking for transport services.",
    "breadcrumbHome": "Home",
    "breadcrumbCurrent": "Terms",
    "pageTitle": "Terms of Use",
    "pageLead": "These terms govern your use of our website and our online booking for transport and logistics services, and — where applicable — the contractual relationship between us and business or private customers, unless individual agreements take precedence.",
    "updated": "Last updated: March 2026",
    "tocTitle": "On this page",
    "relatedTitle": "Related legal information",
    "relatedBody": "For how we process personal data, see our privacy policy. Contact us via support if you have questions.",
    "relatedPrivacy": "Privacy policy",
    "relatedContact": "Contact / support",
    "toc": {
        "scope": "1. Scope",
        "contract": "2. Contracting party and service",
        "booking": "3. Offer and conclusion of contract",
        "payment": "4. Prices and payment",
        "conduct": "5. Customer obligations",
        "liability": "6. Liability",
        "final": "7. Final provisions",
    },
    "s1": {
        "title": "1. Scope",
        "p1": "The provider is TransPool24 (“we”). These terms in the version published on the website apply, together with applicable law, in particular the German Civil Code (BGB), where relevant.",
        "p2": "We do not accept conflicting or additional customer terms unless we expressly agree in writing.",
        "p3": "A “consumer” means any natural person entering into a transaction predominantly for private purposes.",
    },
    "s2": {
        "title": "2. Contracting party and description of services",
        "p1": "We arrange and/or perform transport and logistics services depending on the specific order, with a focus on Pforzheim and the region. Scope, route, time window and price follow from the booking or checkout flow and any written confirmations.",
        "p2": "If third parties (e.g. subcontractors or drivers) assist in performance, we remain — where contractually agreed — your primary contact unless clearly stated otherwise.",
    },
    "s3": {
        "title": "3. Offer, booking and contract formation",
        "p1": "Website and booking flow content constitutes an invitation for you to make an offer. A contract is formed when we accept your booking or confirm the order, unless the process expressly states otherwise.",
        "p2": "You must provide accurate and complete information on cargo, addresses, contact details and special circumstances (e.g. access limits). Later changes may affect price or schedule.",
        "p3": "Cancellations and rescheduling follow the rules communicated at booking time and applicable statutory consumer rights where you are a consumer.",
    },
    "s4": {
        "title": "4. Prices, payment, payment provider",
        "p1": "Prices are in euros unless stated otherwise and include VAT where applicable. Deviations may arise from route, extras, waiting time or special effort.",
        "p2": "Card payments may be processed via Stripe; Stripe’s terms apply additionally. Rights of retention exist only for counterclaims from the same contract relationship.",
    },
    "s5": {
        "title": "5. Cooperation, cargo, safety",
        "p1": "You ensure the cargo matches your declarations, is properly packed and does not violate legal or contractual transport prohibitions.",
        "p2": "You must follow reasonable instructions on site relating to safety or proper execution. We may refuse or abort an order in case of grossly negligent or intentional misrepresentation or danger; mandatory consumer law (e.g. § 314 BGB) remains unaffected.",
    },
    "s6": {
        "title": "6. Liability",
        "p1": "We are fully liable for intent and gross negligence and for injury to life, body or health. For ordinary negligence we are liable only for breach of essential contractual duties; liability is then limited to typically foreseeable damage.",
        "p2": "Further liability is excluded to the extent permitted by law, in particular for indirect damage and lost profit unless mandatory law provides otherwise.",
        "p3": "The above does not apply where we have assumed a guarantee, or for product liability or fraud.",
    },
    "s7": {
        "title": "7. Final provisions",
        "p1": "German law applies to the exclusion of the UN Sales Convention, without prejudice to mandatory consumer protection of the country where the consumer habitually resides.",
        "p2": "If individual provisions are or become invalid, the remainder stays effective; invalid terms are replaced where possible by a valid provision closest in economic purpose.",
        "p3": "We may update these terms. For ongoing contracts, the version effective at contract formation applies unless law requires otherwise.",
    },
}

TERMS_AR = {
    "metaTitle": "شروط الاستخدام | TransPool24",
    "metaDescription": "شروط استخدام موقع TransPool24 وحجز خدمات النقل عبر الإنترنت.",
    "breadcrumbHome": "الرئيسية",
    "breadcrumbCurrent": "الشروط",
    "pageTitle": "شروط الاستخدام",
    "pageLead": "تنظّم هذه الشروط استخدامكم لموقعنا وحجز خدمات النقل واللوجستيات عبر الإنترنت، وتنطبق — حيث ينطبق — على العلاقة التعاقدية بيننا وبين العملاء الأفراد أو التجار، ما لم يُتفق كتابةً على خلاف ذلك.",
    "updated": "آخر تحديث: مارس 2026",
    "tocTitle": "في هذه الصفحة",
    "relatedTitle": "معلومات قانونية ذات صلة",
    "relatedBody": "لمعرفة كيفية معالجة البيانات الشخصية، راجعوا سياسة الخصوصية. للاستفسارات تواصلوا عبر صفحة الدعم.",
    "relatedPrivacy": "سياسة الخصوصية",
    "relatedContact": "اتصل بنا / الدعم",
    "toc": {
        "scope": "1. النطاق",
        "contract": "2. الطرف التعاقدي والخدمة",
        "booking": "3. العرض وإبرام العقد",
        "payment": "4. الأسعار والدفع",
        "conduct": "5. التزامات العميل",
        "liability": "6. المسؤولية",
        "final": "7. أحكام ختامية",
    },
    "s1": {
        "title": "1. النطاق",
        "p1": "مقدّم الخدمة هو TransPool24 («نحن»). تسري هذه الشروط بالصيغة المنشورة على الموقع، مع القوانين المعمول بها — ولا سيما القانون المدني الألماني (BGB) حيث ينطبق.",
        "p2": "لا نعتمد شروطاً تعاقدية للعميل تتعارض مع شروطنا ما لم نوافق عليها صراحةً كتابةً.",
        "p3": "المستهلك: أي شخص طبيعي يبرم تعاملاً لأغراض خاصة في الغالب.",
    },
    "s2": {
        "title": "2. الطرف التعاقدي ووصف الخدمة",
        "p1": "نرتّب و/أو ننفّذ خدمات نقل ولوجستيات حسب كل طلب، مع تركيز على بفورتسهايم والمنطقة. تُستخلص الأهمية والمسار والوقت والسعر من مسار الحجز أو الطلب وأي تأكيدات.",
        "p2": "إذا شارك أطراف ثالثون (مثل مقاولين من الباطن أو سائقين) في التنفيذ، نبقى — حيث يُتفق على ذلك — جهة الاتصال الأولى ما لم يُذكر خلاف ذلك صراحةً.",
    },
    "s3": {
        "title": "3. العرض والحجز وإبرام العقد",
        "p1": "محتوى الموقع ومسار الحجز يُعد دعوة لتقديم عرض. يُبرَم العقد بقبولنا للحجز أو بتأكيد الطلب، ما لم يُعرض خلاف ذلك صراحةً.",
        "p2": "يلتزم العميل بتقديم معلومات صحيحة وكاملة عن الشحنة والعناوين وبيانات الاتصال والظروف الخاصة (مثل قيود الوصول). قد تؤثر التعديلات لاحقاً على السعر أو الموعد.",
        "p3": "الإلغاء وإعادة الجدولة تخضع للقواعد المُعلَنة عند الحجز وللحقوق الإلزامية للمستهلك حيث ينطبق.",
    },
    "s4": {
        "title": "4. الأسعار والدفع ومقدم الدفع",
        "p1": "الأسعار باليورو ما لم يُذكر غير ذلك وتشمل ضريبة القيمة المضافة حيث تنطبق. قد تختلف الأسعار حسب المسار والإضافات أو وقت الانتظار أو الجهد الإضافي.",
        "p2": "قد تُعالج المدفوعات بالبطاقة عبر Stripe؛ وتسري أيضاً شروط Stripe. حق الحبس يقتصر على المطالبات المرتبطة بنفس العلاقة التعاقدية.",
    },
    "s5": {
        "title": "5. التعاون والشحنة والسلامة",
        "p1": "يضمن العميل مطابقة الشحنة للبيانات وتعبئتها السليمة وعدم مخالفة حظر نقل قانوني أو تعاقدي.",
        "p2": "يجب اتباع التعليمات المعقولة في الموقع المتعلقة بالسلامة أو التنفيذ السليم. يجوز لنا رفض الطلب أو إيقافه عند تضليل جسيم أو خطر متعمد؛ دون الإخلال بالقانون الإلزامي للمستهلك.",
    },
    "s6": {
        "title": "6. المسؤولية",
        "p1": "نتحمل مسؤولية كاملة عن العمد والخطأ الجسيم وعن إصابة الحياة أو الجسد أو الصحة. عن الخطأ العادي نتحمل المسؤولية فقط عند إخلال بالتزامات تعاقدية جوهرية؛ وتقتصر المسؤولية على الضرر المتوقع عادةً.",
        "p2": "تستبعد مسؤولية أوسع حيث يسمح القانون، ولا سيما الأضرار غير المباشرة وفقدان الربح ما لم ينص القانون الإلزامي خلاف ذلك.",
        "p3": "لا يسري الحصر السابق حيث تُفترض ضمانة أو مسؤولية منتج أو غش.",
    },
    "s7": {
        "title": "7. أحكام ختامية",
        "p1": "يخضع العقد لقانون جمهورية ألمانيا مع استبعاد اتفاقية الأمم المتحدة لبيع البضائع، دون الإخلال بحماية المستهلك الإلزامية في بلد إقامته المعتاد.",
        "p2": "إذا بطُل بند، تبقى البنود الأخرى نافذة؛ ويُستبدل البند الباطل حيث أمكن بما يحقق الغرض الاقتصادي الأقرب.",
        "p3": "يجوز لنا تحديث هذه الشروط. للعقود الجارية تسري النسخة السارية عند إبرام العقد ما لم يفرض القانون خلاف ذلك.",
    },
}

LOCALE_TERMS = {
    "de": TERMS_DE,
    "en": TERMS_EN,
    "ar": TERMS_AR,
    "tr": TERMS_EN,
    "fr": TERMS_EN,
    "es": TERMS_EN,
    "ru": TERMS_EN,
    "pl": TERMS_EN,
    "ro": TERMS_EN,
    "ku": TERMS_EN,
    "it": TERMS_EN,
    "uk": TERMS_EN,
}


def main() -> None:
    for loc, terms in LOCALE_TERMS.items():
        path = MSG / f"{loc}.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        data["termsOfUse"] = terms
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("updated", path.name)


if __name__ == "__main__":
    main()
