import { useState } from 'react';

export default function TargetDateManager({ targetDates, setTargetDates }) {
  const [label, setLabel] = useState('');
  const [date, setDate] = useState('');

  const addTarget = () => {
    if (!label.trim() || !date) return;

    setTargetDates((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        label: label.trim(),
        date,
      },
    ]);

    setLabel('');
    setDate('');
  };

  const removeTarget = (id) => {
    setTargetDates((prev) => prev.filter((t) => t.id !== id));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') addTarget();
  };

  return (
    <div className="card p-5">
      <h2
        className="text-sm font-semibold mb-4"
        style={{ color: 'var(--text-primary)' }}
      >
        Target Dates
      </h2>

      {/* Input row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          className="input flex-1"
          placeholder="Label (e.g. Wedding)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <input
          type="date"
          className="input"
          style={{ maxWidth: 200 }}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="btn"
          style={{
            background: 'rgba(245, 158, 11, 0.12)',
            borderColor: 'rgba(245, 158, 11, 0.25)',
            color: 'var(--accent-amber)',
            whiteSpace: 'nowrap',
          }}
          onClick={addTarget}
        >
          + Add Target
        </button>
      </div>

      {/* Target list */}
      {targetDates.length > 0 && (
        <div className="flex flex-col gap-2">
          {targetDates.map((t) => {
            const d = new Date(t.date + 'T00:00:00');
            const formatted = d.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const daysUntil = Math.ceil(
              (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            const isPast = daysUntil < 0;

            return (
              <div
                key={t.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{
                  background: 'rgba(245, 158, 11, 0.04)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: 3,
                      height: 28,
                      borderRadius: 2,
                      background: 'var(--accent-amber)',
                      opacity: isPast ? 0.3 : 1,
                    }}
                  />
                  <div>
                    <div
                      className="text-sm font-medium"
                      style={{
                        color: isPast
                          ? 'var(--text-muted)'
                          : 'var(--text-primary)',
                      }}
                    >
                      {t.label}
                    </div>
                    <div
                      className="mono text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {formatted}
                      {!isPast && (
                        <span style={{ color: 'var(--accent-amber)', marginLeft: 8 }}>
                          {daysUntil}d away
                        </span>
                      )}
                      {isPast && (
                        <span style={{ marginLeft: 8, opacity: 0.6 }}>past</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => removeTarget(t.id)}
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}

      {targetDates.length === 0 && (
        <div className="text-xs text-center py-3" style={{ color: 'var(--text-muted)' }}>
          No target dates set. Add a date to see predictions on the chart.
        </div>
      )}
    </div>
  );
}
