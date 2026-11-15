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
  // The same ship as in Troy and Ithaca (level2/art.js paintShip), exported
  // as public/assets/props/ithaca_ship.png. Flipped so the bow leads east.
  return (
    <div className="ship" aria-hidden="true">
      <img src="/assets/props/ithaca_ship.png" alt="" />
    </div>
  );
}
