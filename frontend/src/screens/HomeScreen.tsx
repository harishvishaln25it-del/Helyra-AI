import React, { useState } from 'react';
import {
  Footprints,
  Droplets,
  Moon,
  Pill,
  Utensils,
  Plus,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  HeartPulse,
  TrendingUp,
  AlertCircle,
  BellRing,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Flame,
  RotateCcw,
  Check,
  X
} from 'lucide-react';
import { useHealth } from '../context/HealthContext';

interface HomeScreenProps {
  onOpenSOS: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onOpenSOS }) => {
  const {
    user,
    todayStats,
    medications,
    family,
    selectedDate,
    setSelectedDate,
    availableDays,
    addWater,
    addCalories,
    setCalories,
    setActiveScreen,
    speakProactiveGoalNudge,
    siriWakeWordEnabled,
    proactiveVoiceCoachEnabled,
    language,
    t
  } = useHealth();
  const [waterSuccessAlert, setWaterSuccessAlert] = useState(false);
  const [kcalSuccessToast, setKcalSuccessToast] = useState<string | null>(null);

  // Modal for dynamic custom calorie adjustments
  const [showKcalModal, setShowKcalModal] = useState(false);
  const [directKcalInput, setDirectKcalInput] = useState('');
  const [customMealName, setCustomMealName] = useState('');
  const [customKcalAmount, setCustomKcalAmount] = useState('');
  const [customSugarGrams, setCustomSugarGrams] = useState('');

  // Time-based greeting in active language
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.greetingMorning;
    if (hour < 17) return t.greetingAfternoon;
    return t.greetingEvening;
  };

  const completedMeds = todayStats.medsTaken ?? medications.filter(m => m.status === 'taken').length;
  const totalMeds = todayStats.medsTotal ?? medications.length;
  const waterLiters = (todayStats.waterMl / 1000).toFixed(1);
  const waterGoalLiters = (todayStats.waterGoalMl / 1000).toFixed(1);
  const waterPercent = Math.min(100, Math.round((todayStats.waterMl / todayStats.waterGoalMl) * 100));
  const stepPercent = Math.min(100, Math.round((todayStats.steps / todayStats.stepGoal) * 100));
  const caloriePercent = Math.min(100, Math.round((todayStats.caloriesKcal / (todayStats.calorieGoalKcal || 2000)) * 100));
  const burnedKcal = todayStats.burnedKcal ?? Math.round(todayStats.steps * 0.04);
  const netKcal = todayStats.netKcal ?? (todayStats.caloriesKcal - burnedKcal);

  const handleQuickWater = (amountMl: number) => {
    addWater(amountMl);
    setWaterSuccessAlert(true);
    setTimeout(() => setWaterSuccessAlert(false), 2000);
  };

  const triggerKcalToast = (msg: string) => {
    setKcalSuccessToast(msg);
    setTimeout(() => setKcalSuccessToast(null), 2500);
  };

  const handleQuickAddKcal = (amount: number, label?: string) => {
    addCalories(amount, label);
    triggerKcalToast(`+${amount} kcal ${t.quickKcalAdded}`);
  };

  const handleSaveDirectKcal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(directKcalInput, 10);
    if (!isNaN(val) && val >= 0) {
      setCalories(val);
      triggerKcalToast(`${val} kcal ${t.quickKcalAdded}`);
      setDirectKcalInput('');
      setShowKcalModal(false);
    }
  };

  const handleAddCustomMeal = (e: React.FormEvent) => {
    e.preventDefault();
    const cal = parseInt(customKcalAmount, 10);
    const sugar = parseInt(customSugarGrams, 10) || 0;
    if (!isNaN(cal) && cal > 0) {
      addCalories(cal, customMealName.trim() || undefined, sugar);
      triggerKcalToast(`+${cal} kcal ${t.quickKcalAdded}`);
      setCustomMealName('');
      setCustomKcalAmount('');
      setCustomSugarGrams('');
      setShowKcalModal(false);
    }
  };

  // Day navigation helpers
  const currentDayIndex = availableDays.findIndex(d => d.date === selectedDate);
  const goToPreviousDay = () => {
    if (currentDayIndex < availableDays.length - 1) {
      setSelectedDate(availableDays[currentDayIndex + 1].date);
    }
  };
  const goToNextDay = () => {
    if (currentDayIndex > 0) {
      setSelectedDate(availableDays[currentDayIndex - 1].date);
    }
  };

  // AI insight text
  const getAiInsightText = () => {
    if (language === 'ta') {
      return `இன்று நடைப்பயிற்சி அருமை (${todayStats.steps.toLocaleString()} அடிகள்)! உங்கள் தண்ணீர் அளவு ${waterLiters} லிட்டர், உங்கள் இலக்கான ${waterGoalLiters} லிட்டரை அடைய இன்னும் சிறிது குடிக்கவும்.`;
    }
    return `You've been consistent with your walking today (${todayStats.steps.toLocaleString()} steps). Your water intake is at ${waterLiters} L, which is slightly below your ${waterGoalLiters} L personal goal.`;
  };

  return (
    <div className="space-y-4 pb-2 animate-fade-in">
      {/* Friendly Greeting Header - Clean & Simple */}
      <div className="bg-white text-slate-900 p-5 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-teal-700 font-semibold text-xs tracking-wider uppercase">{t.companionBadge}</p>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              {getGreeting()}, {user.name.split(' ')[0]}
            </h2>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-teal-50 border border-teal-200 rounded-full">
            <HeartPulse className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-xs font-semibold text-teal-800">{t.activeStatus}</span>
          </div>
        </div>

        {/* Adaptive AI Insight Banner */}
        <div className="mt-3.5 bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-start space-x-3">
          <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 shrink-0 mt-0.5 border border-teal-200/50">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">{t.adaptiveInsightTitle}</p>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              "{getAiInsightText()}"
            </p>
          </div>
        </div>
      </div>

      {/* Day-by-Day Health History Ribbon */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {t.dayByDayHistory}
            </h3>
          </div>

          <div className="flex items-center space-x-1.5">
            {selectedDate !== availableDays[0]?.date && (
              <button
                onClick={() => setSelectedDate(availableDays[0]?.date)}
                className="text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-0.5 rounded-lg border border-teal-200 transition-colors"
              >
                {t.jumpToToday}
              </button>
            )}
            <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                onClick={goToPreviousDay}
                disabled={currentDayIndex >= availableDays.length - 1}
                className="p-1 rounded-md hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 transition-colors"
                title="Previous Day"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-bold text-slate-600 px-1">
                {todayStats.dayLabel}
              </span>
              <button
                onClick={goToNextDay}
                disabled={currentDayIndex <= 0}
                className="p-1 rounded-md hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 transition-colors"
                title="Next Day"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 7-Day Quick Selector Cards */}
        <div className="grid grid-cols-7 gap-1.5">
          {availableDays.slice().reverse().map((day) => {
            const isSelected = day.date === selectedDate;
            const isToday = day.date === availableDays[0]?.date;
            const dateNum = day.date.split('-')[2] || '';
            return (
              <button
                key={day.date}
                onClick={() => setSelectedDate(day.date)}
                className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all relative ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span className={`text-[10px] font-bold tracking-tight uppercase ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>
                  {isToday ? (language === 'ta' ? 'இன்று' : 'Today') : day.dayLabel.slice(0, 3)}
                </span>
                <span className={`text-sm font-bold my-0.5 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {dateNum}
                </span>
                <span className={`text-[9px] font-semibold px-1 rounded-full ${
                  isSelected ? 'bg-teal-700 text-teal-100' : 'bg-slate-200/80 text-slate-600'
                }`}>
                  {day.caloriesKcal}k
                </span>
              </button>
            );
          })}
        </div>

        {/* Past Day Notice Banner */}
        {selectedDate !== availableDays[0]?.date && (
          <div className="flex items-center justify-between text-[11px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700">
            <span className="font-medium">
              {t.viewingDay}: <strong>{todayStats.dayLabel} ({todayStats.displayDate})</strong> • {todayStats.steps.toLocaleString()} {t.stepsLabel} • {todayStats.caloriesKcal} kcal
            </span>
            <button
              onClick={() => setSelectedDate(availableDays[0]?.date)}
              className="text-xs font-bold text-teal-700 underline ml-2 shrink-0 hover:text-teal-900"
            >
              {t.jumpToToday}
            </button>
          </div>
        )}
      </div>

      {/* Primary Health Metric Cards - Clean, Unified, Apple Health Style */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-800">{t.todaysProgress}</h3>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              {todayStats.displayDate}
            </span>
          </div>
          <span className="text-xs font-medium text-slate-400">{t.liveSync}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Activity / Steps Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveScreen('fitness')}
                className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 hover:bg-teal-100 transition-colors"
                title="Open Fitness Tracker"
              >
                <Footprints className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveScreen('fitness')}
                className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-lg border border-slate-200 transition-colors"
              >
                {stepPercent}%
              </button>
            </div>
            <div
              className="cursor-pointer"
              onClick={() => setActiveScreen('fitness')}
              title="Open Fitness Tracker"
            >
              <p className="text-xs font-medium text-slate-500">{t.activityLabel}</p>
              <p className="text-xl font-bold text-slate-900 tracking-tight">{todayStats.steps.toLocaleString()}</p>
              <p className="text-[11px] text-slate-500">{t.goalSteps}: {todayStats.stepGoal.toLocaleString()} {t.stepsLabel}</p>
            </div>
            <div
              className="w-full bg-slate-100 rounded-full h-2 overflow-hidden cursor-pointer"
              onClick={() => setActiveScreen('fitness')}
            >
              <div
                className="bg-teal-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${stepPercent}%` }}
              />
            </div>
            <div>
              <button
                onClick={() => setActiveScreen('fitness')}
                className="w-full py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all flex items-center justify-center space-x-1"
              >
                <span>View Strava Workout &rarr;</span>
              </button>
            </div>
          </div>

          {/* Water Intake Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative">
            {waterSuccessAlert && (
              <span className="absolute top-2 right-2 text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full border border-teal-300 animate-fade-in z-20">
                {t.waterLoggedAlert}
              </span>
            )}
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                <Droplets className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                {waterPercent}%
              </span>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">{t.waterIntakeLabel}</p>
              <p className="text-xl font-bold text-slate-900 tracking-tight">{waterLiters} L</p>
              <p className="text-[11px] text-slate-500">{t.waterGoalLabel}: {waterGoalLiters} L</p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-teal-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${waterPercent}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleQuickWater(100)}
                className="py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all active:scale-95 text-center"
              >
                +100ml
              </button>
              <button
                onClick={() => handleQuickWater(200)}
                className="py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all active:scale-95 text-center"
              >
                +200ml
              </button>
            </div>
          </div>

          {/* Daily Tablets Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                <Pill className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                {completedMeds}/{totalMeds}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Daily Medicines</p>
              <p className="text-xl font-bold text-slate-900 tracking-tight">
                {completedMeds === totalMeds ? 'All Medicines Taken' : `${totalMeds - completedMeds} Medicine Pending`}
              </p>
              <p className="text-[11px] text-slate-500">Keep up consistent daily dosage</p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-teal-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${totalMeds > 0 ? (completedMeds / totalMeds) * 100 : 0}%` }}
              />
            </div>
            <button
              onClick={() => setActiveScreen('meds')}
              className="w-full py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all active:scale-95"
            >
              Manage Tablets &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Body Weight Metric Bar (Sleep removed as requested) */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">{t.bodyWeight}</p>
            <p className="text-base font-bold text-slate-900">{todayStats.weightKg} kg</p>
          </div>
        </div>
        <span className="text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
          {t.weightTrend}
        </span>
      </div>

      {/* Family Circle Glance */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900">{family.name}</h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {t.connectedFamily}
            </span>
          </div>
          <button
            onClick={() => setActiveScreen('family')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center space-x-1"
          >
            <span>{t.familyDetails}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {family.members.map(member => (
            <div
              key={member.userId}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0"
                  style={{ backgroundColor: member.avatarColor }}
                >
                  {member.name[0]}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-xs font-bold text-slate-900">{member.name}</p>
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md">
                      {member.userFamilyCode || 'HL-5819'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {member.stepsToday.toLocaleString()} steps • Water: {member.waterPercent}%
                  </p>
                </div>
              </div>

              {/* Highlighted Tablet Intake Status */}
              <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
                <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center space-x-1.5 ${
                  member.medsTaken === member.medsTotal
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  <Pill className="w-3.5 h-3.5" />
                  <span>
                    {member.medsTaken}/{member.medsTotal} Medicines Taken {member.medsTaken === member.medsTotal ? '✓' : '(Pending)'}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-slate-400 text-center">
          {t.familyPrivacyNotice}
        </p>
      </div>

      {/* Quick Action Buttons for Quick Access */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          onClick={() => setActiveScreen('meds')}
          className="p-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center space-x-1.5 border border-slate-200"
        >
          <Pill className="w-3.5 h-3.5 text-teal-600" />
          <span className="truncate">My Medicines</span>
        </button>

        <button
          onClick={() => setActiveScreen('family')}
          className="p-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center space-x-1.5 border border-slate-200"
        >
          <HeartPulse className="w-3.5 h-3.5 text-teal-600" />
          <span className="truncate">Family Circle</span>
        </button>

        <button
          onClick={() => setActiveScreen('docs')}
          className="p-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center space-x-1.5 border border-slate-200"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span className="truncate">{t.doctorRecords}</span>
        </button>
      </div>

      {/* Floating Kcal / Metric Success Toast */}
      {kcalSuccessToast && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-lg border border-slate-800 flex items-center space-x-2 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{kcalSuccessToast}</span>
        </div>
      )}

      {/* Dynamic Adjust Calories Modal Sheet */}
      {showKcalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{t.adjustCalories}</h3>
                  <p className="text-[11px] text-slate-500">
                    {todayStats.dayLabel} ({todayStats.displayDate}) • {t.currentCalories}: <strong>{todayStats.caloriesKcal} kcal</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowKcalModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode 1: Set Exact Day Total */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <label className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                <span>Set Exact Daily Total Kcal</span>
                <span className="text-[10px] text-slate-500 font-normal">Replaces current value</span>
              </label>
              <form onSubmit={handleSaveDirectKcal} className="flex space-x-2">
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={directKcalInput}
                  onChange={(e) => setDirectKcalInput(e.target.value)}
                  placeholder="e.g. 1650"
                  className="flex-1 px-3 py-2 text-sm font-semibold bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:border-teal-600"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95"
                >
                  {t.saveCalories}
                </button>
              </form>
            </div>

            {/* Mode 2: Quick South Indian & Healthy Meal Presets */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700">
                Quick Add Food Presets
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: '2 Idlis + Sambar', kcal: 340, sugar: 1 },
                  { name: 'Masala Dosa', kcal: 380, sugar: 0 },
                  { name: '2 Roti + Dal', kcal: 310, sugar: 0 },
                  { name: 'Rice & Veg Curry', kcal: 480, sugar: 1 },
                  { name: 'Filter Coffee / Chai', kcal: 110, sugar: 6 },
                  { name: 'Fresh Fruit Bowl', kcal: 130, sugar: 0 },
                ].map((item) => (
                  <button
                    key={item.name}
                    onClick={() => {
                      addCalories(item.kcal, item.name, item.sugar);
                      triggerKcalToast(`+${item.kcal} kcal (${item.name})`);
                      setShowKcalModal(false);
                    }}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 text-left transition-all group active:scale-95"
                  >
                    <p className="text-xs font-semibold text-slate-800 group-hover:text-teal-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 group-hover:text-teal-700">
                      +{item.kcal} kcal {item.sugar > 0 ? `• ${item.sugar}g sugar` : ''}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Mode 3: Custom Food Item Form */}
            <form onSubmit={handleAddCustomMeal} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
              <p className="text-xs font-semibold text-slate-800">
                Log Custom Meal or Snack
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  value={customMealName}
                  onChange={(e) => setCustomMealName(e.target.value)}
                  placeholder="Food name (e.g. Oats, Salad)"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:border-teal-600 font-medium"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    required
                    value={customKcalAmount}
                    onChange={(e) => setCustomKcalAmount(e.target.value)}
                    placeholder="Calories (kcal)*"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:border-teal-600 font-semibold"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={customSugarGrams}
                    onChange={(e) => setCustomSugarGrams(e.target.value)}
                    placeholder="Added Sugar (g)"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:border-teal-600 font-medium"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95"
              >
                {t.addFoodToDay}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
