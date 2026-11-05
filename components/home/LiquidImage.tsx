"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useStage } from "@/components/gl/GLStage";
import { attachLiquid } from "@/lib/gl/liquidHover";

/** A photo that flows like thick liquid under the cursor. Size and shape it through className. */
export default function LiquidImage({ src, alt, sizes, cursor, className = "" }: { src: string; alt: string; sizes: string; cursor?: string; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const stage = useStage();
  useEffect(() => {
    const el = root.current;
    const img = el?.querySelector("img");
    return stage && el && img ? attachLiquid(stage, el, img) : undefined;
  }, [stage]);
  return (
    <div ref={root} data-cursor={cursor} className={`relative overflow-hidden ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
    </div>
  );
}
