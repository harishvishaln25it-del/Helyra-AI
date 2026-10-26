import React, { useState } from 'react';
import {
  User,
  Shield,
  Phone,
  HeartPulse,
  Settings,
  Sliders,
  Volume2,
  Type,
  CheckCircle2,
  AlertTriangle,
  Save,
  Lock,
  LogOut,
  Globe,
  Sparkles
} from 'lucide-react';
import { useHealth } from '../context/HealthContext';
import { MedicalConditionType } from '../types';

export const ProfileScreen: React.FC = () => {
  const {
    user,
    updateUserProfile,
    updateEmergencyContact,
    updateAdaptivePreferences,
    logout,
    language,
    setLanguage,
    setActiveScreen,
    t,
    brandName,
    setBrandName
  } = useHealth();
  const [appCustomName, setAppCustomName] = useState(brandName || 'Helyra AI');
  const [name, setName] = useState(user.name);
  const [age, setAge] = useState(user.age);
  const [weightKg, setWeightKg] = useState(user.weightKg);
  const [heightCm, setHeightCm] = useState(user.heightCm);
  const [waterGoalLiters, setWaterGoalLiters] = useState(user.waterGoalLiters);
  const [dailyStepGoal, setDailyStepGoal] = useState(user.dailyStepGoal);

  const [selectedConditions, setSelectedConditions] = useState<MedicalConditionType[]>(user.medicalConditions);

  // Emergency contact
  const [contactName, setContactName] = useState(user.emergencyContact.name);
  const [contactPhone, setContactPhone] = useState(user.emergencyContact.phone);
  const [contactRelationship, setContactRelationship] = useState(user.emergencyContact.relationship);
  const [sosConsent, setSosConsent] = useState(user.emergencyContact.sosConsentGranted);

  // Adaptive AI Preferences
  const [interactionType, setInteractionType] = useState(user.adaptivePreferences?.preferredInteractionType || 'both');
  const [responseLength, setResponseLength] = useState(user.adaptivePreferences?.responseLength || 'short');
  const [voiceTone, setVoiceTone] = useState(user.adaptivePreferences?.voiceTone || 'gentle');
  const [fontSize, setFontSize] = useState(user.adaptivePreferences?.fontSize || 'standard');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const conditionOptions: MedicalConditionType[] = [
    'Diabetes',
    'Fatty liver',
    'Hypertension',
    'Heart condition',
    'Asthma',
    'Other',
    'None'
  ];

  const toggleCondition = (cond: MedicalConditionType) => {
    if (cond === 'None') {
      setSelectedConditions(['None']);
      return;
    }
    const filtered = selectedConditions.filter(c => c !== 'None');
    if (filtered.includes(cond)) {
      const next = filtered.filter(c => c !== cond);
      setSelectedConditions(next.length > 0 ? next : ['None']);
    } else {
      setSelectedConditions([...filtered, cond]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (appCustomName.trim()) {
      setBrandName(appCustomName.trim());
    }

    updateUserProfile({
      name,
      age: Number(age),
      weightKg: Number(weightKg),
      heightCm: Number(heightCm),
      waterGoalLiters: Number(waterGoalLiters),
      dailyStepGoal: Number(dailyStepGoal),
      medicalConditions: selectedConditions
    });

    updateEmergencyContact({
      name: contactName,
      phone: contactPhone,
      relationship: contactRelationship,
      sosConsentGranted: sosConsent
    });

    updateAdaptivePreferences({
      preferredInteractionType: interactionType,
      responseLength,
      voiceTone,
      fontSize
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-5 pb-0 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{t.profileTitle}</h2>
          <p className="text-xs text-slate-500 font-medium">{t.profileSubtitle}</p>
        </div>
        {savedSuccess && (
          <span className="text-xs font-black text-emerald-800 bg-emerald-200/90 border border-emerald-400/50 px-3.5 py-1 rounded-full flex items-center space-x-1.5 animate-bounce shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>{language === 'ta' ? 'சேமிக்கப்பட்டது!' : 'Saved!'}</span>
          </span>
        )}
      </div>

      {/* User Avatar Hero Card */}
      <div className="bg-slate-900 p-5 rounded-3xl border border-teal-500/30 shadow-xl text-white flex items-center space-x-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="w-14 h-14 rounded-2xl bg-teal-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg border border-white/20 shrink-0">
          {name ? name[0] : 'U'}
        </div>
        <div className="space-y-0.5 relative z-10">
          <h3 className="font-black text-lg text-white tracking-tight">{name}</h3>
          <p className="text-xs text-teal-300 font-semibold">
            {user.emergencyContact.relationship || 'Individual'} • {age} {language === 'ta' ? 'வயது' : 'Years'}
          </p>
          <p className="text-[11px] text-teal-200/70">
            {language === 'ta' ? 'விஷால் குடும்ப வளையத்துடன் இணைக்கப்பட்டது' : 'Connected to Vishal Family Circle'}
          </p>
        </div>
      </div>

      {/* Enterprise Account Security & Privacy Action Card */}
      <div
        onClick={() => setActiveScreen('security')}
        className="bg-slate-900 border border-teal-500/30 hover:border-teal-400/60 p-4 rounded-3xl shadow-lg cursor-pointer transition hover:bg-slate-850 flex items-center justify-between text-white group"
      >
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 group-hover:scale-105 transition">
            <Shield className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-extrabold text-white">Account Security & 2FA</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold">
                Argon2id
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Manage Two-Factor Authentication, Passkeys, active sessions & password
            </p>
          </div>
        </div>

        <div className="text-teal-400 font-bold text-xs flex items-center space-x-1 pl-2">
          <span>Manage</span>
          <span>&rarr;</span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Basic Information */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-teal-800">
            <User className="w-5 h-5 text-teal-700" />
            <h3 className="text-sm font-bold uppercase tracking-wider">{t.personalMetrics}</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700">{t.fullName}</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-teal-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700">{t.ageLabel}</label>
                <input
                  type="number"
                  value={age}
                  onChange={e => setAge(Number(e.target.value))}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-teal-500 font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">{t.weightLabel}</label>
                <input
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={e => setWeightKg(Number(e.target.value))}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-teal-500 font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">{t.heightLabel}</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={e => setHeightCm(Number(e.target.value))}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-teal-500 font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Medical Conditions Selector */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-teal-800">
            <HeartPulse className="w-5 h-5 text-teal-700" />
            <h3 className="text-sm font-bold uppercase tracking-wider">{t.healthConditionsTitle}</h3>
          </div>
          <p className="text-[11px] text-slate-500">
            {language === 'ta'
              ? `சர்க்கரை மற்றும் இரத்த அழுத்தத்திற்கு ஏற்ப ${brandName || 'VITALIS'} ஆலோசனைகளைத் தகவமைக்க உதவுகிறது.`
              : `Helps ${brandName || 'VITALIS'} adapt tracking (e.g. asking about added sugar for diabetes). You are not forced to select any.`}
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {conditionOptions.map(cond => {
              const isSelected = selectedConditions.includes(cond);
              const label =
                language === 'ta'
                  ? cond === 'Diabetes' ? 'நீரிழிவு (Diabetes)' : cond === 'Hypertension' ? 'இரத்த அழுத்தம் (BP)' : cond === 'Fatty liver' ? 'கொழுப்பு கல்லீரல்' : cond === 'Heart condition' ? 'இதய நலம்' : cond === 'Asthma' ? 'ஆஸ்துமா' : cond === 'None' ? 'எதுவுமில்லை' : 'மற்றவை'
                  : cond;

              return (
                <button
                  type="button"
                  key={cond}
                  onClick={() => toggleCondition(cond)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-teal-700 text-white border-teal-800 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Emergency Contact & SOS Permission */}
        <div className="bg-white p-5 rounded-3xl border border-rose-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-rose-800">
            <Phone className="w-5 h-5 text-rose-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider">{t.emergencyContactTitle}</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700">{t.contactNameLabel}</label>
              <input
                type="text"
                required
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-rose-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700">{t.contactPhoneLabel}</label>
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-rose-500 font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">{t.contactRelationLabel}</label>
                <input
                  type="text"
                  required
                  value={contactRelationship}
                  onChange={e => setContactRelationship(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-rose-500 font-medium"
                />
              </div>
            </div>

            {/* Explicit SOS Consent Checkbox */}
            <label className="flex items-start space-x-2.5 pt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sosConsent}
                onChange={e => setSosConsent(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded mt-0.5"
              />
              <span className="text-xs text-slate-700 font-medium leading-relaxed">
                {language === 'ta'
                  ? `அவசர SOS நேரத்தில் ${brandName || 'VITALIS'} இந்த நபருக்கு எச்சரிக்கை அனுப்பவும் அழைப்பை ஏற்படுத்தவும் அனுமதி அளிக்கிறேன்.`
                  : `I grant explicit permission for ${brandName || 'VITALIS'} to use this contact to initiate emergency phone calls and send alerts during SOS triggers.`}
              </span>
            </label>
          </div>
        </div>

        {/* App & Companion Brand Name Customizer */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-teal-800">
              <Sparkles className="w-5 h-5 text-teal-700" />
              <h3 className="text-sm font-bold uppercase tracking-wider">
                {language === 'ta' ? 'பயன்பாட்டு பெயர் (Brand Name)' : 'App Brand & Companion Name'}
              </h3>
            </div>
            <span className="text-[10px] font-black bg-teal-500/10 text-teal-800 px-2.5 py-0.5 rounded-full border border-teal-500/20">
              {brandName || 'Helyra AI'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {language === 'ta'
              ? 'உங்கள் விருப்பத்திற்கேற்ப பயன்பாட்டின் பெயரை உடனடியாக மாற்றிக்கொள்ளலாம் (எ.கா. Helyra AI, VITALIS, HELYRA).'
              : 'Customize the name of your health companion across all screens and headers.'}
          </p>

          <div className="flex space-x-2">
            <input
              type="text"
              value={appCustomName}
              onChange={e => setAppCustomName(e.target.value)}
              placeholder="e.g. Helyra AI, VITALIS, HELYRA..."
              className="flex-1 p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500"
            />
            <button
              type="button"
              onClick={() => {
                if (appCustomName.trim()) setBrandName(appCustomName.trim());
              }}
              className="px-4 py-2.5 bg-teal-600 text-white font-bold rounded-xl text-xs active:scale-95 transition"
            >
              {language === 'ta' ? 'மாற்று' : 'Apply'}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {['Helyra AI', 'VITALIS', 'HELYRA', 'AURA', 'SANJEEVI', 'AAYUSH'].map(p => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setAppCustomName(p);
                  setBrandName(p);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                  (brandName || 'Helyra AI').toUpperCase() === p.toUpperCase()
                    ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Adaptive AI & Elderly-Friendly Preferences */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-teal-800">
            <Sliders className="w-5 h-5 text-teal-700" />
            <h3 className="text-sm font-bold uppercase tracking-wider">{t.adaptiveAiSettings}</h3>
          </div>

          <div className="space-y-3 divide-y divide-slate-100">
            {/* Voice Tone */}
            <div className="pt-2 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">{t.voiceToneLabel}</p>
                <p className="text-[11px] text-slate-500">
                  {language === 'ta' ? `${brandName || 'VITALIS'} எவ்வாறு பேச வேண்டும்` : `How ${brandName || 'VITALIS'} speaks with you`}
                </p>
              </div>
              <select
                value={voiceTone}
                onChange={e => setVoiceTone(e.target.value as any)}
                className="p-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
              >
                <option value="gentle">{language === 'ta' ? 'கனிவான குரல்' : 'Gentle & Caring'}</option>
                <option value="direct">{language === 'ta' ? 'நேரடி பதில்' : 'Short & Direct'}</option>
                <option value="encouraging">{language === 'ta' ? 'ஊக்கமளிக்கும் தொனி' : 'Encouraging'}</option>
              </select>
            </div>

            {/* Font Size (Elderly friendly) */}
            <div className="pt-2 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">{t.fontSizeLabel}</p>
                <p className="text-[11px] text-slate-500">
                  {language === 'ta' ? 'முதியோருக்கான பெரிய எழுத்துக்கள்' : 'Elderly-accessible readability'}
                </p>
              </div>
              <select
                value={fontSize}
                onChange={e => setFontSize(e.target.value as any)}
                className="p-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
              >
                <option value="standard">{t.fontSizeStandard}</option>
                <option value="large">{t.fontSizeLarge}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          className="w-full py-4 px-6 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm shadow-xl active:scale-[0.98] transition-all duration-200 border border-teal-400/30 flex items-center justify-center space-x-2.5 group"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Save className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="tracking-wide text-white">{t.saveChangesBtn}</span>
        </button>

        {/* Sign Out / Switch Account */}
        <div className="pt-2">
          <button
            type="button"
            onClick={logout}
            className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-xs border border-slate-300/80 hover:border-rose-300 transition-all flex items-center justify-center space-x-2 active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.signOut}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
