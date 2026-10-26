/**
 * HELYRA Fitness & Step Counter Types
 * Native sensor detection, DSP signal processing, telemetry, and accuracy diagnostics.
 */

export type PlatformType = 'ios' | 'android' | 'desktop' | 'unknown';

export type SensorSource =
  | 'android_hardware_counter'   // Android TYPE_STEP_COUNTER (cumulative hardware counter)
  | 'android_hardware_detector'  // Android TYPE_STEP_DETECTOR (hardware step trigger)
  | 'ios_core_motion'            // Apple Core Motion / CMPedometer / WebKit motion framework
  | 'sensor_fusion'              // Accelerometer + Gyroscope + Gravity separation
  | 'fallback_dsp'               // High-precision adaptive DSP signal processing pipeline
  | 'simulated';                 // Interactive test simulation mode

export type MotionState =
  | 'stationary'
  | 'walking'
  | 'running'
  | 'in_pocket'
  | 'vehicle'
  | 'shaking_rejected';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type PermissionStateStatus = 'prompt' | 'granted' | 'denied' | 'unavailable';

export interface SignalProcessingConfig {
  /** Alpha factor for low-pass gravity removal filter (0.0 to 1.0) */
  gravityAlpha: number;
  /** Moving average smoothing window size to eliminate sensor jitter (e.g. 5 samples) */
  sampleWindowSize: number;
  /** Minimum acceleration delta (m/s²) required to register a candidate peak */
  peakThresholdMin: number;
  /** Maximum acceleration delta (m/s²) to reject drops, impacts, or throws */
  peakThresholdMax: number;
  /** Minimum interval between steps in ms (240ms = ~250 spm, human sprinting limit) */
  minStepIntervalMs: number;
  /** Maximum interval between steps in ms (1350ms = ~44 spm, slow walking cutoff) */
  maxStepIntervalMs: number;
  /** Hysteresis consecutive step buffer (Apple Health standard: 4-5 rhythmic steps required before confirming) */
  hysteresisBufferSize: number;
  /** Maximum normalized cadence variation (|dt_n - dt_{n-1}| / avg) allowed in a rhythmic bout */
  cadenceVarianceTolerance: number;
  /** Angular velocity threshold (rad/s) above which motion is classified as phone twirling/shaking */
  gyroRotationRejectThreshold: number;
  /** Frequency threshold (Hz) for micro-vibrations characteristic of vehicles/buses/trains */
  vehicleVibrationThresholdHz: number;
  /** User height in cm for accurate stride length calculation (stride = height * 0.415) */
  userHeightCm: number;
  /** User weight in kg for accurate calorie calculation via metabolic equivalents (METs) */
  userWeightKg: number;
  /** Sensitivity level: 'low' | 'normal' | 'high' */
  sensitivity: 'low' | 'normal' | 'high';
}

export interface RejectionStats {
  shakeRejections: number;
  tableVibrationRejections: number;
  vehicleRejections: number;
  microSpikeRejections: number;
  gyroAnomalyRejections: number;
}

export interface StepTelemetry {
  source: SensorSource;
  sourceLabel: string;
  platform: PlatformType;
  sensorAvailable: boolean;
  trackingActive: boolean;
  sampleRateHz: number;
  confidence: ConfidenceLevel;
  lastUpdateTimestamp: number;
  formattedLastUpdate: string;
  rawAcceleration: {
    x: number;
    y: number;
    z: number;
    magnitude: number;
  };
  rawRotationRate?: {
    alpha: number; // yaw
    beta: number;  // pitch
    gamma: number; // roll
  };
  filteredMagnitude: number;
  dynamicThreshold: number;
  currentCadenceSpM: number; // steps per minute
  motionState: MotionState;
  rejectionStats: RejectionStats;
  consecutiveRhythmicSteps: number;
  isBackgroundActive: boolean;
  isHardwareNative?: boolean;
  platformLimitations?: string;
}

export interface HourlyStepRecord {
  hour: number; // 0 to 23
  hourLabel: string; // e.g. "9 AM"
  steps: number;
  distanceKm: number;
  caloriesKcal: number;
  activeMinutes: number;
}

export interface DailyStepSummary {
  date: string; // YYYY-MM-DD
  dayLabel: string; // "Today", "Yesterday", "Mon", etc.
  displayDate: string; // "Oct 8"
  steps: number;
  goal: number;
  distanceKm: number;
  caloriesKcal: number;
  activeMinutes: number;
  avgCadenceSpM: number;
  hourly: HourlyStepRecord[];
  isGoalAchieved: boolean;
  percent: number;
}

export interface CumulativeHardwareState {
  baselineByDate: Record<string, number>; // cumulative reading at midnight for each date
  lastRawReading: number;
  rebootOffsetTotal: number; // compensates if hardware counter resets to 0 upon phone reboot
}
