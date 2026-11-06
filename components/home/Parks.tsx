import { parks } from "@/data/site";
import LiquidImage from "./LiquidImage";
import CtaLink from "./CtaLink";
import { Star } from "./Deco";

export default function Parks() {
  const [flagship, mall] = parks;
  return (
    <section id="parks" className="relative px-(--gut) py-[clamp(90px,10vw,150px)]">
      <h2 data-reveal className="display mb-[clamp(40px,5vw,72px)] text-[clamp(3.2rem,8vw,8rem)]">
        Two parks.<br />One big family.
      </h2>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <article data-reveal className="slab relative overflow-hidden rounded-[32px] text-cream">
          <LiquidImage src="/media/park-dha.jpg" alt="The lit Chunky Monkey sign above the DHA Phase IV entrance and ticket counter at dusk" cursor="Visit" className="aspect-[4/5] size-full sm:aspect-[4/3] lg:aspect-auto lg:min-h-[600px]" sizes="(min-width: 1024px) 60vw, 100vw" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night/90 via-night/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 p-[clamp(20px,3vw,40px)]">
            <span className="eyebrow">{flagship.area}</span>
            <h3 className="display text-[clamp(2.6rem,6vw,5.5rem)]">{flagship.name}</h3>
            <p>{flagship.note}</p>
            <div className="pt-2"><CtaLink href={flagship.directions} external>Get directions</CtaLink></div>
          </div>
        </article>
        <article data-reveal className="slab relative flex min-h-[380px] flex-col items-start justify-between gap-6 overflow-hidden rounded-[32px] bg-yellow p-[clamp(20px,3vw,40px)]">
          <Star color="var(--color-pink)" drift={20} className="right-[8%] top-[6%] w-[22%]" />
          <span className="eyebrow">{mall.area}</span>
          <div className="flex flex-col items-start gap-3">
            <h3 className="display text-[clamp(2.6rem,4.6vw,4.75rem)]">{mall.name}</h3>
            <p>{mall.note}</p>
            <div className="pt-2"><CtaLink href={mall.directions} tone="blue" external>Get directions</CtaLink></div>
          </div>
        </article>
      </div>
    </section>
  );
}
