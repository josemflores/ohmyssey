/** Easy, normal, or hard. The choice is stored with the study progress. */

const CHOICES = [
  {
    id: 'easy',
    title: 'Easy',
    body: 'A hint is already open. The worked steps unlock after one recorded miss. Decoy parts stay in the pouch, and the LED starts pointing the right way.',
  },
  {
    id: 'normal',
    title: 'Normal',
    body: 'The voyage as told. Truth tables count. Sliders carry the timing puzzles. The worked steps unlock after three recorded misses.',
  },
  {
    id: 'hard',
    title: 'Hard',
    body: 'Decoys are in the tray, the winds ask for a different time, and you predict the cave current yourself. The worked steps stay shut until the island is won.',
  },
];

export default function DifficultyScreen({ current, onChoose, onBack }) {
  return (
    <main className="title-screen">
      <section className="title-card card difficulty-card-wrap">
        <p className="eyebrow">Before the map</p>
        <h1>How hard is the wind?</h1>
        <p className="lede">
          Every island stays open, so a demo can sail straight to Ithaca. The wind changes the hints, the tables, and how soon the worked solution appears.
        </p>
        <div className="difficulty-grid">
          {CHOICES.map((choice) => (
            <button
              key={choice.id}
              type="button"
              className={current === choice.id ? 'difficulty-card selected' : 'difficulty-card'}
              onClick={() => onChoose(choice.id)}
            >
              <span className="choice-label">{choice.title}</span>
              <span className="choice-detail">{choice.body}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-quiet" type="button" onClick={onBack}>
          Back to the title
        </button>
      </section>
    </main>
  );
}
