import { formatPrice } from "@/lib/pricing";

type Props = {
  /** Quote from the order calculator (no VAT added). */
  netCents?: number;
  /** Stored customer total. */
  grossCents?: number;
  className?: string;
};

/** Single total (Kleinunternehmer / no MwSt. line). Always LTR for Arabic layouts. */
export function GermanVatPriceBlock({ netCents, grossCents, className = "" }: Props) {
  const cents =
    netCents != null && Number.isFinite(netCents)
      ? netCents
      : grossCents ?? 0;

  return (
    <div
      dir="ltr"
      lang="de"
      className={`rounded-lg border border-[#0d2137]/10 bg-white px-4 py-3 text-left shadow-sm ${className}`}
    >
      <table className="w-full border-collapse text-sm tabular-nums">
        <tbody>
          <tr>
            <td className="pr-3 font-semibold text-[#0d2137]">Gesamtbetrag</td>
            <td className="text-right text-xl font-bold text-[var(--accent)]">{formatPrice(cents)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
