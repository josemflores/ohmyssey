/** A small truth table. Each row's last cell is a choice, not a typed answer. */

export default function TruthTable({ prompt, columns, rows, choices, value, onChange }) {
  return (
    <fieldset className="truth-table">
      <legend>{prompt}</legend>
      <table>
        <thead>
          <tr>
            {(columns || []).map((column) => (
              <th key={column} scope="col">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(rows || []).map((row, index) => (
            <tr key={`${row.inputs.join('-')}-${index}`}>
              {row.inputs.map((cell) => (
                <td key={cell}>{cell}</td>
              ))}
              <td>
                <div className="truth-choices">
                  {(choices || []).map((choice) => {
                    const selected = value?.[index] === choice;
                    return (
                      <button
                        key={choice}
                        type="button"
                        className={selected ? 'choice selected' : 'choice'}
                        aria-pressed={selected}
                        onClick={() => onChange(index, choice)}
                      >
                        {choice}
                      </button>
                    );
                  })}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </fieldset>
  );
}
