import React, { useState, useEffect } from 'react';
import {
  Footprints,
  Flame,
  Clock,
  Compass,
  TrendingUp,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Zap,
  Plus,
  Volume2,
  VolumeX,
  Layers,
  MapPin,
  Activity,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { stepCounterService } from '../services/stepCounterService';
import { soundFeedback } from '../services/soundFeedback';
import { DailyStepSummary, StepTelemetry } from '../types/fitness';
import { useHealth } from '../context/HealthContext';
import { ActivityRingsView } from '../components/fitness/ActivityRingsView';

interface FitnessTrackerScreenProps {
  onOpenDebug?: () => void;
}

export const FitnessTrackerScreen: React.FC<FitnessTrackerScreenProps> = () => {
  const { user, language, todayStats, addSteps } = useHealth();

  const [todaySummary, setTodaySummary] = useState<DailyStepSummary>(() => stepCounterService.getTodaySummary());
  const [telemetry, setTelemetry] = useState<StepTelemetry>(() => stepCounterService.getTelemetry());
  const [soundEnabled, setSoundEnabled] = useState(soundFeedback.isEnabled());

  // Strava-grade Active Workout / Run / Walk Monitor State
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [isWorkoutPaused, setIsWorkoutPaused] = useState(false);
  const [workoutSeconds, setWorkoutSeconds] = useState(0);
  const [workoutStartSteps, setWorkoutStartSteps] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Subscribe to real-time step counter events
  useEffect(() => {
    const unsub = stepCounterService.subscribeToSteps((steps, telem) => {
      setTodaySummary(stepCounterService.getTodaySummary());
      setTelemetry(telem);
    });
    return () => unsub();
  }, []);

  // Strava stopwatch timer
  useEffect(() => {
    let interval: any = null;
    if (isWorkoutActive && !isWorkoutPaused) {
      interval = setInterval(() => {
        setWorkoutSeconds(sec => sec + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWorkoutActive, isWorkoutPaused]);

  // Start / Pause / Finish Strava Activity
  const handleStartWorkout = async () => {
    soundFeedback.playWorkoutTone(true);
    setIsWorkoutActive(true);
    setIsWorkoutPaused(false);
    setWorkoutSeconds(0);
    setWorkoutStartSteps(todaySummary.steps);
    await stepCounterService.startTracking();
    await stepCounterService.setWakeLock(true);
    showToast('Activity Started! Monitoring steps, pace & distance.');
  };

  const handlePauseWorkout = () => {
    soundFeedback.playClick();
    setIsWorkoutPaused(p => !p);
    showToast(isWorkoutPaused ? 'Activity Resumed' : 'Activity Paused');
  };

  const handleFinishWorkout = async () => {
    soundFeedback.playWorkoutTone(false);
    await stepCounterService.setWakeLock(false);
    const sessionSteps = Math.max(0, todaySummary.steps - workoutStartSteps);
    setIsWorkoutActive(false);
    setIsWorkoutPaused(false);
    showToast(`Great workout! +${sessionSteps.toLocaleString()} steps logged.`);
  };

  // Workout calculations (Strava metrics)
  const currentSessionSteps = Math.max(0, todaySummary.steps - workoutStartSteps);
  const currentSessionDistanceKm = parseFloat((currentSessionSteps * 0.00075).toFixed(2));
  const currentSessionCalories = Math.round(currentSessionSteps * 0.04);

  // Pace calculation (min:sec per km)
  const calculatePace = () => {
    if (currentSessionDistanceKm <= 0.05 || workoutSeconds < 10) return '0:00';
    const paceDecimal = (workoutSeconds / 60) / currentSessionDistanceKm;
    const paceMin = Math.floor(paceDecimal);
    const paceSec = Math.round((paceDecimal - paceMin) * 60);
    return `${paceMin}:${paceSec < 10 ? '0' : ''}${paceSec}`;
  };

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Quick Step Tester (+10, +50, +100 steps)
  const handleAddManualSteps = (count: number) => {
    soundFeedback.playClick();
    addSteps(count);
    setTodaySummary(stepCounterService.getTodaySummary());
    showToast(`+${count} steps added`);
  };

  const stepPercent = Math.min(100, Math.round((todaySummary.steps / (todaySummary.goal || 10000)) * 100));

  return (
    <div className="space-y-4 pb-4 animate-fade-in max-w-2xl mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-slate-700 animate-fade-in flex items-center space-x-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Fitness &amp; Steps</h2>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Apple Fitness &amp; Strava
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Accurate live step tracking and workout pace monitor
          </p>
        </div>

        <button
          onClick={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            soundFeedback.setSoundEnabled(next);
            if (next) soundFeedback.playClick();
          }}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs"
          title={soundEnabled ? 'Mute audio cues' : 'Enable audio cues'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-teal-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
        </button>
      </div>

      {/* 1. Apple Fitness Activity Rings Card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Activity Rings</span>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            {stepPercent}% Goal Reached
          </span>
        </div>

        {/* Apple Fitness Concentric Rings */}
        <div className="py-1">
          <ActivityRingsView
            steps={todaySummary.steps}
            stepGoal={todaySummary.goal || 10000}
            calories={todaySummary.caloriesKcal || Math.round(todaySummary.steps * 0.04)}
            calorieGoal={450}
            activeMinutes={todaySummary.activeMinutes || Math.round(todaySummary.steps / 100)}
            activeMinutesGoal={45}
            distanceKm={todaySummary.distanceKm || parseFloat((todaySummary.steps * 0.00075).toFixed(2))}
          />
        </div>

        {/* Big Apple Fitness Style Numbers */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
          <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] font-bold uppercase text-rose-600 tracking-wider block">Move</span>
            <span className="text-lg font-black text-slate-900">{todaySummary.caloriesKcal || Math.round(todaySummary.steps * 0.04)}</span>
            <span className="text-[10px] text-slate-400 block font-medium">kcal</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider block">Steps</span>
            <span className="text-lg font-black text-slate-900">{todaySummary.steps.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400 block font-medium">/ {(todaySummary.goal || 10000).toLocaleString()}</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] font-bold uppercase text-sky-600 tracking-wider block">Distance</span>
            <span className="text-lg font-black text-slate-900">{todaySummary.distanceKm || (todaySummary.steps * 0.00075).toFixed(2)}</span>
            <span className="text-[10px] text-slate-400 block font-medium">km</span>
          </div>
        </div>
      </div>

      {/* 2. Strava-Like Live Activity Tracker */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center">
              <Activity className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Strava Activity Monitor</h3>
              <p className="text-[11px] text-slate-500">Live walk, run, and step tracking session</p>
            </div>
          </div>

          {isWorkoutActive && (
            <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-orange-100 text-orange-900 text-xs font-bold animate-pulse border border-orange-300">
              <span className="w-2 h-2 rounded-full bg-orange-600" />
              <span>{isWorkoutPaused ? 'PAUSED' : 'RECORDING'}</span>
            </span>
          )}
        </div>

        {/* Live Metrics HUD */}
        {isWorkoutActive ? (
          <div className="space-y-4">
            {/* Big Stopwatch Timer */}
            <div className="text-center py-2 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">TIME ELAPSED</span>
              <span className="text-4xl sm:text-5xl font-mono font-black text-slate-900 tracking-tight">
                {formatTimer(workoutSeconds)}
              </span>
            </div>

            {/* 4 Strava Live Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">PACE</span>
                <span className="text-xl font-mono font-bold text-slate-900">{calculatePace()}</span>
                <span className="text-[10px] text-slate-500 block">/km</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">DISTANCE</span>
                <span className="text-xl font-mono font-bold text-slate-900">{currentSessionDistanceKm}</span>
                <span className="text-[10px] text-slate-500 block">km</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">LIVE STEPS</span>
                <span className="text-xl font-mono font-bold text-emerald-700">+{currentSessionSteps}</span>
                <span className="text-[10px] text-slate-500 block">steps</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">ENERGY</span>
                <span className="text-xl font-mono font-bold text-orange-600">+{currentSessionCalories}</span>
                <span className="text-[10px] text-slate-500 block">kcal</span>
              </div>
            </div>

            {/* Strava Session Controls */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handlePauseWorkout}
                className={`py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center space-x-1.5 ${
                  isWorkoutPaused
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                }`}
              >
                {isWorkoutPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
                <span>{isWorkoutPaused ? 'Resume' : 'Pause'}</span>
              </button>

              <button
                onClick={handleFinishWorkout}
                className="py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-all active:scale-95 flex items-center justify-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finish Activity</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              Record your outdoor walk, jog, or treadmill walk with real-time stride counting, GPS pace, and active calories.
            </p>

            <button
              onClick={handleStartWorkout}
              className="w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>START RECORDING (WALK / RUN)</span>
            </button>
          </div>
        )}

        {/* Quick Step Tester (+10, +50, +100 steps) */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-500">Quick Step Tester:</span>
          <div className="flex space-x-1.5">
            <button
              onClick={() => handleAddManualSteps(10)}
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-200 active:scale-95"
            >
              +10
            </button>
            <button
              onClick={() => handleAddManualSteps(50)}
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-200 active:scale-95"
            >
              +50
            </button>
            <button
              onClick={() => handleAddManualSteps(100)}
              className="px-2.5 py-1 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold border border-teal-200 active:scale-95"
            >
              +100
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
