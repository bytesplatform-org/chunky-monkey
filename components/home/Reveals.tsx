"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/animation/prefs";

gsap.registerPlugin(ScrollTrigger);

/**
 * Page-wide scroll reveals. Mount once, after the content.
 *   [data-reveal]       fades up, in staggered batches
 *   [data-reveal-words] each word lights from dim to full as it scrolls through
 */
export default function Reveals() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const els = gsap.utils.toArray<HTMLElement>("[data-reveal]");
      gsap.set(els, { y: 48, opacity: 0 });
      ScrollTrigger.batch(els, {
        start: "top 90%",
        once: true,
        onEnter: batch => gsap.to(batch, { y: 0, opacity: 1, duration: 1.1, ease: "expo.out", stagger: 0.08, overwrite: true }),
        onLeave: batch => gsap.set(batch, { y: 0, opacity: 1 }),
      });

      gsap.utils.toArray<HTMLElement>("[data-reveal-words]").forEach(block => {
        const words = block.querySelectorAll("[data-word]");
        gsap.fromTo(words, { opacity: 0.14 }, {
          opacity: 1,
          ease: "none",
          stagger: 0.1,
          scrollTrigger: { trigger: block, start: "top 80%", end: "bottom 45%", scrub: true },
        });
      });
    });
    // Late-loading images change the page height; re-measure once everything is in.
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    return () => {
      ctx.revert();
      window.removeEventListener("load", onLoad);
    };
  }, []);
  return null;
}

/** Splits text into [data-word] spans for data-reveal-words. */
export function Words({ text }: { text: string }) {
  return text.split(" ").map((word, i) => (
    <span key={i} data-word className="inline-block">{word}&nbsp;</span>
  ));
}
