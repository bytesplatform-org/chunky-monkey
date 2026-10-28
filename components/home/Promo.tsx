import { site } from "@/data/site";
import ShaderImage from "./ShaderImage";
import PillLink from "./PillLink";

const RING = "Double the fun · Double the adventure · ";

export default function Promo() {
  return (
    <section className="relative overflow-hidden px-(--gut) py-[clamp(96px,14vw,200px)]">
      <div aria-hidden className="pointer-events-none absolute -left-1/4 top-1/4 size-[60vw] rounded-full bg-pink/20 blur-[120px]" />
      <div className="relative grid items-center gap-16 lg:grid-cols-2">
        <div>
          <p data-reveal className="eyebrow mb-8 text-pink">03 / Promotions</p>
          <h2 data-reveal className="display text-[clamp(3.4rem,9vw,9rem)]">
            Double<br />the <span className="neon text-pink">fun.</span><br />Double the<br /><span className="neon text-yellow">adventure!</span>
          </h2>
          <p data-reveal className="mt-8 max-w-md text-lg text-cream/75">
            Offers change through the season. Follow us for the latest deals before you plan your night.
          </p>
          <div data-reveal className="mt-10 flex flex-wrap gap-3">
            <PillLink href={site.social.Instagram} tone="yellow" external>Latest offers</PillLink>
            <PillLink href={site.whatsapp} tone="ghost" external>Ask on WhatsApp</PillLink>
          </div>
        </div>
        <div data-reveal className="relative mx-auto w-full max-w-[560px]">
          <ShaderImage src="/media/offer.jpg" alt="Chunky Monkey promotional offer" edge="#ff4fa3" cursor="Offer" className="aspect-square rotate-[-3deg] rounded-[36px]" sizes="(min-width: 1024px) 40vw, 90vw" />
          {/* spinning sticker */}
          <div className="absolute -right-4 -top-10 grid size-[clamp(120px,14vw,180px)] place-items-center rounded-full bg-yellow text-night shadow-[0_0_60px_rgba(255,201,60,0.45)] motion-safe:animate-[spin_16s_linear_infinite] sm:-right-10">
            <svg viewBox="0 0 200 200" className="absolute inset-0 size-full" aria-hidden>
              <defs><path id="ring" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" /></defs>
              <text className="fill-night text-[17px] font-bold uppercase tracking-[0.18em]"><textPath href="#ring">{RING}</textPath></text>
            </svg>
            <span className="display text-[clamp(2.4rem,4vw,3.6rem)]">2×</span>
          </div>
        </div>
      </div>
    </section>
  );
}
