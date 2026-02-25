/**
 * Web Worker: streams through raw XML text using regex to extract only
 * HKQuantityTypeIdentifierBodyMass records. Avoids building a full DOM
 * tree, so even 200+ MB exports won't crash the browser.
 */

/* eslint-disable no-restricted-globals */
self.onmessage = function (e) {
  const text = e.data;

  try {
    const records = parseWeightRecords(text);
    self.postMessage({ type: 'result', data: records });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message });
  }
};

function parseWeightRecords(xml) {
  // Match only Record elements whose type is BodyMass.
  // Apple Health exports use self-closing <Record ... /> tags.
  const re =
    /<Record\s+[^>]*type="HKQuantityTypeIdentifierBodyMass"[^>]*\/>/g;

  const byDate = {};
  let match;

  while ((match = re.exec(xml)) !== null) {
    const tag = match[0];

    const valueMatch = tag.match(/value="([^"]+)"/);
    const unitMatch = tag.match(/unit="([^"]+)"/);
    const dateMatch =
      tag.match(/startDate="([^"]+)"/) ||
      tag.match(/creationDate="([^"]+)"/);

    if (!valueMatch || !dateMatch) continue;

    const rawValue = parseFloat(valueMatch[1]);
    const unit = unitMatch ? unitMatch[1] : 'lb';

    let weightLbs = rawValue;
    if (unit === 'kg') weightLbs = rawValue * 2.20462;

    if (isNaN(weightLbs)) continue;

    const date = new Date(dateMatch[1]);
    if (isNaN(date.getTime())) continue;

    const dateStr = date.toISOString().split('T')[0];
    const timestamp = date.getTime();
    const weight = Math.round(weightLbs * 10) / 10;

    // Deduplicate by date — accumulate for averaging
    if (!byDate[dateStr]) {
      byDate[dateStr] = { sum: 0, count: 0, timestamp };
    }
    byDate[dateStr].sum += weight;
    byDate[dateStr].count += 1;
  }

  const results = Object.entries(byDate)
    .map(([date, { sum, count, timestamp }]) => ({
      date,
      timestamp,
      weight: Math.round((sum / count) * 10) / 10,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  return results;
}
