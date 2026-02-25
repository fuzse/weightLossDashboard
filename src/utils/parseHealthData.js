/**
 * Parses Apple Health export.xml using a Web Worker + regex extraction.
 * Only pulls HKQuantityTypeIdentifierBodyMass records from the raw text,
 * so even 200+ MB files won't crash the browser.
 *
 * Returns a promise that resolves to sorted, deduplicated weight records.
 */

import ParseWorker from './parseWorker.js?worker';

export function parseAppleHealthXML(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const worker = new ParseWorker();

      worker.onmessage = (e) => {
        worker.terminate();
        if (e.data.type === 'result') {
          resolve(e.data.data);
        } else {
          reject(new Error(e.data.message));
        }
      };

      worker.onerror = (err) => {
        worker.terminate();
        reject(new Error(err.message || 'Worker failed'));
      };

      // Send raw text to the worker
      worker.postMessage(reader.result);
    };

    reader.onerror = () => reject(new Error('Failed to read file'));

    // Read as text — the string itself is fine in memory,
    // it's full XML->object parsing that causes OOM.
    reader.readAsText(file);
  });
}
