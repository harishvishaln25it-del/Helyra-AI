import React, { useEffect, useRef } from 'react';
import { useHealth } from '../context/HealthContext';

interface SOSEmergencyVoiceListenerProps {
  onTriggerSOS: (autoDial?: boolean) => void;
  isSOSOpen: boolean;
}

/**
 * SOSEmergencyVoiceListener
 * Specifically and solely dedicated to SOS emergency triggers.
 * Listens in the background for:
 * 1. "hey helyra sos" (and phonetic variants) -> Automatically triggers emergency phone call immediately!
 * 2. General emergency words ("emergency", "sos", "help me", "காப்பாத்துங்க", "ஆபத்து") -> Opens SOS modal with countdown.
 */
export const SOSEmergencyVoiceListener: React.FC<SOSEmergencyVoiceListenerProps> = ({ onTriggerSOS, isSOSOpen }) => {
  const { language } = useHealth();
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // If SOS modal is already open, the modal's own voice assistant takes over
    if (isSOSOpen || typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    let isDestroyed = false;

    const startListener = () => {
      if (isDestroyed || isSOSOpen) return;
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language === 'ta' ? 'ta-IN' : 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          const clean = transcript.trim().toLowerCase();

          // 1. Automatic Instant Call Trigger: "hey helyra sos" and variants
          const isHeyHelyraSOS =
            clean.includes('hey helyra sos') ||
            clean.includes('hey helira sos') ||
            clean.includes('helyra sos') ||
            clean.includes('helira sos') ||
            clean.includes('hey elira sos') ||
            clean.includes('hey hylyra sos') ||
            clean.includes('hey halira sos') ||
            clean.includes('a helyra sos') ||
            clean.includes('hey helyra call') ||
            clean.includes('hey helyra emergency') ||
            (clean.includes('helyra') && clean.includes('sos')) ||
            (clean.includes('helira') && clean.includes('sos')) ||
            (clean.includes('hey') && clean.includes('sos')) ||
            clean.includes('ஹே ஹெலிரா எஸ்ஓஎஸ்') ||
            clean.includes('ஹே ஹெலிரா') ||
            clean.includes('ஹெலிரா எஸ்ஓஎஸ்') ||
            clean.includes('ஹெலிரா அவசரம்');

          if (isHeyHelyraSOS) {
            onTriggerSOS(true);
            return;
          }

          // 2. Standard Emergency triggers (opens modal with countdown confirmation)
          const isGeneralEmergency =
            clean.includes('emergency') ||
            clean.includes('sos') ||
            clean.includes('help me') ||
            clean.includes('save me') ||
            clean.includes('காப்பாத்து') ||
            clean.includes('ஆபத்து') ||
            clean.includes('அவசரம்');

          if (isGeneralEmergency) {
            onTriggerSOS(false);
          }
        };

        recognition.onerror = () => {
          // Silent recovery if browser speech recognition has transient drop
        };

        recognition.onend = () => {
          if (!isDestroyed && !isSOSOpen) {
            // Restart listener quietly to maintain emergency safety
            setTimeout(() => {
              if (!isDestroyed && !isSOSOpen) {
                try { recognition.start(); } catch {}
              }
            }, 1000);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        // Microphone permission or browser support unavailable
      }
    };

    startListener();

    return () => {
      isDestroyed = true;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
        recognitionRef.current = null;
      }
    };
  }, [isSOSOpen, language, onTriggerSOS]);

  return null;
};
