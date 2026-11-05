"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { attachLiquid } from "@/lib/gl/liquidHover";

/** A plain photo that flows like thick liquid under the cursor. Size and shape it through className. */
export default function LiquidImage({ src, alt, sizes, className = "" }: { src: string; alt: string; sizes: string; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    const img = el?.querySelector("img");
    return el && img ? attachLiquid(el, img) : undefined;
  }, []);
  return (
    <div ref={root} className={`relative overflow-hidden ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
    </div>
  );
}
