import { site } from "@/data/site";
import ShaderImage from "./ShaderImage";
import PillLink from "./PillLink";

export default function Promo() {
  return (
    <section className="relative overflow-hidden px-(--gut) py-[clamp(96px,14vw,200px)]">
      <div className="relative grid items-center gap-16 lg:grid-cols-2">
        <div>
          <h2 data-reveal className="display text-[clamp(3.4rem,9vw,9rem)]">
            Double<br />the fun.<br />Double the<br />adventure!
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
          <ShaderImage src="/media/offer.jpg" alt="Chunky Monkey promotional offer" cursor="Offer" className="aspect-square rounded-[36px]" sizes="(min-width: 1024px) 40vw, 90vw" />
        </div>
      </div>
    </section>
  );
}
