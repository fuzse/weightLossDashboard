import { XMLParser } from 'fast-xml-parser';

export function parseAppleHealthXML(xmlString) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  const parsed = parser.parse(xmlString);

  const healthData = parsed?.HealthData;
  if (!healthData) return [];

  let records = healthData.Record;
  if (!records) return [];
  if (!Array.isArray(records)) records = [records];

  const weightRecords = records
    .filter((r) => r['@_type'] === 'HKQuantityTypeIdentifierBodyMass')
    .map((r) => {
      const dateStr = r['@_startDate'] || r['@_creationDate'];
      const value = parseFloat(r['@_value']);
      const unit = r['@_unit'] || 'lb';

      let weightLbs = value;
      if (unit === 'kg') {
        weightLbs = value * 2.20462;
      }

      const date = new Date(dateStr);
      return {
        date: date.toISOString().split('T')[0],
        timestamp: date.getTime(),
        weight: Math.round(weightLbs * 10) / 10,
      };
    })
    .filter((r) => !isNaN(r.weight) && !isNaN(r.timestamp));

  // Deduplicate by date — keep the average for each day
  const byDate = {};
  for (const r of weightRecords) {
    if (!byDate[r.date]) {
      byDate[r.date] = { sum: 0, count: 0, timestamp: r.timestamp };
    }
    byDate[r.date].sum += r.weight;
    byDate[r.date].count += 1;
  }

  return Object.entries(byDate)
    .map(([date, { sum, count, timestamp }]) => ({
      date,
      timestamp,
      weight: Math.round((sum / count) * 10) / 10,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}
