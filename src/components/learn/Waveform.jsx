/** SVG plot for the RC charging curve and the 555 square wave. */

export default function Waveform({ samples, xMax, yMax, markers = [], xLabel, yLabel, ariaLabel }) {
  if (!samples?.length || !(xMax > 0) || !(yMax > 0)) {
    return <p className="wave-empty">The curve appears once the parts have values.</p>;
  }

  const width = 360;
  const height = 168;
  const padLeft = 36;
  const padBottom = 28;
  const sx = (x) => padLeft + (x / xMax) * (width - padLeft - 12);
  const sy = (y) => 12 + (1 - y / yMax) * (height - padBottom - 12);
  const points = samples.map((sample) => `${sx(sample.x).toFixed(1)},${sy(sample.y).toFixed(1)}`).join(' ');

  return (
    <svg className="waveform" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
      <line className="axis" x1={padLeft} y1={sy(0)} x2={width - 8} y2={sy(0)} />
      <line className="axis" x1={padLeft} y1={12} x2={padLeft} y2={sy(0)} />
      {markers.map((marker) => (
        marker.y != null ? (
          <g key={`y-${marker.label}`}>
            <line className="marker" x1={padLeft} x2={width - 8} y1={sy(marker.y)} y2={sy(marker.y)} />
            <text x={width - 10} y={sy(marker.y) - 4} textAnchor="end">{marker.label}</text>
          </g>
        ) : (
          <g key={`x-${marker.label}`}>
            <line className="marker" x1={sx(marker.x)} x2={sx(marker.x)} y1={12} y2={sy(0)} />
            <text x={Math.min(width - 28, Math.max(sx(marker.x), padLeft + 16))} y={height - 12} textAnchor="middle">{marker.label}</text>
          </g>
        )
      ))}
      <polyline className="trace" points={points} />
      <text className="axis-label" x={(width + padLeft) / 2} y={height - 2} textAnchor="middle">{xLabel}</text>
      <text className="axis-label" x={4} y={12}>{yLabel}</text>
    </svg>
  );
}
