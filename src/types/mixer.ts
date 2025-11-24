/**
 * Real-time Multi-Channel Mixer Types
 */

export interface AudioBuffer {
  samples: Float32Array[];
  channels: number;
  sampleRate: number;
  blockSize: number;
}

export interface ChannelConfig {
  id: string;
  name: string;
  gain: number;
  pan: number;
  mute: boolean;
  solo: boolean;
  route: RouteConfig;
  effects: EffectChain;
  automation: AutomationTrack[];
}

export interface RouteConfig {
  input: number;
  outputs: number[];
  sends: SendConfig[];
}

export interface SendConfig {
  destination: string;
  amount: number;
  preFader: boolean;
}

export interface EffectChain {
  effects: Effect[];
  bypass: boolean;
}

export enum EffectType {
  EQ = 'eq',
  COMPRESSOR = 'compressor',
  REVERB = 'reverb',
  DELAY = 'delay',
  CHORUS = 'chorus',
  LIMITER = 'limiter',
  GATE = 'gate',
  DISTORTION = 'distortion',
}

export interface Effect {
  id: string;
  type: EffectType;
  enabled: boolean;
  parameters: Record<string, number>;
  process(input: Float32Array[], output: Float32Array[]): void;
}

export interface AutomationTrack {
  parameter: string;
  points: AutomationPoint[];
  enabled: boolean;
}

export interface AutomationPoint {
  time: number;
  value: number;
  curve: 'linear' | 'exponential' | 'logarithmic';
}

export interface MixerConfig {
  channels: number;
  sampleRate: number;
  blockSize: number;
  maxLatency: number;
  enableMonitoring: boolean;
  bufferCount: number;
}

export interface MixerMetrics {
  latency: number;
  cpuUsage: number;
  bufferUnderruns: number;
  activeChannels: number;
  processingTime: number;
}

export interface AudioIOConfig {
  driver: 'jack' | 'alsa' | 'coreaudio' | 'wasapi' | 'simulation';
  inputDevice?: string;
  outputDevice?: string;
  sampleRate: number;
  blockSize: number;
  inputChannels: number;
  outputChannels: number;
}

export interface MonitorConfig {
  enabled: boolean;
  channels: number[];
  latency: number;
  bufferSize: number;
}

export interface RoutingMatrix {
  inputs: number;
  outputs: number;
  connections: Connection[];
}

export interface Connection {
  from: { channel: number; type: 'input' | 'channel' | 'aux' };
  to: { channel: number; type: 'channel' | 'output' | 'aux' };
  gain: number;
}
