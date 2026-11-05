import type { ReactNode } from "react";

const TONES = {
  yellow: "bg-yellow text-night hover:bg-[#ffd566]",
  cream: "bg-cream text-night hover:bg-white",
  blue: "bg-blue text-cream hover:bg-[#4560f5]",
};

/** A call-to-action link, built like an arcade button. */
export default function CtaLink({
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
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`chunky inline-flex h-13 items-center rounded-2xl px-6 font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current ${TONES[tone]}`}
    >
      {children}
    </a>
  );
}
