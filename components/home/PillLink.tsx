import type { ReactNode } from "react";
import Magnetic from "./Magnetic";

const TONES = {
  yellow: "bg-yellow text-night hover:bg-cream",
  red: "bg-red text-cream hover:bg-cream hover:text-night",
  ghost: "border border-cream/40 text-cream hover:bg-cream hover:text-night",
  dark: "bg-night text-cream hover:bg-plum",
};

/** A rounded call-to-action link that leans toward the cursor. */
export default function PillLink({
  href,
  children,
  tone = "yellow",
  external = false,
}: {
  href: string;
  children: ReactNode;
  tone?: keyof typeof TONES;
  external?: boolean;
}) {
  return (
    <Magnetic>
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className={`group inline-flex h-13 items-center gap-3 rounded-full px-6 text-sm font-semibold uppercase tracking-[0.12em] transition-colors duration-300 ${TONES[tone]}`}
      >
        {children}
        <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 transition-transform duration-300 group-hover:translate-x-1">
          <path d="M1 8h13M9 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </a>
    </Magnetic>
  );
}
