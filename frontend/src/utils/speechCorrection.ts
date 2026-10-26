/**
 * HELYRA Speech & Spelling Correction Engine
 * Corrects speech-to-text transcription distortions, phonetic misrecognitions,
 * and common user typos for health terms, medications, numbers, and bilingual accents.
 */

export interface CorrectionResult {
  originalText: string;
  correctedText: string;
  corrections: Array<{ original: string; corrected: string }>;
  wasCorrected: boolean;
}

// Common phonetic and transcription corrections for speech-to-text in healthcare
const HEALTH_SPELL_MAP: Record<string, string> = {
  // Water & Hydration
  watter: 'water',
  watr: 'water',
  waater: 'water',
  worter: 'water',
  warden: 'water',
  'what are': 'water',
  hydrasun: 'hydration',
  hyderation: 'hydration',
  hydreation: 'hydration',

  // Medications & Tablets
  medisun: 'medicine',
  medisin: 'medicine',
  medicin: 'medicine',
  madison: 'medicine',
  madicine: 'medicine',
  meds: 'medicine',
  med: 'medicine',
  tablat: 'tablet',
  tablate: 'tablet',
  'tab late': 'tablet',
  tapplet: 'tablet',
  tabletts: 'tablets',
  pills: 'pills',
  pill: 'pill',
  metformin: 'Metformin',
  methformin: 'Metformin',
  paracetamol: 'Paracetamol',
  paracitamol: 'Paracetamol',
  aspirin: 'Aspirin',
  asprin: 'Aspirin',
  atorvastatin: 'Atorvastatin',
  atorva: 'Atorvastatin',
  amlodipine: 'Amlodipine',

  // Activity & Steps
  stap: 'steps',
  staps: 'steps',
  stops: 'steps',
  steeps: 'steps',
  stpes: 'steps',
  stepps: 'steps',
  step: 'steps',
  walkin: 'walking',
  wakling: 'walking',
  exersise: 'exercise',
  exersice: 'exercise',
  exercize: 'exercise',

  // Vitals & Conditions
  beepee: 'blood pressure',
  'bee pee': 'blood pressure',
  'be pee': 'blood pressure',
  'b p': 'blood pressure',
  bp: 'blood pressure',
  suger: 'sugar',
  shugar: 'sugar',
  shooger: 'sugar',
  diabities: 'diabetes',
  diabeetus: 'diabetes',
  daibetes: 'diabetes',
  hart: 'heart',
  'hart rate': 'heart rate',
  'puls rate': 'pulse rate',
  pulserate: 'pulse rate',

  // Medical Professionals & Documents
  dockter: 'doctor',
  docktar: 'doctor',
  'dock tar': 'doctor',
  docter: 'doctor',
  doctur: 'doctor',
  dr: 'doctor',
  prescrip: 'prescription',
  prescribtion: 'prescription',
  perscription: 'prescription',
  resport: 'report',
  repote: 'report',

  // Calories & Food
  calori: 'calories',
  calory: 'calories',
  callories: 'calories',
  calries: 'calories',
  nutrishun: 'nutrition',
  dietary: 'diet',

  // Sleep & Rest
  sliip: 'sleep',
  slept: 'sleep',
  tierd: 'tired',

  // SOS & Emergency
  's o s': 'SOS',
  'as o as': 'SOS',
  'es o es': 'SOS',
  ssos: 'SOS',
  emergancy: 'emergency',
  emargency: 'emergency',

  // App Name ("HELYRA")
  elira: 'HELYRA',
  helira: 'HELYRA',
  elyra: 'HELYRA',
  hilary: 'HELYRA',
  hydra: 'HELYRA',
  alira: 'HELYRA',
  lyra: 'HELYRA',
  hera: 'HELYRA',
  elara: 'HELYRA',

  // Tamil phonetic in English script
  thani: 'தண்ணீர் (water)',
  thanneer: 'தண்ணீர் (water)',
  thanni: 'தண்ணீர் (water)',
  marunthu: 'மருந்து (medicine)',
  maranthu: 'மருந்து (medicine)',
  mathirai: 'மாத்திரை (tablet)',
  maathirai: 'மாத்திரை (tablet)',
  nadai: 'நடந்த அடிகள் (steps)',
  kaapathunga: 'காப்பாத்துங்க (SOS Help)',
  udhavi: 'உதவி (help)',
  maruthuvar: 'மருத்துவர் (doctor)'
};

