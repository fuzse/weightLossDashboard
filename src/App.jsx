import { useState, useMemo } from 'react';
import DataImporter from './components/DataImporter';
import StatCards from './components/StatCards';
import WeightChart from './components/WeightChart';
import ModelDetails from './components/ModelDetails';
import TargetDateManager from './components/TargetDateManager';
import ProgressCards from './components/ProgressCards';
import Disclaimer from './components/Disclaimer';
import { linearRegression, quadraticRegression } from './utils/regression';

function App() {
  const [weightData, setWeightData] = useState([]);
  const [targetDates, setTargetDates] = useState([
    { id: 'default-1', label: 'Wedding', date: '2026-04-20' },
  ]);

  const hasData = weightData.length > 0;

  const startTimestamp = hasData ? weightData[0].timestamp : 0;

  const linearModel = useMemo(
    () => (hasData ? linearRegression(weightData, startTimestamp) : null),
    [weightData, startTimestamp, hasData]
  );

  const quadModel = useMemo(
    () => (hasData ? quadraticRegression(weightData, startTimestamp) : null),
    [weightData, startTimestamp, hasData]
  );

  const handleDataLoaded = (records) => {
    setWeightData(records);
  };

  return (
    <div
      className="min-h-screen"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Weight Loss Tracker
            </h1>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Predictive modeling dashboard
            </p>
          </div>
          {hasData && (
            <div
              className="mono text-xs px-3 py-1.5 rounded-lg"
              style={{
                background: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                color: 'var(--accent-green)',
              }}
            >
              {weightData.length} data points
            </div>
          )}
        </div>

        {/* Data Importer — always visible so user can re-import */}
        {!hasData && <DataImporter onDataLoaded={handleDataLoaded} hasData={hasData} />}

        {/* Dashboard content — only when data is loaded */}
        {hasData && (
          <>
            {/* Summary Stat Cards */}
            <StatCards
              weightData={weightData}
              linearModel={linearModel}
              quadModel={quadModel}
              targetDates={targetDates}
            />

            {/* Main Chart */}
            <WeightChart
              weightData={weightData}
              linearModel={linearModel}
              quadModel={quadModel}
              targetDates={targetDates}
            />

            {/* Model Details */}
            <ModelDetails
              linearModel={linearModel}
              quadModel={quadModel}
              targetDates={targetDates}
            />

            {/* Target Date Manager + Re-import side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TargetDateManager
                targetDates={targetDates}
                setTargetDates={setTargetDates}
              />
              <DataImporter onDataLoaded={handleDataLoaded} hasData={hasData} />
            </div>

            {/* Progress Cards */}
            <ProgressCards weightData={weightData} />

            {/* Disclaimer */}
            <Disclaimer />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
