/**
 * Comprehensive Bilingual Tamil & English Translations for HELYRA
 */

export type AppLanguage = 'en' | 'ta';

export interface Translations {
  // Brand & Slogan
  appName: string;
  tagline: string;
  slogan: string;
  loginProfilesTitle: string;
  tapToSwitch: string;
  
  // Auth Form
  signIn: string;
  joinHelyra: string;
  fullName: string;
  fullNamePlaceholder: string;
  emailAddress: string;
  password: string;
  forgotPassword: string;
  experienceMode: string;
  modeIndividual: string;
  modeFamilyAdmin: string;
  modeElderly: string;
  submitSignIn: string;
  submitSignUp: string;
  entering: string;
  privacyGuarantee: string;
  languageSelectLabel: string;
  
  // Quick profile labels
  profileHarishRole: string;
  profileVishalRole: string;

  // Assistant & SOS
  voiceAssistant: string;
  voiceActive: string;
  speakNaturally: string;
  listening: string;
  thinking: string;
  speaking: string;
  tapToSpeak: string;
  youAsked: string;
  assistantResponse: string;
  quickQuestions: string;
  typePlaceholder: string;
  emergencyVoiceHint: string;
  sosTitle: string;
  sosEmergencyAlert: string;
  sosSubtitle: string;
  cancel: string;
  dispatchNow: string;
  immediateCall: string;
  secondsRemaining: string;
  sosDispatchedTitle: string;
  sosDispatchedDesc: string;
  notifiedContacts: string;
  familyDoctor: string;
  familyNotified: string;
  callDoctorDirectly: string;
  closeAlert: string;

  // Nav & TopBar
  navHome: string;
  navMeds: string;
  navDocs: string;
  navFamily: string;
  navReports: string;
  navProfile: string;
  signOut: string;
  activeStatus: string;
  companionBadge: string;
  voiceButton: string;

  // Common Health Prompts
  promptWater: string;
  promptMeds: string;
  promptSteps: string;
  promptDoctor: string;
  promptFamily: string;
  promptSOS: string;

  // Home Screen
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;
  adaptiveInsightTitle: string;
  voiceAssistantPrompt: string;
  tapToSpeakAssistant: string;
  todaysProgress: string;
  liveSync: string;
  activityLabel: string;
  stepsLabel: string;
  goalSteps: string;
  walkButton: string;
  waterIntakeLabel: string;
  waterGoalLabel: string;
  waterLoggedAlert: string;
  dailyMedsLabel: string;
  allTaken: string;
  pendingMeds: string;
  nextDoseAt: string;
  viewSchedule: string;
  foodIntakeLabel: string;
  estimatedLabel: string;
  addedSugarLabel: string;
  dayByDayHistory: string;
  selectDay: string;
  todayLabel: string;
  yesterdayLabel: string;
  viewingDay: string;
  jumpToToday: string;
  caloriesBurned: string;
  netCalories: string;
  caloriesGoal: string;
  quickAddCalories: string;
  adjustCalories: string;
  enterDirectKcal: string;
  quickKcalAdded: string;
  mealOrSnackName: string;
  saveKcal: string;
  cancelEdit: string;
  doctorRecords: string;
  lastNightSleep: string;
  restfulSleep: string;
  bodyWeight: string;
  weightTrend: string;
  connectedFamily: string;
  familyDetails: string;
  familyPrivacyNotice: string;

  // Medication Screen
  medicationTitle: string;
  medicationSubtitle: string;
  addMedicationBtn: string;
  adherenceRate: string;
  takenToday: string;
  allMedsTakenBadge: string;
  scheduledDoses: string;
  markTaken: string;
  markPending: string;
  instructionsLabel: string;
  addNewMedTitle: string;
  medNameLabel: string;
  medNamePlaceholder: string;
  dosageLabel: string;
  dosagePlaceholder: string;
  timeLabel: string;
  frequencyLabel: string;
  doctorNotesLabel: string;
  doctorNotesPlaceholder: string;
  saveMedicationBtn: string;
  closeModal: string;

