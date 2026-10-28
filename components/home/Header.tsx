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
        el.toggleAttribute("data-solid", self.scroll() > 60);
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
        className="group fixed inset-x-0 top-0 z-[100] flex items-center justify-between px-(--gut) py-4 transition-[background-color,backdrop-filter] duration-500 data-solid:bg-night/60 data-solid:backdrop-blur-md"
      >
        <a href="#top" aria-label="Chunky Monkey, back to top" className="relative h-12 w-15">
          <Image src="/media/logo.png" alt="" fill sizes="60px" className="object-contain" priority />
        </a>
        <nav aria-label="Main" className="hidden items-center gap-1 rounded-full border border-cream/15 bg-night/30 p-1 backdrop-blur-md md:flex">
          {nav.map(item => (
            <a key={item.href} href={item.href} className="rounded-full px-5 py-2.5 text-sm font-medium text-cream/85 transition-colors hover:bg-cream hover:text-night">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a
            href={site.links.booking}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-11 items-center rounded-full bg-yellow px-5 text-xs font-bold uppercase tracking-[0.14em] text-night transition-colors hover:bg-cream sm:inline-flex"
          >
            Book a party
          </a>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="grid size-11 place-items-center rounded-full border border-cream/30 md:hidden"
          >
            <span className="flex w-4 flex-col gap-1.5"><span className="h-0.5 bg-cream" /><span className="h-0.5 bg-cream" /></span>
          </button>
        </div>
      </header>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-[150] flex flex-col bg-night px-(--gut) py-4" data-lenis-prevent>
          <div className="flex justify-end">
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="grid size-11 place-items-center rounded-full border border-cream/30 text-xl">×</button>
          </div>
          <nav aria-label="Mobile" className="mt-10 flex flex-col gap-2">
            {nav.map(item => (
              <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="display text-7xl">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-2 pb-6 text-cream/70">
            <a href={site.phone.href}>{site.phone.label}</a>
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </div>
        </div>
      )}
    </>
  );
}
