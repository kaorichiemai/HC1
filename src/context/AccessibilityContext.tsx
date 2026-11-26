import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type AccessibilityProfile = 'default' | 'senior' | 'visual' | 'cognitive' | 'motor' | 'custom';
export type ContrastMode = 'normal' | 'high' | 'smart';
export type SpeechStatus = 'idle' | 'speaking' | 'paused' | 'unsupported';

export interface AccessibilitySettings {
  profile: AccessibilityProfile;
  textScale: number;
  contrast: ContrastMode;
  highlightLinks: boolean;
  textSpacing: boolean;
  dyslexiaFont: boolean;
  largeCursor: boolean;
  largeTouchTargets: boolean;
  reduceMotion: boolean;
  speechRate: number;
  voiceURI: string;
}

const STORAGE_KEY = 'pateros_healthconnect_accessibility';

const defaultSettings: AccessibilitySettings = {
  profile: 'default',
  textScale: 1,
  contrast: 'normal',
  highlightLinks: false,
  textSpacing: false,
  dyslexiaFont: false,
  largeCursor: false,
  largeTouchTargets: false,
  reduceMotion: false,
  speechRate: 1,
  voiceURI: '',
};

const profiles: Record<Exclude<AccessibilityProfile, 'default' | 'custom'>, Partial<AccessibilitySettings>> = {
  senior: { textScale: 1.2, contrast: 'smart', highlightLinks: true, largeTouchTargets: true, reduceMotion: true },
  visual: { textScale: 1.25, contrast: 'high', highlightLinks: true, textSpacing: true, largeCursor: true },
  cognitive: { textScale: 1.1, contrast: 'smart', highlightLinks: true, reduceMotion: true },
  motor: { largeTouchTargets: true, largeCursor: true, reduceMotion: true },
};

interface AccessibilityContextValue {
  settings: AccessibilitySettings;
  updateSettings: (patch: Partial<AccessibilitySettings>) => void;
  applyProfile: (profile: AccessibilityProfile) => void;
  resetSettings: () => void;
  speechStatus: SpeechStatus;
  speechError: string;
  activeSentence: string;
  voices: SpeechSynthesisVoice[];
  speakText: (text: string) => boolean;
  pauseSpeech: () => void;
  resumeSpeech: () => void;
  stopSpeech: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

function readSettings(): AccessibilitySettings {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return defaultSettings;
    const value = stored as Record<string, unknown>;
    return {
      ...defaultSettings,
      profile: ['default', 'senior', 'visual', 'cognitive', 'motor', 'custom'].includes(String(value.profile))
        ? value.profile as AccessibilityProfile
        : defaultSettings.profile,
      textScale: typeof value.textScale === 'number' ? Math.min(1.6, Math.max(0.9, value.textScale)) : 1,
      speechRate: typeof value.speechRate === 'number' ? Math.min(1.5, Math.max(0.7, value.speechRate)) : 1,
      contrast: ['normal', 'high', 'smart'].includes(String(value.contrast))
        ? value.contrast as ContrastMode
        : defaultSettings.contrast,
      highlightLinks: typeof value.highlightLinks === 'boolean' ? value.highlightLinks : defaultSettings.highlightLinks,
      textSpacing: typeof value.textSpacing === 'boolean' ? value.textSpacing : defaultSettings.textSpacing,
      dyslexiaFont: typeof value.dyslexiaFont === 'boolean' ? value.dyslexiaFont : defaultSettings.dyslexiaFont,
      largeCursor: typeof value.largeCursor === 'boolean' ? value.largeCursor : defaultSettings.largeCursor,
      largeTouchTargets: typeof value.largeTouchTargets === 'boolean' ? value.largeTouchTargets : defaultSettings.largeTouchTargets,
      reduceMotion: typeof value.reduceMotion === 'boolean' ? value.reduceMotion : defaultSettings.reduceMotion,
      voiceURI: typeof value.voiceURI === 'string' ? value.voiceURI : defaultSettings.voiceURI,
    };
  } catch {
    return defaultSettings;
  }
}