  // Documents Screen
  recordsTitle: string;
  recordsSubtitle: string;
  uploadPrescriptionBtn: string;
  askDoctorQuestion: string;
  typeQuestionPlaceholder: string;
  askButton: string;
  groundedInDocBadge: string;
  recentRecords: string;
  extractedMedicationsTitle: string;
  doctorAdviceTitle: string;
  warningsTitle: string;

  // Family Screen
  familyCircleTitle: string;
  familyCircleSubtitle: string;
  inviteCodeLabel: string;
  copyCodeBtn: string;
  codeCopied: string;
  joinFamilyBtn: string;
  joinModalTitle: string;
  joinCodePlaceholder: string;
  confirmJoinBtn: string;
  sharingSettingsTitle: string;
  sharingSettingsSubtitle: string;
  shareActivityToggle: string;
  shareWaterToggle: string;
  shareMedsToggle: string;
  shareDocsToggle: string;
  privateSecureNote: string;
  sendCareNudge: string;

  // Reports Screen
  reportsTitle: string;
  reportsSubtitle: string;
  dailyTab: string;
  weeklyTab: string;
  monthlyTab: string;
  regenerateReportBtn: string;
  aiExecutiveSummary: string;
  lifestyleGuidanceTitle: string;
  nextFocusAreasTitle: string;
  weeklyAveragesTitle: string;
  stepsAverage: string;
  waterAverage: string;
  medsAverage: string;
  sugarAverage: string;

  // Profile & Settings
  profileTitle: string;
  profileSubtitle: string;
  personalMetrics: string;
  ageLabel: string;
  weightLabel: string;
  heightLabel: string;
  healthConditionsTitle: string;
  emergencyContactTitle: string;
  contactNameLabel: string;
  contactPhoneLabel: string;
  contactRelationLabel: string;
  sosConsentLabel: string;
  adaptiveAiSettings: string;
  voiceToneLabel: string;
  responseLengthLabel: string;
  fontSizeLabel: string;
  fontSizeStandard: string;
  fontSizeLarge: string;
  saveChangesBtn: string;
  savedSuccessfully: string;
}

