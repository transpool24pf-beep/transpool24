type Props = {
  label: string;
  children: React.ReactNode;
  className?: string;
};

/** Subtle container so ads match the site instead of floating raw blocks. */
export function AdFrame({ label, children, className = "" }: Props) {
  return (
    <div
      className={`rounded-xl border border-[#0d2137]/10 bg-[#f4f6f8]/90 p-2 shadow-sm backdrop-blur-sm ${className}`}
      aria-label={label}
    >
      <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-wider text-[#0d2137]/45">
        {label}
      </p>
      <div className="flex justify-center overflow-hidden rounded-lg bg-white/80">
        {children}
      </div>
    </div>
  );
}
