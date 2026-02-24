import { useState, useMemo } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
} from 'recharts';
import { daysSinceStart } from '../utils/regression';

const ACCENT = {
  green: '#22c55e',
  blue: '#3b82f6',
  amber: '#f59e0b',
  gray: '#6b7280',
  white: '#f1f5f9',
};

function formatXAxis(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div
      style={{
        background: 'rgba(10, 12, 16, 0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: '10px 14px',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
      }}
    >
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>
        {formatXAxis(d.date)}
      </div>
      {d.actual != null && (
        <div style={{ color: ACCENT.white }}>
          Actual: <strong>{d.actual.toFixed(1)} lbs</strong>
        </div>
      )}
      {d.linear != null && (
        <div style={{ color: ACCENT.green }}>
          Linear: {d.linear.toFixed(1)} lbs
        </div>
      )}
      {d.quadratic != null && (
        <div style={{ color: ACCENT.blue }}>
          Quadratic: {d.quadratic.toFixed(1)} lbs
        </div>
      )}
    </div>
  );
}

export default function WeightChart({
  weightData,
  linearModel,
  quadModel,
  targetDates,
}) {
  const [showLinear, setShowLinear] = useState(true);
  const [showQuadratic, setShowQuadratic] = useState(true);

  const chartData = useMemo(() => {
    if (!weightData.length) return [];

    const startTs = weightData[0].timestamp;
    const lastData = weightData[weightData.length - 1];

    // Determine end date: max of last data point + 30 days, or furthest target date
    let endTs = lastData.timestamp + 30 * 24 * 60 * 60 * 1000;
    for (const t of targetDates) {
      const tTs = new Date(t.date).getTime();
      if (tTs > endTs) endTs = tTs + 7 * 24 * 60 * 60 * 1000;
    }

    // Build date range at daily resolution from first measurement to endTs
    const points = [];
    const actualMap = {};
    for (const d of weightData) {
      actualMap[d.date] = d.weight;
    }

    // Step: figure out reasonable interval
    const totalDays = (endTs - startTs) / (1000 * 60 * 60 * 24);
    const stepDays = totalDays > 365 ? 3 : totalDays > 180 ? 2 : 1;

    let cursor = startTs;
    while (cursor <= endTs) {
      const dateStr = new Date(cursor).toISOString().split('T')[0];
      const actual = actualMap[dateStr] ?? null;
      const linear = linearModel ? linearModel.predict(cursor) : null;
      const quadratic = quadModel ? quadModel.predict(cursor) : null;

      points.push({
        date: dateStr,
        timestamp: cursor,
        actual,
        linear,
        quadratic,
      });

      cursor += stepDays * 24 * 60 * 60 * 1000;
    }

    // Ensure all actual data points are included
    for (const d of weightData) {
      const existing = points.find((p) => p.date === d.date);
      if (!existing) {
        points.push({
          date: d.date,
          timestamp: d.timestamp,
          actual: d.weight,
          linear: linearModel ? linearModel.predict(d.timestamp) : null,
          quadratic: quadModel ? quadModel.predict(d.timestamp) : null,
        });
      }
    }

    // Ensure target dates are included
    for (const t of targetDates) {
      const tTs = new Date(t.date).getTime();
      const existing = points.find((p) => p.date === t.date);
      if (!existing) {
        points.push({
          date: t.date,
          timestamp: tTs,
          actual: null,
          linear: linearModel ? linearModel.predict(tTs) : null,
          quadratic: quadModel ? quadModel.predict(tTs) : null,
        });
      }
    }

    points.sort((a, b) => a.timestamp - b.timestamp);
    return points;
  }, [weightData, linearModel, quadModel, targetDates]);

  // Calculate Y domain
  const yValues = chartData
    .flatMap((d) => [d.actual, d.linear, d.quadratic].filter((v) => v != null));
  const yMin = Math.floor(Math.min(...yValues) - 3);
  const yMax = Math.ceil(Math.max(...yValues) + 3);

  // Scatter data for target date prediction points
  const targetScatterData = targetDates
    .map((t) => {
      const tTs = new Date(t.date).getTime();
      const linPred = linearModel ? linearModel.predict(tTs) : null;
      const quadPred = quadModel ? quadModel.predict(tTs) : null;
      const avg = linPred != null && quadPred != null ? (linPred + quadPred) / 2 : null;
      return {
        date: t.date,
        value: avg,
        label: t.label,
      };
    })
    .filter((d) => d.value != null);

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="card p-5">
      {/* Toggle buttons */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xs mr-2" style={{ color: 'var(--text-muted)' }}>
          Models:
        </span>
        <button
          className={`btn text-xs ${showLinear && showQuadratic ? 'active' : ''}`}
          onClick={() => {
            setShowLinear(true);
            setShowQuadratic(true);
          }}
        >
          Both
        </button>
        <button
          className={`btn text-xs ${showLinear && !showQuadratic ? 'active' : ''}`}
          onClick={() => {
            setShowLinear(true);
            setShowQuadratic(false);
          }}
        >
          Linear Only
        </button>
        <button
          className={`btn text-xs ${!showLinear && showQuadratic ? 'active' : ''}`}
          onClick={() => {
            setShowLinear(false);
            setShowQuadratic(true);
          }}
        >
          Quadratic Only
        </button>
      </div>

      <ResponsiveContainer width="100%" height={420}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
          <CartesianGrid
            strokeDasharray="none"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />

          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            stroke="transparent"
            tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: '#64748b' }}
            interval="preserveStartEnd"
            minTickGap={50}
          />

          <YAxis
            domain={[yMin, yMax]}
            stroke="transparent"
            tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: '#64748b' }}
            tickFormatter={(v) => `${v}`}
            width={45}
            label={{
              value: 'lbs',
              position: 'insideTopLeft',
              offset: -5,
              style: {
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                fill: '#64748b',
              },
            }}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Today reference line */}
          <ReferenceLine
            x={todayStr}
            stroke={ACCENT.gray}
            strokeDasharray="6 4"
            strokeWidth={1}
            label={{
              value: 'Today',
              position: 'insideTopRight',
              style: {
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                fill: ACCENT.gray,
              },
            }}
          />

          {/* Target date reference lines */}
          {targetDates.map((t) => (
            <ReferenceLine
              key={t.id}
              x={t.date}
              stroke={ACCENT.amber}
              strokeDasharray="6 4"
              strokeWidth={1}
              label={{
                value: t.label,
                position: 'insideTopRight',
                style: {
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  fill: ACCENT.amber,
                },
              }}
            />
          ))}

          {/* Actual weight line */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke={ACCENT.white}
            strokeWidth={2}
            dot={{ r: 2.5, fill: ACCENT.white, strokeWidth: 0 }}
            activeDot={{ r: 4, fill: ACCENT.white, strokeWidth: 0 }}
            connectNulls={false}
            isAnimationActive={false}
          />

          {/* Linear projection */}
          {showLinear && (
            <Line
              type="monotone"
              dataKey="linear"
              stroke={ACCENT.green}
              strokeWidth={1.5}
              strokeDasharray="6 4"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          )}

          {/* Quadratic projection */}
          {showQuadratic && (
            <Line
              type="monotone"
              dataKey="quadratic"
              stroke={ACCENT.blue}
              strokeWidth={1.5}
              strokeDasharray="6 4"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          )}

          {/* Target date prediction dots */}
          {targetScatterData.map((td) => (
            <ReferenceLine
              key={`dot-${td.date}`}
              x={td.date}
              stroke="transparent"
              ifOverflow="extendDomain"
            />
          ))}

          <Scatter
            data={targetScatterData.map((td) => ({
              date: td.date,
              actual: td.value,
            }))}
            dataKey="actual"
            fill={ACCENT.amber}
            r={5}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-3 px-2">
        <LegendItem color={ACCENT.white} label="Actual" dashed={false} />
        {showLinear && <LegendItem color={ACCENT.green} label="Linear" dashed />}
        {showQuadratic && <LegendItem color={ACCENT.blue} label="Quadratic" dashed />}
        <LegendItem color={ACCENT.amber} label="Target" dashed dot />
      </div>
    </div>
  );
}

function LegendItem({ color, label, dashed, dot }) {
  return (
    <div className="flex items-center gap-2">
      {dot ? (
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
          }}
        />
      ) : (
        <div
          style={{
            width: 20,
            height: 2,
            background: color,
            borderStyle: dashed ? 'dashed' : 'solid',
            ...(dashed && {
              background: 'transparent',
              borderTop: `2px dashed ${color}`,
              height: 0,
            }),
          }}
        />
      )}
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
    </div>
  );
}
