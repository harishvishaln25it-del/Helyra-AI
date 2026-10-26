/**
 * HELYRA Health Context & State Provider
 * Provides unified state for individual tracking, family sharing, medications,
 * documents, adaptive preferences, and emergency workflows.
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  UserProfile,
  FamilyGroup,
  MedicationItem,
  MedicalDocument,
  FamilySharingPermissions,
  EmergencyContact,
  AdaptivePreferences,
  DayRecord
} from '../types';
import { apiService } from '../services/apiService';
import { AppLanguage, TRANSLATIONS, Translations } from '../services/i18n';
import { stepCounterService } from '../services/stepCounterService';
import { authService, SecurityStatus } from '../services/authService';

interface HealthContextType {
  isAuthenticated: boolean;
  authLoading: boolean;
  securityStatus: SecurityStatus | null;
  refreshSecurity: () => Promise<void>;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: Translations;
  user: UserProfile;
  family: FamilyGroup;
  medications: MedicationItem[];
  medicalDocuments: MedicalDocument[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  availableDays: DayRecord[];
  todayStats: DayRecord;
  currentDayStats: DayRecord;
  sosActive: boolean;
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  login: (email: string, name?: string) => void;
  logout: () => void;
  addWater: (ml: number) => void;
  addSteps: (steps: number) => void;
  addCalories: (kcal: number, mealName?: string, sugarGrams?: number) => void;
  setCalories: (kcal: number) => void;
  toggleMedication: (id: string, status: 'taken' | 'pending' | 'remind_later') => void;
  addMedication: (med: Omit<MedicationItem, 'id'>) => void;
  deleteMedication: (id: string) => void;
  addMedicalDocument: (doc: MedicalDocument) => void;
  updateEmergencyContact: (contact: EmergencyContact) => void;
  updateAdaptivePreferences: (prefs: Partial<AdaptivePreferences>) => void;
  updateFamilyPermissions: (perms: Partial<FamilySharingPermissions>) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  triggerSOS: (method: 'voice' | 'button') => Promise<any>;
  cancelSOS: () => void;
  joinFamilyWithCode: (code: string) => boolean;
  deleteFamilyMember: (memberId: string) => void;
  addFamilyMember: (member: any) => void;
  siriWakeWordEnabled: boolean;
  setSiriWakeWordEnabled: (enabled: boolean) => void;
  proactiveVoiceCoachEnabled: boolean;
  setProactiveVoiceCoachEnabled: (enabled: boolean) => void;
  proactiveNudgeCount: number;
  speakProactiveGoalNudge: (forced?: boolean) => void;
  brandName: string;
  setBrandName: (name: string) => void;
}

const DEFAULT_USER: UserProfile = {
  id: 'usr_harish_01',
  name: 'Harish',
  email: 'harish.health@gmail.com',
  familyCode: 'HL-9204',
  avatarUrl: '',
  age: 32,
  gender: 'male',
  heightCm: 175,
  weightKg: 74.2,
  medicalConditions: ['Diabetes', 'Hypertension'],
  allergies: ['Penicillin'],
  currentMedications: ['Metformin 500mg', 'Telmisartan 40mg'],
  activityLevel: 'moderately_active',
  waterGoalLiters: 2.0,
  sleepGoalHours: 8,
  dailyStepGoal: 10000,
  emergencyContact: {
    name: 'Dr. Anand (Family Physician)',
    phone: '+1-555-0199',
    relationship: 'Family Doctor',
    sosConsentGranted: true
  },
  adaptivePreferences: {
    preferredInteractionType: 'both',
    responseLength: 'short',
    voiceReminderEnabled: true,
    voiceTone: 'gentle',
    fontSize: 'standard',
    highContrastMode: false,
    familyNudgeAllowed: true
  },
  createdAt: '2026-01-15T08:00:00.000Z'
};

const DEFAULT_FAMILY: FamilyGroup = {
  id: 'fam_01',
  name: 'Family Circle',
  inviteCode: 'HL-4820',
  createdByUserId: 'usr_harish_01',
  createdAt: '2026-02-01T10:00:00.000Z',
  members: [
    {
      userId: 'usr_father_01',
      name: 'Father',
      relationship: 'Father',
      avatarColor: '#0d9488',
      userFamilyCode: 'HL-5819',
      stepsToday: 6420,
      waterPercent: 60,
      medsTaken: 2,
      medsTotal: 2,
      tabletsList: [
        { name: 'Amlodipine 5mg', dose: '1 Medicine', scheduledTime: '08:00 AM (After Breakfast)', status: 'taken' },
        { name: 'Atorvastatin 10mg', dose: '1 Medicine', scheduledTime: '09:00 PM (After Dinner)', status: 'taken' }
      ],
      sleepHours: 6.8,
      lastActive: '10 mins ago',
      sharingPermissions: {
        shareActivity: true,
        shareExercise: true,
        shareMedicationStatus: true,
        shareWater: true,
        shareDetailedDocuments: false,
        sharePrivateMedicalInfo: false
      }
    },
    {
      userId: 'usr_mother_01',
      name: 'Mother',
      relationship: 'Mother',
      avatarColor: '#059669',
      userFamilyCode: 'HL-3742',
      stepsToday: 5890,
      waterPercent: 90,
      medsTaken: 1,
      medsTotal: 2,
      tabletsList: [
        { name: 'Thyroxine 50mcg', dose: '1 Medicine', scheduledTime: '07:00 AM (Empty Stomach)', status: 'taken' },
        { name: 'Calcium + Vit D3', dose: '1 Medicine', scheduledTime: '09:00 PM (After Dinner)', status: 'pending' }
      ],
      sleepHours: 7.5,
      lastActive: '25 mins ago',
      sharingPermissions: {
        shareActivity: true,
        shareExercise: true,
        shareMedicationStatus: true,
        shareWater: true,
        shareDetailedDocuments: false,
        sharePrivateMedicalInfo: false
      }
    }
  ]
};

const DEFAULT_MEDICATIONS: MedicationItem[] = [
  {
    id: 'med_01',
    name: 'Metformin',
    dose: '500 mg',
    scheduledTime: '08:00 PM',
    frequency: 'twice_daily',
    doctorInstructions: 'Take with or immediately after evening dinner. Do not skip.',
    status: 'taken',
    lastLoggedAt: '2026-09-11T20:15:00.000Z'
  },
  {
    id: 'med_02',
    name: 'Telmisartan',
    dose: '40 mg',
    scheduledTime: '08:00 AM',
    frequency: 'once_daily',
    doctorInstructions: 'Take morning after breakfast with 1 glass of water.',
    status: 'taken',
    lastLoggedAt: '2026-09-11T08:30:00.000Z'
  },
  {
    id: 'med_03',
    name: 'Vitamin D3 & Calcium',
    dose: '60,000 IU / 500 mg',
    scheduledTime: '10:00 PM',
    frequency: 'once_daily',
    doctorInstructions: 'Take before bed with warm water or milk.',
    status: 'pending'
  }
];

const DEFAULT_DOCUMENTS: MedicalDocument[] = [
  {
    id: 'doc_prescription_01',
    title: 'Cardiology Consultation & Prescription',
    type: 'prescription',
    doctorName: 'Dr. S. K. Ramanathan, MD (Cardiology)',
    facilityName: 'City Healthcare Clinic',
    uploadDate: '2026-08-20',
    fileName: 'prescription_dr_ramanathan.pdf',
    fileSizeKb: 342,
    extractedText:
      'Patient: Harish Vishal (32 yrs). Diagnosis: Mild essential hypertension, pre-diabetes management.\nPrescription:\n1. Tab Metformin 500mg - 1 tablet twice daily after meals.\n2. Tab Telmisartan 40mg - 1 tablet in the morning after breakfast.\nDietary & Lifestyle Advice:\n- Restrict daily direct table sugar and sugary drinks.\n- Keep daily hydration minimum 2.0 Liters.\n- Brisk walking 30 minutes daily (minimum 8,000 - 10,000 steps).\n- Review in 3 months with fasting blood glucose & HbA1c.',
    extractedMedications: [
      { name: 'Metformin', dose: '500 mg', time: '08:00 PM (Twice daily after meals)' },
      { name: 'Telmisartan', dose: '40 mg', time: '08:00 AM (Morning after breakfast)' }
    ],
    extractedDietInstructions: [
      'Restrict daily direct table sugar and sugary drinks',
      'Keep daily hydration minimum 2.0 Liters',
      'Brisk walking 30 minutes daily (minimum 8,000 - 10,000 steps)'
    ],
    extractedWarnings: [
      'Do not abruptly discontinue blood pressure medication without consulting clinic'
    ],
    isAnalyzed: true
  }
];

const HealthContext = createContext<HealthContextType | undefined>(undefined);

export const HealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brandName, setBrandNameState] = useState<string>(() => {
    const saved = localStorage.getItem('helyra_brand_name');
    if (!saved || saved === 'VITALIS' || saved === 'HELYRA') {
      localStorage.setItem('helyra_brand_name', 'Helyra AI');
      return 'Helyra AI';
    }
    return saved;
  });

  const setBrandName = (name: string) => {
    const clean = name.trim() || 'Helyra AI';
    setBrandNameState(clean);
    localStorage.setItem('helyra_brand_name', clean);
    if (typeof document !== 'undefined') {
      document.title = `${clean} — Adaptive Family Health Companion`;
    }
  };

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('helyra_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name === 'Harish Vishal') {
          return { ...DEFAULT_USER, ...parsed, name: 'Harish' };
        }
        return parsed;
      } catch {
        return DEFAULT_USER;
      }
    }
    return DEFAULT_USER;
  });

  const [family, setFamily] = useState<FamilyGroup>(() => {
    const saved = localStorage.getItem('helyra_family');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name === 'Vishal Family' || parsed.id === 'fam_vishal_01') {
          return DEFAULT_FAMILY;
        }
        return parsed;
      } catch {
        return DEFAULT_FAMILY;
      }
    }
    return DEFAULT_FAMILY;
  });

  const [medications, setMedications] = useState<MedicationItem[]>(() => {
    const saved = localStorage.getItem('helyra_medications');
    return saved ? JSON.parse(saved) : DEFAULT_MEDICATIONS;
  });

  const [medicalDocuments, setMedicalDocuments] = useState<MedicalDocument[]>(() => {
    const saved = localStorage.getItem('helyra_documents');
    return saved ? JSON.parse(saved) : DEFAULT_DOCUMENTS;
  });

  const generateInitialDailyRecords = (): Record<string, DayRecord> => {
    const records: Record<string, DayRecord> = {};
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Distinct, realistic daily health stats across the week
    const presets = [
      { steps: 8420, waterMl: 1500, medsTaken: 2, medsTotal: 3, caloriesKcal: 1480, addedSugarGrams: 9, sleepMinutes: 435, weightKg: 74.2 }, // Today
      { steps: 10250, waterMl: 2250, medsTaken: 3, medsTotal: 3, caloriesKcal: 1920, addedSugarGrams: 14, sleepMinutes: 460, weightKg: 74.3 }, // Yesterday
      { steps: 6800, waterMl: 1750, medsTaken: 2, medsTotal: 3, caloriesKcal: 1650, addedSugarGrams: 18, sleepMinutes: 390, weightKg: 74.4 }, // -2d
      { steps: 9150, waterMl: 2000, medsTaken: 3, medsTotal: 3, caloriesKcal: 1780, addedSugarGrams: 11, sleepMinutes: 450, weightKg: 74.5 }, // -3d
      { steps: 8600, waterMl: 1800, medsTaken: 3, medsTotal: 3, caloriesKcal: 1580, addedSugarGrams: 12, sleepMinutes: 440, weightKg: 74.5 }, // -4d
      { steps: 7300, waterMl: 1250, medsTaken: 1, medsTotal: 3, caloriesKcal: 1840, addedSugarGrams: 22, sleepMinutes: 410, weightKg: 74.6 }, // -5d
      { steps: 11100, waterMl: 2500, medsTaken: 3, medsTotal: 3, caloriesKcal: 2100, addedSugarGrams: 15, sleepMinutes: 480, weightKg: 74.7 }  // -6d
    ];

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const p = presets[i] || presets[0];
      const burned = Math.round(p.steps * 0.04);
      records[dateStr] = {
        date: dateStr,
        dayLabel: i === 0 ? 'Today' : dayNames[d.getDay()],
        displayDate: `${monthNames[d.getMonth()]} ${d.getDate()}`,
        steps: p.steps,
        stepGoal: 10000,
        waterMl: p.waterMl,
        waterGoalMl: 2000,
        medsTaken: p.medsTaken,
        medsTotal: p.medsTotal,
        caloriesKcal: p.caloriesKcal,
        calorieGoalKcal: 2000,
        addedSugarGrams: p.addedSugarGrams,
        sugarGoalGrams: 25,
        sleepMinutes: p.sleepMinutes,
        weightKg: p.weightKg,
        burnedKcal: burned,
        netKcal: p.caloriesKcal - burned
      };
    }
    return records;
  };

  const todayDateStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayDateStr);
  const [dailyRecords, setDailyRecords] = useState<Record<string, DayRecord>>(() => {
    const saved = localStorage.getItem('helyra_daily_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const defaults = generateInitialDailyRecords();
        return { ...defaults, ...parsed };
      } catch {}
    }
    return generateInitialDailyRecords();
  });

  const availableDays = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days: DayRecord[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const rec = dailyRecords[dateStr] || {
        date: dateStr,
        dayLabel: i === 0 ? 'Today' : dayNames[d.getDay()],
        displayDate: `${monthNames[d.getMonth()]} ${d.getDate()}`,
        steps: 8420,
        stepGoal: 10000,
        waterMl: 1500,
        waterGoalMl: 2000,
        medsTaken: 2,
        medsTotal: 3,
        caloriesKcal: 1480,
        calorieGoalKcal: 2000,
        addedSugarGrams: 9,
        sugarGoalGrams: 25,
        sleepMinutes: 435,
        weightKg: 74.2,
        burnedKcal: 337,
        netKcal: 1143
      };
      days.push(rec);
    }
    return days;
  }, [dailyRecords]);

  const currentDayStats: DayRecord = useMemo(() => {
    const rec = dailyRecords[selectedDate] || availableDays[0];
    const burned = rec.burnedKcal ?? Math.round(rec.steps * 0.04);
    return {
      ...rec,
      burnedKcal: burned,
      netKcal: rec.caloriesKcal - burned
    };
  }, [dailyRecords, selectedDate, availableDays]);

  const todayStats = currentDayStats;

  const [sosActive, setSosActive] = useState(false);
  const [activeScreen, setActiveScreen] = useState('home');
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem('helyra_lang') as AppLanguage | null;
    return saved === 'ta' ? 'ta' : 'en';
  });

  const setLanguage = (newLang: AppLanguage) => {
    setLanguageState(newLang);
    localStorage.setItem('helyra_lang', newLang);
    setUser(prev => ({
      ...prev,
      adaptivePreferences: {
        ...prev.adaptivePreferences,
        language: newLang
      }
    }));
  };

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Authenticate session strictly against backend server on mount
  const refreshSecurity = async () => {
    try {
      const res = await authService.getMe();
      if (res.authenticated && res.user) {
        setIsAuthenticated(true);
        if (res.security) setSecurityStatus(res.security);
        setUser(prev => ({
          ...prev,
          id: res.user!.id,
          name: res.user!.name,
          email: res.user!.email
        }));
      } else {
        setIsAuthenticated(false);
        setSecurityStatus(null);
      }
    } catch (err) {
      console.warn('[AUTH] Session verification error:', err);
      setIsAuthenticated(false);
      setSecurityStatus(null);
    }
  };

  useEffect(() => {
    const initSession = async () => {
      setAuthLoading(true);
      await refreshSecurity();
      setAuthLoading(false);
    };
    initSession();
  }, []);

  const login = (emailOrUser: any, name?: string) => {
    setIsAuthenticated(true);
    if (typeof emailOrUser === 'object' && emailOrUser !== null) {
      setUser(prev => ({
        ...prev,
        id: emailOrUser.id || prev.id,
        name: emailOrUser.name || prev.name,
        email: emailOrUser.email || prev.email
      }));
    } else if (typeof emailOrUser === 'string') {
      setUser(prev => ({
        ...prev,
        email: emailOrUser || prev.email,
        name: name || prev.name
      }));
    }
    refreshSecurity();
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {}
    setIsAuthenticated(false);
    setSecurityStatus(null);
    setActiveScreen('home');
  };

  // Persistence effects
  useEffect(() => {
    localStorage.setItem('helyra_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('helyra_family', JSON.stringify(family));
  }, [family]);

  useEffect(() => {
    localStorage.setItem('helyra_medications', JSON.stringify(medications));
  }, [medications]);

  useEffect(() => {
    localStorage.setItem('helyra_documents', JSON.stringify(medicalDocuments));
  }, [medicalDocuments]);

  useEffect(() => {
    localStorage.setItem('helyra_daily_records', JSON.stringify(dailyRecords));
  }, [dailyRecords]);

  // Synchronize with Native Step Counter Service (Single Source of Truth)
  useEffect(() => {
    const unsub = stepCounterService.subscribeToSteps((steps) => {
      setDailyRecords(prev => {
        const cur = prev[todayDateStr];
        if (!cur || cur.steps === steps) return prev;
        const burned = Math.round(steps * 0.04);
        return {
          ...prev,
          [todayDateStr]: {
            ...cur,
            steps,
            burnedKcal: burned,
            netKcal: cur.caloriesKcal - burned
          }
        };
      });
    });
    return () => unsub();
  }, [todayDateStr]);

  const addWater = (ml: number) => {
    setDailyRecords(prev => {
      const cur = prev[selectedDate] || currentDayStats;
      const newWater = Math.max(0, cur.waterMl + ml);
      return {
        ...prev,
        [selectedDate]: {
          ...cur,
          waterMl: newWater
        }
      };
    });
  };

  const addSteps = (steps: number) => {
    if (selectedDate === todayDateStr) {
      stepCounterService.manuallyAddSteps(steps);
    } else {
      setDailyRecords(prev => {
        const cur = prev[selectedDate] || currentDayStats;
        const newSteps = Math.max(0, cur.steps + steps);
        const burned = Math.round(newSteps * 0.04);
        return {
          ...prev,
          [selectedDate]: {
            ...cur,
            steps: newSteps,
            burnedKcal: burned,
            netKcal: cur.caloriesKcal - burned
          }
        };
      });
    }
  };

  const addCalories = (kcal: number, mealName?: string, sugarGrams = 0) => {
    setDailyRecords(prev => {
      const cur = prev[selectedDate] || currentDayStats;
      const newCal = Math.max(0, cur.caloriesKcal + kcal);
      const newSugar = Math.max(0, cur.addedSugarGrams + sugarGrams);
      const burned = cur.burnedKcal ?? Math.round(cur.steps * 0.04);
      return {
        ...prev,
        [selectedDate]: {
          ...cur,
          caloriesKcal: newCal,
          addedSugarGrams: newSugar,
          burnedKcal: burned,
          netKcal: newCal - burned
        }
      };
    });
  };

  const setCalories = (kcal: number) => {
    setDailyRecords(prev => {
      const cur = prev[selectedDate] || currentDayStats;
      const newCal = Math.max(0, kcal);
      const burned = cur.burnedKcal ?? Math.round(cur.steps * 0.04);
      return {
        ...prev,
        [selectedDate]: {
          ...cur,
          caloriesKcal: newCal,
          burnedKcal: burned,
          netKcal: newCal - burned
        }
      };
    });
  };

  const toggleMedication = (id: string, status: 'taken' | 'pending' | 'remind_later') => {
    setMedications(prev => {
      const next = prev.map(m => (m.id === id ? { ...m, status, lastLoggedAt: new Date().toISOString() } : m));
      const taken = next.filter(m => m.status === 'taken').length;
      setDailyRecords(r => {
        const cur = r[selectedDate] || currentDayStats;
        return {
          ...r,
          [selectedDate]: {
            ...cur,
            medsTaken: taken,
            medsTotal: next.length
          }
        };
      });
      return next;
    });
  };

  const addMedication = (med: Omit<MedicationItem, 'id'>) => {
    const newMed: MedicationItem = {
      ...med,
      id: `med_${Date.now()}`
    };
    setMedications(prev => [...prev, newMed]);
  };

  const deleteMedication = (id: string) => {
    setMedications(prev => {
      const next = prev.filter(m => m.id !== id);
      const taken = next.filter(m => m.status === 'taken').length;
      setDailyRecords(r => {
        const cur = r[selectedDate] || currentDayStats;
        return {
          ...r,
          [selectedDate]: {
            ...cur,
            medsTaken: taken,
            medsTotal: next.length
          }
        };
      });
      return next;
    });
  };

  const addMedicalDocument = (doc: MedicalDocument) => {
    setMedicalDocuments(prev => [doc, ...prev]);
    // Also auto-create medication entries if extracted
    if (doc.extractedMedications && doc.extractedMedications.length > 0) {
      doc.extractedMedications.forEach(m => {
        addMedication({
          name: m.name,
          dose: m.dose,
          scheduledTime: m.time || '08:00 PM',
          frequency: 'once_daily',
          doctorInstructions: `Extracted from ${doc.title}`,
          prescribedByDoctorDocId: doc.id,
          status: 'pending'
        });
      });
    }
  };

  const updateEmergencyContact = (contact: EmergencyContact) => {
    setUser(prev => ({ ...prev, emergencyContact: contact }));
  };

  const updateAdaptivePreferences = (prefs: Partial<AdaptivePreferences>) => {
    setUser(prev => ({
      ...prev,
      adaptivePreferences: { ...prev.adaptivePreferences, ...prefs }
    }));
  };

  const updateFamilyPermissions = (perms: Partial<FamilySharingPermissions>) => {
    // updates current user's outgoing permissions
    console.log('Updated family sharing permissions:', perms);
  };

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...profile }));
  };

  const triggerSOS = async (method: 'voice' | 'button') => {
    setSosActive(true);
    if (user.emergencyContact?.phone && typeof window !== 'undefined') {
      try {
        window.location.href = `tel:${user.emergencyContact.phone}`;
      } catch (err) {
        console.warn('Call trigger error:', err);
      }
    }
    return await apiService.triggerSOS(user.id, user.name, user.emergencyContact, method);
  };

  const cancelSOS = () => {
    setSosActive(false);
  };

  const joinFamilyWithCode = (code: string): boolean => {
    if (!code || code.trim().length < 4) return false;
    setFamily(prev => ({
      ...prev,
      inviteCode: code.toUpperCase()
    }));
    return true;
  };

  const deleteFamilyMember = (memberId: string) => {
    setFamily(prev => ({
      ...prev,
      members: prev.members.filter(m => m.userId !== memberId)
    }));
  };

  const addFamilyMember = (memberData: any) => {
    const newMember = {
      userId: `usr_fam_${Date.now()}`,
      name: memberData.name || 'Mother',
      relationship: memberData.relationship || 'Mother',
      avatarColor: memberData.avatarColor || '#0d9488',
      stepsToday: memberData.stepsToday || 5400,
      waterPercent: memberData.waterPercent || 80,
      medsTaken: memberData.medsTaken || 1,
      medsTotal: memberData.medsTotal || 1,
      sleepHours: memberData.sleepHours || 7.2,
      lastActive: 'Just now',
      sharingPermissions: {
        shareActivity: true,
        shareExercise: true,
        shareMedicationStatus: true,
        shareWater: true,
        shareDetailedDocuments: false,
        sharePrivateMedicalInfo: false
      }
    };
    setFamily(prev => ({
      ...prev,
      members: [...prev.members, newMember]
    }));
  };

  // Siri Mode (Hands-free wake-word recognition)
  const [siriWakeWordEnabled, setSiriWakeWordEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('helyra_siri_wake');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const setSiriWakeWordEnabled = (enabled: boolean) => {
    setSiriWakeWordEnabledState(enabled);
    localStorage.setItem('helyra_siri_wake', JSON.stringify(enabled));
  };

  // Proactive Voice Coach (Insists on completing incomplete goals)
  const [proactiveVoiceCoachEnabled, setProactiveVoiceCoachEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('helyra_proactive_coach');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const setProactiveVoiceCoachEnabled = (enabled: boolean) => {
    setProactiveVoiceCoachEnabledState(enabled);
    localStorage.setItem('helyra_proactive_coach', JSON.stringify(enabled));
  };

  const [proactiveNudgeCount, setProactiveNudgeCount] = useState<number>(0);

  // Spoken Proactive Goal Insistence
  const speakProactiveGoalNudge = (forced = false) => {
    if (!forced && !proactiveVoiceCoachEnabled) return;

    const remainingWaterMl = Math.max(0, todayStats.waterGoalMl - todayStats.waterMl);
    const pendingMeds = medications.filter(m => m.status === 'pending');
    const remainingSteps = Math.max(0, todayStats.stepGoal - todayStats.steps);

    // If all goals are complete and not forced, congratulate
    const allGoalsMet = remainingWaterMl <= 0 && pendingMeds.length === 0 && remainingSteps <= 0;

    let spokenMessage = '';
    const isTa = language === 'ta';

    if (allGoalsMet) {
      spokenMessage = isTa
        ? `அருமை ${user.name.split(' ')[0]}! இன்றைய உங்கள் அனைத்து நல்வாழ்வு இலக்குகளையும் வெற்றிகரமாக முடித்துவிட்டீர்கள். வாழ்த்துகள்!`
        : `Splendid job ${user.name.split(' ')[0]}! You have accomplished all your daily health goals. Keep up the wonderful vitality!`;
    } else {
      // Build insistent message
      const itemsToInsist: string[] = [];
      if (remainingWaterMl > 0) {
        itemsToInsist.push(
          isTa
            ? `இன்னும் ${(remainingWaterMl / 1000).toFixed(1)} லிட்டர் தண்ணீர் குடிக்க வேண்டும்`
            : `${(remainingWaterMl / 1000).toFixed(1)} liters of water left`
        );
      }
      if (pendingMeds.length > 0) {
        itemsToInsist.push(
          isTa
            ? `${pendingMeds.length} மாத்திரைகள் எடுக்கப்படாமல் உள்ளன`
            : `${pendingMeds.length} scheduled medications pending`
        );
      }
      if (remainingSteps > 1500) {
        itemsToInsist.push(
          isTa
            ? `இன்னும் ${remainingSteps.toLocaleString()} அடிகள் நடைப்பயிற்சி தேவை`
            : `${remainingSteps.toLocaleString()} steps remaining`
        );
      }

      const count = proactiveNudgeCount + 1;
      setProactiveNudgeCount(count);

      if (isTa) {
        spokenMessage = `வணக்கம் ${user.name.split(' ')[0]}! நான் உங்கள் HELYRA நல்வாழ்வு உதவியாளர். நீங்கள் இன்னும் இன்றைய இலக்குகளை முடிக்கவில்லை: ${itemsToInsist.join(', ')}. தயவுசெய்து இப்போதே ஒரு டம்ளர் தண்ணீர் குடித்து உங்கள் மாத்திரையை தவறாமல் எடுத்துக்கொள்ளுங்கள்!`;
      } else {
        spokenMessage = `Hello ${user.name.split(' ')[0]}! This is HELYRA. You have not finished your health goals today: ${itemsToInsist.join(', ')}. Please drink a glass of water right now and take your pending medication. I care about your progress and insist you finish your goals!`;
      }
    }

    // Trigger Speech Synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(spokenMessage);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      if (isTa) {
        utterance.lang = 'ta-IN';
      } else {
        utterance.lang = 'en-US';
      }

      const voices = window.speechSynthesis.getVoices();
      const voice = isTa
        ? voices.find(v => v.lang.startsWith('ta'))
        : voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural')));
      if (voice) utterance.voice = voice;

      window.speechSynthesis.speak(utterance);
    }

    // Web Notification for mobile off / screen locked / background tab
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification('HELYRA: Incomplete Health Goals', {
            body: spokenMessage,
            icon: '/icon.png',
            tag: 'helyra-goal-nudge'
          });
        } catch {}
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  };

  return (
    <HealthContext.Provider
      value={{
        isAuthenticated,
        authLoading,
        securityStatus,
        refreshSecurity,
        language,
        setLanguage,
        t,
        user,
        family,
        medications,
        medicalDocuments,
        selectedDate,
        setSelectedDate,
        availableDays,
        todayStats,
        currentDayStats,
        sosActive,
        activeScreen,
        setActiveScreen,
        login,
        logout,
        addWater,
        addSteps,
        addCalories,
        setCalories,
        toggleMedication,
        addMedication,
        deleteMedication,
        addMedicalDocument,
        updateEmergencyContact,
        updateAdaptivePreferences,
        updateFamilyPermissions,
        updateUserProfile,
        triggerSOS,
        cancelSOS,
        joinFamilyWithCode,
        deleteFamilyMember,
        addFamilyMember,
        siriWakeWordEnabled,
        setSiriWakeWordEnabled,
        proactiveVoiceCoachEnabled,
        setProactiveVoiceCoachEnabled,
        proactiveNudgeCount,
        speakProactiveGoalNudge,
        brandName,
        setBrandName
      }}
    >
      {children}
    </HealthContext.Provider>
  );
};

export const useHealth = () => {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error('useHealth must be used within a HealthProvider');
  }
  return context;
};
