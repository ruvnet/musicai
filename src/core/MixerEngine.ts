/**
 * Real-time Multi-Channel Mixer Engine
 *
 * Features:
 * - Arbitrary N-channel mixing
 * - Per-channel effects chain
 * - Flexible routing matrix
 * - Automation support
 * - Low-latency processing (<5ms target)
 */

import EventEmitter from 'eventemitter3';
import {
  AudioBuffer,
  ChannelConfig,
  MixerConfig,
  MixerMetrics,
  RoutingMatrix,
  Connection,
} from '../types/mixer.js';
import { ChannelStrip } from './ChannelStrip.js';
import { AutomationEngine } from './AutomationEngine.js';

export class MixerEngine extends EventEmitter {
  private config: MixerConfig;
  private channels: Map<string, ChannelStrip>;
  private auxChannels: Map<string, ChannelStrip>;
  private masterChannel: ChannelStrip;
  private routingMatrix: RoutingMatrix;
  private automationEngine: AutomationEngine;
  private metrics: MixerMetrics;
  private isProcessing: boolean;
  private currentTime: number;

  // Buffer pool for zero-allocation processing
  private outputBufferPool: Float32Array[];
  private currentPoolIndex: number;

  constructor(config: MixerConfig) {
    super();
    this.config = config;
    this.channels = new Map();
    this.auxChannels = new Map();
    this.routingMatrix = {
      inputs: config.channels,
      outputs: 2, // Stereo master
      connections: [],
    };
    this.automationEngine = new AutomationEngine();
    this.metrics = {
      latency: 0,
      cpuUsage: 0,
      bufferUnderruns: 0,
      activeChannels: 0,
      processingTime: 0,
    };
    this.isProcessing = false;
    this.currentTime = 0;

    // Pre-allocate buffer pool (double buffering)
    this.outputBufferPool = [
      new Float32Array(config.blockSize),
      new Float32Array(config.blockSize),
      new Float32Array(config.blockSize),
      new Float32Array(config.blockSize),
    ];
    this.currentPoolIndex = 0;

    // Create master channel
    this.masterChannel = new ChannelStrip({
      id: 'master',
      name: 'Master',
      gain: 1.0,
      pan: 0.0,
      mute: false,
      solo: false,
      route: { input: -1, outputs: [0, 1], sends: [] },
      effects: { effects: [], bypass: false },
      automation: [],
    }, config.sampleRate, config.blockSize);
  }

  /**
   * Initialize mixer with channels
   */
  async initialize(): Promise<void> {
    this.emit('initializing');

    // Create input channels
    for (let i = 0; i < this.config.channels; i++) {
      const channelId = `ch${i + 1}`;
      const channel = new ChannelStrip(
        {
          id: channelId,
          name: `Channel ${i + 1}`,
          gain: 0.8,
          pan: 0.0,
          mute: false,
          solo: false,
          route: { input: i, outputs: [], sends: [] },
          effects: { effects: [], bypass: false },
          automation: [],
        },
        this.config.sampleRate,
        this.config.blockSize
      );
      this.channels.set(channelId, channel);
    }

    // Create 4 aux channels
    for (let i = 0; i < 4; i++) {
      const auxId = `aux${i + 1}`;
      const aux = new ChannelStrip(
        {
          id: auxId,
          name: `Aux ${i + 1}`,
          gain: 0.8,
          pan: 0.0,
          mute: false,
          solo: false,
          route: { input: -1, outputs: [], sends: [] },
          effects: { effects: [], bypass: false },
          automation: [],
        },
        this.config.sampleRate,
        this.config.blockSize
      );
      this.auxChannels.set(auxId, aux);
    }

    this.emit('initialized', {
      channels: this.channels.size,
      auxChannels: this.auxChannels.size,
    });

    // Warmup: Process dummy blocks to pre-allocate and JIT compile
    this.warmup();
  }

  /**
   * Warmup processing to prevent first-run allocation spikes
   */
  private warmup(): void {
    const dummyInput: AudioBuffer = {
      samples: Array(this.config.channels).fill(null).map(() => new Float32Array(this.config.blockSize)),
      channels: this.config.channels,
      sampleRate: this.config.sampleRate,
      blockSize: this.config.blockSize,
    };

    // Process 3 dummy blocks to warmup JIT and allocate buffers
    for (let i = 0; i < 3; i++) {
      this.processBlock(dummyInput);
    }

    // Reset metrics after warmup
    this.reset();
  }

