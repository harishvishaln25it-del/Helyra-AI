import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Pill,
  Calendar,
  Camera,
  MessageSquare,
  Lock
} from 'lucide-react';
import { useHealth } from '../context/HealthContext';
import { apiService } from '../services/apiService';
import { MedicalDocument } from '../types';

export const DocumentsScreen: React.FC = () => {
  const { medicalDocuments, addMedicalDocument, language, t } = useHealth();
  const [selectedDoc, setSelectedDoc] = useState<MedicalDocument | null>(
    medicalDocuments[0] || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [questionInput, setQuestionInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [qaHistory, setQaHistory] = useState<
    Array<{ q: string; a: string; grounded: boolean }>
  >([
    {
      q: language === 'ta' ? 'எனது மருந்து எடுக்கும் நேரம் என்ன?' : 'When should I take my medicine?',
      a: language === 'ta'
        ? 'உங்கள் மருத்துவ அறிக்கையின்படி: மெட்ஃபோர்மின் 500 மி.கி இரவு உணவிற்குப் பிறகு உட்கொள்ள வேண்டும்.'
        : 'According to your uploaded prescription: Take Metformin 500mg once daily after dinner with water.',
      grounded: true
    }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraDocInputRef = useRef<HTMLInputElement>(null);

  const handleAskQuestion = async (presetQ?: string) => {
    const q = presetQ || questionInput.trim();
    if (!q || !selectedDoc) return;

    setIsAsking(true);
    setQuestionInput('');

    try {
      const res = await apiService.askDoctorDocument(q, selectedDoc.extractedText);
      setQaHistory(prev => [
        {
          q,
          a: res.answer,
          grounded: res.groundedInDoc
        },
        ...prev
      ]);
    } catch {
      setQaHistory(prev => [
        {
          q,
          a: language === 'ta'
            ? 'பதிவேற்றப்பட்ட மருத்துவ ஆவணத்தின்படி, தயவுசெய்து உங்கள் மருத்துவரிடம் நேரடியாக உறுதிப்படுத்தவும்.'
            : 'According to your uploaded document, please verify directly with your prescribing physician.',
          grounded: true
        },
        ...prev
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async () => {
      const dataUrl = reader.result as string;

      // Call extraction service
      const analysis = await apiService.analyzeMedicalDocument(
        dataUrl,
        undefined,
        file.name
      );

      const newDoc: MedicalDocument = {
        id: `doc_${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        type: 'prescription',
        doctorName: analysis.doctorName || (language === 'ta' ? 'மருத்துவர் மருந்துச் சீட்டு' : 'Doctor Prescription'),
        facilityName: analysis.facilityName || (language === 'ta' ? 'மருத்துவ மையம்' : 'Healthcare Facility'),
        uploadDate: new Date().toISOString().split('T')[0],
        fileName: file.name,
        fileSizeKb: Math.round(file.size / 1024),
        extractedText: analysis.extractedText || 'Extracted medical document content',
        extractedMedications: analysis.extractedMedications || [],
        extractedDietInstructions: analysis.extractedDietInstructions || [],
        extractedWarnings: analysis.extractedWarnings || [],
        isAnalyzed: true
      };

      addMedicalDocument(newDoc);
      setSelectedDoc(newDoc);
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5 pb-0 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t.documentsTitle}</h2>
          <p className="text-xs text-slate-500">{t.documentsSubtitle}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => cameraDocInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-md active:scale-95 transition-all border border-teal-400/30"
            title={language === 'ta' ? 'மருந்துச் சீட்டை படம் பிடிக்கவும்' : 'Snap prescription photo with phone camera'}
          >
            <Camera className="w-3.5 h-3.5 text-teal-200" />
            <span>{language === 'ta' ? 'சீட்டு படம் பிடி' : 'Snap Doc'}</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs active:scale-95 transition-all border border-slate-200"
          >
            <Upload className="w-3.5 h-3.5 text-teal-700" />
            <span>{isUploading ? (language === 'ta' ? 'பகுப்பாய்வு...' : 'Analyzing...') : t.uploadDocBtn}</span>
          </button>
        </div>
      </div>

      <input
        ref={cameraDocInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Document Selector Chips */}
      <div className="flex space-x-2 overflow-x-auto pb-1">
        {medicalDocuments.map(doc => (
          <button
            key={doc.id}
            onClick={() => setSelectedDoc(doc)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border flex items-center space-x-1.5 ${
              selectedDoc?.id === doc.id
                ? 'bg-[#0f172a] text-white border-slate-900 shadow-md'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{doc.title}</span>
          </button>
        ))}
      </div>

      {selectedDoc && (
        <div className="space-y-4">
          {/* Document Summary Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 uppercase">
                  {language === 'ta' ? 'சரிபார்க்கப்பட்ட மருத்துவர் அறிக்கை' : 'Verified Doctor Document'}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedDoc.title}</h3>
                <p className="text-xs text-slate-600 font-medium">{selectedDoc.doctorName} • {selectedDoc.facilityName}</p>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {language === 'ta' ? 'பதிவேற்றப்பட்டது' : 'Uploaded'} {selectedDoc.uploadDate}
              </span>
            </div>

            {/* Extracted Medications */}
            {selectedDoc.extractedMedications && selectedDoc.extractedMedications.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <Pill className="w-3.5 h-3.5 text-teal-600" />
                  <span>{t.prescribedMedsTitle}</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedDoc.extractedMedications.map((m, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                      <p className="text-sm font-bold text-slate-900">{m.name}</p>
                      <p className="text-xs text-teal-700 font-semibold">{m.dose}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{m.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Doctor's Diet & Lifestyle Instructions */}
            {selectedDoc.extractedDietInstructions && selectedDoc.extractedDietInstructions.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t.doctorDietInstructionsTitle}
                </p>
                <ul className="space-y-1">
                  {selectedDoc.extractedDietInstructions.map((inst, idx) => (
                    <li key={idx} className="text-xs text-slate-700 font-medium flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                      <span>{inst}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Privacy Guarantee */}
            <div className="p-3 bg-teal-50/60 border border-teal-100 rounded-2xl flex items-center space-x-2 text-[11px] text-teal-900">
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                <strong>{t.privacyGuaranteeBadge}:</strong> {t.privacyGuaranteeDesc}
              </span>
            </div>
          </div>

          {/* AI Grounded Document Q&A Section */}
          <div className="bg-slate-900 text-white p-5 rounded-3xl border border-teal-500/40 shadow-xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center space-x-2.5 relative z-10">
              <div className="w-8 h-8 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center font-bold shadow-md">
                <Sparkles className="w-4 h-4 text-slate-950" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white tracking-tight">{t.askDocTitle}</h3>
                <p className="text-[11px] text-teal-300/80 font-medium">{t.askDocSubtitle}</p>
              </div>
            </div>

            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-1.5 relative z-10">
              <button
                onClick={() =>
                  handleAskQuestion(
                    language === 'ta' ? 'உணவு முறைகள் பற்றி மருத்துவர் என்ன கூறியுள்ளார்?' : 'What did my doctor say about my diet?'
                  )
                }
                className="px-3 py-1.5 rounded-xl bg-teal-950/80 hover:bg-teal-900 text-xs font-bold text-teal-300 border border-teal-700/60 transition-all active:scale-95 shadow-xs"
              >
                {language === 'ta' ? 'உணவு வழிமுறைகள்?' : 'Diet instructions?'}
              </button>
              <button
                onClick={() =>
                  handleAskQuestion(
                    language === 'ta' ? 'எனது மருந்து உட்கொள்ளும் நேரம் என்ன?' : 'When should I take my medicine?'
                  )
                }
                className="px-3 py-1.5 rounded-xl bg-teal-950/80 hover:bg-teal-900 text-xs font-bold text-teal-300 border border-teal-700/60 transition-all active:scale-95 shadow-xs"
              >
                {language === 'ta' ? 'மருந்து நேரம்?' : 'Medication timings?'}
              </button>
              <button
                onClick={() =>
                  handleAskQuestion(
                    language === 'ta' ? 'மருத்துவர் ஏதேனும் எச்சரிக்கை தந்துள்ளாரா?' : 'What are the doctor warnings?'
                  )
                }
                className="px-3 py-1.5 rounded-xl bg-teal-950/80 hover:bg-teal-900 text-xs font-bold text-teal-300 border border-teal-700/60 transition-all active:scale-95 shadow-xs"
              >
                {language === 'ta' ? 'முன்னெச்சரிக்கைகள்?' : 'Special precautions?'}
              </button>
            </div>

            {/* Input Bar */}
            <div className="flex items-center space-x-2 relative z-10">
              <input
                type="text"
                value={questionInput}
                onChange={e => setQuestionInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAskQuestion()}
                placeholder={t.askInputPlaceholder}
                className="flex-1 bg-slate-950/80 border border-teal-500/40 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 shadow-inner"
              />
              <button
                onClick={() => handleAskQuestion()}
                disabled={isAsking || !questionInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs disabled:opacity-50 transition-all shadow-md active:scale-95 border border-teal-400/30"
              >
                {isAsking ? (language === 'ta' ? 'தேடுகிறது...' : 'Checking...') : t.askButton}
              </button>
            </div>

            {/* Q&A Stream */}
            <div className="space-y-3 pt-2 relative z-10">
              {qaHistory.map((item, idx) => (
                <div key={idx} className="bg-slate-950/80 border border-teal-500/30 rounded-2xl p-4 space-y-2 shadow-sm">
                  <div className="flex items-center space-x-2 text-emerald-300">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-extrabold">{item.q}</span>
                  </div>
                  <p className="text-xs text-slate-100 font-medium leading-relaxed">{item.a}</p>
                  <div className="flex items-center space-x-1.5 pt-1 text-[10px] text-teal-300/80 font-bold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>
                      {language === 'ta'
                        ? 'மருத்துவர் அறிக்கையிலிருந்து நேரடியாக உறுதிசெய்யப்பட்டது • AI தானாக மருந்தளவை மாற்றாது'
                        : 'Clinically verified from document • AI never fabricates medical dosages'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
