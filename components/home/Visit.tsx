import { site } from "@/data/site";
import CtaLink from "./CtaLink";

export default function Visit() {
  return (
    <section id="contact" className="relative overflow-hidden px-(--gut) pb-[clamp(96px,12vw,180px)]">
      <h2 data-reveal className="display text-[clamp(3.6rem,10vw,10rem)]">
        Lights on<br />at four.
      </h2>

      {/* the visit details as an admission ticket: the shadow sits on a wrapper because the mask would cut it off */}
      <div data-reveal className="mt-[clamp(56px,8vw,110px)] drop-shadow-[0_8px_0_var(--color-night)]">
        <div className="ticket grid bg-yellow md:grid-cols-3">
          <div className="flex flex-col gap-4 p-[clamp(20px,3vw,40px)]">
            <span className="eyebrow">Opening hours</span>
            <p className="display whitespace-nowrap text-[clamp(2.4rem,3.6vw,4rem)]">{site.hours.time}</p>
            <p>{site.hours.days}</p>
          </div>
          <div className="flex flex-col gap-4 border-dashed border-night/35 p-[clamp(20px,3vw,40px)] max-md:border-t-2 md:border-l-2">
            <span className="eyebrow">Flagship park</span>
            <p className="text-[clamp(1.4rem,2vw,1.9rem)] font-semibold leading-tight">{site.address}</p>
            <div className="mt-auto pt-4">
              <CtaLink href={site.directions} tone="blue" external>Get directions</CtaLink>
            </div>
          </div>
          <div className="flex flex-col gap-3 border-dashed border-night/35 p-[clamp(20px,3vw,40px)] max-md:border-t-2 md:border-l-2">
            <span className="eyebrow mb-1">Say hello</span>
            <a href={site.phone.href} className="text-[clamp(1.2rem,1.7vw,1.6rem)] font-semibold hover:underline">{site.phone.label}</a>
            <a href={`mailto:${site.email}`} className="text-lg hover:underline">{site.email}</a>
            <a href={`mailto:${site.marketingEmail}`} className="text-lg hover:underline">{site.marketingEmail}</a>
            <div className="mt-auto flex flex-wrap gap-2 pt-4">
              <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="rounded-full border-2 border-night px-4 py-2 text-sm font-semibold transition-colors hover:bg-cream">WhatsApp</a>
              {Object.entries(site.social).map(([name, href]) => (
                <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="rounded-full border-2 border-night px-4 py-2 text-sm font-semibold transition-colors hover:bg-cream">{name}</a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
