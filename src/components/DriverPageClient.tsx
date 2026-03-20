"use client";

import { useState } from "react";
import Image from "next/image";
import { DriverWizardForm } from "./DriverWizardForm";

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Ab welchem Alter kann ich als Fahrer arbeiten?",
    a: "Sie müssen mindestens 18 Jahre alt sein und einen gültigen Führerschein besitzen.",
  },
  {
    q: "Wie wird bei TransPool24 bezahlt?",
    a: "Wir arbeiten stundenweise – abhängig von Distanz sowie Lade- und Entladezeit, transparent und nachvollziehbar.",
  },
  {
    q: "Meine Stadt steht nicht in der Liste – kann ich mich bewerben?",
    a: "Ja. Wählen Sie „Sonstige“ und nennen Sie Ihre Stadt in den Notizen – wir melden uns.",
  },
  {
    q: "Brauche ich ein eigenes Fahrzeug?",
    a: "Sie können als reiner Fahrer, mit Fahrzeug oder mit Fahrzeug und Helfer arbeiten – je nach Einsatz.",
  },
  {
    q: "Wie erreiche ich Sie?",
    a: "Nach Ihrer Bewerbung prüfen wir Ihre Daten und kontaktieren Sie per E-Mail oder Telefon.",
  },
];

export function DriverPageClient({ locale }: { locale: string }) {
  const [showForm, setShowForm] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const scrollToApply = () => {
    setShowForm(true);
    setTimeout(() => document.getElementById("driver-form")?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  return (
    <main className="bg-[#f6f7fb]" lang={locale}>
      {!showForm ? (
        <>
          <section className="overflow-hidden bg-[#f6f4ef]">
            <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
              <div className="max-w-xl">
                <h1 className="text-4xl font-bold leading-tight text-[var(--accent)] sm:text-5xl">
                  Werden Sie Teil des TransPool24-Zustellteams
                </h1>
                <p className="mt-5 text-lg leading-8 text-[#0d2137]">
                  Fahren Sie für uns – fairer Stundenlohn plus Trinkgeld.
                </p>
                <button
                  type="button"
                  onClick={scrollToApply}
                  className="mt-8 rounded-xl bg-[var(--accent)] px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:opacity-90"
                >
                  Jetzt bewerben
                </button>
                <p className="mt-4 text-sm text-[#0d2137]/70">
                  * Beispiel: Grundlohn plus Auftragsboni bei Vollzeit-Einsatz.
                </p>
              </div>
              <div className="relative">
                <div className="overflow-hidden rounded-[2rem] bg-[#ff8a00] p-4 shadow-2xl">
                  <Image
                    src="/images/van2.png"
                    alt="TransPool24 Fahrzeug"
                    width={900}
                    height={620}
                    className="h-[360px] w-full rounded-[1.5rem] object-cover"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl bg-[#e3f2fd] p-6">
                <div className="mb-3 text-3xl">💻</div>
                <h2 className="text-lg font-semibold text-[#0d2137]">Fairer Lohn: Stundenlohn plus Extras</h2>
                <p className="mt-2 text-sm text-[#0d2137]/80">
                  Klarer Stundenlohn, Vergütung von Wartezeiten und Trinkgeld.
                </p>
              </div>
              <div className="rounded-2xl bg-[#fff8e1] p-6">
                <div className="mb-3 text-3xl">🪪</div>
                <h2 className="text-lg font-semibold text-[#0d2137]">Sichere Zusammenarbeit</h2>
                <p className="mt-2 text-sm text-[#0d2137]/80">Klare Absprachen, pünktliche Zahlungen, Support bei Fragen.</p>
              </div>
              <div className="rounded-2xl bg-[#fce4ec] p-6">
                <div className="mb-3 text-3xl">👥</div>
                <h2 className="text-lg font-semibold text-[#0d2137]">Flexibilität</h2>
                <p className="mt-2 text-sm text-[#0d2137]/80">Vollzeit oder nebenberuflich – Sie wählen Ihre Einsatzzeiten.</p>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="text-center text-2xl font-bold text-[#0d2137]">Das brauchen Sie zum Start</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <div className="text-2xl">🛵</div>
                <h3 className="mt-2 font-semibold text-[#0d2137]">Unterlagen</h3>
                <p className="mt-1 text-sm text-[#0d2137]/70">Gültiger Ausweis, Führerschein, Fahrzeug nach Vorschrift versichert.</p>
              </div>
              <div>
                <div className="text-2xl">⏱</div>
                <h3 className="mt-2 font-semibold text-[#0d2137]">Fahrzeug oder Rad</h3>
                <p className="mt-1 text-sm text-[#0d2137]/70">Einsatz mit eigenem Fahrzeug; Kilometer werden berücksichtigt.</p>
              </div>
              <div>
                <div className="text-2xl">🎉</div>
                <h3 className="mt-2 font-semibold text-[#0d2137]">Erfahrung</h3>
                <p className="mt-1 text-sm text-[#0d2137]/70">Keine Pflicht-Erfahrung – Zuverlässigkeit zählt.</p>
              </div>
              <div>
                <div className="text-2xl">📦</div>
                <h3 className="mt-2 font-semibold text-[#0d2137]">Motivation</h3>
                <p className="mt-1 text-sm text-[#0d2137]/70">Freude am Fahren und am Kontakt mit Kunden.</p>
              </div>
            </div>
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={scrollToApply}
                className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-4 font-semibold text-white shadow-lg transition hover:opacity-90"
              >
                <span>→</span> Jetzt bewerben
              </button>
            </div>
          </section>

          <section className="bg-white py-14">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <h2 className="text-center text-3xl font-bold text-[var(--accent)]">Ablauf der Bewerbung</h2>
              <div className="mt-12 grid gap-8 md:grid-cols-3">
                <div className="text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#e3f2fd] text-3xl">📱</div>
                  <p className="mt-4 text-sm font-medium text-[#0d2137]">
                    1. Formular ausfüllen. 2. Unterlagen vorbereiten.
                  </p>
                </div>
                <div className="text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fff8e1] text-3xl">📄</div>
                  <p className="mt-4 text-sm font-medium text-[#0d2137]">
                    3. Kurzes Gespräch. 4. Bei Passung erhalten Sie ein Angebot.
                  </p>
                </div>
                <div className="text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fce4ec] text-3xl">🛞</div>
                  <p className="mt-4 text-sm font-medium text-[#0d2137]">
                    5. Ausrüstung & Plan. 6. Am ersten Tag begleiten wir Sie.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-center text-2xl font-bold text-[#0d2137]">Stimmen aus dem Team</h2>
            <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-[#0d2137]/10 bg-white p-8 shadow-sm">
              <p className="text-lg text-[#0d2137]/90">
                „Die Zusammenarbeit mit TransPool24 ist flexibel und klar – besonders abends und am Wochenende.“
              </p>
              <p className="mt-4 font-semibold text-[#0d2137]">— Fahrer aus Pforzheim</p>
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
                <span>→</span> Jetzt bewerben
              </button>
            </div>
          </section>

          <section className="bg-white py-14">
            <div className="mx-auto max-w-3xl px-4 sm:px-6">
              <h2 className="text-center text-2xl font-bold text-[#0d2137]">Häufige Fragen</h2>
              <div className="mt-8 space-y-2">
                {FAQ_ITEMS.map((item, i) => (
                  <div key={i} className="rounded-xl border border-[#0d2137]/10 bg-[#f8f9fa]">
                    <button
                      type="button"
                      onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                      className="flex w-full items-center justify-between px-5 py-4 text-left font-medium text-[#0d2137]"
                    >
                      {item.q}
                      <span className="text-xl text-[var(--accent)]">{faqOpen === i ? "−" : "+"}</span>
                    </button>
                    {faqOpen === i && (
                      <div className="border-t border-[#0d2137]/10 px-5 py-4 text-sm text-[#0d2137]/80">{item.a}</div>
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
                  <span>→</span> Jetzt bewerben
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
