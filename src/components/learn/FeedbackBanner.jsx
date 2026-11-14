/** Live pass, fail, or still-working status for the puzzle on screen. */

export default function FeedbackBanner({ result }) {
  if (!result) return null;
  return (
    <section className={`learn-feedback tone-${result.tone}`} aria-live="polite">
      <p className="current-kicker">{result.kicker}</p>
      {result.meter && <p className="current-value">{result.meter.value}</p>}
      <h3>{result.headline}</h3>
      <p>{result.detail}</p>
      {result.equation && <p className="equation">{result.equation}</p>}
    </section>
  );
}
