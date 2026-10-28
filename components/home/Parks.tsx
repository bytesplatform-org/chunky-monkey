import { parks, site } from "@/data/site";
import ShaderImage from "./ShaderImage";

const ACCENTS = ["#ffc93c", "#3b5bff", "#4cc35a"];

export default function Parks() {
  const [flagship, ...rest] = parks;
  return (
    <section id="parks" className="relative px-(--gut) py-[clamp(96px,12vw,180px)]">
      <div className="mb-14 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p data-reveal className="eyebrow mb-6 text-green">04 / Our parks</p>
          <h2 data-reveal className="display text-[clamp(3.2rem,8vw,8rem)]">
            Three parks.<br /><span className="neon text-green">One big family.</span>
          </h2>
        </div>
        <a data-reveal href={site.links.gallery} target="_blank" rel="noopener noreferrer" className="eyebrow text-cream/70 underline-offset-8 hover:text-cream hover:underline">
          Browse the gallery →
        </a>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <article data-reveal className="group relative overflow-hidden rounded-[32px] lg:row-span-2">
          <ShaderImage src="/media/park.jpg" alt="Chunky Monkey DHA Phase IV entrance at dusk" edge="#ffc93c" cursor="Visit" className="aspect-[4/3] size-full lg:aspect-auto lg:min-h-[640px]" sizes="(min-width: 1024px) 60vw, 100vw" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night/90 via-night/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-[clamp(20px,3vw,40px)]">
            <span className="eyebrow w-fit rounded-full bg-yellow px-3 py-1.5 text-night">Flagship</span>
            <h3 className="display text-[clamp(2.8rem,6vw,5.5rem)]">{flagship.name}</h3>
            <p className="text-cream/80">{flagship.city} · {flagship.note}</p>
          </div>
        </article>
        {rest.map((park, i) => (
          <article
            key={park.name}
            data-reveal
            className="group relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-[32px] border border-cream/12 bg-dusk p-[clamp(20px,3vw,40px)] transition-colors duration-500 hover:border-transparent"
            style={{ "--accent": ACCENTS[i + 1] } as React.CSSProperties}
          >
            <div aria-hidden className="absolute -right-16 -top-16 size-64 rounded-full bg-(--accent) opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-60" />
            <span className="eyebrow relative text-(--accent)">{park.city}</span>
            <div className="relative">
              <h3 className="display text-[clamp(2.6rem,4.5vw,4.5rem)]">{park.name}</h3>
              <p className="mt-2 text-cream/70">{park.note}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
