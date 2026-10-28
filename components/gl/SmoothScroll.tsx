"use client";

import { useEffect } from "react";
import { mountScroll } from "@/lib/animation/scroll";
import { prefersReducedMotion } from "@/lib/animation/prefs";

/** Lenis smooth scrolling for the whole site, off under reduced motion. */
export default function SmoothScroll() {
  useEffect(() => mountScroll({ smooth: !prefersReducedMotion() }), []);
  return null;
}
