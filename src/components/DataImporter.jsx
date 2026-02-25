import { useState, useRef, useCallback } from 'react';
import { parseAppleHealthXML } from '../utils/parseHealthData';

export default function DataImporter({ onDataLoaded, hasData }) {
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState(null);
  const [recordCount, setRecordCount] = useState(0);
  const fileInputRef = useRef(null);

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;

      setError(null);
      setParsing(true);

      try {
        // Pass the File object directly — parsing now runs in a Web Worker
        // using regex extraction instead of full XML parsing, so large
        // exports (200+ MB) won't OOM the browser.
        const records = await parseAppleHealthXML(file);

        if (records.length === 0) {
          setError(
            'No weight records found. Make sure the file is an Apple Health export.xml containing HKQuantityTypeIdentifierBodyMass records.'
          );
          setParsing(false);
          return;
        }

        setRecordCount(records.length);
        onDataLoaded(records);
      } catch (err) {
        setError(`Failed to parse file: ${err.message}`);
      } finally {
        setParsing(false);
      }
    },
    [onDataLoaded]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => setDragOver(false);

  const onFileSelect = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          {hasData ? 'Re-import Data' : 'Import Apple Health Data'}
        </h2>
        {hasData && recordCount > 0 && (
          <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
            {recordCount} weigh-ins loaded
          </span>
        )}
      </div>

      <div
        className={`drop-zone flex flex-col items-center justify-center p-8 text-center ${
          dragOver ? 'drag-over' : ''
        }`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xml"
          onChange={onFileSelect}
          className="hidden"
        />

        {parsing ? (
          <div>
            <div
              className="mono text-sm mb-2"
              style={{ color: 'var(--accent-blue)' }}
            >
              Parsing...
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Processing Apple Health export
            </p>
          </div>
        ) : (
          <div>
            <svg
              className="mx-auto mb-3"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              style={{ color: 'var(--text-muted)' }}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              {hasData
                ? 'Drop a new export.xml to update'
                : 'Drop your Apple Health export.xml here'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              or click to browse
            </p>
          </div>
        )}
      </div>

      {error && (
        <div
          className="mt-3 p-3 rounded-xl text-xs"
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#fca5a5',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
