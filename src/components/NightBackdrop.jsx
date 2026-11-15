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
  return (
    <svg className="ship" viewBox="0 0 220 100" aria-hidden="true">
      <path d="M16 62 L34 82 H168 L198 60 L176 74 H40 Z" fill="#070d14" />
      <path d="M28 62 H190" stroke="#e6c27a" strokeWidth="1.5" opacity="0.7" />
      <rect x="108" y="16" width="4" height="50" fill="#1c140c" />
      <path d="M112 18 L176 44 L112 46 Z" fill="#f3e6c8" />
      <path d="M112 50 L164 68 L112 68 Z" fill="#e4d2ac" />
      <circle className="lantern" cx="192" cy="58" r="3.5" fill="#ffb15a" />
      <path d="M192 50 C190 46 194 42 192 38 C196 44 196 48 192 50 Z" className="lantern-flame" fill="#ffe1a0" />
    </svg>
  );
}
