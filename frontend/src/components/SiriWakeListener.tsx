import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useHealth } from '../context/HealthContext';
import { Mic, MicOff, Volume2, ShieldAlert, Sparkles, AlertTriangle, Play } from 'lucide-react';

interface SiriWakeListenerProps {
  onOpenVoiceModal: () => void;
  isVoiceModalOpen?: boolean;
}

export const SiriWakeListener: React.FC<SiriWakeListenerProps> = ({
  onOpenVoiceModal,
  isVoiceModalOpen = false
}) => {
  const {
    user,
    todayStats,
    medications,
    language,
    triggerSOS,
    siriWakeWordEnabled,
    setSiriWakeWordEnabled,
    proactiveVoiceCoachEnabled,
    speakProactiveGoalNudge,
    t,
    brandName
  } = useHealth();

  const [wakeStatus, setWakeStatus] = useState<'idle' | 'listening' | 'triggered' | 'paused'>('idle');
  const [lastHeardWord, setLastHeardWord] = useState<string | null>(null);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const recognitionRef = useRef<any>(null);
  const isRunningRef = useRef(false);
  const isStartingRef = useRef(false);
  const restartTimerRef = useRef<any>(null);
  const isVoiceModalOpenRef = useRef(isVoiceModalOpen);
  isVoiceModalOpenRef.current = isVoiceModalOpen;

  // Periodic proactive goal insist timer (checks every 2 minutes while app is running)
  useEffect(() => {
    if (!proactiveVoiceCoachEnabled) return;

    // Request notification permissions early so notifications sound even when screen is locked/mobile is off
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    const interval = setInterval(() => {
      const remainingWater = Math.max(0, todayStats.waterGoalMl - todayStats.waterMl);
      const pendingMeds = medications.filter(m => m.status === 'pending');
      const remainingSteps = Math.max(0, todayStats.stepGoal - todayStats.steps);

      // If user hasn't completed their goals, talk and insist!
      if (remainingWater > 500 || pendingMeds.length > 0 || remainingSteps > 2000) {
        speakProactiveGoalNudge(false);
      }
    }, 120000); // Check every 2 minutes

    return () => clearInterval(interval);
  }, [proactiveVoiceCoachEnabled, todayStats, medications, language, speakProactiveGoalNudge]);

  // Robust Emergency Keyword Checker
  const checkIsEmergency = (text: string): boolean => {
    const lower = text.toLowerCase();
    const emergencyKeywords = [
      'emergency',
      'help me',
      'help',
      'sos',
      'save me',
      'chest pain',
      'heart attack',
      'fall down',
      'fainted',
      'unconscious',
      'collapsed',
      'காப்பாத்துங்க',
      'ஆபத்து',
      'உதவி',
      'நெஞ்சு வலி',
      'ஹெல்ப்',
      'மருத்துவ உதவி'
    ];
    return emergencyKeywords.some(kw => lower.includes(kw));
  };

  // Robust Siri / Helyra Wake Word Checker (includes phonetic variants speech engines output)
  const checkIsSiriWake = (text: string): boolean => {
    const lower = text.toLowerCase().trim();

    // Direct match words
    const directKeywords = [
      'hey helyra',
      'helyra',
      'hi helyra',
      'hello helyra',
      'ok helyra',
      'okay helyra',
      'hey siri',
      'siri',
      'alexa',
      'assistant',
      'hey assistant',
      'hey google',
      'ஹே ஹெலிரா',
      'ஹெலிரா',
      'ஹெல்ரா',
      'ஹேலிரா',
      'எலிரா',
      'ஹலோ ஹெலிரா'
    ];

    const brandLower = (brandName || 'helyra ai').toLowerCase().trim();
    if (
      brandLower &&
      (lower.includes(brandLower) ||
        lower.includes(`hey ${brandLower}`) ||
        lower.includes(`hi ${brandLower}`) ||
        lower.includes(`hello ${brandLower}`))
    ) {
      return true;
    }

    if (directKeywords.some(kw => lower.includes(kw))) {
      return true;
    }

    // Phonetic speech recognition transcriptions of "Hey Helyra"
    // Chrome speech recognition frequently maps "Helyra" to "lyra", "lira", "helira", "elira", "clara", "lara", "healer", "hydra", "hilary", etc.
    const phoneticMatch = /\b(hey|hi|hello|ok|okay)?\s*(helyra|helira|elira|elara|hilira|alira|lyra|lira|hyra|healer|clara|lara|hilary|hydra|valerie)\b/i;
    return phoneticMatch.test(lower);
  };

  // Stop wake recognition safely
  const stopWakeRecognition = useCallback(() => {
    isRunningRef.current = false;
    isStartingRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
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
  }, []);

  // Trigger wake action (either via voice match or test button)
  const triggerWakeAction = useCallback(() => {
    setWakeStatus('triggered');
    stopWakeRecognition();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const ack = new SpeechSynthesisUtterance(
        language === 'ta' ? 'வணக்கம், நான் கேட்கிறேன் சொல்லுங்கள்!' : 'Hello, I am listening!'
      );
      ack.rate = 1.05;
      if (language === 'ta') ack.lang = 'ta-IN';
      window.speechSynthesis.speak(ack);
    }

    // Open Voice Modal (VoiceModal will automatically start listening)
    onOpenVoiceModal();
  }, [language, onOpenVoiceModal, stopWakeRecognition]);

  // Start wake recognition loop
  const startWakeListening = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (!siriWakeWordEnabled || isVoiceModalOpenRef.current) {
      stopWakeRecognition();
      setWakeStatus(isVoiceModalOpenRef.current ? 'paused' : 'idle');
      return;
    }

    if (isStartingRef.current || isRunningRef.current) {
      return;
    }
    isStartingRef.current = true;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      isStartingRef.current = false;
      setWakeStatus('idle');
      return;
    }

    // Explicitly check/request microphone permission
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setHasMicPermission(true);
      } catch (err) {
        isStartingRef.current = false;
        setHasMicPermission(false);
        setWakeStatus('idle');
        return;
      }
    }

    stopWakeRecognition();

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-US';

      recognition.onstart = () => {
        isStartingRef.current = false;
        if (!isVoiceModalOpenRef.current) {
          isRunningRef.current = true;
          setWakeStatus('listening');
        } else {
          stopWakeRecognition();
        }
      };

      recognition.onresult = (event: any) => {
        if (isVoiceModalOpenRef.current) return;

        let heard = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          heard += event.results[i][0].transcript.toLowerCase() + ' ';
        }
        heard = heard.trim();
        if (!heard) return;

        setLastHeardWord(heard);

        // Emergency Wake Words -> Instant hands-free SOS
        if (checkIsEmergency(heard)) {
          setWakeStatus('triggered');
          stopWakeRecognition();

          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const alertSpeech = new SpeechSynthesisUtterance(
              language === 'ta'
                ? 'அவசர எச்சரிக்கை! எஸ்.ஓ.எஸ் உடனடி உதவி உடனடியாக தூண்டப்படுகிறது!'
                : 'Emergency wake word recognized! Triggering SOS dispatch immediately!'
            );
            alertSpeech.rate = 1.0;
            if (language === 'ta') alertSpeech.lang = 'ta-IN';
            window.speechSynthesis.speak(alertSpeech);
          }
          triggerSOS('voice');
          return;
        }

        // Siri / Assistant Wake Words -> Open Voice Assistant
        if (checkIsSiriWake(heard)) {
          triggerWakeAction();
        }
      };

      recognition.onerror = (e: any) => {
        // 'aborted' is intentional when switching to VoiceModal or pausing - never log or treat as failure
        if (e.error === 'aborted' || e.error === 'no-speech') {
          return;
        }
        if (e.error === 'not-allowed') {
          isRunningRef.current = false;
          isStartingRef.current = false;
          setHasMicPermission(false);
          setWakeStatus('idle');
          return;
        }
        console.warn('SiriWakeListener notice:', e.error);
      };

      recognition.onend = () => {
        isRunningRef.current = false;
        isStartingRef.current = false;
        // Continuous restart if wake mode is active and VoiceModal is NOT open
        if (siriWakeWordEnabled && !isVoiceModalOpenRef.current) {
          if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
          restartTimerRef.current = setTimeout(() => {
            if (siriWakeWordEnabled && !isVoiceModalOpenRef.current && !isRunningRef.current) {
              try {
                recognition.start();
              } catch {
                startWakeListening();
              }
            }
          }, 350);
        } else {
          setWakeStatus(isVoiceModalOpenRef.current ? 'paused' : 'idle');
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      isRunningRef.current = true;
      isStartingRef.current = false;
      setWakeStatus('listening');
    } catch (err) {
      isRunningRef.current = false;
      isStartingRef.current = false;
      setWakeStatus('idle');
    }
  }, [
    siriWakeWordEnabled,
    language,
    triggerSOS,
    triggerWakeAction,
    stopWakeRecognition
  ]);

  // Coordinate with VoiceModal: when VoiceModal is open, wake listener MUST pause
  useEffect(() => {
    if (isVoiceModalOpen) {
      stopWakeRecognition();
      setWakeStatus('paused');
    } else {
      if (siriWakeWordEnabled) {
        const timer = setTimeout(() => {
          startWakeListening();
        }, 400);
        return () => clearTimeout(timer);
      } else {
        stopWakeRecognition();
        setWakeStatus('idle');
      }
    }
  }, [isVoiceModalOpen, siriWakeWordEnabled, startWakeListening, stopWakeRecognition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWakeRecognition();
    };
  }, [stopWakeRecognition]);

  // User interaction fallback: start listening upon first click anywhere if idle
  useEffect(() => {
    const handleFirstUserInteraction = () => {
      if (siriWakeWordEnabled && wakeStatus === 'idle' && !isVoiceModalOpenRef.current) {
        startWakeListening();
      }
    };

    window.addEventListener('click', handleFirstUserInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleFirstUserInteraction);
    };
  }, [siriWakeWordEnabled, wakeStatus, startWakeListening]);

  if (!siriWakeWordEnabled && !proactiveVoiceCoachEnabled) {
    return null;
  }

  return (
    <div className="fixed top-3 right-3 z-40 flex items-center space-x-2">
      {/* Siri Wake Word Interactive Badge & Controls */}
      {siriWakeWordEnabled && (
        <div className="flex items-center space-x-1.5">
          {/* Main Status Pill (Clickable: triggers test or grants permission) */}
          <button
            type="button"
            onClick={() => {
              if (wakeStatus === 'idle' || hasMicPermission === false) {
                startWakeListening();
              } else {
                // If already active, trigger wake test so user sees "Hey Helyra" works
                triggerWakeAction();
              }
            }}
            title={
              language === 'ta'
                ? 'ஹே ஹெலிரா குரல் பயன்முறை: "ஹே ஹெலிரா" என்று பேசவும் அல்லது கிளிக் செய்து சோதிக்கவும்'
                : 'Hey Helyra Wake Mode: Say "Hey Helyra" or click to test hands-free'
            }
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border shadow-lg transition-all active:scale-95 ${
              wakeStatus === 'triggered'
                ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                : wakeStatus === 'listening'
                ? 'bg-slate-900/90 text-emerald-300 border-emerald-500/50 hover:bg-slate-800'
                : wakeStatus === 'paused'
                ? 'bg-slate-900/90 text-teal-300 border-teal-500/30'
                : 'bg-amber-950/90 text-amber-300 border-amber-500/50 hover:bg-amber-900/90'
            }`}
          >
            {/* Status dot */}
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                wakeStatus === 'triggered'
                  ? 'bg-white animate-ping'
                  : wakeStatus === 'listening'
                  ? 'bg-emerald-400 animate-pulse'
                  : wakeStatus === 'paused'
                  ? 'bg-teal-400'
                  : 'bg-amber-400'
              }`}
            />
            <Mic className="w-3.5 h-3.5" />
            <span>
              {wakeStatus === 'triggered'
                ? 'Waking Helyra...'
                : wakeStatus === 'listening'
                ? '"Hey Helyra" Listening'
                : wakeStatus === 'paused'
                ? 'Voice Active'
                : 'Enable "Hey Helyra"'}
            </span>
          </button>

          {/* Quick "Test Wake" button for instant hands-free simulation */}
          {wakeStatus === 'listening' && (
            <button
              type="button"
              onClick={triggerWakeAction}
              title="Test 'Hey Helyra' Wake Word"
              className="px-2 py-1.5 rounded-full bg-slate-900/80 hover:bg-teal-900/80 border border-teal-500/30 text-teal-300 text-[10px] font-bold flex items-center space-x-1 shadow transition-colors active:scale-95"
            >
              <Sparkles className="w-3 h-3 text-teal-400" />
              <span>Test</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
