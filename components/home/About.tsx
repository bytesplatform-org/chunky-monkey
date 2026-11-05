import { site, stats } from "@/data/site";
import { Words } from "./Reveals";
import Counter from "./Counter";
import CtaLink from "./CtaLink";
import Snapshot from "./Snapshot";
import { Squiggle, Star } from "./Deco";

export default function About() {
  return (
    <section id="about" className="relative overflow-hidden px-(--gut) py-[clamp(80px,11vw,170px)]">
      <div className="grid items-center gap-[clamp(48px,6vw,96px)] lg:grid-cols-[1.3fr_1fr]">
        <div>
          <p data-reveal-words className="display text-[clamp(2.4rem,4.5vw,5.25rem)] leading-[1.02]">
            <Words text="Chunky Monkey is Pakistan's home of family fun. Built to bring international-standard amusement parks to the cities we love." />
          </p>
          <p data-reveal className="mt-10 max-w-xl text-lg leading-relaxed">
            A nationwide brand by Pioneer Amusement Services (Pvt.) Ltd, part of the Dolmen Group. Rides for the brave and
            the little ones, food and drink, and nights out the whole family remembers.
          </p>
          <div data-reveal className="mt-8">
            <CtaLink href={site.links.about} external>More about us</CtaLink>
          </div>
        </div>

        {/* a loose pile of snapshots, each drifting at its own depth */}
        <div className="relative aspect-square w-full max-lg:max-w-[560px]">
          <div data-drift="24" className="absolute left-0 top-[6%] w-[78%]">
            <Snapshot src="/media/photos/park-front.jpg" alt="The Chunky Monkey building with its big logo over the entrance" sizes="(min-width: 1024px) 34vw, 78vw" className="aspect-[3/2] -rotate-3" />
          </div>
          <div data-drift="60" className="absolute bottom-[4%] left-[4%] w-[46%]">
            <Snapshot src="/media/photos/ride-girl.jpg" alt="A girl laughing on a ride" sizes="(min-width: 1024px) 20vw, 46vw" className="aspect-square rotate-2" />
          </div>
          <div data-drift="100" className="absolute bottom-[12%] right-0 w-[52%]">
            <Snapshot src="/media/photos/ride-friends.jpg" alt="Two friends on a swinging ride" sizes="(min-width: 1024px) 22vw, 52vw" className="aspect-square rotate-[5deg]" />
          </div>
          <Star color="var(--color-yellow)" drift={70} className="right-[6%] top-0 w-[13%]" />
          <Squiggle color="var(--color-pink)" drift={30} className="bottom-0 right-[8%] w-[26%]" />
        </div>
      </div>

      <dl data-reveal className="slab mt-[clamp(56px,8vw,110px)] grid grid-cols-2 gap-0.5 overflow-hidden rounded-3xl bg-night lg:grid-cols-4">
        {stats.map(stat => (
          <div key={stat.label} className="flex flex-col gap-2 bg-yellow p-[clamp(18px,2.4vw,32px)]">
            <dt className="eyebrow order-2">{stat.label}</dt>
            <dd className="display order-1 text-[clamp(2.8rem,6vw,6rem)]">
              <Counter to={stat.value} />{stat.suffix}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
