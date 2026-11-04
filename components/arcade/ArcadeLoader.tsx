/** The loading screen: a thin bar and the percentage. Fades away once `done`. */
export default function ArcadeLoader({ progress, done = false }: { progress: number; done?: boolean }) {
  const pct = Math.round(progress);
  return (
    <div
      aria-hidden={done}
      className={`fixed inset-0 z-30 grid place-items-center bg-[#14121f] text-[#fff6e5] transition-opacity duration-700 ${done ? "pointer-events-none opacity-0" : "opacity-100"}`}
    >
      <div className="w-[min(320px,70vw)]">
        <p className="display text-4xl">Arcade</p>
        <div className="mt-5 h-[3px] w-full overflow-hidden rounded-full bg-[#fff6e5]/15" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Loading the arcade">
          <div className="h-full origin-left rounded-full bg-[#fff6e5] transition-transform duration-300" style={{ transform: `scaleX(${pct / 100})` }} />
        </div>
        <p className="mt-3 text-sm tabular-nums text-[#fff6e5]/70">{pct}%</p>
      </div>
    </div>
  );
}
