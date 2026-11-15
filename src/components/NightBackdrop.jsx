// Shared night sky for the login and the story. The world itself is Phaser.

const STARS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: `${(i * 53) % 100}%`,
  top: `${(i * 29) % 46}%`,
  delay: `${(i % 8) * 0.35}s`,
  duration: `${2.1 + (i % 5) * 0.45}s`,
  big: i % 9 === 0,
}));

export default function NightBackdrop({ ship = false, children }) {
  return (
    <div className="night">
      <div className="stars" aria-hidden="true">
        {STARS.map((star) => (
          <span
            key={star.id}
            className={star.big ? 'star star-big' : 'star'}
            style={{
              left: star.left,
              top: star.top,
              animationDelay: star.delay,
              animationDuration: star.duration,
            }}
          />
        ))}
      </div>
      <div className="moon" aria-hidden="true" />
      <div className="horizon" aria-hidden="true" />
      {ship && <Ship />}
      <Waves />
      <div className="night-frame" aria-hidden="true">
        <div className="edge edge-top" />
        <div className="edge edge-bottom" />
        <div className="edge edge-left" />
        <div className="edge edge-right" />
      </div>
      <div className="night-content">{children}</div>
    </div>
  );
}

function Waves() {
  return (
    <div className="waves" aria-hidden="true">
      <Wave className="wave-back" fill="#0c3350" duration="22s" />
      <Wave className="wave-mid" fill="#14527a" duration="15s" flip />
      <Wave className="wave-front" fill="#1c6a96" foam duration="10s" />
    </div>
  );
}

function Wave({ className, fill, foam = false, duration, flip = false }) {
  return (
    <div className={`wave ${className}`} style={{ animationDuration: duration, animationDirection: flip ? 'reverse' : 'normal' }}>
      <WaveSvg fill={fill} foam={foam} />
      <WaveSvg fill={fill} foam={foam} />
    </div>
  );
}

function WaveSvg({ fill, foam }) {
  return (
    <svg viewBox="0 0 1440 90" preserveAspectRatio="none">
      <path
        d="M0 48 Q180 18 360 48 T720 48 T1080 48 T1440 48 V90 H0 Z"
        fill={fill}
      />
      {foam && (
        <path
          d="M0 48 Q180 22 360 48 T720 48 T1080 48 T1440 48"
          fill="none"
          stroke="#d7f3ee"
          strokeWidth="3"
          strokeOpacity="0.7"
        />
      )}
    </svg>
  );
}

function Ship() {
  const oars = Array.from({ length: 8 }, (_, i) => {
    const x = 118 + i * 18;
    return <line key={x} x1={x} y1={92} x2={x - 16} y2={126} />;
  });
  return (
    <svg className="ship" viewBox="0 0 360 150" aria-hidden="true">
      <g className="oars" fill="none" stroke="#1a140e" strokeWidth="2.2" strokeLinecap="round">
        {oars}
      </g>
      <line x1="86" y1="78" x2="58" y2="132" stroke="#1a140e" strokeWidth="3" strokeLinecap="round" />
      <path d="M50 124 L66 138 L72 122 Z" fill="#140e0a" />
      <path
        d="M78 74
           C62 74 48 56 56 38
           C62 28 76 32 80 46
           L92 70
           L268 74
           C286 72 302 64 312 70
           L340 76
           L318 84
           C304 94 290 100 270 102
           L104 106
           C88 106 78 96 78 74 Z"
        fill="#0b1018"
      />
      <path d="M96 76 L262 80" stroke="#3d3124" strokeWidth="2" />
      <circle cx="300" cy="78" r="4.2" fill="#f4e6c8" />
      <circle cx="301.2" cy="78" r="1.7" fill="#140e0a" />
      <path d="M170 22 L104 74" stroke="#24180e" strokeWidth="1.2" />
      <path d="M174 22 L248 76" stroke="#24180e" strokeWidth="1.2" />
      <rect x="168" y="18" width="4" height="58" fill="#1c140c" />
      <rect x="118" y="16" width="116" height="4" rx="1" fill="#1c140c" />
      <path d="M124 22 Q176 32 228 22 L222 70 Q176 80 130 70 Z" fill="#f3e6c4" />
      <path d="M127 46 Q176 54 223 46" fill="none" stroke="#d7c096" strokeWidth="3.5" />
    </svg>
  );
}
