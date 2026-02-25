export default function StatCards({ weightData, linearModel, quadModel, targetDates }) {
  if (!weightData.length || !linearModel || !quadModel) return null;

  // Find next upcoming target date
  const now = Date.now();
  const upcomingTargets = targetDates
    .filter((t) => new Date(t.date).getTime() > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const nextTarget = upcomingTargets[0] || targetDates[0];

  const currentWeight = weightData[weightData.length - 1].weight;
  const startWeight = weightData[0].weight;
  const totalLost = startWeight - currentWeight;

  let bestEstimate = null;
  let likelyRange = null;
  let targetLabel = null;

  if (nextTarget) {
    const targetTs = new Date(nextTarget.date).getTime();
    const linPred = linearModel.predict(targetTs);
    const quadPred = quadModel.predict(targetTs);
    bestEstimate = (linPred + quadPred) / 2;
    likelyRange = [bestEstimate - 2, bestEstimate + 2];
    targetLabel = nextTarget.label;
  }

  const cards = [
    {
      label: targetLabel ? `Best Estimate (${targetLabel})` : 'Best Estimate',
      value: bestEstimate !== null ? `${bestEstimate.toFixed(1)} lbs` : '—',
      sub: targetLabel
        ? formatDate(nextTarget.date)
        : 'Add a target date',
      glow: 'glow-green',
      accentColor: 'var(--accent-green)',
    },
    {
      label: 'Likely Range',
      value:
        likelyRange !== null
          ? `${likelyRange[0].toFixed(1)}–${likelyRange[1].toFixed(1)}`
          : '—',
      sub: '±2 lbs from average',
      glow: 'glow-blue',
      accentColor: 'var(--accent-blue)',
    },
    {
      label: 'Total Lost',
      value: `${totalLost > 0 ? '-' : '+'}${Math.abs(totalLost).toFixed(1)} lbs`,
      sub: `Since ${formatDate(weightData[0].date)}`,
      glow: 'glow-purple',
      accentColor: 'var(--accent-purple)',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`card ${card.glow} p-5`}
          style={{ border: '1px solid var(--border-subtle)' }}
        >
          <div
            className="text-xs font-medium mb-2 uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            {card.label}
          </div>
          <div
            className="mono text-2xl font-medium mb-1"
            style={{ color: card.accentColor }}
          >
            {card.value}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {card.sub}
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