  /**
   * Process audio block (main mixing function)
   */
  processBlock(inputs: AudioBuffer): AudioBuffer {
    const startTime = performance.now();

    // Reuse output buffers from pool (zero-allocation)
    const leftBuffer = this.outputBufferPool[this.currentPoolIndex];
    const rightBuffer = this.outputBufferPool[this.currentPoolIndex + 1];
    this.currentPoolIndex = (this.currentPoolIndex + 2) % (this.outputBufferPool.length - 1);

    // Clear buffers
    leftBuffer.fill(0);
    rightBuffer.fill(0);

    // Create output buffer reference
    const output: AudioBuffer = {
      samples: [leftBuffer, rightBuffer],
      channels: 2,
      sampleRate: this.config.sampleRate,
      blockSize: this.config.blockSize,
    };

    // Check solo状态 (optimized: cache result)
    const hasSolo = Array.from(this.channels.values()).some((ch) => ch.isSolo());

    // Process each input channel
    let activeChannels = 0;
    this.channels.forEach((channel, id) => {
      const channelInput = channel.getRouteInput();
      if (channelInput >= 0 && channelInput < inputs.channels) {
        // Apply automation
        this.automationEngine.apply(id, this.currentTime, channel);

        // Get input samples for this channel
        const channelBuffer: AudioBuffer = {
          samples: [inputs.samples[channelInput]],
          channels: 1,
          sampleRate: inputs.sampleRate,
          blockSize: inputs.blockSize,
        };

        // Process channel (effects, gain, pan)
        const processed = channel.process(channelBuffer, hasSolo);

        // Route to outputs and sends
        if (processed.samples.length > 0) {
          activeChannels++;
          this.routeChannel(processed, output, channel);
        }
      }
    });

    // Process aux channels
    this.auxChannels.forEach((aux) => {
      const processed = aux.process(
        { samples: [], channels: 0, sampleRate: this.config.sampleRate, blockSize: this.config.blockSize },
        false
      );
      if (processed.samples.length > 0) {
        this.routeChannel(processed, output, aux);
      }
    });

    // Process master channel
    const masterOutput = this.masterChannel.process(output, false);

    // Update metrics
    const processingTime = performance.now() - startTime;
    this.metrics.processingTime = processingTime;
    this.metrics.activeChannels = activeChannels;
    this.metrics.latency = (this.config.blockSize / this.config.sampleRate) * 1000;
    this.currentTime += this.config.blockSize / this.config.sampleRate;

    // Check for latency issues
    if (processingTime > this.config.maxLatency) {
      this.metrics.bufferUnderruns++;
      this.emit('buffer-underrun', { processingTime, maxLatency: this.config.maxLatency });
    }

    return masterOutput;
  }

  /**
   * Route channel output to destination(s) - Optimized
   */
  private routeChannel(input: AudioBuffer, output: AudioBuffer, channel: ChannelStrip): void {
    const routeConfig = channel.getRoute();
    const blockSize = this.config.blockSize;
    const inputLeft = input.samples[0];
    const inputRight = input.samples.length > 1 ? input.samples[1] : inputLeft;

    // Route to master output
    if (routeConfig.outputs.length === 0) {
      // Default: route to master stereo (optimized loop)
      const outLeft = output.samples[0];
      const outRight = output.samples[1];

      for (let i = 0; i < blockSize; i++) {
        outLeft[i] += inputLeft[i];
        outRight[i] += inputRight[i];
      }
    } else {
      // Custom routing (cache output arrays)
      const outputSamples = output.samples;
      routeConfig.outputs.forEach((outIdx) => {
        if (outIdx < output.channels) {
          const outChannel = outputSamples[outIdx];
          for (let i = 0; i < blockSize; i++) {
            outChannel[i] += inputLeft[i];
          }
        }
      });
    }

    // Process sends to aux channels (pre-check length)
    if (routeConfig.sends.length > 0) {
      routeConfig.sends.forEach((send) => {
        const auxChannel = this.auxChannels.get(send.destination);
        if (auxChannel) {
          auxChannel.addSendInput(input, send.amount);
        }
      });
    }
  }

  /**
   * Add a channel strip
   */
  addChannel(config: ChannelConfig): void {
    const channel = new ChannelStrip(config, this.config.sampleRate, this.config.blockSize);
    this.channels.set(config.id, channel);
    this.emit('channel-added', config.id);
  }

  /**
   * Remove a channel strip
   */
  removeChannel(channelId: string): void {
    this.channels.delete(channelId);
    this.emit('channel-removed', channelId);
  }

  /**
   * Get channel by ID
   */
  getChannel(channelId: string): ChannelStrip | undefined {
    return this.channels.get(channelId);
  }

  /**
   * Update routing matrix
   */
  updateRouting(connections: Connection[]): void {
    this.routingMatrix.connections = connections;
    this.emit('routing-updated', connections);
  }

  /**
   * Set automation for parameter
   */
  setAutomation(channelId: string, parameter: string, points: any[]): void {
    this.automationEngine.setTrack(channelId, parameter, points);
    this.emit('automation-updated', { channelId, parameter });
  }

  /**
   * Get current metrics
   */
  getMetrics(): MixerMetrics {
    return { ...this.metrics };
  }

  /**
   * Get all channels
   */
  getAllChannels(): Map<string, ChannelStrip> {
    return this.channels;
  }

  /**
   * Get master channel
   */
  getMaster(): ChannelStrip {
    return this.masterChannel;
  }

  /**
   * Reset mixer state
   */
  reset(): void {
    this.currentTime = 0;
    this.metrics = {
      latency: 0,
      cpuUsage: 0,
      bufferUnderruns: 0,
      activeChannels: 0,
      processingTime: 0,
    };
    this.channels.forEach((ch) => ch.reset());
    this.auxChannels.forEach((aux) => aux.reset());
    this.masterChannel.reset();
    this.emit('reset');
  }

  /**
   * Shutdown mixer
   */
  async shutdown(): Promise<void> {
    this.isProcessing = false;
    this.channels.clear();
    this.auxChannels.clear();
    this.emit('shutdown');
  }
}
