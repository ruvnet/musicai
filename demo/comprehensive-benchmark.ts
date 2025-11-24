/**
 * Comprehensive System Benchmark & Optimization Suite
 *
 * Tests all major components and identifies bottlenecks
 */

import { MixerEngine } from '../src/core/MixerEngine.js';
import { AudioIOAgent } from '../src/agents/AudioIOAgent.js';
import { AgentSwarm } from '../src/index.js';
import { AudioBuffer, MixerConfig } from '../src/types/mixer.js';
import { EffectFactory } from '../src/effects/EffectProcessors.js';
import { EffectType } from '../src/types/mixer.js';
import { AgentRole } from '../src/types/index.js';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(msg: string, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

interface BenchmarkResult {
  name: string;
  avgTime: number;
  minTime: number;
  maxTime: number;
  opsPerSec: number;
  memoryUsed: number;
  optimizable: boolean;
}

class BenchmarkSuite {
  private results: BenchmarkResult[] = [];

  async run() {
    log('\n╔══════════════════════════════════════════════════════════════════╗', colors.bright);
    log('║                                                                  ║', colors.bright);
    log('║         🔥 Comprehensive Performance Benchmark Suite 🔥         ║', colors.bright);
    log('║                                                                  ║', colors.bright);
    log('╚══════════════════════════════════════════════════════════════════╝', colors.bright);
    log('');

    await this.benchmarkMixer();
    await this.benchmarkAgentSwarm();
    await this.benchmarkAudioProcessing();
    await this.benchmarkEffects();
    await this.benchmarkAutomation();
    await this.benchmarkMemoryUsage();
    await this.generateReport();
  }

  private async benchmarkMixer() {
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
    log('1. Mixer Engine Benchmarks', colors.bright);
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);

    // Test different channel counts
    for (const channels of [4, 8, 16, 32]) {
      const result = await this.benchmarkMixerChannels(channels);
      this.results.push(result);
      this.printResult(result);
    }

    // Test different block sizes
    for (const blockSize of [128, 256, 512, 1024]) {
      const result = await this.benchmarkMixerBlockSize(blockSize);
      this.results.push(result);
      this.printResult(result);
    }

    log('');
  }

  private async benchmarkMixerChannels(channels: number): Promise<BenchmarkResult> {
    const config: MixerConfig = {
      channels,
      sampleRate: 48000,
      blockSize: 256,
      maxLatency: 10,
      enableMonitoring: true,
      bufferCount: 3,
    };

    const mixer = new MixerEngine(config);
    await mixer.initialize();

    const input: AudioBuffer = {
      samples: Array(channels).fill(null).map(() => new Float32Array(256).fill(0.5)),
      channels,
      sampleRate: 48000,
      blockSize: 256,
    };

    const iterations = 1000;
    const times: number[] = [];
    const memStart = process.memoryUsage().heapUsed;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      mixer.processBlock(input);
      times.push(performance.now() - start);
    }

    const memEnd = process.memoryUsage().heapUsed;
    await mixer.shutdown();

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    return {
      name: `Mixer ${channels} channels`,
      avgTime,
      minTime,
      maxTime,
      opsPerSec: 1000 / avgTime,
      memoryUsed: (memEnd - memStart) / 1024 / 1024,
      optimizable: maxTime > 2.0 || avgTime > 0.5,
    };
  }

  private async benchmarkMixerBlockSize(blockSize: number): Promise<BenchmarkResult> {
    const config: MixerConfig = {
      channels: 8,
      sampleRate: 48000,
      blockSize,
      maxLatency: 10,
      enableMonitoring: true,
      bufferCount: 3,
    };

    const mixer = new MixerEngine(config);
    await mixer.initialize();

    const input: AudioBuffer = {
      samples: Array(8).fill(null).map(() => new Float32Array(blockSize).fill(0.5)),
      channels: 8,
      sampleRate: 48000,
      blockSize,
    };

    const iterations = 1000;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      mixer.processBlock(input);
      times.push(performance.now() - start);
    }

    await mixer.shutdown();

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    return {
      name: `Block size ${blockSize}`,
      avgTime,
      minTime,
      maxTime,
      opsPerSec: 1000 / avgTime,
      memoryUsed: 0,
      optimizable: maxTime > 2.0 || avgTime > 0.5,
    };
  }

  private async benchmarkAgentSwarm() {
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
    log('2. Agent Swarm Benchmarks', colors.bright);
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);

    const swarm = new AgentSwarm({
      maxConcurrentAgents: 18,
      taskTimeout: 30000,
      retryAttempts: 3,
    });
    await swarm.initialize();

    // Test single agent task
    const singleResult = await this.benchmarkAgentTask(swarm, 1);
    this.results.push(singleResult);
    this.printResult(singleResult);

    // Test concurrent agent tasks
    for (const concurrent of [5, 10, 20, 50]) {
      const result = await this.benchmarkAgentTask(swarm, concurrent);
      this.results.push(result);
      this.printResult(result);
    }

    await swarm.shutdown();
    log('');
  }

  private async benchmarkAgentTask(swarm: AgentSwarm, concurrent: number): Promise<BenchmarkResult> {
    const iterations = 100;
    const times: number[] = [];
    const memStart = process.memoryUsage().heapUsed;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      const promises = [];
      for (let j = 0; j < concurrent; j++) {
        promises.push(
          swarm.executeTask(AgentRole.AUDIO_ANALYZER, 'analyze_audio', {
            audioBuffer: new Float32Array(256),
            sampleRate: 48000,
          })
        );
      }

      await Promise.all(promises);
      times.push(performance.now() - start);
    }

    const memEnd = process.memoryUsage().heapUsed;

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    return {
      name: `Agent tasks x${concurrent}`,
      avgTime,
      minTime,
      maxTime,
      opsPerSec: (concurrent * 1000) / avgTime,
      memoryUsed: (memEnd - memStart) / 1024 / 1024,
      optimizable: avgTime > 10 || maxTime > 50,
    };
  }

  private async benchmarkAudioProcessing() {
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
    log('3. Audio Processing Pipeline Benchmarks', colors.bright);
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);

    const swarm = new AgentSwarm({
      maxConcurrentAgents: 18,
      taskTimeout: 30000,
      retryAttempts: 3,
    });
    await swarm.initialize();

    // Full pipeline: analyze -> detect -> autotune -> enhance
    const iterations = 100;
    const times: number[] = [];
    const memStart = process.memoryUsage().heapUsed;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      const buffer = new Float32Array(1024).fill(0).map((_, j) =>
        0.5 * Math.sin(2 * Math.PI * 440 * j / 48000)
      );

      await swarm.executeTask(AgentRole.AUDIO_ANALYZER, 'analyze_audio', { audioBuffer: buffer });
      await swarm.executeTask(AgentRole.PITCH_DETECTOR, 'detect_pitch', { audioBuffer: buffer });
      await swarm.executeTask(AgentRole.AUTOTUNE_ENGINE, 'apply_correction', { audioBuffer: buffer, targetPitch: 440 });
      await swarm.executeTask(AgentRole.AI_ENHANCER, 'enhance_quality', { audioBuffer: buffer });

      times.push(performance.now() - start);
    }

    const memEnd = process.memoryUsage().heapUsed;
    await swarm.shutdown();

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    const result: BenchmarkResult = {
      name: 'Full audio pipeline',
      avgTime,
      minTime,
      maxTime,
      opsPerSec: 1000 / avgTime,
      memoryUsed: (memEnd - memStart) / 1024 / 1024,
      optimizable: avgTime > 20 || maxTime > 100,
    };

    this.results.push(result);
    this.printResult(result);
    log('');
  }

  private async benchmarkEffects() {
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
    log('4. Effects Processing Benchmarks', colors.bright);
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);

    const effects = [
      { type: EffectType.EQ, name: 'EQ' },
      { type: EffectType.COMPRESSOR, name: 'Compressor' },
      { type: EffectType.LIMITER, name: 'Limiter' },
      { type: EffectType.GATE, name: 'Gate' },
    ];

    for (const { type, name } of effects) {
      const result = await this.benchmarkEffect(type, name);
      this.results.push(result);
      this.printResult(result);
    }

    log('');
  }

  private async benchmarkEffect(type: EffectType, name: string): Promise<BenchmarkResult> {
    const effect = EffectFactory.create(type, `${name}-test`);
    const input = [new Float32Array(256).fill(0.5)];
    const output = [new Float32Array(256)];

    const iterations = 10000;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      effect.process(input, output);
      times.push(performance.now() - start);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    return {
      name: `Effect: ${name}`,
      avgTime,
      minTime,
      maxTime,
      opsPerSec: 1000 / avgTime,
      memoryUsed: 0,
      optimizable: avgTime > 0.1,
    };
  }

  private async benchmarkAutomation() {
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
    log('5. Automation System Benchmarks', colors.bright);
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);

    const mixer = new MixerEngine({
      channels: 8,
      sampleRate: 48000,
      blockSize: 256,
      maxLatency: 10,
      enableMonitoring: true,
      bufferCount: 3,
    });

    await mixer.initialize();

    // Set automation on multiple channels
    for (let i = 1; i <= 8; i++) {
      mixer.setAutomation(`ch${i}`, 'gain', [
        { time: 0, value: 0.0, curve: 'linear' },
        { time: 1, value: 1.0, curve: 'linear' },
        { time: 2, value: 0.5, curve: 'exponential' },
      ]);
    }

    const input: AudioBuffer = {
      samples: Array(8).fill(null).map(() => new Float32Array(256).fill(0.5)),
      channels: 8,
      sampleRate: 48000,
      blockSize: 256,
    };

    const iterations = 1000;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      mixer.processBlock(input);
      times.push(performance.now() - start);
    }

    await mixer.shutdown();

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    const result: BenchmarkResult = {
      name: 'Automation (8 ch)',
      avgTime,
      minTime,
      maxTime,
      opsPerSec: 1000 / avgTime,
      memoryUsed: 0,
      optimizable: avgTime > 0.5,
    };

    this.results.push(result);
    this.printResult(result);
    log('');
  }

  private async benchmarkMemoryUsage() {
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
    log('6. Memory Usage Analysis', colors.bright);
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);

    const baseline = process.memoryUsage();
    log(`  Baseline Memory:`, colors.cyan);
    log(`    Heap Used: ${(baseline.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    log(`    Heap Total: ${(baseline.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    log(`    External: ${(baseline.external / 1024 / 1024).toFixed(2)} MB`);
    log(`    RSS: ${(baseline.rss / 1024 / 1024).toFixed(2)} MB`);

    // Create mixer and process blocks
    const mixer = new MixerEngine({
      channels: 16,
      sampleRate: 48000,
      blockSize: 256,
      maxLatency: 10,
      enableMonitoring: true,
      bufferCount: 3,
    });

    await mixer.initialize();

    const input: AudioBuffer = {
      samples: Array(16).fill(null).map(() => new Float32Array(256).fill(0.5)),
      channels: 16,
      sampleRate: 48000,
      blockSize: 256,
    };

    for (let i = 0; i < 1000; i++) {
      mixer.processBlock(input);
    }

    const afterMixer = process.memoryUsage();
    log(`\n  After Mixer (1000 blocks):`, colors.cyan);
    log(`    Heap Used: ${(afterMixer.heapUsed / 1024 / 1024).toFixed(2)} MB (+${((afterMixer.heapUsed - baseline.heapUsed) / 1024 / 1024).toFixed(2)} MB)`);
    log(`    Heap Total: ${(afterMixer.heapTotal / 1024 / 1024).toFixed(2)} MB`);

    await mixer.shutdown();

    // Create agent swarm
    const swarm = new AgentSwarm({
      maxConcurrentAgents: 18,
      taskTimeout: 30000,
      retryAttempts: 3,
    });
    await swarm.initialize();

    for (let i = 0; i < 100; i++) {
      await swarm.executeTask(AgentRole.AUDIO_ANALYZER, 'analyze_audio', {
        audioBuffer: new Float32Array(256),
      });
    }

    const afterSwarm = process.memoryUsage();
    log(`\n  After Agent Swarm (100 tasks):`, colors.cyan);
    log(`    Heap Used: ${(afterSwarm.heapUsed / 1024 / 1024).toFixed(2)} MB (+${((afterSwarm.heapUsed - afterMixer.heapUsed) / 1024 / 1024).toFixed(2)} MB)`);
    log(`    Heap Total: ${(afterSwarm.heapTotal / 1024 / 1024).toFixed(2)} MB`);

    await swarm.shutdown();
    log('');
  }

  private printResult(result: BenchmarkResult) {
    const status = result.optimizable ? colors.yellow + '⚡ Optimizable' : colors.green + '✓ Optimal';
    log(`  ${result.name.padEnd(30)} | Avg: ${result.avgTime.toFixed(3)}ms | Max: ${result.maxTime.toFixed(3)}ms | ${result.opsPerSec.toFixed(0)} ops/s | ${status}`, colors.reset);
  }

  private async generateReport() {
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
    log('📊 Optimization Opportunities', colors.bright);
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
    log('');

    const optimizable = this.results.filter(r => r.optimizable);

    if (optimizable.length === 0) {
      log('  ✅ All components are already optimized!', colors.green);
    } else {
      log(`  Found ${optimizable.length} components that could be optimized:\n`, colors.yellow);

      optimizable.sort((a, b) => b.avgTime - a.avgTime);

      for (const result of optimizable) {
        log(`  ⚡ ${result.name}`, colors.yellow);
        log(`     Current: ${result.avgTime.toFixed(3)}ms avg, ${result.maxTime.toFixed(3)}ms max`);
        log(`     Potential: ~${(result.avgTime * 0.7).toFixed(3)}ms avg (30% improvement)`);
        log('');
      }
    }

    // Summary
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
    log('📈 Performance Summary', colors.bright);
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
    log('');

    const mixerResults = this.results.filter(r => r.name.startsWith('Mixer'));
    const agentResults = this.results.filter(r => r.name.startsWith('Agent'));
    const effectResults = this.results.filter(r => r.name.startsWith('Effect'));

    if (mixerResults.length > 0) {
      const avgMixer = mixerResults.reduce((sum, r) => sum + r.avgTime, 0) / mixerResults.length;
      log(`  Mixer Average: ${avgMixer.toFixed(3)} ms`, avgMixer < 0.5 ? colors.green : colors.yellow);
    }

    if (agentResults.length > 0) {
      const avgAgent = agentResults.reduce((sum, r) => sum + r.avgTime, 0) / agentResults.length;
      log(`  Agent Average: ${avgAgent.toFixed(3)} ms`, avgAgent < 10 ? colors.green : colors.yellow);
    }

    if (effectResults.length > 0) {
      const avgEffect = effectResults.reduce((sum, r) => sum + r.avgTime, 0) / effectResults.length;
      log(`  Effect Average: ${avgEffect.toFixed(3)} ms`, avgEffect < 0.1 ? colors.green : colors.yellow);
    }

    log('\n  ✅ Benchmark Complete!\n', colors.green);
  }
}

// Run benchmark
const suite = new BenchmarkSuite();
suite.run().catch(console.error);
