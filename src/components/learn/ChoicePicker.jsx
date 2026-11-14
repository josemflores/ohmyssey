/** Big selectable parts or topologies. One choice is pressed at a time. */

export default function ChoicePicker({ label, options, value, onChange }) {
  return (
    <fieldset className="choice-picker">
      <legend>{label}</legend>
      <div className="choice-row">
        {(options || []).map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              className={selected ? 'choice selected' : 'choice'}
              aria-pressed={selected}
              onClick={() => onChange(option.id)}
            >
              <span className="choice-label">{option.label}</span>
              {option.detail && <span className="choice-detail">{option.detail}</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
