// Sample hours per day (not user data) on the same 12-hour scale as the FortnightStrip.
const sampleHours = [0, 4, 6, 0, 8, 5, 0, 3, 7, 4, 0, 6, 8, 5]
const scaleHours = 12

/** A small decorative strip with a rolling window sweeping across it. CSS animation only. */
export default function SweepStrip({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`relative h-20 w-full max-w-sm overflow-hidden ${className}`}>
    <div className="flex h-full items-end gap-1.5 border-b border-ink-300">
      {sampleHours.map((hours, index) => <div key={index} className="flex-1 bg-ink-900" style={{ height: `${Math.max((hours / scaleHours) * 100, 3)}%` }} />)}
    </div>
    {/* The rail spans the strip so translateX percentages move the window across the full width;
        under reduced motion it rests over the most recent days. */}
    <div className="absolute inset-0 translate-x-[58%] motion-safe:animate-sweep">
      <div className="h-full w-[30%] border-x border-ink-300 bg-ink-300/40" />
    </div>
  </div>
}
