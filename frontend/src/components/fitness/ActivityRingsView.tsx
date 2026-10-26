/**
 * Apple Fitness Style 3-Ring Activity Visualizer
 * Concentric animated SVG rings and interactive tap-to-focus mode.
 */

import React, { useState } from 'react';
import { Footprints, Flame, Clock, Compass } from 'lucide-react';
import { soundFeedback } from '../../services/soundFeedback';

interface ActivityRingsProps {
  steps: number;
  stepGoal: number;
  calories: number;
  calorieGoal?: number;
  activeMinutes: number;
  activeMinutesGoal?: number;
  distanceKm: number;
}

export const ActivityRingsView: React.FC<ActivityRingsProps> = ({
  steps,
  stepGoal,
  calories,
  calorieGoal = 450,
  activeMinutes,
  activeMinutesGoal = 60,
  distanceKm
}) => {
  const [selectedRing, setSelectedRing] = useState<'steps' | 'calories' | 'time' | 'overview'>('overview');

  const stepPercent = Math.min(100, Math.round((steps / Math.max(1, stepGoal)) * 100));
  const caloriePercent = Math.min(100, Math.round((calories / Math.max(1, calorieGoal)) * 100));
  const timePercent = Math.min(100, Math.round((activeMinutes / Math.max(1, activeMinutesGoal)) * 100));

  // Ring Geometry constants
  const size = 260;
  const strokeWidth = 16;
  const center = size / 2;

  // Radii
  const radiusSteps = 105;
  const radiusCalories = 82;
  const radiusTime = 59;

  const circumSteps = 2 * Math.PI * radiusSteps;
  const circumCalories = 2 * Math.PI * radiusCalories;
  const circumTime = 2 * Math.PI * radiusTime;

  const offsetSteps = circumSteps - (circumSteps * Math.min(100, stepPercent)) / 100;
  const offsetCalories = circumCalories - (circumCalories * Math.min(100, caloriePercent)) / 100;
  const offsetTime = circumTime - (circumTime * Math.min(100, timePercent)) / 100;

  const handleRingSelect = (ring: 'steps' | 'calories' | 'time' | 'overview') => {
    soundFeedback.playClick();
    setSelectedRing((curr) => (curr === ring ? 'overview' : ring));
  };

  return (
    <div className="flex flex-col items-center justify-center relative py-2">
      {/* Interactive Concentric Rings SVG */}
      <div className="relative w-[260px] h-[260px] flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90 origin-center"
        >
          <defs>
            {/* Soft Shadow Filter */}
            <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.2" />
            </filter>
          </defs>

          {/* BACKGROUND TRACKS */}
          <circle
            cx={center}
            cy={center}
            r={radiusSteps}
            fill="none"
            stroke="rgba(20, 184, 166, 0.15)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={center}
            cy={center}
            r={radiusCalories}
            fill="none"
            stroke="rgba(244, 63, 94, 0.15)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={center}
            cy={center}
            r={radiusTime}
            fill="none"
            stroke="rgba(16, 185, 129, 0.15)"
            strokeWidth={strokeWidth}
          />

          {/* ACTIVE PROGRESS RINGS */}
          {/* Ring 1: Steps (Outer) */}
          <circle
            cx={center}
            cy={center}
            r={radiusSteps}
            fill="none"
            stroke="#14b8a6"
            strokeWidth={strokeWidth}
            strokeDasharray={circumSteps}
            strokeDashoffset={offsetSteps}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out cursor-pointer"
            onClick={() => handleRingSelect('steps')}
          />

          {/* Ring 2: Calories (Middle) */}
          <circle
            cx={center}
            cy={center}
            r={radiusCalories}
            fill="none"
            stroke="#f97316"
            strokeWidth={strokeWidth}
            strokeDasharray={circumCalories}
            strokeDashoffset={offsetCalories}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out cursor-pointer"
            onClick={() => handleRingSelect('calories')}
          />

          {/* Ring 3: Active Time (Inner) */}
          <circle
            cx={center}
            cy={center}
            r={radiusTime}
            fill="none"
            stroke="#10b981"
            strokeWidth={strokeWidth}
            strokeDasharray={circumTime}
            strokeDashoffset={offsetTime}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out cursor-pointer"
            onClick={() => handleRingSelect('time')}
          />
        </svg>

        {/* Center Dynamic Cockpit Stats */}
        <div
          onClick={() => handleRingSelect('overview')}
          className="absolute inset-0 flex flex-col items-center justify-center text-center cursor-pointer select-none p-4"
        >
          {selectedRing === 'overview' && (
            <div className="space-y-0.5 animate-fade-in">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                DAILY METRICS
              </span>
              <div className="text-3xl font-black font-mono tracking-tight text-white">
                {steps.toLocaleString()}
              </div>
              <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider block">
                {stepPercent}% of Goal
              </span>
            </div>
          )}

          {selectedRing === 'steps' && (
            <div className="space-y-0.5 animate-fade-in text-teal-300">
              <Footprints className="w-5 h-5 mx-auto text-teal-400" />
              <div className="text-2xl font-black font-mono text-white">
                {steps.toLocaleString()}
              </div>
              <span className="text-[9px] font-bold uppercase text-slate-300">
                Step Target: {stepGoal.toLocaleString()}
              </span>
            </div>
          )}

          {selectedRing === 'calories' && (
            <div className="space-y-0.5 animate-fade-in text-rose-400">
              <Flame className="w-5 h-5 mx-auto text-rose-400" />
              <div className="text-2xl font-black font-mono text-white">
                {calories} <span className="text-xs font-normal">kcal</span>
              </div>
              <span className="text-[9px] font-bold uppercase text-slate-300">
                Burn Target: {calorieGoal} kcal
              </span>
            </div>
          )}

          {selectedRing === 'time' && (
            <div className="space-y-0.5 animate-fade-in text-emerald-400">
              <Clock className="w-5 h-5 mx-auto text-emerald-400" />
              <div className="text-2xl font-black font-mono text-white">
                {activeMinutes} <span className="text-xs font-normal">min</span>
              </div>
              <span className="text-[9px] font-bold uppercase text-slate-300">
                Active Goal: {activeMinutesGoal} min
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Ring Legend / Filter Pills */}
      <div className="flex items-center justify-center gap-2 mt-2">
        <button
          onClick={() => handleRingSelect('steps')}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border ${
            selectedRing === 'steps'
              ? 'bg-teal-500/20 text-teal-300 border-teal-500 shadow-xs'
              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-teal-400 shadow-xs shadow-teal-400" />
          <span>Steps ({stepPercent}%)</span>
        </button>

        <button
          onClick={() => handleRingSelect('calories')}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border ${
            selectedRing === 'calories'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-xs'
              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-400 shadow-xs shadow-rose-400" />
          <span>Move ({caloriePercent}%)</span>
        </button>

        <button
          onClick={() => handleRingSelect('time')}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border ${
            selectedRing === 'time'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-xs'
              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400" />
          <span>Exercise ({timePercent}%)</span>
        </button>
      </div>
    </div>
  );
};
