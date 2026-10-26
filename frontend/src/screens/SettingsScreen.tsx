import React, { useState, useRef } from 'react';
import {
  Settings,
  Footprints,
  Droplets,
  Globe,
  Phone,
  LogOut,
  Check,
  Sliders,
  Camera,
  User,
  Scale
} from 'lucide-react';
import { useHealth } from '../context/HealthContext';

export const SettingsScreen: React.FC = () => {
  const {
    user,
    todayStats,
    updateUserProfile,
    updateEmergencyContact,
    language,
    setLanguage,
    brandName,
    setBrandName,
    logout,
  } = useHealth();

  const [stepGoal, setStepGoal] = useState<number>(todayStats.stepGoal || 10000);
  const [waterGoal, setWaterGoal] = useState<number>(todayStats.waterGoalMl || 2000);
  const [emergencyName, setEmergencyName] = useState(user.emergencyContact?.name || 'Dr. Anand');
  const [emergencyPhone, setEmergencyPhone] = useState(user.emergencyContact?.phone || '+1-555-0199');
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(user.avatarUrl || '');

  // Body Metrics: Age, Weight, Height
  const [age, setAge] = useState<number>(user.age || 32);
  const [weightKg, setWeightKg] = useState<number>(user.weightKg || todayStats.weightKg || 74.2);
  const [heightCm, setHeightCm] = useState<number>(user.heightCm || 175);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 2000);
  };

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      age: Number(age),
      weightKg: Number(weightKg),
      heightCm: Number(heightCm)
    });
    if (todayStats) {
      todayStats.weightKg = Number(weightKg);
    }
    showToast(language === 'ta' ? 'உடல் விவரங்கள் சேமிக்கப்பட்டன!' : 'Age, weight & height updated!');
  };

  const heightM = heightCm / 100;
  const bmi = heightM > 0 ? (weightKg / (heightM * heightM)).toFixed(1) : '24.2';
  const getBmiCategory = (val: number) => {
    if (val < 18.5) return { label: 'Underweight', color: 'text-sky-600 bg-sky-50 border-sky-200' };
    if (val < 25) return { label: 'Normal', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (val < 30) return { label: 'Overweight', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'High', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  };
  const bmiInfo = getBmiCategory(Number(bmi));

  const handleUpdateGoals = (newSteps: number, newWater: number) => {
    setStepGoal(newSteps);
    setWaterGoal(newWater);
    todayStats.stepGoal = newSteps;
    todayStats.waterGoalMl = newWater;
    showToast('Goals updated successfully!');
  };

  const handleSaveEmergencyContact = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmergencyContact({
      name: emergencyName.trim(),
      phone: emergencyPhone.trim(),
      relationship: 'Emergency Contact'
    });
    showToast('Emergency contact saved!');
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAvatarPreview(dataUrl);
      updateUserProfile({ avatarUrl: dataUrl });
      showToast('Profile photo updated!');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4 pb-6 animate-fade-in max-w-2xl mx-auto">
      {/* Toast Alert */}
      {saveToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-slate-700 animate-fade-in flex items-center space-x-1.5">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Settings</h2>
        <p className="text-xs text-slate-500 font-medium">Customize your health goals, language, and preferences</p>
      </div>

      {/* Profile Card with Photo */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
          <User className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-900">My Profile</h3>
        </div>

        <div className="flex items-center space-x-5">
          {/* Avatar with upload button */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full border-2 border-slate-200 overflow-hidden bg-teal-50 flex items-center justify-center">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-teal-700">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            {/* Camera overlay button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-teal-600 border-2 border-white flex items-center justify-center shadow-sm active:scale-90 transition"
              title="Change photo"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-slate-900 truncate">{user.name || 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{user.email || ''}</p>
            {user.familyCode && (
              <span className="inline-block mt-1.5 text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200 tracking-wide">
                {user.familyCode}
              </span>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-[11px] font-semibold text-teal-600 hover:text-teal-800 flex items-center space-x-1 transition"
            >
              <Camera className="w-3 h-3" />
              <span>Change Photo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Body Metrics: Age, Weight, Height */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center space-x-2">
            <Scale className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {language === 'ta' ? 'உடல் அளவீடுகள் (வயது, எடை, உயரம்)' : 'Body Metrics (Age, Weight, Height)'}
            </h3>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${bmiInfo.color}`}>
            BMI: {bmi} ({bmiInfo.label})
          </span>
        </div>

        <form onSubmit={handleSaveVitals} className="space-y-3.5">
          <div className="grid grid-cols-3 gap-2.5">
            {/* Age */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 block uppercase">
                {language === 'ta' ? 'வயது' : 'Age'}
              </label>
              <div className="flex items-baseline space-x-1">
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={age}
                  onChange={e => setAge(Number(e.target.value))}
                  className="w-full text-lg font-black text-slate-900 bg-transparent focus:outline-none"
                />
                <span className="text-xs font-semibold text-slate-400">yrs</span>
              </div>
            </div>

            {/* Weight */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 block uppercase">
                {language === 'ta' ? 'எடை' : 'Weight'}
              </label>
              <div className="flex items-baseline space-x-1">
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="300"
                  value={weightKg}
                  onChange={e => setWeightKg(Number(e.target.value))}
                  className="w-full text-lg font-black text-slate-900 bg-transparent focus:outline-none"
                />
                <span className="text-xs font-semibold text-slate-400">kg</span>
              </div>
            </div>

            {/* Height */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 block uppercase">
                {language === 'ta' ? 'உயரம்' : 'Height'}
              </label>
              <div className="flex items-baseline space-x-1">
                <input
                  type="number"
                  min="50"
                  max="250"
                  value={heightCm}
                  onChange={e => setHeightCm(Number(e.target.value))}
                  className="w-full text-lg font-black text-slate-900 bg-transparent focus:outline-none"
                />
                <span className="text-xs font-semibold text-slate-400">cm</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition active:scale-98 shadow-xs"
          >
            {language === 'ta' ? 'உடல் அளவீடுகளைச் சேமிக்கவும்' : 'Save Age, Weight & Height'}
          </button>
        </form>
      </div>

      {/* Daily Targets Section */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
          <Sliders className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-900">Daily Health Targets</h3>
        </div>

        {/* Step Goal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center space-x-1.5">
              <Footprints className="w-3.5 h-3.5 text-teal-600" />
              <span>Daily Step Goal</span>
            </span>
            <span className="font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
              {stepGoal.toLocaleString()} steps
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[6000, 8000, 10000, 12000].map(goal => (
              <button
                key={goal}
                onClick={() => handleUpdateGoals(goal, waterGoal)}
                className={`py-2 rounded-xl text-xs font-bold border transition active:scale-95 text-center ${
                  stepGoal === goal
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {goal.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Water Goal */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center space-x-1.5">
              <Droplets className="w-3.5 h-3.5 text-sky-600" />
              <span>Daily Water Goal</span>
            </span>
            <span className="font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200">
              {(waterGoal / 1000).toFixed(1)} Liters
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[1500, 2000, 2500, 3000].map(goal => (
              <button
                key={goal}
                onClick={() => handleUpdateGoals(stepGoal, goal)}
                className={`py-2 rounded-xl text-xs font-bold border transition active:scale-95 text-center ${
                  waterGoal === goal
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {(goal / 1000).toFixed(1)}L
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Emergency SOS Contact */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
          <Phone className="w-4 h-4 text-rose-600" />
          <h3 className="text-sm font-bold text-slate-900">Emergency SOS Contact</h3>
        </div>

        <form onSubmit={handleSaveEmergencyContact} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Contact Name / Doctor</label>
              <input
                type="text"
                value={emergencyName}
                onChange={e => setEmergencyName(e.target.value)}
                placeholder="e.g. Dr. Anand"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone Number</label>
              <input
                type="text"
                value={emergencyPhone}
                onChange={e => setEmergencyPhone(e.target.value)}
                placeholder="+1-555-0199"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition active:scale-95"
          >
            Update Emergency Contact
          </button>
        </form>
      </div>

      {/* App Preferences */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
          <Globe className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">App Preferences</h3>
        </div>

        {/* Language Selector (English / Tamil) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <p className="text-xs font-bold text-slate-800">Language / மொழி</p>
            <p className="text-[11px] text-slate-500">Switch between English and தமிழ்</p>
          </div>
          <div className="flex space-x-1.5">
            <button
              onClick={() => {
                setLanguage('en');
                showToast('Language set to English');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                language === 'en'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              English
            </button>
            <button
              onClick={() => {
                setLanguage('ta');
                showToast('மொழி தமிழுக்கு மாற்றப்பட்டது');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                language === 'ta'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              தமிழ்
            </button>
          </div>
        </div>

        {/* App Title Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-800">App Title</p>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              {brandName || 'Helyra AI'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {['Helyra AI', 'VITALIS', 'HELYRA'].map(name => (
              <button
                key={name}
                onClick={() => {
                  setBrandName(name);
                  showToast(`App title set to ${name}`);
                }}
                className={`py-1.5 rounded-xl text-xs font-bold border transition text-center ${
                  (brandName || 'Helyra AI').toUpperCase() === name.toUpperCase()
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl overflow-hidden bg-teal-50 border border-teal-100 flex items-center justify-center">
            {avatarPreview ? (
              <img src={avatarPreview} alt="User" className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-teal-800 text-sm">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">{user.name}</p>
            <p className="text-[11px] text-slate-500">{user.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition active:scale-95"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
