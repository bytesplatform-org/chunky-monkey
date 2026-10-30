/** The loading screen: a thin bar and the percentage. Fades away once `done`. */
export default function ParkLoader({ progress, done = false }: { progress: number; done?: boolean }) {
  const pct = Math.round(progress);
  return (
    <div
      aria-hidden={done}
      className={`fixed inset-0 z-30 grid place-items-center bg-[#ffd9b2] text-[#1d1633] transition-opacity duration-700 ${done ? "pointer-events-none opacity-0" : "opacity-100"}`}
    >
      <div className="w-[min(320px,70vw)]">
        <p className="display text-4xl">Chunky Monkey</p>
        <div className="mt-5 h-[3px] w-full overflow-hidden rounded-full bg-[#1d1633]/15" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Loading the park">
          <div className="h-full origin-left rounded-full bg-[#1d1633] transition-transform duration-300" style={{ transform: `scaleX(${pct / 100})` }} />
        </div>
        <p className="mt-3 text-sm tabular-nums text-[#1d1633]/70">{pct}%</p>
      </div>
    </div>
  );
}