export const TRANSLATIONS: Record<AppLanguage, Translations> = {
  en: {
    appName: 'Helyra AI',
    tagline: 'AI HEALTH',
    slogan: 'Not Just AI That Responds — AI That Adapts.',
    loginProfilesTitle: 'Quick Login Profiles',
    tapToSwitch: 'Tap to switch',
    signIn: 'Sign In',
    joinHelyra: 'Join Helyra AI',
    fullName: 'Your Full Name',
    fullNamePlaceholder: 'e.g. Harish Vishal',
    emailAddress: 'Email Address',
    password: 'Password',
    forgotPassword: 'Forgot password?',
    experienceMode: 'Select Primary Experience Mode',
    modeIndividual: 'Individual',
    modeFamilyAdmin: 'Family Admin',
    modeElderly: 'Elderly Care',
    submitSignIn: 'Access Companion & Family Circle',
    submitSignUp: 'Create Health Account',
    entering: 'Entering HELYRA...',
    privacyGuarantee: 'End-to-end encrypted medical documents and private personal health journals.',
    languageSelectLabel: 'Language / மொழி',
    profileHarishRole: 'Family Admin & Tracker',
    profileVishalRole: 'Elderly Profile (Voice & Meds)',
    voiceAssistant: 'HELYRA Voice Assistant',
    voiceActive: 'Active Voice',
    speakNaturally: 'Speak naturally like Google Assistant',
    listening: 'Listening to you... Speak now',
    thinking: 'Processing your health intent...',
    speaking: 'Speaking response...',
    tapToSpeak: 'Tap microphone or ask anything',
    youAsked: 'You asked:',
    assistantResponse: 'HELYRA Response',
    quickQuestions: 'Tap to Ask (One-Touch):',
    typePlaceholder: 'Or type health question here...',
    emergencyVoiceHint: 'Say "HELYRA, emergency" or tap SOS for immediate alert.',
    sosTitle: 'Emergency SOS',
    sosEmergencyAlert: 'Alerting Emergency Contacts',
    sosSubtitle: 'Immediate Assistance Workflow',
    cancel: 'Cancel',
    dispatchNow: 'Call Doctor Now',
    immediateCall: 'Call Now',
    secondsRemaining: 'Seconds Remaining',
    sosDispatchedTitle: 'Emergency Alert Dispatched',
    sosDispatchedDesc: 'Help request sent to designated contact and family circle.',
    notifiedContacts: 'Notified Contacts',
    familyDoctor: 'Family Doctor',
    familyNotified: 'Family Circle Notified',
    callDoctorDirectly: 'Direct Call Doctor',
    closeAlert: 'Close Alert',

    navHome: 'Home',
    navMeds: 'Medicines',
    navDocs: 'Records',
    navFamily: 'Family',
    navReports: 'Reports',
    navProfile: 'Profile',
    signOut: 'Sign Out & View Login Page',
    activeStatus: 'Active',
    companionBadge: 'Adaptive Health Companion',
    voiceButton: 'Voice',

    promptWater: 'How much water did I drink today?',
    promptMeds: 'What are my medications today?',
    promptSteps: 'How many steps have I walked?',
    promptDoctor: 'What did my doctor say in my prescription?',
    promptFamily: 'How is my family doing today?',
    promptSOS: 'HELYRA, emergency help (SOS)',

    greetingMorning: 'Good Morning',
    greetingAfternoon: 'Good Afternoon',
    greetingEvening: 'Good Evening',
    adaptiveInsightTitle: 'HELYRA Adaptive Insight',
    voiceAssistantPrompt: '"Hey HELYRA, how\'s my health today?"',
    tapToSpeakAssistant: 'Tap to speak with Voice Assistant',
    todaysProgress: "Today's Progress",
    liveSync: 'Live Sync',
    activityLabel: 'Activity',
    stepsLabel: 'steps',
    goalSteps: 'Goal',
    walkButton: '+500 Walk',
    waterIntakeLabel: 'Water Intake',
    waterGoalLabel: 'Goal',
    waterLoggedAlert: 'Logged!',
    dailyMedsLabel: 'Daily Meds',
    allTaken: 'All Taken',
    pendingMeds: 'Pending',
    nextDoseAt: 'Next dose: 10:00 PM',
    viewSchedule: 'View Schedule',
    foodIntakeLabel: 'Food Intake',
    estimatedLabel: 'Estimated',
    addedSugarLabel: 'Added Sugar',
    dayByDayHistory: 'Day-by-Day Health Tracker',
    selectDay: 'Select Day',
    todayLabel: 'Today',
    yesterdayLabel: 'Yesterday',
    viewingDay: 'Viewing',
    jumpToToday: 'Back to Today',
    caloriesBurned: 'Burned (Walk)',
    netCalories: 'Net Kcal',
    caloriesGoal: 'Goal',
    quickAddCalories: 'Quick Add Calories',
    adjustCalories: 'Adjust Kcal',
    enterDirectKcal: 'Enter Total Calories (kcal)',
    quickKcalAdded: 'Calories updated!',
    mealOrSnackName: 'Meal or food name',
    saveKcal: 'Save',
    cancelEdit: 'Cancel',
    doctorRecords: 'Doctor Records',
    lastNightSleep: 'Last Night Sleep',
    restfulSleep: 'Restful Sleep',
    bodyWeight: 'Body Weight',
    weightTrend: '-0.6 kg this month',
    connectedFamily: 'Connected',
    familyDetails: 'Details',
    familyPrivacyNotice: 'Family members view permitted summary data only. Detailed medical documents remain strictly private.',

    medicationTitle: 'Medication Schedule',
    medicationSubtitle: 'Exact Prescribed Dosages & Timely Prompts',
    addMedicationBtn: '+ Add Medicine',
    adherenceRate: 'Adherence',
    takenToday: 'taken today',
    allMedsTakenBadge: 'All Taken on Schedule',
    scheduledDoses: 'Scheduled Doses',
    markTaken: 'Mark Taken',
    markPending: 'Taken',
    instructionsLabel: 'Doctor Instruction:',
    addNewMedTitle: 'Add New Medication',
    medNameLabel: 'Medication Name',
    medNamePlaceholder: 'e.g. Metformin',
    dosageLabel: 'Dosage',
    dosagePlaceholder: 'e.g. 500 mg',
    timeLabel: 'Scheduled Time',
    frequencyLabel: 'Frequency',
    doctorNotesLabel: 'Doctor Instructions',
    doctorNotesPlaceholder: 'e.g. Take after dinner with water',
    saveMedicationBtn: 'Save Medication',
    closeModal: 'Close',

    recordsTitle: 'Doctor Records & Prescriptions',
    recordsSubtitle: 'Ask Questions Grounded in Doctor Notes',
    uploadPrescriptionBtn: 'Upload Prescription / Report',
    askDoctorQuestion: 'Ask Doctor Instructions',
    typeQuestionPlaceholder: 'e.g., When should I take my medicines?',
    askButton: 'Ask',
    groundedInDocBadge: 'Grounded in Document',
    recentRecords: 'Uploaded Prescriptions',
    extractedMedicationsTitle: 'Extracted Prescribed Medications',
    doctorAdviceTitle: 'Extracted Doctor Lifestyle Advice',
    warningsTitle: 'Important Warnings',

    familyCircleTitle: 'Family Circle & Privacy',
    familyCircleSubtitle: 'Mutual Accountability with Granular Privacy Controls',
    inviteCodeLabel: 'Family Invite Code',
    copyCodeBtn: 'Copy Code',
    codeCopied: 'Copied!',
    joinFamilyBtn: 'Join Family Circle',
    joinModalTitle: 'Enter Family Invite Code',
    joinCodePlaceholder: 'e.g. HELYRA-VISHAL-849',
    confirmJoinBtn: 'Connect',
    sharingSettingsTitle: 'My Sharing Permissions to Family',
    sharingSettingsSubtitle: 'Choose exactly what family members can view',
    shareActivityToggle: 'Share Daily Steps & Activity',
    shareWaterToggle: 'Share Water Intake Percentage',
    shareMedsToggle: 'Share Medication Adherence Status',
    shareDocsToggle: 'Share Doctor Prescriptions (Strictly Private)',
    privateSecureNote: 'Medical documents remain strictly private by default unless explicitly permitted.',
    sendCareNudge: 'Send Gentle Care Nudge',

    reportsTitle: 'AI Health Reports',
    reportsSubtitle: 'Synthesized Guidance & Trend Analysis',
    dailyTab: 'Daily',
    weeklyTab: 'Weekly',
    monthlyTab: 'Monthly',
    regenerateReportBtn: 'Regenerate AI Report',
    aiExecutiveSummary: 'AI Health Synthesis',
    lifestyleGuidanceTitle: 'Adaptive Lifestyle Guidance',
    nextFocusAreasTitle: 'Focus Areas for Next Period',
    weeklyAveragesTitle: 'Periodic Averages & Metrics',
    stepsAverage: 'Average Steps',
    waterAverage: 'Hydration Target',
    medsAverage: 'Medication Adherence',
    sugarAverage: 'Average Added Sugar',

    profileTitle: 'Profile & Adaptive Preferences',
    profileSubtitle: 'Customize Experience & Emergency Protocols',
    personalMetrics: 'Personal Health Metrics',
    ageLabel: 'Age',
    weightLabel: 'Weight (kg)',
    heightLabel: 'Height (cm)',
    healthConditionsTitle: 'Primary Health Conditions',
    emergencyContactTitle: 'Emergency Contact Setup',
    contactNameLabel: 'Contact Name',
    contactPhoneLabel: 'Contact Phone',
    contactRelationLabel: 'Relationship',
    sosConsentLabel: 'Grant Consent for Emergency Alerts',
    adaptiveAiSettings: 'Adaptive AI Preferences',
    voiceToneLabel: 'Voice Assistant Tone',
    responseLengthLabel: 'Response Brevity',
    fontSizeLabel: 'Font Size & Accessibility',
    fontSizeStandard: 'Standard Size',
    fontSizeLarge: 'Large (Elderly-Friendly)',
    saveChangesBtn: 'Save Changes',
    savedSuccessfully: 'Profile preferences updated successfully!'
  },
  ta: {
    appName: 'Helyra AI',
    tagline: 'AI நல்வாழ்வு',
    slogan: 'பதில் மட்டும் சொல்லும் AI அல்ல — உங்களுக்கேற்ப தகவமைக்கும் AI.',
    loginProfilesTitle: 'விரைவு உள்நுழைவு சுயவிவரங்கள்',
    tapToSwitch: 'மாற்ற தொடவும்',
    signIn: 'உள்நுழைக (Sign In)',
    joinHelyra: 'புதிய கணக்கு (Join Helyra AI)',
    fullName: 'உங்கள் முழு பெயர்',
    fullNamePlaceholder: 'எ.கா. ஹரிஷ் விஷால்',
    emailAddress: 'மின்னஞ்சல் முகவரி',
    password: 'கடவுச்சொல்',
    forgotPassword: 'கடவுச்சொல் மறந்துவிட்டதா?',
    experienceMode: 'பயன்பாட்டு முறையைத் தேர்ந்தெடுக்கவும்',
    modeIndividual: 'தனிநபர்',
    modeFamilyAdmin: 'குடும்ப நிர்வாகி',
    modeElderly: 'முதியோர் பராமரிப்பு',
    submitSignIn: 'உள்நுழைக & குடும்ப வளையத்தைக் காண்க',
    submitSignUp: 'மருத்துவக் கணக்கை உருவாக்கவும்',
    entering: 'HELYRA உள்நுழைகிறது...',
    privacyGuarantee: 'முழுமையான பாதுகாக்கப்பட்ட மருத்துவ ஆவணங்கள் மற்றும் தனிப்பட்ட உடல்நலக் குறிப்புகள்.',
    languageSelectLabel: 'மொழி / Language',
    profileHarishRole: 'குடும்ப நிர்வாகி & கண்காணிப்பாளர்',
    profileVishalRole: 'முதியோர் சுயவிவரம் (குரல் & மருந்துகள்)',
    voiceAssistant: 'HELYRA குரல் உதவியாளர்',
    voiceActive: 'செயலில் உள்ள குரல்',
    speakNaturally: 'Google Assistant போல இயல்பாக பேசுங்கள்',
    listening: 'கேட்கிறது... இப்போது பேசவும்',
    thinking: 'உங்கள் தேவையை ஆராய்கிறது...',
    speaking: 'பதில் கூறுகிறது...',
    tapToSpeak: 'மைக்ரோஃபோனைத் தொட்டு பேசவும்',
    youAsked: 'நீங்கள் கேட்டது:',
    assistantResponse: 'HELYRA பதில்',
    quickQuestions: 'கேட்க உடனடியாக தொடவும்:',
    typePlaceholder: 'அல்லது உடல்நல கேள்வியை தட்டச்சு செய்க...',
    emergencyVoiceHint: '"HELYRA, அவசர உதவி" என்று கூறவும் அல்லது SOS அழுத்தவும்.',
    sosTitle: 'அவசர SOS உதவி',
    sosEmergencyAlert: 'அவசர தொடர்புகளுக்கு எச்சரிக்கை அனுப்பப்படுகிறது',
    sosSubtitle: 'உடனடி உதவி மற்றும் பாதுகாப்பு நெறிமுறை',
    cancel: 'ரத்து செய்க',
    dispatchNow: 'மருத்துவரை அழைக்கவும்',
    immediateCall: 'உடனே அழைக்க',
    secondsRemaining: 'விநாடிகள் மீதமுள்ளன',
    sosDispatchedTitle: 'அவசர எச்சரிக்கை அனுப்பப்பட்டது',
    sosDispatchedDesc: 'உங்கள் அவசர தொடர்பு மற்றும் குடும்ப வளையத்திற்கு தகவல் அனுப்பப்பட்டுள்ளது.',
    notifiedContacts: 'தகவல் தெரிவிக்கப்பட்டவர்கள்',
    familyDoctor: 'குடும்ப மருத்துவர்',
    familyNotified: 'குடும்ப வளையத்திற்கு தகவல் அளிக்கப்பட்டது',
    callDoctorDirectly: 'மருத்துவருக்கு நேரடியாக அழைக்க',
    closeAlert: 'எச்சரிக்கையை மூடு',

    navHome: 'முகப்பு',
    navMeds: 'மருந்து',
    navDocs: 'ஆவணம்',
    navFamily: 'குடும்பம்',
    navReports: 'அறிக்கை',
    navProfile: 'சுயவிவரம்',
    signOut: 'வெளியேறி உள்நுழைவு பக்கத்தைக் காண்க',
    activeStatus: 'செயலில்',
    companionBadge: 'குடும்ப நல்வாழ்வு AI உதவியாளர்',
    voiceButton: 'குரல்',

    promptWater: 'இன்று நான் எவ்வளவு தண்ணீர் குடித்தேன்?',
    promptMeds: 'இன்று நான் என்ன மருந்துகள் எடுக்க வேண்டும்?',
    promptSteps: 'இன்று எத்தனை அடிகள் நடந்துள்ளேன்?',
    promptDoctor: 'மருத்துவர் சீட்டில் என்ன ஆலோசனைகள் உள்ளன?',
    promptFamily: 'இன்று குடும்ப உறுப்பினர்களின் நலம் எப்படி உள்ளது?',
    promptSOS: 'HELYRA, அவசர உதவி தேவை (SOS)',

    greetingMorning: 'காலை வணக்கம்',
    greetingAfternoon: 'மதிய வணக்கம்',
    greetingEvening: 'மாலை வணக்கம்',
    adaptiveInsightTitle: 'HELYRA தகவமைப்பு ஆலோசனை',
    voiceAssistantPrompt: '"ஹலோ HELYRA, இன்று என் உடல்நலம் எப்படி உள்ளது?"',
    tapToSpeakAssistant: 'குரல் உதவியாளரிடம் பேச தொடவும்',
    todaysProgress: 'இன்றைய முன்னேற்றம்',
    liveSync: 'நேரடி புதுப்பிப்பு',
    activityLabel: 'நடைப்பயிற்சி',
    stepsLabel: 'அடிகள்',
    goalSteps: 'இலக்கு',
    walkButton: '+500 நடை',
    waterIntakeLabel: 'தண்ணீர் உட்கொள்ளல்',
    waterGoalLabel: 'இலக்கு',
    waterLoggedAlert: 'பதிவானது!',
    dailyMedsLabel: 'தினசரி மருந்துகள்',
    allTaken: 'அனைத்தும் எடுக்கப்பட்டது',
    pendingMeds: 'மீதமுள்ளது',
    nextDoseAt: 'அடுத்த மாத்திரை: இரவு 10:00',
    viewSchedule: 'அட்டவணையைக் காண்க',
    foodIntakeLabel: 'உணவு உட்கொள்ளல்',
    estimatedLabel: 'மதிப்பீடு',
    addedSugarLabel: 'சேர்க்கப்பட்ட சர்க்கரை',
    dayByDayHistory: 'நாளுக்கு நாள் உடல்நலக் கண்காணிப்பு',
    selectDay: 'நாளைத் தேர்ந்தெடுக்கவும்',
    todayLabel: 'இன்று',
    yesterdayLabel: 'நேற்று',
    viewingDay: 'காண்பது',
    jumpToToday: 'இன்றைய நாளுக்குச் செல்',
    caloriesBurned: 'எரிக்கப்பட்டது (நடை)',
    netCalories: 'நிகர கலோரி',
    caloriesGoal: 'இலக்கு',
    quickAddCalories: 'விரைவு கலோரி சேர்',
    adjustCalories: 'கலோரியை மாற்று',
    enterDirectKcal: 'மொத்த கலோரியை உள்ளிடவும் (kcal)',
    quickKcalAdded: 'கலோரி புதுப்பிக்கப்பட்டது!',
    mealOrSnackName: 'உணவு அல்லது சிற்றுண்டி பெயர்',
    saveKcal: 'சேமி',
    cancelEdit: 'ரத்துசெய்',
    doctorRecords: 'மருத்துவர் ஆவணங்கள்',
    lastNightSleep: 'நேற்றிரவு தூக்கம்',
    restfulSleep: 'நல்ல தூக்கம்',
    bodyWeight: 'உடல் எடை',
    weightTrend: 'இந்த மாதம் -0.6 கிலோ',
    connectedFamily: 'இணைக்கப்பட்டது',
    familyDetails: 'விவரங்கள்',
    familyPrivacyNotice: 'குடும்ப உறுப்பினர்கள் சுருக்க விவரங்களை மட்டுமே காண முடியும். மருத்துவ ஆவணங்கள் தனிப்பட்டதாகவே இருக்கும்.',

    medicationTitle: 'மருந்து அட்டவணை',
    medicationSubtitle: 'மருத்துவரின் அளவுகள் & நேரடி நினைவூட்டல்கள்',
    addMedicationBtn: '+ மருந்து சேர்க்க',
    adherenceRate: 'பின்பற்றுதல்',
    takenToday: 'இன்று எடுக்கப்பட்டது',
    allMedsTakenBadge: 'அனைத்து மருந்துகளும் எடுக்கப்பட்டன',
    scheduledDoses: 'திட்டமிடப்பட்ட மருந்துகள்',
    markTaken: 'எடுத்தேன் என குறிக்க',
    markPending: 'எடுக்கப்பட்டது',
    instructionsLabel: 'மருத்துவர் அறிவுரை:',
    addNewMedTitle: 'புதிய மருந்து சேர்க்கவும்',
    medNameLabel: 'மருந்தின் பெயர்',
    medNamePlaceholder: 'எ.கா. மெட்ஃபோர்மின்',
    dosageLabel: 'மருந்தின் அளவு',
    dosagePlaceholder: 'எ.கா. 500 மி.கி',
    timeLabel: 'எடுக்க வேண்டிய நேரம்',
    frequencyLabel: 'எத்தனை முறை',
    doctorNotesLabel: 'மருத்துவர் குறிப்புகள்',
    doctorNotesPlaceholder: 'எ.கா. இரவு உணவுடன் தண்ணீர் குடிக்கவும்',
    saveMedicationBtn: 'மருந்தைச் சேமிக்கவும்',
    closeModal: 'மூடு',

    recordsTitle: 'மருத்துவர் ஆவணங்கள் & சீட்டுகள்',
    recordsSubtitle: 'மருத்துவர் ஆலோசனைகளின்படி பதில்கள் பெறுக',
    uploadPrescriptionBtn: 'மருந்துச் சீட்டைப் பதிவேற்றவும்',
    askDoctorQuestion: 'மருத்துவர் குறிப்புகளில் கேட்கவும்',
    typeQuestionPlaceholder: 'எ.கா. மருந்தை எப்போது சாப்பிட வேண்டும்?',
    askButton: 'கேட்க',
    groundedInDocBadge: 'ஆவணத்தின் அடிப்படையில்',
    recentRecords: 'பதிவேற்றிய ஆவணங்கள்',
    extractedMedicationsTitle: 'பிரித்தெடுக்கப்பட்ட மருந்துகள்',
    doctorAdviceTitle: 'மருத்துவர் அளித்த வாழ்க்கைமுறை ஆலோசனைகள்',
    warningsTitle: 'முக்கிய எச்சரிக்கைகள்',

    familyCircleTitle: 'குடும்ப நல்வளையம் & பாதுகாப்பு',
    familyCircleSubtitle: 'தனிநபர் பாதுகாப்புடன் குடும்ப நலம் பகிர்தல்',
    inviteCodeLabel: 'குடும்ப அழைப்புக் குறியீடு',
    copyCodeBtn: 'குறியீட்டை நகலெடு',
    codeCopied: 'நகலெடுக்கப்பட்டது!',
    joinFamilyBtn: 'குடும்ப வளையத்தில் சேர',
    joinModalTitle: 'அழைப்புக் குறியீட்டை உள்ளிடவும்',
    joinCodePlaceholder: 'எ.கா. HELYRA-VISHAL-849',
    confirmJoinBtn: 'இணைக்க',
    sharingSettingsTitle: 'குடும்பத்திற்கு பகிரும் அமைப்புகள்',
    sharingSettingsSubtitle: 'குடும்ப உறுப்பினர்கள் பார்க்கக்கூடியவற்றைத் தேர்ந்தெடுக்கவும்',
    shareActivityToggle: 'தினசரி நடையை பகிரவும்',
    shareWaterToggle: 'தண்ணீர் சதவிகிதத்தை பகிரவும்',
    shareMedsToggle: 'மருந்துகள் நிலையை பகிரவும்',
    shareDocsToggle: 'மருத்துவ ஆவணங்களை பகிரவும் (ரகசியமானது)',
    privateSecureNote: 'மருத்துவ ஆவணங்கள் நீங்கள் அனுமதிக்கும் வரை முற்றிலும் ரகசியமாக வைக்கப்படும்.',
    sendCareNudge: 'அன்பான நல்வாழ்வு நினைவூட்டல் அனுப்பவும்',

    reportsTitle: 'AI நல்வாழ்வு அறிக்கைகள்',
    reportsSubtitle: 'ஒருங்கிணைந்த சுகாதார வழிகாட்டல் & புள்ளிவிவரங்கள்',
    dailyTab: 'தினசரி',
    weeklyTab: 'வாராந்திர',
    monthlyTab: 'மாதாந்திர',
    regenerateReportBtn: 'புதிய அறிக்கை உருவாக்க',
    aiExecutiveSummary: 'AI நல்வாழ்வு சுருக்கம்',
    lifestyleGuidanceTitle: 'தகவமைக்கும் வாழ்க்கைமுறை ஆலோசனை',
    nextFocusAreasTitle: 'அடுத்த வாரத்திற்கான முக்கிய இலக்குகள்',
    weeklyAveragesTitle: 'சராசரி நல்வாழ்வு அளவீடுகள்',
    stepsAverage: 'சராசரி அடிகள்',
    waterAverage: 'தண்ணீர் இலக்கு',
    medsAverage: 'மருந்து பின்பற்றுதல்',
    sugarAverage: 'சராசரி சர்க்கரை',

    profileTitle: 'சுயவிவரம் & AI விருப்பங்கள்',
    profileSubtitle: 'அனுபவம் மற்றும் அவசர அமைப்புகளை மாற்றவும்',
    personalMetrics: 'தனிப்பட்ட உடல் அளவீடுகள்',
    ageLabel: 'வயது',
    weightLabel: 'எடை (கிலோ)',
    heightLabel: 'உயரம் (செ.மீ)',
    healthConditionsTitle: 'முதன்மை உடல்நல நிலைமைகள்',
    emergencyContactTitle: 'அவசர தொடர்பு அமைப்புகள்',
    contactNameLabel: 'தொடர்பு நபர் பெயர்',
    contactPhoneLabel: 'தொலைபேசி எண்',
    contactRelationLabel: 'உறவுமுறை',
    sosConsentLabel: 'அவசர உதவி எச்சரிக்கைகளுக்கு அனுமதி அளிக்கவும்',
    adaptiveAiSettings: 'தகவமைக்கும் AI விருப்பங்கள்',
    voiceToneLabel: 'குரல் தொனி',
    responseLengthLabel: 'பதிலின் நீளம்',
    fontSizeLabel: 'எழுத்து அளவு & அணுகல்தன்மை',
    fontSizeStandard: 'சாதாரண அளவு',
    fontSizeLarge: 'பெரிய எழுத்துகள் (முதியோருக்கு உகந்தது)',
    saveChangesBtn: 'மாற்றங்களைச் சேமிக்கவும்',
    savedSuccessfully: 'சுயவிவர அமைப்புகள் புதுப்பிக்கப்பட்டன!'
  }
};
