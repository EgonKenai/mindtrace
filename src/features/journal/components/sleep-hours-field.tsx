import { zhCN } from "@/i18n/messages/zh-CN";

interface SleepHoursFieldProps {
  error?: string;
  hint: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}

export function SleepHoursField({
  error,
  hint,
  id,
  label,
  onChange,
  value,
}: SleepHoursFieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <label className="journal-field" htmlFor={id}>
      <span className="journal-field-label">{label}</span>
      <div className="number-with-unit">
        <input
          aria-describedby={error ? `${hintId} ${errorId}` : hintId}
          aria-invalid={Boolean(error)}
          id={id}
          inputMode="decimal"
          max={24}
          min={0}
          name="sleepHours"
          onChange={(event) => onChange(event.target.value)}
          required
          step="any"
          type="number"
          value={value}
        />
        <span aria-hidden="true">{zhCN.journal.form.hoursUnit}</span>
      </div>
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
