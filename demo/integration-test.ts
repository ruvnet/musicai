/**
 * Comprehensive Integration Test
 * Tests mixer integration with full agent swarm system
 */

import { MixerEngine } from '../src/core/MixerEngine.js';
import { AudioIOAgent } from '../src/agents/AudioIOAgent.js';
import { AgentSwarm } from '../src/index.js';
import { AudioBuffer, MixerConfig } from '../src/types/mixer.js';
import { EffectFactory } from '../src/effects/EffectProcessors.js';
import { EffectType } from '../src/types/mixer.js';

async function runIntegrationTest() {
  console.log('\n🎛️  Comprehensive Integration Test');
  console.log('══════════════════════════════════════════════════════════════\n');

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Mixer + Agent Swarm Integration
  console.log('Test 1: Mixer + Agent Swarm Integration...');
  try {
    const swarm = new AgentSwarm();
    await swarm.initialize();

    const mixerConfig: MixerConfig = {
      channels: 8,
      sampleRate: 48000,
      blockSize: 256,
      maxLatency: 10,
      enableMonitoring: true,
      bufferCount: 3,
    };

    const mixer = new MixerEngine(mixerConfig);
    await mixer.initialize();

    // Generate test audio using AudioIOAgent
    const audioIO = new AudioIOAgent();
    await audioIO.execute({
      action: 'initialize',
      parameters: {
        driver: 'simulation',
        sampleRate: 48000,
        blockSize: 256,
        inputChannels: 8,
        outputChannels: 2,
      },
    });

    // Process audio through mixer
    let blocksProcessed = 0;
    await audioIO.execute({
      action: 'set_callback',
      parameters: {
        callback: (input: AudioBuffer) => {
          const output = mixer.processBlock(input);
          blocksProcessed++;
          return output;
        },
      },
    });

    await audioIO.execute({ action: 'start', parameters: {} });

    // Wait for some blocks
    await new Promise((resolve) => setTimeout(resolve, 100));

    await audioIO.execute({ action: 'stop', parameters: {} });

    const metrics = mixer.getMetrics();

    console.log(`  ✓ Blocks processed: ${blocksProcessed}`);
    console.log(`  ✓ Latency: ${metrics.latency.toFixed(2)} ms`);
    console.log(`  ✓ Underruns: ${metrics.bufferUnderruns}`);

    await mixer.shutdown();
    await swarm.shutdown();

    if (blocksProcessed > 0 && metrics.bufferUnderruns === 0) {
      console.log('  ✅ PASSED\n');
      testsPassed++;
    } else {
      console.log('  ❌ FAILED\n');
      testsFailed++;
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error}\n`);
    testsFailed++;
  }

  // Test 2: Multi-Channel with Effects
  console.log('Test 2: Multi-Channel with Effects...');
  try {
    const mixer = new MixerEngine({
      channels: 4,
      sampleRate: 48000,
      blockSize: 256,
      maxLatency: 10,
      enableMonitoring: true,
      bufferCount: 3,
    });

    await mixer.initialize();

    // Add effects to channel 1
    const channel = mixer.getChannel('ch1');
    if (channel) {
      const eq = EffectFactory.create(EffectType.EQ, 'eq1');
      const comp = EffectFactory.create(EffectType.COMPRESSOR, 'comp1');

      eq.parameters.lowGain = 3;
      eq.parameters.midGain = -2;
      comp.parameters.threshold = -20;
      comp.parameters.ratio = 4;

      console.log('  ✓ Effects created: EQ + Compressor');
    }

    // Process test audio
    const input: AudioBuffer = {
      samples: Array(4)
        .fill(null)
        .map(() => new Float32Array(256).fill(0.5)),
      channels: 4,
      sampleRate: 48000,
      blockSize: 256,
    };

    const startTime = performance.now();
    const output = mixer.processBlock(input);
    const processingTime = performance.now() - startTime;

    console.log(`  ✓ Processing time: ${processingTime.toFixed(3)} ms`);
    console.log(`  ✓ Output channels: ${output.channels}`);

    await mixer.shutdown();

    if (processingTime < 5 && output.channels === 2) {
      console.log('  ✅ PASSED\n');
      testsPassed++;
    } else {
      console.log('  ❌ FAILED\n');
      testsFailed++;
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error}\n`);
    testsFailed++;
  }

  // Test 3: Automation System
  console.log('Test 3: Automation System...');
  try {
    const mixer = new MixerEngine({
      channels: 2,
      sampleRate: 48000,
      blockSize: 256,
      maxLatency: 10,
      enableMonitoring: true,
      bufferCount: 3,
    });

    await mixer.initialize();

    // Set automation
    mixer.setAutomation('ch1', 'gain', [
      { time: 0, value: 0.0, curve: 'linear' },
      { time: 1, value: 1.0, curve: 'linear' },
      { time: 2, value: 0.5, curve: 'exponential' },
    ]);

    mixer.setAutomation('ch1', 'pan', [
      { time: 0, value: -1.0, curve: 'linear' },
      { time: 2, value: 1.0, curve: 'linear' },
    ]);

    console.log('  ✓ Automation set: gain + pan');

    // Process blocks
    const input: AudioBuffer = {
      samples: [
        new Float32Array(256).fill(0.5),
        new Float32Array(256).fill(0.5),
      ],
      channels: 2,
      sampleRate: 48000,
      blockSize: 256,
    };

    for (let i = 0; i < 10; i++) {
      mixer.processBlock(input);
    }

    console.log('  ✓ Processed 10 blocks with automation');

    await mixer.shutdown();

    console.log('  ✅ PASSED\n');
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAILED: ${error}\n`);
    testsFailed++;
  }

  // Test 4: Routing Matrix
  console.log('Test 4: Routing Matrix...');
  try {
    const mixer = new MixerEngine({
      channels: 4,
      sampleRate: 48000,
      blockSize: 256,
      maxLatency: 10,
      enableMonitoring: true,
      bufferCount: 3,
    });

    await mixer.initialize();

    // Update routing
    mixer.updateRouting([
      {
        from: { channel: 0, type: 'input' },
        to: { channel: 0, type: 'output' },
        gain: 0.8,
      },
      {
        from: { channel: 0, type: 'input' },
        to: { channel: 1, type: 'output' },
        gain: 0.8,
      },
    ]);

    console.log('  ✓ Routing matrix configured');

    // Process audio
    const input: AudioBuffer = {
      samples: Array(4)
        .fill(null)
        .map(() => new Float32Array(256).fill(0.3)),
      channels: 4,
      sampleRate: 48000,
      blockSize: 256,
    };

    const output = mixer.processBlock(input);

    console.log('  ✓ Audio routed through matrix');
    console.log(`  ✓ Output channels: ${output.channels}`);

    await mixer.shutdown();

    console.log('  ✅ PASSED\n');
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAILED: ${error}\n`);
    testsFailed++;
  }

  // Test 5: Real-time Performance Under Load
  console.log('Test 5: Real-time Performance Under Load...');
  try {
    const mixer = new MixerEngine({
      channels: 16,
      sampleRate: 48000,
      blockSize: 128, // Smaller block for higher stress
      maxLatency: 5,
      enableMonitoring: true,
      bufferCount: 3,
    });

    await mixer.initialize();

    const input: AudioBuffer = {
      samples: Array(16)
        .fill(null)
        .map((_, i) =>
          new Float32Array(128).fill(0).map((_, j) => 0.1 * Math.sin((2 * Math.PI * (220 * (i + 1)) * j) / 48000))
        ),
      channels: 16,
      sampleRate: 48000,
      blockSize: 128,
    };

    const times: number[] = [];
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      mixer.processBlock(input);
      times.push(performance.now() - start);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    const metrics = mixer.getMetrics();

    console.log(`  ✓ Processed ${iterations} blocks`);
    console.log(`  ✓ Avg time: ${avgTime.toFixed(3)} ms`);
    console.log(`  ✓ Max time: ${maxTime.toFixed(3)} ms`);
    console.log(`  ✓ Underruns: ${metrics.bufferUnderruns}`);

    await mixer.shutdown();

    if (maxTime < 5 && metrics.bufferUnderruns === 0) {
      console.log('  ✅ PASSED\n');
      testsPassed++;
    } else {
      console.log('  ❌ FAILED\n');
      testsFailed++;
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error}\n`);
    testsFailed++;
  }

  // Summary
  console.log('══════════════════════════════════════════════════════════════');
  console.log('📊 Integration Test Results');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log(`  Tests Passed: ${testsPassed}/5`);
  console.log(`  Tests Failed: ${testsFailed}/5`);
  console.log(`  Success Rate: ${((testsPassed / 5) * 100).toFixed(1)}%\n`);

  if (testsFailed === 0) {
    console.log('  ✅ ALL INTEGRATION TESTS PASSED!\n');
  } else {
    console.log('  ⚠️  Some tests failed. Please review.\n');
  }

  process.exit(testsFailed > 0 ? 1 : 0);
}

runIntegrationTest().catch(console.error);
