import React, { useState, useEffect, useRef } from 'react';
import { Phone, X, ShieldAlert, CheckCircle2, UserCheck, BellRing, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useHealth } from '../context/HealthContext';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerMethod?: 'voice' | 'button';
  autoDialImmediately?: boolean;
}

export const SOSModal: React.FC<SOSModalProps> = ({
  isOpen,
  onClose,
  triggerMethod = 'button',
  autoDialImmediately = false
}) => {
  const { user, family, triggerSOS, language, t } = useHealth();
  const [countdown, setCountdown] = useState(4);
  const [isDispatched, setIsDispatched] = useState(false);
  const [voiceAssistantActive, setVoiceAssistantActive] = useState(true);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const contact = user.emergencyContact;

  // Speak speech synthesis helper
  const speakVoicePrompt = (text: string) => {
    if (!voiceAssistantActive || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'ta' ? 'ta-IN' : 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
    }
  };

  // Immediate dial handler
  const handleImmediateDial = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    stopVoiceRecognition();
    setIsDispatched(true);
    triggerSOS(triggerMethod);
    window.location.href = `tel:${contact.phone}`;
  };

  // Cancel handler
  const handleCancelSOS = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (voiceAssistantActive) {
        const cancelMsg = language === 'ta'
          ? 'அவசர எச்சரிக்கை ரத்து செய்யப்பட்டது.'
          : 'Emergency SOS alert cancelled.';
        speakVoicePrompt(cancelMsg);
      }
    }
    stopVoiceRecognition();
    onClose();
  };

  // Start Voice Recognition specifically for SOS
  const startVoiceRecognition = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        const clean = transcript.trim().toLowerCase();
        setVoiceTranscript(clean);

        // Check for Voice Cancel Command
        if (
          clean.includes('cancel') ||
          clean.includes('stop') ||
          clean.includes("don't") ||
          clean.includes('no') ||
          clean.includes('ரத்து') ||
          clean.includes('நிறுத்து')
        ) {
          handleCancelSOS();
          return;
        }

        // Check for Voice Dial / Call Command
        if (
          clean.includes('call') ||
          clean.includes('dial') ||
          clean.includes('now') ||
          clean.includes('help') ||
          clean.includes('yes') ||
          clean.includes('அழை') ||
          clean.includes('உதவி')
        ) {
          handleImmediateDial();
          return;
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Voice recognition initialization error:', err);
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  // Voice Assistant lifecycle on SOS open
  useEffect(() => {
    if (!isOpen) {
      setCountdown(4);
      setIsDispatched(false);
      setVoiceTranscript('');
      stopVoiceRecognition();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    // Direct automated call if triggered via "Hey Helyra SOS"
    if (autoDialImmediately) {
      setCountdown(0);
      setIsDispatched(true);
      triggerSOS('voice');
      const immediatePrompt = language === 'ta'
        ? `ஹே ஹெலிரா அவசர உதவி கண்டறியப்பட்டது! ${contact.name} உடனடியாக அழைக்கப்படுகிறார்.`
        : `Hey Helyra SOS detected! Calling ${contact.name} immediately.`;
      speakVoicePrompt(immediatePrompt);
      if (contact?.phone && typeof window !== 'undefined') {
        window.location.href = `tel:${contact.phone}`;
      }
      return;
    }

    // Modal is opened: speak emergency voice alert and start listening
    const initialPrompt = language === 'ta'
      ? `அவசர உதவி எச்சரிக்கை தொடங்கப்பட்டது. ${contact.name} அழைக்கப்படுகிறார். ரத்து செய்ய 'Cancel' அல்லது உடனடியாக அழைக்க 'Call' என்று கூறவும்.`
      : `Emergency SOS alert activated. Calling ${contact.name}. Say 'Cancel' to stop, or say 'Call now' to dial immediately.`;

    speakVoicePrompt(initialPrompt);
    startVoiceRecognition();

    let timer: any = null;
    if (countdown > 0 && !isDispatched) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0 && !isDispatched) {
      // Auto-dispatch SOS & Call Emergency Contact
      triggerSOS(triggerMethod);
      setIsDispatched(true);
      const dispatchedPrompt = language === 'ta'
        ? `அவசர எச்சரிக்கை அனுப்பப்பட்டது. ${contact?.name || 'Emergency contact'} அழைக்கப்படுகிறார்.`
        : `SOS alert dispatched. Calling ${contact?.name || 'Emergency contact'}.`;
      speakVoicePrompt(dispatchedPrompt);
      if (contact?.phone && typeof window !== 'undefined') {
        window.location.href = `tel:${contact.phone}`;
      }
    }

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen, countdown, isDispatched, autoDialImmediately]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVoiceRecognition();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border-2 border-rose-500 animate-scale-up">
        {/* Header Alert Strip */}
        <div className="bg-rose-600 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
            <div>
              <h2 className="text-lg font-bold tracking-tight">{t.sosTitle}</h2>
              <p className="text-xs text-rose-100 font-medium">
                {language === 'ta' ? 'அவசர உதவி எச்சரிக்கை' : 'Emergency Assistance Active'}
              </p>
            </div>
          </div>
          <button
            onClick={handleCancelSOS}
            aria-label="Cancel SOS"
            className="p-1.5 rounded-full bg-rose-700 hover:bg-rose-800 text-white active:scale-90 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dedicated Voice Assistant Status Bar for SOS */}
        <div className="bg-rose-50 border-b border-rose-100 px-4 py-2.5 flex items-center justify-between text-xs text-rose-900">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
                {isListening ? <Mic className="w-3.5 h-3.5 animate-pulse" /> : <MicOff className="w-3.5 h-3.5" />}
              </div>
              {isListening && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              )}
            </div>
            <div>
              <p className="font-bold text-[11px] text-rose-950 flex items-center space-x-1">
                <span>{language === 'ta' ? 'குரல் உதவியாளர் செயல்படுகிறது' : 'SOS Voice Assistant Active'}</span>
              </p>
              <p className="text-[10px] text-rose-700">
                {voiceTranscript ? (
                  <span>Heard: "{voiceTranscript}"</span>
                ) : (
                  <span>{language === 'ta' ? "கூறவும்: 'Cancel' அல்லது 'Call'" : "Say 'Cancel' or 'Call now'"}</span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const next = !voiceAssistantActive;
              setVoiceAssistantActive(next);
              if (!next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
            }}
            title={voiceAssistantActive ? 'Mute Voice Assistant' : 'Enable Voice Assistant'}
            className="p-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 hover:bg-rose-100 transition shadow-xs"
          >
            {voiceAssistantActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="p-5 space-y-4 text-center">
          {countdown > 0 && !isDispatched ? (
            <div className="space-y-4">
              <div className="w-18 h-18 mx-auto rounded-full bg-rose-50 border-4 border-rose-500 flex items-center justify-center shadow-xs">
                <span className="text-3xl font-black text-rose-600">{countdown}</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {language === 'ta' ? `${countdown} வினாடிகளில் தொடர்பு கொள்கிறது` : `Connecting in ${countdown}s`}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {language === 'ta'
                    ? 'ரத்து செய்ய கீழே உள்ள பொத்தானை அழுத்தவும் அல்லது "Cancel" என்று கூறவும்.'
                    : 'Speak "Cancel" or press cancel below if triggered by mistake.'}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-left">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                  {t.emergencyContactTitle}
                </p>
                <p className="text-sm font-bold text-slate-900">{contact.name}</p>
                <p className="text-xs text-teal-700 font-semibold">{contact.phone} • ({contact.relationship})</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={handleCancelSOS}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 transition"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleImmediateDial}
                  className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs flex items-center justify-center space-x-1.5 transition active:scale-95"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{t.callNowBtn}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t.sosDispatchedTitle}</h3>
                <p className="text-xs text-slate-600 mt-1">{t.sosDispatchedSubtitle}</p>
                {autoDialImmediately && (
                  <span className="inline-flex items-center space-x-1 mt-2 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                    <span>⚡</span>
                    <span>{language === 'ta' ? 'குரல் ஆணை: "Hey Helyra SOS" — உடனடியாக அழைக்கப்பட்டது' : 'Voice Command: "Hey Helyra SOS" — Auto-Dialed'}</span>
                  </span>
                )}
              </div>

              {/* Family notification broadcast */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-left space-y-1.5">
                <div className="flex items-center space-x-2 text-emerald-800">
                  <BellRing className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-medium">
                    {language === 'ta'
                      ? `${family.name} வளையத்தில் உள்ள குடும்பத்தினருக்கு எச்சரிக்கை அனுப்பப்பட்டது`
                      : `${family.members.length} family members alerted on ${family.name}`}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-emerald-800">
                  <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold">
                    {t.emergencyContactTitle}: {contact.name} ({contact.phone})
                  </span>
                </div>
              </div>

              <a
                href={`tel:${contact.phone}`}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-base shadow-xs active:scale-98 transition-all"
              >
                <Phone className="w-5 h-5 animate-pulse" />
                <span>{language === 'ta' ? `அழைக்க ${contact.phone}` : `Dial ${contact.phone}`}</span>
              </a>

              <p className="text-[11px] text-slate-500">
                {language === 'ta'
                  ? 'குறிப்பு: நேரடி மருத்துவ ஆபத்தில் அவசர சேவைக்கு (108 / 112) உடனடியாக அழைக்கவும்.'
                  : 'Notice: In critical danger, call emergency services directly (911 / 108 / 112).'}
              </p>

              <button
                onClick={handleCancelSOS}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 font-medium"
              >
                {t.dismissBtn}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
