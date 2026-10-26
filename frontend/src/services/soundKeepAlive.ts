/**
 * HELYRA Background Audio Keep-Alive
 * Uses a zero-gain Web Audio oscillator or silent audio buffer to keep
 * background sensor processing active on iOS Safari and mobile Android Chrome
 * while preserving battery.
 */

class SoundKeepAliveService {
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isRunning = false;

  public start(): boolean {
    if (this.isRunning) return true;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return false;

      this.audioCtx = new AudioContextClass();
      
      // Ensure audio context is running (must be initiated by user gesture or when tracking begins)
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      // Create an imperceptible 20Hz oscillator with gain set to 0.00001 (inaudible, keeps audio thread active)
      this.oscillator = this.audioCtx.createOscillator();
      this.gainNode = this.audioCtx.createGain();

      this.oscillator.type = 'sine';
      this.oscillator.frequency.value = 20; // Sub-audible frequency
      this.gainNode.gain.value = 0.00001;   // Near-zero gain to prevent any audible sound while maintaining OS active-audio priority

      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);
      this.oscillator.start();

      this.isRunning = true;
      return true;
    } catch (e) {
      console.warn('Audio keep-alive could not be initialized:', e);
      return false;
    }
  }

  public stop(): void {
    if (!this.isRunning) return;

    try {
      if (this.oscillator) {
        this.oscillator.stop();
        this.oscillator.disconnect();
        this.oscillator = null;
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
      if (this.audioCtx && this.audioCtx.state !== 'closed') {
        this.audioCtx.close();
        this.audioCtx = null;
      }
    } catch (e) {
      console.warn('Error stopping audio keep-alive:', e);
    } finally {
      this.isRunning = false;
    }
  }

  public getStatus(): boolean {
    return this.isRunning;
  }
}

export const soundKeepAlive = new SoundKeepAliveService();
