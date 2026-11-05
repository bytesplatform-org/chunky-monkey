/** A hand-cut star that floats against the scroll. Decoration only. */
export function Star({ color, drift = 40, className = "" }: { color: string; drift?: number; className?: string }) {
  return (
    <div aria-hidden data-drift={drift} className={`pointer-events-none absolute ${className}`}>
      <svg viewBox="-2 -2 28 28" className="w-full" fill={color} stroke="var(--color-night)" strokeWidth="1.4" strokeLinejoin="round">
        <path d="M12 0l3 9h9l-7 5.5 2.7 9.5-7.7-6-7.7 6L7 14.5 0 9h9z" />
      </svg>
    </div>
  );
}

/** A loose ribbon of the kind that comes off a party popper. Decoration only. */
export function Squiggle({ color, drift = 40, className = "" }: { color: string; drift?: number; className?: string }) {
  return (
    <div aria-hidden data-drift={drift} className={`pointer-events-none absolute ${className}`}>
      <svg viewBox="0 0 120 40" className="w-full" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round">
        <path d="M6 20c12-22 24-22 36 0s24 22 36 0 24-22 36 0" />
      </svg>
    </div>
  );
}
