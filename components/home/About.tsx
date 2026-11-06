import { site, stats } from "@/data/site";
import { Words } from "./Reveals";
import Counter from "./Counter";
import CtaLink from "./CtaLink";
import { Squiggle, Star } from "./Deco";
import PhotoDeck from "./PhotoDeck";

/** Half-circle bites out of both sides: side by side, two tickets make a punched hole on their tear line. */
const TICKET = {
  mask: "radial-gradient(circle 13px at 0 50%, transparent 97%, #000) left / 51% 100% no-repeat, radial-gradient(circle 13px at 100% 50%, transparent 97%, #000) right / 51% 100% no-repeat",
};

export default function About() {
  return (
    <section id="about" className="relative overflow-hidden px-(--gut) py-[clamp(80px,9vw,140px)]">
      <Star color="var(--color-pink)" className="left-[3%] top-[6%] hidden w-[clamp(32px,3.6vw,56px)] md:block" />
      <Squiggle color="var(--color-blue)" className="right-[4%] top-[8%] hidden w-[clamp(64px,7vw,110px)] md:block" />

      <div className="relative grid items-center gap-[clamp(48px,6vw,96px)] lg:grid-cols-[7fr_5fr]">
        <div className="flex flex-col items-start">
          <h2 data-reveal-words className="display text-[clamp(3.2rem,7.2vw,8rem)]">
            <Words text="Chunky Monkey is Pakistan's home of" />{" "}
            <span data-word className="slab mt-[0.12em] inline-block -rotate-2 rounded-[0.22em] bg-yellow px-[0.18em] pb-[0.06em] [--lift:6px]">family fun.</span>
          </h2>
          <p data-reveal-words className="mt-[clamp(28px,3.4vw,44px)] max-w-2xl text-[clamp(1.2rem,1.7vw,1.6rem)] font-medium leading-snug">
            <Words text="Built to bring international-standard amusement parks to the cities we love." />
          </p>
          <p data-reveal className="mt-4 max-w-2xl text-lg leading-relaxed">
            A nationwide brand by Pioneer Amusement Services (Pvt.) Ltd, part of the Dolmen Group. Rides for the brave and the
            little ones, food and drink, and nights out the whole family remembers.
          </p>
          <div data-reveal className="mt-8">
            <CtaLink href={site.links.about} external>More about us</CtaLink>
          </div>
        </div>
        {/* the deck drifts against the scroll; the reveal is a layer in, since each needs its own transform */}
        <div data-drift="60">
          <div data-reveal>
            <PhotoDeck />
          </div>
        </div>
      </div>

      {/* a roll of tickets: the hard shadow sits on the roll, since each ticket's notches are cut with a mask,
          and they overlap by a pixel, or fractional column widths leave a hairline between them */}
      <dl data-reveal className="relative mt-[clamp(56px,6vw,88px)] grid grid-cols-2 gap-y-3 drop-shadow-[0_8px_0_var(--color-night)] lg:grid-cols-4 lg:gap-y-0">
        {stats.map(stat => (
          <div
            key={stat.label}
            className="flex flex-col gap-1 rounded-[22px] border-dashed border-night/45 bg-yellow px-[clamp(26px,3vw,48px)] py-[clamp(20px,2.4vw,34px)] transition-transform duration-300 ease-out-expo even:-ml-px even:border-l-2 hover:z-10 hover:-translate-y-2 hover:-rotate-1 lg:rounded-none lg:border-l-2 lg:not-first:-ml-px lg:first:rounded-l-[28px] lg:first:border-l-0 lg:last:rounded-r-[28px]"
            style={TICKET}
          >
            <dd className="display order-1 text-[clamp(3rem,6vw,6.25rem)]">
              <Counter to={stat.value} />{stat.suffix}
            </dd>
            <dt className="order-2 text-[clamp(1rem,1.3vw,1.25rem)] font-semibold leading-snug">{stat.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
