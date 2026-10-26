/**
 * HELYRA — Core TypeScript Types & Data Contracts
 * "Not Just AI That Responds — AI That Adapts."
 */

export type MedicalConditionType =
  | 'Diabetes'
  | 'Fatty liver'
  | 'Hypertension'
  | 'Heart condition'
  | 'Asthma'
  | 'Other'
  | 'None';

export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
  sosConsentGranted: boolean;
}

export interface AdaptivePreferences {
  preferredInteractionType: 'notification' | 'voice' | 'both';
  responseLength: 'short' | 'detailed';
  voiceReminderEnabled: boolean;
  voiceTone: 'gentle' | 'direct' | 'encouraging';
  fontSize: 'standard' | 'large' | 'extra-large';
  highContrastMode: boolean;
  familyNudgeAllowed: boolean;
  language?: 'en' | 'ta';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  heightCm: number;
  weightKg: number;
  medicalConditions: MedicalConditionType[];
  customCondition?: string;
  allergies: string[];
  currentMedications: string[];
  activityLevel: ActivityLevel;
  waterGoalLiters: number;
  sleepGoalHours: number;
  dailyStepGoal: number;
  emergencyContact: EmergencyContact;
  adaptivePreferences: AdaptivePreferences;
  familyId?: string;
  createdAt: string;
}

export interface FamilySharingPermissions {
  shareActivity: boolean;
  shareExercise: boolean;
  shareMedicationStatus: boolean;
  shareWater: boolean;
  shareDetailedDocuments: boolean; // default: FALSE for medical privacy
  sharePrivateMedicalInfo: boolean; // default: FALSE for medical privacy
}

export interface FamilyMemberSummary {
  userId: string;
  name: string;
  relationship: string;
  avatarColor: string;
  stepsToday: number;
  waterPercent: number;
  medsTaken: number;
  medsTotal: number;
  sleepHours: number;
  lastActive: string;
  sharingPermissions: FamilySharingPermissions;
}

export interface FamilyGroup {
  id: string;
  name: string;
  inviteCode: string;
  createdByUserId: string;
  createdAt: string;
  members: FamilyMemberSummary[];
}

export interface MedicationItem {
  id: string;
  name: string;
  dose: string;
  scheduledTime: string; // e.g. "08:00 AM", "08:00 PM"
  frequency: 'once_daily' | 'twice_daily' | 'thrice_daily' | 'as_needed';
  prescribedByDoctorDocId?: string;
  doctorInstructions?: string;
  status: 'pending' | 'taken' | 'remind_later' | 'skipped';
  lastLoggedAt?: string;
}

export interface WaterLogEntry {
  id: string;
  timestamp: string;
  amountMl: number;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  type: 'walking' | 'running' | 'cycling' | 'yoga' | 'general';
  steps: number;
  durationMinutes: number;
  caloriesBurned?: number;
}

export interface SleepLogEntry {
  id: string;
  date: string;
  bedTime: string;
  wakeTime: string;
  durationMinutes: number;
  quality: 'restful' | 'average' | 'disturbed';
  notes?: string;
}

export interface WeightLogEntry {
  id: string;
  date: string;
  weightKg: number;
}

export interface MedicalDocument {
  id: string;
  title: string;
  type: 'prescription' | 'blood_test' | 'doctor_instruction' | 'diet_chart' | 'other';
  doctorName?: string;
  facilityName?: string;
  uploadDate: string;
  fileDataUrl?: string;
  fileName: string;
  fileSizeKb: number;
  extractedText: string;
  extractedMedications: Array<{ name: string; dose: string; time: string }>;
  extractedDietInstructions: string[];
  extractedWarnings: string[];
  isAnalyzed: boolean;
}

export interface HealthReport {
  id: string;
  period: 'daily' | 'weekly' | 'monthly';
  generatedDate: string;
  dateRange: string;
  totalSteps: number;
  avgDailySteps: number;
  stepGoalAdherencePercent: number;
  totalWaterLiters: number;
  avgDailyWaterLiters: number;
  avgSleepHours: number;
  medicationAdherencePercent: number;
  medicationsTakenCount: number;
  medicationsScheduledCount: number;
  avgDailyCaloriesEstimated: number;
  dailyAddedSugarAvgGrams: number;
  weightStartKg: number;
  weightEndKg: number;
  aiSummary: string;
  nextPeriodFocus: string[];
  lifestyleGuidance: string;
}

export interface AIIntentResult {
  intent:
    | 'GREETING'
    | 'MEDICATION'
    | 'WATER'
    | 'ACTIVITY'
    | 'SLEEP'
    | 'WEIGHT'
    | 'DOCTOR_DOCUMENT'
    | 'HEALTH_REPORT'
    | 'FAMILY'
    | 'REMINDER'
    | 'GENERAL_HEALTH'
    | 'SOS'
    | 'UNKNOWN';
  spokenResponse: string;
  actionTaken?: string;
  actionPayload?: any;
  confidence: number;
  safetyNotice?: string;
  correctedQuery?: string;
  originalQuery?: string;
  corrections?: Array<{ original: string; corrected: string }>;
  wasCorrected?: boolean;
  responseTimeMs?: number;
}

export interface ReminderNotification {
  id: string;
  title: string;
  message: string;
  category: 'medication' | 'water' | 'activity' | 'doctor' | 'family_alert' | 'sos';
  dueTime: string;
  deliveredVia: 'visual' | 'voice' | 'both';
  isAcknowledged: boolean;
  ignoredCount: number;
}

export interface DayRecord {
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. "Mon", "Tue"
  displayDate: string; // e.g. "Sep 15"
  steps: number;
  stepGoal: number;
  waterMl: number;
  waterGoalMl: number;
  medsTaken: number;
  medsTotal: number;
  medicationStatuses?: Record<string, 'taken' | 'pending' | 'remind_later'>;
  caloriesKcal: number;
  calorieGoalKcal: number;
  addedSugarGrams: number;
  sugarGoalGrams: number;
  sleepMinutes: number;
  weightKg: number;
  burnedKcal?: number;
  netKcal?: number;
}

