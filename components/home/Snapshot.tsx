import Image from "next/image";

/** A photo in the house style: thick outline, hard shadow. Give it a size and a tilt through className. */
export default function Snapshot({ src, alt, sizes, className = "" }: { src: string; alt: string; sizes: string; className?: string }) {
  return (
    <div className={`slab relative overflow-hidden rounded-3xl bg-night/10 ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
    </div>
  );
}
