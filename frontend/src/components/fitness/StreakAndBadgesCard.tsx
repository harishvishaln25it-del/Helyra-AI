/**
 * Gamified Streak & Achievement Trophy Vault
 * Visual awards, consecutive active days tracker, and milestone progress.
 */

import React from 'react';
import { Award, Flame, Zap, Trophy, CheckCircle2 } from 'lucide-react';

interface StreakAndBadgesProps {
  consecutiveDays: number;
  todaySteps: number;
  dailyGoal: number;
}

export const StreakAndBadgesCard: React.FC<StreakAndBadgesProps> = ({
  consecutiveDays = 6,
  todaySteps,
  dailyGoal
}) => {
  const isGoalHitToday = todaySteps >= dailyGoal;

  const badges = [
    {
      id: 'streak',
      title: `${consecutiveDays}-Day Streak`,
      desc: 'Active streak unbroken',
      icon: Flame,
      bgClass: 'bg-amber-600',
      unlocked: true
    },
    {
      id: '10k',
      title: '10K Club',
      desc: 'Hit 10,000 daily steps',
      icon: Trophy,
      bgClass: 'bg-teal-600',
      unlocked: todaySteps >= 10000
    },
    {
      id: 'marathon',
      title: 'Pace Setter',
      desc: 'Sustained 110+ SPM cadence',
      icon: Zap,
      bgClass: 'bg-cyan-600',
      unlocked: true
    },
    {
      id: 'century',
      title: 'Century Walk',
      desc: 'Completed 100,000 steps this month',
      icon: Award,
      bgClass: 'bg-purple-600',
      unlocked: true
    }
  ];

  return (
    <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-3xl border border-slate-800 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Flame className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Activity Streak & Trophies
            </h4>
            <p className="text-[10px] text-slate-400">
              {consecutiveDays} days in a row hitting daily activity targets
            </p>
          </div>
        </div>

        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
          🔥 {consecutiveDays} DAYS
        </span>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {badges.map((b) => {
          const Icon = b.icon;
          return (
            <div
              key={b.id}
              className={`p-3 rounded-2xl border transition-all ${
                b.unlocked
                  ? 'bg-slate-950/70 border-slate-800'
                  : 'bg-slate-950/30 border-slate-800/40 opacity-50'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <div
                  className={`w-8 h-8 rounded-xl ${b.bgClass} text-white flex items-center justify-center shadow-md`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-black text-white truncate">{b.title}</p>
                  <p className="text-[9px] text-slate-400 truncate">{b.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
