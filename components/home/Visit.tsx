import { site } from "@/data/site";
import PillLink from "./PillLink";

export default function Visit() {
  return (
    <section id="visit" className="relative overflow-hidden bg-yellow px-(--gut) py-[clamp(96px,12vw,180px)] text-night">
      <h2 data-reveal className="display text-[clamp(3.6rem,10vw,10rem)]">
        Lights on<br />at four.
      </h2>

      <div className="mt-[clamp(56px,8vw,110px)] grid gap-px overflow-hidden rounded-[32px] bg-night/15 md:grid-cols-3">
        <div data-reveal className="flex flex-col gap-4 bg-yellow p-[clamp(20px,3vw,40px)] md:bg-yellow">
          <span className="eyebrow text-night/60">Opening hours</span>
          <p className="display whitespace-nowrap text-[clamp(2.4rem,3.6vw,4rem)]">{site.hours.time}</p>
          <p className="text-night/70">{site.hours.days}</p>
        </div>
        <div data-reveal className="flex flex-col gap-4 bg-yellow p-[clamp(20px,3vw,40px)]">
          <span className="eyebrow text-night/60">Flagship park</span>
          <p className="text-[clamp(1.4rem,2vw,1.9rem)] font-semibold leading-tight">{site.address}</p>
          <div className="mt-auto pt-4">
            <PillLink href={site.directions} tone="dark" external>Get directions</PillLink>
          </div>
        </div>
        <div data-reveal className="flex flex-col gap-3 bg-yellow p-[clamp(20px,3vw,40px)]">
          <span className="eyebrow mb-1 text-night/60">Say hello</span>
          <a href={site.phone.href} className="text-[clamp(1.2rem,1.7vw,1.6rem)] font-semibold hover:underline">{site.phone.label}</a>
          <a href={`mailto:${site.email}`} className="text-lg hover:underline">{site.email}</a>
          <a href={`mailto:${site.marketingEmail}`} className="text-lg text-night/70 hover:underline">{site.marketingEmail}</a>
          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="rounded-full border border-night/30 px-4 py-2 text-sm font-semibold hover:bg-night hover:text-yellow">WhatsApp</a>
            {Object.entries(site.social).map(([name, href]) => (
              <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="rounded-full border border-night/30 px-4 py-2 text-sm font-semibold hover:bg-night hover:text-yellow">{name}</a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
