"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { nav, site } from "@/data/site";
import { lockScroll } from "@/lib/animation/scroll";

gsap.registerPlugin(ScrollTrigger);

/** Fixed bar: tucks away while scrolling down, returns on the way up. Full-screen menu on small screens. */
export default function Header() {
  const bar = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const trigger = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: self => {
        const hide = self.direction === 1 && self.scroll() > 200;
        gsap.to(el, { yPercent: hide ? -110 : 0, duration: 0.5, ease: "power3.out", overwrite: true });
      },
    });
    return () => trigger.kill();
  }, []);

  useEffect(() => {
    if (!open) return;
    const unlock = lockScroll();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      unlock();
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header
        ref={bar}
        className="fixed inset-x-0 top-0 z-[100] flex items-center justify-between px-(--gut) py-4"
      >
        <a href="#top" aria-label="Chunky Monkey, back to top" className="relative aspect-[118/97] h-[clamp(72px,7vw,99px)]">
          <Image src="/media/logo.png" alt="" fill sizes="120px" className="object-contain" priority />
        </a>
        <div className="flex items-center gap-3">
          <nav aria-label="Main" className="slab hidden h-12 items-center gap-0.5 rounded-2xl bg-cream px-1.5 text-night [--lift:4px] xl:flex">
            {nav.map(item => (
              <a key={item.href} href={item.href} className="whitespace-nowrap rounded-xl px-3 py-1.5 font-semibold transition-colors duration-150 hover:bg-yellow">
                {item.label}
              </a>
            ))}
          </nav>
          <a
            href={site.links.booking}
            target="_blank"
            rel="noopener noreferrer"
            className="chunky hidden h-12 items-center rounded-2xl bg-yellow px-5 font-semibold text-night [--lift:4px] hover:bg-[#ffd566] sm:inline-flex"
          >
            Book Event
          </a>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="chunky grid size-12 place-items-center rounded-2xl bg-cream [--lift:4px] xl:hidden"
          >
            <span className="flex w-5 flex-col gap-1.5"><span className="h-0.5 bg-night" /><span className="h-0.5 bg-night" /></span>
          </button>
        </div>
      </header>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-[150] flex flex-col bg-yellow px-(--gut) py-4 text-night" data-lenis-prevent>
          <div className="flex justify-end">
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="chunky grid size-12 place-items-center rounded-2xl bg-cream text-2xl [--lift:4px]">×</button>
          </div>
          <nav aria-label="Mobile" className="mt-10 flex flex-col gap-2">
            {nav.map(item => (
              <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="display text-5xl">
                {item.label}
              </a>
            ))}
            <a href={site.links.booking} target="_blank" rel="noopener noreferrer" className="display text-5xl">Book Event</a>
          </nav>
          <div className="mt-auto flex flex-col gap-2 pb-6 font-medium">
            <a href={site.phone.href}>{site.phone.label}</a>
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </div>
        </div>
      )}
    </>
  );
}
