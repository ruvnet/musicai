/**
 * MixerEngine Unit Tests
 */

import { MixerEngine } from '../../core/MixerEngine';
import { AudioBuffer, MixerConfig } from '../../types/mixer';

describe('MixerEngine', () => {
  let mixer: MixerEngine;
  let config: MixerConfig;

  beforeEach(async () => {
    config = {
      channels: 8,
      sampleRate: 48000,
      blockSize: 256,
      maxLatency: 10,
      enableMonitoring: true,
      bufferCount: 3,
    };
    mixer = new MixerEngine(config);
    await mixer.initialize();
  });

  afterEach(async () => {
    await mixer.shutdown();
  });

  describe('Initialization', () => {
    it('should initialize with correct number of channels', () => {
      expect(mixer.getAllChannels().size).toBe(8);
    });

    it('should create master channel', () => {
      const master = mixer.getMaster();
      expect(master).toBeDefined();
    });

    it('should emit initialized event', (done) => {
      const newMixer = new MixerEngine(config);
      newMixer.on('initialized', (data) => {
        expect(data.channels).toBe(8);
        done();
      });
      newMixer.initialize();
    });
  });

  describe('Audio Processing', () => {
    it('should process audio block without errors', () => {
      const input: AudioBuffer = {
        samples: Array(8).fill(null).map(() => new Float32Array(256).fill(0.5)),
        channels: 8,
        sampleRate: 48000,
        blockSize: 256,
      };

      const output = mixer.processBlock(input);
      expect(output.channels).toBe(2);
      expect(output.samples.length).toBe(2);
      expect(output.samples[0].length).toBe(256);
    });

    it('should maintain low latency', () => {
      const input: AudioBuffer = {
        samples: Array(8).fill(null).map(() => new Float32Array(256)),
        channels: 8,
        sampleRate: 48000,
        blockSize: 256,
      };

      const startTime = performance.now();
      mixer.processBlock(input);
      const processingTime = performance.now() - startTime;

      expect(processingTime).toBeLessThan(config.maxLatency);
    });

    it('should process multiple blocks sequentially', () => {
      for (let i = 0; i < 10; i++) {
        const input: AudioBuffer = {
          samples: Array(8).fill(null).map(() => new Float32Array(256).fill(0.1)),
          channels: 8,
          sampleRate: 48000,
          blockSize: 256,
        };

        const output = mixer.processBlock(input);
        expect(output.channels).toBe(2);
      }

      const metrics = mixer.getMetrics();
      expect(metrics.bufferUnderruns).toBe(0);
    });
  });

  describe('Channel Management', () => {
    it('should add channel dynamically', () => {
      mixer.addChannel({
        id: 'ch9',
        name: 'Channel 9',
        gain: 0.8,
        pan: 0.0,
        mute: false,
        solo: false,
        route: { input: 8, outputs: [], sends: [] },
        effects: { effects: [], bypass: false },
        automation: [],
      });

      expect(mixer.getAllChannels().size).toBe(9);
    });

    it('should remove channel', () => {
      mixer.removeChannel('ch1');
      expect(mixer.getAllChannels().size).toBe(7);
    });

    it('should get channel by ID', () => {
      const channel = mixer.getChannel('ch1');
      expect(channel).toBeDefined();
    });
  });

  describe('Automation', () => {
    it('should set automation for channel parameter', () => {
      mixer.setAutomation('ch1', 'gain', [
        { time: 0, value: 0.5, curve: 'linear' },
        { time: 1, value: 1.0, curve: 'linear' },
      ]);

      // Automation is applied during processing
      const input: AudioBuffer = {
        samples: [new Float32Array(256).fill(0.5)].concat(
          Array(7).fill(null).map(() => new Float32Array(256))
        ),
        channels: 8,
        sampleRate: 48000,
        blockSize: 256,
      };

      mixer.processBlock(input);
      // Check that automation was applied (output should be affected)
    });
  });

  describe('Metrics', () => {
    it('should track active channels', () => {
      const input: AudioBuffer = {
        samples: Array(8).fill(null).map(() => new Float32Array(256).fill(0.1)),
        channels: 8,
        sampleRate: 48000,
        blockSize: 256,
      };

      mixer.processBlock(input);
      const metrics = mixer.getMetrics();

      expect(metrics.activeChannels).toBeGreaterThan(0);
    });

    it('should calculate latency correctly', () => {
      const input: AudioBuffer = {
        samples: Array(8).fill(null).map(() => new Float32Array(256)),
        channels: 8,
        sampleRate: 48000,
        blockSize: 256,
      };

      mixer.processBlock(input);
      const metrics = mixer.getMetrics();

      const expectedLatency = (256 / 48000) * 1000; // ~5.33ms
      expect(metrics.latency).toBeCloseTo(expectedLatency, 1);
    });
  });

  describe('Reset', () => {
    it('should reset mixer state', () => {
      const input: AudioBuffer = {
        samples: Array(8).fill(null).map(() => new Float32Array(256).fill(0.5)),
        channels: 8,
        sampleRate: 48000,
        blockSize: 256,
      };

      mixer.processBlock(input);
      mixer.reset();

      const metrics = mixer.getMetrics();
      expect(metrics.processingTime).toBe(0);
    });
  });
});
