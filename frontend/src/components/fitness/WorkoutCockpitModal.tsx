/**
 * Apple Watch Ultra / Whoop Style Fullscreen Live Workout Cockpit
 * Real-time HUD with large readable typography, cadence tachometer,
 * pace metrics, pause/resume, and celebration summary.
 */

import React, { useState, useEffect } from 'react';
import {
  Footprints,
  Flame,
  Clock,
  Compass,
  Pause,
  Play,
  Square,
  Activity,
  X,
  Zap,
  Volume2,
  VolumeX
} from 'lucide-react';
import { soundFeedback } from '../../services/soundFeedback';

interface WorkoutCockpitModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutSeconds: number;
  sessionSteps: number;
  currentCadenceSpM: number;
  onTogglePause: () => void;
  isPaused: boolean;
}

export const WorkoutCockpitModal: React.FC<WorkoutCockpitModalProps> = ({
  isOpen,
  onClose,
  workoutSeconds,
  sessionSteps,
  currentCadenceSpM,
  onTogglePause,
  isPaused
}) => {
  const [soundOn, setSoundOn] = useState(soundFeedback.isEnabled());

  if (!isOpen) return null;

  // Calculations
  const distanceKm = parseFloat((sessionSteps * 0.00072).toFixed(2));
  const caloriesKcal = Math.round(sessionSteps * 0.041);

  // Pace: Minutes per kilometer
  const paceSecondsPerKm = distanceKm > 0.05 ? Math.round(workoutSeconds / distanceKm) : 0;
  const paceMins = Math.floor(paceSecondsPerKm / 60);
  const paceSecs = paceSecondsPerKm % 60;
  const paceStr = distanceKm > 0.05 ? `${paceMins}'${paceSecs < 10 ? '0' : ''}${paceSecs}"` : `--'--"`;

  // Format stopwatch
  const hrs = Math.floor(workoutSeconds / 3600);
  const mins = Math.floor((workoutSeconds % 3600) / 60);
  const secs = workoutSeconds % 60;

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    soundFeedback.setSoundEnabled(next);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-6 animate-fade-in select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Controls */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-black tracking-widest text-teal-400 uppercase">
            OUTDOOR WALK HUD
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={toggleSound}
            className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white"
            title="Toggle audio feedback"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-600" />}
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Stopwatch Timer */}
      <div className="relative z-10 text-center space-y-1 my-auto">
        <p className="text-xs font-black tracking-widest text-slate-400 uppercase">
          DURATION
        </p>
        <div className="text-6xl md:text-7xl font-black font-mono tracking-tighter text-white drop-shadow-md">
          {hrs > 0 && `${hrs}:`}
          {mins < 10 ? `0${mins}` : mins}:{secs < 10 ? `0${secs}` : secs}
        </div>

        {/* Live Cadence Pulse */}
        <div className="flex items-center justify-center space-x-2 pt-2">
          <Activity className="w-4 h-4 text-teal-400 animate-pulse" />
          <span className="text-sm font-mono font-bold text-teal-300">
            {currentCadenceSpM} SPM
          </span>
          <span className="text-xs text-slate-400 font-semibold">• Pace: {paceStr} /km</span>
        </div>
      </div>

      {/* 3 Large Cockpit Metrics */}
      <div className="relative z-10 grid grid-cols-3 gap-3 mb-6">
        {/* Steps */}
        <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-3xl border border-slate-800 text-center space-y-1">
          <Footprints className="w-5 h-5 mx-auto text-teal-400" />
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Steps</p>
          <p className="text-2xl font-black font-mono text-white">
            {sessionSteps.toLocaleString()}
          </p>
        </div>

        {/* Distance */}
        <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-3xl border border-slate-800 text-center space-y-1">
          <Compass className="w-5 h-5 mx-auto text-cyan-400" />
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Distance</p>
          <p className="text-2xl font-black font-mono text-white">
            {distanceKm} <span className="text-xs font-normal text-slate-400">km</span>
          </p>
        </div>

        {/* Calories */}
        <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-3xl border border-slate-800 text-center space-y-1">
          <Flame className="w-5 h-5 mx-auto text-rose-400" />
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Calories</p>
          <p className="text-2xl font-black font-mono text-white">
            {caloriesKcal} <span className="text-xs font-normal text-slate-400">kcal</span>
          </p>
        </div>
      </div>

      {/* Workout Action Controls */}
      <div className="relative z-10 flex items-center justify-center gap-4">
        {/* Pause / Resume */}
        <button
          onClick={onTogglePause}
          className={`flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-xl ${
            isPaused
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
          }`}
        >
          {isPaused ? (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>Resume Walk</span>
            </>
          ) : (
            <>
              <Pause className="w-5 h-5 fill-current" />
              <span>Pause</span>
            </>
          )}
        </button>

        {/* Finish / Stop */}
        <button
          onClick={onClose}
          className="px-6 py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm uppercase tracking-wider flex items-center space-x-2 transition-all active:scale-95 shadow-xl"
        >
          <Square className="w-5 h-5 fill-current" />
          <span>Finish</span>
        </button>
      </div>
    </div>
  );
};
