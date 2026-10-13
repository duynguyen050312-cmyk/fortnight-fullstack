// Illustrative persona quote, not a real citation.
export default function PersonaQuote({ className = '' }: { className?: string }) {
  return <figure className={`max-w-xl border-l-2 border-ink-300 pl-4 ${className}`}>
    <blockquote className="text-base italic leading-6 text-ink-600">“I kept turning down shifts because I was not sure if I had room.”</blockquote>
    <figcaption className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink-600">International student, hospitality, Melbourne</figcaption>
  </figure>
}
