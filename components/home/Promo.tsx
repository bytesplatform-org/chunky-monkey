import { site } from "@/data/site";
import LiquidImage from "./LiquidImage";
import CtaLink from "./CtaLink";
import { Squiggle } from "./Deco";

export default function Promo() {
  return (
    <section className="relative px-(--gut) pb-[clamp(80px,10vw,150px)]">
      <div className="slab relative grid items-center gap-12 overflow-hidden rounded-[40px] bg-yellow p-[clamp(24px,5vw,80px)] lg:grid-cols-2">
        <Squiggle color="var(--color-red)" className="right-[46%] top-[8%] hidden w-[9%] lg:block" />
        <div>
          <h2 data-reveal className="display text-[clamp(3rem,7vw,7rem)]">
            Double<br />the fun.<br />Double the<br />adventure!
          </h2>
          <p data-reveal className="mt-6 max-w-md text-lg">
            Offers change through the season. Follow us for the latest deals before you plan your night.
          </p>
          <div data-reveal className="mt-8 flex flex-wrap gap-3">
            <CtaLink href={site.social.Instagram} tone="blue" external>Latest offers</CtaLink>
            <CtaLink href={site.whatsapp} tone="cream" external>Ask on WhatsApp</CtaLink>
          </div>
        </div>
        <div data-reveal className="relative mx-auto w-full max-w-[520px]">
          <LiquidImage src="/media/offer.jpg" alt="Reload Rs. 1000 and get a Rs. 300 bonus, valid Monday to Thursday" cursor="Offer" className="slab aspect-square rotate-2 rounded-[32px] transition-transform duration-300 [--lift:10px] hover:-rotate-1" sizes="(min-width: 1024px) 38vw, 90vw" />
        </div>
      </div>
    </section>
  );
}
