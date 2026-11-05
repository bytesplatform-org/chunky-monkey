import type { ReactNode } from "react";

const TONES = {
  light: "bg-cream text-night hover:bg-white",
  ghost: "border border-current/35 hover:border-current hover:bg-current/10",
  dark: "bg-night text-cream hover:bg-plum",
};

/** A call-to-action link. */
export default function CtaLink({
  href,
  children,
  tone = "light",
  external = false,
}: {
  href: string;
  children: ReactNode;
  tone?: keyof typeof TONES;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`inline-flex h-12 items-center rounded-lg px-5 text-[0.9375rem] font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${TONES[tone]}`}
    >
      {children}
    </a>
  );
}
