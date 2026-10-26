/**
 * Cadence Metronome & Biometric Pace Indicator
 * Dynamic rhythm visualizer with real-time SPM needle and pace category.
 */

import React from 'react';
import { Activity, Zap } from 'lucide-react';
import { MotionState } from '../../types/fitness';

interface CadenceMetronomeProps {
  currentCadenceSpM: number;
  motionState: MotionState;
}

export const CadenceMetronomeBar: React.FC<CadenceMetronomeProps> = ({
  currentCadenceSpM,
  motionState
}) => {
  // Determine cadence zone
  const getZone = (spm: number) => {
    if (spm <= 0) return { label: 'Stationary / Rest', color: 'text-slate-400', barColor: 'bg-slate-700', level: 0 };
    if (spm < 95) return { label: 'Light Stroll', color: 'text-cyan-400', barColor: 'bg-cyan-500', level: 1 };
    if (spm < 120) return { label: 'Brisk Walking', color: 'text-emerald-400', barColor: 'bg-emerald-500', level: 2 };
    if (spm < 145) return { label: 'Aerobic Power Walk', color: 'text-amber-400', barColor: 'bg-amber-500', level: 3 };
    return { label: 'High Intensity Running', color: 'text-rose-400', barColor: 'bg-rose-500', level: 4 };
  };

  const zone = getZone(currentCadenceSpM);
  // Cap at 180 spm for meter
  const meterPercent = Math.min(100, Math.round((currentCadenceSpM / 180) * 100));

  return (
    <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-3xl border border-slate-800 shadow-md space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-slate-300">
            Live Cadence & Pace
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`text-[10px] font-black uppercase ${zone.color}`}>
            {zone.label}
          </span>
          <span className="text-xs font-mono font-black text-white bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
            {currentCadenceSpM} <span className="text-[10px] text-slate-400">SPM</span>
          </span>
        </div>
      </div>

      {/* Dynamic Cadence Gauge Bar */}
      <div className="space-y-1">
        <div className="w-full bg-slate-950 rounded-full h-2.5 p-0.5 border border-slate-800 overflow-hidden relative">
          {/* Target Zone Marker (100 - 125 SPM is optimal health walk) */}
          <div
            className="absolute top-0 bottom-0 bg-teal-500/20 border-x border-teal-400/40 z-0"
            style={{ left: `${(100 / 180) * 100}%`, width: `${(25 / 180) * 100}%` }}
            title="Optimal Health Walking Cadence Zone"
          />

          <div
            className={`h-full rounded-full transition-all duration-300 relative z-10 ${zone.barColor} ${
              currentCadenceSpM > 0 ? 'shadow-md shadow-teal-500/50' : ''
            }`}
            style={{ width: `${Math.max(4, meterPercent)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[9px] text-slate-500 font-semibold px-0.5">
          <span>0 SPM</span>
          <span className="text-teal-400">Optimal Zone (100-125)</span>
          <span>180+ SPM</span>
        </div>
      </div>

      {/* Cadence Rhythm Waveform Pulse */}
      {currentCadenceSpM > 0 && (
        <div className="flex items-center justify-center space-x-1 pt-1 opacity-80">
          {[0.3, 0.6, 0.9, 1, 0.8, 0.5, 0.9, 0.4, 0.7].map((height, i) => (
            <div
              key={i}
              className="w-1 bg-teal-400 rounded-full animate-pulse"
              style={{
                height: `${Math.round(height * 14)}px`,
                animationDuration: `${Math.max(0.3, 60 / currentCadenceSpM)}s`,
                animationDelay: `${i * 0.05}s`
              }}
            />
          ))}
          <span className="text-[10px] text-teal-300 font-bold ml-2">Rhythm Synced</span>
        </div>
      )}
    </div>
  );
};
