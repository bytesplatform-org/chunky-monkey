import { site, stats } from "@/data/site";
import { Words } from "./Reveals";
import Counter from "./Counter";
import PillLink from "./PillLink";

export default function About() {
  return (
    <section id="about" className="relative px-(--gut) py-[clamp(96px,16vw,220px)]">
      <p data-reveal className="eyebrow mb-10 text-yellow">01 / Who we are</p>
      <p data-reveal-words className="display max-w-[22ch] text-[clamp(2.4rem,6.4vw,6.5rem)] leading-[0.95]">
        <Words text="Chunky Monkey is Pakistan's home of family fun. Built to bring international-standard amusement parks to the cities we love." />
      </p>
      <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <p data-reveal className="max-w-xl text-lg leading-relaxed text-cream/75">
          A nationwide brand by Pioneer Amusement Services (Pvt.) Ltd, part of the Dolmen Group. Rides for the brave and
          the little ones, food and drink, and nights out the whole family remembers.
        </p>
        <div data-reveal>
          <PillLink href={site.links.about} tone="ghost" external>More about us</PillLink>
        </div>
      </div>
      <dl className="mt-[clamp(64px,10vw,140px)] grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-cream/10 bg-cream/10 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={stat.label} data-reveal className="flex flex-col gap-3 bg-night p-[clamp(20px,3vw,40px)]">
            <dt className="eyebrow order-2 text-cream/60">{stat.label}</dt>
            <dd className={`display order-1 text-[clamp(4rem,9vw,8.5rem)] ${["text-red", "text-yellow", "text-green", "text-blue"][i]}`}>
              <Counter to={stat.value} />{stat.suffix}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
