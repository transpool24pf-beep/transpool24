/** Homepage / header wordmark: TransPool (navy) + 24 (orange), italic, no circular icon. */
export function BrandWordmark({
  className = "text-[1.45rem] sm:text-[1.65rem]",
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  return (
    <span
      className={`select-none whitespace-nowrap font-extrabold italic leading-none tracking-tight ${className}`}
    >
      <span className={onDark ? "text-white" : "text-[#1e4a7a]"}>TransPool</span>
      <span className="text-[#e85d04]">24</span>
    </span>
  );
}
