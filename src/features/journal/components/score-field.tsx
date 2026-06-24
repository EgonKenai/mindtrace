interface ScoreFieldProps {
  error?: string;
  hint: string;
  id: string;
  label: string;
  name: "mood" | "stress" | "energy" | "sleepQuality";
  onChange: (value: string) => void;
  value: string;
}

export function ScoreField({
  error,
  hint,
  id,
  label,
  name,
  onChange,
  value,
}: ScoreFieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <label className="journal-field" htmlFor={id}>
      <span className="journal-field-label">{label}</span>
      <input
        aria-describedby={error ? `${hintId} ${errorId}` : hintId}
        aria-invalid={Boolean(error)}
        id={id}
        inputMode="numeric"
        max={10}
        min={1}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        required
        step={1}
        type="number"
        value={value}
      />
      <small className="field-hint" id={hintId}>
        {hint}
      </small>
      {error && (
        <small className="field-error" id={errorId} role="alert">
          {error}
        </small>
      )}
    </label>
  );
}
