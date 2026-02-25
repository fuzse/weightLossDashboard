export default function Disclaimer() {
  return (
    <div
      className="p-4 rounded-2xl text-xs leading-relaxed"
      style={{
        background: 'rgba(245, 158, 11, 0.06)',
        border: '1px solid rgba(245, 158, 11, 0.15)',
        color: 'var(--text-muted)',
      }}
    >
      <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>
        Accuracy Note:
      </span>{' '}
      Predictions are based on simple linear and quadratic regression models
      fitted to your historical weigh-in data. They do not account for
      metabolic adaptation, water retention, dietary changes, exercise
      variations, or other physiological factors. Use these projections as
      rough guides only — not as medical or nutritional advice. Consult a
      healthcare professional for personalized guidance.
    </div>
  );
}
