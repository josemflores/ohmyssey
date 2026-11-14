/** Shared "not built yet" result so stub islands all look the same. */
export function placeholderResult(levelTitle) {
  return {
    complete: false,
    currentMa: 0,
    led: 'off',
    headline: 'This chart is not finished.',
    detail: `${levelTitle} is a sketch. The story and lesson cards are placeholders. Write a real check() before this island can be won. Until check() returns complete: true, the next island stays locked.`,
    equation: 'The meter stays at 0 until this level computes a current.',
  };
}
