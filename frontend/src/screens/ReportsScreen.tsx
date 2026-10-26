import React, { useState } from 'react';
import {
  FileBarChart,
  Sparkles,
  TrendingUp,
  Calendar,
  Download,
  Share2,
  CheckCircle2,
  AlertCircle,
  Footprints,
  Droplets,
  Pill,
  Moon,
  Target,
  RefreshCw,
  FileText,
  Check
} from 'lucide-react';
import { useHealth } from '../context/HealthContext';
import { apiService } from '../services/apiService';
import { generateHealthReportPDF } from '../services/pdfReportGenerator';

export const ReportsScreen: React.FC = () => {
  const { user, family, todayStats, medications, language, t } = useHealth();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [reportTab, setReportTab] = useState<'individual' | 'family'>('individual');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfDownloadedMsg, setPdfDownloadedMsg] = useState<string | null>(null);

  const [aiReportData, setAiReportData] = useState({
    aiSummary:
      language === 'ta'
        ? 'கடந்த வாரத்தில் உங்கள் மருந்து உட்கொள்ளல் நிலை 95% மிகச் சிறப்பாக உள்ளது. இரத்த அழுத்தக் கட்டுப்பாடு மற்றும் போதுமான நீர்ச்சத்து உட்கொள்ளல் சீராக நீடிக்கிறது.'
        : 'In the past week, your medication adherence of 95% was commendable. Maintaining steady hydration and evening walks has stabilized your systolic pressure patterns.',
    adherencePercent: 95,
    keyWins: [
      language === 'ta' ? 'இரவு மருந்து தவறாமல் உட்கொள்ளப்பட்டது' : 'Consistently taken Metformin doses after dinner',
      language === 'ta' ? 'தினசரி சராசரி நடை 8,400 படிகள் எட்டப்பட்டது' : 'Maintained daily walking average above 8,000 steps',
      language === 'ta' ? 'தண்ணீர் உட்கொள்ளல் 75% இலக்கை அடைந்தது' : 'Reached 75% of water hydration targets'
    ],
    nextWeekFocus: [
      language === 'ta' ? 'மதியம் 2 மணிக்குள் 1 லிட்டர் தண்ணீர் குடிக்க முயற்சிக்கவும்' : 'Drink at least 1L water before 2 PM to reduce afternoon fatigue',
      language === 'ta' ? 'இரவு உணவில் உப்பின் அளவை சற்று குறைக்கவும்' : 'Monitor evening sodium levels to sustain healthy BP reading',
      language === 'ta' ? 'மாலை நேர நடைப்பயிற்சியைத் தொடரவும்' : 'Continue 15-minute gentle post-dinner walk'
    ],
    lifestyleGuidance:
      language === 'ta'
        ? 'தொடர் மருந்து உட்கொள்ளலும் நடைப்பயிற்சியும் உங்கள் நீண்டகால ஆரோக்கியத்தைப் பாதுகாக்கும்.'
        : 'Sustained micro-habits yield immense clinical compound benefits.'
  });

  const handleRegenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await apiService.generateReport(
        period,
        {
          stepsAvg: 8420,
          waterAvg: 1.6,
          medAdherence: 95,
          sleepAvgHours: 7.1,
          weightCurrent: 74.2,
          weightPrev: 74.8
        },
        user
      );
      setAiReportData(result);
    } catch {
      // keep current
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    setIsDownloadingPdf(true);
    try {
      const fileName = generateHealthReportPDF({
        period,
        user,
        family,
        medications,
        stats: todayStats,
        aiSummary: aiReportData.aiSummary,
        adherencePercent: aiReportData.adherencePercent,
        keyWins: aiReportData.keyWins,
        nextWeekFocus: aiReportData.nextWeekFocus,
        language
      });
      const msg =
        language === 'ta'
          ? `முழு விவரங்களுடன் PDF அறிக்கை வெற்றிகரமாக பதிவிறக்கம் செய்யப்பட்டது!`
          : `Clinical PDF report with all details downloaded!`;
      setPdfDownloadedMsg(msg);
      setTimeout(() => setPdfDownloadedMsg(null), 3500);
    } catch (e) {
      console.error('PDF generation error:', e);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-5 pb-0 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t.reportsTitle}</h2>
          <p className="text-xs text-slate-500">{t.reportsSubtitle}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRegenerate}
            disabled={isGenerating}
            className="flex items-center space-x-1 px-2.5 py-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold hover:bg-slate-200 transition-all active:scale-95"
            title={language === 'ta' ? 'AI புதுப்பி' : 'Update AI'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloadingPdf}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow-md active:scale-95 border border-teal-400/30 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{language === 'ta' ? 'PDF அறிக்கை' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* PDF Downloaded Toast */}
      {pdfDownloadedMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-400/50 rounded-2xl flex items-center space-x-2.5 text-emerald-900 text-xs font-bold animate-fade-in shadow-md">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{pdfDownloadedMsg}</span>
        </div>
      )}

      {/* Tabs: Individual vs Family */}
      <div className="grid grid-cols-2 gap-2 bg-slate-200/70 p-1.5 rounded-2xl border border-slate-300/60 shadow-inner">
        <button
          onClick={() => setReportTab('individual')}
          className={`py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${
            reportTab === 'individual'
              ? 'bg-teal-700 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 font-semibold'
          }`}
        >
          {t.myHealthTab}
        </button>
        <button
          onClick={() => setReportTab('family')}
          className={`py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${
            reportTab === 'family'
              ? 'bg-teal-700 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 font-semibold'
          }`}
        >
          {t.familyHealthTab}
        </button>
      </div>

      {reportTab === 'individual' ? (
        <div className="space-y-4">
          {/* Period Selector */}
          <div className="flex space-x-2">
            {(['daily', 'weekly', 'monthly'] as const).map(p => {
              const label =
                language === 'ta'
                  ? p === 'daily' ? 'தினசரி' : p === 'weekly' ? 'வாராந்திர' : 'மாதாந்திர'
                  : p;

              return (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`flex-1 py-2 rounded-xl text-xs font-extrabold capitalize transition-all border ${
                    period === p
                      ? 'bg-slate-950 text-emerald-300 border-teal-500/40 shadow-md'
                      : 'bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50 font-semibold'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* AI Comprehensive Summary Banner */}
          <div className="bg-slate-900 text-white p-5 rounded-3xl border border-teal-500/40 shadow-xl space-y-3.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center font-bold shadow-md">
                  <Sparkles className="w-4 h-4 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white capitalize tracking-tight">
                    {language === 'ta'
                      ? (period === 'daily' ? 'தினசரி' : period === 'weekly' ? 'வாராந்திர' : 'மாதாந்திர') + ' AI உடல்நல அறிக்கை'
                      : `${period} AI Health Synthesis`}
                  </h3>
                  <p className="text-[11px] text-teal-300/80 font-medium">
                    {language === 'ta' ? 'மருத்துவ விவரங்களுடன் சரிபார்க்கப்பட்டது' : 'Calibrated with metabolic condition profile'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30 font-extrabold tracking-wide">
                {language === 'ta' ? 'சரிபார்க்கப்பட்டது' : 'Verified'}
              </span>
            </div>

            <p className="text-xs text-slate-100 leading-relaxed font-medium relative z-10">
              "{aiReportData.aiSummary}"
            </p>

            <div className="pt-2.5 border-t border-slate-700/60 relative z-10">
              <p className="text-[11px] text-teal-200 font-semibold italic flex items-center space-x-1.5">
                <span>✦</span>
                <span>{aiReportData.lifestyleGuidance}</span>
              </p>
            </div>
          </div>

          {/* Key Metric Highlights Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Activity Summary */}
            <div className="bg-white p-4 rounded-3xl border border-emerald-200/70 shadow-md space-y-2">
              <div className="flex items-center space-x-2 text-emerald-800">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Footprints className="w-4 h-4 text-emerald-700" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider">{t.activityLabel}</span>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {period === 'weekly' ? '42,350' : '8,420'}
              </p>
              <p className="text-[11px] text-emerald-800 font-semibold">
                {language === 'ta' ? 'இலக்கில் 84% நிறைவு செய்யப்பட்டது' : '84% of step target achieved'}
              </p>
            </div>

            {/* Water Summary */}
            <div className="bg-white p-4 rounded-3xl border border-cyan-200/70 shadow-md space-y-2">
              <div className="flex items-center space-x-2 text-cyan-800">
                <div className="w-7 h-7 rounded-lg bg-cyan-100 flex items-center justify-center">
                  <Droplets className="w-4 h-4 text-cyan-700" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider">{t.waterIntakeLabel}</span>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {period === 'weekly' ? '11.2 L' : '1.5 L'}
              </p>
              <p className="text-[11px] text-cyan-800 font-semibold">
                {language === 'ta' ? 'தினசரி சராசரி: 1.6 L (இலக்கு: 2.0 L)' : 'Daily avg: 1.6 L (Goal: 2.0 L)'}
              </p>
            </div>

            {/* Medication Adherence */}
            <div className="bg-white p-4 rounded-3xl border border-teal-200/70 shadow-md space-y-2">
              <div className="flex items-center space-x-2 text-teal-800">
                <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center">
                  <Pill className="w-4 h-4 text-teal-700" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider">{t.navMeds}</span>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">95%</p>
              <p className="text-[11px] text-teal-800 font-semibold">
                {language === 'ta' ? '21-ல் 20 மருந்துகள் உட்கொள்ளப்பட்டன' : '20 of 21 scheduled doses taken'}
              </p>
            </div>

            {/* Sleep Summary */}
            <div className="bg-white p-4 rounded-3xl border border-indigo-200/70 shadow-md shadow-indigo-950/5 space-y-2">
              <div className="flex items-center space-x-2 text-indigo-800">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Moon className="w-4 h-4 text-indigo-700" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider">
                  {language === 'ta' ? 'தூக்கத் தரம்' : 'Rest Quality'}
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">7h 05m</p>
              <p className="text-[11px] text-indigo-800 font-semibold">
                {language === 'ta' ? 'சீரான தூக்கம்' : 'Consistent restorative sleep'}
              </p>
            </div>
          </div>

          {/* Next Period Focus Cards */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-teal-800">
              <Target className="w-4 h-4 text-teal-700" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                {language === 'ta' ? 'அடுத்த வாரத்திற்கான முக்கிய குறிக்கோள்கள்' : 'Recommended Next Week Focus'}
              </h4>
            </div>

            <div className="space-y-2">
              {aiReportData.nextWeekFocus.map((focus, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start space-x-2.5 text-xs text-slate-800 font-medium"
                >
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{focus}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Family Health Report Tab */
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-slate-900">
              {family.name} {language === 'ta' ? 'குடும்ப அறிக்கை' : 'Summary Report'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'ta'
                ? 'குடும்ப உறுப்பினர்களால் அனுமதிக்கப்பட்ட உடல்நல விவரங்கள் மட்டும் இங்கே காட்டப்படுகின்றன.'
                : 'Showing permitted health summaries authorized by each independent family member.'}
            </p>

            <div className="space-y-3 pt-2">
              {/* Father */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Father</h4>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Good Adherence
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <p className="text-slate-600">
                    Activity: <strong className="text-slate-900">6,420</strong>
                  </p>
                  <p className="text-slate-600">
                    Medicines: <strong className="text-slate-900">95%</strong>
                  </p>
                  <p className="text-amber-700 font-semibold">
                    Water: Needs attention
                  </p>
                </div>
              </div>

              {/* Mother */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Mother</h4>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Optimal
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <p className="text-slate-600">
                    Activity: <strong className="text-slate-900">5,890</strong>
                  </p>
                  <p className="text-slate-600">
                    Medicines: <strong className="text-slate-900">100%</strong>
                  </p>
                  <p className="text-emerald-700 font-semibold">
                    {t.waterIntakeLabel}: {language === 'ta' ? 'நன்று (90%)' : 'Good (90%)'}
                  </p>
                </div>
              </div>

              {/* User */}
              <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">{user.name} ({language === 'ta' ? 'நீங்கள்' : 'You'})</h4>
                  <span className="text-xs font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full">
                    {language === 'ta' ? 'செயலில்' : 'Active'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <p className="text-slate-600">
                    {t.activityLabel}: <strong className="text-slate-900">8,420</strong>
                  </p>
                  <p className="text-slate-600">
                    {language === 'ta' ? 'தூக்கம்' : 'Sleep'}: <strong className="text-slate-900">7h 15m</strong>
                  </p>
                  <p className="text-teal-700 font-semibold">
                    {language === 'ta' ? 'சர்க்கரை: கட்டுக்குள் உள்ளது' : 'Sugar: Controlled'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
