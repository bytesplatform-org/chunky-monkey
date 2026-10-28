import { facilities } from "@/data/site";

const ICONS: Record<(typeof facilities)[number]["icon"], React.ReactNode> = {
  parking: <><rect x="4" y="3" width="16" height="18" rx="3" /><path d="M10 17V8h3a2.5 2.5 0 010 5h-3" /></>,
  search: <><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.5-4.5" /></>,
  aid: <><rect x="3" y="6" width="18" height="14" rx="3" /><path d="M9 6V4h6v2M12 10v6M9 13h6" /></>,
  shield: <><path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z" /><path d="M9 12l2 2 4-4" /></>,
  wc: <><circle cx="7" cy="5" r="1.6" /><circle cx="17" cy="5" r="1.6" /><path d="M7 8v12M5 9h4l-.5 6M17 8l-3 8h6zM16 16v4M18 16v4M12 3v18" /></>,
  prayer: <><path d="M12 3c-3 2-5 4.5-5 8h10c0-3.5-2-6-5-8zM5 11h14v9H5zM10 20v-4a2 2 0 014 0v4" /></>,
};

export default function Facilities() {
  return (
    <section className="relative px-(--gut) py-[clamp(96px,12vw,180px)]">
      <div className="grid gap-14 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 data-reveal className="display text-[clamp(3rem,6.5vw,6.5rem)]">
            The fun part&apos;s on us.<br /><span className="text-cream/45">So is everything else.</span>
          </h2>
        </div>
        <ul className="grid grid-cols-2 gap-px self-end overflow-hidden rounded-3xl border border-cream/10 bg-cream/10 sm:grid-cols-3">
          {facilities.map(f => (
            <li key={f.name} data-reveal className="group flex aspect-square flex-col justify-between bg-night p-[clamp(16px,2.4vw,32px)] transition-colors duration-500 hover:bg-dusk">
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                className="size-[clamp(36px,4vw,52px)] transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {ICONS[f.icon]}
              </svg>
              <span className="text-[clamp(1rem,1.4vw,1.25rem)] font-medium leading-tight">{f.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
