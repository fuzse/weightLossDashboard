/**
 * Linear regression: y = mx + b
 * Quadratic regression: y = ax² + bx + c
 *
 * We normalize timestamps to "days since first measurement" for numerical stability.
 */

export function daysSinceStart(timestamp, startTimestamp) {
  return (timestamp - startTimestamp) / (1000 * 60 * 60 * 24);
}

export function linearRegression(data, startTimestamp) {
  const n = data.length;
  if (n < 2) return null;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  for (const d of data) {
    const x = daysSinceStart(d.timestamp, startTimestamp);
    const y = d.weight;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;

  const m = (n * sumXY - sumX * sumY) / denom;
  const b = (sumY - m * sumX) / n;

  // Calculate R² and RMSE
  const meanY = sumY / n;
  let ssRes = 0, ssTot = 0;
  for (const d of data) {
    const x = daysSinceStart(d.timestamp, startTimestamp);
    const predicted = m * x + b;
    ssRes += (d.weight - predicted) ** 2;
    ssTot += (d.weight - meanY) ** 2;
  }

  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  const rmse = Math.sqrt(ssRes / n);

  return {
    type: 'linear',
    coefficients: { m, b },
    r2,
    rmse,
    predict: (timestamp) => {
      const x = daysSinceStart(timestamp, startTimestamp);
      return m * x + b;
    },
    formula: `y = ${m.toFixed(4)}x + ${b.toFixed(2)}`,
    formulaParts: { m, b },
  };
}

export function quadraticRegression(data, startTimestamp) {
  const n = data.length;
  if (n < 3) return null;

  // Solve normal equations for y = ax² + bx + c
  let S0 = 0, S1 = 0, S2 = 0, S3 = 0, S4 = 0;
  let T0 = 0, T1 = 0, T2 = 0;

  for (const d of data) {
    const x = daysSinceStart(d.timestamp, startTimestamp);
    const y = d.weight;
    const x2 = x * x;
    S0 += 1;
    S1 += x;
    S2 += x2;
    S3 += x * x2;
    S4 += x2 * x2;
    T0 += y;
    T1 += x * y;
    T2 += x2 * y;
  }

  // Solve 3x3 system via Cramer's rule
  // | S4 S3 S2 | | a |   | T2 |
  // | S3 S2 S1 | | b | = | T1 |
  // | S2 S1 S0 | | c |   | T0 |

  const det =
    S4 * (S2 * S0 - S1 * S1) -
    S3 * (S3 * S0 - S1 * S2) +
    S2 * (S3 * S1 - S2 * S2);

  if (Math.abs(det) < 1e-12) return null;

  const a =
    (T2 * (S2 * S0 - S1 * S1) -
      S3 * (T1 * S0 - S1 * T0) +
      S2 * (T1 * S1 - S2 * T0)) /
    det;

  const b =
    (S4 * (T1 * S0 - S1 * T0) -
      T2 * (S3 * S0 - S1 * S2) +
      S2 * (S3 * T0 - T1 * S2)) /
    det;

  const c =
    (S4 * (S2 * T0 - T1 * S1) -
      S3 * (S3 * T0 - T1 * S2) +
      T2 * (S3 * S1 - S2 * S2)) /
    det;

  // R² and RMSE
  const meanY = T0 / n;
  let ssRes = 0, ssTot = 0;
  for (const d of data) {
    const x = daysSinceStart(d.timestamp, startTimestamp);
    const predicted = a * x * x + b * x + c;
    ssRes += (d.weight - predicted) ** 2;
    ssTot += (d.weight - meanY) ** 2;
  }

  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  const rmse = Math.sqrt(ssRes / n);

  return {
    type: 'quadratic',
    coefficients: { a, b, c },
    r2,
    rmse,
    predict: (timestamp) => {
      const x = daysSinceStart(timestamp, startTimestamp);
      return a * x * x + b * x + c;
    },
    formula: `y = ${a.toFixed(6)}x² + ${b.toFixed(4)}x + ${c.toFixed(2)}`,
    formulaParts: { a, b, c },
  };
}
