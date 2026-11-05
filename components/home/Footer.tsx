import { nav, site } from "@/data/site";

const WORD = "Chunky Monkey";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-night px-(--gut) pb-8 pt-[clamp(110px,12vw,180px)] text-cream">
      <div aria-hidden className="awning awning-candy" />
      <div className="grid gap-10 border-b-2 border-cream/25 pb-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <p className="max-w-sm text-lg">
          A nationwide brand by Pioneer Amusement Services (Pvt.) Ltd, a subsidiary of the Dolmen Group.
        </p>
        <nav aria-label="Footer" className="flex flex-col gap-2">
          <span className="eyebrow mb-2 text-cream/80">Explore</span>
          {nav.map(item => <a key={item.href} href={item.href} className="w-fit hover:text-yellow">{item.label}</a>)}
          <a href={site.links.booking} target="_blank" rel="noopener noreferrer" className="w-fit hover:text-yellow">Book Event</a>
        </nav>
        <div className="flex flex-col gap-2">
          <span className="eyebrow mb-2 text-cream/80">Follow</span>
          {Object.entries(site.social).map(([name, href]) => (
            <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="w-fit hover:text-yellow">{name}</a>
          ))}
          <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="w-fit hover:text-yellow">WhatsApp</a>
        </div>
      </div>

      <p className="display mt-10 text-center text-[clamp(4rem,15.5vw,18rem)] leading-[0.8] text-yellow">{WORD}</p>

      <div className="mt-10 flex flex-col justify-between gap-4 text-sm text-cream/85 sm:flex-row">
        <span>© 2026 Chunky Monkey. Fun for all.</span>
        <a href="#top" className="hover:text-yellow">Back to the top ↑</a>
      </div>
    </footer>
  );
}
