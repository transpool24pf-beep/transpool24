import { addGermanVat19, formatPrice, splitGermanVatFromGross } from "@/lib/pricing";

type Props = {
  /** Net quote (order preview). */
  netCents?: number;
  /** Stored customer total including VAT. */
  grossCents?: number;
  className?: string;
};

/**
 * German invoice-style net / MwSt. / brutto block.
 * Always LTR so “MwSt.” is not reversed in Arabic layouts.
 */
export function GermanVatPriceBlock({ netCents, grossCents, className = "" }: Props) {
  const parts =
    netCents != null && Number.isFinite(netCents)
      ? addGermanVat19(netCents)
      : splitGermanVatFromGross(grossCents ?? 0);

  return (
    <div
      dir="ltr"
      lang="de"
      className={`rounded-lg border border-[#0d2137]/10 bg-white px-4 py-3 text-left shadow-sm ${className}`}
    >
      <table className="w-full border-collapse text-sm tabular-nums">
        <tbody>
          <tr className="text-[#0d2137]/75">
            <td className="py-0.5 pr-3">Netto</td>
            <td className="py-0.5 text-right">{formatPrice(parts.netCents)}</td>
          </tr>
          <tr className="text-[#0d2137]/75">
            <td className="py-0.5 pr-3">zzgl. 19&nbsp;% MwSt.</td>
            <td className="py-0.5 text-right">{formatPrice(parts.vatCents)}</td>
          </tr>
          <tr className="border-t border-[#0d2137]/15">
            <td className="pt-2 pr-3 font-semibold text-[#0d2137]">Gesamtbetrag</td>
            <td className="pt-2 text-right text-xl font-bold text-[var(--accent)]">
              {formatPrice(parts.grossCents)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