function sentenceAt(text: string, index: number) {
  const sentences = text.match(/[^.!?。！？]+[.!?。！？]*/g) ?? [text];
  let offset = 0;
  for (const sentence of sentences) {
    if (index <= offset + sentence.length) return sentence.trim();
    offset += sentence.length;
  }
  return sentences.at(-1)?.trim() ?? '';
}

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState(readSettings);
  const [speechStatus, setSpeechStatus] = useState<SpeechStatus>(() => (
    typeof window !== 'undefined' && 'speechSynthesis' in window ? 'idle' : 'unsupported'
  ));
  const [speechError, setSpeechError] = useState('');
  const [activeSentence, setActiveSentence] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const speechRun = useRef(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    const root = document.documentElement;
    root.dataset.accessibilityContrast = settings.contrast;
    root.dataset.accessibilityHighlightLinks = String(settings.highlightLinks);
    root.dataset.accessibilityTextSpacing = String(settings.textSpacing);
    root.dataset.accessibilityDyslexiaFont = String(settings.dyslexiaFont);
    root.dataset.accessibilityLargeCursor = String(settings.largeCursor);
    root.dataset.accessibilityTouchTargets = String(settings.largeTouchTargets);
    root.dataset.accessibilityReduceMotion = String(settings.reduceMotion);
    root.style.setProperty('--accessibility-font-scale', String(settings.textScale));
  }, [settings]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setSpeechStatus('unsupported');
      return;
    }
    const updateVoices = () => setVoices(window.speechSynthesis.getVoices());
    updateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
  }, []);

  useEffect(() => () => {
    speechRun.current += 1;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  const updateSettings = useCallback((patch: Partial<AccessibilitySettings>) => {
    setSettings((current) => ({ ...current, ...patch, profile: 'custom' }));
  }, []);

  const applyProfile = useCallback((profile: AccessibilityProfile) => {
    if (profile === 'default') {
      setSettings(defaultSettings);
      return;
    }
    if (profile === 'custom') return;
    setSettings({ ...defaultSettings, ...profiles[profile], profile });
  }, []);

  const stopSpeech = useCallback(() => {
    speechRun.current += 1;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeechStatus('idle');
    setSpeechError('');
    setActiveSentence('');
  }, []);

  const speakText = useCallback((text: string) => {
    const content = text.trim();
    if (!content) {
      setSpeechError('There is no readable text in this section.');
      return false;
    }
    if (!('speechSynthesis' in window)) {
      setSpeechStatus('unsupported');
      setSpeechError('Text-to-speech is not available in this browser.');
      return false;
    }

    speechRun.current += 1;
    const currentRun = speechRun.current;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = document.documentElement.lang === 'fil' ? 'fil-PH' : 'en-US';
    utterance.rate = settings.speechRate;
    const selectedVoice = voices.find((voice) => voice.voiceURI === settings.voiceURI);
    const preferredVoice = selectedVoice
      ?? voices.find((voice) => voice.lang.toLowerCase().startsWith(utterance.lang.slice(0, 2)));
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.onstart = () => {
      if (speechRun.current === currentRun) {
        setSpeechStatus('speaking');
        setSpeechError('');
      }
    };
    utterance.onboundary = (event) => {
      if (speechRun.current === currentRun && event.name === 'sentence') {
        setActiveSentence(sentenceAt(content, event.charIndex));
      }
    };
    utterance.onend = () => {
      if (speechRun.current === currentRun) {
        setSpeechStatus('idle');
        setActiveSentence('');
      }
    };
    utterance.onerror = (event) => {
      if (speechRun.current === currentRun && event.error !== 'canceled' && event.error !== 'interrupted') {
        setSpeechStatus('idle');
        setSpeechError('Speech could not be played. Try another voice or browser.');
      }
    };
    setSpeechStatus('speaking');
    setActiveSentence('');
    setSpeechError('');
    window.speechSynthesis.speak(utterance);
    return true;
  }, [settings.speechRate, settings.voiceURI, voices]);

  const pauseSpeech = useCallback(() => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setSpeechStatus('paused');
    }
  }, []);

  const resumeSpeech = useCallback(() => {
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setSpeechStatus('speaking');
    }
  }, []);

  const resetSettings = useCallback(() => {
    stopSpeech();
    setSettings(defaultSettings);
  }, [stopSpeech]);

  const value = useMemo(() => ({
    settings,
    updateSettings,
    applyProfile,
    resetSettings,
    speechStatus,
    speechError,
    activeSentence,
    voices,
    speakText,
    pauseSpeech,
    resumeSpeech,
    stopSpeech,
  }), [
    settings, updateSettings, applyProfile, resetSettings, speechStatus, speechError,
    activeSentence, voices, speakText, pauseSpeech, resumeSpeech, stopSpeech,
  ]);

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
};

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibility must be used within AccessibilityProvider.');
  return context;
}
