import LiquidImage from "./LiquidImage";

/** A photo in the house style: thick outline, hard shadow. Give it a size and a tilt through className. */
export default function Snapshot({ src, alt, sizes, className = "" }: { src: string; alt: string; sizes: string; className?: string }) {
  return <LiquidImage src={src} alt={alt} sizes={sizes} className={`slab rounded-3xl bg-night/10 ${className}`} />;
}
