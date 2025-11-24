/**
 * Channel Strip with Full Effects Chain
 *
 * Features:
 * - Gain and pan control
 * - Mute and solo
 * - Effects chain processing
 * - Send support
 * - Metering
 */

import { AudioBuffer, ChannelConfig, RouteConfig } from '../types/mixer.js';

export class ChannelStrip {
  private config: ChannelConfig;
  private sampleRate: number;
  private blockSize: number;
  private sendInputs: Array<{ buffer: AudioBuffer; amount: number }>;
  private peakLevel: number;
  private rmsLevel: number;

  constructor(config: ChannelConfig, sampleRate: number, blockSize: number) {
    this.config = config;
    this.sampleRate = sampleRate;
    this.blockSize = blockSize;
    this.sendInputs = [];
    this.peakLevel = 0;
    this.rmsLevel = 0;
  }

  /**
   * Process audio through channel strip
   */
  process(input: AudioBuffer, hasSolo: boolean): AudioBuffer {
    // Check mute/solo state
    if (this.config.mute || (hasSolo && !this.config.solo)) {
      return {
        samples: [],
        channels: 0,
        sampleRate: this.sampleRate,
        blockSize: this.blockSize,
      };
    }

    // Process send inputs if this is an aux channel
    let processBuffer = input;
    if (this.sendInputs.length > 0) {
      processBuffer = this.mixSendInputs();
    }

    // Apply effects chain
    if (!this.config.effects.bypass && this.config.effects.effects.length > 0) {
      processBuffer = this.processEffects(processBuffer);
    }

    // Apply gain
    processBuffer = this.applyGain(processBuffer);

    // Apply pan (convert mono to stereo)
    processBuffer = this.applyPan(processBuffer);

    // Update metering
    this.updateMetering(processBuffer);

    // Clear send inputs for next block
    this.sendInputs = [];

    return processBuffer;
  }

  /**
   * Apply gain to buffer
   */
  private applyGain(buffer: AudioBuffer): AudioBuffer {
    const output: AudioBuffer = {
      samples: buffer.samples.map((channel) => {
        const out = new Float32Array(channel.length);
        for (let i = 0; i < channel.length; i++) {
          out[i] = channel[i] * this.config.gain;
        }
        return out;
      }),
      channels: buffer.channels,
      sampleRate: buffer.sampleRate,
      blockSize: buffer.blockSize,
    };
    return output;
  }

  /**
   * Apply pan (convert mono to stereo or adjust stereo)
   */
  private applyPan(buffer: AudioBuffer): AudioBuffer {
    const pan = this.config.pan; // -1 (left) to +1 (right)
    const leftGain = Math.cos((pan + 1) * Math.PI / 4);
    const rightGain = Math.sin((pan + 1) * Math.PI / 4);

    if (buffer.channels === 1) {
      // Mono to stereo with pan
      const left = new Float32Array(buffer.blockSize);
      const right = new Float32Array(buffer.blockSize);

      for (let i = 0; i < buffer.blockSize; i++) {
        left[i] = buffer.samples[0][i] * leftGain;
        right[i] = buffer.samples[0][i] * rightGain;
      }

      return {
        samples: [left, right],
        channels: 2,
        sampleRate: buffer.sampleRate,
        blockSize: buffer.blockSize,
      };
    } else if (buffer.channels === 2) {
      // Stereo pan adjustment
      const left = new Float32Array(buffer.blockSize);
      const right = new Float32Array(buffer.blockSize);

      for (let i = 0; i < buffer.blockSize; i++) {
        left[i] = buffer.samples[0][i] * leftGain;
        right[i] = buffer.samples[1][i] * rightGain;
      }

      return {
        samples: [left, right],
        channels: 2,
        sampleRate: buffer.sampleRate,
        blockSize: buffer.blockSize,
      };
    }

    return buffer;
  }

  /**
   * Process effects chain
   */
  private processEffects(buffer: AudioBuffer): AudioBuffer {
    let output = buffer;

    for (const effect of this.config.effects.effects) {
      if (effect.enabled) {
        const processedSamples = output.samples.map(() =>
          new Float32Array(this.blockSize)
        );
        effect.process(output.samples, processedSamples);
        output = {
          samples: processedSamples,
          channels: output.channels,
          sampleRate: output.sampleRate,
          blockSize: output.blockSize,
        };
      }
    }

    return output;
  }

  /**
   * Mix send inputs (for aux channels)
   */
  private mixSendInputs(): AudioBuffer {
    if (this.sendInputs.length === 0) {
      return {
        samples: [new Float32Array(this.blockSize)],
        channels: 1,
        sampleRate: this.sampleRate,
        blockSize: this.blockSize,
      };
    }

    const mixed = new Float32Array(this.blockSize);

    for (const send of this.sendInputs) {
      for (let i = 0; i < this.blockSize; i++) {
        mixed[i] += send.buffer.samples[0][i] * send.amount;
      }
    }

    return {
      samples: [mixed],
      channels: 1,
      sampleRate: this.sampleRate,
      blockSize: this.blockSize,
    };
  }

  /**
   * Update metering levels
   */
  private updateMetering(buffer: AudioBuffer): void {
    let peak = 0;
    let sum = 0;
    let sampleCount = 0;

    for (const channel of buffer.samples) {
      for (let i = 0; i < channel.length; i++) {
        const abs = Math.abs(channel[i]);
        peak = Math.max(peak, abs);
        sum += abs * abs;
        sampleCount++;
      }
    }

    this.peakLevel = peak;
    this.rmsLevel = Math.sqrt(sum / sampleCount);
  }

  /**
   * Add send input (for aux channels)
   */
  addSendInput(buffer: AudioBuffer, amount: number): void {
    this.sendInputs.push({ buffer, amount });
  }

  /**
   * Set gain
   */
  setGain(gain: number): void {
    this.config.gain = Math.max(0, Math.min(2, gain));
  }

  /**
   * Set pan
   */
  setPan(pan: number): void {
    this.config.pan = Math.max(-1, Math.min(1, pan));
  }

  /**
   * Set mute
   */
  setMute(mute: boolean): void {
    this.config.mute = mute;
  }

  /**
   * Set solo
   */
  setSolo(solo: boolean): void {
    this.config.solo = solo;
  }

  /**
   * Get metering
   */
  getMetering(): { peak: number; rms: number } {
    return {
      peak: this.peakLevel,
      rms: this.rmsLevel,
    };
  }

  /**
   * Check if solo is enabled
   */
  isSolo(): boolean {
    return this.config.solo;
  }

  /**
   * Get route config
   */
  getRoute(): RouteConfig {
    return this.config.route;
  }

  /**
   * Get route input
   */
  getRouteInput(): number {
    return this.config.route.input;
  }

  /**
   * Reset channel state
   */
  reset(): void {
    this.sendInputs = [];
    this.peakLevel = 0;
    this.rmsLevel = 0;
  }
}
