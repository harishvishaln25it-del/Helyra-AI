import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Send,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  Check,
  Activity,
  Droplets,
  Pill,
  Zap
} from 'lucide-react';
import { useHealth } from '../context/HealthContext';
import { apiService } from '../services/apiService';
import { correctSpokenHealthQuery, CorrectionResult } from '../utils/speechCorrection';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerSOS: () => void;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({ isOpen, onClose, onTriggerSOS }) => {
  const {
    user,
    todayStats,
    medications,
    language,
    siriWakeWordEnabled,
    setSiriWakeWordEnabled,
    proactiveVoiceCoachEnabled,
    setProactiveVoiceCoachEnabled,
    speakProactiveGoalNudge,
    t,
    brandName
  } = useHealth();
  const [isListening, setIsListening] = useState(false);
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [typedInput, setTypedInput] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);
  const [soundBars, setSoundBars] = useState<number[]>([40, 65, 30, 80]);
  const [detectedCorrections, setDetectedCorrections] = useState<Array<{ original: string; corrected: string }>>([]);
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);

  const recognitionRef = useRef<any>(null);
  const isMountedRef = useRef(true);
  const silenceTimerRef = useRef<any>(null);
  const hasSubmittedRef = useRef(false);
  const pendingTranscriptRef = useRef('');

  // Suggested conversational prompts localized in Tamil & English
  const samplePrompts = [
    t.promptWater,
    t.promptMeds,
    t.promptSteps,
    t.promptDoctor,
    t.promptFamily,
    t.promptSOS
  ];

  // Sound wave bar animation when assistant is speaking or listening
  useEffect(() => {
    let interval: any = null;
    if (isListening || isSpeaking || isRequestingMic) {
      interval = setInterval(() => {
        setSoundBars([
          Math.floor(Math.random() * 60 + 20),
          Math.floor(Math.random() * 80 + 20),
          Math.floor(Math.random() * 70 + 25),
          Math.floor(Math.random() * 85 + 15)
        ]);
      }, 140);
    } else {
      setSoundBars([24, 24, 24, 24]);
    }
    return () => clearInterval(interval);
  }, [isListening, isSpeaking, isRequestingMic]);

  // Clean up on component unmount & pre-cache TTS voices
  useEffect(() => {
    isMountedRef.current = true;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
    return () => {
      isMountedRef.current = false;
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Google Assistant style voice speech synthesis (tuned for fast, crisp playback)
  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.08; // Fast, natural, conversational pacing
      utterance.pitch = 1.05; // Friendly assistant pitch
      utterance.lang = language === 'ta' ? 'ta-IN' : 'en-US';

      // Pick best natural voice if available
      const voices = window.speechSynthesis.getVoices();
      let naturalVoice: SpeechSynthesisVoice | undefined;

      if (language === 'ta') {
        naturalVoice = voices.find(v => v.lang.startsWith('ta'));
      } else {
        naturalVoice = voices.find(
          v =>
            v.lang.startsWith('en') &&
            (v.name.includes('Google') ||
              v.name.includes('Natural') ||
              v.name.includes('Samantha') ||
              v.name.includes('Female'))
        );
      }
      if (naturalVoice) utterance.voice = naturalVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Robust Speech Recognition Initializer with fast silence auto-detection
  const startListening = async () => {
    stopSpeaking();
    setResponse(null);
    setMicPermissionError(null);
    setIsRequestingMic(true);
    hasSubmittedRef.current = false;
    pendingTranscriptRef.current = '';
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsRequestingMic(false);
      setMicPermissionError(
        language === 'ta'
          ? 'இந்த உலாவியில் பேச்சு அறிதல் ஆதரிக்கப்படவில்லை. கீழே உள்ள பரிந்துரைகளைப் பயன்படுத்தலாம் அல்லது தட்டச்சு செய்யலாம்.'
          : 'Speech recognition is not supported by your current browser. You can type below or tap quick prompts.'
      );
      return;
    }

    // Verify / request microphone permission in the browser/iframe explicitly
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Immediately stop temporary test tracks so microphone hardware is released for SpeechRecognition
        stream.getTracks().forEach(track => track.stop());
      } catch (micErr: any) {
        console.warn('Microphone permission check failed:', micErr);
        setIsRequestingMic(false);
        setIsListening(false);
        setMicPermissionError(
          language === 'ta'
            ? 'மைக்ரோஃபோன் அனுமதி வழங்கப்படவில்லை. உங்கள் உலாவி முகவரிப் பட்டியில் மைக்கை அனுமதிக்கவும்.'
            : 'Microphone permission was denied. Please allow microphone access in your browser.'
        );
        return;
      }
    }

    // Stop and clean any existing active instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-US';

      recognition.onstart = () => {
        setIsRequestingMic(false);
        setIsListening(true);
        setMicPermissionError(null);
        hasSubmittedRef.current = false;
      };

      recognition.onresult = (event: any) => {
        let full = '';
        for (let i = 0; i < event.results.length; ++i) {
          full += event.results[i][0].transcript;
        }
        full = full.trim();
        pendingTranscriptRef.current = full;

        // Apply real-time spelling and phonetic correction on what user said
        const spellResult = correctSpokenHealthQuery(full);
        setTranscript(spellResult.correctedText || full);
        if (spellResult.corrections.length > 0) {
          setDetectedCorrections(spellResult.corrections);
        }

        // Clear existing silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        const isFinal = event.results[event.results.length - 1].isFinal;

        if (isFinal) {
          // Native final event arrived
          if (!hasSubmittedRef.current && full.length > 0) {
            hasSubmittedRef.current = true;
            stopListening();
            handleVoiceQuery(spellResult.correctedText || full, spellResult.corrections);
          }
        } else if (full.length >= 2) {
          // Adaptive Fast-Silence Trigger (800ms):
          // Cuts the awkward 3-5 second dead wait down to 800ms after user stops speaking!
          silenceTimerRef.current = setTimeout(() => {
            if (!hasSubmittedRef.current && pendingTranscriptRef.current.trim().length > 0) {
              hasSubmittedRef.current = true;
              stopListening();
              const finalCorrection = correctSpokenHealthQuery(pendingTranscriptRef.current);
              handleVoiceQuery(finalCorrection.correctedText || pendingTranscriptRef.current, finalCorrection.corrections);
            }
          }, 800);
        }
      };

      recognition.onerror = (event: any) => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        // 'aborted' is expected when stopping or submitting - do not warn or show error
        if (event.error === 'aborted') {
          setIsRequestingMic(false);
          setIsListening(false);
          return;
        }

        if (event.error === 'no-speech') {
          setIsRequestingMic(false);
          setIsListening(false);
          // If no speech detected and user has spoken before, finalize if pending
          if (pendingTranscriptRef.current.trim() && !hasSubmittedRef.current) {
            hasSubmittedRef.current = true;
            const finalCorrection = correctSpokenHealthQuery(pendingTranscriptRef.current);
            handleVoiceQuery(finalCorrection.correctedText || pendingTranscriptRef.current, finalCorrection.corrections);
          }
          return;
        }

        console.warn('Voice recognition notice:', event.error);
        setIsRequestingMic(false);
        setIsListening(false);

        if (event.error === 'not-allowed') {
          setMicPermissionError(
            language === 'ta'
              ? 'மைக்ரோஃபோன் அணுகல் தடுக்கப்பட்டது. உலாவி அமைப்பில் மைக்கை அனுமதிக்கவும்.'
              : 'Microphone permission blocked. Please allow microphone access in your browser bar.'
          );
        } else {
          setMicPermissionError(
            language === 'ta'
              ? `குரல் அறிதல் அறிவிப்பு (${event.error}). கீழே தட்டச்சு செய்யவும்.`
              : `Speech recognition notice (${event.error}). You can type or tap below.`
          );
        }
      };

      recognition.onend = () => {
        setIsRequestingMic(false);
        setIsListening(false);
        // If ended with unsubmitted words, process them immediately
        if (pendingTranscriptRef.current.trim() && !hasSubmittedRef.current) {
          hasSubmittedRef.current = true;
          const finalCorrection = correctSpokenHealthQuery(pendingTranscriptRef.current);
          handleVoiceQuery(finalCorrection.correctedText || pendingTranscriptRef.current, finalCorrection.corrections);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
      setIsRequestingMic(false);
    } catch (err: any) {
      console.warn('Recognition start exception:', err);
      setIsRequestingMic(false);
      setIsListening(false);
      setMicPermissionError(
        language === 'ta'
          ? 'மைக்கை இயக்குவதில் பிழை ஏற்பட்டது. மீண்டும் மைக் பட்டனை அழுத்தவும்.'
          : 'Failed to access microphone. Tap the microphone button again to retry.'
      );
    }
  };

  const stopListening = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      try {
        rec.onstart = null;
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        rec.abort();
      } catch {}
    }
    setIsListening(false);
    setIsRequestingMic(false);
  };

  // Immediate send action without waiting for silence timeout
  const handleImmediateSend = () => {
    if (!transcript.trim()) return;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    hasSubmittedRef.current = true;
    stopListening();
    const spell = correctSpokenHealthQuery(transcript);
    handleVoiceQuery(spell.correctedText || transcript, spell.corrections);
  };

  // When modal opens, auto-start microphone listening so the user can speak immediately
  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setResponse(null);
      setMicPermissionError(null);
      setDetectedCorrections([]);
      setResponseTimeMs(null);
      const timer = setTimeout(() => {
        startListening();
      }, 200);
      return () => clearTimeout(timer);
    } else {
      stopListening();
      stopSpeaking();
    }
  }, [isOpen, language]);

  const handleVoiceQuery = async (queryText: string, initialCorrections?: Array<{ original: string; corrected: string }>) => {
    if (!queryText || !queryText.trim()) return;

    stopListening();
    setIsProcessing(true);

    const spell = correctSpokenHealthQuery(queryText);
    const cleanQuery = spell.correctedText || queryText;
    setTranscript(cleanQuery);
    if (initialCorrections && initialCorrections.length > 0) {
      setDetectedCorrections(initialCorrections);
    } else if (spell.corrections.length > 0) {
      setDetectedCorrections(spell.corrections);
    }

    const userContext = {
      name: user.name,
      age: user.age,
      medicalConditions: user.medicalConditions,
      waterLiters: (todayStats.waterMl / 1000).toFixed(1),
      waterGoal: (todayStats.waterGoalMl / 1000).toFixed(1),
      steps: todayStats.steps.toLocaleString(),
      stepGoal: todayStats.stepGoal.toLocaleString(),
      medsTaken: medications.filter(m => m.status === 'taken').length,
      medsTotal: medications.length,
      calories: todayStats.caloriesKcal,
      language: language,
      adaptivePreferences: user.adaptivePreferences
    };

    try {
      const result = await apiService.processVoiceIntent(cleanQuery, userContext);
      setResponse(result.spokenResponse);
      if (result.responseTimeMs) {
        setResponseTimeMs(result.responseTimeMs);
      }
      if (result.corrections && result.corrections.length > 0) {
        setDetectedCorrections(result.corrections);
      }

      // Trigger emergency SOS if requested
      if (result.intent === 'SOS' || result.actionTaken === 'TRIGGER_SOS') {
        speakText('Initiating emergency SOS workflow right now.');
        setTimeout(() => {
          onTriggerSOS();
          onClose();
        }, 1200);
        return;
      }

      speakText(result.spokenResponse);
    } catch (err) {
      const fallback = "I'm right here with you. I can check your hydration, medications, and activity goals anytime.";
      setResponse(fallback);
      speakText(fallback);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedInput.trim()) return;
    const query = typedInput.trim();
    setTypedInput('');
    handleVoiceQuery(query);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/80 backdrop-blur-md animate-fade-in sm:items-center sm:justify-center p-0 sm:p-4">
      {/* Assistant Sheet (Google Assistant style bottom sheet) */}
      <div className="w-full max-w-md bg-slate-950 text-white rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-teal-500/30 overflow-hidden flex flex-col max-h-[92vh] transition-all">
        {/* Top Drag Indicator & Header */}
        <div className="px-5 pt-3 pb-2 flex flex-col items-center relative border-b border-slate-800/80">
          <div className="w-10 h-1 rounded-full bg-slate-700 mb-3 sm:hidden" />

          <div className="w-full flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              {/* Google Assistant 4-dot / Luminous Pulse Logo */}
              <div className="flex items-center space-x-1 p-1.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse delay-75" />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse delay-150" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse delay-200" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-white flex items-center space-x-1.5">
                  <span>{t.voiceAssistant}</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold border border-teal-400/40">
                    {t.voiceActive}
                  </span>
                </h2>
                <p className="text-[10px] text-teal-300/80">{t.speakNaturally}</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-teal-300"
                  title="Mute Assistant"
                >
                  <VolumeX className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => {
                  stopListening();
                  stopSpeaking();
                  onClose();
                }}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Voice Canvas */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 flex flex-col">
          {/* Real-time speech status pill */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-teal-500/30 text-xs font-semibold text-teal-200 shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>
                {isListening
                  ? t.listening
                  : isProcessing
                  ? t.thinking
                  : isSpeaking
                  ? t.speaking
                  : t.tapToSpeak}
              </span>
            </div>
          </div>

          {/* Assistant Interactive Waves & Mic Orb */}
          <div className="flex flex-col items-center justify-center py-3">
            {/* Multi-color Waveform (Google Assistant style) */}
            <div className="h-14 flex items-center justify-center space-x-2 mb-2">
              <span
                style={{ height: `${soundBars[0]}px` }}
                className="w-2.5 rounded-full bg-blue-600 transition-all duration-150 shadow-md shadow-blue-500/30"
              />
              <span
                style={{ height: `${soundBars[1]}px` }}
                className="w-2.5 rounded-full bg-rose-600 transition-all duration-150 shadow-md"
              />
              <span
                style={{ height: `${soundBars[2]}px` }}
                className="w-2.5 rounded-full bg-amber-500 transition-all duration-150 shadow-md"
              />
              <span
                style={{ height: `${soundBars[3]}px` }}
                className="w-2.5 rounded-full bg-teal-500 transition-all duration-150 shadow-md"
              />
            </div>

            {/* Glowing Big Interactive Mic Button */}
            <div className="relative mt-2">
              {isListening && (
                <>
                  <div className="absolute inset-0 rounded-full bg-teal-400/20 animate-ping" />
                  <div className="absolute -inset-3 rounded-full bg-teal-500/20 animate-pulse" />
                </>
              )}
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-95 ${
                  isListening
                    ? 'bg-rose-600 text-white border-4 border-rose-300 scale-105'
                    : 'bg-teal-600 hover:bg-teal-700 text-white border-4 border-teal-300/40 hover:scale-105'
                }`}
                title={isListening ? 'Tap to Stop Listening' : 'Tap to Speak'}
              >
                {isListening ? (
                  <MicOff className="w-8 h-8 animate-pulse text-white" />
                ) : (
                  <Mic className="w-8 h-8 text-white" />
                )}
              </button>
            </div>

            <p className="mt-2.5 text-xs font-bold text-teal-300">
              {isRequestingMic
                ? (language === 'ta' ? 'மைக்ரோஃபோன் இணைக்கப்படுகிறது...' : 'Connecting microphone...')
                : isListening
                ? (language === 'ta' ? 'கேட்கிறேன்... பேசுங்கள்' : 'Listening... Speak now')
                : (language === 'ta' ? 'பேச மைக் பட்டனை அழுத்தவும்' : 'Click microphone button to speak')}
            </p>

            {/* Instant Send Shortcut (Fast sub-second response) */}
            {isListening && transcript.trim().length > 0 && (
              <button
                type="button"
                onClick={handleImmediateSend}
                className="mt-2.5 inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-lg transition-all active:scale-95 animate-pulse"
              >
                <Zap className="w-3.5 h-3.5 text-amber-200 fill-amber-300" />
                <span>{language === 'ta' ? 'உடனடி பதில் ⚡' : 'Send Now (Fast Answer) ⚡'}</span>
              </button>
            )}
          </div>

          {/* Proactive Voice Coach & Siri Wake Mode Card */}
          <div className="bg-slate-900/90 border border-teal-500/30 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300">
                  {language === 'ta' ? 'செயல்திறன் குரல் நினைவூட்டல் (Proactive Coach)' : 'Proactive Goal Insistence Coach'}
                </span>
              </div>
              <button
                onClick={() => speakProactiveGoalNudge(true)}
                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-extrabold rounded-lg shadow-sm active:scale-95 transition-all flex items-center space-x-1 border border-teal-400/30"
              >
                <Volume2 className="w-3 h-3" />
                <span>{language === 'ta' ? 'இலக்கு குரல் சோதனை' : 'Hear Insistence'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {language === 'ta'
                ? 'தினசரி இலக்குகள் (தண்ணீர், மாத்திரை, நடை) முடிக்கப்படாவிட்டால், AI தானாகவே குரல் கொடுத்து முடிக்குமாறு வலியுறுத்தும்.'
                : `If daily hydration, meds, or steps are incomplete, ${brandName || 'Helyra AI'} will actively speak out and insist you finish your goals.`}
            </p>

            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-semibold">
                {language === 'ta' ? 'Siri போன்ற நேரடி குரல் அழைப்பு ("Hey Helyra")' : 'Siri Mode ("Hey Helyra" Hands-free SOS)'}
              </span>
              <button
                onClick={() => setSiriWakeWordEnabled(!siriWakeWordEnabled)}
                className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] transition-colors ${
                  siriWakeWordEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {siriWakeWordEnabled ? 'ACTIVE' : 'OFF'}
              </button>
            </div>
          </div>

          {micPermissionError && (
            <div className="p-3 bg-rose-500/20 border border-rose-400/40 rounded-2xl text-[11px] text-rose-200 text-center font-medium">
              {micPermissionError}
            </div>
          )}

          {/* User Transcript Speech Bubble with Auto-Spelling Correction Feedback */}
          {transcript && (
            <div className="w-full bg-slate-900/90 border border-teal-500/40 rounded-2xl p-3.5 text-left animate-fade-in shadow-md">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-extrabold text-teal-300 uppercase tracking-wider block">
                  {t.youAsked}
                </span>
                {isListening && (
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-cyan-300" />
                    {language === 'ta' ? 'தானியங்கி பதில் ~0.8வி' : 'Auto-answers in 0.8s'}
                  </span>
                )}
              </div>
              <p className="text-sm text-white font-medium italic">"{transcript}"</p>

              {/* Real-time word spelling correction feedback badge */}
              {detectedCorrections.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400" />
                    {language === 'ta' ? 'சொல் பிழை திருத்தப்பட்டது:' : 'Spelled correctly:'}
                  </span>
                  {detectedCorrections.map((corr, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-500/40 text-[10px]"
                    >
                      <span className="line-through text-slate-400">{corr.original}</span>
                      <ArrowRight className="w-2.5 h-2.5 text-emerald-400" />
                      <span className="font-bold text-emerald-300">{corr.corrected}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI Spoken Response Card with Ultra-Low Latency Telemetry */}
          {response && (
            <div className="w-full bg-slate-900/90 border border-emerald-500/50 rounded-2xl p-4 text-left space-y-2 shadow-xl animate-scale-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-300">
                  <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce text-emerald-400' : ''}`} />
                  <span className="text-xs font-bold uppercase tracking-wider">{t.assistantResponse}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {responseTimeMs !== null && (
                    <span className="text-[9px] font-mono font-bold text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded-full border border-teal-400/30 flex items-center space-x-1">
                      <Zap className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
                      <span>{responseTimeMs < 50 ? 'Instant (<50ms)' : `${responseTimeMs}ms`}</span>
                    </span>
                  )}
                  {isSpeaking && (
                    <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full animate-pulse">
                      {t.speaking}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-100 font-medium leading-relaxed">{response}</p>
            </div>
          )}

          {/* Quick Google Assistant Health Chips */}
          <div className="w-full pt-1 text-left space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {t.quickQuestions}
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    handleVoiceQuery(prompt);
                  }}
                  className="w-full text-left text-xs bg-slate-900/70 hover:bg-teal-900/40 hover:border-teal-400/50 border border-slate-800/80 p-2.5 rounded-xl text-slate-300 hover:text-white transition-all flex items-center justify-between group active:scale-[0.99]"
                >
                  <span className="truncate pr-2">{prompt}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400 transition-transform group-hover:translate-x-0.5 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Typing Bar & Emergency Guarantee */}
        <div className="px-4 py-3 bg-slate-950 border-t border-slate-800/80 space-y-2">
          {/* Fallback Text Input */}
          <form onSubmit={handleTextSubmit} className="relative flex items-center">
            <input
              type="text"
              value={typedInput}
              onChange={e => setTypedInput(e.target.value)}
              placeholder={t.typePlaceholder}
              className="w-full pl-3.5 pr-10 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
            />
            <button
              type="submit"
              disabled={!typedInput.trim()}
              className="absolute right-1.5 p-1.5 rounded-lg bg-teal-600 disabled:bg-slate-800 text-white disabled:text-slate-600 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          <p className="text-[10px] text-center text-slate-400">
            {t.emergencyVoiceHint}
          </p>
        </div>
      </div>
    </div>
  );
};
