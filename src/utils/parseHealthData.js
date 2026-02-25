/**
 * Parses Apple Health export.xml using a Web Worker that streams through the
 * file in ~48 MB chunks. Only pulls HKQuantityTypeIdentifierBodyMass records,
 * so even multi-GB exports won't crash the browser.
 *
 * Returns a promise that resolves to sorted, deduplicated weight records.
 */

import ParseWorker from './parseWorker.js?worker';

export function parseAppleHealthXML(file, onProgress) {
  return new Promise((resolve, reject) => {
    const worker = new ParseWorker();

    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        if (typeof onProgress === 'function') {
          onProgress(msg.percent);
        }
      } else if (msg.type === 'result') {
        worker.terminate();
        resolve(msg.data);
      } else if (msg.type === 'error') {
        worker.terminate();
        reject(new Error(msg.message));
      }
    };

    worker.onerror = (err) => {
      worker.terminate();
      reject(new Error(err.message || 'Worker failed'));
    };

    // Send the File object directly — it's transferred by reference (no copy),
    // and the worker reads it in chunks using FileReaderSync.
    worker.postMessage({ type: 'parse', file });
  });
}
