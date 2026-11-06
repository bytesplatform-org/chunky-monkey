import { attractions, site } from "@/data/site";
import CtaLink from "./CtaLink";
import LiquidImage from "./LiquidImage";
import { Star } from "./Deco";

/** Four big cards that stack up over each other as the page scrolls. */
export default function Attractions() {
  return (
    <section id="attractions" className="relative px-(--gut) pb-[clamp(80px,10vw,150px)] pt-[clamp(80px,9vw,130px)]">
      <Star color="var(--color-pink)" className="right-[7%] top-[60px] w-[clamp(44px,6vw,88px)]" />
      <h2 data-reveal className="display max-w-[14ch] text-[clamp(3.2rem,8vw,8rem)]">
        There&apos;s more than rides.
      </h2>
      <div className="mt-[clamp(40px,5vw,72px)] flex flex-col gap-6">
        {attractions.map((a, i) => (
          <article
            key={a.name}
            className="-mx-[3px] grid overflow-hidden rounded-[32px] border-[3px] border-cream bg-night p-3.5 text-cream md:sticky md:min-h-[min(60lvh,520px)] md:grid-cols-2"
            style={{ top: `${72 + i * 14}px` }}
          >
            <LiquidImage src={a.image} alt={a.name} sizes="(min-width: 768px) 48vw, 92vw" className={`aspect-[4/3] rounded-[16px] md:aspect-auto ${i % 2 ? "md:order-2" : ""}`} />
            <div className="flex flex-col justify-between gap-8 px-[clamp(12px,3.4vw,48px)] py-[clamp(20px,2.4vw,32px)]">
              <h3 className="display max-w-[4.6em] text-[clamp(3.4rem,8vw,9rem)] text-yellow">{a.name}</h3>
              <div className="flex flex-col items-start gap-6">
                <p className="max-w-[26em] text-[clamp(1.25rem,1.7vw,1.625rem)] leading-snug">{a.line}</p>
                {i === attractions.length - 1 && <CtaLink href={site.links.booking} external>Book your event</CtaLink>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
