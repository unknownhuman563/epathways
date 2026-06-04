import { ChevronRight } from "lucide-react";

// A contact control used on the team profile card.
// Modes:
//   primary  → solid-green full-width call-to-action
//   compact  → small icon + label tile (for the 2-column grid)
//   default  → bordered full-width row with sublabel + chevron
// Pass `href` for a link (set `external` to open in a new tab) or `onClick`.
export default function ContactButton({
  icon: Icon,
  label,
  sublabel,
  href,
  onClick,
  external = false,
  primary = false,
  compact = false,
}) {
  const wrap = (className, content) =>
    href ? (
      <a
        href={href}
        className={className}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {content}
      </a>
    ) : (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );

  if (compact) {
    return wrap(
      "group flex items-center gap-3 rounded-2xl border border-gray-200/80 bg-white px-4 py-3.5 text-[#282728] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#436235]/40 hover:shadow-md active:translate-y-0",
      <>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#436235]/10 text-[#436235] transition-colors duration-300 group-hover:bg-[#436235] group-hover:text-white">
          {Icon ? <Icon className="h-4 w-4" /> : null}
        </span>
        <span className="truncate text-sm font-bold tracking-tight">{label}</span>
      </>
    );
  }

  const className = primary
    ? "group flex w-full items-center gap-4 rounded-2xl bg-[#436235] px-5 py-4 text-left text-white shadow-lg shadow-[#436235]/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#37501f] active:translate-y-0"
    : "group flex w-full items-center gap-4 rounded-2xl border border-gray-200/80 bg-white px-5 py-4 text-left text-[#282728] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#436235]/40 hover:shadow-md active:translate-y-0";

  const iconWrap = primary
    ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white"
    : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#436235]/10 text-[#436235] transition-colors duration-300 group-hover:bg-[#436235] group-hover:text-white";

  return wrap(
    className,
    <>
      <span className={iconWrap}>{Icon ? <Icon className="h-5 w-5" /> : null}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold tracking-tight">{label}</span>
        {sublabel ? (
          <span className={`block truncate text-xs ${primary ? "text-white/70" : "text-gray-400"}`}>
            {sublabel}
          </span>
        ) : null}
      </span>
      <ChevronRight
        className={`h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1 ${
          primary ? "text-white/80" : "text-gray-300"
        }`}
      />
    </>
  );
}
