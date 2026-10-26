/**
 * Interactive 24-Hour Scrubber & Activity Timeline
 * Scrub or tap across the 24 hours of the day with instant feedback,
 * highlighting peak activity hours and step density.
 */

import React, { useState } from 'react';
import { Activity, Flame, Compass, Clock } from 'lucide-react';
import { HourlyStepRecord } from '../../types/fitness';
import { soundFeedback } from '../../services/soundFeedback';

interface InteractiveHourlyTimelineProps {
  hourlyRecords: HourlyStepRecord[];
  isToday: boolean;
}

export const InteractiveHourlyTimeline: React.FC<InteractiveHourlyTimelineProps> = ({
  hourlyRecords,
  isToday
}) => {
  const currentHour = new Date().getHours();
  const [selectedHour, setSelectedHour] = useState<number>(isToday ? currentHour : 14);

  const activeHourRecord = hourlyRecords.find((h) => h.hour === selectedHour) || {
    hour: selectedHour,
    hourLabel: `${selectedHour % 12 || 12} ${selectedHour >= 12 ? 'PM' : 'AM'}`,
    steps: 0
  };

  const maxHourSteps = Math.max(1, ...hourlyRecords.map((h) => h.steps));
  const activeDistance = parseFloat((activeHourRecord.steps * 0.00072).toFixed(2));
  const activeCalories = Math.round(activeHourRecord.steps * 0.041);
  const activeMinutes = Math.round(activeHourRecord.steps / 105);

  const handleSelectHour = (h: number) => {
    soundFeedback.playClick();
    setSelectedHour(h);
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-3xl border border-slate-800 shadow-xl space-y-4">
      {/* Header & Selected Slice Inspector */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              24-Hour Timeline
            </h4>
            <p className="text-[10px] text-slate-400">
              Tap any hour to inspect detailed movement metrics
            </p>
          </div>
        </div>

        {/* Selected Hour Label */}
        <div className="text-right">
          <span className="text-xs font-black font-mono text-teal-300 bg-teal-950/80 px-2.5 py-1 rounded-xl border border-teal-500/30">
            {activeHourRecord.hourLabel} - {((selectedHour + 1) % 12 || 12)} {((selectedHour + 1) >= 12 && (selectedHour + 1) < 24) || (selectedHour + 1) === 12 ? 'PM' : 'AM'}
          </span>
        </div>
      </div>

      {/* Selected Hour Insight Pill Strip */}
      <div className="grid grid-cols-4 gap-2 bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800/90 text-center">
        <div>
          <p className="text-[9px] uppercase font-bold text-slate-500">Steps</p>
          <p className="text-sm font-black font-mono text-white">
            {activeHourRecord.steps.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase font-bold text-slate-500">Distance</p>
          <p className="text-sm font-black font-mono text-teal-300">
            {activeDistance} <span className="text-[9px]">km</span>
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase font-bold text-slate-500">Burn</p>
          <p className="text-sm font-black font-mono text-rose-400">
            {activeCalories} <span className="text-[9px]">kcal</span>
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase font-bold text-slate-500">Active</p>
          <p className="text-sm font-black font-mono text-emerald-400">
            {activeMinutes} <span className="text-[9px]">min</span>
          </p>
        </div>
      </div>

      {/* 24 Bar Visualizer */}
      <div className="pt-2">
        <div className="h-32 flex items-end justify-between gap-1 px-1">
          {hourlyRecords.map((h) => {
            const isSelected = h.hour === selectedHour;
            const isCurrent = isToday && h.hour === currentHour;
            const heightPercent = Math.max(6, Math.round((h.steps / maxHourSteps) * 100));

            return (
              <button
                key={h.hour}
                type="button"
                onClick={() => handleSelectHour(h.hour)}
                className="flex-1 flex flex-col items-center group relative h-full justify-end focus:outline-hidden"
              >
                {/* Floating Micro Indicator for Selected Hour */}
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-300 mb-1 animate-ping" />
                )}

                <div
                  className={`w-full rounded-t-sm transition-all duration-300 ${
                    isSelected
                      ? 'bg-teal-400 shadow-md scale-x-110'
                      : isCurrent
                      ? 'bg-teal-400'
                      : h.steps > 0
                      ? 'bg-slate-700 hover:bg-slate-500'
                      : 'bg-slate-800/50 hover:bg-slate-700/50'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
              </button>
            );
          })}
        </div>

        {/* Timeline Axis Labels */}
        <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold px-1 pt-2 border-t border-slate-800">
          <span>12 AM</span>
          <span>4 AM</span>
          <span>8 AM</span>
          <span>12 PM</span>
          <span>4 PM</span>
          <span>8 PM</span>
          <span>11 PM</span>
        </div>
      </div>
    </div>
  );
};