// Phrase level patterns to fix common speech recognition phrases
const PHRASE_RULES: Array<{ pattern: RegExp; replacement: string; originalMatch: string }> = [
  { pattern: /\bhow much what are\b/gi, replacement: 'how much water', originalMatch: 'what are → water' },
  { pattern: /\bhow many stops\b/gi, replacement: 'how many steps', originalMatch: 'stops → steps' },
  { pattern: /\bhow many staps\b/gi, replacement: 'how many steps', originalMatch: 'staps → steps' },
  { pattern: /\bdid i take my madison\b/gi, replacement: 'did I take my medicine', originalMatch: 'madison → medicine' },
  { pattern: /\bcheck my bee pee\b/gi, replacement: 'check my blood pressure', originalMatch: 'bee pee → blood pressure' },
  { pattern: /\bcheck my b p\b/gi, replacement: 'check my blood pressure', originalMatch: 'b p → blood pressure' },
  { pattern: /\bcall dock tar\b/gi, replacement: 'call doctor', originalMatch: 'dock tar → doctor' },
  { pattern: /\bhey elira\b/gi, replacement: 'hey HELYRA', originalMatch: 'elira → HELYRA' },
  { pattern: /\bhey lyra\b/gi, replacement: 'hey HELYRA', originalMatch: 'lyra → HELYRA' },
  { pattern: /\bhey hydra\b/gi, replacement: 'hey HELYRA', originalMatch: 'hydra → HELYRA' },
  { pattern: /\bhey helira\b/gi, replacement: 'hey HELYRA', originalMatch: 'helira → HELYRA' }
];

/**
 * Computes Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Normalizes and corrects spelling of spoken health query
 */
export function correctSpokenHealthQuery(rawText: string): CorrectionResult {
  if (!rawText || !rawText.trim()) {
    return {
      originalText: '',
      correctedText: '',
      corrections: [],
      wasCorrected: false
    };
  }

  let text = rawText.trim();
  const corrections: Array<{ original: string; corrected: string }> = [];

  // Step 1: Apply phrase-level rules
  for (const rule of PHRASE_RULES) {
    if (rule.pattern.test(text)) {
      text = text.replace(rule.pattern, rule.replacement);
      const [orig, corr] = rule.originalMatch.split(' → ');
      corrections.push({ original: orig, corrected: corr });
    }
  }

  // Step 2: Apply word-level dictionary and fuzzy matching
  const words = text.split(/\s+/);
  const correctedWords = words.map(word => {
    const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!cleanWord) return word;

    // Direct dictionary match
    if (HEALTH_SPELL_MAP[cleanWord]) {
      const match = HEALTH_SPELL_MAP[cleanWord];
      if (match.toLowerCase() !== cleanWord) {
        corrections.push({ original: word, corrected: match });
      }
      return match;
    }

    // Fuzzy match for words >= 4 characters against health dictionary
    if (cleanWord.length >= 4) {
      for (const [misspelled, correct] of Object.entries(HEALTH_SPELL_MAP)) {
        // If edit distance is 1 or 2
        if (Math.abs(cleanWord.length - misspelled.length) <= 2) {
          const dist = levenshteinDistance(cleanWord, misspelled);
          if (dist <= 1 && cleanWord !== correct.toLowerCase()) {
            corrections.push({ original: word, corrected: correct });
            return correct;
          }
        }
      }
    }

    return word;
  });

  const correctedText = correctedWords.join(' ');

  // Deduplicate corrections list
  const uniqueCorrections: Array<{ original: string; corrected: string }> = [];
  const seen = new Set<string>();
  for (const c of corrections) {
    const key = `${c.original.toLowerCase()}->${c.corrected.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueCorrections.push(c);
    }
  }

  return {
    originalText: rawText,
    correctedText,
    corrections: uniqueCorrections,
    wasCorrected: uniqueCorrections.length > 0 || correctedText.toLowerCase() !== rawText.toLowerCase().trim()
  };
}
