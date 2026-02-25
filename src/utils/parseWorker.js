/**
 * Web Worker: streams through a File in chunks using FileReaderSync + regex
 * to extract HKQuantityTypeIdentifierBodyMass records. Reads ~48 MB at a time
 * so even multi-GB Apple Health exports won't crash the browser.
 *
 * Protocol:
 *   Main → Worker:  { type: 'parse', file: File }
 *   Worker → Main:  { type: 'progress', percent: 0–100 }
 *   Worker → Main:  { type: 'result', data: [...] }
 *   Worker → Main:  { type: 'error', message: string }
 */

/* eslint-disable no-restricted-globals */

const CHUNK_SIZE = 48 * 1024 * 1024; // 48 MB per chunk

self.onmessage = function (e) {
  const msg = e.data;

  // New chunked protocol: receives a File object
  if (msg && msg.type === 'parse') {
    try {
      const records = parseFileChunked(msg.file);
      self.postMessage({ type: 'result', data: records });
    } catch (err) {
      self.postMessage({ type: 'error', message: err.message });
    }
    return;
  }

  // Legacy path: raw string (kept for backward compat with small files)
  if (typeof msg === 'string') {
    try {
      const byDate = {};
      extractRecords(msg, byDate);
      self.postMessage({ type: 'result', data: finalizeRecords(byDate) });
    } catch (err) {
      self.postMessage({ type: 'error', message: err.message });
    }
  }
};

function parseFileChunked(file) {
  const fileSize = file.size;
  const reader = new FileReaderSync();
  const byDate = {};

  let offset = 0;
  let leftover = '';

  while (offset < fileSize) {
    const end = Math.min(offset + CHUNK_SIZE, fileSize);
    const blob = file.slice(offset, end);
    const chunkText = reader.readAsText(blob);

    // Prepend leftover from the previous chunk (may contain a partial tag)
    const text = leftover + chunkText;
    const isLastChunk = end >= fileSize;

    if (isLastChunk) {
      // Process everything remaining
      extractRecords(text, byDate);
      leftover = '';
    } else {
      // Find the last complete '/>' to avoid splitting inside a tag
      const lastClose = text.lastIndexOf('/>');
      if (lastClose >= 0) {
        const safeEnd = lastClose + 2;
        extractRecords(text.substring(0, safeEnd), byDate);
        leftover = text.substring(safeEnd);
      } else {
        // No complete tag ending in this chunk — carry everything forward
        leftover = text;
      }
    }

    offset = end;

    // Report progress
    const percent = Math.round((end / fileSize) * 100);
    self.postMessage({ type: 'progress', percent });
  }

  return finalizeRecords(byDate);
}

/**
 * Scan text for BodyMass Record tags and accumulate into the byDate map.
 */
function extractRecords(text, byDate) {
  const re =
    /<Record\s+[^>]*type="HKQuantityTypeIdentifierBodyMass"[^>]*\/>/g;

  let match;
  while ((match = re.exec(text)) !== null) {
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
}

/**
 * Convert the accumulated byDate map into a sorted results array.
 */
function finalizeRecords(byDate) {
  return Object.entries(byDate)
    .map(([date, { sum, count, timestamp }]) => ({
      date,
      timestamp,
      weight: Math.round((sum / count) * 10) / 10,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}
