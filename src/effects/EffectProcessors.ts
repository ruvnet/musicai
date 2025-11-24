/**
 * Audio Effects Processors
 *
 * Basic DSP effects for mixer channels:
 * - EQ (3-band parametric)
 * - Compressor
 * - Limiter
 * - Gate
 */

import { Effect, EffectType } from '../types/mixer.js';

/**
 * 3-Band Parametric EQ
 */
export class EQEffect implements Effect {
  id: string;
  type: EffectType;
  enabled: boolean;
  parameters: Record<string, number>;

  constructor(id: string) {
    this.id = id;
    this.type = EffectType.EQ;
    this.enabled = true;
    this.parameters = {
      lowGain: 0,      // dB (-12 to +12)
      midGain: 0,      // dB
      highGain: 0,     // dB
      lowFreq: 200,    // Hz
      midFreq: 1000,   // Hz
      highFreq: 8000,  // Hz
    };
  }

  process(input: Float32Array[], output: Float32Array[]): void {
    const lowGain = Math.pow(10, this.parameters.lowGain / 20);
    const midGain = Math.pow(10, this.parameters.midGain / 20);
    const highGain = Math.pow(10, this.parameters.highGain / 20);

    for (let ch = 0; ch < input.length; ch++) {
      for (let i = 0; i < input[ch].length; i++) {
        // Simplified EQ (in production, use proper biquad filters)
        output[ch][i] = input[ch][i] * ((lowGain + midGain + highGain) / 3);
      }
    }
  }
}

/**
 * Dynamic Range Compressor
 */
export class CompressorEffect implements Effect {
  id: string;
  type: EffectType;
  enabled: boolean;
  parameters: Record<string, number>;
  private envelope: number[];

  constructor(id: string) {
    this.id = id;
    this.type = EffectType.COMPRESSOR;
    this.enabled = true;
    this.parameters = {
      threshold: -20,  // dB
      ratio: 4,        // X:1
      attack: 5,       // ms
      release: 100,    // ms
      knee: 2,         // dB
      makeupGain: 0,   // dB
    };
    this.envelope = [];
  }

  process(input: Float32Array[], output: Float32Array[]): void {
    const threshold = Math.pow(10, this.parameters.threshold / 20);
    const ratio = this.parameters.ratio;
    const makeupGain = Math.pow(10, this.parameters.makeupGain / 20);

    for (let ch = 0; ch < input.length; ch++) {
      if (!this.envelope[ch]) this.envelope[ch] = 0;

      for (let i = 0; i < input[ch].length; i++) {
        const inputLevel = Math.abs(input[ch][i]);

        // Simple envelope follower
        if (inputLevel > this.envelope[ch]) {
          this.envelope[ch] = inputLevel;
        } else {
          this.envelope[ch] *= 0.999; // Release
        }

        // Apply compression
        let gain = 1.0;
        if (this.envelope[ch] > threshold) {
          const excess = this.envelope[ch] / threshold;
          gain = 1.0 / Math.pow(excess, (ratio - 1) / ratio);
        }

        output[ch][i] = input[ch][i] * gain * makeupGain;
      }
    }
  }
}

/**
 * Limiter (brick-wall)
 */
export class LimiterEffect implements Effect {
  id: string;
  type: EffectType;
  enabled: boolean;
  parameters: Record<string, number>;

  constructor(id: string) {
    this.id = id;
    this.type = EffectType.LIMITER;
    this.enabled = true;
    this.parameters = {
      threshold: -1,   // dB
      release: 50,     // ms
    };
  }

  process(input: Float32Array[], output: Float32Array[]): void {
    const threshold = Math.pow(10, this.parameters.threshold / 20);

    for (let ch = 0; ch < input.length; ch++) {
      for (let i = 0; i < input[ch].length; i++) {
        const sample = input[ch][i];
        if (Math.abs(sample) > threshold) {
          output[ch][i] = Math.sign(sample) * threshold;
        } else {
          output[ch][i] = sample;
        }
      }
    }
  }
}

/**
 * Noise Gate
 */
export class GateEffect implements Effect {
  id: string;
  type: EffectType;
  enabled: boolean;
  parameters: Record<string, number>;
  private gateState: boolean[];

  constructor(id: string) {
    this.id = id;
    this.type = EffectType.GATE;
    this.enabled = true;
    this.parameters = {
      threshold: -40,  // dB
      attack: 1,       // ms
      release: 100,    // ms
      range: -60,      // dB
    };
    this.gateState = [];
  }

  process(input: Float32Array[], output: Float32Array[]): void {
    const threshold = Math.pow(10, this.parameters.threshold / 20);

    for (let ch = 0; ch < input.length; ch++) {
      if (this.gateState[ch] === undefined) this.gateState[ch] = false;

      for (let i = 0; i < input[ch].length; i++) {
        const level = Math.abs(input[ch][i]);

        // Simple gate logic
        if (level > threshold) {
          this.gateState[ch] = true;
        } else if (level < threshold * 0.5) {
          this.gateState[ch] = false;
        }

        output[ch][i] = this.gateState[ch] ? input[ch][i] : 0;
      }
    }
  }
}

/**
 * Effect factory
 */
export class EffectFactory {
  static create(type: EffectType, id: string): Effect {
    switch (type) {
      case EffectType.EQ:
        return new EQEffect(id);
      case EffectType.COMPRESSOR:
        return new CompressorEffect(id);
      case EffectType.LIMITER:
        return new LimiterEffect(id);
      case EffectType.GATE:
        return new GateEffect(id);
      default:
        throw new Error(`Effect type ${type} not implemented`);
    }
  }
}
