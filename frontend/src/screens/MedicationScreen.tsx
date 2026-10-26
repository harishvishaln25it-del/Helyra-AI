import React, { useState } from 'react';
import {
  Pill,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Check,
  RotateCcw,
  Calendar,
  Info,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  Trash2
} from 'lucide-react';
import { useHealth } from '../context/HealthContext';
import { MedicationItem } from '../types';

export const MedicationScreen: React.FC = () => {
  const { medications, toggleMedication, addMedication, deleteMedication, language, t } = useHealth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('1 Tablet');
  const [newMedTime, setNewMedTime] = useState('08:00 AM');
  const [newMedFrequency, setNewMedFrequency] = useState<'once_daily' | 'twice_daily' | 'thrice_daily'>('once_daily');
  const [newMedTimingNote, setNewMedTimingNote] = useState('After Breakfast');

  const takenCount = medications.filter(m => m.status === 'taken').length;
  const totalCount = medications.length;
  const adherencePercent = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 100;

  const handleAddNewMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;

    addMedication({
      name: newMedName.trim(),
      dose: newMedDose.trim() || '1 Tablet',
      scheduledTime: newMedTime,
      frequency: newMedFrequency,
      doctorInstructions: newMedTimingNote ? `Take ${newMedTimingNote}` : 'Take as prescribed by doctor',
      status: 'pending'
    });

    setNewMedName('');
    setNewMedDose('1 Tablet');
    setNewMedTimingNote('After Breakfast');
    setShowAddModal(false);
  };

  const getTimeIcon = (timeStr: string) => {
    const isPM = timeStr.toLowerCase().includes('pm');
    const hour = parseInt(timeStr.split(':')[0] || '8', 10);
    if (!isPM && hour < 12) return <Sun className="w-4 h-4 text-amber-500" />;
    if (isPM && hour < 6) return <Sunset className="w-4 h-4 text-orange-500" />;
    return <Moon className="w-4 h-4 text-indigo-500" />;
  };

  return (
    <div className="space-y-4 pb-4 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {language === 'ta' ? 'தினசரி மருந்துகள்' : 'Daily Medicines'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {language === 'ta' ? 'உங்கள் தினசரி மருந்துகளை எளிதாக கண்காணியுங்கள்' : 'Track and log your daily medicines easily'}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ta' ? '+ மருந்து சேர்க்க' : '+ Add Medicine'}</span>
        </button>
      </div>

      {/* Clean Apple Fitness Style Adherence Card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
            Today's Medicine Status
          </span>
          <div className="flex items-baseline space-x-3">
            <span className="text-3xl font-extrabold text-slate-900">{takenCount} of {totalCount}</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              {adherencePercent}% Completed
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {takenCount === totalCount && totalCount > 0
              ? '🎉 Great job! All medicines taken for today.'
              : `${totalCount - takenCount} medicine(s) remaining today.`}
          </p>
        </div>

        <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
          <Pill className="w-7 h-7 text-teal-600" />
        </div>
      </div>

      {/* Medicine List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          Your Medicines Schedule
        </h3>

        {medications.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2">
            <Pill className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No medicines added yet</p>
            <p className="text-xs text-slate-500">Click '+ Add Medicine' to add your first daily medicine.</p>
          </div>
        ) : (
          medications.map(med => {
            const isTaken = med.status === 'taken';

            return (
              <div
                key={med.id}
                className={`p-4 rounded-3xl border transition-all shadow-xs space-y-3 ${
                  isTaken
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-white border-slate-200 hover:border-teal-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center">
                        <Pill className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-base font-bold text-slate-900 tracking-tight">{med.name}</h4>
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
                        {med.dose}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium pl-9">
                      {getTimeIcon(med.scheduledTime)}
                      <span>Time: <strong className="text-slate-800">{med.scheduledTime}</strong></span>
                      {med.doctorInstructions && (
                        <>
                          <span>•</span>
                          <span className="text-teal-700 font-medium">{med.doctorInstructions}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        isTaken
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {isTaken ? '✓ Taken' : 'Pending'}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`Remove "${med.name}" from your daily medicines?`)) {
                          deleteMedication(med.id);
                        }
                      }}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all active:scale-95 text-xs font-semibold"
                      title="Remove Medicine"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>

                {/* Big Beginner-Friendly Action Button */}
                <div className="pt-1">
                  {isTaken ? (
                    <div className="flex items-center justify-between bg-emerald-100/70 border border-emerald-200/90 rounded-2xl p-2.5 px-4">
                      <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>Medicine taken for today</span>
                      </div>
                      <button
                        onClick={() => toggleMedication(med.id, 'pending')}
                        className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 underline flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Undo</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => toggleMedication(med.id, 'taken')}
                      className="w-full py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-xs transition-all active:scale-98 flex items-center justify-center space-x-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Take Medicine Now</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                  <Pill className="w-4 h-4 text-teal-600" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Add New Medicine</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewMed} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Medicine Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metformin 500mg, Vitamin C"
                  value={newMedName}
                  onChange={e => setNewMedName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Dose</label>
                  <input
                    type="text"
                    value={newMedDose}
                    onChange={e => setNewMedDose(e.target.value)}
                    placeholder="1 Tablet"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Scheduled Time</label>
                  <input
                    type="text"
                    value={newMedTime}
                    onChange={e => setNewMedTime(e.target.value)}
                    placeholder="08:00 AM"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">When to Take</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    'After Breakfast',
                    'After Lunch',
                    'After Dinner',
                    'Before Breakfast',
                    'Before Bed',
                    'With Water'
                  ].map(timing => (
                    <button
                      type="button"
                      key={timing}
                      onClick={() => setNewMedTimingNote(timing)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition text-center ${
                        newMedTimingNote === timing
                          ? 'bg-teal-50 border-teal-500 text-teal-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {timing}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs active:scale-95"
                >
                  Save Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
