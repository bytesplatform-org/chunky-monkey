import { nav, site } from "@/data/site";

const WORD = "Chunky Monkey";
const LIT = ["hover:text-red", "hover:text-yellow", "hover:text-green", "hover:text-blue", "hover:text-pink", "hover:text-orange"];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden px-(--gut) pb-8 pt-[clamp(80px,10vw,140px)]">
      <div className="grid gap-10 border-b border-cream/10 pb-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <p className="max-w-sm text-lg text-cream/70">
          A nationwide brand by Pioneer Amusement Services (Pvt.) Ltd, a subsidiary of the Dolmen Group.
        </p>
        <nav aria-label="Footer" className="flex flex-col gap-2">
          <span className="eyebrow mb-2 text-cream/45">Explore</span>
          {nav.map(item => <a key={item.href} href={item.href} className="w-fit hover:text-yellow">{item.label}</a>)}
        </nav>
        <div className="flex flex-col gap-2">
          <span className="eyebrow mb-2 text-cream/45">Follow</span>
          {Object.entries(site.social).map(([name, href]) => (
            <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="w-fit hover:text-yellow">{name}</a>
          ))}
          <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="w-fit hover:text-yellow">WhatsApp</a>
        </div>
      </div>

      {/* every letter lights up in a different colour on hover */}
      <p aria-label={WORD} className="display mt-10 flex flex-wrap justify-center text-[clamp(4rem,15.5vw,18rem)] leading-[0.8] text-cream/10">
        {WORD.split("").map((ch, i) => (
          <span key={i} aria-hidden className={`transition-colors duration-200 hover:duration-0 ${LIT[i % LIT.length]} ${ch === " " ? "w-[0.25em]" : ""}`}>{ch}</span>
        ))}
      </p>

      <div className="mt-10 flex flex-col justify-between gap-4 text-sm text-cream/50 sm:flex-row">
        <span>© 2026 Chunky Monkey. Fun for all.</span>
        <a href="#top" className="hover:text-cream">Back to the top ↑</a>
      </div>
    </footer>
  );
}
