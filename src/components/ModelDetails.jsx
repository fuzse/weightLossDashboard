export default function ModelDetails({ linearModel, quadModel, targetDates }) {
  if (!linearModel || !quadModel) return null;

  // Use next upcoming target for predictions
  const now = Date.now();
  const upcomingTargets = targetDates
    .filter((t) => new Date(t.date).getTime() > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextTarget = upcomingTargets[0] || targetDates[0];

  const targetTs = nextTarget ? new Date(nextTarget.date).getTime() : null;

  const models = [
    {
      model: linearModel,
      label: 'Linear Regression',
      glow: 'glow-green',
      accentColor: 'var(--accent-green)',
      prediction: targetTs ? linearModel.predict(targetTs) : null,
    },
    {
      model: quadModel,
      label: 'Quadratic Regression',
      glow: 'glow-blue',
      accentColor: 'var(--accent-blue)',
      prediction: targetTs ? quadModel.predict(targetTs) : null,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {models.map(({ model, label, glow, accentColor, prediction }) => (
        <div
          key={label}
          className={`card ${glow} p-5`}
          style={{ border: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-sm font-semibold"
              style={{ color: accentColor }}
            >
              {label}
            </h3>
            <div
              className="mono text-xs px-2 py-1 rounded-md"
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--text-muted)',
              }}
            >
              R² = {model.r2.toFixed(4)}
            </div>
          </div>

          <div className="code-block mb-4">{model.formula}</div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div
                className="text-xs mb-1 uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Prediction
              </div>
              <div className="mono text-lg" style={{ color: accentColor }}>
                {prediction !== null
                  ? `${prediction.toFixed(1)} lbs`
                  : '—'}
              </div>
              {nextTarget && (
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  by {formatDate(nextTarget.date)}
                </div>
              )}
            </div>
            <div>
              <div
                className="text-xs mb-1 uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                RMSE
              </div>
              <div className="mono text-lg" style={{ color: 'var(--text-secondary)' }}>
                {model.rmse.toFixed(2)} lbs
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                avg error
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
