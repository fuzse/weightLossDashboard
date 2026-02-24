export default function ProgressCards({ weightData }) {
  if (!weightData.length) return null;

  const startWeight = weightData[0].weight;
  const currentWeight = weightData[weightData.length - 1].weight;
  const totalLost = startWeight - currentWeight;

  // Weekly rate: average over last 4 weeks or total period
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const totalWeeks =
    (weightData[weightData.length - 1].timestamp - weightData[0].timestamp) / msPerWeek;
  const weeklyRate = totalWeeks > 0 ? totalLost / totalWeeks : 0;

  const cards = [
    {
      label: 'Starting Weight',
      value: `${startWeight.toFixed(1)}`,
      unit: 'lbs',
      sub: formatDate(weightData[0].date),
    },
    {
      label: 'Current Weight',
      value: `${currentWeight.toFixed(1)}`,
      unit: 'lbs',
      sub: formatDate(weightData[weightData.length - 1].date),
    },
    {
      label: 'Total Lost',
      value: `${totalLost > 0 ? '-' : '+'}${Math.abs(totalLost).toFixed(1)}`,
      unit: 'lbs',
      sub: `Over ${Math.max(1, Math.round(totalWeeks))} weeks`,
    },
    {
      label: 'Weekly Rate',
      value: `${weeklyRate > 0 ? '-' : '+'}${Math.abs(weeklyRate).toFixed(2)}`,
      unit: 'lbs/wk',
      sub: weeklyRate > 0 ? 'Losing' : weeklyRate < 0 ? 'Gaining' : 'Stable',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="card p-4"
          style={{
            borderLeft: '3px solid var(--accent-green)',
          }}
        >
          <div
            className="text-xs mb-2 uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            {card.label}
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className="mono text-xl font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {card.value}
            </span>
            <span
              className="mono text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              {card.unit}
            </span>
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
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
