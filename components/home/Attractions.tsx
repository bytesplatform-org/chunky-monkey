import Image from "next/image";
import { attractions, site } from "@/data/site";
import CtaLink from "./CtaLink";
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
            className="slab grid overflow-hidden rounded-[32px] bg-night text-cream md:sticky md:min-h-[min(68lvh,600px)] md:grid-cols-2"
            style={{ top: `${72 + i * 22}px` }}
          >
            <div className={`relative aspect-[4/3] md:aspect-auto ${i % 2 ? "md:order-2" : ""}`}>
              <Image src={a.image} alt={a.name} fill sizes="(min-width: 768px) 48vw, 92vw" className="object-cover" />
            </div>
            <div className="flex flex-col justify-end gap-5 p-[clamp(24px,4vw,56px)]">
              <h3 className="display text-[clamp(2.8rem,6vw,6rem)] text-yellow">{a.name}</h3>
              <p className="max-w-md text-lg leading-snug">{a.line}</p>
              {i === attractions.length - 1 && (
                <div className="pt-2"><CtaLink href={site.links.booking} external>Book your event</CtaLink></div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
